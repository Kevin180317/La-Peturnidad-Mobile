-- Aplicada el 2026-11-07 (private_profiles_and_suggestions). La función suggested_users de aquí
-- fue reemplazada por la versión de 20261107000002_privacy_fixes.sql.
alter table public.user_profiles add column is_private boolean not null default false;

create or replace function public.can_view_user(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select target = (select auth.uid())
    or not coalesce((select is_private from user_profiles where user_id = target), false)
    or exists (select 1 from follows where follower_id = (select auth.uid()) and following_id = target)
    or is_moderator_or_admin();
$$;
revoke all on function public.can_view_user(uuid) from public, anon;
grant execute on function public.can_view_user(uuid) to authenticated;

-- Perfil privado: sus publicaciones y mascotas solo las ven el dueño, sus seguidores y moderación
drop policy "Anyone can view posts" on public.posts;
create policy "View posts of visible users" on public.posts for select to authenticated using (public.can_view_user(user_id));
drop policy "Authenticated users can view all pets" on public.pets;
create policy "View pets of visible users" on public.pets for select to authenticated using (public.can_view_user(user_id));

create or replace view public.public_profiles as
  select user_id, first_name, last_name, profile_picture_url, city, role, created_at, is_private
  from public.user_profiles;
