-- Endurecimiento previo al lanzamiento (auditoría 2026-10-24)

-- 1) UPDATE sin WITH CHECK: el dueño podía reasignar la fila a otro user_id
alter policy "Users can update their own announcements" on public.announcements to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "Users can update their own alerts" on public.emergency_alerts to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "Users can update their own pets" on public.pets to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "Users can update their own posts" on public.posts to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "Users can update their own profile" on public.user_profiles to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "Users can update their own notification preferences" on public.notification_preferences to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "Users can update own notifications" on public.notifications to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "own tokens update" on public.device_tokens to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 2) Grupos: auth.role() está deprecado y no fijaba created_by
drop policy "Authenticated users can create groups" on public.groups;
create policy "Authenticated users can create groups" on public.groups for insert to authenticated
  with check ((select auth.uid()) = created_by);
alter policy "Group admins can update their groups" on public.groups to authenticated
  using (
    (select auth.uid()) = created_by
    or exists (select 1 from public.group_members gm where gm.group_id = groups.id and gm.user_id = (select auth.uid()) and gm.role = 'admin')
  )
  with check (
    (select auth.uid()) = created_by
    or exists (select 1 from public.group_members gm where gm.group_id = groups.id and gm.user_id = (select auth.uid()) and gm.role = 'admin')
  );

-- 3) Mensajes: solo participantes pueden escribir en una conversación
alter policy msg_insert on public.messages to authenticated
  with check ((select auth.uid()) = sender_id and public.is_participant(conversation_id, (select auth.uid())));
alter policy msg_select on public.messages to authenticated;
alter policy msg_update on public.messages to authenticated
  using (public.is_participant(conversation_id, (select auth.uid())))
  with check (public.is_participant(conversation_id, (select auth.uid())));
alter policy msg_delete on public.messages to authenticated;
alter policy conv_select on public.conversations to authenticated;
alter policy conv_update on public.conversations to authenticated
  using (public.is_participant(id, (select auth.uid())))
  with check (public.is_participant(id, (select auth.uid())));
alter policy cp_select on public.conversation_participants to authenticated;
alter policy cp_delete on public.conversation_participants to authenticated;

-- 4) Reports: una sola política SELECT (multiple_permissive_policies) y solo autenticados
drop policy "Users can view their own reports" on public.reports;
drop policy "Moderators can view all reports" on public.reports;
create policy "Reporter or moderator can view reports" on public.reports for select to authenticated
  using ((select auth.uid()) = reporter_id or public.is_moderator_or_admin());
alter policy "Moderators can update reports" on public.reports to authenticated
  using (public.is_moderator_or_admin()) with check (public.is_moderator_or_admin());
alter policy "Users can create reports" on public.reports to authenticated;

-- 5) Funciones SECURITY DEFINER: fuera del alcance de anon
revoke execute on function public.is_participant(uuid, uuid) from public, anon;
revoke execute on function public.is_moderator_or_admin() from public, anon;
grant execute on function public.is_participant(uuid, uuid) to authenticated;
grant execute on function public.is_moderator_or_admin() to authenticated;

-- delete_group: con auth.uid() nulo, `creator_id <> auth.uid()` es NULL y no lanzaba excepción
create or replace function public.delete_group(group_id_param uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare creator_id uuid;
begin
  select created_by into creator_id from public.groups where id = group_id_param;
  if not found then raise exception 'Group not found'; end if;
  if auth.uid() is null or creator_id is distinct from auth.uid() then
    raise exception 'Only the creator can delete this group';
  end if;
  delete from public.conversations where group_id = group_id_param;
  delete from public.groups where id = group_id_param;
end $$;
revoke execute on function public.delete_group(uuid) from public, anon;
grant execute on function public.delete_group(uuid) to authenticated;

-- 6) Storage: UPDATE solo en buckets de la app y sin poder mover el archivo a otro dueño
alter policy "Own UPDATE" on storage.objects to authenticated
  using ((select auth.uid()) = owner and bucket_id in ('pet-images','profile-pictures','posts'))
  with check ((select auth.uid()) = owner and bucket_id in ('pet-images','profile-pictures','posts'));
