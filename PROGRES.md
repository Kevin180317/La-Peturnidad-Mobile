# PROGRES — La Peturnidad

> Estado actual del proyecto. Última actualización: 27/06/2026

---

## ✅ Fase 1 — Base sólida (Completada)

| Item | Estado |
|---|---|
| Tabla `user_profiles` + RLS | ✅ |
| Tabla `pets` + RLS | ✅ |
| Tabla `emergency_alerts` + RLS | ✅ |
| Tabla `found_pets` + RLS | ✅ |
| Storage buckets (`pet-images`, `profile-pictures`) + RLS | ✅ |
| Edge Function `send-emergency-notification` | ✅ |
| Keys de entorno unificadas (solo anon key) | ✅ |
| `ServiceResult` type exportado | ✅ |
| found_pets RLS corregido (dueño puede ver) | ✅ |
| Storage listing policies restringidas | ✅ |
| Server Express movido a `legacy/` | ✅ |

## ✅ Fase 2 — Funcionalidades core (Completada)

| Item | Estado |
|---|---|
| Editar mascota | ✅ |
| Configuración de notificaciones | ✅ |
| Avisos / Comunidad (Flujo E) | ✅ |

*Excluido: mapa interactivo, login social (email-only)*

## ✅ Fase 3 — Red social (Completada)

| Item | Estado |
|---|---|
| Feed social / timeline | ✅ |
| Comentarios en posts y avisos | ✅ |
| Perfiles públicos (`/perfil/[id]`) | ✅ |
| Sistema de follow | ✅ |
| Mensajería directa | ✅ |
| Tablas: `posts`, `comments`, `follows`, `conversations`, `conversation_participants`, `messages` | ✅ |

## ✅ Fase 4 — Diferenciación (Completada)

| Item | Prioridad | Estado |
|---|---|---|
| **Ver seguidores/siguiendo** | 🟡 Media | ✅ Pantalla `/seguidores` con tabs followers/following |
| **Editar perfil** | 🟡 Media | ✅ Formulario en `/editar-perfil` (nombre, teléfono, dirección, foto de perfil) |
| **Matching automático lost & found** | 🟢 Baja | ✅ Algoritmo en `services/matching.service.ts` |
| **Grupos por colonia** | 🟢 Baja | ✅ Tablas `groups`, `group_members` + pantallas `/grupos`, `/grupos/[id]` |
| **Roles de usuario** | 🟢 Baja | ✅ Columna `role` en `user_profiles` + RLS para moderadores |
| **Muro de reuniones exitosas** | 🟢 Baja | ✅ Tabla `success_stories` + pantalla `/historias` |
| **Moderación y reportes** | 🟢 Baja | ✅ Tablas `reports`, `blocks` + pantalla `/panel-moderacion` |
| **Sub-tabs Feed/Comunidad** | 🟡 Media | ✅ Feed: "Feed" (otros) / "Mis posts". Comunidad: "Comunidad" (otros) / "Mis avisos" |

### Bugs corregidos

| Bug | Fix |
|---|---|
| `42P17` — RLS recursion en políticas de moderadores | Función `is_moderator_or_admin()` con `SECURITY DEFINER` |
| `23505` — duplicate key al crear perfil | `upsert` con `onConflict: "user_id"` en vez de check-then-insert |
| Formato de fecha inválido para PostgreSQL | Helper `toPostgresDate()` que convierte `DD/MM/YYYY` → `YYYY-MM-DD` |
| Storage 403 — anon key no tiene rol `authenticated` | Usar JWT del usuario (`session.access_token`) en vez de anon key |
| RLS bloqueaba ver perfiles de otros usuarios en comunidad | Política `Anyone can view profiles` con `USING (true)` |

## 🔧 Pendiente / Deuda técnica

### ✅ Implementado hoy

| Item | Notas |
|---|---|
| **Badge de mensajes no leídos** | Indicador con contador en el botón "Mensajes" del dashboard. Se actualiza al cargar, al hacer pull-to-refresh y al volver de la pantalla de mensajes. |
| **Eliminar chats** | Long press en la lista de mensajes → alerta de confirmación → elimina al usuario de `conversation_participants`. Incluye DELETE policy. |
| **Chat grupal por grupo** | Botón "💬 Chat grupal" en la pantalla de detalle del grupo. Crea una conversación con `group_id` y todos los miembros como participantes. Se muestra con ícono 👥 en la lista de mensajes. |
| **Columna `group_id` en conversations** | Nueva columna FK → `groups(id)` para identificar chats grupales. |
| **RPC `create_group_conversation`** | Función SECURITY DEFINER que crea conversación con `group_id` + inserts todos los miembros. |
| **Fix: creador veía "Unirse" en sus grupos** | Race condition: `setUserId` async no se había actualizado cuando `loadGroups` consultaba membresía. Se pasa `userId` como parámetro en vez de leer del state. |
| **Fix: mensajes sin nombre del remitente** | En chats grupales se cargan los perfiles (`first_name`, `last_name`) de cada `sender_id` y se muestran arriba del bubble. |
| **Eliminar grupo** | Long press en lista + botón en detalle (solo creador). RPC `delete_group()` SECURITY DEFINER que elimina grupo, miembros (cascade), chat asociado, mensajes y participantes. DELETE policy en `groups`. |

### 🔴 Implementación inmediata

| Item | Notas | Estado |
|---|---|---|
| **RLS `conversations` SELECT rota** | Comparaba `conversation_participants.id` en vez de `conversations.id` — nadie podía leer conversaciones | ✅ Corregido |
| **`.select()` post-INSERT en `getOrCreateConversation`** | Aún con RLS corregido, el SELECT fallaba porque el usuario no es participante hasta después | ✅ Corregido |
| **INSERT otro usuario en `conversation_participants`** | Política exigía `auth.uid() = user_id` — no permitía agregar al otro usuario | ✅ Creada función `create_conversation()` vía RPC con SECURITY DEFINER |
| **RLS `conversation_participants` SELECT mal** | `cp.conversation_id = cp.conversation_id` siempre true — demasiado permisivo | ✅ Corregido |
| **Faltaba UPDATE policy en `messages`** | `markAsRead` no funcionaba | ✅ Creada |
| **Faltaba UPDATE policy en `conversations`** | `sendMessage` no actualizaba `updated_at` | ✅ Creada |
| **`sendMessage` usaba `.select()` post-INSERT** | Mismo problema: SELECT bloqueado por RLS. Cambiado a UUID client-side sin `.select()` | ✅ Corregido |
| **RLS con subquery causaba error 500 en messages y conversation_participants** | Subquery correlacionada causaba recursión/error. Reemplazadas por `is_participant()` con `SECURITY DEFINER` | ✅ Corregido |
| **`setUserId` no declarado en `grupos/[id].tsx`** | Llamada a `setUserId()` sin `useState` — crasheaba al entrar a grupo | ✅ Corregido |
| **Dynamic import en `perfil/[id].tsx`** | `import("@/services/...")` frágil en Metro → static import | ✅ Corregido |
| **Faltan `Stack.Screen` en `_layout.tsx`** | `grupos/[id]` y `mensajes/[id]` sin registro explícito | ✅ Agregados |

### 🟥 Alta prioridad

| Item | Notas |
|---|---|
| **Tests** | No hay ningún test (unit, integration, e2e) |
| **Refactor `dashboard.tsx`** | ~2000 líneas monolíticas — extraer a hooks y componentes separados |
| **Buscador** | No hay búsqueda de mascotas, grupos, usuarios, etc. |
| **Recuperación de contraseña** | `forgot-password.tsx` existe pero el flujo completo (email + reset) necesita verificarse |
| **Eliminar cuenta** | No hay opción para que un usuario elimine su cuenta |

### 🟡 Media prioridad

| Item | Notas |
|---|---|
| **Generated types** | `supabase gen types` no se ha corrido; `dashboard.service.ts` redefine interfaces manualmente |
| **Onboarding** | No hay tutorial / walkthrough para nuevos usuarios |
| **Verificación de email** | No hay verificación de email post-registro |
| **CI/CD** | No hay GitHub Actions para lint/test/build |
| **Soporte offline** | Sin caché ni persistencia offline |
| **Dark mode** | No implementado (tema claro fijo) |

### 🟢 Baja prioridad

| Item | Notas |
|---|---|
| **Analytics / Crash reporting** | No hay Sentry, PostHog, etc. |
| **i18n** | Todo en español duro (sin sistema de traducciones) |
| **Limpiar storage policies** | Hay políticas duplicadas de INSERT en `storage.objects` (3 por bucket) |
| **Servir colonias.json desde API** | 3786 líneas en cliente (`register-extended.tsx`) |
| **Edge Function tests** | `send-emergency-notification` sin tests |
| **`dashboard.service.ts` redefine interfaces** | `UserProfile`, `Pet`, etc. en vez de importar `@/types` |

---

*Documento de progreso del proyecto La Peturnidad.*
