// app/_layout.tsx
import { Stack } from "expo-router";
import "./global.css";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Iniciar Sesión" }} />
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
    </Stack>
  );
}
