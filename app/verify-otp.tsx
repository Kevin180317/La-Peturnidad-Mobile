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
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
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

  return (
    <View className="flex-1 justify-center p-6 bg-[#faf5e0]">
      {loading ? (
        <View className="items-center">
          <ActivityIndicator size="large" color="#007275" />
          <Text className="mt-4 text-[#211f1e]">Verificando código...</Text>
        </View>
      ) : (
        <>
          <View className="mb-8">
            <Text className="text-3xl font-bold text-[#211f1e] mb-2">
              Verifica tu código
            </Text>
            <Text className="text-[#211f1e] text-lg">
              Ingresa el código de 8 dígitos que enviamos a{" "}
              <Text className="font-bold">{email}</Text>
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-[#211f1e] font-semibold mb-2">
              Código OTP
            </Text>
            <TextInput
              className={`${otpFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border-2 border-[#211f1e]/20"} rounded-lg p-4 text-base bg-white text-[#211f1e] text-center tracking-[8px]`}
              placeholder="--------"
              placeholderTextColor="#9BA1A6"
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

          <TouchableOpacity
            className="bg-[#007275] py-4 rounded-xl mb-4"
            onPress={() => handleVerify()}
            accessibilityRole="button"
          >
            <Text className="text-white text-center font-bold text-lg">
              Verificar código
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-2"
            onPress={handleResend}
            disabled={cooldown > 0}
            accessibilityRole="button"
            accessibilityState={{ disabled: cooldown > 0 }}
          >
            <Text
              className={`text-center font-semibold ${cooldown > 0 ? "text-gray-500" : "text-[#007275]"}`}
            >
              {cooldown > 0
                ? `Reenviar código en ${cooldown} s`
                : "Reenviar código"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
