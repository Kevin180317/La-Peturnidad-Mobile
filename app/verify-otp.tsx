import { authService } from "@/services/auth.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    if (!otp || otp.length < 8) {
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
      const { error } = await authService.verifyOtp(email, otp);

      if (error) {
        Toast.show({
          type: "error",
          text1: "Código incorrecto",
          text2: error.message,
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
          <Text className="mt-4 text-[#211f1e]">Verificando código...</Text>
        </View>
      ) : (
        <>
          <View className="mb-8">
            <Text className="text-3xl font-bold text-[#ff7e70] mb-2">
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
              className="border-2 border-[#211f1e]/20 rounded-xl p-4 text-base bg-[#faf5e0] text-center tracking-[8px]"
              placeholder="--------"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={8}
              autoFocus
            />
          </View>

          <TouchableOpacity
            className="bg-[#ff7e70] py-4 rounded-xl shadow-md mb-4"
            onPress={handleVerify}
          >
            <Text className="text-white text-center font-bold text-lg">
              Verificar código
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-2"
            onPress={async () => {
              setLoading(true);
              const { error } = await authService.sendOtp(email);
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
                  text1: "Código reenviado",
                  text2: "Revisa tu email",
                  visibilityTime: 3000,
                });
              }
            }}
          >
            <Text className="text-[#ff7e70] text-center font-semibold">
              Reenviar código
            </Text>
          </TouchableOpacity>
        </>
      )}
      <Toast />
    </View>
  );
}
