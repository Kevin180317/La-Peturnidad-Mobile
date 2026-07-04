import { authService } from "@/services/auth.service";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOtp = async () => {
    if (!email) {
      Toast.show({
        type: "error",
        text1: "Campo requerido",
        text2: "Ingresa tu email",
        visibilityTime: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await authService.sendOtp(email);

      if (error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
          visibilityTime: 3000,
        });
        setLoading(false);
        return;
      }

      Toast.show({
        type: "success",
        text1: "Código enviado",
        text2: "Revisa tu bandeja de entrada",
        visibilityTime: 2000,
        onHide: () => {
          router.push({ pathname: "/verify-otp", params: { email } });
        },
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error inesperado",
        text2: error.message || "Intenta de nuevo más tarde",
        visibilityTime: 3000,
      });
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center p-6 bg-[#faf5e0]">
      {loading ? (
        <View className="items-center">
          <ActivityIndicator size="large" color="#ff7e70" />
          <Text className="mt-4 text-[#211f1e]">Enviando código...</Text>
        </View>
      ) : (
        <>
          <View className="mb-8">
            <Text className="text-3xl font-bold text-[#ff7e70] mb-2">
              Recuperar contraseña
            </Text>
            <Text className="text-[#211f1e] text-lg">
              Te enviaremos un código OTP a tu email
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-[#211f1e] font-semibold mb-2">
              Correo electrónico
            </Text>
            <TextInput
              className="border-2 border-[#211f1e]/20 rounded-xl p-4 text-base bg-[#faf5e0]"
              placeholder="ejemplo@correo.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <TouchableOpacity
            className="bg-[#ff7e70] py-4 rounded-xl shadow-md mb-4"
            onPress={handleSendOtp}
          >
            <Text className="text-white text-center font-bold text-lg">
              Enviar código
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4">
            <Text className="text-[#211f1e]">¿Recordaste? </Text>
            <Link href="/" className="text-[#ff7e70] font-bold">
              Inicia sesión
            </Link>
          </View>
        </>
      )}
      <Toast />
    </View>
  );
}
