# Lucky Tracker — App Documentation

> General flow, functionality, and process documentation for the app. Built from `docs/SCREENS.md`, `docs/SUPABASE_SCHEMA.md`, `docs/SUPABASE_PENDING_CODE.md`, and screenshot review in `docs/images/`. Scope: AUTH + Dashboard areas only (see [Scope note](#scope-note)).

## What the app does

Community app for finding lost pets. Users register pets, publish emergency alerts when one goes missing, and the community (neighbors, groups, followers) helps spot and reunite them — a lightweight social network layered on a lost & found core.

## Tech stack

- **Client**: Expo (React Native) + Expo Router (file-based routing, `app/`)
- **Backend**: Supabase — Auth, Postgres (RLS), Storage, Edge Functions
- **Navigation**: React Navigation (bottom tabs, native stack, drawer)
- Legacy Express/MySQL backend exists in the codebase but is unused.

## Global session flow

- **Automatic entry**: on open, checks active session — no session → welcome/login; unconfirmed email → Confirm Email; confirmed + profile → Dashboard; confirmed, no profile → Complete Profile.
- **Screen protection**: all non-auth screens re-check session on open; no user → redirect to start.
- **Notices**: temporary success/error toast per action. Destructive actions (delete, log out) require confirmation first.
- **Data freshness**: screens refresh on focus or pull-to-refresh; no live/websocket channel. The only "live" surface is push notifications — tapping one opens the relevant screen (e.g. an emergency alert).

## Areas

| Area doc | Covers | Screens | Images reviewed |
|---|---|---|---|
| [`AUTH.md`](AUTH.md) | Onboarding, login, registration, password recovery, email confirmation | §1-8 of `SCREENS.md` | 12/12 |
| [`DASHBOARD.md`](DASHBOARD.md) | Main app: 5-tab dashboard (Feed/Inicio/Comunidad/Emergencia/Perfil), messages, groups, notifications, edit profile | §9-29 of `SCREENS.md` (partial — see scope note) | 31/31 |

## Reference docs

| Doc | Purpose |
|---|---|
| [`SCREENS.md`](SCREENS.md) | Full screen-by-screen catalog: route, purpose, every user event and what it triggers |
| [`SUPABASE_SCHEMA.md`](SUPABASE_SCHEMA.md) | Current DB schema: tables, RLS policies, storage buckets, migration history |
| [`SUPABASE_PENDING_CODE.md`](SUPABASE_PENDING_CODE.md) | Gaps between code and Supabase, feature backlog, architecture issues, implementation checklist |
| `images/AUTH/`, `images/Dashboard/` | Screenshots backing the area docs above |
| `old/` | Original Spanish versions of the 3 reference docs |
| [`FLOW_DIAGRAM.html`](FLOW_DIAGRAM.html) | Interactive navigation graph (AUTH + Dashboard), click a node for its route/purpose/events |
| [`FLOW_DIAGRAM_SCREENS.html`](FLOW_DIAGRAM_SCREENS.html) | Same graph, but click a node to see its actual screenshot(s) — for debugging flow vs. real UI |

## Scope note

This documentation pass covers **AUTH** and **Dashboard** areas only — the two with screenshot coverage (`docs/images/`). Screens 16-28 in `SCREENS.md` (Buscar, Comunidad full-page, Historias, Grupos detail, Mensajes/Chat, Seguidores, Perfil público, Panel de Moderación, standalone Notificaciones/Editar Perfil) have no image folder yet and their flow isn't fully confirmed, so they're intentionally left text-only in `SCREENS.md` for now rather than given area docs.

## Known issues / flags found during review

- **Branding leftover**: push notifications still show the old app name **"La-Peturnidad"** instead of "Lucky Tracker" — see [`DASHBOARD.md`](DASHBOARD.md#observations--flags).
- **Undocumented transient state**: a brief "processing registration" loading state appears between Register submit and Confirm Email — see [`AUTH.md`](AUTH.md#observations--flags).
- **Undocumented modal**: Delete Pet confirmation ("Eliminar mascota... esta acción no se puede deshacer") wasn't called out as its own state until img 31 surfaced it — see [`DASHBOARD.md`](DASHBOARD.md#observations--flags).
- Supabase backend gaps (missing tables, missing Edge Function, key inconsistency) — see [`SUPABASE_PENDING_CODE.md`](SUPABASE_PENDING_CODE.md).

## Resolved gaps

- Pet Detail window previously had no screenshot; closed by img 29 (`docs/images/Dashboard/29.jpeg`).

## Parked / future work

- Expand coverage to screens 16-28 (no image folder yet) once screenshots/flow are confirmed for Buscar, full Comunidad, Historias, Grupos detail, Mensajes/Chat, Seguidores, public Perfil, Panel de Moderación.
