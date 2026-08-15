# SCREENS.md — Screen and Event Documentation

> Lucky Tracker (formerly "La Peturnidad") · Community app for finding lost pets

Documentation of **all app screens**: what each one does and **what event each user interaction triggers**.

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
| Dashboard | `/dashboard` | Main screen with 5 sections |
| Search | `/buscar` | Search for pets, groups, and users |
| Community | `/comunidad` | Community announcements wall |
| Successful Reunions | `/historias` | Pet reunion stories |
| Groups | `/grupos` | List of neighborhood groups |
| Group Detail | `/grupos/[id]` | Group detail + group chat |
| Messages | `/mensajes` | List of conversations |
| Chat | `/mensajes/[id]` | Message thread (individual or group) |
| Followers | `/seguidores` | Follower and following lists |
| Profile | `/perfil/[id]` | Public profile of a user |
| Moderation Panel | `/panel-moderacion` | Report management (admin/moderator only) |
| Notifications | `/notificaciones` | Notification preferences |
| Edit Profile | `/editar-perfil` | Edit personal data |
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
| "Register" button | Validates fields, password match, and a minimum of 6 characters → creates the account. Success: shows "Confirm your email" and goes to Confirm Email |

---

### 4. Complete Profile — Route `/register-extended`

**What it does**: Register first name, last name, phone, birth date, postal code, and select the neighborhood (Tijuana).

**User events**:
| Event | What it triggers |
|---|---|
| Typing the postal code | Numbers only (max 5); once 5 digits are complete, searches for neighborhoods with that code; if none found, shows "Code not found" |
| Typing the date | Live-formatted as day/month/year |
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

**What it does**: Main screen with a bottom bar of 5 sections: Feed, Home, Community, Emergency, and Profile. Centralizes pets, alerts, notices, posts, comments, and profile.

**What happens internally**:
- Loads profile, pets, follower/following counts, and unread messages.
- Registers the device to receive notifications.
- Opening the Community or Feed sections loads their content.
- Pulling down refreshes everything (pull-to-refresh).

**User events**:
| Event | What it triggers |
|---|---|
| Magnifying glass button | Opens the Search screen |
| Register pet | Creates the pet (validates data). Success: notice and reload |
| Edit pet | Updates the pet |
| Delete pet | Confirmation → deletes and reloads |
| Create emergency alert | Checks the address and confirms → publishes the alert **and notifies neighbors** |
| Delete alert | Confirmation → deletes and reloads |
| "Found it" | Reports the pet as found and removes its alert |
| Publish post | Creates the post and reloads |
| Delete post | Deletes the post |
| Comment | Saves the comment |
| Publish notice | Creates the community notice with its category |
| Delete notice | Deletes the notice |
| Log out | Confirmation modal → logs out and returns to start |

---

### 10. Section bar

**What it does**: Fixed bottom bar with the 5 sections (Feed, Home, Community, Emergency, Profile).

**Events**: tapping a section → shows it on the Dashboard.

---

### 11. Home Section

**What it does**: Greeting and date, summary cards (Pets / Alerts / Found), access to Search, and pet tools.

**User events**:
| Event | What it triggers |
|---|---|
| Magnifying glass button | Opens Search |
| "Register pet" | Opens the pet form |
| Show / Hide pets | Shows or hides the list (and reloads) |
| Tap a pet | Opens its detail card in a window |
| Save the form | Registers or updates the pet depending on the mode |
| "Edit" on the detail card | Opens the form with the pet's data |
| "Delete" on the detail card | Asks for confirmation to delete |

---

### 12. Emergency Section

**What it does**: 2×2 grid of actions: Report lost pet, View lost pets, My alerts, and Found pets; plus the pet selector and the listings.

**User events**:
| Event | What it triggers |
|---|---|
| "Report lost" | Shows pets to choose from |
| "View lost" | Loads and shows the neighborhood's alerts |
| "My alerts" | Loads own alerts |
| "Found pets" | Shows pets reported as found by me |
| Choose a pet | Confirmation → publishes the alert with notification to others |
| "Found it" | Reports as found and removes the alert |
| "Delete alert" | Confirms and deletes |
| "Register pet" (if none exist) | Goes to the Home section |

---

### 13. Feed Section

**What it does**: Community posts with "Feed" and "My posts" sub-sections, post form, and comments.

**User events**:
| Event | What it triggers |
|---|---|
| "Post" (header) | Opens the form |
| Feed / My posts sub-sections | Toggles the shown list |
| "Post" on the form | Publishes and clears the text |
| Tap a post | Opens the comments section |
| Tap the author | Opens their Profile |
| Trash icon (own post) | Deletes the post |
| Send a comment | Publishes it |

---

### 14. Community Section

**What it does**: Community notices with "Community" and "My notices" sub-sections, categories (general, notice, event, question), and comments.

**User events**:
| Event | What it triggers |
|---|---|
| "New" | Opens the form in a window |
| Sub-sections | Toggles the list |
| Tap the author | Opens their Profile |
| Trash icon (own notice) | Deletes the notice |
| "Comment" / "Hide" | Shows or hides comments |
| Choose category | Selects the notice's category |
| "Publish" | Validates title and content → publishes and closes the window |

---

### 15. Pet Form

**What it does**: Register or edit a pet: type (dog/cat), name, size, characteristics, and photo.

**User events**:
| Event | What it triggers |
|---|---|
| Choose dog / cat | Sets the type |
| "Select" (photo) | Opens the image picker |
| "Upload" (photo) | Saves the image |
| "Register" / "Update" | Saves the pet depending on the mode |
| "Cancel" | Closes without saving |

---

### 16. Pet Detail (window)

**What it shows**: Photo, type, color, size, characteristics, and registration date of the pet.

**User events**:
| Event | What it triggers |
|---|---|
| "Edit" | Opens the form with the pet's data |
| "Delete" | Asks for confirmation to delete |
| "Close" | Closes the window |

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

### 19. Community — Route `/comunidad`

**What it does**: Community notices wall with categories; creation and deletion. Reloads when returning to the screen.

**User events**:
| Event | What it triggers |
|---|---|
| "New" | Opens the form |
| Trash icon (own notice) | Confirms and deletes |
| "Publish" | Publishes the notice |
| Pull to refresh | Reloads the wall |

---

### 20. Successful Reunions — Route `/historias`

**What it does**: Pet reunion stories; the author can create and delete them.

**User events**:
| Event | What it triggers |
|---|---|
| "New" | Opens the form |
| Trash icon (own story) | Confirms and deletes |
| "Publish" | Saves the story |
| Pull to refresh | Reloads |

---

### 21. Groups — Route `/grupos`

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

### 22. Group Detail — Route `/grupos/[id]`

**What it does**: Group information, member list (photo, name, "Admin" badge), and group chat. Only the creator can delete it.

**User events**:
| Event | What it triggers |
|---|---|
| "Group chat" | Opens the group conversation (creates it if it doesn't exist) |
| "Delete group" (creator only) | Confirms → deletes and returns to Groups |
| Tap a member | Opens their Profile |

---

### 23. Messages — Route `/mensajes`

**What it does**: List of conversations (individual and group) with the last message, unread notice, and deletion.

**User events**:
| Event | What it triggers |
|---|---|
| Tap a conversation | Opens the Chat |
| Long press on a conversation | Confirms and deletes the conversation |
| Pull to refresh | Reloads |

---

### 24. Chat — Route `/mensajes/[id]`

**What it does**: Message thread (individual or group) with visible names in groups; marks messages as read and auto-scrolls to the end.

**User events**:
| Event | What it triggers |
|---|---|
| Typing a message | Sent via the send button |
| Send button | Validates and sends; the message appears without reloading |

---

### 25. Followers — Route `/seguidores`

**What it does**: Follower and following lists of a user.

**User events**:
| Event | What it triggers |
|---|---|
| "Followers" / "Following" tabs | Changes the list |
| Tap a user | Opens their Profile |

---

### 26. Profile — Route `/perfil/[id]`

**What it does**: Public profile of a user: photo, data, role badge (admin/moderator), counters (pets, followers, following), Follow/Message buttons, and their pets.

**User events**:
| Event | What it triggers |
|---|---|
| "Edit profile" (own profile) | Opens Edit Profile |
| "Follow" / "Following" (another user's profile) | Starts or stops following and updates the button |
| "Message" | Opens the conversation with the user (creates it if it doesn't exist) |
| Follower/following counters | Opens Followers on that list |

---

### 27. Moderation Panel — Route `/panel-moderacion`

**What it does**: List of reports; moderators and admins only (others cannot enter).

**User events**:
| Event | What it triggers |
|---|---|
| "Reviewed" | Marks the report as reviewed and reloads |
| "Dismiss" | Marks the report as dismissed and reloads |

---

### 28. Notifications — Route `/notificaciones`

**What it does**: Notification preferences: main switch and 3 types (lost pet, found pets, community notices). Secondary switches are disabled if the main one is off.

**User events**:
| Event | What it triggers |
|---|---|
| Toggle switches | Updates the selection |
| "Save preferences" | Saves and shows a notice |
| "Back" | Goes back |

---

### 29. Edit Profile — Route `/editar-perfil`

**What it does**: Form with pre-loaded data (first name, last name, phone, address, city, postal code).

**User events**:
| Event | What it triggers |
|---|---|
| "Save changes" | Validates, saves, shows a notice, and goes back |
| "Cancel" | Goes back without saving |

---

### 30. Not Found

**What it shows**: "this screen doesn't exist" and a link to the start.

---

## General observations

- Data refreshes when returning to a screen (focus) or by pulling down; there is no live channel kept with the server.
- The only "live" connection is notifications: tapping them opens the corresponding screen (e.g., an emergency alert).
