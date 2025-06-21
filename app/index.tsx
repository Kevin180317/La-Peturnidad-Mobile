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
    text2?: string,
    onComplete?: () => void
  ) => {
    Toast.show({
      type,
      text1,
      text2,
      visibilityTime: 2000,
      onHide: () => {
        setLoading(false);
        if (onComplete) onComplete();
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
        const { is_complete } = data;

        showToast("success", "Login exitoso", data.message || "", () => {
          if (is_complete === 1) {
            router.push({
              pathname: "/dashboard",
              params: { email },
            });
          } else {
            router.push({
              pathname: "/register-extended",
              params: { email },
            });
          }
        });
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
          <ActivityIndicator size="large" color="#ff592c" />
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
            color="#ff592c"
          />

          <Text style={styles.registerText} selectionColor="#ff592c">
            ¿No tienes cuenta?{" "}
            <Link href="/register" style={styles.registerButton}>
              Regístrate
            </Link>
          </Text>
        </>
      )}
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
  registerText: { marginTop: 20, textAlign: "center", color: "black" },
  registerButton: { color: "#ff592c", fontWeight: "bold" },
});
