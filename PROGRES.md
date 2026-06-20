# PROGRES — La Peturnidad

> Estado actual del proyecto. Última actualización: 20/06/2026

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
| **Editar perfil** | 🟡 Media | ✅ Formulario en `/editar-perfil` (nombre, teléfono, dirección) |
| **Matching automático lost & found** | 🟢 Baja | ✅ Algoritmo en `services/matching.service.ts` |
| **Grupos por colonia** | 🟢 Baja | ✅ Tablas `groups`, `group_members` + pantallas `/grupos`, `/grupos/[id]` |
| **Roles de usuario** | 🟢 Baja | ✅ Columna `role` en `user_profiles` + RLS para moderadores |
| **Muro de reuniones exitosas** | 🟢 Baja | ✅ Tabla `success_stories` + pantalla `/historias` |
| **Moderación y reportes** | 🟢 Baja | ✅ Tablas `reports`, `blocks` + pantalla `/panel-moderacion` |

### Bugs corregidos en Fase 4

| Bug | Fix |
|---|---|
| `42P17` — RLS recursion en políticas de moderadores | Función `is_moderator_or_admin()` con `SECURITY DEFINER` |
| `23505` — duplicate key al crear perfil | `upsert` con `onConflict: "user_id"` en vez de check-then-insert |
| Formato de fecha inválido para PostgreSQL | Helper `toPostgresDate()` que convierte `DD/MM/YYYY` → `YYYY-MM-DD` |
| Storage 403 — anon key no tiene rol `authenticated` | Usar JWT del usuario (`session.access_token`) en vez de anon key |

## 🔧 Pendiente / Deuda técnica

### 🟥 Alta prioridad

| Item | Notas |
|---|---|
| **Tests** | No hay ningún test (unit, integration, e2e) |
| **Refactor `dashboard.tsx`** | ~1900 líneas monolíticas — extraer a hooks y componentes separados |
| **Subir foto de perfil** | La UI/subida desde el perfil no está integrada; solo está el fix de storage |
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
| **`dashboard.service.ts` redefine interfaces** | `UserProfile`, `Pet`, etc. en vez de importar `@/types` | 🟡 Media |

---

*Documento de progreso del proyecto La Peturnidad.*
