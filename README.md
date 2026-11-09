# Lucky Tracker (formerly "La Peturnidad")

Community app for finding lost pets. Users register their pets, publish emergency alerts when a pet goes missing, and the community (neighbors, groups, followers) helps spot and reunite them. Built as a lightweight social network layered on top of a lost & found core: profiles, posts, community notices, groups, direct/group messaging, and a moderation panel.

## Tech stack

- **Client**: [Expo](https://expo.dev) (React Native) + [Expo Router](https://docs.expo.dev/router/introduction) (file-based routing) — `app/` directory
- **Backend**: [Supabase](https://supabase.com) — Auth, Postgres (with RLS), Storage, Edge Functions
- **Navigation**: Expo Router (native stack) with a custom tab bar in the dashboard
- Legacy: an older Express/MySQL backend exists in the codebase but is **not used** — Supabase is the current and only backend.

## Project status

Actively evolving, 17 development phases completed (backend foundation through the UI V2 redesign, Supabase hardening and the SDK 58 upgrade); preparing for QA and launch — see [`docs/PROGRESS.md`](docs/PROGRESS.md) for the detailed dev log, [`docs/BACKLOG.md`](docs/BACKLOG.md) for open tasks, or [`docs/MILESTONES.md`](docs/MILESTONES.md) for the condensed history.

## Getting started

```bash
bun install
npx expo start
```

From the Expo CLI output you can open the app in a development build, Android emulator, iOS simulator, or Expo Go.

## Documentation

| Doc | Purpose |
| --- | --- |
| [`docs/APP_OVERVIEW.md`](docs/APP_OVERVIEW.md) | Entry point: general flow, functionality, area docs, known issues, scope notes |
| [`docs/PROGRESS.md`](docs/PROGRESS.md) | **Living dev log** (Spanish) — line-by-line record of every phase, bug, and fix as it happens. Source of truth for current state |
| [`docs/MILESTONES.md`](docs/MILESTONES.md) | **Point-in-time summary** (English) of `PROGRESS.md` by phase, plus the design-proposal origin story and open next steps. Not auto-synced with `PROGRESS.md` — re-check both if it's been a while |
| [`docs/SCREENS.md`](docs/SCREENS.md) | Every screen in the app: route, purpose, and what each user interaction triggers |
| [`docs/SUPABASE_SCHEMA.md`](docs/SUPABASE_SCHEMA.md) | Historical (2026-06-20) Supabase schema snapshot — outdated; source of truth is the remote DB and `types/database.ts` |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | Open tasks (Spanish): launch blockers, pending tests, infra, later |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Visual language, Kit components, feedback patterns, Uniwind gotchas |
| [`docs/BRANDING.md`](docs/BRANDING.md) | Brand colors and their roles |
| [`docs/auto_testing/`](docs/auto_testing/) | Report of the emulator run: build, Maestro E2E results, how the screenshots in `docs/images/` were captured |
| [`docs/FEED.md`](docs/FEED.md) | The Feed tab: Emergencias / Anuncios / Social |
| [`docs/images/`](docs/images/) | 52 screenshots of the redesigned app (`auth-*`, `dash-*`, `screen-*`), used by the area docs and the flow diagrams |

## Core flow

1. **Onboarding → Auth**: welcome carousel, then login/register, email confirmation, and profile completion (name, phone, birth date, neighborhood in Tijuana).
2. **Dashboard**: 5 tabs — Inicio (pets), Feed (emergencies, notices, social posts), Emergencia (report lost/found), Mensajes, Perfil.
3. **Social layer**: follow users, direct/group messaging, neighborhood groups, public profiles, successful-reunion stories.
4. **Moderation**: reports handled by admin/moderator roles via a dedicated panel.

See [`docs/SCREENS.md`](docs/SCREENS.md) for the full screen-by-screen breakdown and event map.
