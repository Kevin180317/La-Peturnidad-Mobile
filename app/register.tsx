import { supabase } from "@/utils/supabase";
import { PasswordInput } from "@/components/PasswordInput";
import { Link, useRouter } from "expo-router";
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

  const handleRegister = async () => {
    // Validaciones
    if (!email || !password || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Campos requeridos",
        text2: "Todos los campos son obligatorios",
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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        Toast.show({
          type: "error",
          text1: "Error al registrar",
          text2: error.message,
          visibilityTime: 3000,
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log("✅ Usuario registrado:", data.user.id);

        Toast.show({
          type: "success",
          text1: "Registro exitoso",
          text2: "Confirmá tu email para continuar",
          visibilityTime: 2000,
          onHide: () => {
            router.replace({
              pathname: "/email-confirmacion",
              params: {
                email: data.user?.email ?? "",
                userId: data.user?.id ?? "",
              },
            });
          },
        });
      }
    } catch (error: any) {
      console.error("❌ Error en registro:", error);
      Toast.show({
        type: "error",
        text1: "Error de red",
        text2: "No se pudo conectar al servidor",
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
          <Text className="mt-4 text-gray-600 font-medium">
            Procesando registro...
          </Text>
        </View>
      ) : (
        <>
          <View className="mb-8">
            <Text className="text-3xl font-bold text-[#ff7e70] mb-2">
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
              className="border-2 border-[#211f1e]/20 rounded-xl p-4 text-base bg-white text-[#211f1e]"
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#9BA1A6"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="mb-4">
            <Text className="text-[#211f1e] font-semibold mb-2">Contraseña</Text>
            <PasswordInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
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
            />
          </View>

          <TouchableOpacity
            className="bg-[#007275] py-4 rounded-xl shadow-md mb-4"
            onPress={handleRegister}
            disabled={loading}
          >
            <Text className="text-white text-center font-bold text-lg">
              Registrarse
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4">
            <Text className="text-[#211f1e]">¿Ya tienes cuenta? </Text>
            <Link href="/" className="text-[#ff7e70] font-bold">
              Inicia sesión
            </Link>
          </View>
        </>
      )}
      <Toast />
      </View>
    </KeyboardAvoidingView>
  );
}
