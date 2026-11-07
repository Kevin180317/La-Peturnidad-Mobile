# Lucky Tracker — App Overview

> Entry point for the product docs: general flow, functionality, and where to find each area. Last reviewed 2026-11-07. Built from [`SCREENS.md`](SCREENS.md), [`SUPABASE_SCHEMA.md`](SUPABASE_SCHEMA.md) and the screenshots in `images/`.

## What the app does

Community app for finding lost pets. Users register pets, publish emergency alerts when one goes missing, and the community (neighbors, groups, followers) helps spot and reunite them — a lightweight social network on top of a lost & found core. Users must be 18 or older.

## Tech stack

- **Client**: Expo SDK 58 (React Native 0.88, React 19) + Expo Router (file-based routing, `app/`), styled with Uniwind (Tailwind for RN)
- **Backend**: Supabase — Auth, Postgres (RLS), Storage, Edge Functions (`send-push-notification`, `delete-account`)
- **Navigation**: Expo Router stack; the dashboard has its own 5-tab bar (`components/dashboard/TabBar.tsx`): Inicio / Feed / Emergencia / Mensajes / Perfil
- **Package manager**: Bun (`bun.lockb` is the only lockfile)
- A legacy Express/MySQL backend is kept in `legacy/` but is unused.

## Global session flow

- **Automatic entry**: on open, the app checks for an active session — no session → welcome/login; unconfirmed email → Confirm Email; confirmed with profile → Dashboard; confirmed without profile → Complete Profile. Without network, the stored session is kept (`utils/session.ts`).
- **Screen protection**: every non-auth screen re-checks the session on open; with no user it redirects to the start.
- **Feedback**: each action shows a toast. Destructive actions (delete, block, log out) ask for confirmation first (`confirmDialog` / `ConfirmModal`).
- **Data freshness**: screens refresh on focus or pull-to-refresh. Chat uses Supabase realtime on `messages`; everything else has no live channel. Push notifications open the relevant screen (e.g. an emergency alert) and are also stored in the in-app inbox (`/bandeja`).

## Areas

| Area doc | Covers | Screens |
|---|---|---|
| [`AUTH.md`](AUTH.md) | Onboarding, login, registration, password recovery, email confirmation | §1–8 of `SCREENS.md` |
| [`DASHBOARD.md`](DASHBOARD.md) | Main app: 5-tab dashboard, messages, groups, stories, notifications, security, edit profile | §9+ of `SCREENS.md` |

The screenshots in `images/` were taken before the UI V2 redesign (2026-10-29/30), so the visuals are outdated; the text in the docs reflects the current app.

## Reference docs

| Doc | Purpose |
|---|---|
| [`SCREENS.md`](SCREENS.md) | Full screen-by-screen catalog: route, purpose, every user event and what it triggers |
| [`FEED.md`](FEED.md) | The Feed tab: Emergencias / Anuncios / Social |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | Visual language, Kit components, feedback patterns, Uniwind gotchas |
| [`BRANDING.md`](BRANDING.md) | Brand colors and their roles |
| [`SUPABASE_SCHEMA.md`](SUPABASE_SCHEMA.md) | Database tables, RPC functions and the security model |
| [`SUPABASE_HARDENING_PLAN_2026-11-02.md`](SUPABASE_HARDENING_PLAN_2026-11-02.md) | Record of the Supabase plan executed on 2026-11-03/05 |
| [`LEGAL_PRIVACY_POLICY.md`](LEGAL_PRIVACY_POLICY.md), [`LEGAL_TERMS_AND_CONDITIONS.md`](LEGAL_TERMS_AND_CONDITIONS.md) | Drafts of the legal pages published at luckytracker.com.mx |
| [`PROGRESS.md`](PROGRESS.md) | Dev log by phase and open technical debt |
| [`BACKLOG.md`](BACKLOG.md) | Open tasks: launch blockers, pending tests, infra |
| [`MILESTONES.md`](MILESTONES.md) | Condensed history by phase and the original design proposal |
| [`E2E_TEST_RESULTS.md`](E2E_TEST_RESULTS.md), [`E2E_SESSION_STATUS.md`](E2E_SESSION_STATUS.md) | Maestro E2E status and handoff |
| [`FLOW_DIAGRAM.html`](FLOW_DIAGRAM.html), [`FLOW_DIAGRAM_SCREENS.html`](FLOW_DIAGRAM_SCREENS.html) | Interactive navigation graphs (AUTH + Dashboard; the second shows screenshots). Pre-redesign |
| `images/AUTH/`, `images/Dashboard/` | Screenshots backing the area docs (pre-redesign) |

## Known issues

- **Push end to end not verified**: the FCM token registers in `device_tokens`, but push delivery with the SDK 58 build still needs a test with a second device. The in-app inbox works.
- **Notification sender label**: an old build showed the sender as "La-Peturnidad". `app.json` now uses "Lucky Tracker"; confirm on a fresh build.
- **`/comunidad` is orphaned**: the screen exists but nothing links to it (see [`FEED.md`](FEED.md)).
- **Blocking is one-sided for content**: if someone blocks you, their content stays visible to you (DMs are blocked both ways).
- Open technical debt: [`PROGRESS.md`](PROGRESS.md#open-work--technical-debt). Open tasks: [`BACKLOG.md`](BACKLOG.md).

## Future work

- Refresh screenshots and flow diagrams for the redesigned UI, and add the screens that have none (search, groups, chat, followers, public profile, moderation, FAQ, how to use, inbox, security).
