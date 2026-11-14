-- Solicitudes de seguimiento para perfiles privados.
-- Seguir a un perfil privado ya no se puede con un INSERT directo: se crea una solicitud (request_follow)
-- y el dueño la acepta o rechaza (respond_follow_request).
create table public.follow_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (requester_id, target_id),
  check (requester_id <> target_id)
);
create index follow_requests_target_idx on public.follow_requests (target_id);
alter table public.follow_requests enable row level security;
create policy "View own follow requests" on public.follow_requests for select to authenticated
  using ((select auth.uid()) in (requester_id, target_id));
-- El solicitante puede cancelar; crear y aceptar/rechazar solo por RPC
create policy "Requester can cancel" on public.follow_requests for delete to authenticated
  using ((select auth.uid()) = requester_id);

-- user_profiles solo lo lee el dueño: el chequeo de privacidad corre como definer
create or replace function public.is_private_user(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_private from user_profiles where user_id = target), false);
$$;
revoke all on function public.is_private_user(uuid) from public, anon;
grant execute on function public.is_private_user(uuid) to authenticated;

drop policy "Users can follow" on public.follows;
create policy "Users can follow" on public.follows for insert to authenticated
  with check ((select auth.uid()) = follower_id and not public.is_private_user(following_id));

create or replace function public.request_follow(target uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); who text;
begin
  if me is null or me = target then raise exception 'Solicitud inválida'; end if;
  if exists (select 1 from blocks where (blocker_id = me and blocked_id = target) or (blocker_id = target and blocked_id = me)) then
    raise exception 'No puedes seguir a este usuario';
  end if;
  if exists (select 1 from follows where follower_id = me and following_id = target) then return; end if;
  if not public.is_private_user(target) then
    insert into follows (follower_id, following_id) values (me, target) on conflict do nothing;
    return;
  end if;
  insert into follow_requests (requester_id, target_id) values (me, target) on conflict do nothing;
  if found then
    select trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')) into who from user_profiles where user_id = me;
    insert into notifications (user_id, title, body, data)
    values (target, 'Solicitud de seguimiento', coalesce(nullif(who, ''), 'Alguien') || ' quiere seguirte', jsonb_build_object('url', '/solicitudes'));
  end if;
end $$;
revoke all on function public.request_follow(uuid) from public, anon;
grant execute on function public.request_follow(uuid) to authenticated;

create or replace function public.respond_follow_request(request_id uuid, accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare r follow_requests; who text;
begin
  select * into r from follow_requests where id = request_id and target_id = auth.uid();
  if not found then raise exception 'Solicitud no encontrada'; end if;
  delete from follow_requests where id = r.id;
  if accept then
    insert into follows (follower_id, following_id) values (r.requester_id, r.target_id) on conflict do nothing;
    select trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')) into who from user_profiles where user_id = r.target_id;
    insert into notifications (user_id, title, body, data)
    values (r.requester_id, 'Solicitud aceptada', coalesce(nullif(who, ''), 'Un usuario') || ' aceptó tu solicitud', jsonb_build_object('url', '/perfil/' || r.target_id));
  end if;
end $$;
revoke all on function public.respond_follow_request(uuid, boolean) from public, anon;
grant execute on function public.respond_follow_request(uuid, boolean) to authenticated;
