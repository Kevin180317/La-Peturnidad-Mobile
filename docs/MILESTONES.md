# Milestones — Lucky Tracker

> History of what's been built and what's next. Built from `PROGRES.md` (root — the actual dev log), `docs/SUPABASE_PENDING_CODE.md`, `docs/flow_reference/` (original design proposal), and the documentation work done this pass. Project span: first commit 2025-05-31 → latest 2026-08-08.
>
> **This is a point-in-time summary, not a live mirror.** [`PROGRES.md`](../PROGRES.md) is the living dev log (Spanish, updated as work happens) and stays the source of truth for current state. This file condenses it by phase in English and adds context PROGRES.md doesn't carry (the original design proposal, this doc pass, the `SUPABASE_PENDING_CODE.md` discrepancy). It is **not auto-synced** — if PROGRES.md has moved on since this was written, trust PROGRES.md and treat this file's phase table as historical.

## How this project started

Two design artifacts in [`docs/flow_reference/`](flow_reference/) capture the original pitch, before any code: `lucky-tracker-flowchart.html` (navigation/flow diagram) and `lucky-tracker-ui.html` (8-screen UI mockup), both dated "v1.0 · 2026" and based on post-its + brand guidelines. The proposed structure was a 4-tab app (Home / Alerts / My Pets / Profile) plus an interactive map of nearby lost/found pets, built around the salmon (`#ff7e70`) / teal (`#007275`) / cream (`#faf5e0`) / dark (`#211f1e`) palette.

The palette shipped essentially as designed. The structure evolved: the built app has **5 tabs** (Feed / Inicio / Comunidad / Emergencia / Perfil) instead of the original 4, because the product grew from "lost-pet alerts" into a fuller community social network (posts, follows, groups, messaging) — see Phase 3 below. The interactive map from the original proposal was **not** built and remains open (see Next steps).

## Achieved — by phase (from `PROGRES.md`)

| Phase | What shipped |
|---|---|
| **1 · Solid foundation** | Core Supabase tables (`user_profiles`, `pets`, `emergency_alerts`, `found_pets`) + RLS, storage buckets, push notification Edge Function, unified env keys, legacy Express server moved to `legacy/` |
| **2 · Core features** | Edit pet, notification settings, Community/Notices (excluded by design: interactive map, social login — email-only) |
| **3 · Social network** | Feed/timeline, comments on posts & notices, public profiles (`/perfil/[id]`), follow system, direct messaging — tables: `posts`, `comments`, `follows`, `conversations`, `conversation_participants`, `messages` |
| **4 · Differentiation** | Followers/following screen, edit profile, automatic lost&found matching (`services/matching.service.ts`), neighborhood groups, user roles (moderator/admin), success-stories wall, moderation & reports panel, Feed/Comunidad sub-tabs (all/mine) |
| **5 · UI/UX legibility** | Fixed critical contrast bugs (invisible text), standardized all 40 text inputs, forced light theme (native dark mode was leaking into pickers/keyboard), `PasswordInput` component, `hasSeenOnboarding` flag, brand rename "La Peturnidad" → "Lucky Tracker" across UI, centralized `utils/theme.ts` |
| **6 · Cleanup & stability** | Fixed a broken merge in `alerts.service.ts` that silently killed typecheck, `tsc --noEmit` → 0 errors, real pull-to-refresh spinners, removed dead component tree, restored pet-edit flow, keyboard-avoiding views on auth screens, auto-login on active session |
| **7 · UX polish & code quality** | Solid teal header, global `ErrorBoundary`, loading skeletons, OTP auto-verify, `EmptyState` components, refresh-on-focus, 0 lint warnings, CI/CD via GitHub Actions, generated DB types (`types/database.ts`), global search (`/buscar`), `dashboard.tsx` refactored 2125 → 759 lines into `components/dashboard/*` |
| **8 · Uniwind fix + icon redesign** | Fixed a Tailwind/Uniwind scanner bug that silently dropped styles from `components/` (invisible buttons, 0×0 images), redesigned Emergency tab to a 2×2 card grid, replaced emoji icons with Ionicons app-wide |
| **9 · 3-color system** | Collapsed ~11 ad-hoc colors down to teal/coral/dark + neutrals, red reserved strictly for destructive actions, branded logout confirmation modal replacing the native `Alert.alert` |

**Also shipped outside the numbered phases**: FCM push notifications (replacing the old Edge Function), group chat + `delete_group()` RPC, unread-message badge, chat deletion, 3-step OTP password recovery, post-registration email confirmation screen, EAS build config with `android/` untracked, several RLS/RPC bugfixes for conversations and messages.

## Achieved — documentation pass (this session)

Starting point: `docs/PANTALLAS.md` (Spanish screen catalog) and no `docs/images/` review.

- Translated the 3 original Spanish docs to English, originals preserved in `docs/old/`: `SCREENS.md`, `SUPABASE_PENDING_CODE.md`, `SUPABASE_SCHEMA.md`
- Rewrote the placeholder `README.md` with real project description, stack, and doc index
- Reviewed all 31 AUTH + Dashboard screenshots against `SCREENS.md`, wrote area docs [`AUTH.md`](AUTH.md) and [`DASHBOARD.md`](DASHBOARD.md)
- Wrote [`APP_OVERVIEW.md`](APP_OVERVIEW.md) as the doc entry point
- Built two interactive flow diagrams — [`FLOW_DIAGRAM.html`](FLOW_DIAGRAM.html) (navigation graph, click for route/purpose/events) and [`FLOW_DIAGRAM_SCREENS.html`](FLOW_DIAGRAM_SCREENS.html) (same graph, click to see the actual screenshot) — self-contained, draggable, border-anchored arrows

**Findings from the screenshot audit** (now fixed in docs):
- A transient "processing registration" loading state between Register and Confirm Email wasn't documented
- The Pet Detail window had no screenshot at all — closed once 3 new images were added
- A Delete Pet confirmation modal wasn't documented as its own state
- **Still open**: push notifications show the sender as the old app name **"La-Peturnidad"** instead of "Lucky Tracker" — the Phase 5 brand rename covered in-app UI but missed the push payload/Expo project name config

## Known discrepancy to reconcile

`docs/SUPABASE_PENDING_CODE.md` (translated from the original Spanish planning doc) frames most backend work — missing tables, missing Edge Function, Phases 2-4 features — as **pending**. `PROGRES.md` shows nearly all of it as **done** (Phases 1-4 above). `SUPABASE_PENDING_CODE.md` is a stale planning snapshot, not current state — treat `PROGRES.md` and `docs/SUPABASE_SCHEMA.md` as the source of truth going forward. Worth either retiring `SUPABASE_PENDING_CODE.md` or rewriting it to only list what `PROGRES.md`'s "Pendiente" section actually still has open (below).

## Next steps

**High priority** (from `PROGRES.md` "Alta prioridad")
- No automated tests exist at any level (unit, integration, e2e)
- No account-deletion option for users

**Branding fix**
- Push notification sender label still reads "La-Peturnidad" — update payload/Expo project name to "Lucky Tracker"

**Medium/low priority backlog** (from `PROGRES.md`)
- Offline support (no cache/persistence)
- Dark mode (currently forced light by design decision)
- Analytics/crash reporting (no Sentry/PostHog)
- i18n (hardcoded Spanish, no translation system)
- Duplicate storage INSERT policies need cleanup (3 per bucket)
- `colonias.json` (3786 lines) should move server-side instead of shipping in-client
- Supabase Database Webhooks not configured (`emergency_alerts`/`messages` INSERT → push function is currently called from client/service code, not a webhook)

**From the original design proposal, still not built**
- Interactive map of nearby lost/found pets (`docs/flow_reference/lucky-tracker-flowchart.html` Flujo B) — explicitly excluded in Phase 2
- Social login (Google/Apple) — email-only by design so far

**Documentation scope still open**
- Screens 16-28 in `SCREENS.md` (Buscar, full Comunidad, Historias, Grupos detail, Mensajes/Chat, Seguidores, public Perfil, Panel de Moderación) have no screenshot folder yet — add images to extend `AUTH.md`/`DASHBOARD.md`-style area docs and the flow diagrams to cover them
- Reconcile or retire `SUPABASE_PENDING_CODE.md` per the discrepancy above
