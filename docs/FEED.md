# Feed

The **Feed** tab is the community hub. It replaced the old separate "Comunidad" tab, so the dashboard has 5 tabs: Inicio / Feed / Emergencia / Mensajes / Perfil.

A segmented control at the top switches between three views:

| Segment | Content | Notes |
|---|---|---|
| **Emergencias** | Active lost-pet alerts in the user's area | Coral accent. Empty state: "Todo tranquilo" |
| **Anuncios** | Community notices (general, notice, event, question) | Authors can delete their own; moderators can delete any |
| **Social** | Pet social posts | Newest first, loaded in pages of 20 (infinite scroll); tapping a `#tag` filters the feed on the server |

"Publicar" (top right) opens `PostForm`: text, up to 5 images (gallery or camera), free-text location ("Mi zona" fills the profile's colonia and city), tags (`#hashtags` in the text are extracted too), up to 3 http(s) links, and a notice category.

Posts from users the current user blocked are hidden on the client, so a page can look short.

## Standalone `/comunidad` screen

`app/comunidad.tsx` ("Comunidad — Avisos de tus vecinos") still exists as a route, but nothing in the app links to it any more. Either remove it or link it from somewhere; until then, treat Feed → Anuncios as the real entry point.

## History

An early product analysis found that Comunidad duplicated about 80% of Feed and recommended folding it into Feed (emergencies and notices as sub-sections). That is what shipped. The original specs (`FEED_VS_COMUNIDAD_SPEC.md`, `PRODUCT_ANALYSIS_FEED_COMUNIDAD.md`) were removed in the 2026-11-07 docs cleanup; they live in git history.
