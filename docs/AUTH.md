# AUTH — Onboarding, Login & Account Flows

> Area doc. Source screens: `docs/images/AUTH/1.jpeg`–`12.jpeg`. Cross-checked against `docs/SCREENS.md` §1-8. All 12 images matched to a documented screen or state — no undocumented screens found.

## Screens covered

| Screen | Route | Images |
|---|---|---|
| Onboarding (3-step carousel) | `/` | 1, 2, 3 |
| Login | `/login` | 4 |
| Register | `/register` | 5, 6 |
| Confirm Email | `/email-confirmacion` | 7, 8* |
| Complete Profile | `/register-extended` | 9 |
| Forgot Password | `/forgot-password` | 10 |
| Verify OTP | `/verify-otp` | 11 |
| New/Reset Password | `/reset-password` | 12 |

\* Image 8 is the actual Supabase confirmation email (external, Gmail app), included as supporting evidence for the Confirm Email flow — not an in-app screen.

## Flow

```
Onboarding (1→2→3, "Saltar"/"Comenzar" at any point)
    └─> Login ──"¿Olvidaste tu contraseña?"──> Forgot Password
    │       │                                       └─> Verify OTP ─> New Password ─> Login
    │       └─"Regístrate"─> Register ──(success)──> Confirm Email
    │                                                     └─(email link)─> Login
    └─(existing confirmed session, no profile)──> Complete Profile ─> Dashboard
```

## Screen details

### Onboarding (imgs 1-3)
3-step carousel: "Reporta" / "Conecta" / "Actúa". Top-right "Saltar" always visible; last step's primary button reads "Comenzar" instead of "Siguiente". Bottom dots indicate step. Skip/finish both persist "welcome seen" and route to Login.

### Login (img 4)
Email + password fields, "Iniciar sesión" primary button, "¿Olvidaste tu contraseña?" link, "Regístrate" link at bottom.

### Register (imgs 5-6)
Fields: email, password, confirm password. Img 6 shows the post-submit transient state — a "Registro exitoso" toast overlaying a "Procesando registro..." spinner — before redirecting to Confirm Email. **Not currently listed as a distinct row in SCREENS.md §3; worth a one-line addition noting this transient/processing state.**

### Confirm Email (img 7, evidence img 8)
Shows the account email, "Reenviar email" and "Volver al inicio" actions. Img 8 confirms the actual Supabase Auth email template ("Confirm your signup" / "Confirm your mail" link) — useful reference if the email template itself ever needs debugging or restyling.

### Complete Profile (img 9)
Fields: Nombre, Apellido, Teléfono (all required, marked `*`), Fecha de nacimiento (optional, `DD/MM/YYYY`), Código Postal (required — triggers neighborhood lookup at 5 digits), Ciudad (defaults to "Tijuana", shown as pre-filled/read-only in this capture). "Completar perfil" primary button.

### Forgot Password (img 10)
Single email field, "Enviar código" button, "Inicia sesión" link back.

### Verify OTP (img 11)
8-digit OTP input (segmented), auto-verifies on completion. "Verificar código" button + "Reenviar código" link. Shows target email for confirmation.

### New/Reset Password (img 12)
"Nueva contraseña" + "Confirmar contraseña" fields, "Actualizar contraseña" button.

## Observations / flags

- **Transient loading state** (img 6) not documented as its own row — low priority doc gap, not a bug.
- No visual mismatches or missing states found otherwise; AUTH area matches `SCREENS.md` fully.
