import { authErrorMessage } from "@/services/auth.service";
import { dashboardService } from "@/services/dashboard.service";
import { supabase } from "@/utils/supabase";
import { PasswordInput } from "@/components/PasswordInput";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const router = useRouter();

  const goToDashboard = () => {
    // Sin historial de auth debajo: "atrás" en Android no debe volver a login/registro
    if (router.canDismiss()) router.dismissAll();
    router.replace("/dashboard");
  };

  const showProfileLoadError = () => {
    Toast.show({
      type: "error",
      text1: "No pudimos cargar tu perfil",
      text2: "Revisa tu conexión e intenta de nuevo",
      visibilityTime: 3000,
    });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Campos requeridos",
        text2: "Correo electrónico y contraseña son obligatorios",
        visibilityTime: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        if (error.code === "email_not_confirmed") {
          router.replace({
            pathname: "/email-confirmacion",
            params: { email: email.trim() },
          });
          return;
        }
        Toast.show({
          type: "error",
          text1: "Error de autenticación",
          text2: authErrorMessage(error),
          visibilityTime: 3000,
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        const profileResult = await dashboardService.getProfileByUserId(
          data.user.id,
        );

        if (!profileResult.success) {
          showProfileLoadError();
          setLoading(false);
        } else if (profileResult.data) {
          Toast.show({
            type: "success",
            text1: "¡Bienvenido!",
            text2: `Hola ${profileResult.data.first_name}`,
            visibilityTime: 2000,
            onHide: goToDashboard,
          });
        } else {
          const userEmail = data.user.email ?? "";
          Toast.show({
            type: "info",
            text1: "Completa tu perfil",
            text2: "Necesitamos algunos datos adicionales",
            visibilityTime: 2000,
            onHide: () => {
              router.replace({
                pathname: "/register-extended",
                params: { email: userEmail },
              });
            },
          });
        }
      }
    } catch (error) {
      if (__DEV__) console.error("Error en login:", error);
      Toast.show({
        type: "error",
        text1: "Error inesperado",
        text2: "Intenta de nuevo más tarde",
        visibilityTime: 3000,
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;
        if (!sessionUser) return;

        if (!sessionUser.email_confirmed_at) {
          router.replace({
            pathname: "/email-confirmacion",
            params: { email: sessionUser.email ?? "" },
          });
          return;
        }

        const profileResult = await dashboardService.getProfileByUserId(
          sessionUser.id,
        );
        if (!profileResult.success) {
          showProfileLoadError();
        } else if (profileResult.data) {
          goToDashboard();
        } else {
          router.replace({
            pathname: "/register-extended",
            params: { email: sessionUser.email ?? "" },
          });
        }
      } catch (error) {
        if (__DEV__) console.error("Error verificando sesión:", error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar; goToDashboard/showProfileLoadError son estables en la práctica
  }, [router]);

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
            Iniciando sesión...
          </Text>
        </View>
      ) : (
        <>
          <View className="mb-8">
            <Text className="text-3xl font-bold text-[#211f1e] mb-2">
              Lucky Tracker
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
              className={`${emailFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border-2 border-[#211f1e]/20"} rounded-lg p-4 text-base bg-white text-[#211f1e]`}
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#9BA1A6"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              accessibilityLabel="Correo electrónico"
              editable={!loading}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          <View className="mb-8">
            <Text className="text-[#211f1e] font-semibold mb-2">
              Contraseña
            </Text>
            <PasswordInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              autoComplete="current-password"
              accessibilityLabel="Contraseña"
            />
          </View>

          <TouchableOpacity
            className="bg-[#007275] py-4 rounded-xl mb-4"
            onPress={handleLogin}
            disabled={loading}
            testID="login-submit"
            accessibilityRole="button"
          >
            <Text className="text-white text-center font-bold text-lg">
              Iniciar sesión
            </Text>
          </TouchableOpacity>

          <Link
            href="/forgot-password"
            className="text-[#007275] font-semibold text-center mb-4"
          >
            ¿Olvidaste tu contraseña?
          </Link>

          <View className="flex-row justify-center mt-4">
            <Text className="text-[#211f1e]">¿No tienes cuenta? </Text>
            <Link href="/register" className="text-[#007275] font-bold">
              Regístrate
            </Link>
          </View>
        </>
      )}
      </View>
    </KeyboardAvoidingView>
  );
}
