# Implementación pendiente de Supabase — semana del 2 al 6 de noviembre de 2026

**Fecha límite: sábado 7 de noviembre de 2026**
**Prioridad: ALTA**

Escrito el 2026-10-31, a partir de la auditoría local y sin acceso a Supabase.

**Objetivo:** cerrar todo lo pendiente que depende de Supabase, para poder subir a producción.

## Antes de empezar

- **Nada de este documento está aplicado.**
- **El SQL es un borrador sin ejecutar.** Se escribió leyendo las migraciones del repo, no la base real. Primero corre la revisión del Paso 1.3 y ajusta lo que no coincida.
- **El SQL está aquí a propósito, no en `supabase/migrations/`,** para que no se aplique por accidente. Cópialo a su archivo cuando llegue su paso.
- **Requisitos:** acceso al proyecto `owtcrciujfdlcuopimof`, contraseña de la base, teléfono o emulador, y 2 cuentas de prueba (3 para grupos).
- **Herramientas:** el plan se ejecuta con Claude y el **MCP de Supabase**, sin CLI ni Docker. Debe estar conectado, con permiso de escritura (sin modo solo lectura) y al proyecto correcto. Se comprobó el 2026-10-31: en esa sesión no estaba conectado. `pg_dump` (`postgresql-client` 17 o superior) solo hace falta para el respaldo del Paso 1.2.
- **Si el proyecto está pausado** (plan free, unos 7 días sin actividad), reactívalo primero.

## Cómo se ejecuta con el MCP

| Tarea | Herramienta |
|---|---|
| Consultas de revisión (Paso 1.3) y pruebas | `execute_sql` |
| Aplicar las migraciones A y B | `apply_migration` |
| Ver el historial remoto | `list_migrations` |
| Publicar edge functions | `deploy_edge_function` |
| Regenerar tipos | `generate_typescript_types` |
| Revisar seguridad y errores después de cada cambio | `get_advisors`, `get_logs` |

**Reglas:**

- **Datos personales:** no leas contenido de tablas con el MCP para respaldar o revisar, porque pasaría por la conversación. Las consultas de este plan piden esquema o datos agregados, sin identificar usuarios. Una dirección en texto libre puede incluir la calle del usuario: el resultado del Paso 5.1 es sensible, así que no lo copies fuera de la sesión.
- **Confirmación:** cada `apply_migration` y `deploy_edge_function` se revisa antes de ejecutarse. Cambian producción.
- **Historial:** guarda en `supabase/migrations/` el mismo SQL que se aplique y compara con `list_migrations`.

## Calendario

| Día | Trabajo | Resuelve |
|---|---|---|
| Lun 2 | Acceso, respaldo, esquema base y ajustes del panel | #8 |
| Mar 3 | Migración A (compatible con la app actual) y edge functions | #2, #3, #5, #9 |
| Mié 4 | Cambios en la app, tests y build `preview` | prepara #1 y #6 |
| Jue 5 | Migración B (exige la app nueva) y prueba con 2 cuentas | #1, #6 |
| Vie 6 | Limpieza de datos, extras y cierre | #4 (datos existentes) |

**El orden importa:** la migración B deja sin nombres ni teléfonos a los builds viejos. No la apliques antes de tener instalado el build nuevo. Los APK anteriores dejarán de funcionar bien; avisa al equipo de QA.

## Lunes: acceso, respaldo y esquema base

### Paso 1.1: entrar

1. Conecta el MCP de Supabase con acceso de escritura y comprueba que el proyecto sea `owtcrciujfdlcuopimof`.
2. Ejecuta `list_migrations`.

La lista remota probablemente no coincide con el repo: `docs/SUPABASE_SCHEMA.md` registra versiones de 2026-06 que no están en `supabase/migrations/`. Eso es justo lo que corrige el Paso 1.4.

### Paso 1.2: respaldar antes de tocar nada

**El MCP no hace respaldos**, y este paso no debe saltarse: el plan free no tiene respaldos automáticos. Necesitas la contraseña de la base. Copia la cadena de conexión de **Session pooler** en el panel (botón **Connect**) y úsala con `pg_dump`:

```bash
mkdir -p ~/respaldos-lucky/2026-11-02
export DB_URL='<cadena de Session pooler, con la contraseña de la base>'
pg_dump "$DB_URL" --schema-only --no-owner -n public -n storage -f ~/respaldos-lucky/2026-11-02/schema.sql
pg_dump "$DB_URL" --data-only --no-owner -n public -f ~/respaldos-lucky/2026-11-02/data.sql
unset DB_URL
```

Guárdalo **fuera del repo**: `data.sql` contiene datos personales, y no dejes la contraseña en un archivo.

### Paso 1.3: comparar la base real con lo que asume este plan

Ejecuta con `execute_sql` y anota cualquier diferencia:

```sql
-- Todas las políticas SELECT de perfiles. Las permisivas se suman:
-- si hay otra abierta además de "Authenticated can view profiles", el Paso 4.1 no cerraría nada.
select policyname, cmd, roles, qual from pg_policies
where schemaname = 'public' and tablename = 'user_profiles';

-- ¿found_pets tiene política UPDATE? Se espera que no.
-- Si existe, un cliente podría reiniciar notified_at: hay que protegerlo igual que en el Paso 2.1.
select policyname, cmd from pg_policies
where schemaname = 'public' and tablename = 'found_pets';

-- Políticas de participantes (el Paso 4.1 elimina cp_delete)
select policyname, cmd from pg_policies
where schemaname = 'public' and tablename = 'conversation_participants';

-- #9: confa = 'a' (NO ACTION) confirma el bug; 'n' (SET NULL) o 'c' (CASCADE) lo descartan
select conname, confdeltype as confa from pg_constraint
where conrelid = 'public.reports'::regclass and contype = 'f';

-- Triggers que ya existen en las tablas que se van a tocar
select event_object_table, trigger_name from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('emergency_alerts', 'group_members', 'user_profiles', 'found_pets');

-- Valores por defecto de preferencias: deben ser true, porque app/notificaciones.tsx usa `?? true`
select column_name, column_default from information_schema.columns
where table_schema = 'public' and table_name = 'notification_preferences'
  and column_name in ('push_enabled', 'lost_pet_alerts', 'found_pet_alerts');

-- Realtime del chat
select tablename from pg_publication_tables where pubname = 'supabase_realtime';

-- ¿Algún creador de grupo no está en group_members? Si hay filas, ver el Paso 2.1
select g.id, g.created_by from public.groups g
where not exists (
  select 1 from public.group_members m where m.group_id = g.id and m.user_id = g.created_by
);
```

### Paso 1.4: versionar el esquema base (#8)

1. Genera `supabase/migrations/20261102000000_baseline.sql` a partir de `~/respaldos-lucky/2026-11-02/schema.sql` (Paso 1.2), que ya trae el esquema `public` y `storage`. Deja de `storage` solo las políticas y agrega los buckets.
2. Complétalo con lo que no viene en ese respaldo. Consúltalo con `execute_sql`:

   ```sql
   select id, public, file_size_limit, allowed_mime_types from storage.buckets;
   select tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal;
   select tablename from pg_publication_tables where pubname = 'supabase_realtime';
   ```

3. Las 5 migraciones actuales ya quedan incluidas en esa foto. Muévelas a `supabase/migrations_archivo/` para que no se vuelvan a ejecutar encima.
4. **No apliques el baseline en producción:** solo documenta lo que ya existe. El historial remoto se queda como está.
5. **Comprueba que se puede reconstruir:** crea un segundo proyecto gratuito como staging y aplica ahí el baseline con el MCP. Hay que apuntar el MCP a ese proyecto; asegúrate de volver a producción después.

**Hecho cuando:** el esquema se aplica sin errores en staging. A partir de aquí, prueba cada migración ahí antes de aplicarla en producción. El plan free permite 2 proyectos activos; si no hay lugar para staging, usa la prueba con `rollback` del Paso 2.1.

### Paso 1.5: ajustes del panel

- [ ] **Auth → Email:** SMTP propio (el correo por defecto tiene un límite bajo por hora).
- [ ] **Auth → Email:** "Secure email change" activo.
- [ ] **Auth → Email:** el código OTP debe ser de 8 dígitos; `app/verify-otp.tsx` asume ese largo.
- [ ] **Auth → URL Configuration:** `https://la-peturnidad.vercel.app/email-confirmed` debe estar permitida y responder. Si ya no se usa ese dominio, cambia `EMAIL_CONFIRMATION_REDIRECT_URL` en `services/auth.service.ts`.
- [ ] **Storage:** límite de 5 MB y solo imágenes en `pet-images`, `profile-pictures` y `posts`. Hoy el límite de 5 MB solo se valida en la app.
- [ ] **Plan:** decidir entre Pro o respaldos manuales. El plan free pausa el proyecto y no tiene respaldos.
- [ ] **Auth (solo Pro):** activar la protección contra contraseñas filtradas.

## Martes: migración A y edge functions

La migración A solo agrega protecciones y objetos nuevos. La app actual sigue funcionando.

### Paso 2.1: `20261103000001_alert_guards_group_chat.sql`

```sql
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
-- Si el Paso 1.3 encontró creadores fuera de group_members, agrega también
-- "and cp.user_id <> g.created_by" (uniendo public.groups g) o el creador saldrá de su chat.
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
-- así sigue funcionando cuando el Paso 4.1 cierre user_profiles.
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
```

**Cómo aplicarla:**

1. Pruébala en staging con `apply_migration`.
2. Si no hay staging, ensáyala en producción con `execute_sql`, con el contenido entre `begin;` y `rollback;`. Comprueba que no marque errores y que no quede nada aplicado. Esto valida la sintaxis y los objetos, no el comportamiento de la app.
3. Aplícala en producción con `apply_migration`.
4. Revisa `get_advisors`. Es esperado que marque `public_profiles` como "security definer view".

**Riesgo conocido:** con el trigger de #2, un intento de cambiar la colonia falla con error. La app actual no edita alertas, así que no debería notarse.

**Reversión:** `drop trigger` de los 3 triggers, y `drop` de la vista, las 3 RPC y la columna `cleared_at`. Los exmiembros borrados del chat solo se recuperan desde el respaldo.

### Paso 2.2: corregir `supabase/functions/delete-account/index.ts` (#3 y #9)

**A.** Antes del bucle `for (const [table, column] of OWNED_ROWS)`, guarda los chats 1:1 del usuario y limpia las referencias:

```ts
// Solo los chats 1:1 de ESTE usuario se borran con su cuenta
const { data: myParticipations } = await supabase
  .from("conversation_participants")
  .select("conversation_id")
  .eq("user_id", caller.id);
const myConvIds = (myParticipations ?? []).map((p) => p.conversation_id);
const { data: myDirectConvs } = myConvIds.length
  ? await supabase.from("conversations").select("id").in("id", myConvIds).is("group_id", null)
  : { data: [] };

// reports.reviewed_by referencia auth.users: si queda, deleteUser falla para moderadores
const { error: reviewedError } = await supabase
  .from("reports")
  .update({ reviewed_by: null })
  .eq("reviewed_by", caller.id);
if (reviewedError) throw new Error(`reports.reviewed_by: ${reviewedError.message}`);

// Comentarios de otros en publicaciones del usuario: sin FK, quedarían huérfanos
for (const [table, targetType] of [["posts", "post"], ["announcements", "announcement"], ["emergency_alerts", "alert"]]) {
  const { data: owned } = await supabase.from(table).select("id").eq("user_id", caller.id);
  const ids = (owned ?? []).map((r) => r.id);
  if (ids.length) {
    const { error } = await supabase.from("comments").delete().eq("target_type", targetType).in("target_id", ids);
    if (error) throw new Error(`comments.${targetType}: ${error.message}`);
  }
}
```

**B.** Reemplaza el bloque "Conversaciones 1:1 que quedaron con un solo participante" (líneas 66 a 74):

```ts
const directIds = (myDirectConvs ?? []).map((c) => c.id);
if (directIds.length) await supabase.from("conversations").delete().in("id", directIds);
```

**C.** Reemplaza el borrado de Storage, porque `list` solo devuelve 1000 archivos por llamada:

```ts
for (const bucket of BUCKETS) {
  for (let page = 0; page < 100; page++) {
    const { data: files } = await supabase.storage.from(bucket).list(caller.id, { limit: 1000 });
    if (!files?.length) break;
    const { error } = await supabase.storage.from(bucket).remove(files.map((f) => `${caller.id}/${f.name}`));
    if (error) throw new Error(`storage ${bucket}: ${error.message}`);
  }
}
```

**Decisión tomada:** al eliminar una cuenta también se borra el chat 1:1 para la otra persona, porque ya perdió los mensajes de quien se fue. Los reportes contra el usuario también se borran, como hoy (`reports.target_user_id`).

### Paso 2.3: corregir el texto del push

En `supabase/functions/send-push-notification/index.ts:250`, para que no asuma el género de la mascota:

```ts
title: `⚠️ ${ownerName} busca a ${alert.pet_name}`,
```

Los tests actuales solo comprueban que el título contenga el nombre, así que deberían seguir pasando.

### Paso 2.4: publicar

1. Corre `bun run test`.
2. Antes de publicar, revisa con `get_edge_function` o en el panel si cada función tiene "Verify JWT" activo, y mantén esa misma configuración.
3. Publica `delete-account` y `send-push-notification` con `deploy_edge_function`.
4. Revisa `get_logs` después de la primera llamada.

## Miércoles: cambios en la app

Las correcciones que no dependen de Supabase (#4, #5 y #6 parciales, #7, #10, #11, #12) ya se aplicaron el 2026-10-31; ver `AGENTS.md`. Quedan sin probar en teléfono: inclúyelas en la prueba del Paso 4.3.

Cuando la migración B esté lista, el aviso de "Conversación cerrada" de `app/mensajes/[id].tsx` solo aplicará a chats de cuentas eliminadas.

### Paso 3.1: regenerar tipos

Regenera `types/database.ts` con `generate_typescript_types` y corre `bun run typecheck`. En los tipos generados, las columnas de una vista salen como opcionales, incluido `user_id`; hay que estrecharlas con `Override<>` en `types/index.ts`.

### Paso 3.2: leer perfiles ajenos desde la vista (#1)

Cambia `from("user_profiles")` por `from("public_profiles")` en:

| Archivo | Línea (revisada el 2026-10-31) |
|---|---|
| `app/seguidores.tsx` | 65 |
| `app/panel-moderacion.tsx` | 41 |
| `app/grupos/[id].tsx` | 50 |
| `app/mensajes/[id].tsx` | 171 |
| `services/messages.service.ts` | 88 |
| `services/comments.service.ts` | 25, 75 |
| `services/success-stories.service.ts` | 20 |
| `services/search.service.ts` | 61, 147 |
| `services/posts.service.ts` | 33, 93 |
| `services/announcements.service.ts` | 22, 72 |

**No cambies** las lecturas del perfil propio: `dashboard.service.ts:91`, `dashboard.service.ts:107`, `panel-moderacion.tsx:62`, `posts.service.ts:166` (`getMyPosts`), `register-extended.tsx` ni `profile.service.ts` en crear y actualizar.

**Perfil ajeno:** agrega `profileService.getPublicByUserId(id)`, que lea de `public_profiles`, y úsalo en `app/perfil/[id].tsx:56`. `app/editar-perfil.tsx` sigue con `getByUserId`.

### Paso 3.3: teléfonos por RPC (#1)

En `services/dashboard.service.ts`:

- **`getEmergencyAlertsByLocation` (línea 274):** usa `supabase.rpc("get_alert_contacts", { p_alert_ids })`. Si una alerta no vuelve en el resultado, muestra "Usuario" y "No disponible".
- **`getUserEmergencyAlerts` (línea 327):** usa `supabase.rpc("get_finder_contacts")` y cruza por `found_id`.
- **`owner_address`:** elimínalo del tipo y del mapeo; ninguna pantalla lo muestra.

Actualiza `__tests__/services/dashboard.service.test.ts`.

### Paso 3.4: vaciar chat en lugar de salir (#6)

En `services/messages.service.ts`:

- **`deleteConversation`:** llama `supabase.rpc("clear_conversation", { p_conversation_id })`.
- **`getConversations`:** lee también `cleared_at` en la línea 23. Oculta el chat si tiene `cleared_at` y no hay mensajes posteriores.
- **`getMessages`:** recibe `userId`, consulta su `cleared_at` y filtra con `.gt("created_at", clearedAt)`. Actualiza también la llamada en `app/mensajes/[id].tsx:83`.
- **Vista previa del último mensaje:** no mostrar mensajes anteriores a `cleared_at`.

Actualiza `__tests__/services/messages.service.test.ts` y `__tests__/app/conversation.test.tsx`.

### Paso 3.5: verificar y generar el build

```bash
bun run typecheck && bun run lint && bun run test
eas build --profile preview --platform android
```

**Hecho cuando:** las 3 verificaciones pasan, el APK está instalado en el teléfono, y la app funciona igual que antes contra la base con la migración A.

## Jueves: migración B y prueba completa

**Antes de aplicar:** build del miércoles instalado y `grep -rn 'from("user_profiles")' app services components` sin perfiles ajenos.

### Paso 4.1: `20261105000001_close_profile_access.sql`

Se aplica igual que la migración A (Paso 2.1).

```sql
-- #1 Cerrar el acceso: cada quien lee su fila; moderadores leen todas
-- Elimina también cualquier otra política abierta que haya encontrado el Paso 1.3
drop policy "Authenticated can view profiles" on public.user_profiles;
create policy "Owner or moderator can view profile" on public.user_profiles for select to authenticated
  using ((select auth.uid()) = user_id or public.is_moderator_or_admin());

-- #6 Ya nadie sale de un chat borrando su fila
drop policy cp_delete on public.conversation_participants;

-- #6 Reparar chats 1:1 donde alguien ya salió: vuelve como participante, con el chat vaciado.
-- Solo se puede reconstruir si esa persona envió algún mensaje; si no, el chat queda igual.
insert into public.conversation_participants (conversation_id, user_id, cleared_at)
select distinct m.conversation_id, m.sender_id, now()
from public.messages m
join public.conversations c on c.id = m.conversation_id and c.group_id is null
where not exists (
  select 1 from public.conversation_participants cp
  where cp.conversation_id = m.conversation_id and cp.user_id = m.sender_id
);
```

`is_moderator_or_admin` es `security definer`, así que no provoca recursión en la política.

**Reversión:**

```sql
drop policy "Owner or moderator can view profile" on public.user_profiles;
create policy "Authenticated can view profiles" on public.user_profiles for select to authenticated using (true);
```

### Paso 4.2: comprobar los permisos con SQL

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<ID_USUARIO_A>","role":"authenticated"}';

-- Debe devolver solo 1 fila (la propia)
select count(*) from public.user_profiles;
-- Debe devolver todos los perfiles
select count(*) from public.public_profiles;
-- Debe fallar con "column ... does not exist"
select phone from public.public_profiles limit 1;
rollback;
```

La tercera consulta aborta la transacción; ejecútala al final, como aquí. Con `execute_sql`, corre el bloque sin esa tercera consulta para ver los conteos, y luego solo esa consulta para confirmar el error.

### Paso 4.3: prueba de aceptación en teléfono

Usa la cuenta A y la cuenta B en la misma colonia, y la cuenta C en otra colonia.

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | B consulta el perfil de A con la anon key | No obtiene teléfono, dirección ni fecha de nacimiento |
| 1 | B abre la alerta activa de A | Ve el nombre y el botón de llamar |
| 1 | C pide `get_alert_contacts` de esa alerta | Respuesta vacía |
| 1 | Feed, chat, búsqueda, seguidores, grupos y moderación | Muestran nombres y fotos correctos |
| 2 | A crea una alerta | B recibe push y aviso en la bandeja |
| 2 | A intenta `update emergency_alerts set notified_at = null` | Error |
| 2 | A inserta una alerta con otra colonia | Se guarda con la colonia de A |
| 2 | A elimina una mascota con alerta activa | Se elimina y la alerta queda resuelta |
| 3 | B elimina el chat con A; después A elimina su cuenta | Los chats de C con otros siguen intactos |
| 5 | B sale de un grupo | El chat desaparece de su lista y ya no puede enviar |
| 5 | B vuelve a unirse | Entra de nuevo al mismo chat |
| 6 | B vacía el chat con A; A escribe | El chat reaparece para B solo con el mensaje nuevo |
| 6 | A bloquea a B después de que B lo vació | B no puede enviar |
| 9 | Moderador que revisó un reporte elimina su cuenta | Se elimina sin error y el reporte queda con `reviewed_by` nulo |
| Base | B reporta "Lo encontré" | A recibe aviso y ve el teléfono de B |
| Base | Subir fotos de perfil, mascota y publicación | Se ven después de recargar |
| Base | Registro, confirmación de correo, recuperar contraseña y cambio de correo | Funcionan con el SMTP nuevo |

**Hecho cuando:** todas las filas pasan. Si falla algo de #1, aplica la reversión del Paso 4.1 mientras se corrige.

## Viernes: limpieza de datos, extras y cierre

### Paso 5.1: direcciones que no son una colonia (#4)

```sql
select address, postal_code, count(*) from public.user_profiles
where address is not null group by address, postal_code order by address;
```

Compara el resultado con `assets/colonias.json` (`Asentamiento` y `Código Postal`) y luego:

- **Si el código postal tiene una sola colonia:** actualiza la dirección con ella.
- **Si tiene varias:** el usuario debe elegirla en editar perfil. Requiere la corrección #4 de la app.
- **Si ninguna coincide:** revisión manual.

Las diferencias de mayúsculas no importan, porque la comparación las ignora. Haz un respaldo de la tabla antes de actualizar.

### Paso 5.2: fotos dañadas

Quedan archivos de antes del arreglo de subida de imágenes:

```sql
select bucket_id, name from storage.objects where (metadata->>'size')::int < 100;
```

Vuelve a subirlos desde la app y borra los dañados.

### Paso 5.3: extras

No bloquean producción. Si falta tiempo, se mueven a `BACKLOG.md`.

- [ ] **Fecha de aceptación de términos:** agregar `terms_accepted_at timestamptz` a `user_profiles` y guardarla al registrarse. Conviene hacerlo antes del lanzamiento, porque a los usuarios ya registrados no se les puede reconstruir.
- [ ] **Retención de notificaciones:** borrar las de más de 90 días con `pg_cron`. Debe coincidir con lo que diga la política de privacidad.
- [ ] **Bloqueo en ambos sentidos:** hoy, si alguien te bloqueó, sigues viendo su contenido. Requiere una RPC que devuelva ambas direcciones, sin reemplazar `getBlockedUsers`, porque `perfil/[id]` lo usa para mostrar "Usuario bloqueado".
- [ ] **Mascotas y grupos:** filtrarlos también por bloqueo.
- [ ] **Sentry:** reporte de caídas.

### Paso 5.4: cierre

- [ ] Actualizar `AGENTS.md`: sección de seguridad, versión de las edge functions y el esquema base.
- [ ] Actualizar `docs/SUPABASE_SCHEMA.md` o marcarlo como histórico, y actualizar `README.md`.
- [ ] Commit de migraciones, funciones y app.
- [ ] Respaldo final, igual que el Paso 1.2.
- [ ] Build de producción, solo si también están revisadas las páginas legales: `eas build --profile production --platform android`.

## Fuera de este plan

- **Páginas legales** (`/terms` y `/policy`) y formulario Data safety. Son del equipo web y de Play Console, pero **también bloquean producción**. Si cambia lo que ven otros usuarios, la política debe reflejar que el teléfono solo se comparte en alertas activas y al reportar una mascota encontrada.
- **Correcciones solo de app** (#7, #10, #11, #12 y limpieza). Ya aplicadas el 2026-10-31; falta probarlas en teléfono.
- **Push en iOS** (#13). Requiere Firebase y `GoogleService-Info.plist`, solo si lanzan en iOS.

## Lista de cierre

- [ ] #1 Datos personales protegidos
- [ ] #2 Spam de alertas bloqueado
- [ ] #3 `delete-account` no borra chats ajenos
- [ ] #4 Direcciones existentes corregidas
- [ ] #5 Salir de un grupo saca del chat
- [ ] #6 "Eliminar chat" ya no deja al otro escribiendo al vacío
- [ ] #8 Esquema base versionado y aplicado sin errores en staging
- [ ] #9 Moderadores pueden eliminar su cuenta
- [ ] Panel configurado (SMTP, correo seguro, OTP, URLs, Storage)
- [ ] Plan o respaldos decididos
- [ ] Prueba de aceptación completa en teléfono
