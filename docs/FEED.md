# Feed

The **Feed** tab is the community hub. It replaced the old separate "Comunidad" tab, so the dashboard has 5 tabs: Inicio / Feed / Emergencia / Mensajes / Perfil.

A segmented control at the top switches between three views:

| Segment | Content | Notes |
|---|---|---|
| **Emergencias** | Active lost-pet alerts in the user's area | Coral accent. Empty state: "Todo tranquilo" |
| **Anuncios** | Community notices (general, notice, event, question) | Authors can delete their own; moderators can delete any |
| **Social** | Pet social posts | Newest first, loaded in pages of 20 (infinite scroll); tapping a `#tag` filters the feed on the server |

"Publicar" (top right) opens `PostForm`, a full-screen form with a type switch:
- **Social · con imagen**: text, 1 to 5 images (gallery, camera or selfie), free-text location ("Mi zona" fills the profile's colonia and city), tags (`#hashtags` in the text are extracted too) and up to 3 http(s) links.
- **Anuncio**: title, category (General / Aviso / Evento / Pregunta) and description.

Posts from users the current user blocked are hidden on the client, so a page can look short.

## Removed `/comunidad` screen

The standalone `app/comunidad.tsx` ("Comunidad — Avisos de tus vecinos") was removed on 2026-11-09: nothing linked to it and Feed → Anuncios covers the same function. It is still in git history if it is ever needed again.

## History

An early product analysis found that Comunidad duplicated about 80% of Feed and recommended folding it into Feed (emergencies and notices as sub-sections). That is what shipped. The original specs (`FEED_VS_COMUNIDAD_SPEC.md`, `PRODUCT_ANALYSIS_FEED_COMUNIDAD.md`) were removed in the 2026-11-07 docs cleanup; they live in git history.
