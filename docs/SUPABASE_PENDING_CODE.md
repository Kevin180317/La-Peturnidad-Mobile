# La Peturnidad — Pending: Supabase + Code

> Expo + Supabase project.
> Current state: Supabase Auth + DB + Storage + Edge Functions. Express/MySQL is legacy, do not use.

---

## 1. Supabase — Database (missing tables)

The tables referenced in the code **do not exist** in `public`. They need to be created:

### 1.1 `user_profiles`

```sql
create table user_profiles (
  id        bigint generated always as identity primary key,
  user_id   uuid references auth.users(id) on delete cascade not null unique,
  first_name text not null,
  last_name  text not null,
  phone      text,
  birth_date date,
  address    text,
  city       text default 'Tijuana',
  postal_code text,
  profile_picture_url text,
  push_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**RLS needed:**
```sql
alter table user_profiles enable row level security;
create policy "Users view their own profile"
  on user_profiles for select using (auth.uid() = user_id);
create policy "Users edit their own profile"
  on user_profiles for update using (auth.uid() = user_id);
create policy "Insert during registration"
  on user_profiles for insert with check (auth.uid() = user_id);
```

### 1.2 `pets`

```sql
create table pets (
  id        bigint generated always as identity primary key,
  user_id   uuid references auth.users(id) on delete cascade not null,
  name      text not null,
  type      text not null check (type in ('perro', 'gato')),
  color     text not null,
  size      text not null check (size in ('pequeño', 'mediano', 'grande')),
  features  text,
  image_url text,
  created_at timestamptz default now()
);
```

**RLS:**
```sql
alter table pets enable row level security;
create policy "Users view their pets"
  on pets for select using (auth.uid() = user_id);
create policy "Users create pets"
  on pets for insert with check (auth.uid() = user_id);
create policy "Users delete their pets"
  on pets for delete using (auth.uid() = user_id);
```

### 1.3 `emergency_alerts`

```sql
create table emergency_alerts (
  id             bigint generated always as identity primary key,
  user_id        uuid references auth.users(id) on delete cascade not null,
  pet_name       text not null,
  type           text,
  description    text,
  last_seen_location text,
  disappearance_date date,
  image_url      text,
  created_at     timestamptz default now()
);
```

**RLS:**
```sql
alter table emergency_alerts enable row level security;
create policy "Everyone reads alerts"
  on emergency_alerts for select using (true);
create policy "Users create their alerts"
  on emergency_alerts for insert with check (auth.uid() = user_id);
create policy "Owner deletes their alert"
  on emergency_alerts for delete using (auth.uid() = user_id);
```

### 1.4 `found_pets`

```sql
create table found_pets (
  id        bigint generated always as identity primary key,
  pet_id    bigint references emergency_alerts(id) on delete cascade not null,
  user_id   uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);
```

**RLS:**
```sql
alter table found_pets enable row level security;
create policy "Users view found_pets"
  on found_pets for select using (true);
create policy "Users report found pets"
  on found_pets for insert with check (auth.uid() = user_id);
```

### 1.5 Storage buckets

| Bucket | Use | Visibility |
|---|---|---|
| `pet-images` | Pet photos | Public |
| `profile-pictures` | Profile photos | Public |
| `public` | Fallback (legacy code) | Public |
| `alternate` | Fallback (legacy code) | Public |

**RLS for storage:**
```sql
create policy "Public read"
  on storage.objects for select using (bucket_id in ('pet-images','profile-pictures','public','alternate'));
create policy "Authenticated users upload"
  on storage.objects for insert with check (auth.role() = 'authenticated');
```

---

## 2. Supabase — Missing Edge Function

The code in `services/alerts.service.ts` calls:
```
${SUPABASE_URL}/functions/v1/send-emergency-notification
```

This function **does not exist**. It must be created to notify neighbors when a lost pet is reported:

```ts
// supabase/functions/send-emergency-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { pet_name, type, last_seen_location } = await req.json();

  // 1. Find neighbors in the same neighborhood (same last_seen_location)
  // 2. Get their push tokens from user_profiles
  // 3. Send Expo Push Notifications
  // 4. Return ok

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

## 3. Code — Services referencing Supabase that are ready

These services already point to Supabase correctly. They only need the tables to exist:

| Service | File | Table/Endpoint |
|---|---|---|
| Auth | `services/auth.service.ts` | Supabase Auth (`signIn`, `signUp`, `resetPassword`) |
| Profile | `services/profile.service.ts` | `user_profiles` |
| Pets | `services/pets.service.ts` | `pets` |
| Alerts | `services/alerts.service.ts` | `emergency_alerts` + Edge Function |
| Dashboard | `services/dashboard.service.ts` | Multiple tables + Storage |
| Storage | `services/storage.service.ts` | Supabase Storage |
| Supabase client | `utils/supabase.ts` | Client configured with anon key |

**Problem detected:** The `.env.local` file has two keys. `supabase.ts` uses `EXPO_PUBLIC_SUPABASE_KEY` (publishable), `dashboard.service.ts` uses `EXPO_PUBLIC_SUPABASE_ANON_KEY` (anon JWT). **Unify:** use only the anon key everywhere and remove the publishable one if not needed.

---

## 4. Code — Missing features

> Priorities marked according to impact on the "lost pets social network" vision.

### 🔴 High priority

| Feature | Files affected | What it implies |
|---|---|---|
| **Social feed / timeline** | New: `app/feed.tsx`, `services/feed.service.ts` | Chronological activity timeline (alerts, sightings, reunions) |
| **Comments on posts** | New: `services/comments.service.ts` + `comments` table | Nested comments on alerts and posts |
| **Public user profiles** | Modify: `components/dashboard/ProfileTab.tsx` | Make profiles visitable from alerts, with public data |
| **Edit pet** | Modify: `app/dashboard.tsx` (handleEditPet) | PATCH endpoint in Supabase + pre-filled form |
| **Interactive map** | New: screen + map component | React Native Maps or Webview with Leaflet |

### 🟡 Medium priority

| Feature | What it implies |
|---|---|
| **Follow** | New `follows` table, service, button on profiles |
| **Direct messaging** | Integrated chat, `messages` table, notifications |
| **Neighborhood groups** | `groups` table, `group_members`, filtered feed |
| **Social notifications** | Notification center with varied typology |
| **Google/Apple login** | Configure providers in Supabase Auth |
| **Notification settings** | Preferences screen (radius, type) |
| **Notices / Community (Flow E)** | `posts` or `announcements` table |

### 🟢 Low priority

| Feature | What it implies |
|---|---|
| **Automatic matching** | Attribute comparison algorithm |
| **Successful reunions wall** | Public section with stories |
| **User roles** | Tiered authorization system |
| **Enriched pet data** | Breed, microchip, vaccines, etc. |
| **Moderation and safety** | Reports, blocks, verification |

---

## 5. Architecture issues to resolve

| # | Problem | Recommended solution |
|---|---|---|
| 1 | **Inconsistent config keys** — `EXPO_PUBLIC_SUPABASE_KEY` vs `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Use only the anon JWT key in all services, remove the publishable one |
| 2 | **No migrations** — No versioned Supabase migrations | Create initial migration with `supabase migration new init` |
| 3 | **Fallback buckets** (`public`, `alternate`) in storage service | Clean up fallbacks once the main buckets stabilize |
| 4 | **No RLS on read alerts** — `select using true` is fine for now but monitor | Add rate limiting or geofencing in the future |

---

## 6. Implementation Checklist

### Phase 1 — Solid foundation (do now)
- [ ] Create `user_profiles` table in Supabase + RLS
- [ ] Create `pets` table in Supabase + RLS
- [ ] Create `emergency_alerts` table in Supabase + RLS
- [ ] Create `found_pets` table in Supabase + RLS
- [ ] Create storage buckets (`pet-images`, `profile-pictures`) + RLS
- [ ] Deploy `send-emergency-notification` Edge Function
- [ ] Unify environment keys (use only anon key)

### Phase 2 — What already existed in the original flowchart
- [ ] Interactive map (Flow B)
- [ ] Edit pet (Flow C.2)
- [ ] Google/Apple social login
- [ ] Notification settings
- [ ] Notices / Community (Flow E)

### Phase 3 — Social network
- [ ] Social feed / timeline
- [ ] Comments and reactions
- [ ] Public profiles
- [ ] Follow system
- [ ] Direct messaging

### Phase 4 — Differentiation
- [ ] Automatic lost & found matching
- [ ] Neighborhood groups
- [ ] User roles
- [ ] Successful reunions wall
- [ ] Moderation and reports

---

*Document generated from analysis of La Peturnidad's source code (Expo) and the current state of the Supabase project `owtcrciujfdlcuopimof`.*
