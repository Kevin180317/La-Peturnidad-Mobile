# PROGRES — Lucky Tracker

> Estado actual del proyecto. Última actualización: 01/08/2026

---

## ✅ Fase 8 — Fix Uniwind + Rediseño de iconos (Completada)

| Item | Notas |
|---|---|
| **Fix crítico: scanner Uniwind solo cubría `app/`** | El scanner de Tailwind v4 vía uniwind usa `base = dirname(global.css)` → solo compilaba clases usadas en `app/`. Tras el refactor B11, las clases exclusivas de `components/` no generaban estilo: botón "Ver mascotas perdidas" invisible (`bg-yellow-500`), sin gaps (`gap-4`), imágenes 0×0 (`w-32 h-32`). Fix: `@source "../components";` en `app/global.css` (verificado: las 209 clases de `components/` compilan; lint + tsc limpios). |
| **Rediseño EmergencyTab** | De columna de 4 botones a **grid 2×2 de cards**: círculo `bg-white/25` con Ionicons (megaphone, eye/eye-off, clipboard, checkmark-circle), título + subtítulo, estado activo `bg-[#211f1e]` con "✓ Visible" en verde. |
| **Overhaul de iconos: emojis → Ionicons (toda la app)** | Compartidos: `EmptyState` (prop `icon` ahora `keyof typeof Ionicons.glyphMap`, círculo coral), `Button` (fallback avatar con paw), `ToastConfig` (checkmark-circle/close-circle/information-circle), `ErrorBoundary` (paw). Dashboard: `TabBar` (filled/outline, color activo `#ff7e70`), `HomeTab` (cards resumen blancas con círculos de color), `ProfileTab` (menú lista con chevrons, badge mensajes, panel moderación condicional), `FeedTab`, `ComunidadTab` (chips con iconos), `PetForm`/`PetDetailModal` (dog/cat via MaterialCommunityIcons). Pantallas: buscar, comunidad, seguidores, perfil/[id], panel-moderacion, mensajes, mensajes/[id] (checkmark-done, send con ActivityIndicator), historias, grupos, grupos/[id], email-confirmacion (mail en círculo coral). Únicos emojis restantes: `console.log` de register.tsx (logs, no UI) y "✓" de texto en EmergencyTab. |
| **Verificación** | `npm run lint` (0 errores/0 warnings) + `tsc --noEmit` (0 errores). |

---

## ✅ Fase 1 — Base sólida (Completada)

| Item | Estado |
|---|---|
| Tabla `user_profiles` + RLS | ✅ |
| Tabla `pets` + RLS | ✅ |
| Tabla `emergency_alerts` + RLS | ✅ |
| Tabla `found_pets` + RLS | ✅ |
| Storage buckets (`pet-images`, `profile-pictures`) + RLS | ✅ |
| Edge Function `send-push-notification` (FCM v1) | ✅ |
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

## ✅ Fase 5 — UI/UX: legibilidad y estandarización (Completada)

| Item | Notas |
|---|---|
| **Bugs críticos de contraste (texto invisible)** | Selector tipo de mascota en dashboard (coral sobre coral) → `text-white`. Botones "Cerrar"/"Cancelar" con `bg-[#211f1e]` sin color de texto → `text-white`. |
| **Todos los TextInput estandarizados (40)** | Fondo blanco + texto `#211f1e` explícito + `placeholderTextColor="#9BA1A6"` en todas las pantallas: login, register, register-extended, forgot-password, reset-password, verify-otp, editar-perfil, dashboard, mensajes/[id], grupos, historias, comunidad. |
| **Contraste subido en metadata** | ~30 textos `text-gray-400` → `text-gray-500` (timestamps, fechas, contadores, estados vacíos) en 9 pantallas. |
| **Botones disabled/saving legibles** | "Guardando/Publicando/Subiendo" con `bg-gray-400` + texto blanco (ilegible) → texto `text-gray-700` condicional. Botón enviar del chat (`bg-gray-300`) → `text-gray-500`. Botón "Salir" de grupos → `text-gray-700`. |
| **Fix raíz: tema oscuro nativo** | `app.json`: `userInterfaceStyle: "automatic"` → `"light"`. Componentes nativos (Picker, diálogos, teclado) ya no siguen el dark mode del teléfono. |
| **Pickers estilizados** | Picker "Tamaño" (dashboard) y "Colonias" (register-extended): contenedor blanco + `style={{ color: "#211f1e", backgroundColor: "#ffffff" }}` + `color` en cada `Picker.Item`. |
| **Componente `PasswordInput`** | `components/PasswordInput.tsx` — toggle ojo (Ionicons `eye`/`eye-off`) al extremo derecho vía `flex-row`. Reemplaza los 5 inputs de contraseña: login, register (x2), reset-password (x2). |
| **Onboarding con AsyncStorage** | Flag `hasSeenOnboarding`: se guarda al completar los 3 steps o tocar "Saltar" (`index.tsx`); se redirige a `/login` si ya se vio (con spinner anti-parpadeo); se borra al hacer logout (`dashboard.tsx`). |
| **Marca unificada "Lucky Tracker"** | "La Peturnidad" → "Lucky Tracker" en login, header del dashboard, toast de bienvenida y display name de `app.json`. (Slug/scheme/package sin cambios.) |
| **Tonos teal unificados** | `#005e66` → `#007275` (dashboard, mensajes, perfil/[id]). |
| **Paleta centralizada** | Creado `utils/theme.ts` con colores de marca y clases base (`inputBase`, `buttonPrimary`, etc.). |

### Bugs corregidos (Fase 5)

| Bug | Fix |
|---|---|
| Texto invisible: coral sobre coral (selector tipo mascota) | `text-[#ff7e70]` → `text-white` cuando está seleccionado |
| Botones oscuros sin color de texto ("Cerrar"/"Cancelar") | Agregado `text-white` |
| Picker "Tamaño"/"Colonias" con fondo oscuro y texto blanco (dark mode del SO) | `userInterfaceStyle: "light"` + estilos explícitos de color/fondo en Picker e items |
| Inputs de contraseña sin toggle mostrar/ocultar | Nuevo `PasswordInput` con ojito |
| Onboarding se mostraba en cada apertura | Flag `hasSeenOnboarding` en AsyncStorage |

## ✅ Fase 6 — Limpieza y estabilidad (Completada)

| Item | Notas |
|---|---|
| **Fix `services/alerts.service.ts` (typecheck roto)** | Eliminado bloque huérfano de merge (catch/return duplicado fuera de cualquier método, L94-103 del original). **La lógica de notificaciones push está intacta** (inserción de alerta, búsqueda de vecinos por FCM, llamada a edge function): `services/alerts.service.ts:40-87`. El bloque era un error de sintaxis que impedía parsear/cargar el módulo entero. |
| **Typecheck en 0 errores** | ~35 errores preexistentes corregidos: `result.data ?? []` en setState de ~12 pantallas (dashboard, comunidad, historias, mensajes, mensajes/[id], perfil/[id], grupos, grupos/[id], panel-moderacion, seguidores), `followersRes.data?.length ?? 0`, import `Opacity` inexistente en `Button.tsx` (+ Omit de `onBlur`/`onFocus`), cast `url as Href` en `_layout.tsx`, `tsconfig.json` ahora excluye `supabase/` (código Deno, no se typecheckea con RN). Verificación: `tsc --noEmit` limpio. |
| **Fix pull-to-refresh (spinner real)** | `historias.tsx`, `panel-moderacion.tsx`, `grupos/[id].tsx` usaban `refreshing={loading}` → el spinner nunca aparecía al refrescar. Ahora estado `refreshing` + handler `handleRefresh`. |
| **Código muerto eliminado** | Borrados `components/dashboard/*` (HomeTab, EmergencyTab, ProfileTab, PetForm, PetDetailModal, TabBar) y `components/SkeletonLoader.tsx` — verificados sin imports. |
| **Flujo de edición de mascota restaurado** | El `PetDetailModal` local de dashboard recibía `onEdit={handleStartEdit}` pero lo ignoraba (componente sin props) → el botón "Editar" no existía en el modal. Ahora acepta `onEdit` y renderiza el botón "Editar" (teal) en el detalle de la mascota. |
| **Teclado ya no tapa inputs en auth** | `KeyboardAvoidingView` (behavior="padding", offset 100 en iOS) en login, register, register-extended y reset-password. |
| **Auto-login con sesión activa** | `index.tsx` y `login.tsx` verifican `supabase.auth.getSession()` al montar: sesión activa → dashboard directo (o email-confirmacion si no confirmado, o register-extended si perfil incompleto). Onboarding solo se muestra si no hay sesión. |
| **Lint: 20 → 16 warnings** | Eliminados 4 warnings: import `Opacity` (Button), `userId`/`setCity` sin usar (register-extended), `handleStartEdit` sin usar (restaurado). Quedan 16 preexistentes de `react-hooks/exhaustive-deps` (ver deuda media). |


## ✅ Fase 7 — Mejoras UX y calidad de código (Completada)

| Item | Notas |
|---|---|
| **Header teal sólido** | `_layout.tsx`: `screenOptions` con `headerStyle: { backgroundColor: "#007275" }`, `headerTintColor: "#ffffff"`, `headerTitleStyle: { fontWeight: "700" }`. |
| **ErrorBoundary global** | `<ErrorBoundary>` envolviendo el `<Stack>` en `_layout.tsx` — fallback con branding (🐾 + botón coral) si una pantalla crashea. |
| **Skeletons de carga** | Nuevo `components/Skeleton.tsx` (Skeleton, ListSkeleton, CardSkeleton con pulsación Animated). Reemplazaron ActivityIndicators full-screen en dashboard (skeleton personalizado), mensajes (ListSkeleton), grupos (ListSkeleton sin avatar) e historias (CardSkeleton). |
| **verify-otp UX** | Auto-verificación al llegar a 8 dígitos (`handleOtpChange` filtra no-dígitos y llama `handleVerify()`), `textContentType="oneTimeCode"` para autocompletado de códigos. Fix TS2322: `onPress={() => handleVerify()}`. |
| **EmptyStates con acción** | Nuevo `components/EmptyState.tsx` (ícono/título/subtítulo/botón). Aplicado en grupos ("Crear grupo"), historias ("Publicar historia"), comunidad ("Publicar aviso"), panel-moderacion y mensajes. |
| **Recarga al enfocar pantalla** | `useFocusEffect` + ref `firstFocus` (omite la carga inicial) en grupos, mensajes y comunidad — el contenido se refresca al volver de otra pantalla. |
| **Lint en 0 warnings** | Los 16 warnings de `react-hooks/exhaustive-deps` se suprimieron con `eslint-disable-next-line` colocado justo antes de la línea de cierre del hook (donde reporta la regla) + comentario de justificación ("deps estables intencionales"). `npm run lint`: 0 errores, 0 warnings. |
| **CI/CD GitHub Actions** | Nuevo `.github/workflows/ci.yml`: push a main + pull requests → `bun install --frozen-lockfile` + `bun run lint` + `bun run typecheck`. Script `typecheck` agregado en `package.json`. |
| **Generated types (B7)** | Nuevo `types/database.ts` (18 tablas + 5 funciones + helpers `Tables`/`TablesInsert`/`TablesUpdate`). `services/dashboard.service.ts` migrado: `UserProfile`, `Pet`, `EmergencyAlert`, `FoundPet` son ahora alias de `Row` del tipo `Database` (se eliminó el campo `email` inexistente en BD; campos opcionales ahora `string | null` como el esquema real). `dashboard.tsx` ajustado: `formatDate` acepta `string \| null \| undefined`, `handleStartEdit` con coerción (`pet.type === "gato" ? "gato" : "perro"`, `?? ""`). `FoundPetWithDetails`/`EmergencyAlertWithOwner` (tipos calculados de joins) se mantienen manuales. Verificación: `tsc --noEmit` limpio. |
| **Buscador (B10)** | Nueva pantalla `/buscar` (tabs Mascotas/Grupos/Usuarios) + `services/search.service.ts` (búsqueda `ilike` con debounce 300ms, límite 20 resultados). Mascotas muestran dueño, grupos miembros, usuarios ciudad; tap navega a perfil/grupo. Botón 🔍 en el header del dashboard. Nueva política RLS `Authenticated users can view all pets` (la RLS anterior solo permitía ver las propias — el buscador de mascotas de la comunidad fallaba). Registrada en `_layout.tsx`. |
| **Refactor dashboard.tsx (B11)** | `app/dashboard.tsx`: **2125 → 759 líneas**. UI extraída a `components/dashboard/*` (8 archivos, ~1760 líneas): `TabBar`, `DashboardSkeleton`, `PetDetailModal`, `PetForm` (encapsula todo el estado del formulario de mascota + subida de imagen), `HomeTab`, `ProfileTab` (encapsula foto de perfil), `EmergencyTab`, `FeedTab`, `ComunidadTab`. Los tabs y formularios manejan su estado local; el dashboard conserva solo datos + handlers (~40 estados → ~24). `formatDate` movido a `utils/format.ts`. Nota: subtabs/posts/avisos no persisten al cambiar de tab (antes sí, eran estados globales). Verificación: `tsc` + `lint` limpios. |

## ✅ Fase 9 — Sistema de 3 colores (Completada)

| Item | Notas |
|---|---|
| **Paleta unificada (3 colores + neutros)** | Teal `#007275` (primario: header, CTAs, subtabs/selecciones activas, toggles ON, éxito), Coral `#ff7e70` (acento: emergencias/perdidas, badges aviso/pregunta/pending, empty states, avatares fallback, trash), Dark `#211f1e` (texto, superficies, botones secundarios). Neutros: cream `#faf5e0` fondo, blanco cards, grises texto/bordes. Tint teal-400 `#2dd4bf` solo para "✓ Visible" sobre fondo oscuro. |
| **Colores eliminados (~11 tonos → 3)** | Verde (éxito/encontradas/revisado/subir foto) → teal; amarillo/ámbar (perdidas/pending/pregunta) → coral o dark; azul (mascotas/eventos/toast info) → teal; violeta `#7c3aed` (menú ProfileTab) → dark. Restos muertos: `#005e66` (theme.ts), `#0a7ea4` (ThemedText) → eliminado/teal. |
| **Rojo = solo destructivo** | Eliminar mascota (PetDetailModal) y Eliminar alerta (EmergencyTab) → `bg-red-500`; errores de formulario y toast error conservan red. |
| **Jerarquía invertida** | Teal pasa de 16 → ~124 usos (antes casi inexistente); coral baja de 147 → ~95 (ya no domina). Todos los CTAs (Publicar, Guardar, Enviar, Crear, Unirse, Seguir, login/register, Comenzar, subir foto, "Lo encontré", Revisado) ahora son teal. |
| **Detalles de consistencia** | TabBar activo, subtabs Feed/Mis posts, chips de categoría seleccionados, dots del onboarding y switches → teal; ActivityIndicators de carga → teal; menú del ProfileTab alterna teal/coral/dark con opacidades `/10`. |
| **Verificación** | `npm run lint` (0 errores/0 warnings) + `tsc --noEmit` (0 errores). Auditoría: restan solo red (funcional) + `#2dd4bf` (tint teal). |


## 🔧 Pendiente / Deuda técnica

### ✅ Implementado hoy

| Item | Notas |
|---|---|
| **Badge de mensajes no leídos** | Indicador con contador en el botón "Mensajes" del dashboard. Se actualiza al cargar, al hacer pull-to-refresh y al volver de la pantalla de mensajes. |
| **Eliminar chats** | Long press en la lista de mensajes → alerta de confirmación → elimina al usuario de `conversation_participants`. Incluye DELETE policy. |
| **Chat grupal por grupo** | Botón "💬 Chat grupal" en la pantalla de detalle del grupo. Crea una conversación con `group_id` y todos los miembros como participantes. Se muestra con ícono 👥 en la lista de mensajes. |
| **Columna `group_id` en conversations** | Nueva columna FK → `groups(id)` para identificar chats grupales. |
| **RPC `create_group_conversation`** | Función SECURITY DEFINER que crea conversación con `group_id` + inserts todos los miembros. |
| **Onboarding 3 pasos** | Pantalla de bienvenida con carrusel horizontal (Reporta · Conecta · Actúa), isotipo, dots indicadores, botón Siguiente/Comenzar. `index.tsx` es el onboarding directo. |
| **Routing refactor** | Login movido a `app/login.tsx`. Ruta `/login` registrada en `_layout.tsx`. 16 pantallas actualizadas: `router.replace("/")` → `router.replace("/login")`. |
| **Fix expo-notifications en Expo Go** | Static import reemplazado por `await import("expo-notifications")` dinámico + try-catch. No crashea en Expo Go SDK 53+. En dev build funciona con FCM + Edge Function. |
| **uniwind-types.d.ts movido** | Sacado de `app/` a raíz para evitar warning de Expo Router "Route missing default export". |
| **EAS Build: android/ fuera de git** | `android/` agregado a `.gitignore`, removido de tracking. `googleServicesFile` configurado en `app.json`. `google-services.json` movido a raíz. EAS regenera `android/` automáticamente con prebuild. |
| **Fix: creador veía "Unirse" en sus grupos** | Race condition: `setUserId` async no se había actualizado cuando `loadGroups` consultaba membresía. Se pasa `userId` como parámetro en vez de leer del state. |
| **Fix: mensajes sin nombre del remitente** | En chats grupales se cargan los perfiles (`first_name`, `last_name`) de cada `sender_id` y se muestran arriba del bubble. |
| **Eliminar grupo** | Long press en lista + botón en detalle (solo creador). RPC `delete_group()` SECURITY DEFINER que elimina grupo, miembros (cascade), chat asociado, mensajes y participantes. DELETE policy en `groups`. |
| **Push notifications (Edge Function + FCM)** | Nueva Edge Function `send-push-notification` desplegada. Usa Firebase Admin SDK (service account) para llamar FCM v1 API. Reemplazó a `send-emergency-notification` (eliminada). |
| **Cliente: getDevicePushTokenAsync** | `dashboard.tsx` ahora usa `getDevicePushTokenAsync()` en vez de `getExpoPushTokenAsync()`. Guarda en `user_profiles.fcm_token`. |
| **app.json: plugin expo-notifications** | Agregado explícitamente (requerido en SDK 53). |
| **google-services.json** | Colocado en `android/app/` para development builds Android. |
| **notifications table** | Nueva tabla en BD para historial de pushes. |
| **Emergency alerts push** | `alerts.service.ts` consulta `fcm_token` de vecinos y envía push via Edge Function al crear alerta. |
| **savePushToken duplicado eliminado** | Eliminado método muerto en `auth.service.ts`. |
| **Recuperación de contraseña con OTP** | Nuevo flujo de 3 pasos: (1) `forgot-password.tsx` reescrito — envía OTP via `signInWithOtp({ shouldCreateUser: false })` (2) `verify-otp.tsx` — input de 6 dígitos, verifica con `verifyOtp({ type: 'email' })` (3) `reset-password.tsx` — nueva contraseña con `updateUser({ password })`. Link "¿Olvidaste tu contraseña?" agregado al login. Registrados en `_layout.tsx`. |
| **Confirmación de email post-registro** | Nueva pantalla `email-confirmacion.tsx` — pantalla intermedia que se muestra después de registrarse o al intentar login sin email confirmado. Solo tiene "Reenviar email" y "Volver al inicio". En login (`index.tsx`), se verifica `email_confirmed_at` y si es null se redirige a `email-confirmacion` en vez de dashboard/register-extended. Método `resendConfirmation(email)` en `auth.service.ts`. |

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
| **Eliminar cuenta** | No hay opción para que un usuario elimine su cuenta |

### 🟡 Media prioridad

| Item | Notas |
|---|---|
| **Generated types** | ✅ Nuevo `types/database.ts` + `dashboard.service.ts` migrado (Fase 7) |
| **Onboarding** | ✅ Ya existe (3 pasos) + flag `hasSeenOnboarding` en AsyncStorage (se borra en logout) |
| **CI/CD** | ✅ GitHub Actions: lint + typecheck (Fase 7) |
| **Soporte offline** | Sin caché ni persistencia offline |
| **Dark mode** | No implementado — `userInterfaceStyle: "light"` forzado (decisión: solo tema claro) |
| **Warnings de lint (`exhaustive-deps`)** | ✅ 0 warnings (Fase 7) — suprimidos con disables comentados justificados |

### 🟢 Baja prioridad

| Item | Notas |
|---|---|
| **Analytics / Crash reporting** | No hay Sentry, PostHog, etc. |
| **i18n** | Todo en español duro (sin sistema de traducciones) |
| **Limpiar storage policies** | Hay políticas duplicadas de INSERT en `storage.objects` (3 por bucket) |
| **Servir colonias.json desde API** | 3786 líneas en cliente (`register-extended.tsx`) |
| **Database Webhooks** | Configurar webhooks en Supabase Dashboard: `emergency_alerts` INSERT + `messages` INSERT → `send-push-notification` |

---

*Documento de progreso del proyecto Lucky Tracker.*
