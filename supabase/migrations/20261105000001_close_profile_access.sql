-- Migración B: cierra el acceso a user_profiles y los chats.
-- Requiere el build que lee perfiles ajenos desde public_profiles y contactos por RPC.

-- #1 Cada quien lee su fila; moderadores leen todas
drop policy "Authenticated can view profiles" on public.user_profiles;
create policy "Owner or moderator can view profile" on public.user_profiles for select to authenticated
  using ((select auth.uid()) = user_id or public.is_moderator_or_admin());

-- #6 Ya nadie sale de un chat borrando su fila (se usa clear_conversation)
drop policy cp_delete on public.conversation_participants;

-- #6 Reparar chats 1:1 donde alguien ya salió: vuelve como participante, con el chat vaciado.
insert into public.conversation_participants (conversation_id, user_id, cleared_at)
select distinct m.conversation_id, m.sender_id, now()
from public.messages m
join public.conversations c on c.id = m.conversation_id and c.group_id is null
where not exists (
  select 1 from public.conversation_participants cp
  where cp.conversation_id = m.conversation_id and cp.user_id = m.sender_id
);

-- Borrar chats sin participantes ni mensajes
delete from public.conversations c
where not exists (select 1 from public.conversation_participants p where p.conversation_id = c.id)
  and not exists (select 1 from public.messages m where m.conversation_id = c.id);

-- Reversión (manual):
--   drop policy "Owner or moderator can view profile" on public.user_profiles;
--   create policy "Authenticated can view profiles" on public.user_profiles for select to authenticated using (true);
