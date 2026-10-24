# E2E Work — Session Status

> Handoff file for resuming the Maestro E2E work. Update **Last session** and **Next steps** at the end of each session.
> Detailed results and coverage live in [`E2E_TEST_RESULTS.md`](E2E_TEST_RESULTS.md).

## Last session — 2026-10-20

- **Branch:** `QA_auto` (pushed, tracking `origin/QA_auto`)
- **Last commit:** `7d7f554` docs: add E2E test results tracker
- **Done:**
  - Reviewed the Maestro setup: 5 flows (onboarding skip, login validation, bad credentials, login + auto-login, logout) + `complete-profile` subflow. All of them cover auth; no dashboard features are tested.
  - Wrote the coverage gap analysis and the P0–P3 backlog in `E2E_TEST_RESULTS.md`.
- **Not done / blocked:**
  - No tests were run. This machine has no `maestro`, `adb`, `gh` or `bun`, and `node_modules` is empty.
  - Flow status (✅\*) is inferred from commit `7ed6857` (2026-10-17), not verified.
  - The first nightly CI result (`e2e.yml`) hasn't been checked.

## Next steps (in order)

1. **Verify the baseline**
   - [ ] Install tooling, or run on a machine that has it: `bun`, Maestro CLI, Android SDK (`adb`), `gh`.
   - [ ] `bun install --frozen-lockfile`, then `bun run test` (Jest), and log the result.
   - [ ] `gh run list --workflow e2e.yml` and log the nightly result in `E2E_TEST_RESULTS.md` → Run log.
   - [ ] Or run locally: `maestro test -e TEST_EMAIL=... -e TEST_PASSWORD=... --format junit --output maestro-report.xml .maestro/flows/`
2. **Groundwork before new flows**
   - [ ] Add `testID`s: dashboard tab bar, `PetForm` fields + save, `PetDetailModal` edit/delete, EmergencyTab cards + pet picker, alert delete, `ConfirmModal` confirm/cancel, Feed "Publicar", Comunidad "Nuevo".
   - [ ] Extract a `subflows/login.yaml` (login + complete-profile) and use it from 04/05 instead of `runFlow: 04-...`.
   - [ ] Decide how to clean up test data: delete through the UI at the end of each flow, or a Supabase cleanup step in `e2e.yml`.
3. **P0 flows** (lost-pet core)
   - [ ] Add pet → [ ] Edit pet → [ ] Delete pet
   - [ ] Create emergency alert → [ ] Delete alert
   - [ ] Emergencia empty state → "Registrar mascota"
   - [ ] "Lo encontré" (blocked: needs a 2nd test account → add `E2E_TEST_EMAIL_2` / `E2E_TEST_PASSWORD_2` secrets)
4. **Afterwards:** P1 (register, forgot password/OTP, full onboarding, edit profile), then P2/P3 from the backlog.

## Open decisions

- Second test account for two-user flows (found pet, messaging, follows): create it, or seed data instead?
- Moderator account for `panel-moderacion`: is it in scope?
- Point CI at `.maestro` (uses `config.yaml`) instead of `.maestro/flows/`?

## Quick reference

- Repo secrets used by `e2e.yml`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`
- App id: `com.idarko.lapeturnidad`
- Profile bootstrap data: CP `22220` → colonia "Hacienda el Colorado"
- Only existing `testID`: `login-submit` (`app/login.tsx`)
