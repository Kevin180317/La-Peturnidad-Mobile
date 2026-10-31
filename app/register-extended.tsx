import { AuthScreen } from "@/components/auth/AuthScreen";
import { ColoniaPicker, coloniasForPostalCode } from "@/components/ColoniaPicker";
import { Field, PrimaryButton } from "@/components/kit/Kit";
import { supabase } from "@/utils/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function RegisterExtendedScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [filteredColonias, setFilteredColonias] = useState<string[]>([]);
  const [selectedColonia, setSelectedColonia] = useState("");
  const [city] = useState("Tijuana");
  const [loading, setLoading] = useState(false);
  const navigatedRef = useRef(false);
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePostalCodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 5);
    setPostalCode(cleaned);

    if (cleaned.length === 5) {
      const filtered = coloniasForPostalCode(cleaned);
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

  // Convierte DD/MM/YYYY a YYYY-MM-DD validando que sea una fecha real, no futura y desde 1900
  const parseBirthDate = (
    ddmmyyyy: string,
  ): { value: string | null } | { error: string } => {
    if (!ddmmyyyy) return { value: null };
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy);
    if (!match) {
      return { error: "Completa la fecha con el formato DD/MM/AAAA" };
    }
    const [, dd, mm, yyyy] = match;
    const day = Number(dd);
    const month = Number(mm);
    const year = Number(yyyy);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return { error: "La fecha de nacimiento no es válida" };
    }
    if (year < 1900) {
      return { error: "El año debe ser 1900 o posterior" };
    }
    if (date.getTime() > Date.now()) {
      return { error: "La fecha de nacimiento no puede ser futura" };
    }
    return { value: `${yyyy}-${mm}-${dd}` };
  };

  const goToDashboard = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    if (router.canDismiss()) router.dismissAll();
    router.replace("/dashboard");
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

    const birth = parseBirthDate(birthDate);
    if ("error" in birth) {
      Toast.show({
        type: "error",
        text1: "Fecha inválida",
        text2: birth.error,
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

      const payload = {
        user_id: finalUserId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        birth_date: birth.value,
        postal_code: postalCode,
        address: selectedColonia,
        city: city,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("user_profiles")
        .upsert(payload, { onConflict: "user_id", ignoreDuplicates: false });

      if (error) throw error;

      // Se mantiene el spinner hasta navegar (una sola vez: al ocultar el toast o por respaldo)
      Toast.show({
        type: "welcome",
        text1: "¡Perfil completado!",
        text2: "Bienvenido a Lucky Tracker",
        visibilityTime: 1500,
        onHide: goToDashboard,
      });
      navTimeoutRef.current = setTimeout(goToDashboard, 2500);
    } catch (error) {
      if (__DEV__) console.error("Error al guardar perfil:", error);
      Toast.show({
        type: "error",
        text1: "Error al guardar",
        text2: "No se pudo guardar tu perfil. Intenta de nuevo más tarde",
        visibilityTime: 3000,
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // Evita navegar tras desmontar la pantalla
      navigatedRef.current = true;
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#007275" />
        <Text className="mt-4 text-[#211f1e]">Guardando información...</Text>
      </View>
    );
  }

  return (
    <AuthScreen headerless title="Completa tu perfil" subtitle={`Usuario: ${email}`}>
      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Datos personales</Text>
      <Field
        label="Nombre *"
        icon="person-outline"
        placeholder="Tu nombre"
        accessibilityLabel="Nombre"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />
      <Field
        label="Apellido *"
        icon="person-outline"
        placeholder="Tu apellido"
        accessibilityLabel="Apellido"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />
      <Field
        label="Teléfono *"
        icon="call-outline"
        placeholder="Número de teléfono"
        accessibilityLabel="Teléfono"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Field
        label="Fecha de nacimiento"
        icon="calendar-outline"
        placeholder="DD/MM/YYYY"
        accessibilityLabel="Fecha de nacimiento"
        value={birthDate}
        onChangeText={(text) => setBirthDate(formatDateInput(text))}
        keyboardType="numeric"
      />

      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-2 ml-1">Tu colonia</Text>
      <Text className="text-gray-500 text-xs mb-3 ml-1 -mt-1">
        La usamos para avisarte de mascotas perdidas cerca de ti.
      </Text>
      <Field
        label="Código Postal *"
        icon="map-outline"
        placeholder="Código postal"
        accessibilityLabel="Código postal"
        value={postalCode}
        onChangeText={handlePostalCodeChange}
        keyboardType="numeric"
        maxLength={5}
      />

      {filteredColonias.length > 0 && (
        <ColoniaPicker options={filteredColonias} value={selectedColonia} onChange={setSelectedColonia} />
      )}

      <Field label="Ciudad" icon="location-outline" value={city} editable={false} accessibilityLabel="Ciudad" placeholder="Se completa con tu código postal" />

      <PrimaryButton title="Completar perfil" icon="checkmark" onPress={handleCompleteProfile} className="mt-2" />
    </AuthScreen>
  );
}
