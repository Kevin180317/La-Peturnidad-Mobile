// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Iniciar Sesión" }} />
      <Stack.Screen name="register" options={{ title: "Registro" }} />
      <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Stack.Screen
        name="register-extended"
        options={{ title: "Registro de usuario" }}
      />
    </Stack>
  );
}
