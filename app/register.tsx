import { AuthScreen, FieldLabel } from "@/components/auth/AuthScreen";
import { Field, PrimaryButton } from "@/components/kit/Kit";
import { authErrorMessage, authService, passwordError } from "@/services/auth.service";
import { PasswordInput } from "@/components/PasswordInput";
import { openLegalUrl } from "@/utils/legal";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Validaciones
    if (!trimmedEmail || !trimmedPassword || !confirmPassword.trim()) {
      Toast.show({
        type: "error",
        text1: "Campos requeridos",
        text2: "Todos los campos son obligatorios",
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

    if (!acceptedTerms) {
      Toast.show({
        type: "error",
        text1: "Aceptación requerida",
        text2: "Debes aceptar los Términos y la Política de Privacidad",
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
      const { data, error } = await authService.signUp(
        trimmedEmail,
        trimmedPassword,
      );

      if (error) {
        Toast.show({
          type: "error",
          text1: "Error al registrar",
          text2: authErrorMessage(error),
          visibilityTime: 3000,
        });
        setLoading(false);
        return;
      }

      // Con confirmación de correo activa, Supabase no devuelve error para correos ya
      // registrados: responde un usuario sin identidades.
      if (data.user && data.user.identities?.length === 0) {
        Toast.show({
          type: "error",
          text1: "Error al registrar",
          text2: "Este correo ya está registrado",
          visibilityTime: 3000,
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        const userEmail = data.user.email ?? trimmedEmail;
        Toast.show({
          type: "success",
          text1: "Registro exitoso",
          text2: "Confirma tu correo electrónico para continuar",
          visibilityTime: 2000,
          onHide: () => {
            router.replace({
              pathname: "/email-confirmacion",
              params: { email: userEmail },
            });
          },
        });
      } else {
        setLoading(false);
      }
    } catch (error) {
      if (__DEV__) console.error("Error en registro:", error);
      Toast.show({
        type: "error",
        text1: "Error de red",
        text2: "No se pudo conectar al servidor",
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
        <Text className="mt-4 text-gray-600 font-medium">Procesando registro...</Text>
      </View>
    );
  }

  return (
    <AuthScreen
      headerless
      onBack={goToLogin}
      title="Crear Cuenta"
      subtitle="Regístrate para comenzar"
      footer={
        <View className="flex-row justify-center">
          <Text className="text-[#211f1e]">¿Ya tienes cuenta? </Text>
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

      <FieldLabel>Contraseña</FieldLabel>
      <View className="mb-4">
        <PasswordInput
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          autoComplete="new-password"
          accessibilityLabel="Contraseña"
        />
        <Text className="text-gray-500 text-xs mt-1.5 ml-1">Mínimo 8 caracteres, con letras y números</Text>
      </View>

      <FieldLabel>Confirmar contraseña</FieldLabel>
      <View className="mb-5">
        <PasswordInput
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoComplete="new-password"
          accessibilityLabel="Confirmar contraseña"
        />
      </View>

      <TouchableOpacity
        className={`flex-row items-start p-3 rounded-2xl mb-5 ${acceptedTerms ? "bg-[#007275]/10" : "bg-[#faf5e0]"}`}
        onPress={() => setAcceptedTerms((v) => !v)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acceptedTerms }}
        accessibilityLabel="Acepto los Términos y Condiciones y la Política de Privacidad"
      >
        <Ionicons
          name={acceptedTerms ? "checkbox" : "square-outline"}
          size={22}
          color={acceptedTerms ? "#007275" : "#6b7280"}
        />
        <Text className="flex-1 ml-3 text-[#211f1e] text-sm leading-5">
          Acepto los{" "}
          <Text className="text-[#007275] font-bold" onPress={() => openLegalUrl("terms")} accessibilityRole="link">
            Términos y Condiciones
          </Text>{" "}
          y la{" "}
          <Text className="text-[#007275] font-bold" onPress={() => openLegalUrl("privacy")} accessibilityRole="link">
            Política de Privacidad
          </Text>
          .
        </Text>
      </TouchableOpacity>

      <PrimaryButton title="Registrarse" icon="person-add-outline" onPress={handleRegister} disabled={loading || !acceptedTerms} />
    </AuthScreen>
  );
}
