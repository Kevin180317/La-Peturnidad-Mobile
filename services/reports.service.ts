import { type Report, type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";

class ReportsService {
  async create(data: {
    reporter_id: string;
    target_user_id: string;
    reason: string;
  }): Promise<ServiceResult<Report>> {
    try {
      const { data: report, error } = await supabase
        .from("reports")
        .insert([{ ...data, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: report };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getAllPending(): Promise<ServiceResult<Report[]>> {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async getAll(): Promise<ServiceResult<Report[]>> {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async updateStatus(
    reportId: string,
    status: string,
    reviewedBy: string,
  ): Promise<ServiceResult> {
    try {
      const { error } = await supabase
        .from("reports")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy,
        })
        .eq("id", reportId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async blockUser(blockerId: string, blockedId: string): Promise<ServiceResult> {
    try {
      const { error } = await supabase
        .from("blocks")
        .insert([{ blocker_id: blockerId, blocked_id: blockedId }]);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<ServiceResult> {
    try {
      const { error } = await supabase
        .from("blocks")
        .delete()
        .eq("blocker_id", blockerId)
        .eq("blocked_id", blockedId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getBlockedUsers(userId: string): Promise<ServiceResult<string[]>> {
    try {
      const { data } = await supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", userId);

      return { success: true, data: data?.map((b) => b.blocked_id) || [] };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }
}

export const reportsService = new ReportsService();
