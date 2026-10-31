import { Ionicons } from "@expo/vector-icons";
import { PasswordInput } from "@/components/PasswordInput";
import { CARD, Field, PrimaryButton } from "@/components/kit/Kit";
import { authErrorMessage, authService, passwordError } from "@/services/auth.service";
import { getCurrentUser } from "@/utils/session";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

type Busy = "password" | "email" | null;

export default function SeguridadScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Busy>(null);
  const [currentEmail, setCurrentEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const showError = (text2: string) =>
    Toast.show({ type: "error", text1: "No se pudo guardar", text2, position: "top" });

  const loadUser = async () => {
    const { data } = await getCurrentUser();
    if (!data?.user) {
      router.replace("/login");
      return;
    }
    setCurrentEmail(data.user.email ?? "");
    setLoading(false);
  };

  // Pide la contraseña actual antes de cambiar credenciales (una sesión robada no basta)
  const confirmCurrentPassword = async () => {
    if (!currentPassword.trim()) {
      showError("Ingresa tu contraseña actual");
      return false;
    }
    const { error } = await authService.signIn(currentEmail, currentPassword);
    if (error) {
      showError(
        error.code === "invalid_credentials" ? "La contraseña actual no es correcta" : authErrorMessage(error),
      );
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    const next = newPassword.trim();
    if (next !== confirmPassword.trim()) return showError("Las contraseñas nuevas no coinciden");
    const weak = passwordError(next);
    if (weak) return showError(weak);

    setBusy("password");
    try {
      if (!(await confirmCurrentPassword())) return;
      const { error } = await authService.updatePassword(next);
      if (error) return showError(authErrorMessage(error));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Toast.show({ type: "success", text1: "Contraseña actualizada", position: "top", visibilityTime: 2500 });
    } finally {
      setBusy(null);
    }
  };

  const handleChangeEmail = async () => {
    const next = newEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(next)) return showError("Ingresa un correo válido");
    if (next === currentEmail.toLowerCase()) return showError("Ese ya es tu correo actual");

    setBusy("email");
    try {
      if (!(await confirmCurrentPassword())) return;
      const { error } = await authService.changeEmail(next);
      if (error) return showError(authErrorMessage(error));
      setCurrentPassword("");
      setNewEmail("");
      Toast.show({
        type: "success",
        text1: "Revisa tu correo",
        text2: "Te enviamos un enlace para confirmar el cambio. Hasta entonces sigue valiendo tu correo actual.",
        position: "top",
        visibilityTime: 5000,
      });
    } finally {
      setBusy(null);
    }
  };

  // loadUser corre una sola vez al montar (deps estables intencionales)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar: el setState ocurre tras la consulta async
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#007275" />
      </View>
    );
  }


  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#faf5e0]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView contentContainerClassName="p-5 pb-10 bg-[#faf5e0] grow" keyboardShouldPersistTaps="handled">
        <View className={`${CARD} flex-row items-center p-4 mb-6`}>
          <View className="w-11 h-11 rounded-2xl bg-[#007275]/10 items-center justify-center mr-3">
            <Ionicons name="shield-checkmark" size={22} color="#007275" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500">Sesión iniciada como</Text>
            <Text className="font-bold text-[#211f1e] text-[15px]" numberOfLines={1}>{currentEmail}</Text>
          </View>
        </View>

        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-2">Verificación</Text>
        <View className={`${CARD} p-4 mb-6`}>
          <Text className="text-[13px] font-semibold text-[#211f1e] mb-1.5 ml-1">Contraseña actual</Text>
          <PasswordInput
            placeholder="••••••••"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            autoCapitalize="none"
            autoComplete="current-password"
            accessibilityLabel="Contraseña actual"
          />
          <Text className="text-gray-500 text-xs mt-2 ml-1">La necesitamos para confirmar que eres tú.</Text>
        </View>

        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-2">Cambiar contraseña</Text>
        <View className={`${CARD} p-4 mb-6`}>
          <Text className="text-[13px] font-semibold text-[#211f1e] mb-1.5 ml-1">Nueva contraseña</Text>
          <View className="mb-4">
            <PasswordInput
              placeholder="Mínimo 8, con letras y números"
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              accessibilityLabel="Nueva contraseña"
            />
          </View>
          <Text className="text-[13px] font-semibold text-[#211f1e] mb-1.5 ml-1">Confirmar nueva contraseña</Text>
          <View className="mb-5">
            <PasswordInput
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              accessibilityLabel="Confirmar nueva contraseña"
            />
          </View>
          <PrimaryButton
            title={busy === "password" ? "Guardando..." : "Actualizar contraseña"}
            icon="key-outline"
            onPress={handleChangePassword}
            loading={busy === "password"}
            disabled={busy !== null}
          />
        </View>

        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-2">Cambiar correo</Text>
        <View className={`${CARD} p-4 mb-6`}>
          <Field
            label="Nuevo correo"
            icon="mail-outline"
            placeholder="nuevo@correo.com"
            value={newEmail}
            onChangeText={setNewEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            accessibilityLabel="Nuevo correo"
          />
          <PrimaryButton
            title={busy === "email" ? "Enviando..." : "Cambiar correo"}
            icon="mail"
            onPress={handleChangeEmail}
            loading={busy === "email"}
            disabled={busy !== null}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
