# Branding

Source of truth: the Tailwind classes in the code and [`components/kit/Kit.tsx`](../components/kit/Kit.tsx) (`utils/theme.ts` and `constants/Colors.ts` were removed on 2026-10-31). Component and layout rules: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).

## Colors

| Name | Hex | Role |
|---|---|---|
| Teal | `#007275` | Primary color: CTAs, active tabs, selections, header, success. |
| Coral | `#ff7e70` | Accent: emergencies (lost pets), badges, empty states. Not a generic action color. |
| Dark | `#211f1e` | Charcoal — text, dark surfaces, secondary buttons. |
| Cream | `#faf5e0` | Off-white app background. |

Red is only for destructive actions and errors.

> History: the teal was briefly changed to `#005e66` to match the website, then unified back to `#007275` (the value used everywhere in the code today). Older entries in `PROGRESS.md` mention `#005e66`.

## Coral on the website vs. the app

On the website, coral is the primary marketing color (buttons, hovers, hero). The app inverts this on purpose: teal is the primary action color and coral is kept for Emergency, so emergencies keep their visual urgency. This is a deliberate decision, not an inconsistency to fix.

## Name

The app is **Lucky Tracker** (formerly "La Peturnidad"). The Expo slug (`la-peturnidad`), URL scheme (`lapeturnidad`) and Android package (`com.idarko.lapeturnidad`) keep the old name on purpose — changing them would break existing installs and deep links.
