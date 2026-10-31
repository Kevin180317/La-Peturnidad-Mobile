import { AuthScreen } from "@/components/auth/AuthScreen";
import { PrimaryButton } from "@/components/kit/Kit";
import { authErrorMessage, authService } from "@/services/auth.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otpFocused, setOtpFocused] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();

  const handleVerify = async (code?: string) => {
    const finalOtp = code ?? otp;
    if (!finalOtp || finalOtp.length < 8) {
      Toast.show({
        type: "error",
        text1: "Código inválido",
        text2: "Ingresa el código de 8 dígitos",
        visibilityTime: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await authService.verifyOtp(email, finalOtp);

      if (error) {
        Toast.show({
          type: "error",
          text1: "Código incorrecto",
          text2: authErrorMessage(error),
          visibilityTime: 3000,
        });
        setLoading(false);
        return;
      }

      Toast.show({
        type: "success",
        text1: "Código verificado",
        text2: "Ahora puedes cambiar tu contraseña",
        visibilityTime: 2000,
        onHide: () => {
          router.replace("/reset-password");
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

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    try {
      const { error } = await authService.sendOtp(email);
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
          text1: "Código reenviado",
          text2: "Revisa tu correo electrónico",
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

  const handleOtpChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 8);
    setOtp(cleaned);
    if (cleaned.length === 8 && !loading) {
      handleVerify(cleaned);
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
        <Text className="mt-4 text-gray-600 font-medium">Verificando código...</Text>
      </View>
    );
  }

  return (
    <AuthScreen
      headerless
      onBack={() => (router.canGoBack() ? router.back() : router.replace("/forgot-password"))}
      title="Verifica tu código"
      subtitle={
        <>
          Ingresa el código de 8 dígitos que enviamos a{" "}
          <Text className="font-bold text-[#211f1e]">{email}</Text>
        </>
      }
    >
      <View className={`h-16 rounded-2xl border-[1.5px] bg-white justify-center mb-5 ${otpFocused ? "border-[#007275]" : "border-gray-200"}`}>
        <TextInput
          className="text-2xl font-bold text-[#211f1e] text-center tracking-[8px]"
          placeholder="--------"
          placeholderTextColor="#C4C4C4"
          value={otp}
          onChangeText={handleOtpChange}
          keyboardType="number-pad"
          maxLength={8}
          autoFocus
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          accessibilityLabel="Código de verificación de 8 dígitos"
          onFocus={() => setOtpFocused(true)}
          onBlur={() => setOtpFocused(false)}
        />
      </View>

      <PrimaryButton title="Verificar código" icon="shield-checkmark-outline" onPress={() => handleVerify()} />

      <TouchableOpacity
        className="py-3 mt-2"
        onPress={handleResend}
        disabled={cooldown > 0}
        accessibilityRole="button"
        accessibilityState={{ disabled: cooldown > 0 }}
      >
        <Text className={`text-center font-semibold ${cooldown > 0 ? "text-gray-500" : "text-[#007275]"}`}>
          {cooldown > 0 ? `Reenviar código en ${cooldown} s` : "Reenviar código"}
        </Text>
      </TouchableOpacity>
    </AuthScreen>
  );
}
