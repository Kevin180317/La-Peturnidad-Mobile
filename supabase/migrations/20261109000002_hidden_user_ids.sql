-- Contenido oculto en ambos sentidos entre dos personas con un bloqueo.
-- `blocks` solo es visible para quien bloquea (RLS), así que quien fue bloqueado no puede saber a
-- quién ocultar. Esta función devuelve la UNIÓN (a quién bloqueé + quién me bloqueó) sin decir en
-- qué sentido es cada uno, para no revelar quién bloqueó a quién.
create or replace function public.get_hidden_user_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select blocked_id from public.blocks where blocker_id = (select auth.uid())
  union
  select blocker_id from public.blocks where blocked_id = (select auth.uid());
$$;

revoke execute on function public.get_hidden_user_ids() from public, anon;
grant execute on function public.get_hidden_user_ids() to authenticated;
