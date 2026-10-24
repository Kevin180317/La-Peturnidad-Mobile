import { type Group, type GroupMember, type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";

class GroupsService {
  async getAll(): Promise<ServiceResult<Group[]>> {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Una sola consulta a group_members para varios grupos: devuelve el
   * conteo de miembros por grupo y los ids de grupos a los que pertenece userId.
   */
  async getMembershipSummary(
    groupIds: string[],
    userId: string | null,
  ): Promise<ServiceResult<{ counts: Record<string, number>; memberOf: string[] }>> {
    try {
      if (groupIds.length === 0) {
        return { success: true, data: { counts: {}, memberOf: [] } };
      }
      const { data, error } = await supabase
        .from("group_members")
        .select("group_id, user_id")
        .in("group_id", groupIds);

      if (error) throw error;

      const counts: Record<string, number> = {};
      const memberOf = new Set<string>();
      (data || []).forEach((m) => {
        counts[m.group_id] = (counts[m.group_id] || 0) + 1;
        if (userId && m.user_id === userId) memberOf.add(m.group_id);
      });
      return { success: true, data: { counts, memberOf: [...memberOf] } };
    } catch (error: any) {
      return { success: false, error: error.message, data: { counts: {}, memberOf: [] } };
    }
  }

  async getById(groupId: string): Promise<ServiceResult<Group>> {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message, data: undefined };
    }
  }

  async create(data: { name: string; description?: string; created_by: string }): Promise<ServiceResult<Group>> {
    try {
      const { data: group, error } = await supabase
        .from("groups")
        .insert([{ ...data, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;

      const { error: memberError } = await supabase.from("group_members").insert([
        { group_id: group.id, user_id: data.created_by, role: "admin" },
      ]);

      if (memberError) {
        // Sin el creador como admin el grupo queda huérfano: se revierte
        await supabase.rpc("delete_group", { group_id_param: group.id });
        throw memberError;
      }

      return { success: true, data: group };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getMembers(groupId: string): Promise<ServiceResult<GroupMember[]>> {
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId);

      if (error) throw error;
      return { success: true, data: (data ?? []) as GroupMember[] };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async join(groupId: string, userId: string): Promise<ServiceResult> {
    try {
      const { error } = await supabase
        .from("group_members")
        .insert([{ group_id: groupId, user_id: userId }]);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async leave(groupId: string, userId: string): Promise<ServiceResult> {
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async delete(groupId: string): Promise<ServiceResult> {
    try {
      const { error } = await supabase.rpc("delete_group", { group_id_param: groupId });
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Devuelve el id de la conversación del grupo (la crea si no existe) y
   * agrega al usuario actual como participante. Requiere ser miembro.
   */
  async getGroupChat(groupId: string): Promise<ServiceResult<{ conversation_id: string }>> {
    try {
      const { data, error } = await supabase.rpc("join_group_conversation", {
        group_id_param: groupId,
      });

      if (error) throw error;
      if (!data) throw new Error("No se pudo abrir el chat del grupo");
      return { success: true, data: { conversation_id: data } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .maybeSingle();

      return !!data;
    } catch {
      return false;
    }
  }
}

export const groupsService = new GroupsService();
