import { supabase } from "@/utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import type { Database } from "@/types/database";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DEVICE_TOKEN_KEY = "deviceToken";

// Token push de este dispositivo (para borrarlo solo a él al cerrar sesión)
let currentDeviceToken: string | null = null;

export interface PickedImage {
  uri: string;
  mimeType?: string | null;
  fileSize?: number | null;
}

const IMAGE_TYPES: Record<string, { ext: string; contentType: string }> = {
  jpeg: { ext: "jpg", contentType: "image/jpeg" },
  jpg: { ext: "jpg", contentType: "image/jpeg" },
  png: { ext: "png", contentType: "image/png" },
  webp: { ext: "webp", contentType: "image/webp" },
  gif: { ext: "gif", contentType: "image/gif" },
};

export function getImageType(asset: PickedImage) {
  const fromMime = asset.mimeType?.toLowerCase().replace("image/", "");
  const fromUri = asset.uri.split("?")[0].split(".").pop()?.toLowerCase();
  return (
    (fromMime && IMAGE_TYPES[fromMime]) ||
    (fromUri && IMAGE_TYPES[fromUri]) ||
    IMAGE_TYPES.jpeg
  );
}

// Ruta dentro del bucket a partir de la URL pública (.../object/public/<bucket>/<ruta>)
export function getStoragePath(url: string | null | undefined, bucket: string) {
  if (!url) return null;
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
  return path || null;
}

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

  // Cierra las alertas activas de la mascota, la borra y elimina su foto
  async deletePet(petId: string, imageUrl?: string | null) {
    try {
      const { error: alertsError } = await supabase
        .from("emergency_alerts")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("pet_id", petId)
        .eq("status", "active");
      if (alertsError) throw alertsError;

      const { error } = await supabase.from("pets").delete().eq("id", petId);

      if (error) throw error;
      await this.removeImageByUrl(imageUrl, "pet-images");
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
  // Idempotente por alerta / reporte: el servidor solo envía una vez
  private async invokePush(payload: Record<string, string>): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke("send-push-notification", {
        body: payload,
      });
      if (error) {
        console.warn("Error push:", error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.warn("Error en notificación:", error);
      return false;
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

      const notified = await this.invokePush({ type: "emergency", alertId: data.id });

      return { success: true, data, notified };
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
  // Un trigger completa alert_owner_id, pet_id, pet_name e image_url desde la alerta
  async reportFoundPet(alert: EmergencyAlertWithOwner, finderId: string) {
    try {
      const { data, error } = await supabase
        .from("found_pets")
        .insert([{ user_id: finderId, alert_id: alert.id }])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return { success: false, error: "Ya avisaste al dueño de esta mascota" };
        }
        if (/no est[aá] activa|not active/i.test(error.message ?? "")) {
          return { success: false, error: "La alerta ya no está activa" };
        }
        throw error;
      }

      const notified = await this.invokePush({ type: "found", foundId: data.id });

      return { success: true, data, notified };
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

  // ============== IMÁGENES ==============

  async uploadImage(
    image: string | PickedImage,
    bucket: string = "pet-images",
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const asset: PickedImage = typeof image === "string" ? { uri: image } : image;
      if (!asset.uri) {
        return { success: false, error: "URI de imagen inválida" };
      }
      if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
        return { success: false, error: "La imagen supera 5 MB" };
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión no válida");

      const { ext, contentType } = getImageType(asset);
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const filePath = `${session.user.id}/${fileName}`;

      // En RN, fetch(uri).arrayBuffer() lee el archivo local sin pasar por Blob
      const body = await fetch(asset.uri).then((res) => res.arrayBuffer());
      if (body.byteLength > MAX_IMAGE_BYTES) {
        return { success: false, error: "La imagen supera 5 MB" };
      }

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, body, { contentType, upsert: false });
      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      return { success: true, url: publicUrl };
    } catch (error: any) {
      console.error("Error en uploadImage:", error);
      return {
        success: false,
        error: `Error al subir imagen: ${error.message || "Desconocido"}`,
      };
    }
  }

  // Borra del bucket la imagen a la que apunta una URL pública (best effort)
  async removeImageByUrl(url: string | null | undefined, bucket: string) {
    const path = getStoragePath(url, bucket);
    if (!path) return;
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) console.warn("No se pudo borrar la imagen:", error.message);
  }

  // ============== UTILIDADES ==============

  async selectImage(): Promise<
    { success: true; image: PickedImage } | { success: false; error: string }
  > {
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

      if (result.canceled || !result.assets?.[0]) {
        return { success: false, error: "Selección cancelada" };
      }

      const asset = result.assets[0];
      return {
        success: true,
        image: {
          uri: asset.uri,
          mimeType: asset.mimeType ?? null,
          fileSize: asset.fileSize ?? null,
        },
      };
    } catch (error: any) {
      console.error("Error selecting image:", error);
      return { success: false, error: error.message ?? "No se pudo abrir la galería" };
    }
  }

  // ============== TOKENS Y AUTENTICACIÓN ==============

  // Registra el token de ESTE dispositivo para auth.uid() (varios dispositivos por usuario)
  async saveFcmToken(token: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.rpc("register_device_token", {
      p_token: token,
    });

    if (error) {
      console.warn("No se pudo guardar el token:", error.message);
      return { success: false, error: error.message };
    }
    currentDeviceToken = token;
    try {
      await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);
    } catch {
      // sin almacenamiento: queda el valor en memoria
    }
    return { success: true };
  }

  // Al cerrar sesión ESTE dispositivo deja de recibir avisos de esa cuenta
  async removeDeviceToken(userId: string) {
    let token = currentDeviceToken;
    if (!token) {
      try {
        token = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
      } catch {
        token = null;
      }
    }
    if (!token) return;

    const { error } = await supabase
      .from("device_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("token", token);
    if (error) {
      console.warn("No se pudo borrar el token:", error.message);
      return;
    }
    currentDeviceToken = null;
    try {
      await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
    } catch {
      // ignorar
    }
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
