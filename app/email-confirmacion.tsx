import { Ionicons } from "@expo/vector-icons";
import { authErrorMessage, authService } from "@/services/auth.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const RESEND_COOLDOWN_SECONDS = 60;

export default function EmailConfirmacionScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    try {
      const { error } = await authService.resendConfirmation(email);

      if (error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: authErrorMessage(error),
          visibilityTime: 3000,
        });
      } else {
        setCooldown(RESEND_COOLDOWN_SECONDS);
        Toast.show({
          type: "success",
          text1: "Correo reenviado",
          text2: "Revisa tu bandeja de entrada",
          visibilityTime: 3000,
        });
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Error inesperado",
        text2: "Intenta de nuevo más tarde",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Cuenta regresiva del reenvío
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  return (
    <View className="flex-1 justify-center p-6 bg-[#faf5e0]">
      {loading ? (
        <View className="items-center">
          <ActivityIndicator size="large" color="#007275" />
          <Text className="mt-4 text-[#211f1e]">Reenviando...</Text>
        </View>
      ) : (
        <>
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-full bg-[#007275]/10 items-center justify-center mb-4">
              <Ionicons name="mail-outline" size={40} color="#007275" />
            </View>
            <Text className="text-3xl font-bold text-[#211f1e] mb-2 text-center">
              Revisa tu correo electrónico
            </Text>
            <Text className="text-[#211f1e] text-base text-center leading-6">
              Te enviamos un link de confirmación a{" "}
              <Text className="font-bold">{email}</Text>
            </Text>
            <Text className="text-[#211f1e]/60 text-center text-sm mt-4">
              Confirma tu cuenta desde el correo electrónico y luego inicia sesión
            </Text>
          </View>

          <TouchableOpacity
            className="py-2 mb-4"
            onPress={handleResend}
            disabled={cooldown > 0}
            accessibilityRole="button"
            accessibilityState={{ disabled: cooldown > 0 }}
          >
            <Text
              className={`text-center font-semibold ${cooldown > 0 ? "text-gray-500" : "text-[#007275]"}`}
            >
              {cooldown > 0
                ? `Reenviar email en ${cooldown} s`
                : "Reenviar email"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-2"
            onPress={() => router.replace("/login")}
            accessibilityRole="button"
          >
            <Text className="text-[#211f1e]/70 text-center">
              Volver al inicio
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
