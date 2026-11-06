# Lucky Tracker (formerly "La Peturnidad")

Community app for finding lost pets. Users register their pets, publish emergency alerts when a pet goes missing, and the community (neighbors, groups, followers) helps spot and reunite them. It's a lightweight social network on top of a lost & found core: profiles, posts, community notices, groups, direct and group messaging, and a moderation panel.

## Tech stack

- **Client**: [Expo](https://expo.dev) SDK 54 (React Native 0.81, React 19) + [Expo Router](https://docs.expo.dev/router/introduction) (file-based routing in `app/`)
- **Styling**: Uniwind (Tailwind CSS for React Native)
- **Backend**: [Supabase](https://supabase.com) — Auth, Postgres (with RLS), Storage, Edge Functions
- **Push**: Firebase Cloud Messaging via the `send-push-notification` Edge Function
- **Tests**: Jest + React Native Testing Library (unit), Maestro (E2E)
- Legacy: an older Express/MySQL backend is kept in `legacy/` but is **not used**.

## Getting started

```bash
bun install            # CI uses bun; npm install also works
npx expo start
```

From the Expo CLI output you can open the app in a development build, an Android emulator, an iOS simulator, or Expo Go. Supabase credentials go in `.env.local` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).

| Command | What it does |
|---|---|
| `bun run lint` | ESLint |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Jest unit tests (`test:coverage` for coverage) |
| `maestro test .maestro/flows/` | E2E flows (see [`docs/E2E_TEST_RESULTS.md`](docs/E2E_TEST_RESULTS.md)) |

## Project status

12 development phases completed, from the backend foundation to a design system and automated tests. See [`PROGRESS.md`](PROGRESS.md) for the detailed log and open work.

## Documentation

| Doc | Purpose |
| --- | --- |
| [`PROGRESS.md`](PROGRESS.md) | **Living dev log** — every phase, bug and fix, plus open technical debt. Source of truth for current state |
| [`BACKLOG.md`](BACKLOG.md) | Short-term task list |
| [`AGENTS.md`](AGENTS.md) | Commands and conventions for coding agents |
| [`docs/APP_OVERVIEW.md`](docs/APP_OVERVIEW.md) | Entry point for the product docs: general flow, areas, known issues |
| [`docs/SCREENS.md`](docs/SCREENS.md) | Every screen: route, purpose, and what each user interaction triggers |
| [`docs/AUTH.md`](docs/AUTH.md), [`docs/DASHBOARD.md`](docs/DASHBOARD.md) | Screenshot-backed area docs |
| [`docs/SUPABASE_SCHEMA.md`](docs/SUPABASE_SCHEMA.md) | Supabase schema: tables, RPC functions, RLS policies, storage, migrations |
| [`docs/MILESTONES.md`](docs/MILESTONES.md) | Condensed history by phase and the original design proposal |
| [`docs/BRANDING.md`](docs/BRANDING.md) | Brand colors and their roles |
| [`docs/E2E_TEST_RESULTS.md`](docs/E2E_TEST_RESULTS.md) | E2E results, coverage and missing flows |
| [`docs/E2E_SESSION_STATUS.md`](docs/E2E_SESSION_STATUS.md) | Handoff notes for the ongoing E2E work |
| [`docs/images/`](docs/images/) | Screenshots per area (`AUTH`, `Dashboard`) |

## Core flow

1. **Onboarding → Auth**: welcome carousel, then login/register, email confirmation, and profile completion (name, phone, birth date, neighborhood in Tijuana).
2. **Dashboard**: 5 sections — Feed, Home (pets), Community (notices), Emergency (lost/found alerts), Profile.
3. **Social layer**: follow users, direct and group messaging, neighborhood groups, public profiles, successful reunion stories.
4. **Moderation**: reports handled by admin/moderator roles in a dedicated panel.

See [`docs/SCREENS.md`](docs/SCREENS.md) for the full screen-by-screen breakdown.
