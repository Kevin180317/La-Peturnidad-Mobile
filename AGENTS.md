# AGENTS.md

## Commands

- `npx expo start` - dev server (web/mobile)
- `npx expo run:android` - run on Android
- `npx expo run:ios` - run on iOS
- `npm run lint` - lint check

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

## Progress

### Done
- Corregidas TODAS las versiones de paquetes a las esperadas por Expo SDK 54 (25+ paquetes)
- Creado `babel.config.js` con `babel-preset-expo`
- Agregadas `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` al perfil `development` en `eas.json`
- Agregado `overrides` en `package.json` para forzar `@react-navigation/core@7.21.11`
- Creada edge function `send-push-notification` con autenticación OAuth2 → FCM v1
- Agregadas notificaciones push en `dashboard.service.ts` y `alerts.service.ts`
- Agregado `ToastConfig` global con branding de La Peturnidad (teal/coral/dark, 16px radius)
- Movido handler de notificaciones a `_layout.tsx` (foreground + cold start + canales Android)
- Personalizada notificación push: ownerName en título, foto, deep link con alertId, canal `emergency_alerts`
- Fix `priority: "high"` en FCM v1 (va a nivel `android`, no dentro de `notification`)
- Fix PEM→DER conversion en edge function para `crypto.subtle.importKey`

### Edge Functions
- `send-push-notification` (v5) - envía notificaciones FCM v1 con soporte para imagen, canal Android, badge iOS