# Backlog — Lucky Tracker

> Short-term task list. Created 2026-10-03, last reviewed 2026-10-21. Longer-term debt lives in [`PROGRESS.md`](PROGRESS.md#-open-work--technical-debt); E2E work in [`docs/E2E_SESSION_STATUS.md`](docs/E2E_SESSION_STATUS.md).

## ✅ Done (week of 2026-10-03)

- [x] Full UI/UX audit (24 screens + components)
- [x] Navigation link colors fixed (red → teal)
- [x] Invalid font classes removed (`font-[Inter_*]`)
- [x] ProfileTab redesign (consistent menu style)
- [x] Image upload for Feed posts (`posts` bucket)

## ⏳ Image upload integration

### 1. Emergency — lost pets (priority: HIGH)
- **Where:** `app/dashboard.tsx` → `handleReportMissing` / `EmergencyTab`
- **Task:** upload the lost pet's photo to the `emergency-alerts` bucket.
- **Context:** when a user reports a lost pet, the photo should go to Storage. Same pattern as `handleCreatePost`.
- **Estimate:** 30 min

### 2. Emergency — found pets (priority: HIGH)
- **Where:** `app/dashboard.tsx` → `handleReportFound` / `EmergencyTab`
- **Task:** upload the found pet's photo to the `found-pets` bucket.
- **Estimate:** 30 min

### 3. Success stories (priority: MEDIUM)
- **Where:** `app/historias.tsx` → `handleCreate`
- **Task:** upload the story image to the `success-stories` bucket.
- **Estimate:** 30 min

### 4. Pet photo (priority: MEDIUM)
- **Where:** `components/dashboard/PetForm.tsx` / `PetDetailModal`
- **Task:** confirm the pet photo upload works when creating and editing a pet (the preview bug was fixed in `12ac61c`).
- **Estimate:** 20 min

### 5. Post fields that aren't saved (priority: MEDIUM)
- **Where:** `components/PostForm.tsx`, `services/posts.service.ts`
- **Task:** `PostForm` collects multiple images, location, tags and URLs, but `createPost` only stores `content` and the first image. Add the columns to `posts` and persist them, or remove the fields from the form.
- **Estimate:** 1 hour

### 6. Validation and testing (priority: HIGH)
- [ ] Create posts with multiple images
- [ ] Create emergency alerts with a photo
- [ ] Check that URLs persist after a reload
- [ ] Check images render in the feed
- [ ] Validate the RLS policies on the Storage buckets
- **Estimate:** 1 hour

## Summary

- **Tasks:** 5 + testing
- **Estimate:** 3–4 hours
- **Buckets:** `posts`, `pet-images` and `profile-pictures` are in use; `emergency-alerts`, `found-pets` and `success-stories` aren't in the documented schema ([`docs/SUPABASE_SCHEMA.md`](docs/SUPABASE_SCHEMA.md)) and probably need to be created
- **Risk:** low (same pattern as posts)

## Technical notes

- Use `dashboardService.uploadImage(uri, bucketName)` for every upload.
- Always store public URLs in the database, never local URIs.
- On a 404, `uploadImage` only falls back for known buckets (`posts`/`pet-images` → `public`, `profile-pictures` → `alternate`). New buckets need their own fallback entry or must exist before release.
- Show an error toast if any upload fails.
