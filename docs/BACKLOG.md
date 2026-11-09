# Backlog — Lucky Tracker

> Updated 2026-11-09. What is done is in [`PROGRESS.md`](PROGRESS.md) and [`../AGENTS.md`](../AGENTS.md).

## Next (this week)

### Blocks the launch
- [ ] **Phone QA with the new build** (`preview` APK): registration with age and per-country phone, readable colonias, edit profile with an old phone, confirmation email pointing to `luckytracker.com.mx`, inbox without emojis, text limits, Feed (Emergencias / Anuncios / Social) and the new post form
- [x] **Publish `/policy` and `/terms`** — published and checked live on 2026-11-09 (owner, address, providers and `us-west-1`, ARCO, `#eliminar-cuenta` anchor, age 18, date). Contact email is `contact@prometheustij.com`, in plain text (footer included). Open legal-text decisions live in `La-Peturnidad-Web/BACKLOG.md`
- [x] **Fill in the legal placeholders** — done 2026-11-09 in `LEGAL_PRIVACY_POLICY.md` and `LEGAL_TERMS_AND_CONDITIONS.md` (Prometheus R&D, Fresnos 18 Tijuana, `contact@prometheustij.com`, `us-west-1`, November 3, 2026)
- [ ] **Play Console**: store listing, adults-only target audience (18+), content rating (user content and chat), Data safety form consistent with the policy, account-deletion URL
- [ ] **`production` build** (AAB) once everything above is tested

### Cleanup after the 2026-11-07 emulator run
- [ ] Delete the test data the screenshot campaign left in the live Supabase project (pet Luna, one post, one notice, group "Vecinos de Hacienda el Colorado", story "Milo", chat with the admin, follow, one report) — inventory in `auto_testing/EMULATOR_RUN_2026-11-07.md`. Checked 2026-11-09 (read-only): there are **two** pets named Luna (2026-10-17 and 2026-11-07), the group and the story exist, and the live project has 7 profiles, 10 pets, 8 posts, 2 notices, 3 groups, 6 conversations, 5 follows. Which profiles are test accounts has to be confirmed before deleting
- [x] Report from flow 14: confirmed `dismissed` in the database on 2026-11-09

### Findings from the emulator run (small app fixes)
- [ ] (not reproducible from the code, confirm on the emulator) User search matches first and last name separately: "Admin Lucky" finds nobody, "Admin" does
- [ ] (not reproducible from the code: the query already excludes own messages) Unread badge on the Mensajes tab showed "1" for the account that had just sent a message; check how `getUnreadCount` treats own messages
- [x] Confirm Email button now says "Reenviar correo electrónico" (2026-11-09)
- [ ] (not reproducible from the code: nothing capitalizes words; likely the emulator keyboard) Free-text fields capitalize every word on display or input ("Mancha blanca en El pecho", "Café Con Blanco")

### Supabase state checked on 2026-11-09 (read-only, then two migrations applied)
- [x] Applied to the live project: `terms_accepted_at` (column + trigger, existing profiles stay NULL) and `hidden_user_ids` (RPC `get_hidden_user_ids`, execute only for `authenticated`). Verified by query. They were applied with `apply_migration`, so their remote versions are `20261109221351` and `20261109221400`, not the file names
- [x] The four `feat-followers` migrations (`20261107000001` to `04`) were already applied on the remote
- [x] The three SECURITY DEFINER functions that take ids as parameters (`create_conversation`, `create_group_conversation`, `delete_group`) were read: they check `auth.uid()` and use an empty `search_path`; nothing to change
- Advisors: `public_profiles` as SECURITY DEFINER view (ERROR) is intentional, it hides phone, address and birth date; 17 SECURITY DEFINER functions callable by signed-in users (WARN, reviewed above for the id-taking ones); leaked-password protection is off (free plan). Performance advisors were not run
- Local migration file names and remote versions differ (for example `20261105000001_close_profile_access` locally, `20261103233201` remotely), so do not use `supabase db push`; this is part of the baseline task in Later
- `enforce_phone_format` is applied remotely: any bulk import of users must send E.164 phones, an 18+ birth date and respect the rate limits
- The next build must be generated **after** these migrations (done) because the app now sends `terms_accepted_at`

### Pending tests
- [ ] **FCM push end to end** with the SDK 58 build (needs a second device; the token already registers)
- [ ] On the new build: delete account, moderation and chats after migration B
- [ ] Add dashboard E2E flows (pets, post, group, chat); only the 5 auth flows exist and they passed 5/5 on 2026-11-07 — see `E2E_TEST_RESULTS.md`

### Infra (free plan)
- [ ] Weekly manual backup (`supabase db dump`) and open the dashboard weekly: the free plan has no backups and pauses the project after ~7 days of inactivity
- [ ] Decide on the Pro plan before having real customers
- [ ] Crash reporting (Sentry) before production
- [ ] Supabase dashboard settings: SMTP (Resend), "Secure email change", 8-digit OTP, allowed URL `https://luckytracker.com.mx/email-confirmed` (details in `SUPABASE_HARDENING_PLAN_2026-11-02.md`)

## Later (no date)
- [ ] Baseline migration, so the database can be recreated from scratch (older migrations were applied from the dashboard; `posts_media_location_tags_links` is applied remotely but has no file in `supabase/migrations/`)
- [ ] Text length limits in the database (today only `maxLength` in the app)
- [x] Remove `@react-native-picker/picker` (unused; it is native, so it ships with a build) and its mock in `__tests__/app/editar-perfil.test.tsx` — done 2026-11-09 on `fix/launch-backlog`; takes effect with the next native build
- [ ] Deterministic avatar color by `user_id` (always teal today)
- [x] If someone blocked you, their content is still visible to you; pets and group lists are not filtered by blocks — done 2026-11-09 on `fix/launch-backlog`: RPC `get_hidden_user_ids` (migration `20261109000002`, **not applied to the remote yet**; until then the app falls back to hiding only the users you blocked) feeds Feed, search (pets, groups, users), comunidad, historias, seguidores, the group list and group members. Still visible both ways: someone's profile page (`perfil/[id]`), the chat list (DMs are already blocked both ways server-side) and lost-pet alerts
- [x] Store the terms acceptance date in the profile (`terms_accepted_at`) — code and migration `20261109000001_terms_accepted_at.sql` done 2026-11-09 on `fix/launch-backlog`; **the migration is NOT applied to the remote yet** and the app change needs the next build. Users created before it stay NULL (cannot be reconstructed)
- [ ] Delete notifications older than 90 days (`pg_cron`; must match the privacy policy). Postponed on purpose, not needed for the launch: steps, SQL and rollback in [`NOTIFICATIONS_RETENTION_PLAN.md`](NOTIFICATIONS_RETENTION_PLAN.md)
- [ ] Offline support, i18n, analytics, serve `colonias.json` from an API (see "Low priority" in `PROGRESS.md`)
- [ ] More fixed countries in the phone selector (Mexico, US/Canada and "other" today)
- [ ] Tag people (`@mentions`) in posts: only hashtags exist. Build it only if QA asks (search users when posting, store tagged users, notify them)
- [x] Orphaned `/comunidad` screen — removed 2026-11-09 on `fix/launch-backlog` (Feed → Anuncios covers it)
- [ ] Screenshots still missing: New Password, found-pet confirmation, OS push notification (see `auto_testing/EMULATOR_RUN_2026-11-07.md`)
- [ ] Push on iOS (needs Firebase + `GoogleService-Info.plist`; only if launching on iOS)

## Decisions made
- Minimum age **18** (app + trigger `enforce_min_age` + legal texts). If it changes: `MIN_AGE` in `utils/age.ts`, the trigger and the texts.
- Supabase **free** plan for now.
- No emojis in the app or in notifications.
- Commits and builds are made by the user.
- Post location is free text on purpose (no GPS): GPS would need `ACCESS_FINE_LOCATION` and an updated Data safety form.
