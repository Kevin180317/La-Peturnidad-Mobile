import { type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";

export const EMAIL_CONFIRMATION_REDIRECT_URL = "https://la-peturnidad.vercel.app/email-confirmed";

type AuthErrorLike = { code?: string; status?: number; message?: string } | null | undefined;

const RATE_LIMIT_CODES = new Set([
  "over_email_send_rate_limit",
  "over_request_rate_limit",
  "over_sms_send_rate_limit",
]);

export const PASSWORD_MIN_LENGTH = 8;

// Free tier sin "leaked password protection": exigimos largo mínimo y letras + números en el cliente
export function passwordError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "La contraseña debe incluir letras y números";
  }
  return null;
}

export const GENERIC_AUTH_ERROR = "Ocurrió un error. Intenta de nuevo más tarde";

export function isRateLimitError(error: AuthErrorLike): boolean {
  return !!error && (RATE_LIMIT_CODES.has(error.code ?? "") || error.status === 429);
}

// Traduce los códigos de error de Supabase Auth a mensajes en español para el usuario
export function authErrorMessage(error: AuthErrorLike): string {
  if (isRateLimitError(error)) return "Demasiados intentos, espera un momento";
  switch (error?.code) {
    case "invalid_credentials":
      return "Correo o contraseña incorrectos";
    case "email_not_confirmed":
      return "Confirma tu correo electrónico para continuar";
    case "user_already_exists":
    case "email_exists":
      return "Este correo ya está registrado";
    case "otp_expired":
      return "El código expiró o no es válido";
    case "same_password":
      return "La nueva contraseña debe ser distinta a la anterior";
    case "weak_password":
      return "La contraseña es demasiado débil";
    case "email_address_invalid":
    case "validation_failed":
      return "Revisa que el correo electrónico sea válido";
    default:
      return GENERIC_AUTH_ERROR;
  }
}

class AuthService {
  async signOut(): Promise<ServiceResult> {
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Borra cuenta, datos y archivos del usuario (edge function delete-account) y cierra la sesión local
  async deleteAccount(): Promise<ServiceResult> {
    try {
      const { error } = await supabase.functions.invoke("delete-account", { method: "POST" });
      if (error) throw error;
      await supabase.auth.signOut({ scope: "local" });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
  }

  async signUp(email: string, password: string) {
    return supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: { emailRedirectTo: EMAIL_CONFIRMATION_REDIRECT_URL },
    });
  }

  async resendConfirmation(email: string) {
    return supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: EMAIL_CONFIRMATION_REDIRECT_URL },
    });
  }

  async sendOtp(email: string) {
    return supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
  }

  async verifyOtp(email: string, token: string) {
    return supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    });
  }

  async updatePassword(password: string) {
    return supabase.auth.updateUser({ password: password.trim() });
  }
}

export const authService = new AuthService();
