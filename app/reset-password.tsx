import { AuthScreen, FieldLabel } from "@/components/auth/AuthScreen";
import { PrimaryButton } from "@/components/kit/Kit";
import { authErrorMessage, authService, passwordError } from "@/services/auth.service";
import { PasswordInput } from "@/components/PasswordInput";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Text,
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#007275" />
        <Text className="mt-4 text-gray-600 font-medium">Actualizando...</Text>
      </View>
    );
  }

  return (
    <AuthScreen headerless title="Nueva contraseña" subtitle="Ingresa tu nueva contraseña">
      <FieldLabel>Nueva contraseña</FieldLabel>
      <View className="mb-4">
        <PasswordInput
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          accessibilityLabel="Nueva contraseña"
        />
        <Text className="text-gray-500 text-xs mt-1.5 ml-1">Mínimo 8 caracteres, con letras y números</Text>
      </View>

      <FieldLabel>Confirmar contraseña</FieldLabel>
      <View className="mb-5">
        <PasswordInput
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          accessibilityLabel="Confirmar contraseña"
        />
      </View>

      <PrimaryButton title="Actualizar contraseña" icon="key-outline" onPress={handleUpdate} />
    </AuthScreen>
  );
}
