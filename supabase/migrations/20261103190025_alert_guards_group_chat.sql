-- #2 Alertas: notified_at y la colonia no se pueden cambiar desde el cliente.
-- pet_id NO se protege a propósito: borrar una mascota lo pone en null con ON DELETE SET NULL,
-- esa acción dispara este trigger, y bloquearla rompería "Eliminar mascota".
create or replace function public.protect_emergency_alert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare owner_address text;
begin
  -- service role (edge functions): sin restricción
  if auth.uid() is null then return new; end if;

  if tg_op = 'INSERT' then
    select trim(address) into owner_address from public.user_profiles where user_id = new.user_id;
    if coalesce(owner_address, '') = '' then
      raise exception 'Completa tu perfil antes de crear una alerta';
    end if;
    new.last_seen_location := owner_address;
    new.notified_at := null;
  else
    if new.notified_at is distinct from old.notified_at then
      raise exception 'No se puede modificar el aviso de la alerta';
    end if;
    if new.last_seen_location is distinct from old.last_seen_location then
      raise exception 'No se puede cambiar la colonia de la alerta';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.protect_emergency_alert() from public, anon, authenticated;
drop trigger if exists trg_protect_emergency_alert on public.emergency_alerts;
create trigger trg_protect_emergency_alert before insert or update on public.emergency_alerts
for each row execute function public.protect_emergency_alert();

-- #5 Salir de un grupo también saca de su chat
create or replace function public.on_group_member_removed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.conversation_participants cp
  using public.conversations c
  where c.group_id = old.group_id and cp.conversation_id = c.id and cp.user_id = old.user_id;
  return old;
end $$;
revoke execute on function public.on_group_member_removed() from public, anon, authenticated;
drop trigger if exists trg_group_member_removed on public.group_members;
create trigger trg_group_member_removed after delete on public.group_members
for each row execute function public.on_group_member_removed();

-- #5 Exmiembros que hoy siguen en el chat.
delete from public.conversation_participants cp
using public.conversations c
where cp.conversation_id = c.id
  and c.group_id is not null
  and not exists (
    select 1 from public.group_members m where m.group_id = c.group_id and m.user_id = cp.user_id
  );

-- Vecinos con espacios en la dirección: no recibían alertas por comparar con igualdad exacta
create or replace function public.trim_profile_address() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.address := nullif(trim(new.address), '');
  return new;
end $$;
drop trigger if exists trg_trim_profile_address on public.user_profiles;
create trigger trg_trim_profile_address before insert or update of address on public.user_profiles
for each row execute function public.trim_profile_address();

update public.user_profiles set address = address where address <> trim(address);
update public.emergency_alerts set last_seen_location = trim(last_seen_location)
where last_seen_location <> trim(last_seen_location);

-- #1 (aditivo) Perfil público: solo lo que cualquier usuario puede ver.
-- La vista corre con permisos de su dueño a propósito (security_invoker = false):
-- así sigue funcionando cuando la migración B cierre user_profiles.
-- El linter de Supabase la marcará como "security definer view": es esperado.
create or replace view public.public_profiles with (security_invoker = false) as
  select user_id, first_name, last_name, profile_picture_url, city, role, created_at
  from public.user_profiles;
revoke all on public.public_profiles from public, anon;
grant select on public.public_profiles to authenticated;

-- #1 Teléfono del dueño: solo de alertas activas de mi colonia
create or replace function public.get_alert_contacts(p_alert_ids uuid[])
returns table (alert_id uuid, owner_name text, owner_phone text)
language sql stable security definer set search_path = '' as $$
  select a.id,
         trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')),
         p.phone
  from public.emergency_alerts a
  join public.user_profiles p on p.user_id = a.user_id
  join public.user_profiles me on me.user_id = auth.uid()
  where a.id = any(p_alert_ids)
    and a.status = 'active'
    and lower(trim(a.last_seen_location)) = lower(trim(me.address));
$$;
revoke execute on function public.get_alert_contacts(uuid[]) from public, anon;
grant execute on function public.get_alert_contacts(uuid[]) to authenticated;

-- #1 Teléfono de quien encontró: solo para el dueño de la alerta
create or replace function public.get_finder_contacts()
returns table (found_id uuid, finder_name text, finder_phone text)
language sql stable security definer set search_path = '' as $$
  select f.id,
         trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')),
         p.phone
  from public.found_pets f
  join public.user_profiles p on p.user_id = f.user_id
  where f.alert_owner_id = auth.uid();
$$;
revoke execute on function public.get_finder_contacts() from public, anon;
grant execute on function public.get_finder_contacts() to authenticated;

-- #6 (aditivo) "Eliminar chat" pasa a ser "vaciar para mí": se conserva el participante,
-- así el otro no escribe al vacío y el bloqueo sigue aplicando.
alter table public.conversation_participants add column if not exists cleared_at timestamptz;

create or replace function public.clear_conversation(p_conversation_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_participant(p_conversation_id, auth.uid()) then
    raise exception 'No autorizado';
  end if;
  update public.conversation_participants set cleared_at = now()
  where conversation_id = p_conversation_id and user_id = auth.uid();
  -- Lo vaciado no debe seguir contando como no leído
  update public.messages set read_at = now()
  where conversation_id = p_conversation_id and sender_id <> auth.uid() and read_at is null;
end $$;
revoke execute on function public.clear_conversation(uuid) from public, anon;
grant execute on function public.clear_conversation(uuid) to authenticated;
