import { Ionicons } from "@expo/vector-icons";
import { Avatar, CARD, Field, PrimaryButton } from "@/components/kit/Kit";
import { dashboardService } from "@/services/dashboard.service";
import { profileService } from "@/services/profile.service";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function EditarPerfilScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadProfile = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) { router.replace("/"); return; }

    setUserId(user.user.id);
    const result = await profileService.getByUserId(user.user.id);
    if (result.success && result.data) {
      setProfilePicture(result.data.profile_picture_url || null);
      setFirstName(result.data.first_name || "");
      setLastName(result.data.last_name || "");
      setPhone(result.data.phone || "");
      setAddress(result.data.address || "");
      setCity(result.data.city || "");
      setPostalCode(result.data.postal_code || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Toast.show({ type: "error", text1: "Nombre y apellido son obligatorios", position: "top" });
      return;
    }

    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      setSaving(false);
      router.replace("/");
      return;
    }

    const result = await profileService.update(user.user.id, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      postal_code: postalCode.trim(),
    });

    if (result.success) {
      Toast.show({ type: "success", text1: "Perfil actualizado", position: "top", visibilityTime: 2000 });
      router.back();
    } else {
      Toast.show({ type: "error", text1: "Error", text2: result.error, position: "top" });
    }
    setSaving(false);
  };

  const handleChangePhoto = async () => {
    if (!userId || uploadingPhoto) return;
    const picked = await dashboardService.selectImage();
    if (!picked.success) {
      if (picked.error !== "Selección cancelada") {
        Toast.show({ type: "error", text1: "Error", text2: picked.error, position: "top" });
      }
      return;
    }

    setUploadingPhoto(true);
    const upload = await dashboardService.uploadImage(picked.image, "profile-pictures");
    if (!upload.success || !upload.url) {
      Toast.show({ type: "error", text1: "No se pudo subir la foto", text2: upload.error, position: "top" });
      setUploadingPhoto(false);
      return;
    }

    const updated = await dashboardService.updateProfilePicture(userId, upload.url);
    if (updated.success) {
      setProfilePicture(upload.url);
      Toast.show({ type: "success", text1: "Foto de perfil actualizada", position: "top", visibilityTime: 2000 });
    } else {
      Toast.show({ type: "error", text1: "Error", text2: updated.error, position: "top" });
    }
    setUploadingPhoto(false);
  };

  // loadProfile corre una sola vez al montar (deps estables intencionales)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar: el setState ocurre tras la consulta async
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#007275" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#faf5e0]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
    <ScrollView
      contentContainerClassName="p-5 pb-10 bg-[#faf5e0] grow"
      keyboardShouldPersistTaps="handled"
    >
      <View className={`${CARD} items-center py-6 mb-6`}>
        <TouchableOpacity
          onPress={handleChangePhoto}
          disabled={uploadingPhoto}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
        >
          <Avatar uri={profilePicture} name={firstName} size={108} />
          <View className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#007275] items-center justify-center border-[3px] border-white">
            {uploadingPhoto ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={18} color="white" />
            )}
          </View>
        </TouchableOpacity>
        <Text className="text-gray-500 text-sm mt-3">
          {uploadingPhoto ? "Subiendo foto..." : "Toca para cambiar tu foto"}
        </Text>
      </View>

      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-2">Datos personales</Text>
      <View className={`${CARD} p-4 pb-0 mb-6`}>
        <Field label="Nombre *" icon="person-outline" placeholder="Nombre" value={firstName} onChangeText={setFirstName} />
        <Field label="Apellido *" icon="person-outline" placeholder="Apellido" value={lastName} onChangeText={setLastName} />
        <Field label="Teléfono" icon="call-outline" placeholder="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      </View>

      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-2">Dirección</Text>
      <View className={`${CARD} p-4 pb-0 mb-6`}>
        <Field label="Dirección / Colonia" icon="home-outline" placeholder="Calle y colonia" value={address} onChangeText={setAddress} />
        <Field label="Ciudad" icon="location-outline" placeholder="Ciudad" value={city} onChangeText={setCity} />
        <Field label="Código Postal" icon="map-outline" placeholder="C.P." value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" />
      </View>

      <PrimaryButton
        title={saving ? "Guardando..." : "Guardar cambios"}
        icon="checkmark"
        onPress={handleSave}
        loading={saving}
      />
      <TouchableOpacity className="py-4 mt-1" onPress={() => router.back()}>
        <Text className="text-center font-semibold text-gray-600">Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
