# DASHBOARD — Main App Area

> Area doc. Screenshots in `images/dash-*.jpg` and `images/screen-*.jpg`, captured 2026-11-07 on the redesigned app (UI V2) with the flows in `.maestro/screenshots/`, using test accounts and made-up data. Per-event detail: [`SCREENS.md`](SCREENS.md) §9+. How the images were produced: [`auto_testing/EMULATOR_RUN_2026-11-07.md`](auto_testing/EMULATOR_RUN_2026-11-07.md).

## Bottom bar

5 fixed tabs: **Inicio · Feed · Emergencia · Mensajes · Perfil**. The active tab has a sliding teal pill (the Emergencia icon stays coral) and Mensajes shows an unread badge. There is no top bar on the dashboard.

## Tabs

| Tab | What it shows | Images |
|---|---|---|
| Inicio | Greeting and date, summary cards (Mascotas / Alertas / Encontradas), "Registrar mascota", "Mis mascotas" | [empty](images/dash-inicio-empty.jpg), [with a pet](images/dash-inicio-with-pet.jpg) |
| Feed | Segments Emergencias / Anuncios / Social, "Publicar" ([`FEED.md`](FEED.md)) | [Emergencias](images/dash-feed-emergencias.jpg), [Anuncios](images/dash-feed-anuncios.jpg), [Social](images/dash-feed-social.jpg) |
| Emergencia | Report-lost banner plus Perdidas / Mis alertas / Encontradas | [grid](images/dash-emergencia.jpg), [pet selector](images/dash-emergencia-report.jpg), [Mis alertas](images/dash-emergencia-mis-alertas.jpg), [Encontradas](images/dash-emergencia-encontradas.jpg) |
| Mensajes | Conversation list, unread counts | [list](images/dash-mensajes.jpg) |
| Perfil | Photo, stats, personal info, grouped menu, account info, "Cerrar Sesión", "Eliminar cuenta" | [profile](images/dash-perfil.jpg), [menu](images/dash-perfil-menu.jpg) |

## Pets (Inicio)

| Screen | Image |
|---|---|
| Register pet form (type, name, color, size pills, characteristics, photo) | [filled](images/dash-pet-form-filled.jpg) |
| Edit pet | [edit](images/dash-pet-form-edit.jpg) |
| Pet detail (bottom sheet: Editar / Eliminar) | [detail](images/dash-pet-detail.jpg) |
| Delete pet confirmation | [confirm](images/dash-pet-delete-confirm.jpg) |

The photo comes from the system photo picker, then a crop step.

## Feed and posts

| Screen | Image |
|---|---|
| Post form, empty (type switch: "Social · con imagen" / "Anuncio") | [empty](images/dash-post-form.jpg) |
| Social post filled (image, "Mi zona", `#tags`) | [filled](images/dash-post-form-filled.jpg) |
| Notice form (title, category chips General / Aviso / Evento / Pregunta, description) | [anuncio](images/dash-post-form-announcement.jpg) |

## Emergencia confirmations

- Create alert: "¿Estás seguro de que quieres reportar a Luna como perdido? Esta alerta será visible para todos los vecinos de tu colonia." — [confirm](images/dash-emergencia-confirm.jpg). Cancelled during capture: no alert was created, to avoid notifying real neighbors.
- Report found ("Al confirmar, te pondremos en contacto con el dueño") and the OS push notification are not captured: they need a second account with an active alert and working FCM delivery.

## Perfil menu screens

| Screen | Route | Image |
|---|---|---|
| Notification inbox | `/bandeja` | [inbox](images/screen-bandeja.jpg) |
| Edit profile | `/editar-perfil` | [edit profile](images/screen-editar-perfil.jpg) |
| Account and security | `/seguridad` | [security](images/screen-seguridad.jpg) |
| Notification preferences | `/notificaciones` | [preferences](images/screen-preferencias.jpg) |
| Groups | `/grupos` | [list](images/screen-grupos.jpg), [create](images/screen-grupos-form.jpg) |
| Group detail | `/grupos/[id]` | [detail](images/screen-grupo-detalle.jpg) |
| Success stories | `/historias` | [empty](images/screen-historias-empty.jpg), [form](images/screen-historias-form.jpg), [published](images/screen-historias.jpg) |
| How it works | `/como-usar` | [guide](images/screen-como-usar.jpg) |
| FAQ | `/faq` | [FAQ](images/screen-faq.jpg) |
| Moderation panel (admin) | `/panel-moderacion` | [panel](images/screen-moderacion.jpg) |
| Log out / Delete account confirmations | (modals) | [logout](images/dash-logout-confirm.jpg), [delete account](images/dash-delete-account-confirm.jpg) |

## Search and social

| Screen | Route | Image |
|---|---|---|
| Search | `/buscar` | [search](images/screen-buscar.jpg), [users tab](images/screen-buscar-usuarios.jpg) |
| Public profile | `/perfil/[id]` | [profile](images/screen-perfil-publico.jpg), [after following](images/screen-perfil-publico-siguiendo.jpg), [report/block menu](images/screen-perfil-publico-menu.jpg), [report reasons](images/screen-reportar-usuario.jpg) |
| Chat | `/mensajes/[id]` | [chat](images/screen-chat.jpg) |
| Followers / following | `/seguidores` | [following](images/screen-seguidores.jpg) |

## Observations

- The Feed → Anuncios screenshot blurs the author of a pre-existing post by another user (live-project data); everything else is test data created for the capture.
- Screens documented only as text (no screenshot): New Password, found-pet confirmation, OS push notification, pending moderation states other than a single report.
- The notification sender label on an old build read "La-Peturnidad"; `app.json` now says "Lucky Tracker". Confirm on a device with real push.
