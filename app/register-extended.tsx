import { supabase } from "@/utils/supabase";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import colonias from "../assets/colonias.json";

export default function RegisterExtendedScreen() {
  const router = useRouter();
  const { email, userId } = useLocalSearchParams<{
    email: string;
    userId: string;
  }>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [filteredColonias, setFilteredColonias] = useState<typeof colonias>([]);
  const [selectedColonia, setSelectedColonia] = useState("");
  const [city, setCity] = useState("Tijuana");
  const [loading, setLoading] = useState(false);

  const handlePostalCodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 5);
    setPostalCode(cleaned);

    if (cleaned.length === 5) {
      const filtered = colonias.filter(
        (item) => String(item["Código Postal"]) === cleaned,
      );
      setFilteredColonias(filtered);
      if (filtered.length === 0) {
        Toast.show({
          type: "info",
          text1: "Código no encontrado",
          text2: "No se encontraron colonias para este código postal",
          visibilityTime: 2000,
        });
      }
    } else {
      setFilteredColonias([]);
    }
    setSelectedColonia("");
  };

  const formatDateInput = (text: string): string => {
    const cleaned = text.replace(/\D/g, "").slice(0, 8);
    let formatted = cleaned;

    if (cleaned.length >= 5) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
    } else if (cleaned.length >= 3) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }

    return formatted;
  };

  const toPostgresDate = (ddmmyyyy: string): string | null => {
    if (!ddmmyyyy) return null;
    const parts = ddmmyyyy.split("/");
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts;
    if (dd.length !== 2 || mm.length !== 2 || yyyy.length !== 4) return null;
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleCompleteProfile = async () => {
    // Validaciones
    if (!firstName?.trim() || !lastName?.trim() || !phone?.trim()) {
      Toast.show({
        type: "error",
        text1: "Campos requeridos",
        text2: "Nombre, apellido y teléfono son obligatorios",
        visibilityTime: 3000,
      });
      return;
    }

    if (!postalCode || postalCode.length !== 5) {
      Toast.show({
        type: "error",
        text1: "Código postal inválido",
        text2: "Ingresa un código postal válido de 5 dígitos",
        visibilityTime: 3000,
      });
      return;
    }

    if (!selectedColonia) {
      Toast.show({
        type: "error",
        text1: "Colonia requerida",
        text2: "Selecciona una colonia de la lista",
        visibilityTime: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      // Obtener userId desde auth siempre (más confiable que params)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No se encontró el usuario autenticado");
      }
      const finalUserId = user.id;

      console.log("Creando perfil para user_id:", finalUserId);

      const payload = {
        user_id: finalUserId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        birth_date: toPostgresDate(birthDate),
        postal_code: postalCode,
        address: selectedColonia,
        city: city,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("user_profiles")
        .upsert(payload, { onConflict: "user_id", ignoreDuplicates: false });

      if (error) {
        console.error("Upsert error details:", JSON.stringify(error));
        throw error;
      }

      console.log("Perfil guardado exitosamente");

      Toast.show({
        type: "success",
        text1: "¡Perfil completado!",
        text2: "Bienvenido a La Peturnidad",
        visibilityTime: 1500,
      });

      // Navegar después de un breve delay para que se vea el toast
      setTimeout(() => {
        router.replace({
          pathname: "/dashboard",
          params: { email: email ?? user.email ?? "" },
        });
      }, 1600);
    } catch (error: any) {
      console.error("Error al guardar perfil:", error);
      Toast.show({
        type: "error",
        text1: "Error al guardar",
        text2: error.message || "Intenta de nuevo más tarde",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace({
      pathname: "/",
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#ff7e70" />
        <Text className="mt-4 text-[#211f1e]">Guardando información...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#faf5e0]"
      contentContainerClassName="p-6 pb-10"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-2xl font-bold text-[#ff7e70] mb-2 text-center">
        Completa tu perfil
      </Text>
      <Text className="text-base text-[#211f1e] text-center mb-8">
        Usuario: {email}
      </Text>

      <View className="mb-4">
        <Text className="text-[#211f1e] font-semibold mb-2">
          Nombre <Text className="text-[#ff7e70]">*</Text>
        </Text>
        <TextInput
          className="border-2 border-[#211f1e]/20 rounded-xl p-4 text-base bg-white"
          placeholder="Tu nombre"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />
      </View>

      <View className="mb-4">
        <Text className="text-[#211f1e] font-semibold mb-2">
          Apellido <Text className="text-[#ff7e70]">*</Text>
        </Text>
        <TextInput
          className="border-2 border-[#211f1e]/20 rounded-xl p-4 text-base bg-white"
          placeholder="Tu apellido"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />
      </View>

      <View className="mb-4">
        <Text className="text-[#211f1e] font-semibold mb-2">
          Teléfono <Text className="text-[#ff7e70]">*</Text>
        </Text>
        <TextInput
          className="border-2 border-[#211f1e]/20 rounded-xl p-4 text-base bg-white"
          placeholder="Número de teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <View className="mb-4">
        <Text className="text-[#211f1e] font-semibold mb-2">
          Fecha de nacimiento
        </Text>
        <TextInput
          className="border-2 border-[#211f1e]/20 rounded-xl p-4 text-base bg-white"
          placeholder="DD/MM/YYYY"
          value={birthDate}
          onChangeText={(text) => setBirthDate(formatDateInput(text))}
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <Text className="text-[#211f1e] font-semibold mb-2">
          Código Postal <Text className="text-[#ff7e70]">*</Text>
        </Text>
        <TextInput
          className="border-2 border-[#211f1e]/20 rounded-xl p-4 text-base bg-white"
          placeholder="Código postal"
          value={postalCode}
          onChangeText={handlePostalCodeChange}
          keyboardType="numeric"
          maxLength={5}
        />
      </View>

      {filteredColonias.length > 0 && (
        <View className="mb-4 border-2 border-[#211f1e]/20 rounded-xl overflow-hidden bg-white">
          <Picker
            selectedValue={selectedColonia}
            onValueChange={(itemValue) => setSelectedColonia(itemValue)}
            style={{ height: 50 }}
          >
            <Picker.Item label="Selecciona una colonia *" value="" />
            {filteredColonias.map((item, idx) => (
              <Picker.Item
                key={idx}
                label={item["Asentamiento"]}
                value={item["Asentamiento"]}
              />
            ))}
          </Picker>
        </View>
      )}

      <View className="mb-8">
        <Text className="text-[#211f1e] font-semibold mb-2">Ciudad</Text>
        <TextInput
          className="border-2 border-[#211f1e]/20 rounded-xl p-4 text-base bg-white text-[#211f1e]"
          value={city}
          editable={false}
        />
      </View>

      <TouchableOpacity
        className="bg-[#ff7e70] py-4 rounded-xl shadow-md mb-4"
        onPress={handleCompleteProfile}
      >
        <Text className="text-white text-center font-bold text-lg">
          Completar perfil
        </Text>
      </TouchableOpacity>

      <TouchableOpacity className="py-4" onPress={handleSkip}>
        <Text className="text-[#211f1e]/60 text-center font-semibold">
          Omitir por ahora
        </Text>
      </TouchableOpacity>

      <Toast />
    </ScrollView>
  );
}
