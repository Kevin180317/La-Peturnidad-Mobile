import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack, router } from "expo-router";
import Toast from "react-native-toast-message";
import { toastConfig } from "../components/ToastConfig";
import "./global.css";

export default function RootLayout() {
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
            sound: "default",
            vibrationPattern: [0, 300, 100, 300],
          });
        }

        const lastResponse =
          await Notifications.getLastNotificationResponseAsync();
        if (lastResponse) {
          const url = lastResponse.notification.request.content.data?.url;
          if (typeof url === "string") {
            setTimeout(() => router.push(url), 500);
          }
        }

        responseListener =
          Notifications.addNotificationResponseReceivedListener(
            (response: any) => {
              const url = response.notification.request.content.data?.url;
              if (typeof url === "string") {
                router.push(url);
              }
            },
          );
      } catch {
        // Notifications not available (web, etc.)
      }
    })();

    return () => {
      responseListener?.remove();
    };
  }, []);

  return (
    <>
      <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Iniciar Sesión" }} />
      <Stack.Screen name="register" options={{ title: "Registro" }} />
      <Stack.Screen
        name="dashboard"
        options={{
          title: "La Peturnidad",
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
        options={{ title: "Confirmar email" }}
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
        name="grupos"
        options={{ title: "Grupos" }}
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
    </Stack>
      <Toast config={toastConfig} />
    </>
  );
}
