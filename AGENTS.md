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