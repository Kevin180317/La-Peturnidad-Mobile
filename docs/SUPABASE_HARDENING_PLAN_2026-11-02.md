# Supabase hardening plan — week of 2026-11-02 (record)

> Status: **executed 2026-11-03 to 2026-11-05.** The original plan was a 571-line Spanish document with SQL drafts; it was condensed into this record on 2026-11-07. The SQL that was actually applied lives in `supabase/migrations/`, and the full original text is in git history (commit `3f0a328`, file `docs/SUPABASE_IMPLEMENTACION_SEMANA_2026-11-02.md`).

Goal: close everything that depended on Supabase so the app could go to production.

## Numbered fixes

| # | Problem | Resolution | Where |
|---|---|---|---|
| 1 | Other users could read phones, addresses and birth dates from `user_profiles` | Migration A adds the `public_profiles` view (no phone/address/birth date, `security_invoker = false`) and the RPCs `get_alert_contacts(uuid[])` and `get_finder_contacts()`. Migration B restricts `user_profiles` to the owner or a moderator. The app reads other people's profiles only from `public_profiles` (`profileService.getPublicByUserId`) | `20261103190025_alert_guards_group_chat`, `20261105000001_close_profile_access` |
| 2 | Clients could rewrite alert fields (`notified_at`, colonia) to spam neighbors | Trigger `protect_emergency_alert`. `pet_id` is deliberately not protected: deleting a pet sets it to null and must keep working | `20261103190025_alert_guards_group_chat` |
| 3 | `delete-account` deleted other people's chats | Edge function `delete-account` v2 deletes only the user's own 1:1 chats, other people's comments on their posts, nulls `reports.reviewed_by`, and removes Storage files page by page | `supabase/functions/delete-account` |
| 4 | Profile addresses that were not a real colonia (alerts match by exact equality) | Edit profile now uses postal code + `ColoniaPicker`; trigger `trim_profile_address`. Cleanup of existing rows (compare with `assets/colonias.json`) is not recorded as done: verify with `select address, postal_code, count(*) from user_profiles group by 1, 2` | app + `20261103190025_alert_guards_group_chat` |
| 5 | Leaving a group did not remove the user from its chat | Trigger `on_group_member_removed`, plus a one-off cleanup of ex-members still in chats | `20261103190025_alert_guards_group_chat` |
| 6 | "Delete chat" left the other person typing into the void | "Delete chat" is now "clear for me": RPC `clear_conversation(uuid)` and column `conversation_participants.cleared_at`; the participant row stays, so blocking still applies. `cp_delete` was dropped and broken 1:1 chats were repaired | migrations A and B |
| 7, 10–12 | App-only fixes | Applied 2026-10-31 (see `PROGRESS.md`) | app |
| 8 | No baseline migration | **Still open**: older migrations were applied from the dashboard and there is no baseline file | `BACKLOG.md` |
| 9 | Moderators could not delete their account (`reports.reviewed_by` foreign key) | Fixed in `delete-account` (see #3) | edge function |
| 13 | Push on iOS | Out of scope: needs Firebase + `GoogleService-Info.plist`, only if launching on iOS | — |

Other things shipped with the plan:
- Minimum age 18: `MIN_AGE` in `utils/age.ts`, trigger `enforce_min_age` (`20261104000001`; validates new profiles or changed birth dates only).
- Phone in E.164 (`+52XXXXXXXXXX`): `utils/phone.ts`, `components/PhoneField.tsx`. Trigger `enforce_phone_format` (`20261104000002`) must **not** be applied until the build with `PhoneField` is installed, because old builds send 10 digits and registration would fail.
- Bucket `alternate`: 5 MB limit, images only.

## Order constraint

Migration B leaves old builds without names or phones, so it required the new build to be installed first. Previous APKs stopped working properly; QA was told.

Revert for migration B: `drop policy "Owner or moderator can view profile" on public.user_profiles;` and recreate `"Authenticated can view profiles"` with `using (true)`.

## Dashboard settings (Supabase panel) still pending

- [ ] Auth → Email: custom SMTP (Resend); the default sender has a low hourly limit.
- [ ] Auth → Email: "Secure email change" on.
- [ ] Auth → Email: OTP length 8 (`app/verify-otp.tsx` assumes it).
- [ ] Auth → URL Configuration: allow `https://luckytracker.com.mx/email-confirmed` (or change `EMAIL_CONFIRMATION_REDIRECT_URL` in `services/auth.service.ts`).
- [ ] Plan: Pro, or manual backups (the free plan pauses the project after ~7 days of inactivity and has no backups).
- [ ] Auth (Pro only): leaked-password protection.

## Deferred extras (not blocking production)

Tracked in [`BACKLOG.md`](BACKLOG.md): store the terms acceptance date (`terms_accepted_at`) in `user_profiles`; delete notifications older than 90 days (`pg_cron`, must match the privacy policy); two-way blocking via an RPC that returns both directions; filter pets and group lists by blocks; Sentry.

## Notes

- Storage cannot be deleted from SQL (`storage.protect_delete()`); use the dashboard or the Storage API.
- Damaged files from before the image-upload fix: `select bucket_id, name from storage.objects where (metadata->>'size')::int < 100;`, then re-upload from the app.
- `types/database.ts` has one manual edit: `public_profiles.Row.user_id` is `string` (the view generates `string | null`). Re-apply it after regenerating or `bun run typecheck` fails (TS2538).
