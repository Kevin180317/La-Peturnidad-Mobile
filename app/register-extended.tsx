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
      // Verificar que tenemos el userId
      let finalUserId = userId;
      if (!finalUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("No se encontró el usuario");
        }
        finalUserId = user.id;
      }

      console.log("Creando perfil para user_id:", finalUserId);

      // Verificar si ya existe un perfil
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", finalUserId)
        .maybeSingle();

      if (existingProfile) {
        // Si ya existe, actualizar
        const { error } = await supabase
          .from("user_profiles")
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            birth_date: birthDate || null,
            postal_code: postalCode,
            address: selectedColonia,
            city: city,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", finalUserId);

        if (error) throw error;
      } else {
        // Si no existe, insertar nuevo (SIN EL CAMPO EMAIL)
        const { error } = await supabase.from("user_profiles").insert([
          {
            user_id: finalUserId,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            birth_date: birthDate || null,
            postal_code: postalCode,
            address: selectedColonia,
            city: city,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      }

      Toast.show({
        type: "success",
        text1: "¡Perfil completado!",
        text2: "Bienvenido a La Peturnidad",
        visibilityTime: 2000,
        onHide: () => {
          router.replace({
            pathname: "/dashboard",
            params: {
              email: email, // Pasamos el email solo para mostrarlo en el dashboard
              userId: finalUserId,
            },
          });
        },
      });
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
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#ff592c" />
        <Text className="mt-4 text-gray-600">Guardando información...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="p-6 pb-10"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-2xl font-bold text-red-800 mb-2 text-center">
        Completa tu perfil
      </Text>
      <Text className="text-base text-gray-600 text-center mb-8">
        Usuario: {email}
      </Text>

      <View className="mb-4">
        <Text className="text-gray-700 font-semibold mb-2">
          Nombre <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className="border-2 border-gray-300 rounded-xl p-4 text-base bg-gray-50"
          placeholder="Tu nombre"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-700 font-semibold mb-2">
          Apellido <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className="border-2 border-gray-300 rounded-xl p-4 text-base bg-gray-50"
          placeholder="Tu apellido"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-700 font-semibold mb-2">
          Teléfono <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className="border-2 border-gray-300 rounded-xl p-4 text-base bg-gray-50"
          placeholder="Número de teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-700 font-semibold mb-2">
          Fecha de nacimiento
        </Text>
        <TextInput
          className="border-2 border-gray-300 rounded-xl p-4 text-base bg-gray-50"
          placeholder="DD/MM/YYYY"
          value={birthDate}
          onChangeText={(text) => setBirthDate(formatDateInput(text))}
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-700 font-semibold mb-2">
          Código Postal <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className="border-2 border-gray-300 rounded-xl p-4 text-base bg-gray-50"
          placeholder="Código postal"
          value={postalCode}
          onChangeText={handlePostalCodeChange}
          keyboardType="numeric"
          maxLength={5}
        />
      </View>

      {filteredColonias.length > 0 && (
        <View className="mb-4 border-2 border-gray-300 rounded-xl overflow-hidden bg-gray-50">
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
        <Text className="text-gray-700 font-semibold mb-2">Ciudad</Text>
        <TextInput
          className="border-2 border-gray-300 rounded-xl p-4 text-base bg-gray-200 text-gray-500"
          value={city}
          editable={false}
        />
      </View>

      <TouchableOpacity
        className="bg-red-600 py-4 rounded-xl shadow-md mb-4"
        onPress={handleCompleteProfile}
      >
        <Text className="text-white text-center font-bold text-lg">
          Completar perfil
        </Text>
      </TouchableOpacity>

      <TouchableOpacity className="py-4" onPress={handleSkip}>
        <Text className="text-gray-500 text-center font-semibold">
          Omitir por ahora
        </Text>
      </TouchableOpacity>

      <Toast />
    </ScrollView>
  );
}
