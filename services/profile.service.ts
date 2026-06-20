import { type UserProfile, type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";

class ProfileService {
  async getByUserId(userId: string): Promise<ServiceResult<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message, data: undefined };
    }
  }

  async create(
    profileData: Omit<UserProfile, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResult<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .insert([
          {
            ...profileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async update(
    userId: string,
    profileData: Partial<UserProfile>,
  ): Promise<ServiceResult> {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateProfilePicture(
    userId: string,
    imageUrl: string,
  ): Promise<ServiceResult> {
    return this.update(userId, { profile_picture_url: imageUrl });
  }
}

export const profileService = new ProfileService();
