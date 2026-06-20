import { supabase } from "@/utils/supabase";
import * as ImagePicker from "expo-image-picker";

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  address: string;
  city: string;
  postal_code: string;
  profile_picture_url: string | null;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  user_id: string;
  type: "perro" | "gato";
  name: string;
  color: string;
  size: string;
  features: string | null;
  image_url: string | null;
  created_at: string;
}

export interface EmergencyAlert {
  id: string;
  user_id: string;
  pet_name: string;
  type: string;
  description: string;
  last_seen_location: string;
  disappearance_date: string;
  image_url: string | null;
  created_at: string;
}

export interface FoundPet {
  id: string;
  user_id: string;
  pet_id: string;
  created_at: string;
}

export interface EmergencyAlertWithOwner extends EmergencyAlert {
  owner_name: string;
  owner_phone: string;
  owner_address: string;
}

export interface FoundPetWithDetails {
  id: string;
  pet_id: string;
  pet_name: string;
  image_url: string | null;
  created_at: string;
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

  async createEmergencyAlert(
    alertData: Omit<EmergencyAlert, "id" | "created_at">,
  ) {
    try {
      const { data, error } = await supabase
        .from("emergency_alerts")
        .insert([
          {
            ...alertData,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error("Error creating emergency alert:", error);
      return { success: false, error: error.message };
    }
  }

  async getEmergencyAlertsByLocation(location: string) {
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
        owner_name:
          `${profileMap[alert.user_id]?.first_name || ""} ${profileMap[alert.user_id]?.last_name || ""}`.trim() ||
          "Usuario",
        owner_phone: profileMap[alert.user_id]?.phone || "No disponible",
        owner_address: profileMap[alert.user_id]?.address || "No disponible",
      }));

      return { success: true, data: transformedData };
    } catch (error: any) {
      console.error("Error getting emergency alerts:", error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async getUserEmergencyAlerts(userId: string) {
    try {
      const { data, error } = await supabase
        .from("emergency_alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error("Error getting user emergency alerts:", error);
      return { success: false, error: error.message, data: [] };
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

  async reportFoundPet(foundPetData: Omit<FoundPet, "id" | "created_at">) {
    try {
      const { data, error } = await supabase
        .from("found_pets")
        .insert([
          {
            ...foundPetData,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("emergency_alerts")
        .delete()
        .eq("pet_name", foundPetData.pet_id);

      return { success: true, data };
    } catch (error: any) {
      console.error("Error reporting found pet:", error);
      return { success: false, error: error.message };
    }
  }

  async getFoundPetsByUser(userId: string) {
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
      const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`; // Siempre .jpg para simplificar
      const filePath = fileName;

      // Para React Native, necesitamos crear un objeto FormData especial
      const formData = new FormData();

      // @ts-ignore - necesario para React Native
      formData.append("file", {
        uri: uri,
        type: "image/jpeg", // Forzar image/jpeg
        name: fileName,
      });

      console.log(`⬆️ Subiendo a ${bucket}/${fileName}...`);

      // Obtener token JWT del usuario autenticado en vez de usar la anon key
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || supabaseKey;

      // Hacer la petición directamente a la API de Storage
      const response = await fetch(
        `${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`,
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

        // Si el bucket no existe, intentar con public
        if (response.status === 404 && bucket !== "public") {
          console.log("🔄 Reintentando con bucket public...");
          return this.uploadImage(uri, "public");
        }

        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Construir URL pública
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;
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

  async savePushToken(userId: string, token: string) {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ push_token: token })
        .eq("user_id", userId);

      if (error) {
        console.warn("⚠️ No se pudo guardar push token:", error.message);
        return { success: true };
      }
      return { success: true };
    } catch (error: any) {
      console.warn("⚠️ Error saving push token:", error);
      return { success: true };
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
