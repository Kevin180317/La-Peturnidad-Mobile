import { dashboardService } from "@/services/dashboard.service";
import { supabase } from "@/utils/supabase";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Campos requeridos",
        text2: "Email y contraseña son obligatorios",
        visibilityTime: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Autenticar usuario
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        Toast.show({
          type: "error",
          text1: "Error de autenticación",
          text2: error.message,
          visibilityTime: 3000,
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log("✅ Usuario autenticado:", data.user.id);
        console.log("📧 Email:", data.user.email);

        // 2. Buscar perfil por user_id (más directo)
        const profileResult = await dashboardService.getProfileByUserId(
          data.user.id,
        );

        if (profileResult.success && profileResult.data) {
          // ✅ Tiene perfil completo, vamos al dashboard
          console.log("✅ Perfil encontrado:", profileResult.data);

          Toast.show({
            type: "success",
            text1: "¡Bienvenido!",
            text2: `Hola ${profileResult.data.first_name}`,
            visibilityTime: 2000,
            onHide: () => {
              router.replace({
                pathname: "/dashboard",
                params: {
                  email: data.user?.email,
                  userId: data.user?.id,
                },
              });
            },
          });
        } else {
          // ❌ No tiene perfil, va a registro extendido
          console.log(
            "⚠️ No se encontró perfil, redirigiendo a registro extendido",
          );

          Toast.show({
            type: "info",
            text1: "Completa tu perfil",
            text2: "Necesitamos algunos datos adicionales",
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
      }
    } catch (error: any) {
      console.error("❌ Error en login:", error);
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
          <Text className="mt-4 text-gray-600 font-medium">
            Iniciando sesión...
          </Text>
        </View>
      ) : (
        <>
          <View className="mb-8">
            <Text className="text-3xl font-bold text-[#ff7e70] mb-2">
              La Peturnidad
            </Text>
            <Text className="text-[#211f1e] text-lg">
              Inicia sesión para continuar
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-[#211f1e] font-semibold mb-2">
              Correo electrónico
            </Text>
            <TextInput
              className="border-2 border-[#211f1e]/20 rounded-xl p-4 text-base bg-[#faf5e0]"
              placeholder="ejemplo@correo.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View className="mb-8">
            <Text className="text-[#211f1e] font-semibold mb-2">
              Contraseña
            </Text>
            <TextInput
              className="border-2 border-[#211f1e]/20 rounded-xl p-4 text-base bg-[#faf5e0]"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            className="bg-[#ff7e70] py-4 rounded-xl shadow-md mb-4"
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-white text-center font-bold text-lg">
              Iniciar sesión
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4">
            <Text className="text-[#211f1e]">¿No tienes cuenta? </Text>
            <Link href="/register" className="text-[#ff7e70] font-bold">
              Regístrate
            </Link>
          </View>
        </>
      )}
      <Toast />
    </View>
  );
}
