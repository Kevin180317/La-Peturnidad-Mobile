import { type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";
import * as ImagePicker from "expo-image-picker";

class StorageService {
  async selectImage(): Promise<
    ServiceResult<{ uri: string }> & { image?: { uri: string } }
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

      if (result.canceled) {
        return { success: false, error: "Selección cancelada" };
      }

      return { success: true, image: result.assets[0] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async uploadImage(
    uri: string,
    bucket: string = "pet-images",
  ): Promise<ServiceResult<{ url: string }> & { url?: string }> {
    try {
      if (!uri) {
        return { success: false, error: "URI de imagen inválida" };
      }

      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, bytes, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        if (bucket !== "alternate") {
          return this.uploadImage(uri, "alternate");
        }
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Sin respuesta del servidor" };
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return { success: true, url: urlData.publicUrl };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const storageService = new StorageService();
