import { AuthScreen } from "@/components/auth/AuthScreen";
import { Field, PrimaryButton } from "@/components/kit/Kit";
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
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#007275" />
        <Text className="mt-4 text-gray-600 font-medium">Enviando código...</Text>
      </View>
    );
  }

  return (
    <AuthScreen
      headerless
      onBack={goToLogin}
      title="Recuperar contraseña"
      subtitle="Te enviaremos un código OTP a tu email"
      footer={
        <View className="flex-row justify-center">
          <Text className="text-[#211f1e]">¿Recordaste? </Text>
          <Text className="text-[#007275] font-bold" onPress={goToLogin} accessibilityRole="link">
            Inicia sesión
          </Text>
        </View>
      }
    >
      <Field
        label="Correo electrónico"
        icon="mail-outline"
        placeholder="ejemplo@correo.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        accessibilityLabel="Correo electrónico"
      />
      <PrimaryButton title="Enviar código" icon="paper-plane-outline" onPress={handleSendOtp} className="mt-1" />
    </AuthScreen>
  );
}
