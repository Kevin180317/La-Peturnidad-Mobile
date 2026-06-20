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

## ❌ Fase 4 — Diferenciación (Pendiente)

| Item | Prioridad | Implica |
|---|---|---|
| **Ver seguidores/siguiendo** | 🟡 Media | Pantalla con lista de follows desde perfil |
| **Editar perfil** | 🟡 Media | Poder modificar nombre, teléfono, dirección |
| **Matching automático lost & found** | 🟢 Baja | Algoritmo que cruza atributos de mascotas perdidas vs encontradas |
| **Grupos por colonia** | 🟢 Baja | Tablas `groups`, `group_members`, feed filtrado |
| **Roles de usuario** | 🟢 Baja | Permisos (admin, moderador, usuario) |
| **Muro de reuniones exitosas** | 🟢 Baja | Sección pública con historias |
| **Moderación y reportes** | 🟢 Baja | Tabla `reports`, sistema de bloqueos |

## 🔧 Deuda técnica

| Item | Prioridad |
|---|---|
| `dashboard.tsx` monolítico (~1900 líneas) — refactorizar en hooks o screens separadas | 🔴 Alta |
| `dashboard.service.ts` redefine interfaces (`UserProfile`, `Pet`, etc.) en vez de importar `@/types` | 🟡 Media |
| Generar `database.types.ts` de Supabase (tipado automático) | 🟡 Media |
| `register-extended.tsx` carga `colonias.json` (3786 líneas) en cliente — mejor servirlo desde API | 🟢 Baja |

---

*Documento de progreso del proyecto La Peturnidad.*
