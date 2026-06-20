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

  async savePushToken(
    userId: string,
    token: string,
  ): Promise<ServiceResult> {
    try {
      await supabase
        .from("user_profiles")
        .update({ push_token: token })
        .eq("user_id", userId);
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
  }

  async signUp(email: string, password: string) {
    return supabase.auth.signUp({ email: email.trim(), password: password.trim() });
  }

  async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "lapeturnidad://",
    });
  }
}

export const authService = new AuthService();
