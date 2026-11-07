import { type ServiceResult } from "@/types";
import { followsService } from "@/services/follows.service";
import { getCurrentUser } from "@/utils/session";
import { supabase } from "@/utils/supabase";

export interface PetSearchResult {
  id: string;
  name: string | null;
  type: string | null;
  image_url: string | null;
  color: string | null;
  size: string | null;
  user_id: string;
  owner_name: string;
}

export interface GroupSearchResult {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string | null;
  member_count: number;
}

export interface UserSearchResult {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture_url: string | null;
  city: string | null;
}

/**
 * Limpia la entrada del usuario antes de usarla en filtros PostgREST:
 * `,()` romperían la sintaxis de `.or(...)` y `%_\` son comodines/escape de ILIKE.
 */
export function sanitizeSearchQuery(query: string): string {
  return query.replace(/[,()%_\\]/g, " ").replace(/\s+/g, " ").trim();
}

class SearchService {
  async searchPets(query: string): Promise<ServiceResult<PetSearchResult[]>> {
    try {
      const q = sanitizeSearchQuery(query);
      if (!q) return { success: true, data: [] };

      const { data: pets, error } = await supabase
        .from("pets")
        .select("*")
        .ilike("name", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      if (!pets || pets.length === 0) {
        return { success: true, data: [] };
      }

      const userIds = [...new Set(pets.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);

      const profileMap =
        profiles?.reduce(
          (acc, p) => {
            acc[p.user_id] = p;
            return acc;
          },
          {} as Record<string, any>,
        ) || {};

      const transformedData = pets.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        image_url: p.image_url,
        color: p.color,
        size: p.size,
        user_id: p.user_id,
        owner_name:
          `${profileMap[p.user_id]?.first_name || ""} ${profileMap[p.user_id]?.last_name || ""}`.trim() ||
          "Usuario",
      }));

      return { success: true, data: transformedData };
    } catch (error: any) {
      if (__DEV__) console.warn("Error searching pets:", error?.message);
      return { success: false, error: error.message, data: [] };
    }
  }

  async searchGroups(
    query: string,
  ): Promise<ServiceResult<GroupSearchResult[]>> {
    try {
      const q = sanitizeSearchQuery(query);
      if (!q) return { success: true, data: [] };

      const { data: groups, error } = await supabase
        .from("groups")
        .select("*")
        .ilike("name", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      if (!groups || groups.length === 0) {
        return { success: true, data: [] };
      }

      const groupIds = groups.map((g) => g.id);
      const { data: members } = await supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", groupIds);

      const countMap: Record<string, number> = {};
      members?.forEach((m) => {
        countMap[m.group_id] = (countMap[m.group_id] || 0) + 1;
      });

      const transformedData = groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        created_by: g.created_by,
        created_at: g.created_at,
        member_count: countMap[g.id] || 0,
      }));

      return { success: true, data: transformedData };
    } catch (error: any) {
      if (__DEV__) console.warn("Error searching groups:", error?.message);
      return { success: false, error: error.message, data: [] };
    }
  }

  async searchUsers(query: string): Promise<ServiceResult<UserSearchResult[]>> {
    try {
      const q = sanitizeSearchQuery(query);
      if (!q) return { success: true, data: [] };

      // Cada palabra debe coincidir con nombre o apellido ("Kevin King" encuentra a Kevin King)
      const words = q.split(" ");
      const base = () => {
        let req = supabase
          .from("public_profiles")
          .select("user_id, first_name, last_name, profile_picture_url, city");
        for (const w of words) req = req.or(`first_name.ilike.%${w}%,last_name.ilike.%${w}%`);
        return req;
      };

      // Los que sigo van primero: sin esto, con muchos usuarios el límite de 20 los dejaba fuera
      const { data: auth } = await getCurrentUser();
      const me = auth?.user?.id;
      const followingIds = me
        ? ((await followsService.getFollowing(me)).data ?? []).map((f) => f.following_id)
        : [];

      const [general, followed] = await Promise.all([
        base().order("created_at", { ascending: false }).limit(20),
        followingIds.length ? base().in("user_id", followingIds).limit(20) : Promise.resolve({ data: null }),
      ]);
      if (general.error) throw general.error;

      const seen = new Set<string>();
      const users = [...(followed.data ?? []), ...(general.data ?? [])]
        .filter((u) => !seen.has(u.user_id) && !!seen.add(u.user_id))
        .slice(0, 20);

      const transformedData = users.map((u) => ({
        user_id: u.user_id,
        first_name: u.first_name,
        last_name: u.last_name,
        profile_picture_url: u.profile_picture_url,
        city: u.city,
      }));

      return { success: true, data: transformedData };
    } catch (error: any) {
      if (__DEV__) console.warn("Error searching users:", error?.message);
      return { success: false, error: error.message, data: [] };
    }
  }
}

export const searchService = new SearchService();
