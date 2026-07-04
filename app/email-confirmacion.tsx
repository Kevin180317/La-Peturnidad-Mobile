import { authService } from "@/services/auth.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function EmailConfirmacionScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResend = async () => {
    setLoading(true);
    const { error } = await authService.resendConfirmation(email);
    setLoading(false);

    if (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
        visibilityTime: 3000,
      });
    } else {
      Toast.show({
        type: "success",
        text1: "Email reenviado",
        text2: "Revisá tu bandeja de entrada",
        visibilityTime: 3000,
      });
    }
  };

  return (
    <View className="flex-1 justify-center p-6 bg-[#faf5e0]">
      {loading ? (
        <View className="items-center">
          <ActivityIndicator size="large" color="#ff7e70" />
          <Text className="mt-4 text-[#211f1e]">Reenviando...</Text>
        </View>
      ) : (
        <>
          <View className="items-center mb-8">
            <Text className="text-4xl mb-4">✉️</Text>
            <Text className="text-3xl font-bold text-[#ff7e70] mb-2 text-center">
              Revisá tu email
            </Text>
            <Text className="text-[#211f1e] text-base text-center leading-6">
              Te enviamos un link de confirmación a{" "}
              <Text className="font-bold">{email}</Text>
            </Text>
            <Text className="text-[#211f1e]/60 text-center text-sm mt-4">
              Confirmá tu cuenta desde el email y luego iniciá sesión
            </Text>
          </View>

          <TouchableOpacity className="py-2 mb-4" onPress={handleResend}>
            <Text className="text-[#ff7e70] text-center font-semibold">
              Reenviar email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-2"
            onPress={() => router.replace("/")}
          >
            <Text className="text-[#211f1e]/70 text-center">
              Volver al inicio
            </Text>
          </TouchableOpacity>
        </>
      )}
      <Toast />
    </View>
  );
}
