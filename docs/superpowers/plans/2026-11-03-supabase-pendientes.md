# Supabase pendientes (#1-#9) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar los pendientes de Supabase del 2026-10-31 (datos personales, alertas, chats, delete-account, esquema base) en el proyecto `owtcrciujfdlcuopimof`, antes del sábado 2026-11-07.

**Architecture:** Dos migraciones: A (aditiva, compatible con la app actual) y B (cierra `user_profiles`, exige el build nuevo). Entre ambas, cambios de app que leen perfiles ajenos desde la vista `public_profiles` y teléfonos desde RPC. El SQL ya está escrito en el documento fuente; este plan fija el orden, las diferencias con la base real y las pruebas.

**Tech Stack:** Supabase (MCP: `execute_sql`, `apply_migration`, `deploy_edge_function`, `generate_typescript_types`, `get_advisors`), Deno edge functions, Expo/React Native, Jest, Bun.

**Spec:** `docs/SUPABASE_IMPLEMENTACION_SEMANA_2026-11-02.md` (el SQL de los pasos 2.1, 4.1 y el código de 2.2/2.3 se copian de ahí, no se repiten aquí).

## Estado verificado de la base (2026-11-03, solo lectura)

| Hallazgo | Consecuencia |
|---|---|
| Nada del plan está aplicado: sin `public_profiles`, sin `cleared_at`, sin RPC nuevas, sin triggers de #2/#5 | Todo el documento sigue pendiente |
| **Hay datos reales** (7 perfiles, 9 mascotas, 11 alertas, 11 chats, 6 mensajes, 2 grupos, 6 posts, 8 `auth.users`). `list_tables` mostró 0 filas: son estadísticas viejas | El respaldo es obligatorio y las migraciones tocan datos |
| Política única de SELECT en `user_profiles` = `Authenticated can view profiles` (`true`) | El 4.1 la reemplaza sin otras políticas abiertas que borrar |
| `found_pets` sin política UPDATE | `notified_at` ahí ya está protegido |
| `reports_reviewed_by_fkey` = NO ACTION | #9 confirmado |
| `emergency_alerts`: sin trigger de protección, UPDATE permitido al dueño | #2 abierto |
| Hay 11 chats y solo 6 participantes | Existen chats sin participantes (efecto de `cp_delete`); ver Task 5 |
| Direcciones con espacios: 0; creadores de grupo fuera de `group_members`: 0 | Esos backfills son no-op; el SQL del 2.1 es seguro tal cual |
| Defaults de preferencias = `true`; realtime incluye `messages`; buckets de fotos con 5 MB y solo imágenes | Nada que corregir |
| Bucket `alternate` sin límite ni tipos; bucket `public` sin uso conocido | Decidir en Task 6 |
| 4 archivos de storage dañados (<100 bytes) | Task 6 |
| Advisors: 9 funciones SECURITY DEFINER ejecutables por `authenticated`; contraseñas filtradas desactivado | Las RPC y helpers de RLS las necesita la app: se dejan. Contraseñas filtradas solo con plan Pro |
| Historial remoto: 33 migraciones, repo local con 5 | #8 sigue pendiente |
| Edge: `delete-account` v1 y `send-push-notification` v8, ambas `verify_jwt: true` | Mantener `verify_jwt: true` al publicar |

## Global Constraints

- Proyecto: `owtcrciujfdlcuopimof`. Cada `apply_migration` y `deploy_edge_function` se confirma con el usuario antes de ejecutarse.
- No leer contenido de tablas con datos personales por el MCP: solo esquema, conteos y agregados. El resultado del Paso 5.1 es sensible.
- Migración B no se aplica hasta tener instalado el build nuevo en un teléfono.
- Bun es el único gestor; verificar con `bun run typecheck && bun run lint && bun run test` (0 errores, 0 warnings).
- No usar `Alert.alert`; textos Maestro intactos (ver `AGENTS.md`).
- Cada migración aplicada se guarda en `supabase/migrations/` con el mismo SQL y la versión que muestre `list_migrations`.

## Review Focus

- Chat 1:1 con participante faltante (hoy 5 de 11 chats): no debe dar error al abrir ni al enviar. Test en Task 3.
- Alerta cuyo dueño no devuelve fila en `get_alert_contacts` (otra colonia, alerta resuelta): mostrar "Usuario" / "No disponible", sin crash. Test en Task 3.
- Perfil sin foto, sin apellido o con `city` nulo leído desde `public_profiles`: render sin `undefined` ni crash. Test en Task 3.
- `getMessages` con `cleared_at` nulo (nunca vació): trae todo. Test en Task 3.
- Moderador que borra su cuenta con reportes revisados y comentarios ajenos en sus posts: 200, sin huérfanos. Prueba SQL/curl en Task 2.

---

### Task 1: Respaldo y migración A

**Files:**
- Create: `supabase/migrations/<version de list_migrations>_alert_guards_group_chat.sql` (SQL del Paso 2.1 del documento fuente)
- Create (fuera del repo): `~/respaldos-lucky/2026-11-03/{schema,data}.sql`

**Interfaces:**
- Produces: vista `public.public_profiles(user_id, first_name, last_name, profile_picture_url, city, role, created_at)`; RPC `get_alert_contacts(p_alert_ids uuid[]) -> (alert_id, owner_name, owner_phone)`, `get_finder_contacts() -> (found_id, finder_name, finder_phone)`, `clear_conversation(p_conversation_id uuid) -> void`; columna `conversation_participants.cleared_at timestamptz`; triggers `trg_protect_emergency_alert`, `trg_group_member_removed`, `trg_trim_profile_address`.

- [x] **Step 1: Respaldo OMITIDO por decisión del usuario (2026-11-03):** todos los datos son de prueba, sin clientes aún.
- [ ] **Step 2: Ensayo con rollback.** `execute_sql` con el SQL del 2.1 entre `begin;` y `rollback;`. Esperado: sin error. Confirmar después con `select count(*) from pg_views where viewname='public_profiles'` = 0.
- [ ] **Step 3: Aplicar** con `apply_migration` (nombre `alert_guards_group_chat`) tras confirmación del usuario.
- [ ] **Step 4: Pruebas de comportamiento** con `execute_sql` en `begin; ... rollback;` usando `set local role authenticated` y `request.jwt.claims` de un usuario real (ids por `select user_id from public_profiles limit 2`, sin leer datos personales):
  - `update emergency_alerts set notified_at = null` → error "No se puede modificar el aviso de la alerta".
  - insertar alerta con `last_seen_location = 'otra'` → queda con la dirección del perfil.
  - `get_alert_contacts` desde un usuario de otra colonia → 0 filas.
  - borrar una fila de `group_members` → desaparece su `conversation_participants`.
- [ ] **Step 5: `get_advisors` (security).** Esperado: se suma `public_profiles` como "security definer view" y nada más nuevo.
- [ ] **Step 6: Commit** `feat(db): alert guards, group chat cleanup, public_profiles and contact RPCs`.

### Task 2: Edge functions (#3, #9, texto del push)

**Files:**
- Modify: `supabase/functions/delete-account/index.ts` (cambios A, B, C del Paso 2.2)
- Modify: `supabase/functions/send-push-notification/index.ts:250`
- Test: `__tests__/functions/send-push-notification.test.ts`

**Interfaces:**
- Consumes: nada de Task 1.
- Produces: `delete-account` v2, `send-push-notification` v9, ambas `verify_jwt: true`.

- [ ] **Step 1:** Confirmar que el archivo local de `delete-account` coincide con la v1 remota (`get_edge_function`, ya leída); si difiere, partir del remoto.
- [ ] **Step 2:** Aplicar los cambios A, B y C del Paso 2.2 al archivo local. La limpieza de `reports.reviewed_by` y de comentarios va antes del bucle `OWNED_ROWS`.
- [ ] **Step 3:** Cambiar el título del push a `` `⚠️ ${ownerName} busca a ${alert.pet_name}` `` y ajustar la aserción del test para exigir ese texto exacto.
- [ ] **Step 4:** Run `bun run test -- send-push-notification` → PASS.
- [ ] **Step 5:** `deploy_edge_function` de ambas con `verify_jwt: true`, tras confirmación.
- [ ] **Step 6: Prueba de #9 en una cuenta desechable:** crear usuario de prueba con rol moderador, asignarle `reports.reviewed_by` (la inserción de la fila de prueba no se queda: usar `begin/rollback` no sirve con la edge function, así que limpiar a mano al final), llamar `delete-account` con su JWT. Esperado: `{success:true}`; el reporte conserva `reviewed_by` nulo. Revisar `get_logs` (edge-function) sin errores.
- [ ] **Step 7: Commit** `fix(functions): delete-account keeps others' chats, handles reviewers; push title gender-neutral`.

### Task 3: App lee desde la vista y RPC (#1, #6)

**Files:**
- Modify: `types/database.ts` (regenerar), `types/index.ts` (estrechar columnas de la vista con `Override<>`)
- Modify: lecturas de perfiles ajenos en `app/seguidores.tsx`, `app/panel-moderacion.tsx`, `app/grupos/[id].tsx`, `app/mensajes/[id].tsx`, `services/{messages,comments,success-stories,search,posts,announcements}.service.ts`, `app/perfil/[id].tsx` (tabla del Paso 3.2; verificar líneas con `grep -rn 'from("user_profiles")' app services components` porque pueden haberse movido)
- Modify: `services/profile.service.ts` (agregar `getPublicByUserId(id: string)` leyendo `public_profiles`), `services/dashboard.service.ts` (`getEmergencyAlertsByLocation`, `getUserEmergencyAlerts`, quitar `owner_address`), `services/messages.service.ts` (`deleteConversation`, `getConversations`, `getMessages(conversationId, userId)`)
- Test: `__tests__/services/dashboard.service.test.ts`, `__tests__/services/messages.service.test.ts`, `__tests__/app/conversation.test.tsx`, un test nuevo `__tests__/services/profile.service.test.ts`

**Interfaces:**
- Consumes: vista y RPC de Task 1.
- Produces: `profileService.getPublicByUserId(id: string): Promise<PublicProfile | null>`; `messagesService.getMessages(conversationId: string, userId: string)`; `messagesService.deleteConversation(id: string)` ahora llama `rpc("clear_conversation", { p_conversation_id })`. NO se cambian las lecturas del perfil propio listadas en el Paso 3.2.

- [ ] **Step 1: Regenerar tipos** con `generate_typescript_types`, sobrescribir `types/database.ts`, añadir `PublicProfile` en `types/index.ts`. Run `bun run typecheck` → ver qué rompe.
- [ ] **Step 2: Tests que fallan.**
  - `dashboard.service.test.ts`: `getEmergencyAlertsByLocation` llama `rpc("get_alert_contacts", { p_alert_ids })`; si una alerta no vuelve, `owner_name === "Usuario"` y teléfono `"No disponible"`. `getUserEmergencyAlerts` llama `rpc("get_finder_contacts")` y cruza por `found_id`.
  - `messages.service.test.ts`: `deleteConversation("c1")` llama `rpc("clear_conversation", { p_conversation_id: "c1" })`; `getMessages("c1","u1")` con `cleared_at` fijo aplica `.gt("created_at", cleared_at)` y con `cleared_at` nulo no filtra; `getConversations` oculta un chat vaciado sin mensajes posteriores y tolera un chat sin otro participante.
  - `profile.service.test.ts`: `getPublicByUserId` consulta `public_profiles` y devuelve `null` si no hay fila.
- [ ] **Step 3: Run** `bun run test -- dashboard.service messages.service profile.service` → FAIL por las razones anteriores.
- [ ] **Step 4: Implementar** los cambios de servicios y cambiar `from("user_profiles")` por `from("public_profiles")` en los archivos de la tabla del Paso 3.2 (solo perfiles ajenos). `app/perfil/[id].tsx` usa `getPublicByUserId`. `app/mensajes/[id].tsx` pasa `userId` a `getMessages`.
- [ ] **Step 5: Run** `bun run typecheck && bun run lint && bun run test` → 0 errores, 0 warnings, todo PASS.
- [ ] **Step 6: Commit** `feat(app): read public profiles via view, contacts via RPC, clear chat instead of leaving`.

### Task 4: Build preview y prueba en teléfono

**Files:** ninguno (sin cambios de código).

**Interfaces:** Consumes Tasks 1-3 (migración A aplicada, app nueva).

- [ ] **Step 1:** `eas build --profile preview --platform android`; el usuario instala el APK.
- [ ] **Step 2:** Con 2 cuentas en la misma colonia y una tercera en otra, ejecutar las filas de la tabla del Paso 4.3 del documento fuente que no dependen de B (todas excepto las dos primeras de #1 que verifican cierre de `user_profiles`). Esperado: todas pasan, contra la base con migración A.
- [ ] **Step 3:** Si algo falla, corregir antes de seguir. No aplicar Task 5.

### Task 5: Migración B (cierra `user_profiles`)

**Files:**
- Create: `supabase/migrations/<versión>_close_profile_access.sql` (SQL del Paso 4.1)

**Interfaces:** Consumes build nuevo instalado (Task 4). Produces: `user_profiles` SELECT solo para dueño o moderador; sin `cp_delete`.

- [ ] **Step 1: Chats sin participantes.** Contar con `select count(*) from conversations c where not exists (select 1 from conversation_participants p where p.conversation_id=c.id)`. Decisión: borrar los chats sin participantes ni mensajes (se agrega al SQL de B); el reconstructor del 4.1 solo repara chats donde el ausente envió mensajes.
- [ ] **Step 2: Ensayo** con `begin; ... rollback;`. Esperado: sin error.
- [ ] **Step 3: Aplicar** con `apply_migration` tras confirmación.
- [ ] **Step 4: Verificar permisos** con el bloque del Paso 4.2 (impersonando al usuario A): `count(*) from user_profiles` = 1, `count(*) from public_profiles` = total, `select phone from public_profiles` falla. Aplicar la reversión del 4.1 si la app falla.
- [ ] **Step 5:** Repetir en el teléfono las filas de #1, #5 y #6 de la tabla 4.3.
- [ ] **Step 6: Commit** `feat(db): close user_profiles access, remove cp_delete`.

### Task 6: Limpieza, panel y cierre

**Files:**
- Modify: `AGENTS.md`, `docs/SUPABASE_SCHEMA.md` (marcar histórico), `README.md`
- Create: `supabase/migrations/<versión>_baseline.sql` y mover las 5 migraciones a `supabase/migrations_archivo/` (Paso 1.4)

- [ ] **Step 1 (#4):** Ejecutar la consulta agregada del Paso 5.1, comparar con `assets/colonias.json` sin copiar resultados fuera de la sesión; corregir direcciones con un único código postal, el resto lo elige el usuario en la app.
- [ ] **Step 2:** Archivos dañados: listar `bucket_id, name` de los 4 (<100 bytes), borrar con el usuario y pedir resubir desde la app.
- [ ] **Step 3: Panel (lo hace el usuario):** SMTP propio, "Secure email change", OTP de 8 dígitos, URL de redirección permitida, bucket `alternate`: decisión = ponerle límite 5 MB e imágenes (lo hago con `execute_sql` sobre `storage.buckets`), decisión Pro vs respaldos manuales, contraseñas filtradas si hay Pro.
- [ ] **Step 4 (#8):** Generar baseline desde `schema.sql` del respaldo + buckets + trigger de `auth.users`; no aplicarlo en producción. Probarlo en un proyecto staging solo si el usuario crea uno.
- [ ] **Step 5:** Actualizar `AGENTS.md` (edge functions v9/v2, nuevo esquema, migraciones A/B), marcar `docs/SUPABASE_SCHEMA.md` como histórico, respaldo final igual al Step 1 de Task 1.
- [ ] **Step 6: Commit** `docs: close out supabase pendientes`.

## Self-review

- Cobertura: #1 (T1, T3, T5), #2 (T1), #3 (T2), #4 (T6), #5 (T1), #6 (T1, T3, T5), #8 (T6), #9 (T2), panel (T6). #7, #10-#12 ya aplicados en app; #13 (iOS) fuera de alcance.
- Consistencia de nombres: `get_alert_contacts`, `get_finder_contacts`, `clear_conversation`, `public_profiles`, `getPublicByUserId` y `cleared_at` coinciden entre tasks.
- Proporción: el SQL y el código de edge functions no se duplican; viven en el documento fuente.
