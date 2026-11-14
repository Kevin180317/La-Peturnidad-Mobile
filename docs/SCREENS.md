# Screens — Screen and Event Documentation

> Lucky Tracker (formerly "La Peturnidad") · Community app for finding lost pets

Documentation of **all app screens**: what each one does and **what event each user interaction triggers**. Last reviewed 2026-11-07 against the code (UI V2 redesign, 5-tab dashboard). Button labels in the app are in Spanish; they are translated here.

---

## Screen Index

| Screen | Route | Purpose |
|---|---|---|
| Onboarding | `/` | Welcome (3 steps) + automatic entry based on session |
| Login | `/login` | Access with email and password |
| Register | `/register` | Create new account |
| Complete Profile | `/register-extended` | Personal data + neighborhood |
| Verify Code | `/verify-otp` | Verify the 8-digit OTP code |
| Forgot Password | `/forgot-password` | Request the code to be sent |
| New Password | `/reset-password` | Set the new password |
| Confirm Email | `/email-confirmacion` | Confirm the account's email |
| Dashboard | `/dashboard` | Main screen with 5 tabs: Inicio, Feed, Emergencia, Mensajes, Perfil |
| Search | `/buscar` | Search for pets, groups, and users |
| Successful Reunions | `/historias` | Pet reunion stories |
| Groups | `/grupos` | List of neighborhood groups |
| Group Detail | `/grupos/[id]` | Group detail + group chat |
| Messages | `/mensajes` | List of conversations |
| Chat | `/mensajes/[id]` | Message thread (individual or group) |
| Followers | `/seguidores` | Follower and following lists |
| Profile | `/perfil/[id]` | Public profile of a user |
| Moderation Panel | `/panel-moderacion` | Report management (admin/moderator only) |
| Notification Inbox | `/bandeja` | Received push notices (lost-pet alerts, found-pet notices) |
| Notification Preferences | `/notificaciones` | Choose which notices to receive |
| Account and Security | `/seguridad` | Change password and email |
| Edit Profile | `/editar-perfil` | Edit personal data |
| How to Use | `/como-usar` | Step-by-step guide to the app |
| FAQ | `/faq` | Frequently asked questions |
| Not Found | — | 404 screen |

---

## Global navigation and session flow

- **Automatic entry**: when opening the app (Onboarding or Login), it checks whether there's an active session:
  - No session → shows the welcome screen or the login form.
  - Session with unconfirmed email → Confirm Email.
  - Confirmed session with profile → Dashboard.
  - Confirmed session without profile → Complete Profile.
- **Screen protection**: the other screens check the session when opened; if there's no user, they redirect to the start.
- **Notices**: actions show a temporary notice (success/error). Destructive actions (delete, remove, log out) ask for confirmation first.

---

## Registration and login screens

### 1. Onboarding — Route `/`

**What it does**: 3-step welcome carousel ("Report", "Connect", "Act") that also decides where the user lands based on their session.

**On open**:
- Checks the active session and redirects based on state (Confirm Email / Dashboard / Complete Profile).
- No session: reads the "welcome already seen" flag — if it exists, goes to Login; if not, shows the carousel.

**User events**:
| Event | What it triggers |
|---|---|
| "Skip" / "Get Started" button (last step) | Saves "welcome seen" and goes to Login |
| "Next" button | Advances to the next step; on the last one, finishes the welcome flow |
| Swipe the carousel | Changes the step indicator |

---

### 2. Login — Route `/login`

**What it does**: Login form with email and password. If a session already exists, enters automatically.

**User events**:
| Event | What it triggers |
|---|---|
| "Log in" button | Validates fields → attempts login. Success: unconfirmed email goes to Confirm Email; with profile shows "Welcome!" and enters the Dashboard; without profile requests Complete Profile. Error: notice |
| "Forgot your password?" | Goes to Forgot Password |
| "Sign up" | Goes to Register |

---

### 3. Register — Route `/register`

**What it does**: Creates the account with email, password, and password confirmation.

**User events**:
| Event | What it triggers |
|---|---|
| "Register" button | Validates fields, password match, the password rules (8+ characters with letters and numbers) and the required Terms/Privacy checkbox (links to `luckytracker.com.mx/terms` and `/policy`) → creates the account. While it runs, a "Procesando registro..." spinner shows. Success: shows "Confirm your email" and goes to Confirm Email |

---

### 4. Complete Profile — Route `/register-extended`

**What it does**: Register first name, last name, phone (country selector, stored as E.164), birth date (required; must be 18 or older), postal code, and select the colonia (neighborhood) with the colonia picker.

**User events**:
| Event | What it triggers |
|---|---|
| Typing the postal code | Numbers only (max 5); once 5 digits are complete, searches for colonias with that code; if none found, shows "Code not found" |
| Phone field | Country selector (Mexico, US/Canada, other with +code); digits only, 10 for MX/US |
| Typing the date | Live-formatted as day/month/year; under-18 dates are rejected |
| "Complete profile" button | Validates fields → saves the profile. Success: welcome notice and entry to the Dashboard |
| "Skip for now" | Returns to start |

---

### 5. Verify Code — Route `/verify-otp`

**What it does**: Requests the 8-digit code sent by email to recover the password. Automatically verified once the 8 digits are complete.

**User events**:
| Event | What it triggers |
|---|---|
| Typing the code (8 digits) | Automatic verification |
| "Verify code" button | Checks the code. Success: notice and goes to New Password. Error: "Incorrect code" |
| "Resend code" | Sends the code again by email |

---

### 6. Forgot Password — Route `/forgot-password`

**What it does**: Request the OTP code be sent to the email.

**User events**:
| Event | What it triggers |
|---|---|
| "Send code" button | Validates the email → sends the code. Success: shows "Check your inbox" and goes to Verify Code |

---

### 7. New Password — Route `/reset-password`

**What it does**: Set the new password after verifying the code.

**User events**:
| Event | What it triggers |
|---|---|
| "Update password" button | Validates fields and match → saves the password. Success: shows "You can now log in" and returns to start |

---

### 8. Confirm Email — Route `/email-confirmacion`

**What it does**: Asks to confirm the email from the link in the email and allows resending it. Shows the account's email.

**User events**:
| Event | What it triggers |
|---|---|
| "Resend email" button | Resends the confirmation email |
| "Back to start" | Returns to start |

---

## Dashboard (main screen)

### 9. Dashboard — Route `/dashboard`

**What it does**: Main screen with a bottom bar of 5 tabs: **Inicio, Feed, Emergencia, Mensajes, Perfil**. No navigation bar on top. Centralizes pets, alerts, notices, posts, messages and profile.

**What happens internally**:
- Loads profile, pets, follower/following counts and unread messages. If the profile fails to load (e.g. offline) it shows a retry card instead of "incomplete profile".
- Registers the device for push notifications.
- Opening Feed or Mensajes loads their content; the follower counters reload when the dashboard regains focus.
- Pulling down refreshes the active tab.

**User events**:
| Event | What it triggers |
|---|---|
| Magnifying glass button (Inicio) | Opens the Search screen |
| Register / edit pet | Creates or updates the pet (validates data). Success: toast and reload |
| Delete pet | Confirmation → deletes and reloads |
| Create emergency alert | Checks the address and confirms → publishes the alert **and notifies neighbors** |
| Delete alert | Confirmation → deletes and reloads |
| "Found it" | Reports the pet as found and removes its alert |
| Publish (Feed) | Opens the post form; creates the post or notice and reloads |
| Delete post / notice | Deletes it (own content; moderators can delete any) |
| Comment | Saves the comment |
| Log out | Confirmation → logs out on this device and returns to start |

---

### 10. Tab bar

**What it does**: Fixed bottom bar with the 5 tabs (Inicio, Feed, Emergencia, Mensajes, Perfil), a sliding pill indicator, and an unread badge on Mensajes.

**Events**: tapping a tab → shows it on the Dashboard.

---

### 11. Inicio Tab

**What it does**: Greeting and date, summary cards (Pets / Alerts / Found), access to Search, and "Mis mascotas".

**User events**:
| Event | What it triggers |
|---|---|
| Magnifying glass button | Opens Search |
| "Register pet" | Opens the pet form (bottom sheet) |
| Tap a pet | Opens its detail as a bottom sheet |
| Save the form | Registers or updates the pet depending on the mode |
| "Edit" on the detail | Opens the form with the pet's data |
| "Delete" on the detail | Confirmation ("This action can't be undone") → deletes the pet |

---

### 12. Emergencia Tab

**What it does**: 2×2 grid of actions (Report lost pet, Lost, My alerts, Found) plus the pet selector and the listings.

**User events**:
| Event | What it triggers |
|---|---|
| "Report lost" | Shows pets to choose from |
| "Lost" | Loads the alerts in the user's colonia |
| "My alerts" | Loads own alerts |
| "Found" | Shows pets I have reported as found |
| Choose a pet | Confirmation → publishes the alert with notification to neighbors |
| "Found it" | Reports as found; the alert's owner gets the finder's contact |
| "Delete alert" | Confirms and deletes |
| "Register pet" (if none exist) | Goes to the Inicio tab |

---

### 13. Feed Tab

**What it does**: Community hub with a segmented control: **Emergencias** (active lost-pet alerts), **Anuncios** (community notices) and **Social** (posts). See [`FEED.md`](FEED.md).

**User events**:
| Event | What it triggers |
|---|---|
| "Publicar" (header) | Opens the full-screen post form with a type switch: Social (text, 1–5 images from gallery/camera/selfie, location with "Mi zona", tags, up to 3 links) or Anuncio (title, category, description) |
| Segments | Switches between Emergencias / Anuncios / Social |
| Tap a `#tag` | Filters the feed on the server; a banner "Mostrando #x" clears the filter |
| Tap a link | Opens it with the system |
| Tap the author | Opens their Profile |
| Trash icon (own content, or any content for moderators) | Confirms and deletes |
| Send a comment | Publishes it |
| Scroll near the end (Social) | Loads the next page of 20 posts |

---

### 14. Mensajes Tab

**What it does**: The conversation list (same component as `/mensajes`) inside the dashboard, with a subtitle showing the count and unread messages.

**User events**: tap a conversation → opens the Chat; long press → confirm and clear the chat; pull to refresh.

---

### 14b. Perfil Tab

**What it does**: Own profile — photo, stats (pets, followers, following), personal information, grouped menu, account info, "Eliminar cuenta" and log out.

**User events**:
| Event | What it triggers |
|---|---|
| Camera icon on the avatar | Picks a photo, then "Guardar foto" uploads it to `profile-pictures` |
| Followers / Following | Opens Followers on that list |
| Menu — Mensajería: Mensajes (unread badge), Notificaciones (inbox, unread count), Comunidad | Opens `/mensajes`, `/bandeja`, or switches to the Feed tab |
| Menu — Exploración: Grupos, Reuniones exitosas | Opens the matching screen |
| Menu — Configuración: Editar perfil, Cuenta y seguridad, Preferencias de notificaciones | Opens the matching screen |
| Menu — Ayuda: Cómo funciona, Preguntas frecuentes, Términos y condiciones, Política de privacidad | Opens the guide/FAQ, or the legal pages in the in-app browser |
| Menu — Administración: Panel de moderación (moderators/admins only) | Opens the Moderation Panel |
| "Eliminar cuenta" | Destructive confirmation → deletes the account permanently (edge function `delete-account`) |
| "Cerrar Sesión" | Confirmation → logs out and returns to start |

---

### 15. Pet Form

**What it does**: Register or edit a pet: type (dog/cat), name, size (pills), characteristics, and photo.

**User events**:
| Event | What it triggers |
|---|---|
| Choose dog / cat | Sets the type |
| Photo picker | Opens the image picker and uploads to `pet-images` |
| "Register" / "Update" | Saves the pet depending on the mode |
| "Cancel" / X | Closes without saving |

---

### 16. Pet Detail (bottom sheet)

**What it shows**: Photo, type, color, size, characteristics and registration date of the pet.

**User events**: "Edit" opens the form with the pet's data; "Delete" asks for confirmation; X closes.

---

### 17. Dashboard loading

**What it shows**: animated skeleton while the Dashboard loads. No interactions.

---

## Social and management screens

### 18. Search — Route `/buscar`

**What it does**: Global search with 3 tabs (Pets, Groups, Users). Searches after a typing pause (0.3 s).

**User events**:
| Event | What it triggers |
|---|---|
| Typing in the search bar | Searches after the pause, based on the active tab |
| "x" | Clears the search |
| Tabs | Changes the search type |
| Tap a pet or user | Opens the owner's Profile |
| Tap a group | Opens the Group Detail |

---

### 19. Successful Reunions — Route `/historias`

**What it does**: Pet reunion stories; the author can create and delete them.

**User events**:
| Event | What it triggers |
|---|---|
| "New" | Opens the form |
| Trash icon (own story) | Confirms and deletes |
| "Publish" | Saves the story |
| Pull to refresh | Reloads |

---

### 20. Groups — Route `/grupos`

**What it does**: List of groups with member count and join/leave button; creation and deletion.

**User events**:
| Event | What it triggers |
|---|---|
| "Create" | Opens the form (name and description) |
| "Create" in the window | Creates the group |
| Long press on a group I created | Confirms and deletes the group |
| "Join" / "Leave" | Joins or leaves and reloads |
| Tap the group | Opens its Detail |
| Pull to refresh | Reloads |

---

### 21. Group Detail — Route `/grupos/[id]`

**What it does**: Group information, member list (photo, name, "Admin" badge), and group chat. Only the creator can delete it.

**User events**:
| Event | What it triggers |
|---|---|
| "Group chat" | Opens the group conversation (creates it if it doesn't exist) |
| "Delete group" (creator only) | Confirms → deletes and returns to Groups |
| Tap a member | Opens their Profile |

---

### 22. Messages — Route `/mensajes`

**What it does**: List of conversations (individual and group) with the last message, unread notice, and deletion.

**User events**:
| Event | What it triggers |
|---|---|
| Tap a conversation | Opens the Chat |
| Long press on a conversation | Confirms and deletes the conversation |
| Pull to refresh | Reloads |

---

### 23. Chat — Route `/mensajes/[id]`

**What it does**: Message thread (individual or group) with visible names in groups; loads the last 500 messages, groups them by day ("Hoy"/"Ayer"), marks messages as read, auto-scrolls to the end and receives new messages in real time. If the other person left a 1:1 chat it shows "Conversación cerrada" and disables sending.

**User events**:
| Event | What it triggers |
|---|---|
| Typing a message | Sent via the send button |
| Send button | Validates and sends; the message appears without reloading |

---

### 24. Followers — Route `/seguidores`

**What it does**: Follower and following lists of a user.

**User events**:
| Event | What it triggers |
|---|---|
| "Followers" / "Following" tabs | Changes the list |
| Tap a user | Opens their Profile |

---

### 25. Profile — Route `/perfil/[id]`

**What it does**: Public profile of a user: photo, data, role badge (admin/moderator), counters (pets, followers, following), Follow/Message buttons, and their pets.

**User events**:
| Event | What it triggers |
|---|---|
| "Edit profile" (own profile) | Opens Edit Profile |
| "Follow" / "Following" (another user's profile) | Starts or stops following and updates the button |
| "Message" | Opens the conversation with the user (creates it if it doesn't exist) |
| Follower/following counters | Opens Followers on that list |
| Report user (another user's profile) | Choose a reason → sends a report to moderation |
| Block / Unblock user | Destructive confirmation → hides their content for you and blocks direct messages both ways |

---

### 26. Moderation Panel — Route `/panel-moderacion`

**What it does**: List of reports; moderators and admins only (others cannot enter).

**User events**:
| Event | What it triggers |
|---|---|
| "Reviewed" | Marks the report as reviewed and reloads |
| "Dismiss" | Marks the report as dismissed and reloads |

---

### 27. Notification Inbox — Route `/bandeja`

**What it does**: Lists the notices the user received (last 50): lost-pet alerts in their colonia and found-pet notices. Each push also creates an inbox row, even if the device has no token.

**User events**:
| Event | What it triggers |
|---|---|
| Tap a notice | Marks it read and opens its target (`data.url`, only paths starting with `/`) |
| "Marcar leídas" | Marks everything read |
| Pull to refresh | Reloads (there is no realtime) |

---

### 28b. Notification Preferences — Route `/notificaciones`

**What it does**: Preferences: main "Notificaciones push" switch and two alert types (lost pets in my colonia, someone found my pet). Secondary switches are disabled if the main one is off. Missing values are shown as on.

**User events**:
| Event | What it triggers |
|---|---|
| Toggle switches | Updates the selection |
| "Guardar preferencias" | Saves and shows a toast |

---

### 28c. Account and Security — Route `/seguridad`

**What it does**: Change password and change email while signed in.

**User events**:
| Event | What it triggers |
|---|---|
| "Actualizar contraseña" | Asks for the current password (re-authenticates), validates the new one (8+ with letters and numbers) → updates it |
| "Cambiar correo" | Sends a confirmation link to the new address; the current email stays valid until confirmed |

---

### 28. Edit Profile — Route `/editar-perfil`

**What it does**: Form with pre-loaded data (first name, last name, phone with country selector, postal code + colonia picker, city) and profile photo. If the profile cannot be loaded (offline) it goes back instead of showing an empty form.

**User events**:
| Event | What it triggers |
|---|---|
| "Guardar cambios" | Validates (name, valid phone, colonia required), saves, shows a toast, and goes back |

---

### 29. How to Use — Route `/como-usar`

**What it shows**: static guide in sections (the Dashboard, registering pets, reporting a lost pet, etc.). Opened from the Profile menu. No interactions besides scrolling.

---

### 30. FAQ — Route `/faq`

**What it shows**: accordion of frequently asked questions (what Lucky Tracker is, alerts, reporting lost and found pets, fees). Opened from the Profile menu.

**User events**:
| Event | What it triggers |
|---|---|
| Tap a question | Expands or collapses its answer (animated) |

---

### 31. Not Found

**What it shows**: "this screen doesn't exist" and a link to the start.

---

## General observations

- Data refreshes when returning to a screen (focus) or by pulling down. The only realtime channel is the chat (`messages`).
- Notifications: tapping a push opens the corresponding screen (e.g., an emergency alert) and the notice is also stored in the inbox (`/bandeja`).
- Other users' profiles are read from the `public_profiles` view (no phone, address or birth date).
- Group detail: members can leave (also leaving the group chat); only the creator can delete the group.
