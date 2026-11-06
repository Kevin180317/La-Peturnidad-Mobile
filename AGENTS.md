# AGENTS.md

## Commands

- `npx expo start` - dev server (web/mobile)
- `npx expo run:android` - run on Android
- `npx expo run:ios` - run on iOS
- `bun run lint` - lint check
- `bun run typecheck` - TypeScript check (`tsc --noEmit`)
- `bun run test` - Jest unit tests (`bun run test:coverage` for coverage)
- `maestro test -e TEST_EMAIL=... -e TEST_PASSWORD=... .maestro/flows/` - E2E flows

CI (`.github/workflows/ci.yml`) runs lint, typecheck and unit tests on every push to main and every PR. `e2e.yml` runs the Maestro flows nightly.

## Build

- `npx expo prebuild` - generate native android/ios projects before building locally (`android/` is not tracked)
- EAS build: `eas build` (configure in `eas.json`)

## Architecture

- **Frontend**: Expo Router (file-based routing in `app/`), React Native
- **UI**: shared components in `components/`, dashboard tabs in `components/dashboard/`
- **Data**: one service per domain in `services/*.service.ts`, most returning `ServiceResult`
- **Styling**: Uniwind (Tailwind CSS for RN) - config in `metro.config.js`
- **Auth/DB**: Supabase (`utils/supabase.ts`); generated types in `types/database.ts`
- **Push**: `supabase/functions/send-push-notification` (FCM v1, Deno — excluded from `tsconfig.json`)
- **Legacy**: old Express server in `legacy/server/` — unused, don't build on it

## Tech Stack

- Expo SDK 54, React Native 0.81, React 19.1
- TypeScript (strict mode)
- Bun as package manager (`bun.lockb`); CI installs with `bun install --frozen-lockfile`

## Key Files

- `app/` - Expo Router screens; `app/_layout.tsx` registers routes, the header, notification handling and the `ErrorBoundary`
- `utils/supabase.ts` - Supabase client
- `utils/theme.ts`, `constants/Colors.ts` - color tokens
- `.env.local` - local env vars (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)

## Uniwind scanning (IMPORTANT)

- The Tailwind v4 scanner (via Uniwind) only scans `app/` by default (`base = dirname(global.css)`).
- `app/global.css` declares `@source "../components"` so classes used in `components/` are compiled too.
- If you add UI with `className` outside `app/` (e.g. `components/`, `utils/`), make sure a matching `@source` exists; otherwise those classes produce no styles (invisible buttons, 0×0 images, missing gaps).

## Conventions

- **Colors**: teal `#005e66` is the only action color; coral `#ff7e70` is reserved for the Emergency section; dark `#211f1e` for text and surfaces; red/`danger` only for destructive actions and errors. Use the tokens in `utils/theme.ts`. See `docs/BRANDING.md`.
- **Text inputs**: white background, `#211f1e` text, explicit `placeholderTextColor`, teal border + halo on focus. Use `PasswordInput` for passwords.
- **Feedback**: toasts via `ToastConfig`; confirmations via `components/ConfirmModal.tsx` rather than `Alert.alert`; empty lists via `EmptyState`; loading via `Skeleton`.
- **Icons**: Ionicons (MaterialCommunityIcons for dog/cat), no emojis in UI.
- **Lint**: keep 0 errors and 0 warnings. When an `exhaustive-deps` warning is intentional, put `// eslint-disable-next-line react-hooks/exhaustive-deps` right before the hook's closing line (`}, []);`, not before the `useEffect`) with a justification comment.
- **Testing**: Maestro flows rely on labels and `testID`s; add a `testID` when you touch an element that a flow needs.

## Docs

- `PROGRESS.md` - dev log and open technical debt (update it when you finish a feature or fix)
- `BACKLOG.md` - short-term tasks
- `docs/` - screens, schema, area docs, E2E status (see `README.md` for the full index)
