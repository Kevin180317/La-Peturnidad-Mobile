import { authErrorMessage, authService, passwordError } from "@/services/auth.service";
import { PasswordInput } from "@/components/PasswordInput";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
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
    const trimmedPassword = password.trim();

    if (!trimmedPassword || !confirmPassword.trim()) {
      Toast.show({
        type: "error",
        text1: "Campos requeridos",
        text2: "Completa todos los campos",
        visibilityTime: 3000,
      });
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      Toast.show({
        type: "error",
        text1: "Error de validación",
        text2: "Las contraseñas no coinciden",
        visibilityTime: 3000,
      });
      return;
    }

    const weakPassword = passwordError(trimmedPassword);
    if (weakPassword) {
      Toast.show({
        type: "error",
        text1: "Error de validación",
        text2: weakPassword,
        visibilityTime: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await authService.updatePassword(trimmedPassword);

      if (error) {
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
        text1: "Contraseña actualizada",
        text2: "Tu nueva contraseña ya está activa",
        visibilityTime: 2000,
        onHide: () => {
          // La verificación OTP dejó una sesión activa: index decide (dashboard o perfil)
          // y se limpia el historial de recuperación para que "atrás" no regrese aquí.
          if (router.canDismiss()) router.dismissAll();
          router.replace("/");
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

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#faf5e0]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View className="flex-1 justify-center p-6">
      {loading ? (
        <View className="items-center">
          <ActivityIndicator size="large" color="#007275" />
          <Text className="mt-4 text-[#211f1e]">Actualizando...</Text>
        </View>
      ) : (
        <>
          <View className="mb-8">
            <Text className="text-3xl font-bold text-[#211f1e] mb-2">
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
            <PasswordInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              accessibilityLabel="Nueva contraseña"
            />
          </View>

          <View className="mb-8">
            <Text className="text-[#211f1e] font-semibold mb-2">
              Confirmar contraseña
            </Text>
            <PasswordInput
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              accessibilityLabel="Confirmar contraseña"
            />
          </View>

          <TouchableOpacity
            className="bg-[#007275] py-4 rounded-xl mb-4"
            onPress={handleUpdate}
            accessibilityRole="button"
          >
            <Text className="text-white text-center font-bold text-lg">
              Actualizar contraseña
            </Text>
          </TouchableOpacity>
        </>
      )}
      </View>
    </KeyboardAvoidingView>
  );
}
