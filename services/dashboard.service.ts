import { supabase } from "@/utils/supabase";
import * as ImagePicker from "expo-image-picker";
import type { Database } from "@/types/database";

const EDGE_FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-push-notification`;

type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];
type PetRow = Database["public"]["Tables"]["pets"]["Row"];
type EmergencyAlertRow =
  Database["public"]["Tables"]["emergency_alerts"]["Row"];
type FoundPetRow = Database["public"]["Tables"]["found_pets"]["Row"];
type AlertInsert = Database["public"]["Tables"]["emergency_alerts"]["Insert"];

export type UserProfile = UserProfileRow;
export type Pet = PetRow;
export type EmergencyAlert = EmergencyAlertRow;
export type FoundPet = FoundPetRow;

export interface EmergencyAlertWithOwner extends EmergencyAlert {
  owner_name: string;
  owner_phone: string;
  owner_address: string;
}

export interface AlertFinder {
  id: string;
  finder_id: string;
  finder_name: string;
  finder_phone: string;
  created_at: string | null;
}

export interface MyEmergencyAlert extends EmergencyAlert {
  finders: AlertFinder[];
}

export interface FoundPetWithDetails {
  id: string;
  pet_id: string | null;
  pet_name: string;
  image_url: string | null;
  created_at: string | null;
}

class DashboardService {
  // ============== PERFIL ==============

  async getProfileByUserId(userId: string) {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error("Error getting profile by user_id:", error);
      return { success: false, error: error.message, data: null };
    }
  }

  async getProfileByEmail(email: string) {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { success: false, data: null, error: "Usuario no encontrado" };
      }

      if (user.email === email) {
        return this.getProfileByUserId(user.id);
      }

      return { success: false, data: null };
    } catch (error: any) {
      console.error("Error getting profile by email:", error);
      return { success: false, error: error.message, data: null };
    }
  }

  async createProfile(
    profileData: Omit<UserProfile, "id" | "created_at" | "updated_at">,
  ) {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .insert([
          {
            ...profileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error("Error creating profile:", error);
      return { success: false, error: error.message };
    }
  }

  async updateProfile(userId: string, profileData: Partial<UserProfile>) {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("Error updating profile:", error);
      return { success: false, error: error.message };
    }
  }

  async updateProfilePicture(userId: string, imageUrl: string) {
    return this.updateProfile(userId, { profile_picture_url: imageUrl });
  }

  // ============== MASCOTAS ==============

  async getPets(userId: string) {
    try {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error("Error getting pets:", error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async registerPet(petData: Omit<Pet, "id" | "created_at">) {
    try {
      const { data, error } = await supabase
        .from("pets")
        .insert([
          {
            ...petData,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error("Error registering pet:", error);
      return { success: false, error: error.message };
    }
  }

  async deletePet(petId: string) {
    try {
      const { error } = await supabase.from("pets").delete().eq("id", petId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting pet:", error);
      return { success: false, error: error.message };
    }
  }

  async updatePet(
    petId: string,
    petData: Partial<Pick<Pet, "name" | "type" | "color" | "size" | "features" | "image_url">>,
  ) {
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
      console.error("Error updating pet:", error);
      return { success: false, error: error.message };
    }
  }

  // ============== ALERTAS DE EMERGENCIA ==============

  // El servidor valida a quien llama y calcula los destinatarios (ver edge function)
  private async invokePush(payload: Record<string, string>) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) console.warn("Error push:", await res.text());
    } catch (error) {
      console.warn("Error en notificación:", error);
    }
  }

  async createEmergencyAlert(alertData: AlertInsert) {
    try {
      const { data, error } = await supabase
        .from("emergency_alerts")
        .insert([alertData])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return {
            success: false,
            error: "Esta mascota ya tiene una alerta activa",
          };
        }
        throw error;
      }

      await this.invokePush({ type: "emergency", alertId: data.id });

      return { success: true, data };
    } catch (error: any) {
      console.error("Error creating emergency alert:", error);
      return { success: false, error: error.message };
    }
  }

  async getEmergencyAlertsByLocation(location: string) {
    try {
      // ilike sin comodines = comparación sin distinguir mayúsculas
      const pattern = location.trim().replace(/[\\%_]/g, "\\$&");

      const { data: alerts, error: alertsError } = await supabase
        .from("emergency_alerts")
        .select("*")
        .eq("status", "active")
        .ilike("last_seen_location", pattern)
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

      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

      const transformedData: EmergencyAlertWithOwner[] = alerts.map((alert) => {
        const owner = profileMap.get(alert.user_id);
        return {
          ...alert,
          owner_name:
            `${owner?.first_name || ""} ${owner?.last_name || ""}`.trim() ||
            "Usuario",
          owner_phone: owner?.phone || "No disponible",
          owner_address: owner?.address || "No disponible",
        };
      });

      return { success: true, data: transformedData };
    } catch (error: any) {
      console.error("Error getting emergency alerts:", error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Mis alertas, con quienes dicen haber encontrado la mascota
  async getUserEmergencyAlerts(userId: string) {
    try {
      const { data: alerts, error } = await supabase
        .from("emergency_alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!alerts || alerts.length === 0) return { success: true, data: [] };

      const { data: finds, error: findsError } = await supabase
        .from("found_pets")
        .select("id, alert_id, user_id, created_at")
        .eq("alert_owner_id", userId)
        .in(
          "alert_id",
          alerts.map((a) => a.id),
        );

      if (findsError) throw findsError;

      const finderIds = [...new Set((finds ?? []).map((f) => f.user_id))];
      const { data: profiles } = finderIds.length
        ? await supabase
            .from("user_profiles")
            .select("user_id, first_name, last_name, phone")
            .in("user_id", finderIds)
        : { data: [] };
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

      const result: MyEmergencyAlert[] = alerts.map((alert) => ({
        ...alert,
        finders: (finds ?? [])
          .filter((f) => f.alert_id === alert.id)
          .map((f) => {
            const finder = profileMap.get(f.user_id);
            return {
              id: f.id,
              finder_id: f.user_id,
              finder_name:
                `${finder?.first_name || ""} ${finder?.last_name || ""}`.trim() ||
                "Un vecino",
              finder_phone: finder?.phone || "No disponible",
              created_at: f.created_at,
            };
          }),
      }));

      return { success: true, data: result };
    } catch (error: any) {
      console.error("Error getting user emergency alerts:", error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async resolveEmergencyAlert(alertId: string) {
    try {
      const { error } = await supabase
        .from("emergency_alerts")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("Error resolving emergency alert:", error);
      return { success: false, error: error.message };
    }
  }

  async deleteEmergencyAlert(alertId: string) {
    try {
      const { error } = await supabase
        .from("emergency_alerts")
        .delete()
        .eq("id", alertId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting emergency alert:", error);
      return { success: false, error: error.message };
    }
  }

  // ============== MASCOTAS ENCONTRADAS ==============

  // Avisa al dueño de la alerta; es él quien decide cerrarla
  async reportFoundPet(alert: EmergencyAlertWithOwner, finderId: string) {
    try {
      const { data, error } = await supabase
        .from("found_pets")
        .insert([
          {
            user_id: finderId,
            alert_id: alert.id,
            alert_owner_id: alert.user_id,
            pet_id: alert.pet_id,
            pet_name: alert.pet_name,
            image_url: alert.image_url,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return { success: false, error: "Ya avisaste al dueño de esta mascota" };
        }
        throw error;
      }

      await this.invokePush({ type: "found", foundId: data.id });

      return { success: true, data };
    } catch (error: any) {
      console.error("Error reporting found pet:", error);
      return { success: false, error: error.message };
    }
  }

  async getFoundPetsByUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from("found_pets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const result: FoundPetWithDetails[] = (data ?? []).map((found) => ({
        id: found.id,
        pet_id: found.pet_id,
        pet_name: found.pet_name || "Mascota",
        image_url: found.image_url,
        created_at: found.created_at,
      }));

      return { success: true, data: result };
    } catch (error: any) {
      console.error("Error getting found pets:", error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async checkIfPetIsFound(petId: string) {
    try {
      const { data, error } = await supabase
        .from("found_pets")
        .select("*")
        .eq("pet_id", petId)
        .maybeSingle();

      if (error) throw error;
      return { success: true, isFound: !!data, data };
    } catch (error: any) {
      console.error("Error checking if pet is found:", error);
      return { success: false, error: error.message, isFound: false };
    }
  }

  // ============== SUBIDA DE IMÁGENES - VERSIÓN SIMPLIFICADA ==============

  async uploadImage(
    uri: string,
    bucket: string = "pet-images",
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      if (!uri) {
        return { success: false, error: "URI de imagen inválida" };
      }

      console.log(`📤 Iniciando carga a bucket: ${bucket}`);
      console.log(`📸 URI: ${uri}`);

      // Obtener credenciales
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Credenciales de Supabase no configuradas");
      }

      // Generar nombre de archivo
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`; // Siempre .jpg para simplificar
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión no válida");
      const filePath = `${session.user.id}/${fileName}`;

      // Para React Native, necesitamos crear un objeto FormData especial
      const formData = new FormData();

      // @ts-ignore - necesario para React Native
      formData.append("file", {
        uri: uri,
        type: "image/jpeg", // Forzar image/jpeg
        name: fileName,
      });

      console.log(`⬆️ Subiendo a ${bucket}/${fileName}...`);

      const token = session.access_token;

      // Hacer la petición directamente a la API de Storage
      const response = await fetch(
        `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
            "x-upsert": "true",
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error en respuesta: ${response.status}`, errorText);

        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Construir URL pública
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
      console.log("✅ Imagen subida correctamente:", publicUrl);

      return { success: true, url: publicUrl };
    } catch (error: any) {
      console.error("❌ Error en uploadImage:", error);
      return {
        success: false,
        error: `Error al subir imagen: ${error.message || "Desconocido"}`,
      };
    }
  }

  // ============== UTILIDADES ==============

  async selectImage() {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        return {
          success: false,
          error: "Permiso denegado para acceder a la galería",
        };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return { success: false, error: "Selección cancelada" };
      }

      return { success: true, image: result.assets[0] };
    } catch (error: any) {
      console.error("Error selecting image:", error);
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return { success: true, user };
    } catch (error: any) {
      console.error("Error getting current user:", error);
      return { success: false, error: error.message };
    }
  }

  // ============== TOKENS Y AUTENTICACIÓN ==============

  async saveFcmToken(userId: string, token: string) {
    const { error } = await supabase
      .from("device_tokens")
      .upsert({ user_id: userId, token, updated_at: new Date().toISOString() });

    if (error) console.warn("⚠️ No se pudo guardar el token:", error.message);
    return { success: true };
  }

  // Al cerrar sesión este dispositivo deja de recibir avisos de esa cuenta
  async removeDeviceToken(userId: string) {
    await supabase.from("device_tokens").delete().eq("user_id", userId);
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("Error signing out:", error);
      return { success: false, error: error.message };
    }
  }
}

export const dashboardService = new DashboardService();
