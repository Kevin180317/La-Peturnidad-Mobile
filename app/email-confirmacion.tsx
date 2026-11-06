import { AuthScreen } from "@/components/auth/AuthScreen";
import { PrimaryButton } from "@/components/kit/Kit";
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#007275" />
        <Text className="mt-4 text-gray-600 font-medium">Reenviando...</Text>
      </View>
    );
  }

  return (
    <AuthScreen
      headerless
      title="Revisa tu correo electrónico"
      hero={
        <View className="w-20 h-20 rounded-3xl bg-white items-center justify-center shadow-[0_8px_24px_rgba(0,114,117,0.2)]">
          <Ionicons name="mail-unread-outline" size={38} color="#007275" />
        </View>
      }
      subtitle={
        <>
          Te enviamos un link de confirmación a{" "}
          <Text className="font-bold text-[#211f1e]">{email}</Text>
        </>
      }
      footer={
        <TouchableOpacity className="py-2" onPress={() => router.replace("/login")} accessibilityRole="button">
          <Text className="text-gray-600 text-center font-semibold">Volver al inicio</Text>
        </TouchableOpacity>
      }
    >
      <View className="flex-row items-start gap-3 bg-[#faf5e0] p-3 rounded-2xl mb-5">
        <Ionicons name="information-circle" size={20} color="#007275" />
        <Text className="flex-1 text-[#211f1e] text-sm leading-5">
          Confirma tu cuenta desde el correo electrónico y luego inicia sesión
        </Text>
      </View>
      <PrimaryButton
        title={cooldown > 0 ? `Reenviar email en ${cooldown} s` : "Reenviar email"}
        icon="refresh"
        variant={cooldown > 0 ? "ghost" : "teal"}
        onPress={handleResend}
        disabled={cooldown > 0}
      />
    </AuthScreen>
  );
}
