-- Endurecimiento de seguridad (auditoría 2026-10-17)

-- 1) Tokens de push fuera de user_profiles (legibles solo por su dueño y por service role)
create table if not exists public.device_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token text not null,
  updated_at timestamptz not null default now()
);
alter table public.device_tokens enable row level security;
create policy "own tokens select" on public.device_tokens for select to authenticated using ((select auth.uid()) = user_id);
create policy "own tokens insert" on public.device_tokens for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own tokens update" on public.device_tokens for update to authenticated using ((select auth.uid()) = user_id);
create policy "own tokens delete" on public.device_tokens for delete to authenticated using ((select auth.uid()) = user_id);

insert into public.device_tokens (user_id, token)
select user_id, coalesce(nullif(fcm_token,''), nullif(push_token,''))
from public.user_profiles
where coalesce(nullif(fcm_token,''), nullif(push_token,'')) is not null
on conflict (user_id) do nothing;

alter table public.user_profiles drop column fcm_token, drop column push_token;

-- 2) Perfiles: solo usuarios autenticados
drop policy "Anyone can view profiles" on public.user_profiles;
create policy "Authenticated can view profiles" on public.user_profiles for select to authenticated using (true);

-- 3) Nadie se asigna rol: solo un admin puede cambiarlo
create or replace function public.protect_profile_role() returns trigger
language plpgsql security definer set search_path = '' as $$
declare caller_is_admin boolean;
begin
  if auth.uid() is null then return new; end if; -- service role / dashboard
  select exists (select 1 from public.user_profiles where user_id = auth.uid() and role = 'admin') into caller_is_admin;
  if tg_op = 'INSERT' then
    if new.role <> 'user' and not caller_is_admin then new.role := 'user'; end if;
  else
    if new.user_id is distinct from old.user_id then raise exception 'No puedes cambiar user_id'; end if;
    if new.role is distinct from old.role and not caller_is_admin then
      raise exception 'No tienes permiso para cambiar el rol';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;
create trigger trg_protect_profile_role before insert or update on public.user_profiles
for each row execute function public.protect_profile_role();

-- 4) Mensajes: solo read_at es modificable
create or replace function public.protect_message_columns() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.content is distinct from old.content or new.sender_id is distinct from old.sender_id
     or new.conversation_id is distinct from old.conversation_id or new.created_at is distinct from old.created_at then
    raise exception 'Solo se puede marcar el mensaje como leído';
  end if;
  return new;
end $$;
create trigger trg_protect_message_columns before update on public.messages
for each row execute function public.protect_message_columns();

-- 5) RPC con validación de quien llama
create or replace function public.create_conversation(user1_id uuid, user2_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare conv_id uuid;
begin
  if auth.uid() is null or auth.uid() not in (user1_id, user2_id) or user1_id = user2_id then
    raise exception 'No autorizado';
  end if;
  insert into public.conversations default values returning id into conv_id;
  insert into public.conversation_participants (conversation_id, user_id) values (conv_id, user1_id), (conv_id, user2_id);
  return conv_id;
end $$;

create or replace function public.create_group_conversation(group_id_param uuid, member_ids uuid[]) returns uuid
language plpgsql security definer set search_path = '' as $$
declare conv_id uuid; uid uuid;
begin
  if auth.uid() is null or not exists (select 1 from public.group_members where group_id = group_id_param and user_id = auth.uid()) then
    raise exception 'No autorizado';
  end if;
  insert into public.conversations (group_id) values (group_id_param) returning id into conv_id;
  foreach uid in array (member_ids || auth.uid()) loop
    if exists (select 1 from public.group_members where group_id = group_id_param and user_id = uid)
       and not exists (select 1 from public.conversation_participants where conversation_id = conv_id and user_id = uid) then
      insert into public.conversation_participants (conversation_id, user_id) values (conv_id, uid);
    end if;
  end loop;
  return conv_id;
end $$;

revoke execute on function public.create_conversation(uuid, uuid) from public, anon;
revoke execute on function public.create_group_conversation(uuid, uuid[]) from public, anon;
revoke execute on function public.delete_group(uuid) from public, anon;
grant execute on function public.create_conversation(uuid, uuid) to authenticated;
grant execute on function public.create_group_conversation(uuid, uuid[]) to authenticated;
grant execute on function public.delete_group(uuid) to authenticated;

create or replace function public.is_moderator_or_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_profiles where user_id = auth.uid() and role in ('moderator','admin'));
$$;

-- Inserción directa de conversaciones/participantes ya no se usa (solo vía RPC)
drop policy if exists cp_insert on public.conversation_participants;
drop policy if exists conv_insert on public.conversations;

-- 6) Grupos
drop policy "Users can join groups" on public.group_members;
create policy "Users can join groups" on public.group_members for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and (role = 'member' or exists (select 1 from public.groups g where g.id = group_id and g.created_by = (select auth.uid())))
);
drop policy "Group admins can update their groups" on public.groups;
create policy "Group admins can update their groups" on public.groups for update to authenticated
using (
  (select auth.uid()) = created_by
  or exists (select 1 from public.group_members gm where gm.group_id = groups.id and gm.user_id = (select auth.uid()) and gm.role = 'admin')
);

-- 7) Pets: política duplicada
drop policy if exists "Users can view their own pets" on public.pets;

-- 8) Storage: un solo INSERT por bucket, con carpeta = uid del usuario
drop policy if exists "Auth INSERT pet-images" on storage.objects;
drop policy if exists "Auth INSERT profile-pictures" on storage.objects;
drop policy if exists "Auth Upload profile-pictures" on storage.objects;
drop policy if exists "Authenticated users can upload to pet-images" on storage.objects;
drop policy if exists "Authenticated users can upload to profile-pictures" on storage.objects;
drop policy if exists "Authenticated users can upload to public" on storage.objects;
drop policy if exists "Auth Upload posts 1rma4z_0" on storage.objects;
drop policy if exists " Authenticated users can upload to posts 1rma4z_0" on storage.objects;
drop policy if exists "Auth INSERT posts 1rma4z_0" on storage.objects;
drop policy if exists "Auth Upload pet-images" on storage.objects;
drop policy if exists "Auth INSERT public" on storage.objects;
drop policy if exists "Users can delete their own files" on storage.objects;
drop policy if exists "Users can update their own files" on storage.objects;
create policy "Upload own folder" on storage.objects for insert to authenticated
with check (bucket_id in ('pet-images','profile-pictures','posts') and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 9) Índices en claves foráneas
create index if not exists idx_announcements_user on public.announcements(user_id);
create index if not exists idx_blocks_blocked on public.blocks(blocked_id);
create index if not exists idx_blocks_blocker on public.blocks(blocker_id);
create index if not exists idx_comments_parent on public.comments(parent_id);
create index if not exists idx_conversations_group on public.conversations(group_id);
create index if not exists idx_groups_created_by on public.groups(created_by);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_reports_reporter on public.reports(reporter_id);
create index if not exists idx_reports_reviewed_by on public.reports(reviewed_by);
create index if not exists idx_reports_target on public.reports(target_user_id);
create index if not exists idx_success_stories_user on public.success_stories(user_id);
