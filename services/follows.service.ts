import { type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";
import { type UserSearchResult } from "@/services/search.service";
import { type Database } from "@/types/database";

export type SuggestedUser = Database["public"]["Functions"]["suggested_users"]["Returns"][number];

export type FollowRequestItem = UserSearchResult & { request_id: string };

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

  /** Seguir: directo si el perfil es público; solicitud pendiente si es privado. */
  async followOrRequest(
    followerId: string,
    targetId: string,
    isPrivate: boolean,
  ): Promise<ServiceResult<{ status: "following" | "requested" }>> {
    if (!isPrivate) {
      const r = await this.follow(followerId, targetId);
      return r.success ? { success: true, data: { status: "following" } } : r;
    }
    try {
      const { error } = await supabase.rpc("request_follow", { target: targetId });
      if (error) throw error;
      return { success: true, data: { status: "requested" } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async hasPendingRequest(requesterId: string, targetId: string): Promise<boolean> {
    const { data } = await supabase
      .from("follow_requests")
      .select("id")
      .eq("requester_id", requesterId)
      .eq("target_id", targetId)
      .maybeSingle();
    return !!data;
  }

  async cancelRequest(requesterId: string, targetId: string): Promise<ServiceResult> {
    const { error } = await supabase
      .from("follow_requests")
      .delete()
      .eq("requester_id", requesterId)
      .eq("target_id", targetId);
    return error ? { success: false, error: error.message } : { success: true };
  }

  /** Solicitudes pendientes que recibí, con el perfil público de quien solicita. */
  async getIncomingRequests(userId: string): Promise<ServiceResult<FollowRequestItem[]>> {
    try {
      const { data: reqs, error } = await supabase
        .from("follow_requests")
        .select("id, requester_id, created_at")
        .eq("target_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!reqs?.length) return { success: true, data: [] };

      const { data: profiles, error: pErr } = await supabase
        .from("public_profiles")
        .select("user_id, first_name, last_name, profile_picture_url, city")
        .in("user_id", reqs.map((r) => r.requester_id));
      if (pErr) throw pErr;
      const byId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return {
        success: true,
        data: reqs.flatMap((r) => {
          const p = byId.get(r.requester_id);
          return p ? [{ request_id: r.id, ...p }] : [];
        }),
      };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async countIncomingRequests(userId: string): Promise<number> {
    const { count } = await supabase
      .from("follow_requests")
      .select("id", { count: "exact", head: true })
      .eq("target_id", userId);
    return count ?? 0;
  }

  async respondToRequest(requestId: string, accept: boolean): Promise<ServiceResult> {
    const { error } = await supabase.rpc("respond_follow_request", { request_id: requestId, accept });
    return error ? { success: false, error: error.message } : { success: true };
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

  /** Conteos sin traer filas: head + count exact. Consultas en paralelo. */
  async getCounts(
    userId: string,
  ): Promise<ServiceResult<{ followers: number; following: number }>> {
    try {
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from("follows")
          .select("id", { count: "exact", head: true })
          .eq("following_id", userId),
        supabase
          .from("follows")
          .select("id", { count: "exact", head: true })
          .eq("follower_id", userId),
      ]);

      if (followersRes.error) throw followersRes.error;
      if (followingRes.error) throw followingRes.error;
      return {
        success: true,
        data: { followers: followersRes.count ?? 0, following: followingRes.count ?? 0 },
      };
    } catch (error: any) {
      return { success: false, error: error.message, data: { followers: 0, following: 0 } };
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

  /** Perfiles públicos de a quienes sigo (para elegir destinatario de un chat). */
  async getFollowingProfiles(userId: string): Promise<ServiceResult<UserSearchResult[]>> {
    try {
      const following = await this.getFollowing(userId);
      if (!following.success) throw new Error(following.error);
      const ids = (following.data ?? []).map((f) => f.following_id);
      if (!ids.length) return { success: true, data: [] };

      const { data, error } = await supabase
        .from("public_profiles")
        .select("user_id, first_name, last_name, profile_picture_url, city")
        .in("user_id", ids)
        .order("first_name");
      if (error) throw error;
      return { success: true, data: data ?? [] };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  /** Usuarios sugeridos (RPC `suggested_users`: contactos en común, cercanía, mascotas, grupos). */
  async getSuggestions(limit = 5): Promise<ServiceResult<SuggestedUser[]>> {
    try {
      const { data, error } = await supabase.rpc("suggested_users", { limit_n: limit });
      if (error) throw error;
      return { success: true, data: data ?? [] };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  /** "No me interesa": el usuario deja de salir en las sugerencias. */
  async dismissSuggestion(userId: string, dismissedId: string): Promise<ServiceResult> {
    const { error } = await supabase
      .from("dismissed_suggestions")
      .upsert({ user_id: userId, dismissed_id: dismissedId });
    return error ? { success: false, error: error.message } : { success: true };
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
