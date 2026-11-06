# Lucky Tracker — App Overview

> Entry point for the product docs: general flow, functionality, and where to find each area. Built from [`SCREENS.md`](SCREENS.md), [`SUPABASE_SCHEMA.md`](SUPABASE_SCHEMA.md) and the screenshots in `images/`.

## What the app does

Community app for finding lost pets. Users register pets, publish emergency alerts when one goes missing, and the community (neighbors, groups, followers) helps spot and reunite them — a lightweight social network on top of a lost & found core.

## Tech stack

- **Client**: Expo SDK 54 (React Native) + Expo Router (file-based routing, `app/`)
- **Backend**: Supabase — Auth, Postgres (RLS), Storage, Edge Functions
- **Navigation**: Expo Router stack; the dashboard uses its own 5-tab bar (`components/dashboard/TabBar.tsx`)
- A legacy Express/MySQL backend is kept in `legacy/` but is unused.

## Global session flow

- **Automatic entry**: on open, the app checks for an active session — no session → welcome/login; unconfirmed email → Confirm Email; confirmed with profile → Dashboard; confirmed without profile → Complete Profile.
- **Screen protection**: every non-auth screen re-checks the session on open; with no user it redirects to the start.
- **Feedback**: each action shows a temporary success/error toast. Destructive actions (delete, log out) ask for confirmation first.
- **Data freshness**: screens refresh on focus or pull-to-refresh; there's no live/websocket channel. The only "live" surface is push notifications — tapping one opens the relevant screen (e.g. an emergency alert).

## Areas

| Area doc | Covers | Screens | Images reviewed |
|---|---|---|---|
| [`AUTH.md`](AUTH.md) | Onboarding, login, registration, password recovery, email confirmation | §1–8 of `SCREENS.md` | 12/12 |
| [`DASHBOARD.md`](DASHBOARD.md) | Main app: 5-tab dashboard (Feed/Inicio/Comunidad/Emergencia/Perfil), messages, groups, stories, notifications, edit profile | §9–29 of `SCREENS.md` (partial — see scope note) | 29/29 |

## Reference docs

| Doc | Purpose |
|---|---|
| [`SCREENS.md`](SCREENS.md) | Full screen-by-screen catalog: route, purpose, every user event and what it triggers |
| [`SUPABASE_SCHEMA.md`](SUPABASE_SCHEMA.md) | DB schema: tables, RPC functions, RLS policies, storage buckets, migration history |
| [`MILESTONES.md`](MILESTONES.md) | Condensed history by phase and the original design proposal |
| [`BRANDING.md`](BRANDING.md) | Brand colors and their roles |
| [`FLOW_DIAGRAM.html`](FLOW_DIAGRAM.html) | Interactive navigation graph (AUTH + Dashboard); click a node for its route/purpose/events |
| [`FLOW_DIAGRAM_SCREENS.html`](FLOW_DIAGRAM_SCREENS.html) | Same graph; click a node to see its screenshot(s) |
| `images/AUTH/`, `images/Dashboard/` | Screenshots backing the area docs |

## Scope note

The area docs cover **AUTH** and **Dashboard** only — the two areas with screenshots. These screens have no screenshots yet and are documented as text only in `SCREENS.md`: Search detail flows, Community (full page), Group Detail, Chat, Followers, public Profile, Moderation Panel, FAQ and How to use.

Screenshots were taken before Phase 10/11, so colors differ from the current app (e.g. the active tab was red/coral; it's now teal, except Emergency).

## Known issues

- **Push sender label**: an older build showed the notification sender as **"La-Peturnidad"** (see [`DASHBOARD.md`](DASHBOARD.md#observations)). `app.json` now uses "Lucky Tracker"; confirm on a fresh build.
- **Post fields not saved**: the post form collects location, tags, URLs and multiple images, but only the text and first image are stored — see [`BACKLOG.md`](../BACKLOG.md).
- Open technical debt: [`PROGRESS.md`](../PROGRESS.md#-open-work--technical-debt).

## Future work

- Add screenshots for the text-only screens listed in the scope note, then extend the area docs and flow diagrams to cover them.
