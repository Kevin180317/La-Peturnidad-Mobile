import { authErrorMessage, authService, passwordError } from "@/services/auth.service";
import { PasswordInput } from "@/components/PasswordInput";
import { openLegalUrl } from "@/utils/legal";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
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
  const [emailFocused, setEmailFocused] = useState(false);

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
          <Text className="mt-4 text-gray-600 font-medium">
            Procesando registro...
          </Text>
        </View>
      ) : (
        <>
          <View className="mb-8">
            <Text className="text-3xl font-bold text-[#211f1e] mb-2">
              Crear Cuenta
            </Text>
            <Text className="text-[#211f1e] text-lg">
              Regístrate para comenzar
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-[#211f1e] font-semibold mb-2">
              Correo electrónico
            </Text>
            <TextInput
              className={`${emailFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border-2 border-[#211f1e]/20"} rounded-lg p-4 text-base bg-white text-[#211f1e]`}
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#9BA1A6"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              accessibilityLabel="Correo electrónico"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          <View className="mb-4">
            <Text className="text-[#211f1e] font-semibold mb-2">Contraseña</Text>
            <PasswordInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              autoComplete="new-password"
              accessibilityLabel="Contraseña"
            />
          </View>

          <View className="mb-4">
            <Text className="text-[#211f1e] font-semibold mb-2">
              Confirmar contraseña
            </Text>
            <PasswordInput
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoComplete="new-password"
              accessibilityLabel="Confirmar contraseña"
            />
          </View>

          <TouchableOpacity
            className="flex-row items-start mb-8"
            onPress={() => setAcceptedTerms((v) => !v)}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}
            accessibilityLabel="Acepto los Términos y Condiciones y la Política de Privacidad"
          >
            <Ionicons
              name={acceptedTerms ? "checkbox" : "square-outline"}
              size={24}
              color={acceptedTerms ? "#007275" : "#6b7280"}
            />
            <Text className="flex-1 ml-3 text-[#211f1e] leading-5">
              Acepto los{" "}
              <Text
                className="text-[#007275] font-bold"
                onPress={() => openLegalUrl("terms")}
                accessibilityRole="link"
              >
                Términos y Condiciones
              </Text>{" "}
              y la{" "}
              <Text
                className="text-[#007275] font-bold"
                onPress={() => openLegalUrl("privacy")}
                accessibilityRole="link"
              >
                Política de Privacidad
              </Text>
              .
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`py-4 rounded-xl mb-4 ${acceptedTerms ? "bg-[#007275]" : "bg-gray-400"}`}
            onPress={handleRegister}
            disabled={loading || !acceptedTerms}
            accessibilityRole="button"
          >
            <Text className="text-white text-center font-bold text-lg">
              Registrarse
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4">
            <Text className="text-[#211f1e]">¿Ya tienes cuenta? </Text>
            <Text
              className="text-[#007275] font-bold"
              onPress={goToLogin}
              accessibilityRole="link"
            >
              Inicia sesión
            </Text>
          </View>
        </>
      )}
      </View>
    </KeyboardAvoidingView>
  );
}
