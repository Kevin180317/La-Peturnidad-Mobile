-- Límites de creación por usuario (anti-spam). Se aplican en la base: el cliente no puede saltarlos.
--
-- Uso: create trigger ... before insert on <tabla> for each row
--   execute function public.enforce_rate_limit('<columna del autor>', <máximo>, '<ventana>', '<mensaje>');
--
-- shortcut: el conteo no es atómico; dos inserts simultáneos pueden pasar el límite por 1. Aceptable para anti-spam.

create or replace function public.enforce_rate_limit() returns trigger
language plpgsql set search_path = '' as $$
declare
  author_col text := tg_argv[0];
  max_rows int := tg_argv[1]::int;
  win interval := tg_argv[2]::interval;
  author uuid;
  recent int;
begin
  -- service role / dashboard: sin límite
  if auth.uid() is null then return new; end if;

  -- la fecha la pone el servidor: un cliente no puede "antedatar" filas para esquivar el conteo
  new.created_at := now();

  author := (to_jsonb(new) ->> author_col)::uuid;
  execute format(
    'select count(*) from %I.%I where %I = $1 and created_at > now() - $2',
    tg_table_schema, tg_table_name, author_col
  ) into recent using author, win;

  if recent >= max_rows then
    raise exception '%', tg_argv[3] using errcode = 'P0001', hint = 'rate_limit';
  end if;
  return new;
end $$;
revoke execute on function public.enforce_rate_limit() from public, anon, authenticated;

create trigger trg_rate_limit before insert on public.posts
  for each row execute function public.enforce_rate_limit('user_id', '10', '1 hour', 'Publicaste demasiado rápido. Intenta de nuevo en unos minutos.');
create trigger trg_rate_limit before insert on public.comments
  for each row execute function public.enforce_rate_limit('user_id', '30', '1 hour', 'Comentaste demasiado rápido. Intenta de nuevo en unos minutos.');
create trigger trg_rate_limit before insert on public.messages
  for each row execute function public.enforce_rate_limit('sender_id', '30', '1 minute', 'Estás enviando mensajes demasiado rápido. Espera un momento.');
create trigger trg_rate_limit before insert on public.announcements
  for each row execute function public.enforce_rate_limit('user_id', '5', '1 hour', 'Publicaste demasiados anuncios. Intenta de nuevo más tarde.');
create trigger trg_rate_limit before insert on public.emergency_alerts
  for each row execute function public.enforce_rate_limit('user_id', '5', '1 day', 'Alcanzaste el límite de alertas de hoy. Intenta de nuevo mañana.');
create trigger trg_rate_limit before insert on public.reports
  for each row execute function public.enforce_rate_limit('reporter_id', '10', '1 hour', 'Enviaste demasiados reportes. Intenta de nuevo más tarde.');
create trigger trg_rate_limit before insert on public.success_stories
  for each row execute function public.enforce_rate_limit('user_id', '5', '1 day', 'Alcanzaste el límite de historias de hoy. Intenta de nuevo mañana.');
create trigger trg_rate_limit before insert on public.groups
  for each row execute function public.enforce_rate_limit('created_by', '3', '1 day', 'Alcanzaste el límite de grupos de hoy. Intenta de nuevo mañana.');

-- El conteo filtra por autor y fecha: índices para que no escanee la tabla
create index if not exists idx_posts_user_created on public.posts(user_id, created_at desc);
create index if not exists idx_comments_user_created on public.comments(user_id, created_at desc);
create index if not exists idx_messages_sender_created on public.messages(sender_id, created_at desc);
create index if not exists idx_alerts_user_created on public.emergency_alerts(user_id, created_at desc);
