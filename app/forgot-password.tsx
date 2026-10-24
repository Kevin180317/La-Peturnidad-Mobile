import {
  authErrorMessage,
  authService,
  isRateLimitError,
} from "@/services/auth.service";
import { useRouter } from "expo-router";
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
  const [emailFocused, setEmailFocused] = useState(false);
  const router = useRouter();

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Toast.show({
        type: "error",
        text1: "Campo requerido",
        text2: "Ingresa tu correo electrónico",
        visibilityTime: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await authService.sendOtp(trimmedEmail);

      // Solo el límite de intentos se muestra como error: cualquier otro error (p. ej. cuenta
      // inexistente) sigue el flujo normal para no revelar qué correos están registrados.
      if (error && isRateLimitError(error)) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: authErrorMessage(error),
          visibilityTime: 3000,
        });
        setLoading(false);
        return;
      }

      Toast.show({
        type: "success",
        text1: "Revisa tu correo",
        text2: "Si el correo está registrado, te enviamos un código",
        visibilityTime: 2000,
        onHide: () => {
          setLoading(false);
          router.push({ pathname: "/verify-otp", params: { email: trimmedEmail } });
        },
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Error inesperado",
        text2: "Intenta de nuevo más tarde",
        visibilityTime: 3000,
      });
      setLoading(false);
    }
  };

  const goToLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/login");
  };

  return (
    <View className="flex-1 justify-center p-6 bg-[#faf5e0]">
      {loading ? (
        <View className="items-center">
          <ActivityIndicator size="large" color="#007275" />
          <Text className="mt-4 text-[#211f1e]">Enviando código...</Text>
        </View>
      ) : (
        <>
          <View className="mb-8">
            <Text className="text-3xl font-bold text-[#211f1e] mb-2">
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
              className={`${emailFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border-2 border-[#211f1e]/20"} rounded-lg p-4 text-base bg-white text-[#211f1e]`}
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#9BA1A6"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              accessibilityLabel="Correo electrónico"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          <TouchableOpacity
            className="bg-[#007275] py-4 rounded-xl mb-4"
            onPress={handleSendOtp}
            accessibilityRole="button"
          >
            <Text className="text-white text-center font-bold text-lg">
              Enviar código
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4">
            <Text className="text-[#211f1e]">¿Recordaste? </Text>
            <Text
              className="text-[#007275] font-bold"
              onPress={goToLogin}
              accessibilityRole="link"
            >
              Inicia sesión
            </Text>
          </View>
        </>
      )}
    </View>
  );
}
