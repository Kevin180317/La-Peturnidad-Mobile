-- Descartar sugerencias: el usuario descartado no vuelve a aparecer en "Sugeridos para ti"
create table public.dismissed_suggestions (
  user_id uuid not null references auth.users(id) on delete cascade,
  dismissed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, dismissed_id)
);
alter table public.dismissed_suggestions enable row level security;
create policy "Own dismissed suggestions" on public.dismissed_suggestions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.suggested_users(limit_n int default 20)
returns table (user_id uuid, first_name text, last_name text, profile_picture_url text, city text,
               is_private boolean, score numeric, reason text)
language sql stable security definer set search_path = public as $$
  with me as (select auth.uid() as id),
  mine as (select p.* from user_profiles p, me where p.user_id = me.id),
  scored as (
    select c.user_id, c.first_name, c.last_name, c.profile_picture_url, c.city, c.is_private,
      (select count(*) from follows a join follows b on b.follower_id = a.following_id
        where a.follower_id = me.id and b.following_id = c.user_id) as mutual,
      exists (select 1 from follows f where f.follower_id = c.user_id and f.following_id = me.id) as follows_me,
      coalesce(not c.is_private and c.postal_code = (select postal_code from mine), false) as same_cp,
      coalesce(lower(trim(c.city)) = lower(trim((select city from mine))), false) as same_city,
      (select count(*) from group_members g1 join group_members g2 on g2.group_id = g1.group_id
        where g1.user_id = me.id and g2.user_id = c.user_id) as groups,
      (not c.is_private and exists (select 1 from pets p1 join pets p2 on p2.type = p1.type
        where p1.user_id = me.id and p2.user_id = c.user_id)) as same_pet,
      (select count(*) from follows f where f.following_id = c.user_id) as followers
    from user_profiles c, me
    where c.user_id <> me.id
      and not exists (select 1 from follows f where f.follower_id = me.id and f.following_id = c.user_id)
      and not exists (select 1 from follow_requests r where r.requester_id = me.id and r.target_id = c.user_id)
      and not exists (select 1 from dismissed_suggestions d where d.user_id = me.id and d.dismissed_id = c.user_id)
      and not exists (select 1 from blocks b where (b.blocker_id = me.id and b.blocked_id = c.user_id)
                                                or (b.blocker_id = c.user_id and b.blocked_id = me.id))
  )
  select s.user_id, s.first_name::text, s.last_name::text, s.profile_picture_url, s.city::text, s.is_private,
    round((least(s.mutual, 5) * 3 + s.follows_me::int * 2 + s.same_cp::int * 2 + s.same_city::int
           + least(s.groups, 2) * 2 + s.same_pet::int + ln(1 + s.followers) * 0.5)::numeric, 2) as score,
    case when s.mutual = 1 then '1 contacto en común'
         when s.mutual > 1 then s.mutual || ' contactos en común'
         when s.follows_me then 'Te sigue'
         when s.same_cp then 'Vive en tu colonia'
         when s.groups > 0 then 'Comparten grupo'
         when s.same_city then 'Vive en tu ciudad'
         when s.same_pet then 'Tiene mascota como la tuya'
         else 'Popular en la comunidad' end as reason
  from scored s
  order by score desc, s.followers desc, s.user_id
  limit least(greatest(limit_n, 1), 50);
$$;
revoke all on function public.suggested_users(int) from public, anon;
grant execute on function public.suggested_users(int) to authenticated;
