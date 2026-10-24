-- Mensajería, bloqueos, push anti-spam y moderación (auditoría 2026-10-24)

-- 1) Bloqueos: blocks solo es visible para el bloqueador, así que las comprobaciones van en SECURITY DEFINER
create or replace function public.is_blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;
revoke execute on function public.is_blocked_between(uuid, uuid) from public, anon;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;

-- ¿Hay bloqueo entre uid y el otro participante de un chat 1:1?
create or replace function public.is_blocked_in_conversation(conv_id uuid, uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.conversations c
    join public.conversation_participants cp on cp.conversation_id = c.id and cp.user_id <> uid
    where c.id = conv_id and c.group_id is null and public.is_blocked_between(uid, cp.user_id)
  );
$$;
revoke execute on function public.is_blocked_in_conversation(uuid, uuid) from public, anon;
grant execute on function public.is_blocked_in_conversation(uuid, uuid) to authenticated;

alter policy msg_insert on public.messages to authenticated
  with check (
    (select auth.uid()) = sender_id
    and public.is_participant(conversation_id, (select auth.uid()))
    and not public.is_blocked_in_conversation(conversation_id, (select auth.uid()))
  );

-- 2) Mensajes: fecha del servidor y updated_at del chat por trigger (el cliente ya no actualiza conversations)
create or replace function public.on_message_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.created_at := now();
  new.read_at := null;
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end $$;
revoke execute on function public.on_message_insert() from public, anon, authenticated;
drop trigger if exists trg_on_message_insert on public.messages;
create trigger trg_on_message_insert before insert on public.messages
for each row execute function public.on_message_insert();
drop policy if exists conv_update on public.conversations;

-- 3) DM único por pareja, sin bloqueos y sin carreras por doble toque
create or replace function public.create_conversation(user1_id uuid, user2_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare conv_id uuid;
begin
  if auth.uid() is null or auth.uid() not in (user1_id, user2_id) or user1_id = user2_id then
    raise exception 'No autorizado';
  end if;
  if public.is_blocked_between(user1_id, user2_id) then
    raise exception 'No puedes enviar mensajes a este usuario';
  end if;
  perform pg_advisory_xact_lock(hashtext(least(user1_id, user2_id)::text || greatest(user1_id, user2_id)::text));
  select c.id into conv_id
  from public.conversations c
  join public.conversation_participants a on a.conversation_id = c.id and a.user_id = user1_id
  join public.conversation_participants b on b.conversation_id = c.id and b.user_id = user2_id
  where c.group_id is null
  order by c.created_at
  limit 1;
  if conv_id is null then
    insert into public.conversations default values returning id into conv_id;
    insert into public.conversation_participants (conversation_id, user_id) values (conv_id, user1_id), (conv_id, user2_id);
  end if;
  return conv_id;
end $$;
revoke execute on function public.create_conversation(uuid, uuid) from public, anon;
grant execute on function public.create_conversation(uuid, uuid) to authenticated;

-- 4) Chat de grupo: uno por grupo; quien se une después entra al existente
create temp table _group_conv_dups as
select id, keep_id from (
  select id, first_value(id) over (partition by group_id order by created_at, id) keep_id
  from public.conversations where group_id is not null
) r where id <> keep_id;

alter table public.messages disable trigger trg_protect_message_columns;
update public.messages m set conversation_id = d.keep_id from _group_conv_dups d where m.conversation_id = d.id;
alter table public.messages enable trigger trg_protect_message_columns;
insert into public.conversation_participants (conversation_id, user_id)
select distinct d.keep_id, cp.user_id
from _group_conv_dups d join public.conversation_participants cp on cp.conversation_id = d.id
where not exists (select 1 from public.conversation_participants x where x.conversation_id = d.keep_id and x.user_id = cp.user_id);
delete from public.conversations c using _group_conv_dups d where c.id = d.id;
drop table _group_conv_dups;

create unique index if not exists uq_conversation_per_group on public.conversations(group_id) where group_id is not null;

create or replace function public.join_group_conversation(group_id_param uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare conv_id uuid;
begin
  if auth.uid() is null or not exists (select 1 from public.group_members where group_id = group_id_param and user_id = auth.uid()) then
    raise exception 'Únete al grupo para usar el chat';
  end if;
  perform pg_advisory_xact_lock(hashtext(group_id_param::text));
  select id into conv_id from public.conversations where group_id = group_id_param;
  if conv_id is null then
    insert into public.conversations (group_id) values (group_id_param) returning id into conv_id;
  end if;
  insert into public.conversation_participants (conversation_id, user_id)
  select conv_id, auth.uid()
  where not exists (select 1 from public.conversation_participants where conversation_id = conv_id and user_id = auth.uid());
  return conv_id;
end $$;
revoke execute on function public.join_group_conversation(uuid) from public, anon;
grant execute on function public.join_group_conversation(uuid) to authenticated;

-- 5) "Lo encontré": los datos del aviso salen de la alerta, no del cliente (evita push con texto/imagen arbitrarios)
create or replace function public.fill_found_pet_from_alert() returns trigger
language plpgsql set search_path = '' as $$
declare a record;
begin
  if new.alert_id is null then raise exception 'El reporte debe estar asociado a una alerta'; end if;
  select user_id, pet_id, pet_name, image_url, status into a from public.emergency_alerts where id = new.alert_id;
  if not found or a.status <> 'active' then raise exception 'La alerta ya no está activa'; end if;
  if a.user_id = new.user_id then raise exception 'No puedes reportar tu propia mascota'; end if;
  new.alert_owner_id := a.user_id;
  new.pet_id := a.pet_id;
  new.pet_name := a.pet_name;
  new.image_url := a.image_url;
  return new;
end $$;
drop trigger if exists trg_fill_found_pet on public.found_pets;
create trigger trg_fill_found_pet before insert on public.found_pets
for each row execute function public.fill_found_pet_from_alert();

-- 6) Una alerta dispara push una sola vez: la edge function reclama notified_at de forma atómica
alter table public.emergency_alerts add column if not exists notified_at timestamptz;
update public.emergency_alerts set notified_at = coalesce(created_at, now()) where notified_at is null;

alter table public.found_pets add column if not exists notified_at timestamptz;
update public.found_pets set notified_at = coalesce(created_at, now()) where notified_at is null;

-- Tokens push: varios dispositivos por usuario y un token pertenece a un solo usuario
-- (antes PK = user_id: el 2º teléfono pisaba al 1º, y un teléfono compartido recibía avisos de otra cuenta)
alter table public.device_tokens drop constraint device_tokens_pkey;
delete from public.device_tokens a using public.device_tokens b
  where a.token = b.token and a.updated_at < b.updated_at;
alter table public.device_tokens add primary key (token);
create index if not exists idx_device_tokens_user on public.device_tokens(user_id);

create or replace function public.register_device_token(p_token text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or coalesce(trim(p_token), '') = '' then raise exception 'No autorizado'; end if;
  insert into public.device_tokens (token, user_id, updated_at) values (p_token, auth.uid(), now())
  on conflict (token) do update set user_id = excluded.user_id, updated_at = now();
end $$;
revoke execute on function public.register_device_token(text) from public, anon;
grant execute on function public.register_device_token(text) to authenticated;

-- 7) Moderadores pueden retirar contenido reportado
create policy "Moderators can delete posts" on public.posts for delete to authenticated using (public.is_moderator_or_admin());
create policy "Moderators can delete comments" on public.comments for delete to authenticated using (public.is_moderator_or_admin());
create policy "Moderators can delete announcements" on public.announcements for delete to authenticated using (public.is_moderator_or_admin());
create policy "Moderators can delete success stories" on public.success_stories for delete to authenticated using (public.is_moderator_or_admin());

-- 8) Realtime para el chat (respeta RLS de messages)
alter publication supabase_realtime add table public.messages;
