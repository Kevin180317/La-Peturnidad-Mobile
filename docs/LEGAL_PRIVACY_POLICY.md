> Draft 2026-11-03 for `https://luckytracker.com.mx/policy`. Replaces the generic text.
> Describes what the app does today. **This is not legal advice: have a lawyer review it before publishing.**
> **Language:** this is an English working copy. The page published in Mexico must be in Spanish; the original Spanish draft is in git history (commit `3f0a328`, file `docs/LEGAL_POLITICA_PRIVACIDAD.md`).
> Anchor required by Play Console: `id="eliminar-cuenta"` → `https://luckytracker.com.mx/policy#eliminar-cuenta` (keep the anchor id in Spanish).
> Contact email in plain text (turn off Cloudflare email obfuscation). Remove the marketing line and the English heading from the existing page.

## Placeholders to replace

| Placeholder | What to put |
|---|---|
| `[RESPONSABLE]` | Full name or legal name of the data controller |
| `[DOMICILIO]` | Physical address (required by the LFPDPPP for ARCO rights) |
| `[CORREO]` | Contact email in plain text |
| `[REGIÓN]` | Country/region of the Supabase project (Dashboard → Settings → General) |
| `[FECHA]` | Publication date, e.g. `November 3, 2026` |

Confirm: backups (none today, free plan), what Expo receives, and add any new providers (Sentry, analytics) in section 5.

---

# PRIVACY POLICY — Lucky Tracker

Last updated: November 3, 2026

## 1. Data controller
Prometheus R&D, located at Fresnos 18, Ramirez, 22115 Tijuana, B.C., is responsible for processing your personal data under Mexico's Federal Law on Protection of Personal Data Held by Private Parties (LFPDPPP). Contact: contact@prometheustij.com.

## 2. Data we collect
When you use the Lucky Tracker app we collect:

- **Account:** email address and password (the password is stored encrypted; we cannot see it).
- **Profile:** first name, last name, phone, date of birth, address (street, neighborhood, city and postal code) and profile photo.
- **Pets:** name, species, breed, size, description and photos.
- **Content you publish:** posts, comments, notices, success stories, groups and their photos.
- **Messages:** private and group conversations.
- **Alerts:** lost-pet alerts (pet, last seen location, photos) and found-pet reports (photos, location, note and the contact details you choose to share).
- **Safety and moderation:** users you block and reports you send or receive.
- **Notifications:** your device token, to send you notices, and your notification preferences.
- **Technical:** basic session data the app needs to work.

We do not collect your GPS location: the app does not request location permission. Your area is based on the neighborhood you enter in your profile.

## 3. What we use your data for
- Create and manage your account and profile.
- Show your name, photo and city to other users.
- **Neighbor alerts:** when someone publishes a lost-pet alert, we send a notification to users whose neighborhood exactly matches the alert's. We compare neighborhoods for this; **your full address is not shown to other users**.
- Let the person who found a pet and its owner get in touch.
- Messaging, comments, groups and posts.
- Moderation: handle reports, remove content and suspend accounts that break the Terms.
- Send push notifications, in-app inbox notices and sign-in emails (confirmation, password recovery).

We do not use your data for advertising and we do not sell it.

## 4. What other users see
- **Always (any signed-in user):** your name, profile photo and city, along with the content you publish.
- **Phone:** shared only in two cases: (a) if you publish a lost-pet alert, users in your neighborhood can see your name and call you; (b) if you report a found pet, the alert's owner receives the contact details you shared.
- **Address and date of birth:** not visible to other users. Only moderation staff can view them when needed to handle a report.
- **Messages:** only the people in the conversation see them.

## 5. Providers that process data on our behalf
We use these services to run the app. They receive only the data needed for their function:

| Provider | Purpose | Data |
|---|---|---|
| Supabase | Database, authentication and file storage (servers in us-west-1) | All data in section 2 |
| Google Firebase Cloud Messaging | Push notifications | Device token and the notification text |
| Resend | Sending sign-in emails | Email address and message content |
| Expo | Building the app | No users' personal data, except technical app diagnostics |

These providers may store or process data outside Mexico. We do not sell your data. We only hand it to authorities when a law or court order requires it.

## 6. Retention
- We keep your data while your account is active.
- When you delete your account your data is erased (see section 7). Files and data are removed from our systems immediately.
- We do not keep backup copies of user data. `[Confirm if a plan with backups is enabled and adjust this point]`
- Moderation reports in which you appear as the reported person are deleted along with your account.

## 7. How to delete your account <a id="eliminar-cuenta"></a>
From the app: **Perfil → Eliminar cuenta** and confirm. You can also write to contact@prometheustij.com from your account's email.

Deleting your account permanently erases:
- Your profile, profile photo, preferences and notification tokens.
- Your pets, posts, notices, stories, comments, alerts and found-pet reports.
- Your messages, your private conversations, your followers/following and your blocks.
- The groups you created and other people's comments on your posts.
- All your stored files (photos).

This cannot be undone.

## 8. ARCO rights
You have the right to **Access** your data, **Rectify** it, **Cancel** it or **Oppose** its processing. You can edit most of your data in Perfil → Editar perfil, delete your account from the app, or send your request to contact@prometheustij.com with your name, account email and the right you are exercising. We will reply within 20 business days. Address for requests: Fresnos 18, Ramirez, 22115 Tijuana, B.C..

## 9. Minors
The app is intended for people aged 18 or older. If we detect an account belonging to a minor, we will delete it.

## 10. Security
We use encrypted connections (HTTPS), encrypted passwords and per-user access control in the database so that each person can only see the information that corresponds to them. No system is 100% secure: if a breach affecting you occurs, we will notify you.

## 11. Changes to this policy
If we change this policy we will publish the new version here with its date and, if the change is significant, tell you inside the app.

## 12. Contact
contact@prometheustij.com — Fresnos 18, Ramirez, 22115 Tijuana, B.C.
