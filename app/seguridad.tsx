import { PasswordInput } from "@/components/PasswordInput";
import { authErrorMessage, authService, passwordError } from "@/services/auth.service";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
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
  const [emailFocused, setEmailFocused] = useState(false);

  const showError = (text2: string) =>
    Toast.show({ type: "error", text1: "No se pudo guardar", text2, position: "top" });

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
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

  const buttonClass = (active: boolean) => `py-4 rounded-xl ${active ? "bg-gray-400" : "bg-[#007275]"}`;
  const buttonText = (active: boolean) => `text-center font-bold ${active ? "text-gray-700" : "text-white"}`;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#faf5e0]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView contentContainerClassName="p-5 bg-[#faf5e0] grow" keyboardShouldPersistTaps="handled">
        <Text className="text-2xl font-bold text-[#211f1e] mb-1">Cuenta y seguridad</Text>
        <Text className="text-gray-500 mb-6">{currentEmail}</Text>

        <View className="bg-white p-5 rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] mb-6">
          <Text className="font-semibold mb-2 text-gray-600">Contraseña actual</Text>
          <PasswordInput
            placeholder="••••••••"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            autoCapitalize="none"
            autoComplete="current-password"
            accessibilityLabel="Contraseña actual"
          />
          <Text className="text-gray-500 text-xs mt-2">La necesitamos para confirmar que eres tú.</Text>
        </View>

        <View className="bg-white p-5 rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] mb-6">
          <Text className="text-lg font-bold text-[#211f1e] mb-4">Cambiar contraseña</Text>
          <Text className="font-semibold mb-2 text-gray-600">Nueva contraseña</Text>
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
          <Text className="font-semibold mb-2 text-gray-600">Confirmar nueva contraseña</Text>
          <View className="mb-4">
            <PasswordInput
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              accessibilityLabel="Confirmar nueva contraseña"
            />
          </View>
          <TouchableOpacity
            className={buttonClass(busy === "password")}
            onPress={handleChangePassword}
            disabled={busy !== null}
            accessibilityRole="button"
          >
            <Text className={buttonText(busy === "password")}>
              {busy === "password" ? "Guardando..." : "Actualizar contraseña"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white p-5 rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] mb-6">
          <Text className="text-lg font-bold text-[#211f1e] mb-4">Cambiar correo</Text>
          <Text className="font-semibold mb-2 text-gray-600">Nuevo correo</Text>
          <TextInput
            className={`bg-white p-3 rounded-lg mb-4 text-[#211f1e] ${emailFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-300"}`}
            placeholder="nuevo@correo.com"
            placeholderTextColor="#9BA1A6"
            value={newEmail}
            onChangeText={setNewEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            accessibilityLabel="Nuevo correo"
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
          />
          <TouchableOpacity
            className={buttonClass(busy === "email")}
            onPress={handleChangeEmail}
            disabled={busy !== null}
            accessibilityRole="button"
          >
            <Text className={buttonText(busy === "email")}>
              {busy === "email" ? "Enviando..." : "Cambiar correo"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="py-4 rounded-xl bg-[#211f1e]" onPress={() => router.back()} accessibilityRole="button">
          <Text className="text-white text-center font-bold">Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
