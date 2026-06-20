import { type NotificationPreference, type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";

class NotificationsService {
  async getPreferences(userId: string): Promise<ServiceResult<NotificationPreference>> {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from("notification_preferences")
          .insert([{ user_id: userId }])
          .select()
          .single();

        if (insertError) throw insertError;
        return { success: true, data: newPrefs };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message, data: undefined };
    }
  }

  async update(
    userId: string,
    prefs: Partial<Omit<NotificationPreference, "id" | "user_id" | "created_at" | "updated_at">>,
  ): Promise<ServiceResult> {
    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        );

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const notificationsService = new NotificationsService();
