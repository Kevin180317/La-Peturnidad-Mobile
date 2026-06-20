# Supabase Schema — La Peturnidad

> Generado el 20/06/2026. 19 migraciones aplicadas.

---

## Helper Functions

### `is_moderator_or_admin()`

```sql
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER  -- se ejecuta como owner, rompe recursion RLS
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('moderator', 'admin')
  );
$$;
```

---

## Tables

### `user_profiles`

```sql
CREATE TABLE user_profiles (
  id            uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id       uuid UNIQUE NOT NULL REFERENCES auth.users(id),
  first_name    varchar,
  last_name     varchar,
  phone         varchar,
  birth_date    date,
  address       text,
  city          varchar,
  postal_code   varchar,
  profile_picture_url text,
  push_token    text,
  role          text NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'moderator', 'admin')),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Users can view their own profile | SELECT | `auth.uid() = user_id` |
| Moderators can view all profiles | SELECT | `is_moderator_or_admin() OR auth.uid() = user_id` |
| Users can insert their own profile | INSERT | `auth.uid() = user_id` (with check) |
| Users can update their own profile | UPDATE | `auth.uid() = user_id` (using) |
| Users can delete their own profile | DELETE | `auth.uid() = user_id` (using) |

---

### `pets`

```sql
CREATE TABLE pets (
  id            uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  type          varchar CHECK (type IN ('perro', 'gato')),
  name          varchar,
  color         varchar,
  size          varchar,
  features      varchar,
  image_url     varchar,
  created_at    timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Users can view their own pets | SELECT | `auth.uid() = user_id` |
| Users can insert their own pets | INSERT | `auth.uid() = user_id` (with check) |
| Users can update their own pets | UPDATE | `auth.uid() = user_id` (using) |
| Users can delete their own pets | DELETE | `auth.uid() = user_id` (using) |

---

### `emergency_alerts`

```sql
CREATE TABLE emergency_alerts (
  id                    uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id               uuid NOT NULL REFERENCES auth.users(id),
  pet_name              varchar,
  type                  varchar CHECK (type IN ('perro', 'gato')),
  description           text,
  last_seen_location    varchar,
  disappearance_date    date,
  image_url             text,
  created_at            timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Anyone can view emergency alerts | SELECT | `true` |
| Users can insert their own alerts | INSERT | `auth.uid() = user_id` (with check) |
| Users can update their own alerts | UPDATE | `auth.uid() = user_id` (using) |
| Users can delete their own alerts | DELETE | `auth.uid() = user_id` (using) |

---

### `found_pets`

```sql
CREATE TABLE found_pets (
  id            uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  pet_id        uuid NOT NULL REFERENCES pets(id),
  created_at    timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Users can view found pets for their pets or their own reports | SELECT | `auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM pets WHERE id = pet_id)` |
| Users can insert their own found pets | INSERT | `auth.uid() = user_id` (with check) |
| Users can delete their own found pets | DELETE | `auth.uid() = user_id` (using) |

---

### `notification_preferences`

```sql
CREATE TABLE notification_preferences (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid UNIQUE NOT NULL REFERENCES auth.users(id),
  push_enabled            boolean DEFAULT true,
  lost_pet_alerts         boolean DEFAULT true,
  found_pet_alerts        boolean DEFAULT true,
  community_announcements boolean DEFAULT true,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Users can view their own notification preferences | SELECT | `auth.uid() = user_id` |
| Users can insert their own notification preferences | INSERT | `auth.uid() = user_id` (with check) |
| Users can update their own notification preferences | UPDATE | `auth.uid() = user_id` (using) |

---

### `announcements`

```sql
CREATE TABLE announcements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  title         text NOT NULL,
  content        text NOT NULL,
  category      text DEFAULT 'general' CHECK (category IN ('aviso', 'evento', 'pregunta', 'general')),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Anyone can view announcements | SELECT | `true` |
| Users can insert their own announcements | INSERT | `auth.uid() = user_id` (with check) |
| Users can update their own announcements | UPDATE | `auth.uid() = user_id` (using) |
| Users can delete their own announcements | DELETE | `auth.uid() = user_id` (using) |

---

### `posts`

```sql
CREATE TABLE posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  content       text NOT NULL,
  image_url     text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Anyone can view posts | SELECT | `true` |
| Users can insert their own posts | INSERT | `auth.uid() = user_id` (with check) |
| Users can update their own posts | UPDATE | `auth.uid() = user_id` (using) |
| Users can delete their own posts | DELETE | `auth.uid() = user_id` (using) |

---

### `comments`

```sql
CREATE TABLE comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  target_type   text NOT NULL CHECK (target_type IN ('post', 'announcement', 'alert')),
  target_id     uuid NOT NULL,
  content       text NOT NULL,
  parent_id     uuid REFERENCES comments(id),
  created_at    timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Anyone can view comments | SELECT | `true` |
| Users can insert their own comments | INSERT | `auth.uid() = user_id` (with check) |
| Users can delete their own comments | DELETE | `auth.uid() = user_id` (using) |

---

### `follows`

```sql
CREATE TABLE follows (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id   uuid NOT NULL REFERENCES auth.users(id),
  following_id  uuid NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Anyone can view follows | SELECT | `true` |
| Users can follow | INSERT | `auth.uid() = follower_id` (with check) |
| Users can unfollow | DELETE | `auth.uid() = follower_id` (using) |

---

### `conversations`

```sql
CREATE TABLE conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Participants can view conversations | SELECT | `auth.uid() IN (SELECT user_id FROM conversation_participants WHERE conversation_id = id)` |
| Users can create conversations | INSERT | `true` (with check) |

---

### `conversation_participants`

```sql
CREATE TABLE conversation_participants (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid NOT NULL REFERENCES conversations(id),
  user_id           uuid NOT NULL REFERENCES auth.users(id),
  created_at        timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Participants can view participants | SELECT | `auth.uid() IN (SELECT user_id FROM conversation_participants WHERE conversation_id = conversation_id)` |
| Users can add themselves to conversations | INSERT | `auth.uid() = user_id` (with check) |

---

### `messages`

```sql
CREATE TABLE messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid NOT NULL REFERENCES conversations(id),
  sender_id         uuid NOT NULL REFERENCES auth.users(id),
  content           text NOT NULL,
  created_at        timestamptz DEFAULT now(),
  read_at           timestamptz
);
```

| Policy | Command | Rule |
|---|---|---|
| Participants can view messages | SELECT | `auth.uid() IN (SELECT user_id FROM conversation_participants WHERE conversation_id = messages.conversation_id)` |
| Participants can insert messages | INSERT | `auth.uid() = sender_id AND auth.uid() IN (SELECT user_id FROM conversation_participants WHERE conversation_id = messages.conversation_id)` (with check) |

---

### `groups`

```sql
CREATE TABLE groups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Anyone can view groups | SELECT | `true` |
| Authenticated users can create groups | INSERT | `auth.role() = 'authenticated'` (with check) |
| Group admins can update their groups | UPDATE | `auth.uid() = created_by OR auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = id AND role = 'admin')` (using) |

---

### `group_members`

```sql
CREATE TABLE group_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      uuid NOT NULL REFERENCES groups(id),
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  role          text DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at    timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Anyone can view group members | SELECT | `true` |
| Users can join groups | INSERT | `auth.uid() = user_id` (with check) |
| Users can leave groups | DELETE | `auth.uid() = user_id` (using) |

---

### `success_stories`

```sql
CREATE TABLE success_stories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  pet_name      text NOT NULL,
  story         text NOT NULL,
  image_url     text,
  created_at    timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Anyone can view success stories | SELECT | `true` |
| Users can create their own success stories | INSERT | `auth.uid() = user_id` (with check) |
| Users can delete their own success stories | DELETE | `auth.uid() = user_id` (using) |

---

### `reports`

```sql
CREATE TABLE reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     uuid NOT NULL REFERENCES auth.users(id),
  target_user_id  uuid NOT NULL REFERENCES auth.users(id),
  reason          text NOT NULL,
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at      timestamptz DEFAULT now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid REFERENCES auth.users(id)
);
```

| Policy | Command | Rule |
|---|---|---|
| Users can view their own reports | SELECT | `auth.uid() = reporter_id` |
| Moderators can view all reports | SELECT | `is_moderator_or_admin()` |
| Users can create reports | INSERT | `auth.uid() = reporter_id` (with check) |
| Moderators can update reports | UPDATE | `is_moderator_or_admin()` (using) |

---

### `blocks`

```sql
CREATE TABLE blocks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id    uuid NOT NULL REFERENCES auth.users(id),
  blocked_id    uuid NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);
```

| Policy | Command | Rule |
|---|---|---|
| Users can view their own blocks | SELECT | `auth.uid() = blocker_id` |
| Users can block others | INSERT | `auth.uid() = blocker_id` (with check) |
| Users can unblock | DELETE | `auth.uid() = blocker_id` (using) |

---

## Storage

### Buckets

| Bucket | Public |
|---|---|
| `pet-images` | ✅ |
| `profile-pictures` | ✅ |
| `public` | ✅ |
| `alternate` | ✅ |

### Policies on `storage.objects`

| Policy | Command | Bucket | Rule |
|---|---|---|---|
| Auth INSERT pet-images | INSERT | pet-images | Auth role = authenticated, bucket check |
| Auth INSERT profile-pictures | INSERT | profile-pictures | Auth role = authenticated, bucket check |
| Auth INSERT public | INSERT | public | Auth role = authenticated, bucket check |
| Auth Upload pet-images | INSERT | pet-images | `auth.role() = 'authenticated'` |
| Auth Upload profile-pictures | INSERT | profile-pictures | `auth.role() = 'authenticated'` |
| Authenticated users can upload to pet-images | INSERT | pet-images | `auth.role() = 'authenticated'` |
| Authenticated users can upload to profile-pictures | INSERT | profile-pictures | `auth.role() = 'authenticated'` |
| Authenticated users can upload to public | INSERT | public | `auth.role() = 'authenticated'` |
| Public SELECT pet-images | SELECT | pet-images | Auth or public folder |
| Public SELECT profile-pictures | SELECT | profile-pictures | Auth or public folder |
| Public SELECT public | SELECT | public | Auth or public folder |
| Own UPDATE | UPDATE | any | `auth.uid() = owner` |
| Users can update their own files | UPDATE | any | `auth.uid() = owner` |
| Own DELETE | DELETE | any | `auth.uid() = owner` |
| Users can delete their own files | DELETE | any | `auth.uid() = owner` |

> **Note:** There are multiple overlapping INSERT policies for the same buckets (e.g. 3 policies for `pet-images` INSERT). This is harmless but could be cleaned up.

---

## Entity Relationship Summary

```
auth.users
  ├── user_profiles          (1:1, via user_id)
  ├── pets                   (1:N, via user_id)
  │   └── found_pets         (N:1, via pet_id)
  ├── emergency_alerts       (1:N, via user_id)
  ├── notification_preferences (1:1, via user_id)
  ├── announcements          (1:N, via user_id)
  ├── posts                  (1:N, via user_id)
  ├── comments               (1:N, via user_id)
  ├── follows (follower_id)  (1:N)
  ├── follows (following_id) (1:N)
  ├── conversation_participants (N:M, via user_id)
  │   └── conversations      (via conversation_id)
  │       └── messages       (via conversation_id)
  ├── groups (created_by)    (1:N)
  ├── group_members          (N:M, via user_id)
  ├── success_stories        (1:N, via user_id)
  ├── reports (reporter_id)  (1:N)
  ├── reports (target_user_id) (1:N)
  ├── reports (reviewed_by)  (1:N)
  └── blocks (blocker_id)    (1:N)
```

---

## Migration History

| # | Version | Name |
|---|---|---|
| 1 | 20260425180055 | create_storage_buckets |
| 2 | 20260425180103 | add_storage_policies |
| 3 | 20260606180857 | cleanup_duplicate_indexes |
| 4 | 20260606180858 | cleanup_duplicate_rls_found_pets |
| 5 | 20260606180901 | fix_storage_listing_policies |
| 6 | 20260606180917 | fix_rls_auth_initplan |
| 7 | 20260620182759 | fix_found_pets_select_policy |
| 8 | 20260620182808 | fix_storage_listing_policies |
| 9 | 20260620190152 | create_notification_preferences |
| 10 | 20260620190153 | create_announcements |
| 11 | 20260620192307 | create_posts |
| 12 | 20260620192308 | create_comments |
| 13 | 20260620192309 | create_follows |
| 14 | 20260620192321 | create_conversations |
| 15 | 20260620193536 | add_role_to_user_profiles |
| 16 | 20260620193538 | create_groups |
| 17 | 20260620193539 | create_success_stories |
| 18 | 20260620193541 | create_reports_and_blocks |
| 19 | 20260620195713 | fix_rls_recursion_moderators |
