# Milestones — Lucky Tracker

> Condensed history of what's been built. Project span: first commit 2025-05-31 → latest 2026-10-20.
> For line-by-line detail see [`PROGRESS.md`](../PROGRESS.md), which is the source of truth. Open work lives in `PROGRESS.md` ("Open work / technical debt") and [`BACKLOG.md`](../BACKLOG.md).

## How this project started

Two design files in [`flow_reference/`](flow_reference/) capture the original pitch, before any code: `lucky-tracker-flowchart.html` (navigation/flow diagram) and `lucky-tracker-ui.html` (8-screen UI mockup), both labeled "v1.0 · 2026" and based on post-its and the brand guidelines. They proposed a 4-tab app (Home / Alerts / My Pets / Profile) plus an interactive map of nearby lost and found pets, using the salmon/coral (`#ff7e70`), teal, cream (`#faf5e0`) and dark (`#211f1e`) palette.

The palette shipped largely as designed (see [`BRANDING.md`](BRANDING.md) for how teal and coral roles changed). The structure evolved: the app has **5 tabs** (Feed / Inicio / Comunidad / Emergencia / Perfil) because the product grew from lost-pet alerts into a community social network (posts, follows, groups, messaging). The interactive map was **not** built.

## Phases

| Phase | What shipped |
|---|---|
| **1 · Solid foundation** | Core Supabase tables (`user_profiles`, `pets`, `emergency_alerts`, `found_pets`) + RLS, storage buckets, push notification Edge Function, unified env keys, legacy Express server moved to `legacy/` |
| **2 · Core features** | Edit pet, notification settings, Community notices (excluded by design: interactive map, social login) |
| **3 · Social network** | Feed, comments on posts and notices, public profiles, follows, direct messaging |
| **4 · Differentiation** | Followers/following screen, edit profile, automatic lost & found matching, neighborhood groups, user roles, success stories, moderation panel, Feed/Community sub-tabs |
| **Messaging & auth** | FCM push, group chat + `delete_group()` RPC, unread badge, chat deletion, OTP password recovery, email confirmation screen, EAS build setup, RLS/RPC fixes for conversations and messages |
| **5 · UI/UX legibility** | Contrast fixes, 40 standardized text inputs, forced light theme, `PasswordInput`, `hasSeenOnboarding` flag, rename "La Peturnidad" → "Lucky Tracker", `utils/theme.ts` |
| **6 · Cleanup & stability** | Fixed a broken merge that killed typecheck, `tsc` at 0 errors, real pull-to-refresh, dead code removed, pet edit restored, keyboard-avoiding auth screens, auto-login |
| **7 · UX polish & code quality** | Teal header, global `ErrorBoundary`, skeletons, OTP auto-verify, `EmptyState`, refresh on focus, 0 lint warnings, CI, generated DB types, global search, `dashboard.tsx` split into `components/dashboard/*` |
| **8 · Uniwind fix + icons** | Fixed the scanner bug that dropped styles from `components/`, 2×2 Emergency grid, emojis → Ionicons |
| **9 · 3-color system** | ~11 ad-hoc colors → teal/coral/dark + neutrals, red only for destructive actions, branded logout modal |
| **10 · Design system v1.0** | Teal as the only action color, coral only for Emergency, semantic tokens, input focus states, consistent radii and shadows |
| **11 · Branding & features** | Teal aligned with the website (`#005e66`), FAQ and How-to screens, copy fixes, advanced post creation with images, Android nav bar fix, expo-location SDK fix |
| **12 · Automated testing** | Jest + RNTL unit tests with a CI job, Maestro E2E flows for auth, nightly E2E workflow |

## Documentation

- Screen catalog: [`SCREENS.md`](SCREENS.md)
- Screenshot-backed area docs: [`AUTH.md`](AUTH.md), [`DASHBOARD.md`](DASHBOARD.md), with the entry point in [`APP_OVERVIEW.md`](APP_OVERVIEW.md)
- Interactive flow diagrams: [`FLOW_DIAGRAM.html`](FLOW_DIAGRAM.html), [`FLOW_DIAGRAM_SCREENS.html`](FLOW_DIAGRAM_SCREENS.html)
- Database: [`SUPABASE_SCHEMA.md`](SUPABASE_SCHEMA.md)
- Testing: [`E2E_TEST_RESULTS.md`](E2E_TEST_RESULTS.md), [`E2E_SESSION_STATUS.md`](E2E_SESSION_STATUS.md)

## Not built from the original proposal

- Interactive map of nearby lost/found pets (`flow_reference/lucky-tracker-flowchart.html`, Flow B) — excluded in Phase 2
- Social login (Google/Apple) — email only so far
