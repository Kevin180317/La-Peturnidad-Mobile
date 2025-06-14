import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  Platform,
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

  const handleLogout = () => {
    router.replace("/");
  };

  const selectImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
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
        // En web: convertimos URI a blob
        const imageResponse = await fetch(selectedImage.uri);
        const blob = await imageResponse.blob();
        formData.append("image", blob, "image.jpg");
      } else {
        // En móvil: usamos objeto con uri, type y name
        formData.append("image", {
          uri: selectedImage.uri,
          type: "image/jpeg", // puedes obtener el tipo real si quieres
          name: "image.jpg",
        } as any);
      }

      const uploadResponse = await fetch(
        "http://192.168.100.8:3000/api/upload-image",
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
            // No establezcas Content-Type, que fetch lo haga
          },
        }
      );

      const data = await uploadResponse.json();

      if (uploadResponse.ok) {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido al Dashboard 🐾</Text>
      <Text style={styles.userEmail}>Usuario: {email}</Text>

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

      {isUploading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Subiendo imagen...</Text>
        </View>
      )}

      {uploadedImageUrl && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>Imagen subida a Cloudinary:</Text>
          <Image source={{ uri: uploadedImageUrl }} style={styles.image} />
        </View>
      )}

      <Button title="Cerrar sesión" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },
  userEmail: {
    fontSize: 18,
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 20,
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
  loadingContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
});
