# AGENTS.md

## Commands

- `npx expo start` - dev server (web/mobile)
- `npx expo run:android` - run on Android
- `npx expo run:ios` - run on iOS
- `npm run lint` - lint check
- `npm run typecheck` - TypeScript check (`tsc --noEmit`)

## Build

- `npx expo prebuild` - generate native android/ios projects before building locally
- EAS build: `eas build` (configure in eas.json)

## Architecture

- **Frontend**: Expo Router (file-based routing in `app/`), React Native
- **Styling**: Uniwind (Tailwind CSS for RN) - config in `metro.config.js`
- **Backend** (legacy): Express server moved to `legacy/server/` folder
- **Auth/DB**: Supabase (`utils/supabase.ts`)

## Tech Stack

- Expo SDK 58, React Native 0.88, React 19.3
- TypeScript 6 (strict mode; `tsconfig.json` declara `types: ["jest", "node"]` porque TS 6 ya no carga los `@types/*` solos)
- Bun as package manager (bun.lockb). Es el ÚNICO lockfile: `package-lock.json` se eliminó el 2026-10-30 (expo-doctor/EAS se confunden con dos). No usar `npm install`

## Key Files

- `app/` - Expo Router pages (dashboard, register, index)
- `utils/supabase.ts` - Supabase client
- `.env` - local env vars (ignorado por git; `.env.local` también funciona)
- `utils/session.ts` - `getCurrentUser()`: usarlo en vez de `supabase.auth.getUser()` en pantallas (sin red conserva la sesión guardada)
- `components/ColoniaPicker.tsx` - catálogo y selector de colonia (registro y editar perfil)
- `docs/SUPABASE_IMPLEMENTACION_SEMANA_2026-11-02.md` - plan de lo pendiente en Supabase (fecha límite 2026-11-07, prioridad alta)
- `components/kit/Kit.tsx` - kit de diseño compartido (ver "Sistema de diseño")
- `components/auth/AuthScreen.tsx` - marco de las pantallas de acceso
- `components/messages/ConversationList.tsx` - lista de chats (pestaña Mensajes y `/mensajes`)
- `components/AnimatedSplash.tsx` - splash animado (continúa el splash nativo)
- `components/ConfirmDialog.tsx` - `confirmDialog()` + `<ConfirmHost />`: confirmaciones con el diseño de la app (reemplaza `Alert.alert`)

## Sistema de diseño (2026-10-30)

- Toda pantalla nueva o modificada se arma con `components/kit/Kit.tsx`; no duplicar estilos a mano. Piezas: `CARD`/`CARD_SHADOW`/`Card`, `ScreenTitle`, `SectionTitle`, `Avatar` (foto o inicial, aro teal opcional), `RoundIconButton`, `Chip`/`ChipTone`, `EmptyCard`, `PetThumb`, `PrimaryButton` (píldora 52 px: teal/coral/ghost/danger), `Field` (input con etiqueta, ícono y borde teal al enfocar), `ChoiceChips` (reemplaza Pickers con pocas opciones), `ToggleTile`, `ListSection`/`ListRow` (filas tipo ajustes), `Segmented` (pastilla deslizante), `Sheet` (hoja inferior con asa y X)
- Lenguaje visual: fondo crema `#faf5e0`, tarjetas blancas `rounded-3xl` con sombra suave, botones píldora, íconos en círculos/cuadros tintados (`${color}1A`), títulos de pantalla dentro del contenido (no en la barra)
- Sin barra de navegación (`headerShown: false`): dashboard y todas las pantallas de acceso (login, register, register-extended, forgot-password, verify-otp, reset-password, email-confirmacion). Usan `useSafeAreaInsets` (en auth: prop `headerless` de `AuthScreen`; `onBack` dibuja el botón de regreso). El resto de pantallas conserva la barra teal con flecha atrás
- Confirmaciones: NO usar `Alert.alert`. Usar `confirmDialog({ title, message, confirmLabel, destructive, icon, onConfirm })` de `components/ConfirmDialog.tsx` (lo dibuja el único `<ConfirmHost />` de `_layout`; espera a que `onConfirm` termine con spinner). `destructive` = rojo, solo para borrar/bloquear. Para modales con estado propio, `ConfirmModal` (también acepta `destructive`)
- Toasts: `components/ToastConfig.tsx` (tarjeta blanca, se cierra al tocarla o con la X; `topOffset={56}` en `_layout`). Tipos: `success`, `error`, `info` y `welcome` (teal relleno; login y fin de registro)
- Animaciones con el `Animated` de RN salvo el splash: reanimated NO está mockeado globalmente en Jest (usar `jest.mock("react-native-reanimated", () => require("../../test/reanimatedMock"))` en el test que lo necesite). `react-native-safe-area-context` sí está mockeado en `test/setup.ts`
- Textos que usan Maestro y no se deben cambiar: "Inicia sesión para continuar", "Saltar", etiqueta de pestaña "Perfil", "Cerrar Sesión" (ProfileTab) y "Cerrar sesión" (modal), `testID="login-submit"`

## Uniwind scanning (IMPORTANT)

- El scanner de Tailwind v4 (via uniwind) solo escanea `app/` por defecto (`base = dirname(global.css)`).
- `app/global.css` declara `@source "../components"` para que las clases usadas en `components/` también se compilen.
- Si creas UI con `className` fuera de `app/` (p. ej. `components/`, `utils/`), verifica que exista el `@source` correspondiente; si no, esas clases no generan estilo (botones invisibles, imágenes 0x0, sin gaps).
- Clases NUEVAS (que no existían en ningún archivo, sobre todo valores arbitrarios como `bg-[#dc2626]`) pueden no aplicarse con Metro ya corriendo: el CSS de Uniwind queda en caché. Síntoma: botón con texto blanco "invisible" sobre fondo blanco. Solución: reiniciar con `npx expo start -c` (pasó el 2026-10-30 con el botón rojo de `ConfirmModal`).

## Progress

### Done
- Corregidas TODAS las versiones de paquetes a las esperadas por Expo SDK 54 (25+ paquetes)
- Creado `babel.config.js` con `babel-preset-expo`
- Agregadas `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` al perfil `development` en `eas.json`
- Agregado `overrides` en `package.json` para forzar `@react-navigation/core@7.21.11`
- Creada edge function `send-push-notification` con autenticación OAuth2 → FCM v1
- Agregadas notificaciones push en `dashboard.service.ts` y `alerts.service.ts`
- Agregado `ToastConfig` global con branding (teal/coral/dark, 16px radius)
- Movido handler de notificaciones a `_layout.tsx` (foreground + cold start + canales Android)
- Personalizada notificación push: ownerName en título, foto, deep link con alertId, canal `emergency_alerts`
- Fix `priority: "high"` en FCM v1 (va a nivel `android`, no dentro de `notification`)
- Fix PEM→DER conversion en edge function para `crypto.subtle.importKey`
- UI/UX: corregidos bugs de contraste (texto invisible coral/coral, negro/negro en dashboard)
- UI/UX: 40 TextInput estandarizados (bg blanco + texto `#211f1e` + `placeholderTextColor`) en todas las pantallas
- UI/UX: ~30 textos `text-gray-400` → `text-gray-500`; botones saving/disabled con texto legible (`text-gray-700`)
- UI/UX: `userInterfaceStyle: "light"` en `app.json` (fix raíz dark mode de Picker/diálogos nativos) + Pickers estilizados
- UI/UX: nuevo `components/PasswordInput.tsx` (toggle ojo) en los 5 inputs de contraseña (login, register, reset-password)
- UI/UX: onboarding con flag `hasSeenOnboarding` (AsyncStorage) — se guarda al Comenzar/Saltar, se borra en logout
- Marca unificada: "La Peturnidad" → "Lucky Tracker"; tonos teal unificados (`#005e66` → `#007275`); paleta en `utils/theme.ts`
- Fix `services/alerts.service.ts`: eliminado bloque huérfano duplicado de merge (rompía `tsc --noEmit` del proyecto completo)
- Fix typecheck: ~35 errores preexistentes corregidos (`?? []` en setState de ~12 pantallas, `Button.tsx` import `Opacity` inexistente, Href cast en `_layout.tsx`); `tsconfig.json` excluye `supabase/` (código Deno, no se typecheckea con RN) — proyecto en **0 errores**
- Fix pull-to-refresh: `historias.tsx`, `panel-moderacion.tsx`, `grupos/[id].tsx` usaban `refreshing={loading}` (spinner nunca aparecía) → estado `refreshing` + `handleRefresh`
- Eliminado código muerto: `components/dashboard/*` (6 archivos) y `components/SkeletonLoader.tsx` (no importados)
- Restaurado flujo de edición de mascota: botón "Editar" en el PetDetailModal local de dashboard (recibe `onEdit={handleStartEdit}`, antes se pasaba pero se ignoraba)
- UI/UX: `KeyboardAvoidingView` en login, register, register-extended, reset-password (teclado ya no tapa inputs)
- Auto-login: `index.tsx` y `login.tsx` verifican `supabase.auth.getSession()` al abrir → si hay sesión, van directo a dashboard (o email-confirmacion / register-extended según estado)
- UI/UX: header teal sólido (`#007275`, título/back blanco, weight 700) en `_layout.tsx` + `<ErrorBoundary>` envolviendo el `<Stack>`
- UI/UX: `components/Skeleton.tsx` (Skeleton/ListSkeleton/CardSkeleton con pulsación Animated) — reemplaza ActivityIndicators full-screen en dashboard, mensajes, grupos, historias
- UI/UX: `components/EmptyState.tsx` (ícono/título/subtítulo/botón de acción) en grupos, historias, comunidad, panel-moderacion, mensajes
- UX verify-otp: auto-verifica al llegar a 8 dígitos (filtra no-dígitos) + `textContentType="oneTimeCode"`
- Recarga al enfocar: `useFocusEffect` + ref `firstFocus` en grupos, mensajes, comunidad (omite carga inicial, refresca al volver)
- Lint en **0 errores, 0 warnings** (reglas de React Hooks de SDK 58 en su nivel por defecto). Efectos de carga de datos van DESPUÉS de las funciones que llaman (justo antes del primer `return`/`if (loading)`), para cumplir `react-hooks/immutability`; la llamada inicial lleva `// eslint-disable-next-line react-hooks/set-state-in-effect -- <motivo>`. En `useCallback`, leer `const uid = user?.id` en vez de `user.id` tras el guard (`preserve-manual-memoization`). Valores `Animated.Value` con `useState(() => new Animated.Value(x))`, no `useRef(...).current` (`react-hooks/refs`). Los warnings `exhaustive-deps` se suprimen: los `exhaustive-deps` se suprimen con `// eslint-disable-next-line react-hooks/exhaustive-deps` colocado ANTES de la línea de cierre del hook (`}, []);` — no antes del `useEffect` — con comentario justificativo
- CI/CD: `.github/workflows/ci.yml` (push main + PR, `bun install --frozen-lockfile` + `bun run lint` + `bun run typecheck`); script `typecheck` en `package.json`
- Generated types: `types/database.ts` (18 tablas + 5 funciones RPC, helpers `Tables`/`TablesInsert`/`TablesUpdate`); `services/dashboard.service.ts` usa alias de `Row` (`UserProfile`, `Pet`, `EmergencyAlert`, `FoundPet` — campos opcionales `string | null`); `EmergencyAlertWithOwner`/`FoundPetWithDetails` siguen manuales (joins calculados)
- Buscador: `app/buscar.tsx` (tabs Mascotas/Grupos/Usuarios, debounce 300ms) + `services/search.service.ts` (`ilike`, límite 20, muestra dueño/miembros/ciudad); botón 🔍 en header del dashboard; política RLS `Authenticated users can view all pets` agregada
- Refactor dashboard: `app/dashboard.tsx` (759 líneas) — UI en `components/dashboard/*` (TabBar, DashboardSkeleton, PetDetailModal, PetForm con estado local + subida de imagen, HomeTab, ProfileTab con foto de perfil, EmergencyTab, FeedTab, ComunidadTab); `utils/format.ts` para `formatDate`
- Fix crítico Uniwind: el scanner solo cubría `app/`; agregado `@source "../components"` en `app/global.css` (restauraba botones invisibles, gaps faltantes e imágenes 0x0 en el dashboard refactorizado)
- Rediseño EmergencyTab: grid 2×2 de cards con Ionicons (megaphone/eye/clipboard/checkmark-circle), estado activo `bg-[#211f1e]`
- Overhaul de iconos: emojis → Ionicons en toda la app (dashboard completo + 12 pantallas: buscar, comunidad, seguidores, perfil/[id], panel-moderacion, mensajes, mensajes/[id], historias, grupos, grupos/[id], email-confirmacion); `EmptyState.icon` ahora es `keyof typeof Ionicons.glyphMap`; dog/cat via MaterialCommunityIcons; ProfileTab como menú con chevrons
- Sistema de 3 colores: teal `#007275` (primario: CTAs, selecciones, éxito), coral `#ff7e70` (acento: emergencias, badges, empty states), dark `#211f1e` (texto/superficies) + neutros cream/gris; ~11 tonos sueltos eliminados; rojo SOLO destructivo/errores; tokens actualizados en `utils/theme.ts`
- Modal branded: `components/ConfirmModal.tsx` (reutilizable, teal/coral/dark) reemplaza el `Alert.alert` de cerrar sesión en `dashboard.tsx` (`handleLogout` abre modal, `handleLogoutConfirm` ejecuta signOut con spinner)

### Auditoría pre-lanzamiento (2026-10-24)
- Supabase remoto: migraciones `20261024000001_prelaunch_rls_hardening` y `20261024000002_messaging_blocks_push` (WITH CHECK en UPDATE, `anon` sin SECURITY DEFINER, mensajes solo de participantes y sin bloqueados, DM/chat de grupo únicos, `found_pets` rellenado por trigger desde la alerta, `device_tokens` PK=`token` con RPC `register_device_token`, moderadores pueden borrar contenido, realtime en `messages`)
- Edge functions: `delete-account` (v1, borrado de cuenta exigido por Google Play) y `send-push-notification` (v7: reclamo atómico `notified_at`, destinatario desde la alerta, lotes FCM, solo borra tokens UNREGISTERED)
- App: Eliminar cuenta (ProfileTab), reportar/bloquear usuarios (`perfil/[id]`), realtime en chat, chat de grupo vía RPC `join_group_conversation`, contraseña 8+ con letras y números (`passwordError`, plan free sin leaked-password protection), auth sin loops de back-stack, deep link de notificación en cold start vía `consumePendingNotificationUrl`
- `eas.json`: `preview` y `production` ahora llevan las variables de Supabase (production = AAB); `app.json` bloquea permisos de ubicación/audio no usados
- Código muerto eliminado: alerts/matching/storage services, Button, ComunidadTab, MoreOptionsDrawer
- `npx tsc` no resuelve el compilador en esta máquina: usar `bun run typecheck` o `node node_modules/typescript/bin/tsc --noEmit`
- `types/database.ts` regenerado el 2026-10-24 (RPC nuevas y columnas `notified_at`); sin casts en `saveFcmToken` ni `getGroupChat`
- Cliente tipado: `createClient<Database>` en `utils/supabase.ts`; `types/index.ts` ahora DERIVA de `Tables<>` (no duplicar columnas a mano). Al cambiar el esquema: aplicar migración → regenerar `types/database.ts` (MCP `generate_typescript_types`) → `bun run typecheck` para ver qué rompe. Las uniones de texto (`role`, `status`, `category`, `target_type`) se estrechan con `Override<>` en `types/index.ts` y con `as` en el servicio
- Íconos (2026-10-24): `icon.png`, `adaptive-icon.png`, `splash-icon.png` y `favicon.png` generados desde `Isotipo_color_Salmon.png` (hexágono salmón sobre crema `#faf5e0`; antes eran los de la plantilla de Expo). `app.json`: fondo del ícono adaptable y del splash en `#faf5e0`. Para la ficha de Play Store: `assets/store/play-store-icon-512.png` (se sube en Play Console, no va en el build). Verificado visualmente en el build del 2026-10-24 (se ve bien). Para regenerarlos: script de PowerShell con System.Drawing (centra el isotipo; adaptable al 620/1024 para respetar la zona segura de Android)
- Build nuevo generado el 2026-10-24 con todo lo anterior (ícono, bandeja, seguridad, tokens push, términos); el usuario confirmó que se ve bien. Para QA o terceros usar el perfil `preview` (APK, enlace/QR de expo.dev, sin cuenta de Expo); `development` solo sirve con `npx expo start`. El APK viejo (SDK 54) no sirve y las versiones anteriores al esquema nuevo fallan contra el Supabase actual. Pendiente: probar el flujo completo con 2 cuentas en teléfono real

### Rediseño UI y fixes (2026-10-29/30)
- Splash animado (`components/AnimatedSplash.tsx`, montado en `_layout.tsx` sobre el `<Stack>`): huellas color isotipo `#f08374` caminando → halo + 2 latidos con onda y vibración suave → wordmark → zoom. ~2.2 s; con "reducir movimiento" solo fade. Tiempos como constantes al inicio del archivo
- Rediseño completo con el kit (ver "Sistema de diseño"): Feed, Emergencia, Inicio (+ PetForm con tamaño en pastillas y PetDetailModal como hoja inferior), Mensajes y chat, Perfil, perfil ajeno, editar perfil, seguidores, bandeja, preferencias, seguridad, todo auth y onboarding, buscar, grupos, comunidad, historias, cómo usar, FAQ, moderación, PostForm, TabBar, ConfirmModal y +not-found. Sin cambios de lógica, servicios ni props
- Helpers nuevos en `utils/format.ts`: `formatTimeAgo` ("hace 3 h") y `formatShortTime` (hora o "12 oct")
- Descartado el rediseño "estilo Instagram" (spec/plan del 2026-10-29 y su stash): no retomarlo
- **Fix subida de imágenes** (`dashboardService.uploadImage`): la imagen local se lee con `new File(uri).arrayBuffer()` de `expo-file-system` (declarado en `package.json`). Antes `fetch("file://...")` no resolvía las rutas con `%25` de Expo Go (`ExperienceData/%2540...`), devolvía el texto "File not found" (14 bytes) y eso se subía como foto (perfil/mascotas/posts quedaban en blanco con "unknown image format"). Si el archivo sale vacío ya no se sube. Archivos dañados previos: `select bucket_id, name from storage.objects where (metadata->>'size')::int < 100;` y volver a subirlos desde la app
- Confirmaciones: los 12 `Alert.alert` (dashboard, mensajes, comunidad, historias) pasaron a `confirmDialog` (ver "Sistema de diseño"); eliminar cuenta, eliminar grupo y bloquear usuario usan `ConfirmModal` con `destructive`
- Toast `welcome` y sin barras superiores en dashboard y auth (ver "Sistema de diseño")
- Tests: 23 suites / 174 tests (kit, ConversationList, ToastConfig, ConfirmDialog, HomeTab/PetForm/PetDetailModal, EmergencyTab, AnimatedSplash, upload con expo-file-system)

### Correcciones de la auditoría local (2026-10-31)
Solo app, sin cambios en Supabase ni build generado todavía. Tests: 26 suites / 194 tests. No probado en teléfono.
- **Sin red:** `getCurrentUser()` conserva la sesión guardada; el dashboard ya no muestra "Perfil incompleto" si falla la carga (`profileLoadFailed`, botón Reintentar) y editar perfil regresa en vez de mostrar el formulario vacío
- **Cerrar sesión:** solo este dispositivo (`scope: "local"`) y también sin red (Supabase borra la sesión local aunque devuelva error)
- **Colonia:** editar perfil usa código postal + `ColoniaPicker`, igual que el registro. Las alertas comparan con igualdad exacta: no volver a texto libre
- **Chat:** carga los últimos 500 mensajes (sin paginar los anteriores); "Hoy/Ayer" por día de calendario; safe area inferior y teclado con `behavior="padding"` + altura real del header (`HeaderHeightContext` de `expo-router/react-navigation`, no de `@react-navigation/elements`: expo-router trae su propia copia)
- **Parciales hasta aplicar el plan de Supabase:** salir de un grupo también borra `conversation_participants` desde el cliente; si la otra persona salió de un chat 1:1 se muestra "Conversación cerrada" y se desactiva el envío
- **Eliminado:** `EmptyState`, `ThemedText`, `ThemedView`, `hooks/`, `constants/Colors.ts`, `utils/theme.ts` (las menciones anteriores en este archivo son historial), script `reset-project`, `supabase/.temp/` de git y las dependencias `axios`, `expo-blur`, `expo-image-manipulator`, `expo-location`, `expo-symbols`, `react-native-webview`, `@react-navigation/drawer`, `react-native-url-polyfill`. Varias son nativas: el cambio llega con el próximo build
- **`ajv` se conserva a propósito:** no tiene imports, pero es un `ajv` 8 en la raíz junto a `ajv` 6 de ESLint; quitarlo cambia cómo se resuelven paquetes y no se pudo descartar que rompa algo

### Legal (páginas web) — REVISIÓN PENDIENTE
- La app enlaza a `https://luckytracker.com.mx/terms` y `https://luckytracker.com.mx/policy` (constantes en `utils/legal.ts`): checkbox obligatorio en `app/register.tsx` y entradas en Perfil → Ayuda. Las mismas URLs van en Play Console
- **Semana del 2026-10-26 (próxima semana): revisar esas 2 páginas** una vez que el equipo web aplique los cambios documentados en Todoist. Al revisar, verificar con WebFetch que existan estos puntos (al 2026-10-24 NO estaban: eran textos genéricos de sitio web):
  - Privacidad: datos reales de la app (nombre, teléfono, fecha de nacimiento, dirección/ciudad/CP, fotos, mascotas, publicaciones, mensajes, bloqueos/reportes, token push); uso de la dirección para alertas a vecinos; qué ven otros usuarios y el contacto compartido al reportar una mascota encontrada; proveedores (Supabase, Firebase Cloud Messaging, Expo) y país de sus servidores; eliminación de cuenta (Perfil → Eliminar cuenta) y qué se borra; retención; derechos ARCO (LFPDPPP) con domicilio del responsable; edad mínima; fecha de última actualización; correo de contacto en texto plano
  - Términos: conducta prohibida; licencia sobre el contenido del usuario; moderación (reportar/bloquear, retiro de contenido, suspensión); alertas colaborativas sin garantía; recomendación de seguridad al entregar mascotas; edad mínima; fecha de actualización
  - Play Console además pide una URL de eliminación de cuenta (puede ser una sección de `/policy`, p. ej. `#eliminar-cuenta`) y el formulario Data safety coherente con la política
  - Si algo sigue faltando, no subir a producción hasta corregirlo

### Cambios OPCIONALES de mantenimiento (no requeridos para QA ni para Play Store)
Se aplicaron el 2026-10-24 a petición del usuario y se decidió dejarlos. No cambian lo que ve el usuario; sirven para mantener el código. Si hay que justificarlos o explicarlos, esto es lo que son:

**Cliente Supabase tipado con `Database`**
- Qué: `createClient<Database>(...)` en `utils/supabase.ts` y `types/index.ts` reescrito para DERIVAR de `Tables<>` (`types/database.ts`) en vez de duplicar columnas a mano.
- Por qué: un nombre de columna/tabla mal escrito o un cambio de esquema falla al compilar (`bun run typecheck`) en vez de fallar en el teléfono; además destapó que los tipos a mano marcaban como no nulo lo que la base permite nulo (posible crash) y un campo `email` en `UserProfile` que no existe en la tabla.
- Cómo explicarlo en una frase: "el compilador ahora conoce el esquema real de la base de datos".
- Límite: los `select("...")` con joins se validan de forma parcial; no reemplaza probar los flujos.

**Archivos tocados por este cambio (solo tipos, salvo lo marcado)**
- `utils/supabase.ts` (genérico), `types/index.ts` (derivado), `types/database.ts` (regenerado: RPC nuevas + `notified_at`)
- Estrechamientos de uniones con `as` (sin efecto en ejecución): `services/announcements.service.ts`, `comments.service.ts`, `groups.service.ts`, `profile.service.ts`, `reports.service.ts`
- `services/messages.service.ts`: `groupNames[conv.group_id ?? ""]` evita indexar con `null` en un chat de grupo
- Quitados los casts `as any` de `saveFcmToken` (`dashboard.service.ts`) y `getGroupChat` (`groups.service.ts`)
- **Los únicos dos con efecto en ejecución:**
  - `app/notificaciones.tsx`: `push_enabled`, `lost_pet_alerts` y `found_pet_alerts` nulos se muestran como activados (`?? true`). Verificar que el default de esas columnas en `notification_preferences` sea `true`; si no, ajustar el `??`.
  - `app/mensajes/[id].tsx`: `created_at` nulo usa `?? 0` al decidir si se muestra el separador de fecha.

**Cómo revertirlo si se quiere**
- Todo está sin commit al momento de escribir esto. Revertir en este orden: línea del genérico en `utils/supabase.ts` (volver a `createClient(...)`), `types/index.ts` y los `as`/`??` de los archivos listados. `types/database.ts` puede quedarse (es solo el esquema).
- Tras revertir: `bun run typecheck` y `bun run lint` deben seguir en 0.

**Otras mejoras ofrecidas y NO hechas**
- Si alguien te bloqueó, su contenido sigue visible para ti (solo se oculta el de quienes bloqueas tú; los DM sí se bloquean en ambos sentidos vía RPC).
- Pets y listas de grupos no se filtran por bloqueo.
- Vecinos con espacios al inicio/fin en `address` no reciben la alerta de mascota perdida.
- Guardar la fecha de aceptación de términos en el perfil (hoy solo se valida el checkbox al registrarse).

### Pendientes por integrar (detectados 2026-10-24; ninguno bloquea QA)
Orden sugerido por costo/beneficio. Tokens = estimado aproximado.
1. ~~**Límites de creación**~~ HECHO 2026-10-24 (migración `20261024000003_rate_limits`, aplicada y probada): trigger `enforce_rate_limit` por tabla — posts 10/h, comentarios 30/h, mensajes 30/min, anuncios 5/h, alertas 5/día, reportes 10/h, historias 5/día, grupos 3/día. La fecha `created_at` la fija el servidor (no se puede antedatar). Para cambiar un límite: `drop trigger trg_rate_limit on <tabla>` y recrearlo con otros argumentos. El mensaje en español llega al toast vía `error.message`. Sin cambios en la app ni build
2. ~~**Cambio de contraseña y correo con sesión iniciada**~~ HECHO 2026-10-24: pantalla `app/seguridad.tsx` (Perfil → Configuración → Cuenta y seguridad). Pide la contraseña actual (reautentica con `authService.signIn`), valida la nueva con `passwordError` y cambia con `updatePassword`; el correo usa `authService.changeEmail` (enlace de confirmación al correo nuevo, el actual sigue vigente hasta confirmar). Sin build. En Supabase (Auth → Sign In / Providers → Email) conviene dejar activo "Secure email change" para que se confirme desde ambos correos
3. ~~**Paginación del feed**~~ HECHO 2026-10-24: `postsService.getAllPosts(before?, limit = FEED_PAGE_SIZE)` pagina por cursor (`created_at < before`, 20 por página); `dashboard.tsx` guarda `feedHasMore`/`loadingMoreFeed` y `loadMoreFeed` agrega la página sin duplicar; `FeedTab` pide más con `onScroll` cerca del final (sigue siendo `ScrollView`, no se pasó a `FlatList`). Límite conocido: los posts de usuarios bloqueados se filtran en el cliente, así que una página puede verse corta. `postsService.getFeed` (solo seguidos) no se usa en ningún lado
4. ~~**Bandeja de notificaciones**~~ HECHO 2026-10-24: `send-push-notification` v8 inserta una fila en `notifications` por destinatario (mismas preferencias que el push; se guarda aunque no tenga token); pantalla `app/bandeja.tsx` (Perfil → Notificaciones, con contador de no leídas; "Preferencias de notificaciones" es la pantalla `app/notificaciones.tsx` de antes); tocar un aviso lo marca leído y abre su `data.url` (solo rutas que empiezan con `/`). `notificationsService`: `getInbox` (últimos 50), `getUnreadCount`, `markRead`, `markAllRead`. Sin build. Límites conocidos: sin realtime (se actualiza al enfocar la pantalla y con pull-to-refresh), sin retención/borrado automático de filas viejas, y los avisos anteriores a v8 no existen en la bandeja
5. ~~**Tests**~~ HECHO 2026-10-24 (suite: 16 suites, 120 tests, cobertura global ~29%, umbral en `jest.config.js` subido a 27/22/23/28): chat (`messages.service.test.ts`, `app/conversation.test.tsx` con realtime simulado), dashboard (`dashboard.service.test.ts`: subida de imágenes, borrar mascota, alertas, "lo encontré", token push; `FeedTab.test.tsx`: botón de eliminar por rol, bloqueados, scroll infinito), push (`__tests__/functions/send-push-notification.test.ts` carga la edge function Deno con `Deno`/`jsr:` simulados y el mock de supabase; se verificó con mutaciones que detecta borrar tokens por cualquier error, perder el filtro de colonia o ignorar preferencias). También: bandeja y posts (`notifications.service.test.ts`, `posts.service.test.ts`). `testTimeout` 20 s porque con caché frío el primer render superaba 5 s. NO cubierto: `app/dashboard.tsx` completo (900+ líneas, solo sus servicios y `FeedTab`), pantallas sociales, `perfil/[id]`, `seguridad`, `bandeja`, y el flujo real de FCM/Supabase (requiere probar en teléfono). Los mocks compartidos `test/supabaseMock.ts` ahora incluyen `rpc`, `functions.invoke` y `storage`
- Total estimado: ~175-300k tokens
- Antes de producción también (no son código de la app): SMTP propio en Supabase (el correo por defecto tiene límite bajo por hora), plan Pro o respaldos manuales (el free pausa el proyecto tras ~7 días sin actividad y no tiene respaldos), reporte de caídas (Sentry), fichas de Play Console y pruebas en teléfono real
- Ver también: "Plan de avatares" y "Cambios OPCIONALES de mantenimiento" más abajo

### Edge Functions
- `send-push-notification` (v8) - envía notificaciones FCM v1 con soporte para imagen, canal Android, badge iOS
### SDK 58 (actualizado desde SDK 54)
- `expo@58.0.19`, dependencias alineadas con `expo install --fix`; `expo-doctor` sin problemas
- `app.json`: eliminados `newArchEnabled`, `edgeToEdgeEnabled` y `navigationBar` (SDK 58 ya no los acepta); agregados plugins `expo-image` y `expo-status-bar`. La barra de navegación de Android ya no se oculta por configuración
- Jest 30 + `jest-expo` 58; `test/setup.ts` mockea `@expo/vector-icons` (expo-font intenta cargar fuentes en Jest)
- `eslint.config.js` ignora `.expo/`, `supabase/` y `legacy/`
- Canal Android `emergency_alerts` sin `sound`: en `expo-notifications` 58, `sound: "default"` se interpreta como archivo de sonido propio y avisa que no existe
- Build de desarrollo: `eas build --profile development --platform android`; el APK de SDK 54 no sirve con SDK 58

### Consideraciones futuras

#### Plan de avatares (decidido 2026-10-24: hacerlo DESPUÉS de QA / lanzamiento)
- **Opción 1 hecha en parte (2026-10-30)**: `Avatar` en `components/kit/Kit.tsx` (foto o inicial sobre teal) ya se usa en todos los sitios listados abajo y reemplazó la imagen remota de gstatic de ProfileTab. Falta solo el color determinista por `user_id` (hoy siempre teal)
- No bloquea Play Store ni QA. Un cambio nativo obligaría a otro build en pleno QA; por eso se pospone.
- Opción 1 (recomendada, JS puro, sin build): componente `components/Avatar.tsx` con iniciales sobre círculo de color de la paleta (teal/coral/dark), color determinista por `user_id`. Props: `uri`, `name`, `size`. Usa `uri` si hay foto; si no, iniciales. Recordar el `@source "../components"` (ver Uniwind scanning)
- Opción 2 (`blobatar`, requiere build nuevo): ver sección siguiente
- Dónde reemplazar la imagen por defecto (~8 sitios): `ProfileTab`, `FeedTab`, `comunidad`, `mensajes`, `mensajes/[id]`, `buscar`, `seguidores`, `perfil/[id]`, miembros en `grupos/[id]`
- ProfileTab hoy usa una imagen remota (gstatic) como foto por defecto: sustituirla por `Avatar`
- Verificar al terminar: `bun run typecheck`, `bun run lint`, `npx jest`; revisar en teléfono la fluidez de las listas largas
- Estimado: ~40 mil tokens (iniciales) / ~80 mil (blobatar)

#### Avatares con `blobatar` (no implementado)
- Paquete `blobatar` (npm, MIT, v2.7.0): avatares geométricos deterministas a partir de un string (p. ej. email). Para RN: `@blobatar/react-native`
- Uso previsto: avatar por defecto cuando el usuario no tiene foto de perfil (`ProfileTab`, listas de comunidad/mensajes/buscar). No reemplaza la foto subida
- Requiere `react-native-svg` (código nativo, hoy no está en `package.json`): instalar con `npx expo install react-native-svg` + `bun add blobatar @blobatar/react-native`, y **generar un build nuevo** (`eas build --profile development --platform android`); recargar JS no basta
- `size` es obligatorio (RN no tiene caja CSS de la que heredar). El componente no usa `className`; si se envuelve, el wrapper debe vivir en `app/` o `components/` (ver Uniwind scanning)
- En listas largas, envolver con `React.memo` y verificar rendimiento en dispositivo (cada avatar es un árbol SVG)
- Verificar compatibilidad de `react-native-svg` con RN 0.88 antes de instalar
