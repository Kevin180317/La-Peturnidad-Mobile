import { type Announcement, type AnnouncementWithOwner, type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";

class AnnouncementsService {
  async getAll(): Promise<ServiceResult<AnnouncementWithOwner[]>> {
    try {
      const { data: announcements, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!announcements || announcements.length === 0) {
        return { success: true, data: [] };
      }

      const userIds = [...new Set(announcements.map((a) => a.user_id))];

      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name, profile_picture_url")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const profileMap =
        profiles?.reduce(
          (acc, p) => {
            acc[p.user_id] = p;
            return acc;
          },
          {} as Record<string, any>,
        ) || {};

      const transformedData = announcements.map((a) => ({
        id: a.id,
        user_id: a.user_id,
        title: a.title,
        content: a.content,
        category: a.category as Announcement["category"],
        created_at: a.created_at,
        updated_at: a.updated_at,
        owner_name:
          `${profileMap[a.user_id]?.first_name || ""} ${profileMap[a.user_id]?.last_name || ""}`.trim() ||
          "Usuario",
        owner_profile_picture: profileMap[a.user_id]?.profile_picture_url || null,
      }));

      return { success: true, data: transformedData };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async create(
    data: Omit<Announcement, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResult<Announcement>> {
    try {
      const { data: announcement, error } = await supabase
        .from("announcements")
        .insert([{ ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: announcement };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async delete(announcementId: string): Promise<ServiceResult> {
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", announcementId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const announcementsService = new AnnouncementsService();
