import { authService } from "@/services/auth.service";
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

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    if (!password || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Campos requeridos",
        text2: "Completa todos los campos",
        visibilityTime: 3000,
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Error de validación",
        text2: "Las contraseñas no coinciden",
        visibilityTime: 3000,
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Error de validación",
        text2: "La contraseña debe tener al menos 6 caracteres",
        visibilityTime: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await authService.updatePassword(password);

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
        text1: "Contraseña actualizada",
        text2: "Ya puedes iniciar sesión con tu nueva contraseña",
        visibilityTime: 2000,
        onHide: () => {
          router.replace("/");
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
          <Text className="mt-4 text-[#211f1e]">Actualizando...</Text>
        </View>
      ) : (
        <>
          <View className="mb-8">
            <Text className="text-3xl font-bold text-[#ff7e70] mb-2">
              Nueva contraseña
            </Text>
            <Text className="text-[#211f1e] text-lg">
              Ingresa tu nueva contraseña
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-[#211f1e] font-semibold mb-2">
              Nueva contraseña
            </Text>
            <TextInput
              className="border-2 border-[#211f1e]/20 rounded-xl p-4 text-base bg-[#faf5e0]"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
          </View>

          <View className="mb-8">
            <Text className="text-[#211f1e] font-semibold mb-2">
              Confirmar contraseña
            </Text>
            <TextInput
              className="border-2 border-[#211f1e]/20 rounded-xl p-4 text-base bg-[#faf5e0]"
              placeholder="••••••••"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            className="bg-[#ff7e70] py-4 rounded-xl shadow-md mb-4"
            onPress={handleUpdate}
          >
            <Text className="text-white text-center font-bold text-lg">
              Actualizar contraseña
            </Text>
          </TouchableOpacity>
        </>
      )}
      <Toast />
    </View>
  );
}
