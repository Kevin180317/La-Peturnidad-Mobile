# Branding

Token source of truth: `utils/theme.ts` and `constants/Colors.ts`.

## Colors

| Name | Hex | Role |
|---|---|---|
| Teal | `#005e66` | The only action / primary navigation color (CTAs, active tabs, selections, header). Matches the `secundario` color on the website (luckytracker.com.mx). |
| Coral | `#ff7e70` | Reserved for the Emergency section (lost pets). Don't use it as a generic action or identity color. |
| Dark | `#211f1e` | Charcoal — text, dark surfaces, secondary buttons. |
| Cream | `#faf5e0` | Off-white app background. |

Supporting tokens (Phase 10 design system): `emergencyText #c2402f` (coral readable as text), `danger #d93a3a` (destructive actions and errors only), `warning #e8a93b`, `success #2e9e63`, `line #e3dccb`.

> History: the app teal was `#007275` from Phase 5 until September 2026, when it was changed to `#005e66` to match the website. Older entries in `PROGRESS.md` mention `#007275`.

## Coral on the website vs. the app

On the website, coral is the primary marketing color (buttons, hovers, hero). The app inverts this on purpose: teal is the primary action color and coral is kept for Emergency, so that section keeps its visual urgency. This is a deliberate decision, not an inconsistency to fix.

## Name

The app is **Lucky Tracker** (formerly "La Peturnidad"). The Expo slug (`la-peturnidad`), URL scheme (`lapeturnidad`) and Android package (`com.idarko.lapeturnidad`) keep the old name on purpose — changing them would break existing installs and deep links.
