import { type Pet, type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";

class PetsService {
  async getAll(userId: string): Promise<ServiceResult<Pet[]>> {
    try {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async register(
    petData: Omit<Pet, "id" | "created_at">,
  ): Promise<ServiceResult<Pet>> {
    try {
      const { data, error } = await supabase
        .from("pets")
        .insert([{ ...petData, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async update(
    petId: string,
    petData: Partial<Pick<Pet, "name" | "type" | "color" | "size" | "features" | "image_url">>,
  ): Promise<ServiceResult<Pet>> {
    try {
      const { data, error } = await supabase
        .from("pets")
        .update(petData)
        .eq("id", petId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async delete(petId: string): Promise<ServiceResult> {
    try {
      const { error } = await supabase.from("pets").delete().eq("id", petId);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const petsService = new PetsService();
