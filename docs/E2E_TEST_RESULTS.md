# E2E Test Results — Lucky Tracker

> Tracks Maestro end-to-end results and coverage. Update the **Run log** after every local or CI run, and the **Coverage** / **Backlog** tables when flows are added.
>
> - Flows: `.maestro/flows/` · subflows: `.maestro/subflows/`
> - Run locally: `maestro test -e TEST_EMAIL=... -e TEST_PASSWORD=... .maestro/flows/`
> - CI: `.github/workflows/e2e.yml` (nightly + manual, API 34 emulator, release APK, JUnit report in the `maestro-results` artifact)

## Run log

Newest first. Status: ✅ pass · ❌ fail · ⚠️ flaky · ⏳ not run.

| Date | Where | Commit | Flows run | Passed | Failed | Notes |
|---|---|---|---|---|---|---|
| 2026-10-20 | — | `8c47c90` | 0 | — | — | Baseline written. Nothing re-run: this machine has no Maestro, adb or gh. Status below is the last known result from commit history. |
| 2026-10-17 | Local (emulator) | `7ed6857` | 5 | 5* | 0 | *Inferred from the commit: flow 05 expectation fixed (logout → onboarding) and profile bootstrap subflow added. No report saved. |

**Pending:** get the first nightly CI result (`gh run list --workflow e2e.yml`) and log it here.

## Current flow results

| # | Flow | Covers | Needs credentials | Last status | Last verified |
|---|---|---|---|---|---|
| 01 | `01-onboarding-to-login.yaml` | Onboarding "Saltar" → login screen | No | ✅* | 2026-10-17 `7ed6857` |
| 02 | `02-login-validation.yaml` | Empty login form → "Campos requeridos" | No | ✅* | 2026-10-17 `7ed6857` |
| 03 | `03-login-bad-credentials.yaml` | Wrong credentials → "Error de autenticación" | No | ✅* | 2026-10-17 `7ed6857` |
| 04 | `04-login-success-and-relogin.yaml` | Login → (complete profile if new) → dashboard; auto-login after relaunch | Yes | ✅* | 2026-10-17 `7ed6857` |
| 05 | `05-logout.yaml` | Profile → "Cerrar Sesión" → ConfirmModal → onboarding → login | Yes | ✅* | 2026-10-17 `7ed6857` |
| — | `subflows/complete-profile.yaml` | Fills "Completa tu perfil" (CP 22220 / Hacienda el Colorado) | — | Used by 04 | — |

\* Not confirmed by a saved report. Re-run and replace it with a verified status.

## Coverage by screen

5 of 25 routes covered (all auth). **0 of 5 dashboard tabs** have feature coverage beyond appearing on screen.

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
| Dashboard · Feed | Post, comment, "mine" filter, delete | ❌ |
| Dashboard · Comunidad | New notice (category/title/body), comment, delete | ❌ |
| Dashboard · Perfil | Profile photo, menu actions | ❌ (logout only) |
| Social | `buscar.tsx` | ❌ |
| Social | `grupos.tsx`, `grupos/[id].tsx` | ❌ |
| Social | `mensajes.tsx`, `mensajes/[id].tsx` | ❌ |
| Social | `perfil/[id].tsx`, `seguidores.tsx` (follow/unfollow) | ❌ |
| Social | `historias.tsx`, `notificaciones.tsx` | ❌ |
| Profile | `editar-perfil.tsx` | ❌ |
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
| P2 | Feed: post / comment / delete | ⏳ Todo | — |
| P2 | Comunidad: notice / comment / delete | ⏳ Todo | — |
| P2 | Buscar (3 tabs, open result) | ⏳ Todo | Needs predictable seed data |
| P2 | Grupos: join / leave | ⏳ Todo | — |
| P2 | Mensajes: start + send | ⏳ Todo | Needs a 2nd account |
| P2 | Follow / unfollow + counters | ⏳ Todo | Needs a 2nd account |
| P2 | Historias / Notificaciones load + pull-to-refresh | ⏳ Todo | — |
| P3 | FAQ / Cómo usar navigation | ⏳ Todo | — |
| P3 | Moderation panel | ⏳ Todo | Needs a moderator account |
| P3 | Push deep link | ⏳ Todo | Manual or `openLink`; hard to run in CI |

## Infrastructure issues

| Issue | Impact | Status |
|---|---|---|
| Only 1 `testID` in the app (`login-submit`) | Flows depend on labels/placeholders and `index:` matching, so changing copy breaks them | ⏳ Open |
| Flow 05 runs all of flow 04 via `runFlow` | A full run logs in twice; slower and repeats 04's checks | ⏳ Open (extract a `login` subflow) |
| No seed / teardown for test data | Flows that create data will pile up records on the test account | ⏳ Open |
| Single test account (`E2E_TEST_EMAIL`) | Can't test two-user features (found pet, messaging, follows) | ⏳ Open |
| CI runs `.maestro/flows/`, not `.maestro` | `config.yaml` is ignored; future tags or ordering won't apply in CI | ⏳ Open |
| No saved run reports | Results can't be checked after the fact | ⏳ Open (use the CI JUnit artifact; keep local `--format junit` output) |
