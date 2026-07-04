import { type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";

class AuthService {
  async getCurrentUser(): Promise<
    ServiceResult<{ id: string; email?: string }> & { user?: any }
  > {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async signOut(): Promise<ServiceResult> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
  }

  async signUp(email: string, password: string) {
    return supabase.auth.signUp({ email: email.trim(), password: password.trim() });
  }

  async isEmailConfirmed(): Promise<boolean> {
    try {
      const { data } = await supabase.auth.getUser();
      return !!data.user?.email_confirmed_at;
    } catch {
      return false;
    }
  }

  async resendConfirmation(email: string) {
    return supabase.auth.signUp({
      email: email.trim(),
      password: "",
      options: { emailRedirectTo: undefined },
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
    return supabase.auth.updateUser({ password });
  }

  async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "lapeturnidad://",
    });
  }
}

export const authService = new AuthService();
