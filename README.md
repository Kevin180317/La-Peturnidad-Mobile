# Lucky Tracker (formerly "La Peturnidad")

Community app for finding lost pets. Users register their pets, publish emergency alerts when a pet goes missing, and the community (neighbors, groups, followers) helps spot and reunite them. Built as a lightweight social network layered on top of a lost & found core: profiles, posts, community notices, groups, direct/group messaging, and a moderation panel.

## Tech stack

- **Client**: [Expo](https://expo.dev) (React Native) + [Expo Router](https://docs.expo.dev/router/introduction) (file-based routing) — `app/` directory
- **Backend**: [Supabase](https://supabase.com) — Auth, Postgres (with RLS), Storage, Edge Functions
- **Navigation**: React Navigation (bottom tabs, native stack, drawer)
- Legacy: an older Express/MySQL backend exists in the codebase but is **not used** — Supabase is the current and only backend.

## Project status

Actively evolving, 9 development phases completed (backend foundation through UI polish and a unified color system) — see [`PROGRES.md`](PROGRES.md) for the detailed dev log or [`docs/MILESTONES.md`](docs/MILESTONES.md) for the condensed history and open next steps. (`docs/SUPABASE_PENDING_CODE.md` is an older planning snapshot and no longer reflects current state — see the discrepancy note in `MILESTONES.md`.)

## Getting started

```bash
npm install
npx expo start
```

From the Expo CLI output you can open the app in a development build, Android emulator, iOS simulator, or Expo Go.

## Documentation

| Doc | Purpose |
| --- | --- |
| [`docs/APP_OVERVIEW.md`](docs/APP_OVERVIEW.md) | Entry point: general flow, functionality, area docs, known issues, scope notes |
| [`PROGRES.md`](PROGRES.md) | **Living dev log** (Spanish) — line-by-line record of every phase, bug, and fix as it happens. Source of truth for current state |
| [`docs/MILESTONES.md`](docs/MILESTONES.md) | **Point-in-time summary** (English) of `PROGRES.md` by phase, plus the design-proposal origin story and open next steps. Not auto-synced with `PROGRES.md` — re-check both if it's been a while |
| [`docs/SCREENS.md`](docs/SCREENS.md) | Every screen in the app: route, purpose, and what each user interaction triggers |
| [`docs/SUPABASE_SCHEMA.md`](docs/SUPABASE_SCHEMA.md) | Current Supabase schema: tables, RLS policies, storage buckets, migration history |
| [`docs/SUPABASE_PENDING_CODE.md`](docs/SUPABASE_PENDING_CODE.md) | Older planning snapshot — mostly superseded by `PROGRES.md`, see `MILESTONES.md`'s discrepancy note |
| [`docs/images/`](docs/images/) | Screenshots per app area (`AUTH`, `Dashboard`), used as reference for the docs above |
| `docs/old/` | Original Spanish versions of the docs above, kept for reference |

## Core flow

1. **Onboarding → Auth**: welcome carousel, then login/register, email confirmation, and profile completion (name, phone, birth date, neighborhood in Tijuana).
2. **Dashboard**: 5 sections — Home (pets), Emergency (lost/found alerts), Feed (posts), Community (notices), Profile.
3. **Social layer**: follow users, direct/group messaging, neighborhood groups, public profiles, successful-reunion stories.
4. **Moderation**: reports handled by admin/moderator roles via a dedicated panel.

See [`docs/SCREENS.md`](docs/SCREENS.md) for the full screen-by-screen breakdown and event map.
