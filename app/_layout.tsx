import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack, router, type Href } from "expo-router";
import Toast from "react-native-toast-message";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { toastConfig } from "../components/ToastConfig";
import { supabase } from "../utils/supabase";
import "./global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

// --- Deep link de notificaciones (arranque en frío) ---
// _layout registra la URL de la notificación que abrió la app; index la consume una sola vez
// después de confirmar sesión + perfil, para evitar la carrera con su propia redirección.
const handledNotificationIds = new Set<string>();
let resolveInitialNotificationUrl: (url: string | null) => void = () => {};
let initialNotificationUrl: Promise<string | null> | null = new Promise((resolve) => {
  resolveInitialNotificationUrl = resolve;
});

function getNotificationUrl(response: {
  notification: { request: { content: { data?: Record<string, unknown> | null } } };
}): string | null {
  const url = response.notification.request.content.data?.url;
  return typeof url === "string" && url.startsWith("/") ? url : null;
}

/** Devuelve (una sola vez) la URL de la notificación que abrió la app, o null. */
export async function consumePendingNotificationUrl(): Promise<string | null> {
  const pending = initialNotificationUrl;
  initialNotificationUrl = null;
  if (!pending) return null;
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
  return Promise.race([pending, timeout]);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    let responseListener: { remove: () => void } | null = null;

    (async () => {
      try {
        const Notifications = await import("expo-notifications");

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Notificaciones",
            importance: Notifications.AndroidImportance.HIGH,
          });
          await Notifications.setNotificationChannelAsync("emergency_alerts", {
            name: "Alertas de emergencia",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 300, 100, 300],
          });
        }

        // Arranque en frío: no navegamos aquí (index decide la ruta tras validar sesión y perfil);
        // solo dejamos la URL pendiente para que index la consuma.
        const lastResponse = Notifications.getLastNotificationResponse();
        if (lastResponse) {
          handledNotificationIds.add(lastResponse.notification.request.identifier);
          resolveInitialNotificationUrl(getNotificationUrl(lastResponse));
          Notifications.clearLastNotificationResponse();
        } else {
          resolveInitialNotificationUrl(null);
        }

        // App abierta o en segundo plano: navegar (sin apilar duplicados) una sola vez por notificación
        responseListener =
          Notifications.addNotificationResponseReceivedListener((response) => {
            const id = response.notification.request.identifier;
            if (handledNotificationIds.has(id)) return;
            handledNotificationIds.add(id);
            const url = getNotificationUrl(response);
            if (url) {
              router.navigate(url as Href);
            }
            Notifications.clearLastNotificationResponse();
          });
      } catch {
        // Notifications not available (web, etc.)
        resolveInitialNotificationUrl(null);
      }
    })();

    return () => {
      responseListener?.remove();
    };
  }, []);

  // Sesión expirada o cerrada (también desde otro flujo): volver a login sin historial
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        if (router.canDismiss()) router.dismissAll();
        router.replace("/login");
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <ErrorBoundary>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#007275" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Iniciar Sesión" }} />
      <Stack.Screen name="register" options={{ title: "Registro" }} />
      <Stack.Screen
        name="dashboard"
        options={{
          title: "Lucky Tracker",
          headerLeft: () => null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="register-extended"
        options={{ title: "Registro de usuario" }}
      />
      <Stack.Screen
        name="email-confirmacion"
        options={{ title: "Confirmar correo electrónico" }}
      />
      <Stack.Screen
        name="notificaciones"
        options={{ title: "Notificaciones" }}
      />
      <Stack.Screen
        name="comunidad"
        options={{ title: "Comunidad" }}
      />
      <Stack.Screen
        name="mensajes"
        options={{ title: "Mensajes" }}
      />
      <Stack.Screen
        name="mensajes/[id]"
        options={{ title: "Chat" }}
      />
      <Stack.Screen
        name="perfil/[id]"
        options={{ title: "Perfil" }}
      />
      <Stack.Screen
        name="seguidores"
        options={{ title: "Seguidores" }}
      />
      <Stack.Screen
        name="editar-perfil"
        options={{ title: "Editar perfil" }}
      />
      <Stack.Screen
        name="bandeja"
        options={{ title: "Notificaciones" }}
      />
      <Stack.Screen
        name="seguridad"
        options={{ title: "Cuenta y seguridad" }}
      />
      <Stack.Screen
        name="grupos"
        options={{ title: "Grupos" }}
      />
      <Stack.Screen
        name="buscar"
        options={{ title: "Buscar" }}
      />
      <Stack.Screen
        name="grupos/[id]"
        options={{ title: "Grupo" }}
      />
      <Stack.Screen
        name="historias"
        options={{ title: "Reuniones exitosas" }}
      />
      <Stack.Screen
        name="panel-moderacion"
        options={{ title: "Moderación" }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{ title: "Recuperar contraseña" }}
      />
      <Stack.Screen
        name="verify-otp"
        options={{ title: "Verificar código" }}
      />
      <Stack.Screen
        name="reset-password"
        options={{ title: "Nueva contraseña" }}
      />
      <Stack.Screen
        name="como-usar"
        options={{ title: "Cómo usar" }}
      />
      <Stack.Screen
        name="faq"
        options={{ title: "Preguntas frecuentes" }}
      />
      </Stack>
      </ErrorBoundary>
      <Toast config={toastConfig} />
    </>
  );
}
