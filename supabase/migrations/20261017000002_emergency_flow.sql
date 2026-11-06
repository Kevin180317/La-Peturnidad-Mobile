-- Flujo de emergencias: alertas con pet_id/estado y reportes de "lo encontré" dirigidos al dueño

alter table public.emergency_alerts
  add column if not exists pet_id uuid references public.pets(id) on delete set null,
  add column if not exists status text not null default 'active' check (status in ('active','resolved')),
  add column if not exists resolved_at timestamptz;

update public.emergency_alerts a set pet_id = p.id
from public.pets p
where a.pet_id is null and p.user_id = a.user_id and p.name = a.pet_name;

-- Duplicados históricos: queda activa solo la más reciente por mascota
update public.emergency_alerts a set status = 'resolved', resolved_at = now()
where a.pet_id is not null and exists (
  select 1 from public.emergency_alerts b
  where b.pet_id = a.pet_id and b.created_at > a.created_at
);

create unique index if not exists uq_active_alert_per_pet on public.emergency_alerts(pet_id)
  where status = 'active' and pet_id is not null;
create index if not exists idx_alerts_user on public.emergency_alerts(user_id);
create index if not exists idx_alerts_status_location on public.emergency_alerts(status, last_seen_location);

alter table public.found_pets
  alter column pet_id drop not null,
  add column if not exists alert_id uuid references public.emergency_alerts(id) on delete set null,
  add column if not exists alert_owner_id uuid references auth.users(id) on delete cascade,
  add column if not exists pet_name text,
  add column if not exists image_url text,
  add column if not exists note text;

create unique index if not exists uq_found_per_user_alert on public.found_pets(user_id, alert_id) where alert_id is not null;
create index if not exists idx_found_alert on public.found_pets(alert_id);
create index if not exists idx_found_alert_owner on public.found_pets(alert_owner_id);

drop policy if exists "Users can view found pets for their pets or their own reports" on public.found_pets;
drop policy if exists "Users can insert their own found pets" on public.found_pets;
create policy "Finder or alert owner can view" on public.found_pets for select to authenticated
using ((select auth.uid()) = user_id or (select auth.uid()) = alert_owner_id);
create policy "Finder can report" on public.found_pets for insert to authenticated
with check ((select auth.uid()) = user_id and (alert_owner_id is null or alert_owner_id <> (select auth.uid())));

-- Reescribe políticas restantes para evaluar auth.uid() una sola vez por consulta
do $$
declare r record; q text; w text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check from pg_policies
    where schemaname = 'public'
      and (coalesce(qual,'') ~ 'auth\.(uid|role)\(\)' or coalesce(with_check,'') ~ 'auth\.(uid|role)\(\)')
      and coalesce(qual,'') !~ 'SELECT auth\.' and coalesce(with_check,'') !~ 'SELECT auth\.'
  loop
    q := replace(replace(r.qual, 'auth.uid()', '(select auth.uid())'), 'auth.role()', '(select auth.role())');
    w := replace(replace(r.with_check, 'auth.uid()', '(select auth.uid())'), 'auth.role()', '(select auth.role())');
    if q is not null and w is not null then
      execute format('alter policy %I on %I.%I using (%s) with check (%s)', r.policyname, r.schemaname, r.tablename, q, w);
    elsif q is not null then
      execute format('alter policy %I on %I.%I using (%s)', r.policyname, r.schemaname, r.tablename, q);
    elsif w is not null then
      execute format('alter policy %I on %I.%I with check (%s)', r.policyname, r.schemaname, r.tablename, w);
    end if;
  end loop;
end $$;
