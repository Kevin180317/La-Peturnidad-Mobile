import {
  type EmergencyAlert,
  type EmergencyAlertWithOwner,
  type FoundPet,
  type FoundPetWithDetails,
  type ServiceResult,
} from "@/types";
import { supabase } from "@/utils/supabase";

const EDGE_FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-push-notification`;

class AlertsService {
  async create(
    alertData: Omit<EmergencyAlert, "id" | "created_at">,
  ): Promise<ServiceResult<EmergencyAlert>> {
    try {
      const { data, error } = await supabase
        .from("emergency_alerts")
        .insert([{ ...alertData, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;

      // Notify neighbors via Edge Function (fire-and-forget)
      supabase
        .from("user_profiles")
        .select("fcm_token")
        .eq("address", alertData.last_seen_location)
        .neq("user_id", alertData.user_id)
        .not("fcm_token", "is", null)
        .then(({ data: neighbors }) => {
          const tokens = neighbors?.map((n) => n.fcm_token).filter(Boolean) as string[];
          if (tokens.length > 0) {
            fetch(EDGE_FUNCTION_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                tokens,
                title: `⚠️ Mascota perdida: ${alertData.pet_name}`,
                body: `Un vecino de tu colonia reportó a su mascota perdido en ${alertData.last_seen_location}.`,
                data: { type: "emergency", url: "/dashboard" },
              }),
            }).catch(() => {});
          }
        });

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getByLocation(
    location: string,
  ): Promise<ServiceResult<EmergencyAlertWithOwner[]>> {
    try {
      const { data: alerts, error: alertsError } = await supabase
        .from("emergency_alerts")
        .select("*")
        .eq("last_seen_location", location)
        .order("created_at", { ascending: false });

      if (alertsError) throw alertsError;

      if (!alerts || alerts.length === 0) {
        return { success: true, data: [] };
      }

      const userIds = [...new Set(alerts.map((a) => a.user_id))];

      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name, phone, address")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const profileMap =
        profiles?.reduce(
          (acc, p) => {
            acc[p.user_id] = p;
            return acc;
          },
          {} as Record<string, any>,
        ) || {};

      const transformedData = alerts.map((alert) => ({
        id: alert.id,
        user_id: alert.user_id,
        pet_name: alert.pet_name,
        type: alert.type,
        description: alert.description,
        image_url: alert.image_url,
        last_seen_location: alert.last_seen_location,
        disappearance_date: alert.disappearance_date,
        created_at: alert.created_at,
        owner_name:
          `${profileMap[alert.user_id]?.first_name || ""} ${profileMap[alert.user_id]?.last_name || ""}`.trim() ||
          "Usuario",
        owner_phone: profileMap[alert.user_id]?.phone || "No disponible",
        owner_address: profileMap[alert.user_id]?.address || "No disponible",
      }));

      return { success: true, data: transformedData };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async getUserAlerts(userId: string): Promise<ServiceResult<EmergencyAlert[]>> {
    try {
      const { data, error } = await supabase
        .from("emergency_alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async delete(alertId: string): Promise<ServiceResult> {
    try {
      const { error } = await supabase
        .from("emergency_alerts")
        .delete()
        .eq("id", alertId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async reportFound(
    foundPetData: Omit<FoundPet, "id" | "created_at">,
  ): Promise<ServiceResult<FoundPet>> {
    try {
      const { data, error } = await supabase
        .from("found_pets")
        .insert([{ ...foundPetData, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("emergency_alerts")
        .delete()
        .eq("pet_name", foundPetData.pet_id);

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getFoundPetsByUser(
    userId: string,
  ): Promise<ServiceResult<FoundPetWithDetails[]>> {
    try {
      const { data: foundPets, error: foundError } = await supabase
        .from("found_pets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (foundError) throw foundError;

      if (!foundPets || foundPets.length === 0) {
        return { success: true, data: [] };
      }

      const petIds = foundPets.map((f) => f.pet_id);

      const { data: pets, error: petsError } = await supabase
        .from("pets")
        .select("id, name, image_url")
        .in("id", petIds);

      if (petsError) throw petsError;

      const petMap =
        pets?.reduce(
          (acc, p) => {
            acc[p.id] = p;
            return acc;
          },
          {} as Record<string, any>,
        ) || {};

      const transformedData = foundPets.map((found) => ({
        id: found.id,
        pet_id: found.pet_id,
        pet_name: petMap[found.pet_id]?.name || "Mascota",
        image_url: petMap[found.pet_id]?.image_url || null,
        created_at: found.created_at,
      }));

      return { success: true, data: transformedData };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async checkIfPetIsFound(petId: string): Promise<ServiceResult & { isFound: boolean }> {
    try {
      const { data, error } = await supabase
        .from("found_pets")
        .select("*")
        .eq("pet_id", petId)
        .maybeSingle();

      if (error) throw error;
      return { success: true, isFound: !!data, data };
    } catch (error: any) {
      return { success: false, error: error.message, isFound: false };
    }
  }
}

export const alertsService = new AlertsService();
