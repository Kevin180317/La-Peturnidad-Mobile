import { type Group, type GroupMember, type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";

class GroupsService {
  async getAll(): Promise<ServiceResult<Group[]>> {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
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

      await supabase.from("group_members").insert([
        { group_id: group.id, user_id: data.created_by, role: "admin" },
      ]);

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
      return { success: true, data: data || [] };
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
