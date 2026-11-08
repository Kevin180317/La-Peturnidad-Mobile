# AUTH — Onboarding, Login & Account Flows

> Area doc. Screenshots in `images/auth-*.jpg`, captured 2026-11-07 on the redesigned app (UI V2) with the Maestro flow `.maestro/screenshots/01-auth-public.yaml`. Details of every event: [`SCREENS.md`](SCREENS.md) §1–8. How the images were produced: [`auto_testing/EMULATOR_RUN_2026-11-07.md`](auto_testing/EMULATOR_RUN_2026-11-07.md).

## Screens covered

| Screen | Route | Image |
|---|---|---|
| Onboarding (3-step carousel) | `/` | [1](images/auth-onboarding-1.jpg), [2](images/auth-onboarding-2.jpg), [3](images/auth-onboarding-3.jpg) |
| Login | `/login` | [login](images/auth-login.jpg) |
| Register | `/register` | [register](images/auth-register.jpg) |
| Confirm Email | `/email-confirmacion` | [confirm email](images/auth-confirm-email.jpg) |
| Complete Profile | `/register-extended` | [complete profile](images/auth-complete-profile.jpg) |
| Forgot Password | `/forgot-password` | [forgot password](images/auth-forgot-password.jpg) |
| Verify OTP | `/verify-otp` | [verify OTP](images/auth-verify-otp.jpg) |
| New Password | `/reset-password` | no screenshot (the route needs a recovery session; see the run report) |

Confirm Email, Verify OTP and Complete Profile were captured by deep link (`lapeturnidad://...?email=ana.prueba@example.com`) so no real email was sent.

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

- **Onboarding**: 3 steps ("Reporta" / "Conecta" / "Actúa"). "Saltar" is always visible; the last step's button reads "Comenzar". Skip and finish both save the "welcome seen" flag (cleared on logout).
- **Login**: email and password (eye toggle), "Iniciar sesión", "¿Olvidaste tu contraseña?", "Regístrate". Enters automatically when a session exists.
- **Register**: email, password (hint "Mínimo 8 caracteres, con letras y números"), confirmation, and a required "Acepto los Términos y Condiciones y la Política de Privacidad" checkbox (links open the in-app browser). "Registrarse" stays disabled until the form is valid.
- **Confirm Email**: shows the account email, a "Reenviar email" button and "Volver al inicio". The Supabase confirmation email itself is external and not shown here.
- **Complete Profile**: Nombre\*, Apellido\*, Teléfono\* (country selector, default +52, 10 digits), Fecha de nacimiento (DD/MM/AAAA, 18+ required), then "Tu colonia": Código Postal\* (looks up colonias at 5 digits), Ciudad (defaults to Tijuana) and the colonia picker.
- **Forgot Password**: one email field and "Enviar código".
- **Verify OTP**: 8-digit segmented input that verifies automatically, "Verificar código", "Reenviar código".
- **New Password**: "Nueva contraseña" + "Confirmar contraseña" (8+ with letters and numbers), "Actualizar contraseña".

All auth screens have no navigation bar; a round back button is drawn by `AuthScreen`.

## Observations

- No visual mismatches between these screens and `SCREENS.md`.
- The first screenshot of onboarding step 1 must wait for the splash to end (~2 s); the Maestro flow waits for the text "Reporta".
