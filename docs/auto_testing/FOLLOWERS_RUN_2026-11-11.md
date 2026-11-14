# Followers flows run — 2026-11-11

Local emulator run of the new Maestro flows in `.maestro/followers/`, on branch `QA_v2` (`origin/dev` + `origin/fix/launch-backlog`, which already contains `feat-followers`). Related: [`../E2E_TEST_RESULTS.md`](../E2E_TEST_RESULTS.md), [`EMULATOR_RUN_2026-11-07.md`](EMULATOR_RUN_2026-11-07.md).

## Result

| Flow | Result |
|---|---|
| F01 private profile + follow request (two accounts) | Pass |
| F02 suggested users (dismiss) | Pass |
| F03 Buscar lists followed users | Pass |

The 5 CI flows in `.maestro/flows/` were not run. Backend: the live Supabase project; `follow_requests` and `follows` respond, so the followers migrations are applied (the `20261109` ones were not checked).

## Environment

- Host: Linux, Node 26.13 (nvm), Bun 1.4.4. Installed for this run: JDK 17 (`~/tools/jdk-17`) and Maestro 2.11.0 (`~/.maestro`). Android SDK, emulator and AVD `Medium_Phone_API_37.0` (API 37, x86_64, headless `-no-window -gpu swiftshader_indirect`) already existed.
- Build: `bun install --frozen-lockfile`, `npx expo prebuild --platform android --clean --no-install`, then `./gradlew assembleRelease -PreactNativeArchitectures=x86_64 --no-daemon` with `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` exported from `eas.json` (development profile).
- Accounts: `TEST_*` (A, "Test User") and `ADMIN_*` (B, "Admin Lucky Tracker") from `.maestro/.env`, both verified against Supabase auth first.

## Problems found while getting the flows green

| Problem | Cause | Fix |
|---|---|---|
| App closed right after launch | The APK was built without the Supabase env vars. The second build still failed because Gradle reported `createBundleReleaseJsAndAssets UP-TO-DATE` and reused the old bundle | Export the vars and rebuild with `--rerun-tasks` |
| `TEST_NAME` empty | `.maestro/.env` line `TEST_NAME=Test User` is not valid when sourced by the shell | Quote the value |
| "Editar perfil" / "Perfil privado" not found | Below the fold | `scrollUntilVisible` before tapping |
| Search result tap opened nothing | The search box also contains the user's name | `tapOn` with `below: "Usuarios"` |
| Unfollow tap opened the following list | "Siguiendo" is also a counter label | Scope to `below: "Seguidores"` |
| Logout failed from a public profile | No "Perfil" tab on that screen | `launchApp` before logout |
| F03 failed | The empty-query hint only shows when the account follows nobody | Assert "Personas que sigues" and open one |
| F01 failed on a rerun | Step 1 toggles the privacy switch; a failed run left A private, so the next run made A public again | Documented precondition (A public, B not following A) |

## Data left on the test accounts

- F02 dismissed one suggestion for `TEST_*` (stored in `dismissed_suggestions`).
- F01 restores its own state (A public, B not following A).
- Not verified: this run did not touch the `20261109` migrations (`terms_accepted_at`, `hidden_user_ids`).
