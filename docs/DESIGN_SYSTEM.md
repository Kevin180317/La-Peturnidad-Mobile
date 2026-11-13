# Design System

Source of truth: [`components/kit/Kit.tsx`](../components/kit/Kit.tsx). Colors and roles: [`BRANDING.md`](BRANDING.md). Every new or modified screen is built from the Kit; don't duplicate its styles by hand.

## Visual language

- Cream background `#faf5e0`.
- White cards, `rounded-3xl`, soft shadow (`CARD` / `CARD_SHADOW`).
- Pill buttons.
- Icons inside tinted circles or squares (`${color}1A`, i.e. the color at ~10% opacity).
- Screen titles live inside the content, not in the navigation bar.
- No emojis anywhere (screens, push notifications, inbox). Use `Ionicons`.
- Long option lists use `OptionSheet` (readable white sheet), not `@react-native-picker/picker` (dark and unreadable on Android).

## Kit components

| Component | Purpose |
|---|---|
| `Card` | White rounded card with shadow |
| `ScreenTitle` / `SectionTitle` | Screen title (with optional subtitle and right slot) / section heading with optional icon |
| `Avatar` | Photo, or initial on teal; optional teal ring |
| `RoundIconButton` | Circular icon button |
| `Chip` / `ChipTone` | Small label (`neutral`, `coral`, `teal`, `dark`) |
| `EmptyCard` | Empty-state card |
| `PetThumb` | Pet thumbnail |
| `PrimaryButton` | 52 px pill button; variants `teal`, `coral`, `ghost`, `danger` |
| `Field` | Labeled input with icon and teal border on focus |
| `ChoiceChips` | Replaces Pickers when there are few options |
| `ToggleTile` | Switch tile |
| `ListSection` / `ListRow` | Settings-style rows |
| `Segmented` | Segmented control with a sliding pill |
| `Sheet` | Bottom sheet with handle and close (X) button |

Other shared pieces: `components/PasswordInput.tsx` (eye toggle), `components/PhoneField.tsx` (country selector, E.164), `components/ColoniaPicker.tsx`, `components/AnimatedSplash.tsx`.

## Navigation

- No navigation bar (`headerShown: false`) on the dashboard and every auth screen (login, register, register-extended, forgot-password, verify-otp, reset-password, email-confirmacion). They use `useSafeAreaInsets`; in auth, the `headerless` prop of `AuthScreen` is used and `onBack` draws the back button.
- All other screens keep the teal header with a back arrow.
- The dashboard has 5 tabs: Inicio / Feed / Emergencia / Mensajes / Perfil (see [`FEED.md`](FEED.md)).

## Feedback

- **Confirmations**: never `Alert.alert`. Use `confirmDialog({ title, message, confirmLabel, destructive, icon, onConfirm })` from `components/ConfirmDialog.tsx`. A single `<ConfirmHost />` in `_layout` renders it and waits for `onConfirm` with a spinner. `destructive` (red) is only for delete/block. For modals with their own state use `ConfirmModal` (also accepts `destructive`).
- **Toasts**: `components/ToastConfig.tsx` (white card, dismissed by tapping or with the X; `topOffset={56}`). Types: `success`, `error`, `info`, `welcome` (filled teal; login and end of registration).
- **Loading**: `components/Skeleton.tsx` instead of full-screen spinners.

## Animation

- Use React Native's `Animated`, except for the splash (reanimated).
- Jest: reanimated is not mocked globally. In a test that needs it: `jest.mock("react-native-reanimated", () => require("../../test/reanimatedMock"))`. `react-native-safe-area-context` is mocked in `test/setup.ts`.

## Styling (Uniwind)

- The Tailwind v4 scanner only scans `app/` by default. `app/global.css` declares `@source "../components"` so classes in `components/` compile too. If you add `className` UI outside `app/` or `components/`, add the matching `@source`, or the classes generate no style (invisible buttons, 0x0 images, missing gaps).
- Brand-new classes (especially arbitrary values like `bg-[#dc2626]`) may not apply while Metro is running, because Uniwind's CSS is cached. Symptom: a white-text button that looks invisible on a white background. Fix: restart with `npx expo start -c`.

## Text that Maestro depends on (don't change)

"Inicia sesión para continuar", "Saltar", the "Perfil" tab label, "Cerrar Sesión" (ProfileTab), "Cerrar sesión" (modal), and `testID="login-submit"`.
