# Supabase Schema

> Reflects the generated types in `types/database.ts` (regenerated 2026-10-24, plus the 2026-11-03/05 changes). Last reviewed 2026-11-07. **Source of truth:** the remote database (`list_migrations`) and `types/database.ts`; SQL applied so far is in `supabase/migrations/`. Policy-level detail (RLS rules) is in those migrations, not repeated here. Older migrations were applied from the dashboard and there is no baseline file yet (see `BACKLOG.md`).

Regenerate types with the Supabase MCP `generate_typescript_types`, then run `bun run typecheck`. Manual edit to re-apply: `public_profiles.Row.user_id` is `string` (see [`SUPABASE_HARDENING_PLAN_2026-11-02.md`](SUPABASE_HARDENING_PLAN_2026-11-02.md)).

## Tables

| Table | Columns |
|---|---|
| `announcements` | `category`, `content`, `created_at`, `id`, `title`, `updated_at`, `user_id` |
| `blocks` | `blocked_id`, `blocker_id`, `created_at`, `id` |
| `comments` | `content`, `created_at`, `id`, `parent_id`, `target_id`, `target_type`, `user_id` |
| `conversation_participants` | `cleared_at`, `conversation_id`, `created_at`, `id`, `user_id` |
| `conversations` | `created_at`, `group_id`, `id`, `updated_at` |
| `device_tokens` | `token`, `updated_at`, `user_id` |
| `emergency_alerts` | `created_at`, `description`, `disappearance_date`, `id`, `image_url`, `last_seen_location`, `notified_at`, `pet_id`, `pet_name`, `resolved_at`, `status`, `type`, `user_id` |
| `follows` | `created_at`, `follower_id`, `following_id`, `id` |
| `found_pets` | `alert_id`, `alert_owner_id`, `created_at`, `id`, `image_url`, `note`, `notified_at`, `pet_id`, `pet_name`, `user_id` |
| `group_members` | `created_at`, `group_id`, `id`, `role`, `user_id` |
| `groups` | `created_at`, `created_by`, `description`, `id`, `name` |
| `messages` | `content`, `conversation_id`, `created_at`, `id`, `read_at`, `sender_id` |
| `notification_preferences` | `community_announcements`, `created_at`, `found_pet_alerts`, `id`, `lost_pet_alerts`, `push_enabled`, `updated_at`, `user_id` |
| `notifications` | `body`, `created_at`, `data`, `id`, `read`, `title`, `user_id` |
| `pets` | `color`, `created_at`, `features`, `id`, `image_url`, `name`, `size`, `type`, `user_id` |
| `posts` | `content`, `created_at`, `id`, `image_url`, `image_urls`, `links`, `location`, `tags`, `updated_at`, `user_id` |
| `reports` | `created_at`, `id`, `reason`, `reporter_id`, `reviewed_at`, `reviewed_by`, `status`, `target_user_id` |
| `success_stories` | `created_at`, `id`, `image_url`, `pet_name`, `story`, `user_id` |
| `user_profiles` | `address`, `birth_date`, `city`, `created_at`, `first_name`, `id`, `last_name`, `phone`, `postal_code`, `profile_picture_url`, `role`, `updated_at`, `user_id` |

## Views

| View | Columns |
|---|---|
| `public_profiles` | `city`, `created_at`, `first_name`, `last_name`, `profile_picture_url`, `role`, `user_id` |

## RPC functions (`public`)

| Function | Purpose |
|---|---|
| `clear_conversation` | Clear a chat for the caller only (sets `cleared_at`); the participant row stays |
| `get_alert_contacts` | Owner name and phone for active alerts in the caller's colonia |
| `get_finder_contacts` | Name and phone of people who reported finding the caller's pet |
| `create_conversation` | Create a 1:1 conversation with both participants (SECURITY DEFINER) |
| `create_group_conversation` | Create the group chat with all members |
| `delete_group` | Delete a group, its members, linked chat, messages and participants (creator only) |
| `is_blocked_between` | True if either user blocked the other |
| `is_blocked_in_conversation` | True if a block exists between the user and the conversation's other participant |
| `is_moderator_or_admin` | Role check used by RLS; SECURITY DEFINER to avoid policy recursion |
| `is_participant` | Participant check used by RLS; SECURITY DEFINER to avoid policy recursion |
| `join_group_conversation` | Join (or create) the group chat of a group the caller belongs to |
| `register_device_token` | Register the caller's push token (`device_tokens`, PK = `token`) |

## Security model (summary)

- RLS is on for every table. `anon` has no SECURITY DEFINER access.
- `user_profiles` is readable only by the owner or a moderator. Other users' profiles come from the `public_profiles` view; phones are exposed only through `get_alert_contacts` / `get_finder_contacts`.
- Messages: only participants can read or send, and not across blocks. 1:1 and group chats are unique per pair/group.
- `emergency_alerts`: `notified_at` and colonia cannot be changed from the client (`protect_emergency_alert`). `found_pets` is filled by a trigger from the alert.
- Rate limits (trigger `enforce_rate_limit`, server-side `created_at`): posts 10/h, comments 30/h, messages 30/min, announcements 5/h, alerts 5/day, reports 10/h, stories 5/day, groups 3/day. To change one: `drop trigger trg_rate_limit on <table>` and recreate it with other arguments.
- Triggers: `enforce_min_age` (18+), `enforce_phone_format` (E.164; not yet applied, see the hardening record), `trim_profile_address`, `on_group_member_removed`.
- Moderators can delete content. Realtime is enabled on `messages`.
- Storage buckets used by the app: `pet-images`, `profile-pictures` and `posts` (`dashboardService.uploadImage`); `alternate` has a 5 MB, images-only limit. Alerts, found pets and stories have no image upload yet (see `BACKLOG.md`). Storage cannot be deleted with SQL (`storage.protect_delete()`).

## Edge Functions

- `send-push-notification` (v10): FCM v1 push with image, Android channel `emergency_alerts` and iOS badge; claims `notified_at` atomically, resolves recipients from the alert, sends in batches, deletes only `UNREGISTERED` tokens, and writes a row to `notifications` per recipient (same preferences as the push). Titles have no emojis.
- `delete-account` (v2): deletes the user's rows, own 1:1 chats, other people's comments on their posts, nulls `reports.reviewed_by`, and removes Storage files.
