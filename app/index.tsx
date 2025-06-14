import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const API_URL = "http://192.168.100.8:3000/api/login";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const showToast = (
    type: "success" | "error",
    text1: string,
    text2?: string
  ) => {
    Toast.show({
      type,
      text1,
      text2,
      visibilityTime: 2000,
      onHide: () => {
        if (type === "success") {
          router.push({
            pathname: "/dashboard",
            params: { email },
          });
          setLoading(false);
        } else {
          setLoading(false);
        }
      },
    });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast(
        "error",
        "Campos requeridos",
        "Email y contraseña son obligatorios"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("success", "Login exitoso", data.message || "");
      } else {
        showToast("error", "Error", data.error || "Credenciales incorrectas");
      }
    } catch (error) {
      setLoading(false);
      showToast("error", "Error de red", "Intenta de nuevo más tarde");
      console.error("Error de red:", error);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={{ marginTop: 10 }}>Cargando...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>Iniciar Sesión</Text>

          <TextInput
            placeholder="Correo electrónico"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            placeholder="Contraseña"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            editable={!loading}
          />

          <Button
            title="Iniciar sesión"
            onPress={handleLogin}
            disabled={loading}
          />

          <Text style={styles.registerText}>
            ¿No tienes cuenta?{" "}
            <Link href="/register" style={styles.registerLink}>
              Regístrate
            </Link>
          </Text>
        </>
      )}

      {/* Importante: agregar el Toast en el root del componente */}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: "center" },
  loaderContainer: { alignItems: "center" },
  title: { fontSize: 24, marginBottom: 20, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  registerText: { marginTop: 20, textAlign: "center" },
  registerLink: { color: "blue" },
});
