import { Ionicons } from "@expo/vector-icons";
import { dashboardService } from "@/services/dashboard.service";
import { profileService } from "@/services/profile.service";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
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
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const [cityFocused, setCityFocused] = useState(false);
  const [postalCodeFocused, setPostalCodeFocused] = useState(false);
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
      contentContainerClassName="p-5 bg-[#faf5e0] grow"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-2xl font-bold text-[#211f1e] mb-6">Editar perfil</Text>

      <View className="items-center mb-6">
        <TouchableOpacity
          onPress={handleChangePhoto}
          disabled={uploadingPhoto}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
        >
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} className="w-28 h-28 rounded-full" />
          ) : (
            <View className="w-28 h-28 rounded-full bg-[#211f1e] items-center justify-center">
              <Text className="text-4xl text-white font-bold">
                {firstName?.[0]?.toUpperCase() || "U"}
              </Text>
            </View>
          )}
          <View className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#007275] items-center justify-center border-2 border-white">
            {uploadingPhoto ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={18} color="white" />
            )}
          </View>
        </TouchableOpacity>
        <Text className="text-gray-500 text-sm mt-2">
          {uploadingPhoto ? "Subiendo foto..." : "Toca para cambiar tu foto"}
        </Text>
      </View>

      <View className="bg-white p-5 rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] mb-6">
        <Text className="font-semibold mb-2 text-gray-600">Nombre *</Text>
        <TextInput
          className={`bg-white p-3 rounded-lg mb-4 text-[#211f1e] ${firstNameFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-300"}`}
          placeholder="Nombre"
          placeholderTextColor="#9BA1A6"
          value={firstName}
          onChangeText={setFirstName}
          onFocus={() => setFirstNameFocused(true)}
          onBlur={() => setFirstNameFocused(false)}
        />

        <Text className="font-semibold mb-2 text-gray-600">Apellido *</Text>
        <TextInput
          className={`bg-white p-3 rounded-lg mb-4 text-[#211f1e] ${lastNameFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-300"}`}
          placeholder="Apellido"
          placeholderTextColor="#9BA1A6"
          value={lastName}
          onChangeText={setLastName}
          onFocus={() => setLastNameFocused(true)}
          onBlur={() => setLastNameFocused(false)}
        />

        <Text className="font-semibold mb-2 text-gray-600">Teléfono</Text>
        <TextInput
          className={`bg-white p-3 rounded-lg mb-4 text-[#211f1e] ${phoneFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-300"}`}
          placeholder="Teléfono"
          placeholderTextColor="#9BA1A6"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          onFocus={() => setPhoneFocused(true)}
          onBlur={() => setPhoneFocused(false)}
        />

        <Text className="font-semibold mb-2 text-gray-600">Dirección / Colonia</Text>
        <TextInput
          className={`bg-white p-3 rounded-lg mb-4 text-[#211f1e] ${addressFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-300"}`}
          placeholder="Calle y colonia"
          placeholderTextColor="#9BA1A6"
          value={address}
          onChangeText={setAddress}
          onFocus={() => setAddressFocused(true)}
          onBlur={() => setAddressFocused(false)}
        />

        <Text className="font-semibold mb-2 text-gray-600">Ciudad</Text>
        <TextInput
          className={`bg-white p-3 rounded-lg mb-4 text-[#211f1e] ${cityFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-300"}`}
          placeholder="Ciudad"
          placeholderTextColor="#9BA1A6"
          value={city}
          onChangeText={setCity}
          onFocus={() => setCityFocused(true)}
          onBlur={() => setCityFocused(false)}
        />

        <Text className="font-semibold mb-2 text-gray-600">Código Postal</Text>
        <TextInput
          className={`bg-white p-3 rounded-lg mb-4 text-[#211f1e] ${postalCodeFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-300"}`}
          placeholder="C.P."
          placeholderTextColor="#9BA1A6"
          value={postalCode}
          onChangeText={setPostalCode}
          keyboardType="numeric"
          onFocus={() => setPostalCodeFocused(true)}
          onBlur={() => setPostalCodeFocused(false)}
        />
      </View>

      <TouchableOpacity
        className={`py-4 rounded-xl ${saving ? "bg-gray-400" : "bg-[#007275]"}`}
        onPress={handleSave}
        disabled={saving}
      >
        <Text className={`text-center font-bold ${saving ? "text-gray-700" : "text-white"}`}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="py-4 rounded-xl mt-3 bg-[#211f1e]"
        onPress={() => router.back()}
      >
        <Text className="text-white text-center font-bold">Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
