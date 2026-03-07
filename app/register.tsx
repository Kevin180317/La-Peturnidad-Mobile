import { supabase } from "@/utils/supabase";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
          text2: "Completa tu perfil para continuar",
          visibilityTime: 2000,
          onHide: () => {
            router.replace({
              pathname: "/register-extended",
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
    <View className="flex-1 justify-center p-6 bg-white">
      {loading ? (
        <View className="items-center">
          <ActivityIndicator size="large" color="#ff592c" />
          <Text className="mt-4 text-gray-600 font-medium">
            Procesando registro...
          </Text>
        </View>
      ) : (
        <>
          <View className="mb-8">
            <Text className="text-3xl font-bold text-red-800 mb-2">
              Crear Cuenta
            </Text>
            <Text className="text-gray-600 text-lg">
              Regístrate para comenzar
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              Correo electrónico
            </Text>
            <TextInput
              className="border-2 border-gray-300 rounded-xl p-4 text-base bg-gray-50"
              placeholder="ejemplo@correo.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">Contraseña</Text>
            <TextInput
              className="border-2 border-gray-300 rounded-xl p-4 text-base bg-gray-50"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View className="mb-8">
            <Text className="text-gray-700 font-semibold mb-2">
              Confirmar contraseña
            </Text>
            <TextInput
              className="border-2 border-gray-300 rounded-xl p-4 text-base bg-gray-50"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className="bg-red-600 py-4 rounded-xl shadow-md mb-4"
            onPress={handleRegister}
            disabled={loading}
          >
            <Text className="text-white text-center font-bold text-lg">
              Registrarse
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-600">¿Ya tienes cuenta? </Text>
            <Link href="/" className="text-red-800 font-bold">
              Inicia sesión
            </Link>
          </View>
        </>
      )}
      <Toast />
    </View>
  );
}
