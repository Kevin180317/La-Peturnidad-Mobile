import { profileService } from "@/services/profile.service";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) { router.replace("/"); return; }

    const result = await profileService.getByUserId(user.user.id);
    if (result.success && result.data) {
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
    if (!user?.user) return;

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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#ff7e70" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerClassName="p-5 bg-[#faf5e0] flex-1">
      <Text className="text-2xl font-bold text-[#211f1e] mb-6">Editar perfil</Text>

      <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
        <Text className="font-semibold mb-2 text-gray-600">Nombre *</Text>
        <TextInput
          className="bg-[#faf5e0] p-3 rounded-lg mb-4 border border-gray-300"
          placeholder="Nombre"
          value={firstName}
          onChangeText={setFirstName}
        />

        <Text className="font-semibold mb-2 text-gray-600">Apellido *</Text>
        <TextInput
          className="bg-[#faf5e0] p-3 rounded-lg mb-4 border border-gray-300"
          placeholder="Apellido"
          value={lastName}
          onChangeText={setLastName}
        />

        <Text className="font-semibold mb-2 text-gray-600">Teléfono</Text>
        <TextInput
          className="bg-[#faf5e0] p-3 rounded-lg mb-4 border border-gray-300"
          placeholder="Teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text className="font-semibold mb-2 text-gray-600">Dirección / Colonia</Text>
        <TextInput
          className="bg-[#faf5e0] p-3 rounded-lg mb-4 border border-gray-300"
          placeholder="Calle y colonia"
          value={address}
          onChangeText={setAddress}
        />

        <Text className="font-semibold mb-2 text-gray-600">Ciudad</Text>
        <TextInput
          className="bg-[#faf5e0] p-3 rounded-lg mb-4 border border-gray-300"
          placeholder="Ciudad"
          value={city}
          onChangeText={setCity}
        />

        <Text className="font-semibold mb-2 text-gray-600">Código Postal</Text>
        <TextInput
          className="bg-[#faf5e0] p-3 rounded-lg mb-4 border border-gray-300"
          placeholder="C.P."
          value={postalCode}
          onChangeText={setPostalCode}
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity
        className={`py-4 rounded-xl ${saving ? "bg-gray-400" : "bg-[#ff7e70]"}`}
        onPress={handleSave}
        disabled={saving}
      >
        <Text className="text-white text-center font-bold">
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
  );
}
