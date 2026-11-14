# E2E Test Results — Lucky Tracker

> Tracks Maestro end-to-end results and coverage. Update the **Run log** after every local or CI run, and the **Coverage** / **Backlog** tables when flows are added.
>
> - Flows: `.maestro/flows/` (CI) · followers flows: `.maestro/followers/` (local only, two accounts) · subflows: `.maestro/subflows/`
> - Run locally: `maestro test -e TEST_EMAIL=... -e TEST_PASSWORD=... .maestro/flows/`
> - CI: `.github/workflows/e2e.yml` (nightly + manual, API 34 emulator, release APK, JUnit report in the `maestro-results` artifact)

## Run log

> Review 2026-11-07: the flows were updated for the UI V2 redesign on 2026-11-05 (commit `6e44296`: logout confirm uses `testID="confirm-modal-confirm"`, `complete-profile` matches the new phone/birth date/colonia fields). No run since then is recorded. The local `node_modules` was also stale on 2026-11-07 (`expo-router/react-navigation` missing), so Jest could not run here; reinstall with `bun install --frozen-lockfile` before the next run.

Newest first. Status: ✅ pass · ❌ fail · ⚠️ flaky · ⏳ not run.

| Date | Where | Commit | Flows run | Passed | Failed | Notes |
|---|---|---|---|---|---|---|
| 2026-11-11 | Local emulator (Medium_Phone_API_37.0, release APK x86_64) | `0b78555` (`QA_v2`) | 3 (followers) | 3 | 0 | Only `.maestro/followers/` was run; the 5 CI flows were not re-run on `QA_v2`. First attempts failed on selectors (see [`auto_testing/FOLLOWERS_RUN_2026-11-11.md`](auto_testing/FOLLOWERS_RUN_2026-11-11.md)). |
| 2026-11-07 | Local emulator (Pixel_8, API 37, release APK x86_64) | `33fa8b5` + local docs | 5 | 5 | 0 | All 5 flows passed in 2m 41s (see [`auto_testing/EMULATOR_RUN_2026-11-07.md`](auto_testing/EMULATOR_RUN_2026-11-07.md)) |
| 2026-11-05 | — | `6e44296` | 0 | — | — | Flows 05 and `complete-profile` updated for UI V2. Not run. |
| 2026-10-21 | Local (Jest, not Maestro) | `e2bce33` | 65 unit tests | 64 first run; 65 on rerun | 0 | `bun install --frozen-lockfile`, `bun run lint` and `bun run typecheck` clean. `ConfirmModal` › "renders title, message and default labels" timed out (5 s) once on a cold full run (suite took 21 s) and passed in isolation (555 ms) — cold-start flake, watch for repeats. Maestro not run yet. |
| 2026-10-20 | — | `8c47c90` | 0 | — | — | Baseline written. Nothing re-run: this machine has no Maestro, adb or gh. Status below is the last known result from commit history. |
| 2026-10-17 | Local (emulator) | `7ed6857` | 5 | 5* | 0 | *Inferred from the commit: flow 05 expectation fixed (logout → onboarding) and profile bootstrap subflow added. No report saved. |

**Pending:** get the first nightly CI result (`gh run list --workflow e2e.yml`) and log it here.

## Current flow results

| # | Flow | Covers | Needs credentials | Last status | Last verified |
|---|---|---|---|---|---|
| 01 | `01-onboarding-to-login.yaml` | Onboarding "Saltar" → login screen | No | ✅ | 2026-11-07 (emulator) |
| 02 | `02-login-validation.yaml` | Empty login form → "Campos requeridos" | No | ✅ | 2026-11-07 (emulator) |
| 03 | `03-login-bad-credentials.yaml` | Wrong credentials → "Error de autenticación" | No | ✅ | 2026-11-07 (emulator) |
| 04 | `04-login-success-and-relogin.yaml` | Login → (complete profile if new) → dashboard; auto-login after relaunch | Yes | ✅ | 2026-11-07 (emulator) |
| 05 | `05-logout.yaml` | Profile → "Cerrar Sesión" → ConfirmModal → onboarding → login | Yes | ✅ | 2026-11-07 (emulator) |
| — | `subflows/complete-profile.yaml` | Fills "Completa tu perfil" (CP 22220 / Hacienda el Colorado) | — | Used by 04 | — |

Verified 2026-11-07 on a local emulator; JUnit result summarized in the run report.

### Followers flows (`.maestro/followers/`, not run by CI)

Need `TEST_*` and `ADMIN_*` accounts (`.maestro/.env`, plus `TEST_NAME` and `ADMIN_FIRST_NAME`; quote values with spaces). They write to the live Supabase; see `.maestro/followers/README.md`.

| # | Flow | Covers | Last status | Last verified |
|---|---|---|---|---|
| F01 | `01-private-profile-follow-request.yaml` | A turns "Perfil privado" on; B sees the lock, requests, cancels, re-requests; A accepts in "Solicitudes de seguimiento"; B unfollows; A back to public. Precondition: A public, B not following A. | ✅ | 2026-11-11 (emulator) |
| F02 | `02-suggested-users.yaml` | "Sugeridos para ti" in Feed and dismiss one suggestion (skips silently if none; the dismissal is permanent) | ✅ | 2026-11-11 (emulator) |
| F03 | `03-buscar-following-list.yaml` | Buscar → Usuarios lists "Personas que sigues"; opening one shows the profile | ✅ | 2026-11-11 (emulator) |

## Coverage by screen

5 of 27 routes covered (all auth). **0 of 5 dashboard tabs** (Inicio, Feed, Emergencia, Mensajes, Perfil) have feature coverage beyond appearing on screen.

| Area | Screen / feature | E2E covered |
|---|---|---|
| Auth | `index.tsx` (onboarding: skip) | ✅ |
| Auth | `index.tsx` (onboarding: all slides to "Comenzar") | ❌ |
| Auth | `login.tsx` | ✅ |
| Auth | `register-extended.tsx` (complete profile) | ✅ (bootstrap only) |
| Auth | `register.tsx` | ❌ |
| Auth | `email-confirmacion.tsx` | ❌ |
| Auth | `forgot-password.tsx` → `verify-otp.tsx` → `reset-password.tsx` | ❌ |
| Session | Auto-login on relaunch | ✅ |
| Session | Logout | ✅ |
| Dashboard · Inicio | Add / edit / delete pet (`PetForm`, `PetDetailModal`) | ❌ |
| Dashboard · Emergencia | Create alert, delete alert, "found pet", empty state | ❌ |
| Dashboard · Feed | Segments (Emergencias / Anuncios / Social), post, comment, tag filter, delete | ❌ |
| Dashboard · Mensajes | Conversation list, open chat | ❌ |
| Dashboard · Perfil | Profile photo, menu actions | ❌ (logout only) |
| Social | `buscar.tsx` | ⚠️ Usuarios tab, empty query (F03); search and the other tabs ❌ |
| Social | `grupos.tsx`, `grupos/[id].tsx` | ❌ |
| Social | `mensajes.tsx`, `mensajes/[id].tsx` | ❌ |
| Social | `perfil/[id].tsx` (private lock, follow request, unfollow) | ✅ (F01) |
| Social | `solicitudes.tsx` (accept) | ✅ (F01); reject ❌ |
| Social | Suggested users (`SuggestedUsers`) | ✅ (F02, dismiss only; follow from a suggestion ❌) |
| Social | `seguidores.tsx` | ❌ |
| Social | `historias.tsx`, `notificaciones.tsx`, `bandeja.tsx` | ❌ |
| Profile | `seguridad.tsx` (change password / email) | ❌ |
| Profile | `editar-perfil.tsx` | ⚠️ "Perfil privado" switch only (F01) |
| Info | `faq.tsx`, `como-usar.tsx` | ❌ |
| Admin | `panel-moderacion.tsx` | ❌ |
| Push | Deep link `alertId` → alert | ❌ |

## Backlog (missing flows)

| Priority | Flow | Status | Blockers / notes |
|---|---|---|---|
| P0 | Add pet | ⏳ Todo | Needs testIDs in `PetForm`; image picker step optional |
| P0 | Edit pet | ⏳ Todo | Regression test for the restored "Editar" button |
| P0 | Delete pet | ⏳ Todo | Also serves as cleanup |
| P0 | Create emergency alert | ⏳ Todo | Requires a pet (chain after Add pet) |
| P0 | Delete alert | ⏳ Todo | Also serves as cleanup |
| P0 | Mark pet found ("Lo encontré") | ⏳ Todo | Needs a 2nd account or a seeded alert |
| P0 | Emergencia empty state → "Registrar mascota" | ⏳ Todo | Needs an account with no pets |
| P1 | Register (validation + duplicate email) | ⏳ Todo | Full signup needs email confirmation |
| P1 | Forgot password → OTP → reset | ⏳ Todo | Validation only, unless OTP can be read from Supabase |
| P1 | Full onboarding + no repeat after relaunch | ⏳ Todo | — |
| P1 | Edit profile | ⏳ Todo | — |
| P2 | Feed: post / comment / delete, and the three segments | ⏳ Todo | — |
| P2 | Anuncios: new notice / comment / delete | ⏳ Todo | — |
| P2 | Buscar (3 tabs, open result) | ⏳ Todo | Needs predictable seed data |
| P2 | Grupos: join / leave | ⏳ Todo | — |
| P2 | Mensajes: start + send | ⏳ Todo | Needs a 2nd account |
| P2 | Follow / unfollow + counters | ⚠️ Follow request and unfollow done (F01); public follow and counters Todo | Admin account is the 2nd account |
| P2 | Historias / Notificaciones load + pull-to-refresh | ⏳ Todo | — |
| P3 | FAQ / Cómo usar navigation | ⏳ Todo | — |
| P3 | Moderation panel | ⏳ Todo | Needs a moderator account |
| P3 | Push deep link | ⏳ Todo | Manual or `openLink`; hard to run in CI |

## Infrastructure issues

| Issue | Impact | Status |
|---|---|---|
| Only 2 `testID`s used by flows (`login-submit`, `confirm-modal-confirm`) | Flows depend on labels/placeholders, so changing copy breaks them (UI V2 already broke flow 05 and `complete-profile`) | ⏳ Open |
| Flow 05 runs all of flow 04 via `runFlow` | A full run logs in twice; slower and repeats 04's checks | ⏳ Open (extract a `login` subflow) |
| F01 is not re-runnable after a failure | Step 1 toggles the privacy switch, so A must start public and B must not follow A (check `user_profiles.is_private`, `follows`) | ⏳ Open |
| No seed / teardown for test data | Flows that create data will pile up records on the test account | ⏳ Open |
| Single test account in CI (`E2E_TEST_EMAIL`) | CI can't test two-user features. Locally the followers flows use `TEST_*` + `ADMIN_*` | ⏳ Open (CI has no second account) |
| CI runs `.maestro/flows/`, not `.maestro` | `config.yaml` is ignored; future tags or ordering won't apply in CI | ⏳ Open |
| No saved run reports | Results can't be checked after the fact | ⏳ Open (use the CI JUnit artifact; keep local `--format junit` output) |
