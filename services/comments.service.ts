import { type CommentWithOwner, type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";

class CommentsService {
  async getByTarget(
    targetType: string,
    targetId: string,
  ): Promise<ServiceResult<CommentWithOwner[]>> {
    try {
      const { data: comments, error } = await supabase
        .from("comments")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!comments || comments.length === 0) {
        return { success: true, data: [] };
      }

      const userIds = [...new Set(comments.map((c) => c.user_id))];
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

      const transformedData = comments.map((c) => ({
        id: c.id,
        user_id: c.user_id,
        target_type: c.target_type,
        target_id: c.target_id,
        content: c.content,
        parent_id: c.parent_id,
        created_at: c.created_at,
        owner_name:
          `${profileMap[c.user_id]?.first_name || ""} ${profileMap[c.user_id]?.last_name || ""}`.trim() ||
          "Usuario",
        owner_profile_picture: profileMap[c.user_id]?.profile_picture_url || null,
      }));

      return { success: true, data: transformedData };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async create(data: {
    user_id: string;
    target_type: string;
    target_id: string;
    content: string;
    parent_id?: string;
  }) {
    try {
      const { data: comment, error } = await supabase
        .from("comments")
        .insert([{ ...data, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("first_name, last_name, profile_picture_url")
        .eq("user_id", data.user_id)
        .single();

      return {
        success: true,
        data: {
          ...comment,
          owner_name:
            `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Usuario",
          owner_profile_picture: profile?.profile_picture_url || null,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async delete(commentId: string): Promise<ServiceResult> {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const commentsService = new CommentsService();
