import { type ServiceResult, type SuccessStory } from "@/types";
import { supabase } from "@/utils/supabase";

export type SuccessStoryWithOwner = SuccessStory & { owner_name: string };

class SuccessStoriesService {
  async getAll(): Promise<ServiceResult<SuccessStoryWithOwner[]>> {
    try {
      const { data, error } = await supabase
        .from("success_stories")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data || data.length === 0) return { success: true, data: [] };

      const userIds = [...new Set(data.map((s) => s.user_id))];
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);

      const nameMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        nameMap[p.user_id] = `${p.first_name || ""} ${p.last_name || ""}`.trim();
      });

      return {
        success: true,
        data: data.map((s) => ({
          ...s,
          created_at: s.created_at ?? "",
          owner_name: nameMap[s.user_id] || "Usuario",
        })),
      };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async create(data: {
    user_id: string;
    pet_name: string;
    story: string;
    image_url?: string;
  }): Promise<ServiceResult<SuccessStory>> {
    try {
      const { data: story, error } = await supabase
        .from("success_stories")
        .insert([{ ...data, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: story };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async delete(storyId: string): Promise<ServiceResult> {
    try {
      const { error } = await supabase
        .from("success_stories")
        .delete()
        .eq("id", storyId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const successStoriesService = new SuccessStoriesService();
