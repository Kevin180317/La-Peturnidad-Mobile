# Backlog — Lucky Tracker

> Updated 2026-11-07. What is done is in [`PROGRESS.md`](PROGRESS.md) and [`../AGENTS.md`](../AGENTS.md).

## Next (this week)

### Blocks the launch
- [ ] **Phone QA with the new build** (`preview` APK): registration with age and per-country phone, readable colonias, edit profile with an old phone, confirmation email pointing to `luckytracker.com.mx`, inbox without emojis, text limits, Feed (Emergencias / Anuncios / Social) and the new post form
- [ ] **Publish `/policy` and `/terms`** (target 2026-11-07) and review them against the checklists in `LEGAL_PRIVACY_POLICY.md` and `LEGAL_TERMS_AND_CONDITIONS.md`: `#eliminar-cuenta` anchor, plain-text email, ARCO address, providers, age 18. Published pages must be in Spanish
- [ ] **Fill in the legal placeholders**: `[RESPONSABLE]`, `[DOMICILIO]`, `[CORREO]`, `[REGIÓN]`, `[FECHA]`
- [ ] **Fix the certificate on okhuysen.dev**: the PDF says "Claude Code in Action" (May 2026), the page says "Claude AI Developer Certification" (2025)
- [ ] **Play Console**: store listing, adults-only target audience (18+), content rating (user content and chat), Data safety form consistent with the policy, account-deletion URL
- [ ] **`production` build** (AAB) once everything above is tested

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
- [ ] Remove `@react-native-picker/picker` (unused; it is native, so it ships with a build) and its mock in `__tests__/app/editar-perfil.test.tsx`
- [ ] Deterministic avatar color by `user_id` (always teal today)
- [ ] If someone blocked you, their content is still visible to you; pets and group lists are not filtered by blocks
- [ ] Store the terms acceptance date in the profile (`terms_accepted_at`; do it before launch, it cannot be reconstructed for existing users)
- [ ] Delete notifications older than 90 days (`pg_cron`; must match the privacy policy)
- [ ] Offline support, i18n, analytics, serve `colonias.json` from an API (see "Low priority" in `PROGRESS.md`)
- [ ] More fixed countries in the phone selector (Mexico, US/Canada and "other" today)
- [ ] Tag people (`@mentions`) in posts: only hashtags exist. Build it only if QA asks (search users when posting, store tagged users, notify them)
- [ ] Decide what to do with the orphaned `/comunidad` screen (remove it or link it)
- [ ] Screenshots still missing: New Password, found-pet confirmation, OS push notification (see `auto_testing/EMULATOR_RUN_2026-11-07.md`)
- [ ] Push on iOS (needs Firebase + `GoogleService-Info.plist`; only if launching on iOS)

## Decisions made
- Minimum age **18** (app + trigger `enforce_min_age` + legal texts). If it changes: `MIN_AGE` in `utils/age.ts`, the trigger and the texts.
- Supabase **free** plan for now.
- No emojis in the app or in notifications.
- Commits and builds are made by the user.
- Post location is free text on purpose (no GPS): GPS would need `ACCESS_FINE_LOCATION` and an updated Data safety form.
