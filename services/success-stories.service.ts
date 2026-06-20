import { type ServiceResult, type SuccessStory } from "@/types";
import { supabase } from "@/utils/supabase";

class SuccessStoriesService {
  async getAll(): Promise<ServiceResult<SuccessStory[]>> {
    try {
      const { data, error } = await supabase
        .from("success_stories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
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
