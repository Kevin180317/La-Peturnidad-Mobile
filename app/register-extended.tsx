import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import colonias from "../assets/colonias.json";

const API_URL = "http://192.168.100.8:3000/api/register-extended";

export default function RegisterExtendedScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [filteredColonias, setFilteredColonias] = useState<typeof colonias>([]);
  const [selectedColonia, setSelectedColonia] = useState<string>("");
  const [city, setCity] = useState<string>("Tijuana");
  const [loading, setLoading] = useState<boolean>(false);

  const handlePostalCodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 5); // Limitar a 5 dígitos
    setPostalCode(cleaned);

    if (cleaned.length === 5) {
      const filtered = colonias.filter(
        (item) => String(item["Código Postal"]) === cleaned
      );
      setFilteredColonias(filtered);
      setSelectedColonia("");
    } else {
      setFilteredColonias([]);
      setSelectedColonia("");
    }
  };

  const handleCompleteProfile = async () => {
    if (!firstName || !lastName || !phone || !postalCode || !selectedColonia) {
      Toast.show({
        type: "error",
        text1: "Campos requeridos",
        text2: "Completa los campos obligatorios incluyendo colonia.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          phone,
          birthDate,
          postalCode,
          address: selectedColonia, // Guardamos la colonia en el campo "address"
          city,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Perfil completado",
          text2: "Información guardada exitosamente",
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
          text2: data.error || "No se pudo guardar la información",
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

  const handleSkip = () => {
    Alert.alert(
      "Omitir paso",
      "¿Estás seguro de que quieres omitir este paso? Puedes completar tu perfil más tarde.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Omitir",
          onPress: () => router.push("/"),
        },
      ]
    );
  };

  const formatDateInput = (text: string): string => {
    const cleaned = text.replace(/\D/g, "").slice(0, 8); // Limitar a 8 dígitos
    let formatted = cleaned;

    if (cleaned.length >= 3 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else if (cleaned.length >= 5) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
    }

    return formatted;
  };

  return (
    <ScrollView style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ff592c" />
          <Text style={{ marginTop: 10 }}>Guardando información...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>Completa tu perfil</Text>
          <Text style={styles.subtitle}>Registrado con: {email}</Text>

          <View style={styles.formContainer}>
            <TextInput
              placeholder="Nombre *"
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
              autoCapitalize="words"
            />

            <TextInput
              placeholder="Apellido *"
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
              autoCapitalize="words"
            />

            <TextInput
              placeholder="Teléfono *"
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              keyboardType="phone-pad"
            />

            <TextInput
              placeholder="Fecha de nacimiento (DD/MM/YYYY)"
              value={birthDate}
              onChangeText={(text) => setBirthDate(formatDateInput(text))}
              style={styles.input}
              keyboardType="numeric"
            />

            <TextInput
              placeholder="Código Postal"
              value={postalCode}
              onChangeText={handlePostalCodeChange}
              style={styles.input}
              keyboardType="numeric"
            />

            {filteredColonias.length > 0 && (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedColonia}
                  onValueChange={(itemValue) => setSelectedColonia(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecciona una colonia" value="" />
                  {filteredColonias.map((item, idx) => (
                    <Picker.Item
                      key={idx}
                      label={item["Asentamiento"]}
                      value={item["Asentamiento"]}
                    />
                  ))}
                </Picker>
              </View>
            )}

            <TextInput
              value={city}
              editable={false}
              style={[
                styles.input,
                { backgroundColor: "#f2f2f2", color: "#888" },
              ]}
            />

            <View style={styles.buttonContainer}>
              <Button
                title="Completar perfil"
                onPress={handleCompleteProfile}
                color="#ff592c"
              />
              <View style={styles.skipButton}>
                <Button
                  title="Omitir por ahora"
                  onPress={handleSkip}
                  color="#999"
                />
              </View>
            </View>
          </View>
        </>
      )}

      <Toast position="bottom" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 60,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  formContainer: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 15,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  buttonContainer: {
    marginTop: 20,
  },
  skipButton: {
    marginTop: 10,
  },
});
