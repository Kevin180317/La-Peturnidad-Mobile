# E2E Work — Session Status

> Handoff file for resuming the Maestro E2E work. Update **Last session** and **Next steps** at the end of each session.
> Detailed results and coverage live in [`E2E_TEST_RESULTS.md`](E2E_TEST_RESULTS.md).

## Last update — 2026-11-11

- Branch `QA_v2` = `origin/dev` + `origin/fix/launch-backlog` (clean merge; `feat-followers` was already inside the backlog branch). Pushed to `origin/QA_v2`.
- New flows for the followers features in `.maestro/followers/` (F01 private profile + follow request with two accounts, F02 suggested users, F03 followed list in Buscar). All 3 passed on a local emulator. Report: [`auto_testing/FOLLOWERS_RUN_2026-11-11.md`](auto_testing/FOLLOWERS_RUN_2026-11-11.md).
- The 5 CI flows in `.maestro/flows/` were not re-run on `QA_v2`.
- Next: re-run `.maestro/flows/` on `QA_v2`, add follower flows to CI only if a second CI account is available, cover reject request and follow-from-suggestion.

## 2026-11-07 (evening)

- All 5 Maestro flows passed (5/5, 2m 41s) on a local emulator with a release APK built from `QA_auto`. Full report: [`auto_testing/EMULATOR_RUN_2026-11-07.md`](auto_testing/EMULATOR_RUN_2026-11-07.md).
- Capture flows for docs screenshots live in `.maestro/screenshots/` (not run by CI).

## Earlier on 2026-11-07

- Maestro flows were adapted to UI V2 on 2026-11-05 (`6e44296`, branch `QA_auto`). Not run since; no results recorded.
- Still true: no dashboard feature is covered, no `bun`/`maestro`/`adb` check was done on this machine today, and the nightly CI result (`e2e.yml`) hasn't been logged.
- Tabs are now Inicio / Feed / Emergencia / Mensajes / Perfil (Comunidad folded into Feed): new flows should target those.

## Previous session — 2026-10-20

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
   - [x] Tooling installed 2026-10-21: `bun` 1.4.3, Maestro 2.11.0, `adb` 36.0.0 (Android Studio SDK, `ANDROID_HOME` set). `gh` still missing. Maestro needs Java 17+: the `PATH` java is 1.8, so use Android Studio's JBR (`C:\Program Files\Android\Android Studio\jbr`) via `JAVA_HOME`.
   - [x] `bun install --frozen-lockfile` + `bun run test`: 64/65, then 65/65 (one cold-start timeout in `ConfirmModal`). Logged in `E2E_TEST_RESULTS.md`.
   - [ ] `gh run list --workflow e2e.yml` and log the nightly result in `E2E_TEST_RESULTS.md` → Run log.
   - [ ] Or run locally: `maestro test -e TEST_EMAIL=... -e TEST_PASSWORD=... --format junit --output maestro-report.xml .maestro/flows/`
2. **Groundwork before new flows**
   - [ ] Add `testID`s: dashboard tab bar, `PetForm` fields + save, `PetDetailModal` edit/delete, EmergencyTab cards + pet picker, alert delete, `ConfirmModal` cancel, Feed "Publicar".
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
- `testID`s used by flows: `login-submit` (`app/login.tsx`) and `confirm-modal-confirm` (`ConfirmModal`)
