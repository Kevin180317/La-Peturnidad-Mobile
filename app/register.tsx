import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const API_URL = "http://192.168.100.8:3000/api/register";

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Campos requeridos",
        text2: "Email y contraseña son obligatorios",
      });
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
        Toast.show({
          type: "success",
          text1: "Registro exitoso",
          text2: data.message || "Usuario creado",
          visibilityTime: 2000,
          autoHide: true,
          onHide: () => {
            setLoading(false);
            router.push("/");
          },
        });
      } else {
        setLoading(false);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: data.error || "No se pudo registrar",
        });
      }
    } catch (error) {
      setLoading(false);
      console.error("Error de red:", error);
      Toast.show({
        type: "error",
        text1: "Error de red",
        text2: "No se pudo conectar al servidor",
      });
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 10 }}>Procesando registro...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>Registro</Text>

          <TextInput
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />

          <Button title="Registrarse" onPress={handleRegister} />
        </>
      )}

      <Toast position="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  loaderContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
});
