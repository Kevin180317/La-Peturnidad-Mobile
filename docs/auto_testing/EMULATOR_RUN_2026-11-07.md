# Emulator run — 2026-11-07

Detailed report of the automated session run on 2026-11-07: a local Android release build of `QA_auto`, the Maestro E2E suite, and the screenshot campaign that replaced the pre-redesign images in `docs/images/`. Related: [`../E2E_TEST_RESULTS.md`](../E2E_TEST_RESULTS.md) (coverage and backlog), [`../E2E_SESSION_STATUS.md`](../E2E_SESSION_STATUS.md) (handoff), [`../DASHBOARD.md`](../DASHBOARD.md) and [`../AUTH.md`](../AUTH.md) (screens with images).

## Summary

| Item | Result |
|---|---|
| Local release build (x86_64) | Succeeded, 16 min 59 s, 41 MB APK |
| Maestro E2E suite (`.maestro/flows`) | **5 / 5 passed**, 2 min 41 s |
| Screenshot campaign | 52 screenshots of 40 screens captured, 16 flows in `.maestro/screenshots/` |
| Flow diagrams | Rewritten: 39 nodes, 53 screenshots attached (`docs/flow/graph-data.js`) |
| App bugs found | None blocking; 4 observations below |
| Not captured | New Password, found-pet confirmation, OS push notification, register processing state |
| Data left in the live Supabase project | Yes, on the two test accounts (inventory and cleanup below) |

## Environment

| Item | Value |
|---|---|
| Host | Linux 5.4, Node 20.10 (too old for Expo SDK 58, which wants >= 22.13), Bun 1.4.3, Java 17, Gradle 9.4.1 |
| Emulator | AVD `Pixel_8`, Android API 37 (`google_apis_playstore_ps16k`, x86_64), 1080x2400, headless (`-no-window -gpu swiftshader_indirect`) |
| Tooling | Maestro 2.11.0, adb (Android SDK platform-tools), ImageMagick for post-processing |
| App | `com.idarko.lapeturnidad`, branch `QA_auto` at `33fa8b5` plus uncommitted docs changes (app code unchanged) |
| Backend | The live Supabase project (the only one), with the public anon key from `.env` |
| Accounts | Normal test account ("Test User") and an admin test account, both from `.maestro/.env` (gitignored) |

Status bar was cleaned with Android demo mode (clock 10:00, full battery, wifi). The gear and shield icons stay because they are system status icons.

## Build

1. `bun install --frozen-lockfile` refreshed `node_modules` (it was stale: `expo-router/react-navigation` was missing, which made Jest fail in `test/setup.ts`).
2. `npx expo prebuild` fails on Node 20.10 (`parseEnv is not a function`). Worked around by running it with Bun's runtime: `bunx --bun expo prebuild --platform android --clean --no-install`.
3. Gradle also calls `node`. A throwaway wrapper script named `node` (outside the repo) that runs `bun --bun "$@"` was put first on `PATH`.
4. `./gradlew assembleRelease -PreactNativeArchitectures=x86_64 --no-daemon` built `android/app/build/outputs/apk/release/app-release.apk` (debug keystore signing from the Expo template; not a store build). `android/` is gitignored.
5. `adb install -r`, then launched with `monkey`.

Recommendation: upgrade Node to >= 22.13 on this machine so `npx expo ...` and Jest work without workarounds.

## E2E suite (`.maestro/flows`, CI flows)

Run with `maestro test -e TEST_EMAIL=... -e TEST_PASSWORD=... --format junit .maestro/flows/` against the release APK.

| # | Flow | Result | Time |
|---|---|---|---|
| 01 | Onboarding skip leads to login | Passed | 12 s |
| 02 | Login rejects empty form | Passed | 12 s |
| 03 | Login shows auth error on wrong password | Passed | 28 s |
| 04 | Login, reach dashboard, auto-login after relaunch | Passed | 41 s |
| 05 | Logout confirm modal returns to onboarding then login | Passed | 1 min 8 s |

This also validates the 2026-11-05 adaptation of flow 05 and the `complete-profile` subflow to UI V2 (`testID="confirm-modal-confirm"`); the test account already had a profile, so `complete-profile` was not exercised in this run.

## Screenshot campaign

Capture flows live in `.maestro/screenshots/` (not run by CI). Screenshots are written by `takeScreenshot` to `~/.maestro/tests/<timestamp>/<flow>/takeScreenshot/out/`, then resized to 540 px wide JPEG (quality 74) into `docs/images/`.

| Flow | Purpose | Writes data? |
|---|---|---|
| `01-auth-public` | Onboarding x3, login, register, forgot password; OTP, confirm email and complete profile via deep link | No |
| `02-dashboard-user` | Login and the five tabs | No |
| `03-seed-pet` | Register pet "Luna" (photo, form) | Yes: 1 pet |
| `04-pet-views` | Pet list, detail, edit, delete confirmation (cancelled) | No |
| `05-feed-post` | Publish a social post with an image | Yes: 1 post |
| `06-feed-forms` | Publish an Anuncio | Yes: 1 notice |
| `07-post-form-filled` | Filled social form, discarded with Back | No |
| `08-feed-emergencia` | Feed segments, Emergencia tab, create-alert confirmation (cancelled) | No |
| `09-profile-screens` | Inbox, edit profile, security, preferences, how-to, FAQ, delete-account and logout dialogs (cancelled) | No |
| `10-groups` | Create a group, group detail | Yes: 1 group |
| `11-stories` | Publish a success story | Yes: 1 story |
| `12-social` | Search, public profile of the admin, follow, send a chat message | Yes: 1 follow, 1 chat, 1 message |
| `13-messages-followers` | Mensajes tab, Seguidores | No |
| `14-report-moderation` | Report the admin (Spam), log in as admin, moderation panel | Yes: 1 report |
| `15-cleanup-switch-user` | Dismiss the report as admin, log out, back to the normal account | Modifies the report |
| `16-login-user` | Log in as the normal account from onboarding | No |

Warning: the flows marked "Yes" are not idempotent; re-running them duplicates data. See `.maestro/screenshots/README.md`.

### Coverage

Captured (40 screens): onboarding x3, login, register, confirm email, complete profile, forgot password, verify OTP; Inicio (empty, with pet), pet form (filled, edit), pet detail, delete-pet confirmation; Feed x3 segments, post form (empty, filled, Anuncio); Emergencia (grid, selector, create-alert confirmation, Mis alertas, Encontradas); Mensajes tab, chat; Perfil (profile, menu), edit profile, security, notification preferences, inbox, how-to, FAQ, logout and delete-account dialogs; groups (list, create, detail), success stories (empty, form, published); search (two states), public profile (4 states), followers; moderation panel.

Not captured, and why:

| Screen | Reason |
|---|---|
| New Password (`/reset-password`) | Needs a recovery session from a real OTP; deep link without it was not attempted to avoid sending an email |
| Found-pet confirmation | Needs a second account's active alert; creating an alert would push-notify real neighbors in the live project |
| Active alerts (Perdidas / Mis alertas with data) | Same reason as above |
| OS push notification | Needs FCM delivery to a second device; not verified end to end |
| Register processing (transient) | Real signup would create an account and send an email |
| Legal pages (web) | External site |

### Privacy handling

- The live project holds posts by other people. Own fake content was published first so it sits at the top of Feed; one older notice by another user (Feed → Anuncios) shows a real-looking name, which was blurred in the saved image.
- Admin profile screenshot with the admin email address (`dash-perfil-admin`) was discarded.
- Remaining images show only test data: "Test User", `test@test.email.com`, phone `6641234567`, the admin's brand profile, groups named "2" and "Grupo 1", and placeholder pet illustrations drawn for the run.

### Issues hit while capturing (and fixes, all in the flows)

| Problem | Fix |
|---|---|
| `takeScreenshot` rejects paths outside the workspace | Use a relative `OUT=out`, collect from `~/.maestro/tests` |
| Onboarding step 1 captured during the splash | Wait for the text "Reporta" |
| Android photo picker: first open shows a banner, later opens expanded; selection needs "Done"; pet photos go through a crop step ("CROP") while post photos do not | Wait for "Done" explicitly; tap "CROP" only in the pet flow; coordinates `17%,62%` first run, `50%,46%` afterwards |
| `hideKeyboard` on Android sends Back when no keyboard is open, closing the post modal | Remove it when the keyboard is not showing |
| Swipe down dismisses the post modal | Do not swipe inside the form |
| Keyboard covers the second field of bottom sheets | `hideKeyboard` between fields |
| "Crear grupo" appears as title and button | Tap `index: 1` |
| Story form button is "Publicar", not "Publicar historia" (that is the empty-state CTA) | Fixed |
| Search found no user for "Admin Lucky" | Search matches fields separately; use "Admin" |
| Pet list thumbnail still loading in a screenshot | Open and close the detail first to cache the photo |

## Observations about the app

1. **Search by full name fails.** Searching "Admin Lucky" (first and last name written together) returned "Sin resultados", while "Admin" finds the user. Search matches each name field separately instead of the full name.
2. **Confirm Email copy.** The button still reads "Reenviar email" while other screens say "correo electrónico" (a copy fix from Phase 11 did not reach this button).
3. **Auto-capitalization in free-text fields.** Pet characteristics typed as "Mancha blanca en el pecho" are shown as "Mancha blanca en El pecho", and colors/group names show "Café Con Blanco", "Hacienda El Colorado" (words are capitalized on input or on display).
4. **Unexplained unread badge.** A "1" appeared on the Mensajes tab of the normal account after it sent its first chat message to the admin; the chat list subtitle did not show an unread count at the time. The admin never replied. Not investigated; worth checking how `getUnreadCount` treats own messages.
5. `/comunidad` has no inbound navigation (already documented in `FEED.md`).

## Data left in the live Supabase project

Created by the campaign, all on the two test accounts:

| Account | Data |
|---|---|
| Normal ("Test User", `test@test.email.com`) | Pet "Luna" with photo; social post "Milo y Luna ya son mejores amigos..." with image; notice "Jornada de vacunación gratuita"; group "Vecinos de Hacienda el Colorado"; success story "Milo"; 1:1 chat with the admin and one message; following the admin |
| Admin (`admin@luckytracker.com`) | +1 follower; +1 conversation; a report from the normal account (dismissed by flow 15; the final state was not re-checked in the panel) |

No emergency alert was created, so no push notifications were sent. Storage objects: 1 pet photo (`pet-images`), 1 post image (`posts`). The final app state is logged out of both accounts.

Cleanup: delete the content from the app (trash icons, "Eliminar grupo", pet "Eliminar"), or use "Eliminar cuenta" on the normal test account (the Edge Function removes its rows, chats and files), then unfollow state disappears with it. The admin keeps one empty conversation unless it is cleared.

## Reproducing the run

```bash
bun install --frozen-lockfile
bunx --bun expo prebuild --platform android --clean --no-install
# put a `node` wrapper that runs `bun --bun "$@"` first on PATH (Node 20.10 is too old)
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=x86_64 --no-daemon
adb install -r app/build/outputs/apk/release/app-release.apk
cd .. && maestro test -e TEST_EMAIL=... -e TEST_PASSWORD=... .maestro/flows/
```

Screenshot flows need the pet photos in the emulator gallery (`adb push` two images to `/sdcard/Pictures` and broadcast `MEDIA_SCANNER_SCAN_FILE`), and `-e OUT=out` plus, for flow 14, `-e ADMIN_EMAIL=... -e ADMIN_PASSWORD=...`.
