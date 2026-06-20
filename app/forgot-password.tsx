import { authService } from "@/services/auth.service";
import { Link } from "expo-router";
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
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
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
      const { error } = await authService.resetPassword(email);

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

      setSent(true);
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
    <View className="flex-1 bg-[#faf5e0] px-6">
      <View className="flex-1 justify-center">
        {loading ? (
          <View className="items-center">
            <ActivityIndicator size="large" color="#ff7e70" />
            <Text className="mt-4 text-[#211f1e]">Enviando...</Text>
          </View>
        ) : sent ? (
          <>
            <Text className="text-3xl font-bold text-[#ff7e70] mb-2">
              Revisa tu email
            </Text>
            <Text className="text-base text-[#211f1e]/70 mb-8">
              Te hemos enviado un enlace para restablecer tu contraseña a{" "}
              <Text className="font-bold">{email}</Text>
            </Text>
            <Link href="/" className="text-[#ff7e70] font-bold text-center">
              Volver al inicio de sesión
            </Link>
          </>
        ) : (
          <>
            <Text className="text-3xl font-bold text-[#ff7e70] mb-2">
              Recuperar contraseña
            </Text>
            <Text className="text-base text-[#211f1e]/70 mb-8">
              Te enviaremos un enlace para restablecer tu contraseña
            </Text>

            <Text className="text-sm font-semibold text-[#211f1e] mb-2">
              Email
            </Text>
            <TextInput
              className="bg-white p-4 rounded-xl mb-6 text-[#211f1e]"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TouchableOpacity
              className="bg-[#ff7e70] py-4 rounded-xl"
              onPress={handleReset}
            >
              <Text className="text-white text-center font-bold text-lg">
                Enviar enlace
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-8">
              <Text className="text-[#211f1e]/70">¿Recordaste? </Text>
              <Link href="/" className="text-[#ff7e70] font-bold">
                Inicia sesión
              </Link>
            </View>
          </>
        )}
      </View>
      <Toast />
    </View>
  );
}
