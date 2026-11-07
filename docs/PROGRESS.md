# Progress — Lucky Tracker

> Living dev log by phase. Last updated: 2026-11-07. For the very latest state, [`../AGENTS.md`](../AGENTS.md) (Spanish, "Progress" section) is the most detailed source; this file keeps the English summary.
> Condensed history and project origin: [`MILESTONES.md`](MILESTONES.md). Short-term task list: [`BACKLOG.md`](BACKLOG.md).

Phases are listed in chronological order. **Phases 1–12 are historical:** several things they mention no longer exist (`utils/theme.ts`, `constants/Colors.ts`, `components/Button.tsx`, `components/EmptyState.tsx`, `services/matching.service.ts`, the Comunidad tab) and the teal changed again (current value `#007275`, see [`BRANDING.md`](BRANDING.md)). Phases 13–17 below describe the current app.

---

## ✅ Phase 1 — Solid foundation

| Item | Status |
|---|---|
| `user_profiles` table + RLS | ✅ |
| `pets` table + RLS | ✅ |
| `emergency_alerts` table + RLS | ✅ |
| `found_pets` table + RLS | ✅ |
| Storage buckets (`pet-images`, `profile-pictures`) + RLS | ✅ |
| Edge Function `send-push-notification` (FCM v1) | ✅ |
| Unified environment keys (anon key only) | ✅ |
| Exported `ServiceResult` type | ✅ |
| `found_pets` RLS fixed (owner can view) | ✅ |
| Storage listing policies restricted | ✅ |
| Express server moved to `legacy/` | ✅ |

## ✅ Phase 2 — Core features

| Item | Status |
|---|---|
| Edit pet | ✅ |
| Notification settings | ✅ |
| Notices / Community (Flow E) | ✅ |

*Excluded: interactive map, social login (email only).*

## ✅ Phase 3 — Social network

| Item | Status |
|---|---|
| Social feed / timeline | ✅ |
| Comments on posts and notices | ✅ |
| Public profiles (`/perfil/[id]`) | ✅ |
| Follow system | ✅ |
| Direct messaging | ✅ |
| Tables: `posts`, `comments`, `follows`, `conversations`, `conversation_participants`, `messages` | ✅ |

## ✅ Phase 4 — Differentiation

| Item | Priority | Status |
|---|---|---|
| **Followers / following** | 🟡 Medium | ✅ `/seguidores` screen with followers/following tabs |
| **Edit profile** | 🟡 Medium | ✅ Form at `/editar-perfil` (name, phone, address, profile photo) |
| **Automatic lost & found matching** | 🟢 Low | ✅ Algorithm in `services/matching.service.ts` |
| **Neighborhood groups** | 🟢 Low | ✅ `groups` and `group_members` tables + `/grupos` and `/grupos/[id]` screens |
| **User roles** | 🟢 Low | ✅ `role` column in `user_profiles` + moderator RLS |
| **Successful reunions wall** | 🟢 Low | ✅ `success_stories` table + `/historias` screen |
| **Moderation and reports** | 🟢 Low | ✅ `reports` and `blocks` tables + `/panel-moderacion` screen |
| **Feed/Community sub-tabs** | 🟡 Medium | ✅ Feed: "Feed" (others) / "My posts". Community: "Community" (others) / "My notices" |

### Bugs fixed

| Bug | Fix |
|---|---|
| `42P17` — RLS recursion in moderator policies | `is_moderator_or_admin()` function with `SECURITY DEFINER` |
| `23505` — duplicate key when creating a profile | `upsert` with `onConflict: "user_id"` instead of check-then-insert |
| Invalid date format for PostgreSQL | `toPostgresDate()` helper that converts `DD/MM/YYYY` → `YYYY-MM-DD` |
| Storage 403 — the anon key doesn't carry the `authenticated` role | Use the user's JWT (`session.access_token`) instead of the anon key |
| RLS blocked viewing other users' profiles in Community | `Anyone can view profiles` policy with `USING (true)` |

## ✅ Messaging, notifications and auth flows (between Phases 4 and 5)

| Item | Notes |
|---|---|
| **Unread messages badge** | Counter on the dashboard "Messages" button. Updates on load, on pull-to-refresh, and when returning from the messages screen. |
| **Delete chats** | Long press in the message list → confirmation → removes the user from `conversation_participants`. Includes a DELETE policy. |
| **Group chat** | "Group chat" button on the group detail screen. Creates a conversation with `group_id` and all members as participants. Shown with a group icon in the message list. |
| **`group_id` column on `conversations`** | New FK → `groups(id)` to identify group chats. |
| **`create_group_conversation` RPC** | `SECURITY DEFINER` function that creates the conversation with `group_id` and inserts all members. |
| **3-step onboarding** | Welcome carousel (Report · Connect · Act), logo mark, step dots, Next/Get started button. `index.tsx` is the onboarding screen. |
| **Routing refactor** | Login moved to `app/login.tsx`, `/login` route registered in `_layout.tsx`. 16 screens updated: `router.replace("/")` → `router.replace("/login")`. |
| **expo-notifications fix in Expo Go** | Static import replaced by a dynamic `await import("expo-notifications")` + try/catch. No longer crashes in Expo Go (SDK 53+). In dev builds it works with FCM + the Edge Function. |
| **`uniwind-types.d.ts` moved** | Moved from `app/` to the project root to avoid the Expo Router "Route missing default export" warning. |
| **EAS Build: `android/` out of git** | `android/` added to `.gitignore` and untracked. `googleServicesFile` configured in `app.json`, `google-services.json` moved to the root. EAS regenerates `android/` with prebuild. |
| **Fix: creator saw "Join" on their own groups** | Race condition: the async `setUserId` hadn't updated when `loadGroups` checked membership. `userId` is now passed as a parameter instead of being read from state. |
| **Fix: messages without sender name** | Group chats load the profile (`first_name`, `last_name`) of each `sender_id` and show it above the bubble. |
| **Delete group** | Long press in the list + button on the detail screen (creator only). `delete_group()` `SECURITY DEFINER` RPC removes the group, members (cascade), the linked chat, its messages and participants. DELETE policy on `groups`. |
| **Push notifications (Edge Function + FCM)** | New `send-push-notification` Edge Function. Uses a Firebase service account to call the FCM v1 API. Replaced `send-emergency-notification` (deleted). |
| **Client: `getDevicePushTokenAsync`** | `dashboard.tsx` uses `getDevicePushTokenAsync()` instead of `getExpoPushTokenAsync()` and stores it in `user_profiles.fcm_token`. |
| **`app.json`: expo-notifications plugin** | Added explicitly (required in SDK 53). |
| **`notifications` table** | New table for push history. |
| **Emergency alert push** | `alerts.service.ts` looks up neighbors' `fcm_token` and sends a push through the Edge Function when an alert is created. |
| **Duplicate `savePushToken` removed** | Dead method removed from `auth.service.ts`. |
| **Password recovery with OTP** | New 3-step flow: (1) `forgot-password.tsx` sends an OTP via `signInWithOtp({ shouldCreateUser: false })`, (2) `verify-otp.tsx` verifies it with `verifyOtp({ type: 'email' })`, (3) `reset-password.tsx` sets the new password with `updateUser({ password })`. "Forgot your password?" link added to login. Routes registered in `_layout.tsx`. |
| **Post-registration email confirmation** | New `email-confirmacion.tsx` screen, shown after registering or when logging in with an unconfirmed email. Only "Resend email" and "Back to start". Login checks `email_confirmed_at` and redirects there when it's null. `resendConfirmation(email)` method in `auth.service.ts`. |

### Messaging RLS / RPC fixes

| Item | Notes | Status |
|---|---|---|
| **Broken `conversations` SELECT RLS** | Compared `conversation_participants.id` instead of `conversations.id` — nobody could read conversations | ✅ Fixed |
| **`.select()` after INSERT in `getOrCreateConversation`** | Even with the RLS fixed, the SELECT failed because the user isn't a participant yet | ✅ Fixed |
| **INSERT of the other user into `conversation_participants`** | Policy required `auth.uid() = user_id`, so the other user couldn't be added | ✅ New `create_conversation()` RPC with `SECURITY DEFINER` |
| **Wrong `conversation_participants` SELECT RLS** | `cp.conversation_id = cp.conversation_id` was always true — too permissive | ✅ Fixed |
| **Missing UPDATE policy on `messages`** | `markAsRead` didn't work | ✅ Created |
| **Missing UPDATE policy on `conversations`** | `sendMessage` didn't update `updated_at` | ✅ Created |
| **`sendMessage` used `.select()` after INSERT** | Same problem: SELECT blocked by RLS. Switched to a client-side UUID without `.select()` | ✅ Fixed |
| **Subquery RLS caused a 500 on `messages` and `conversation_participants`** | Correlated subquery caused recursion. Replaced with `is_participant()` (`SECURITY DEFINER`) | ✅ Fixed |
| **Undeclared `setUserId` in `grupos/[id].tsx`** | `setUserId()` called without a `useState` — crashed when opening a group | ✅ Fixed |
| **Dynamic import in `perfil/[id].tsx`** | Fragile `import("@/services/...")` in Metro → static import | ✅ Fixed |
| **Missing `Stack.Screen` entries in `_layout.tsx`** | `grupos/[id]` and `mensajes/[id]` weren't registered explicitly | ✅ Added |

## ✅ Phase 5 — UI/UX: legibility and standardization

| Item | Notes |
|---|---|
| **Critical contrast bugs (invisible text)** | Pet type selector on the dashboard (coral on coral) → `text-white`. "Close"/"Cancel" buttons with `bg-[#211f1e]` and no text color → `text-white`. |
| **All 40 TextInputs standardized** | White background + explicit `#211f1e` text + `placeholderTextColor="#9BA1A6"` on every screen: login, register, register-extended, forgot-password, reset-password, verify-otp, editar-perfil, dashboard, mensajes/[id], grupos, historias, comunidad. |
| **Higher contrast for metadata** | ~30 `text-gray-400` → `text-gray-500` (timestamps, dates, counters, empty states) across 9 screens. |
| **Readable disabled/saving buttons** | "Saving/Publishing/Uploading" used `bg-gray-400` + white text (unreadable) → conditional `text-gray-700`. Chat send button (`bg-gray-300`) → `text-gray-500`. Groups "Leave" button → `text-gray-700`. |
| **Root fix: native dark theme** | `app.json`: `userInterfaceStyle: "automatic"` → `"light"`. Native components (Picker, dialogs, keyboard) no longer follow the phone's dark mode. |
| **Styled Pickers** | "Size" (dashboard) and "Neighborhoods" (register-extended): white container + `style={{ color: "#211f1e", backgroundColor: "#ffffff" }}` + `color` on each `Picker.Item`. |
| **`PasswordInput` component** | `components/PasswordInput.tsx` — eye toggle (Ionicons `eye`/`eye-off`) on the right via `flex-row`. Replaces the 5 password inputs: login, register (×2), reset-password (×2). |
| **Onboarding with AsyncStorage** | `hasSeenOnboarding` flag: saved when finishing the 3 steps or tapping "Skip" (`index.tsx`); redirects to `/login` if already seen (with an anti-flicker spinner); cleared on logout (`dashboard.tsx`). |
| **Unified "Lucky Tracker" brand** | "La Peturnidad" → "Lucky Tracker" in login, dashboard header, welcome toast and the `app.json` display name. (Slug/scheme/package unchanged.) |
| **Unified teal shades** | `#005e66` → `#007275` (dashboard, mensajes, perfil/[id]). *Reverted in Phase 11.* |
| **Centralized palette** | Created `utils/theme.ts` with brand colors and base classes (`inputBase`, `buttonPrimary`, etc.). |

### Bugs fixed (Phase 5)

| Bug | Fix |
|---|---|
| Invisible text: coral on coral (pet type selector) | `text-[#ff7e70]` → `text-white` when selected |
| Dark buttons with no text color ("Close"/"Cancel") | Added `text-white` |
| "Size"/"Neighborhoods" Picker with dark background and white text (OS dark mode) | `userInterfaceStyle: "light"` + explicit color/background styles on Picker and items |
| Password inputs without show/hide toggle | New `PasswordInput` with eye icon |
| Onboarding shown on every launch | `hasSeenOnboarding` flag in AsyncStorage |

## ✅ Phase 6 — Cleanup and stability

| Item | Notes |
|---|---|
| **Fix `services/alerts.service.ts` (broken typecheck)** | Removed an orphaned merge block (duplicate catch/return outside any method). **Push notification logic is intact** (alert insert, neighbor FCM lookup, Edge Function call). The block was a syntax error that prevented the whole module from loading. |
| **Typecheck at 0 errors** | ~35 pre-existing errors fixed: `result.data ?? []` in setState on ~12 screens, `followersRes.data?.length ?? 0`, non-existent `Opacity` import in `Button.tsx` (+ `Omit` of `onBlur`/`onFocus`), `url as Href` cast in `_layout.tsx`, `tsconfig.json` now excludes `supabase/` (Deno code, not typechecked with RN). `tsc --noEmit` clean. |
| **Fix pull-to-refresh (real spinner)** | `historias.tsx`, `panel-moderacion.tsx` and `grupos/[id].tsx` used `refreshing={loading}`, so the spinner never showed. Now a `refreshing` state + `handleRefresh`. |
| **Dead code removed** | Deleted the old unused `components/dashboard/*` files and `components/SkeletonLoader.tsx` — verified to have no imports. (The current `components/dashboard/*` was created in Phase 7.) |
| **Pet edit flow restored** | The local `PetDetailModal` received `onEdit={handleStartEdit}` but ignored it, so there was no "Edit" button. It now accepts `onEdit` and renders the button. |
| **Keyboard no longer covers auth inputs** | `KeyboardAvoidingView` (behavior="padding", iOS offset 100) on login, register, register-extended and reset-password. |
| **Auto-login with an active session** | `index.tsx` and `login.tsx` call `supabase.auth.getSession()` on mount: active session → dashboard (or email-confirmacion if unconfirmed, or register-extended if the profile is incomplete). Onboarding only shows without a session. |
| **Lint: 20 → 16 warnings** | Removed 4 warnings (unused imports/variables). The remaining 16 `react-hooks/exhaustive-deps` warnings were fixed in Phase 7. |

## ✅ Phase 7 — UX improvements and code quality

| Item | Notes |
|---|---|
| **Solid teal header** | `_layout.tsx` `screenOptions`: teal `headerStyle`, `headerTintColor: "#ffffff"`, `headerTitleStyle: { fontWeight: "700" }`. |
| **Global ErrorBoundary** | `<ErrorBoundary>` wraps the `<Stack>` in `_layout.tsx` — branded fallback if a screen crashes. |
| **Loading skeletons** | New `components/Skeleton.tsx` (Skeleton, ListSkeleton, CardSkeleton with an Animated pulse). Replaced full-screen ActivityIndicators on dashboard, mensajes, grupos and historias. |
| **verify-otp UX** | Auto-verifies at 8 digits (`handleOtpChange` strips non-digits and calls `handleVerify()`), `textContentType="oneTimeCode"` for code autofill. |
| **EmptyStates with actions** | New `components/EmptyState.tsx` (icon/title/subtitle/button). Used in grupos ("Create group"), historias ("Post story"), comunidad ("Post notice"), panel-moderacion and mensajes. |
| **Reload on focus** | `useFocusEffect` + a `firstFocus` ref (skips the initial load) in grupos, mensajes and comunidad. |
| **Lint at 0 warnings** | The 16 `react-hooks/exhaustive-deps` warnings were suppressed with `eslint-disable-next-line` placed right before the hook's closing line (where the rule reports) plus a justification comment. |
| **CI/CD with GitHub Actions** | New `.github/workflows/ci.yml`: push to main + pull requests → `bun install --frozen-lockfile` + `bun run lint` + `bun run typecheck`. `typecheck` script added to `package.json`. |
| **Generated types** | New `types/database.ts` (tables, RPC functions and `Tables`/`TablesInsert`/`TablesUpdate` helpers). `services/dashboard.service.ts` uses `Row` aliases (`UserProfile`, `Pet`, `EmergencyAlert`, `FoundPet`); optional fields are now `string \| null` like the real schema. `FoundPetWithDetails`/`EmergencyAlertWithOwner` (join types) stay manual. |
| **Search** | New `/buscar` screen (Pets/Groups/Users tabs) + `services/search.service.ts` (`ilike` search, 300 ms debounce, 20 results max). New RLS policy `Authenticated users can view all pets` (the old one only allowed viewing your own, so pet search failed). |
| **Dashboard refactor** | `app/dashboard.tsx`: **2125 → 759 lines**. UI extracted to `components/dashboard/*`: `TabBar`, `DashboardSkeleton`, `PetDetailModal`, `PetForm`, `HomeTab`, `ProfileTab`, `EmergencyTab`, `FeedTab`, `ComunidadTab`. Tabs and forms own their local state; the dashboard keeps only data + handlers (~40 states → ~24). `formatDate` moved to `utils/format.ts`. Note: sub-tabs/posts/notices no longer persist across tab switches. |

## ✅ Phase 8 — Uniwind fix and icon redesign

| Item | Notes |
|---|---|
| **Critical fix: Uniwind scanner only covered `app/`** | The Tailwind v4 scanner (via Uniwind) uses `base = dirname(global.css)`, so only classes used in `app/` were compiled. After the dashboard refactor, classes used only in `components/` had no styles: invisible "View lost pets" button, missing gaps, 0×0 images. Fix: `@source "../components";` in `app/global.css`. |
| **EmergencyTab redesign** | From a column of 4 buttons to a **2×2 card grid**: Ionicons in a `bg-white/25` circle (megaphone, eye/eye-off, clipboard, checkmark-circle), title + subtitle, active state `bg-[#211f1e]` with "✓ Visible". |
| **Icon overhaul: emojis → Ionicons (whole app)** | Shared components (`EmptyState` — `icon` prop is now `keyof typeof Ionicons.glyphMap`, `Button`, `ToastConfig`, `ErrorBoundary`), the whole dashboard (dog/cat icons via MaterialCommunityIcons) and 12 screens. Only remaining emojis: `console.log` calls in register.tsx and the "✓" text in EmergencyTab. |
| **Verification** | `npm run lint` (0 errors/0 warnings) + `tsc --noEmit` (0 errors). |

## ✅ Phase 9 — 3-color system

| Item | Notes |
|---|---|
| **Unified palette (3 colors + neutrals)** | Teal (primary: header, CTAs, active selections, toggles, success), coral `#ff7e70` (accent: emergencies, badges, empty states, fallback avatars), dark `#211f1e` (text, surfaces, secondary buttons). Neutrals: cream `#faf5e0` background, white cards, grays for text/borders. |
| **Colors removed (~11 shades → 3)** | Green, yellow/amber, blue and violet replaced by teal, coral or dark. Dead leftovers (`#0a7ea4` in ThemedText) removed. |
| **Red = destructive only** | Delete pet and delete alert use red; form errors and the error toast keep red. |
| **Inverted hierarchy** | Teal went from 16 → ~124 uses; coral from 147 → ~95. Every CTA (Publish, Save, Send, Create, Join, Follow, login/register, Get started, upload photo, "Found it", Reviewed) is teal. |
| **Branded logout modal** | Native `Alert.alert` replaced by the reusable `components/ConfirmModal.tsx`. `handleLogout` only opens the modal; `handleLogoutConfirm` signs out, clears `hasSeenOnboarding`, navigates and shows a toast. |
| **Verification** | `npm run lint` (0 errors/0 warnings) + `tsc --noEmit` (0 errors). |

## ✅ Phase 10 — Lucky Tracker Design System v1.0

| Item | Notes |
|---|---|
| **Design system import** | `Lucky Tracker Design System` project imported from Claude Design. Refines the current look without changing the brand palette (teal/coral/dark/cream); the change is semantic. |
| **Color semantics: teal = the only action color, coral = emergency only** | Coral used as a generic "primary" failed WCAG contrast as text on cream (~2.2:1, minimum 4.5:1). Teal is now the only action/primary navigation color; coral is reserved for the Emergency section. New tokens: `coral-800 #c2402f` (coral readable as text), `danger #d93a3a` (replaces loose Tailwind `red-500`), `warning #e8a93b`, `success #2e9e63`, `line #e3dccb`. `constants/Colors.ts` and `utils/theme.ts` are the token source of truth. `TabBar.tsx`: active bar/icon is teal for all tabs except the Emergency icon, which stays coral. Role badges: "Admin" = solid ink-900, "Moderator" = solid teal. Applied in ~29 files. |
| **Input focus (teal border + halo)** | Added a `focused` state to all 34 text fields (16 files): teal border + `shadow-[0_0_0_3px_rgba(0,114,117,0.14)]` halo on focus. Fixed centrally in `PasswordInput.tsx` and the `Input` in `Button.tsx`. |
| **Consistent radii and shadows** | Cards/panels `rounded-2xl` (16px), buttons `rounded-xl` (12px), inputs `rounded-lg` (8px). Buttons flat; cards use shadow e1 (`0 1px 2px rgba(33,31,30,.08)`); modals e3; Community "new notice" sheet e2; `TabBar` with no shadow (top border only). Spacing already followed the base-4 scale. |
| **Verification** | `tsc --noEmit` clean after each pass. No remaining `red-500` (all migrated to `danger`). |

## ✅ Phase 11 — Branding, copy, post creation and Android fixes (Sep–Oct 2026)

| Item | Notes |
|---|---|
| **Teal aligned with the website** | Primary teal changed `#007275` → `#005e66` (`utils/theme.ts`, `constants/Colors.ts`) to match the `secundario` color on luckytracker.com.mx. See [`BRANDING.md`](BRANDING.md). *Reverted later: the code uses `#007275`.* |
| **FAQ and How-to screens** | New `app/faq.tsx` and `app/como-usar.tsx`, reachable from the Profile tab menu. |
| **Copy fixes (bugs #1–9)** | Capitalized days on onboarding and dashboard, accent fixes ("Confirmá" → "Confirma", email confirmation screen), "email" → "correo electrónico" across screens, "Historial propio" → "Historial", singular/plural for pet counts, centered "last updated" date in the profile. |
| **Advanced post creation** | New `components/PostForm.tsx` modal: gallery/camera images, location, `@user` tags and URLs. Images upload to the new `posts` bucket (falls back to `public`). GPS detection was removed for web compatibility. **Only `content` and the first image are persisted** — see the backlog. |
| **ProfileTab redesign** | Consistent menu style; navigation link colors changed from red to teal; invalid `font-[Inter_*]` classes removed. |
| **Android navigation bar** | `_layout.tsx` hides the system navigation bar; `TabBar` respects safe-area insets. |
| **Fix: pet image hidden after selecting it** | `PetForm` preview fixed. |
| **expo-location SDK mismatch** | `expo-location ^57` → `~19.0.8` (SDK 54); 57.x crashed the release build at startup (`NoClassDefFoundError AnyTypeCache`). |

## ✅ Phase 12 — Automated testing

| Item | Notes |
|---|---|
| **Unit tests (Jest + RNTL)** | `jest-expo` setup with a chainable Supabase mock and expo-router/toast mocks (`test/`). Tests in `__tests__/` for `utils/format`, auth/pets/follows/alerts/matching services, `PasswordInput`, `ConfirmModal`, `EmptyState`, and the login and verify-otp screens. CI runs a parallel test job with a coverage threshold and uploads the report. |
| **E2E (Maestro)** | 5 flows in `.maestro/flows/` (onboarding skip, login validation, bad credentials, login + auto-login, logout) + a `complete-profile` subflow. Nightly + manual workflow `.github/workflows/e2e.yml`. Status and coverage: [`E2E_TEST_RESULTS.md`](E2E_TEST_RESULTS.md). |
| **Accessibility** | `PasswordInput` visibility toggle now has an accessibility label. |

## ✅ Phase 13 — Pre-launch hardening (2026-10-24)

| Item | Notes |
|---|---|
| **Supabase** | Migrations `20261024000001_prelaunch_rls_hardening` and `20261024000002_messaging_blocks_push`: `WITH CHECK` on UPDATE, no SECURITY DEFINER for `anon`, messages only between participants and not across blocks, unique DM/group chats, `found_pets` filled by trigger from the alert, `device_tokens` with PK = `token` and RPC `register_device_token`, moderators can delete content, realtime on `messages` |
| **Rate limits** | `20261024000003_rate_limits`: trigger `enforce_rate_limit` per table (posts 10/h, comments 30/h, messages 30/min, announcements 5/h, alerts 5/day, reports 10/h, stories 5/day, groups 3/day); `created_at` is set by the server |
| **Edge functions** | `delete-account` (account deletion required by Google Play) and `send-push-notification` (atomic `notified_at` claim, recipients from the alert, FCM batches, only `UNREGISTERED` tokens deleted; later versions also write the inbox row) |
| **App** | Delete account, report/block users, chat realtime, group chat via RPC `join_group_conversation`, password rules (8+ with letters and numbers), auth without back-stack loops, notification deep link on cold start |
| **Security screen** | `app/seguridad.tsx`: change password (re-authenticates with the current one) and change email (confirmation link to the new address) |
| **Notification inbox** | `app/bandeja.tsx` + `notificationsService`; tapping an item marks it read and opens its `data.url` (only paths starting with `/`) |
| **Feed pagination** | `postsService.getAllPosts(before?, limit = 20)` by cursor; infinite scroll in the Social segment |
| **Typed client** | `createClient<Database>`; `types/index.ts` derives from `Tables<>` |
| **Icon and splash** | Generated from the isotype (`Isotipo_color_Salmon.png`) on cream `#faf5e0` |
| **Tests** | 16 suites / 120 tests; the push edge function is tested by loading the Deno code with mocks |

## ✅ Phase 14 — UI V2 redesign (2026-10-29/30)

| Item | Notes |
|---|---|
| **Design Kit** | `components/kit/Kit.tsx` shared by every screen — see [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) |
| **Screens redesigned** | Feed, Emergencia, Inicio (pet form and detail as bottom sheet), Mensajes and chat, Perfil, public profile, edit profile, followers, inbox, preferences, security, all auth and onboarding, search, groups, stories, FAQ, how to use, moderation, `PostForm`, `TabBar`, `ConfirmModal`, not-found. No logic, service or prop changes |
| **No navigation bar** | Dashboard and every auth screen use `headerShown: false` |
| **Confirmations** | `confirmDialog` replaces the 12 `Alert.alert` calls |
| **Toasts** | White card, closable; new `welcome` type |
| **Animated splash** | `components/AnimatedSplash.tsx`, ~2.2 s, fade only with reduced motion |
| **Image upload fix** | `dashboardService.uploadImage` reads local files with `new File(uri).arrayBuffer()` (`expo-file-system`); `fetch("file://...")` returned the text "File not found" and uploaded it as the photo |
| **Dropped** | The "Instagram-style" redesign (spec and plan of 2026-10-29): do not resume it |

## ✅ Phase 15 — Local audit fixes (2026-10-31)

| Item | Notes |
|---|---|
| **Offline** | `getCurrentUser()` keeps the stored session; the dashboard shows a retry instead of "incomplete profile" when loading fails |
| **Logout** | Local scope only, also works offline |
| **Colonia** | Edit profile uses postal code + `ColoniaPicker`; alerts compare colonias by exact equality |
| **Chat** | Last 500 messages; "Hoy/Ayer" by calendar day; safe area and keyboard handling; "Conversación cerrada" when the other person left a 1:1 chat |
| **Cleanup** | Removed `EmptyState`, `ThemedText`, `ThemedView`, `hooks/`, `constants/Colors.ts`, `utils/theme.ts`, the `reset-project` script and unused dependencies (`axios`, `expo-blur`, `expo-image-manipulator`, `expo-location`, `expo-symbols`, `react-native-webview`, `@react-navigation/drawer`, `react-native-url-polyfill`) |

## ✅ Phase 16 — Supabase closure and SDK 58 (2026-11-03/05)

| Item | Notes |
|---|---|
| **Profile privacy** | `public_profiles` view, contact RPCs, `user_profiles` closed to non-owners — see [`SUPABASE_HARDENING_PLAN_2026-11-02.md`](SUPABASE_HARDENING_PLAN_2026-11-02.md) |
| **Age** | Minimum 18 (`utils/age.ts`, trigger `enforce_min_age`) |
| **Phone** | E.164 with country selector (`PhoneField`, `utils/phone.ts`) |
| **No emojis** | Anywhere, including push and inbox text; `OptionSheet` replaces the native Picker |
| **Text limits** | `utils/limits.ts` (`LIMITS`) with `maxLength` on every field |
| **Expo SDK 54 → 58** | `expo@58`, React Native 0.88, React 19.3, TypeScript 6, Jest 30 + `jest-expo` 58; `app.json` dropped `newArchEnabled`, `edgeToEdgeEnabled` and `navigationBar`; `expo-doctor` clean |
| **Legal** | The app links to `luckytracker.com.mx/terms` and `/policy` (`utils/legal.ts`); required checkbox in register |

## ✅ Phase 17 — QA ticket fixes (2026-11-04)

| Item | Notes |
|---|---|
| **Follower counters** | Profile uses `followsService.getCounts` and reloads on dashboard focus |
| **Richer posts** | `PostForm`: up to 5 images (gallery or camera), free-text location, tags (also extracted from `#hashtags`), up to 3 links. Migration `posts_media_location_tags_links`: `posts.image_urls`, `location`, `tags`, `links` with CHECK limits and a GIN index on `tags` (`image_url` still holds the first image) |
| **Feed** | Image carousel, location, tappable tags filtering the feed on the server, links via `Linking` |
| **Camera permission** | `app.json` now declares `cameraPermission` (needs a new build). Location is text only, no GPS, on purpose |
| **Open question** | "Tags" was built as hashtags; if QA meant tagging people (`@mentions`), that is missing |

---

## 🔧 Open work / technical debt

Open tasks with dates and owners live in [`BACKLOG.md`](BACKLOG.md). Longer-term technical debt:

### 🟥 High priority

| Item | Notes |
|---|---|
| **Launch blockers** | Phone QA on the new build, legal pages published and reviewed, Play Console listing, production build — see `BACKLOG.md` |
| **Push end to end** | FCM delivery with the SDK 58 build needs a second device |
| **E2E coverage** | Only the auth flows are covered, and they were adapted to UI V2 but not re-run. Plan: [`E2E_SESSION_STATUS.md`](E2E_SESSION_STATUS.md) |

### 🟡 Medium priority

| Item | Notes |
|---|---|
| **Test coverage** | Not covered: `app/dashboard.tsx` as a whole (900+ lines; only its services and `FeedTab`), social screens, `perfil/[id]`, `seguridad`, `bandeja` |
| **Baseline migration** | `supabase/migrations/` has the recent migrations but no baseline; older ones were applied from the dashboard |
| **Offline support** | Only the stored session survives without network; no data cache |
| **Dark mode** | Not implemented — `userInterfaceStyle: "light"` is forced (decision: light theme only) |
| **Supabase plan** | Free plan: no backups, project pauses after ~7 days idle |

### 🟢 Low priority

| Item | Notes |
|---|---|
| **Analytics / crash reporting** | No Sentry, PostHog, etc. |
| **i18n** | All copy is hardcoded Spanish (no translation system) |
| **Clean up storage policies** | Duplicate INSERT policies on `storage.objects` (3 per bucket) |
| **Serve the colonias catalog from an API** | Large JSON shipped in the client (`ColoniaPicker`) |
| **Database webhooks** | Push is triggered from client/service code. Optionally move it to Supabase webhooks: `emergency_alerts` INSERT + `messages` INSERT → `send-push-notification` |
| **Verify the push sender label** | An older build showed "La-Peturnidad" as the notification sender; `app.json` now says "Lucky Tracker" — confirm on a fresh build |
