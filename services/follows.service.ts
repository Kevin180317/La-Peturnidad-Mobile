import { type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";

class FollowsService {
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", followerId)
        .eq("following_id", followingId)
        .maybeSingle();

      return !!data;
    } catch {
      return false;
    }
  }

  async follow(followerId: string, followingId: string): Promise<ServiceResult> {
    try {
      const { error } = await supabase
        .from("follows")
        .insert([{ follower_id: followerId, following_id: followingId }]);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async unfollow(followerId: string, followingId: string): Promise<ServiceResult> {
    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", followerId)
        .eq("following_id", followingId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getFollowers(userId: string): Promise<ServiceResult<{ follower_id: string }[]>> {
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", userId);

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async getFollowing(userId: string): Promise<ServiceResult<{ following_id: string }[]>> {
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }
}

export const followsService = new FollowsService();
