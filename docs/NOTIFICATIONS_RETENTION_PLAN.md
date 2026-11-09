# Plan: delete old inbox notifications (not done, postponed)

> Written 2026-11-09. **Not implemented on purpose.** Nothing in this file has been applied to the Supabase project or committed as a migration.

## Why it is postponed
- It does not block the launch or Play Store: the privacy policy only says data is kept "while your account is active" and never promises a 90-day deletion, so the app already does what the policy says.
- Volume is small: one `notifications` row per neighbour per lost-pet alert. It only matters once the table is large.
- Enabling an extension on the live project is an infrastructure change with no visible benefit yet.

## When to do it
Do it when **either** is true:
1. The `notifications` table is big enough to slow the inbox (check the table size in Supabase → Database → Tables).
2. The team decides to promise a retention period in the privacy policy. Then the job becomes mandatory, because the text would require it.

## Decision already made
Use **`pg_cron`**, not an edge function. The job is a single SQL `DELETE`, and an edge function would still need `pg_cron` + `pg_net` to be scheduled, adding a function, a secret and more failure points. Use an edge function only if the cleanup must touch something outside Postgres (Storage files, FCM, an external API).

## State of the project on 2026-11-09 (checked with `list_extensions`)
| Extension | State |
|---|---|
| `pg_cron` | Available (v1.6.4), **not installed** |
| `pg_net` | Available (v0.20.4), not installed. Not needed for this job |

`notifications` columns: `id`, `user_id`, `title`, `body`, `data`, `read`, `created_at`. Existing index: `idx_notifications_user` on `user_id` only (no index on `created_at`).

## Steps to integrate
1. **Pick the period** (the backlog assumed 90 days) and decide whether read and unread notifications are treated the same. Simplest: delete everything older than the period.
2. **Write the migration** `supabase/migrations/<date>_purge_old_notifications.sql`:
   ```sql
   create extension if not exists pg_cron with schema pg_catalog;

   -- Lets the daily delete use an index instead of scanning the table
   create index if not exists idx_notifications_created_at
     on public.notifications (created_at);

   select cron.schedule(
     'purge-old-notifications',
     '0 3 * * *',  -- every day at 03:00 UTC
     $$ delete from public.notifications where created_at < now() - interval '90 days' $$
   );
   ```
   Use the same number of days in the SQL and in the policy text.
3. **Apply it** to the remote (dashboard SQL editor or `apply_migration`). This is the step that enables `pg_cron` on the live project; confirm before running it.
4. **Verify**:
   - `select * from cron.job where jobname = 'purge-old-notifications';` returns the job.
   - After the first run: `select * from cron.job_run_details order by start_time desc limit 5;` shows `succeeded`.
   - Insert a test row with an old `created_at` and check it disappears after a manual run (`select cron.schedule(...)` can be re-run with `* * * * *` temporarily, then restored).
5. **Update the privacy policy** in `La-Peturnidad-Web` (`src/i18n/legal.ts`, sections "Conservación" in es and en) with the exact period, **only after step 4 passes**. Never publish the sentence before the job is live.
6. **Update the docs:** mark the item done in `docs/BACKLOG.md` and in `La-Peturnidad-Web/BACKLOG.md`, and list the job in `docs/SUPABASE_SCHEMA.md`.
7. **Free-plan caveat:** if the project is paused after ~7 days without activity, the cron stops until it is reactivated. Opening the dashboard weekly (already in the Infra checklist) covers it.

## Rollback
```sql
select cron.unschedule('purge-old-notifications');
-- optional, only if nothing else uses it:
drop index if exists public.idx_notifications_created_at;
-- optional: drop extension pg_cron;
```
Deleted notifications cannot be recovered (the free plan has no backups), so choose the period before the first run.
