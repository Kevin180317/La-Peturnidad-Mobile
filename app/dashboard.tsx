import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email ?? "Usuario";

  const [selectedImage, setSelectedImage] = useState<{ uri: string } | null>(
    null
  );
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const handleLogout = () => {
    router.replace("/");
  };

  const selectImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permisos necesarios",
          "Necesitas dar permisos para acceder a la galería"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Primero selecciona una imagen");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        const imageResponse = await fetch(selectedImage.uri);
        const blob = await imageResponse.blob();
        formData.append("image", blob, "image.jpg");
      } else {
        formData.append("image", {
          uri: selectedImage.uri,
          type: "image/jpeg",
          name: "image.jpg",
        } as any);
      }

      const response = await fetch(
        "http://192.168.100.8:3000/api/upload-image",
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUploadedImageUrl(data.imageUrl);
        Alert.alert("¡Éxito!", "Imagen subida correctamente");
        setSelectedImage(null);
      } else {
        Alert.alert("Error", data.error || "Error al subir imagen");
      }
    } catch (error) {
      console.error("Error al subir imagen:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `http://192.168.100.8:3000/api/user-profile?email=${email}`
        );
        const data = await response.json();

        if (response.ok) {
          setProfile(data);
        } else {
          Alert.alert("Error", data.error || "No se pudo cargar el perfil");
        }
      } catch (error) {
        console.error("Error al obtener perfil:", error);
        Alert.alert("Error", "No se pudo conectar al servidor");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [email]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bienvenido al Dashboard 🐾</Text>
      <Text style={styles.userEmail}>Usuario: {email}</Text>

      {loadingProfile ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : profile ? (
        <View style={styles.profileBox}>
          <Text style={styles.info}>ID: {profile.id}</Text>
          <Text style={styles.info}>
            Nombre: {profile.first_name} {profile.last_name}
          </Text>
          <Text style={styles.info}>Teléfono: {profile.phone}</Text>
          <Text style={styles.info}>
            Fecha de nacimiento: {formatDate(profile.birth_date)}
          </Text>
          <Text style={styles.info}>Dirección: {profile.address}</Text>
          <Text style={styles.info}>Código Postal: {profile.postal_code}</Text>
          <Text style={styles.info}>Ciudad: {profile.city}</Text>
          <Text style={styles.info}>
            Creado: {formatDate(profile.created_at)}
          </Text>
        </View>
      ) : (
        <Text>No se encontró perfil.</Text>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Seleccionar Imagen" onPress={selectImage} />
        {selectedImage && (
          <Button
            title={isUploading ? "Subiendo..." : "Subir Imagen"}
            onPress={uploadImage}
            disabled={isUploading}
          />
        )}
      </View>

      {selectedImage && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>Imagen seleccionada:</Text>
          <Image source={{ uri: selectedImage.uri }} style={styles.image} />
        </View>
      )}

      {uploadedImageUrl && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>Imagen subida:</Text>
          <Image source={{ uri: uploadedImageUrl }} style={styles.image} />
        </View>
      )}

      <Button title="Cerrar sesión" onPress={handleLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 20,
  },
  profileBox: {
    width: "100%",
    padding: 15,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    marginBottom: 20,
  },
  info: {
    fontSize: 15,
    marginBottom: 5,
  },
  buttonContainer: {
    marginBottom: 20,
    width: "100%",
    gap: 10,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
});
