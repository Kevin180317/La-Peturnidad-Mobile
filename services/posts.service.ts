import { type PostWithOwner, type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";

class PostsService {
  async getFeed(userId: string): Promise<ServiceResult<PostWithOwner[]>> {
    try {
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);

      const followedIds = following?.map((f) => f.following_id) || [];
      const allIds = [userId, ...followedIds.filter((id) => id !== userId)];

      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .in("user_id", allIds.length > 0 ? allIds : [userId])
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!posts || posts.length === 0) {
        return { success: true, data: [] };
      }

      const userIds = [...new Set(posts.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name, profile_picture_url")
        .in("user_id", userIds);

      const profileMap =
        profiles?.reduce(
          (acc, p) => {
            acc[p.user_id] = p;
            return acc;
          },
          {} as Record<string, any>,
        ) || {};

      const postIds = posts.map((p) => p.id);
      const { data: counts } = await supabase
        .from("comments")
        .select("target_id")
        .eq("target_type", "post")
        .in("target_id", postIds);

      const countMap: Record<string, number> = {};
      counts?.forEach((c) => {
        countMap[c.target_id] = (countMap[c.target_id] || 0) + 1;
      });

      const transformedData = posts.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        content: p.content,
        image_url: p.image_url,
        created_at: p.created_at,
        updated_at: p.updated_at,
        owner_name:
          `${profileMap[p.user_id]?.first_name || ""} ${profileMap[p.user_id]?.last_name || ""}`.trim() ||
          "Usuario",
        owner_profile_picture: profileMap[p.user_id]?.profile_picture_url || null,
        comment_count: countMap[p.id] || 0,
      }));

      return { success: true, data: transformedData };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async getMyPosts(userId: string): Promise<ServiceResult<PostWithOwner[]>> {
    try {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!posts || posts.length === 0) {
        return { success: true, data: [] };
      }

      const postIds = posts.map((p) => p.id);
      const { data: counts } = await supabase
        .from("comments")
        .select("target_id")
        .eq("target_type", "post")
        .in("target_id", postIds);

      const countMap: Record<string, number> = {};
      counts?.forEach((c) => {
        countMap[c.target_id] = (countMap[c.target_id] || 0) + 1;
      });

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("first_name, last_name, profile_picture_url")
        .eq("user_id", userId)
        .single();

      const transformedData = posts.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        content: p.content,
        image_url: p.image_url,
        created_at: p.created_at,
        updated_at: p.updated_at,
        owner_name:
          `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Usuario",
        owner_profile_picture: profile?.profile_picture_url || null,
        comment_count: countMap[p.id] || 0,
      }));

      return { success: true, data: transformedData };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async create(data: { user_id: string; content: string; image_url?: string }) {
    try {
      const { data: post, error } = await supabase
        .from("posts")
        .insert([{ ...data, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: post };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async delete(postId: string): Promise<ServiceResult> {
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const postsService = new PostsService();
