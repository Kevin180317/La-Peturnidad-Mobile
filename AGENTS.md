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

- Expo SDK 54, React Native 0.79, React 19
- TypeScript (strict mode)
- Bun as package manager (bun.lockb)

## Key Files

- `app/` - Expo Router pages (dashboard, register, index)
- `utils/supabase.ts` - Supabase client
- `.env.local` - local env vars

## Uniwind scanning (IMPORTANT)

- El scanner de Tailwind v4 (via uniwind) solo escanea `app/` por defecto (`base = dirname(global.css)`).
- `app/global.css` declara `@source "../components"` para que las clases usadas en `components/` también se compilen.
- Si creas UI con `className` fuera de `app/` (p. ej. `components/`, `utils/`), verifica que exista el `@source` correspondiente; si no, esas clases no generan estilo (botones invisibles, imágenes 0x0, sin gaps).

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
- Lint en **0 errores, 0 warnings**: los `exhaustive-deps` se suprimen con `// eslint-disable-next-line react-hooks/exhaustive-deps` colocado ANTES de la línea de cierre del hook (`}, []);` — no antes del `useEffect` — con comentario justificativo
- CI/CD: `.github/workflows/ci.yml` (push main + PR, `bun install --frozen-lockfile` + `bun run lint` + `bun run typecheck`); script `typecheck` en `package.json`
- Generated types: `types/database.ts` (18 tablas + 5 funciones RPC, helpers `Tables`/`TablesInsert`/`TablesUpdate`); `services/dashboard.service.ts` usa alias de `Row` (`UserProfile`, `Pet`, `EmergencyAlert`, `FoundPet` — campos opcionales `string | null`); `EmergencyAlertWithOwner`/`FoundPetWithDetails` siguen manuales (joins calculados)
- Buscador: `app/buscar.tsx` (tabs Mascotas/Grupos/Usuarios, debounce 300ms) + `services/search.service.ts` (`ilike`, límite 20, muestra dueño/miembros/ciudad); botón 🔍 en header del dashboard; política RLS `Authenticated users can view all pets` agregada
- Refactor dashboard: `app/dashboard.tsx` (759 líneas) — UI en `components/dashboard/*` (TabBar, DashboardSkeleton, PetDetailModal, PetForm con estado local + subida de imagen, HomeTab, ProfileTab con foto de perfil, EmergencyTab, FeedTab, ComunidadTab); `utils/format.ts` para `formatDate`
- Fix crítico Uniwind: el scanner solo cubría `app/`; agregado `@source "../components"` en `app/global.css` (restauraba botones invisibles, gaps faltantes e imágenes 0x0 en el dashboard refactorizado)
- Rediseño EmergencyTab: grid 2×2 de cards con Ionicons (megaphone/eye/clipboard/checkmark-circle), estado activo `bg-[#211f1e]`
- Overhaul de iconos: emojis → Ionicons en toda la app (dashboard completo + 12 pantallas: buscar, comunidad, seguidores, perfil/[id], panel-moderacion, mensajes, mensajes/[id], historias, grupos, grupos/[id], email-confirmacion); `EmptyState.icon` ahora es `keyof typeof Ionicons.glyphMap`; dog/cat via MaterialCommunityIcons; ProfileTab como menú con chevrons
- Sistema de 3 colores: teal `#007275` (primario: CTAs, selecciones, éxito), coral `#ff7e70` (acento: emergencias, badges, empty states), dark `#211f1e` (texto/superficies) + neutros cream/gris; ~11 tonos sueltos eliminados; rojo SOLO destructivo/errores; tokens actualizados en `utils/theme.ts`

### Edge Functions
- `send-push-notification` (v5) - envía notificaciones FCM v1 con soporte para imagen, canal Android, badge iOS