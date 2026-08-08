# DASHBOARD — Main App Area

> Area doc. Source screens: `docs/images/Dashboard/1.jpeg`–`31.jpeg` (29-31 added later to fill the Pet Detail gap). Cross-checked against `docs/SCREENS.md` §9-29. 29/31 images matched an existing documented screen/state; 2 images (29, 31) surfaced 1 previously-undocumented modal (Delete Pet confirm) — see [Observations](#observations--flags).

## Screens covered

| Screen | Route | Images |
|---|---|---|
| Sección Inicio (Home tab) | `/dashboard` | 1, 2, 5 |
| Buscar | `/buscar` | 3 |
| Formulario de Mascota | (modal) | 4, 30 |
| Ficha de Mascota (Pet Detail window) | (modal) | 29 |
| Confirm: Eliminar mascota | (modal) | 31 |
| Sección Comunidad (tab) | `/dashboard` | 6 |
| Sección Emergencia (tab) | `/dashboard` | 7, 13, 14, 15, 17, 18, 24, 25 |
| Perfil (own, tab) | `/dashboard` | 8, 9, 10, 26 |
| Sección Feed (tab) | `/dashboard` | 11, 12 |
| Mensajes | `/mensajes` | 19 |
| Reuniones Exitosas | `/historias` | 20 |
| Grupos | `/grupos` | 21 |
| Notificaciones | `/notificaciones` | 22 |
| Editar Perfil | `/editar-perfil` | 23 |
| OS push notification | (system, external) | 16 |

## Bottom bar

5 fixed tabs: **Feed · Inicio · Comunidad · Emergencia · Perfil**. Active tab highlighted (red icon/underline in captures).

## Screen details

### Sección Inicio (imgs 1, 2, 5)
Greeting (`¡Hola, {name}!`) + date, 3 summary cards (Mascotas / Alertas / Encontradas), search icon (top right) opens Buscar. "Registrar mascota" + "Ver mascotas"/"Ocultar mascotas" toggle buttons. Empty state (img 1-2): "No tienes mascotas registradas." Populated state (img 5): pet card w/ photo, name, type, size.

### Buscar (img 3)
Search bar + 3 tabs: Mascotas / Grupos / Usuarios. Mascotas tab active by default.

### Formulario de Mascota (imgs 4, 30)
Modal/screen: Tipo (Perro/Gato toggle), Nombre, Color, Tamaño (dropdown), Características especiales (optional), Foto (required, "Seleccionar" button). Two modes, same form:
- **Register mode** (img 4): empty fields, button reads "Registrar".
- **Edit mode** (img 30): pre-filled w/ existing pet data, title "Editar mascota", photo field shows a "✓ Foto lista para usar" confirmation state instead of the picker, button reads "Actualizar" instead of "Registrar".

### Ficha de Mascota — Pet Detail window (img 29)
Modal opened by tapping a pet from Sección Inicio. Shows photo, name (header), Tipo, Color, Tamaño, Características, Registrada (date). Three actions: **Editar** (→ Pet Form in edit mode), **Eliminar** (→ Confirm: Eliminar mascota), **Cerrar**. Previously had no screenshot — gap now closed.

### Confirm: Eliminar mascota (img 31)
Modal triggered from Pet Detail → Eliminar. Copy: *"¿Estás seguro de que quieres eliminar esta mascota? Esta acción no se puede deshacer."* Cancelar / Eliminar buttons. **Not previously documented as a distinct state** in `SCREENS.md` (§11 only says "Pide confirmación para eliminar" without detail) — now captured.

### Sección Comunidad (img 6)
Tabs "Comunidad" / "Mis avisos", "+ Nuevo" button top right. Post card: author, date, category badge (e.g. "Aviso"), title, body, comment count.

### Sección Emergencia (imgs 7, 13, 14, 15, 17, 18, 24, 25)
2×2 action grid: Reportar mascota perdida / Ver mascotas perdidas / Ver mis alertas / Ver mascotas encontradas — each card toggles into a visible list below and its own label flips to an "Ocultar ..." state with a "✓ Visible" sub-label (e.g. img 14's "Ocultar mascotas perdidas" once expanded).

- Img 13: pet selector for reporting ("Selecciona la mascota perdida", REPORTAR button per pet).
- Img 15: confirm modal "Crear alerta de emergencia" — explicit copy: *"Esta alerta será visible para todos los vecinos de tu colonia."*
- Img 14: "Mascotas perdidas en tu colonia" list — card per alert (photo, name, type, description, last-seen location + date, owner name + phone, "Lo encontré" button).
- Img 17: "Mis alertas activas" — own alerts w/ "Eliminar alerta" button.
- Img 18/25: "Mascotas que he encontrado" — empty vs. populated (found-date shown once reported).
- Img 24: confirm modal "Reportar mascota encontrada" — *"Al confirmar, te pondremos en contacto con el dueño."*

### Perfil — own profile (imgs 8, 9, 10, 26)
- Img 8: "Mi Perfil" header, avatar (editable via camera icon overlay), Información personal card (Nombre, Email, Teléfono, Cumpleaños), Dirección card (Calle/Colonia, Ciudad, C.P.).
- Img 9: Estadísticas (Mascotas/Seguidores/Siguiendo counts) + Acciones list (Editar perfil, Configurar notificaciones, Ir a la comunidad, Mensajes, Grupos, Reuniones exitosas).
- Img 10: scrolled further — Cuenta card (Miembro desde, Última actualización) + "Cerrar Sesión" button.
- Img 26: "Cerrar sesión" confirm modal — Cancelar / Cerrar sesión.

### Sección Feed (imgs 11, 12)
Tabs "Feed" / "Mis posts", "Publicar" button opens inline composer (text field + Publicar/Cancelar). Post card: author avatar/name, date, text, comment count + "Ver comentarios" link. Empty state on "Mis posts": "No has publicado nada aún."

### Mensajes (img 19)
Empty state: "No tienes conversaciones aún. Visita un perfil público y envía un mensaje para iniciar una conversación."

### Reuniones Exitosas (img 20)
"+ Nueva" button, empty state w/ "Publicar historia" CTA: "No hay historias de éxito aún."

### Grupos (img 21)
"+ Crear" button, list of groups (name, member count, "Unirse" button per row).

### Notificaciones (img 22)
"Preferencias" card: main toggle "Notificaciones push" + 3 sub-toggles (Alertas de mascotas perdidas, Mascotas encontradas, Avisos de la comunidad), "Guardar preferencias" + "Volver" buttons.

### Editar Perfil (img 23)
Pre-filled form: Nombre, Apellido, Teléfono, Dirección/Colonia, Ciudad, Código Postal. "Guardar cambios" / "Cancelar".

### OS push notification (img 16)
External evidence (Android notification shade) confirming the emergency-alert push actually fires: *"Kevin Ortega reportó a Naranja perdida — Vista por última vez en El Pípila."*

## Observations / flags

- **Branding leftover**: the push notification (img 16) shows the sender label as **"La-Peturnidad"**, the old app name — app UI elsewhere consistently shows "Lucky Tracker". Likely a leftover in the push notification payload / Expo project name config. Worth a fix ticket.
- Img 21 group named literally `"2"` appears to be test/seed data, not a UI issue.
- **Resolved**: Pet Detail window gap (previously "no screenshot") closed by img 29.
- **New finding**: the Delete Pet confirm modal (img 31) wasn't previously called out as its own state — minor doc gap, not a bug.
