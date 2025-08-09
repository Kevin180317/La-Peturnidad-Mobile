import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

type TabType = "home" | "profile" | "emergency";

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email ?? "Usuario";

  const showToast = (
    type: "success" | "error" | "info",
    text1: string,
    text2?: string
  ) => {
    Toast.show({
      type,
      text1,
      text2,
      position: "top",
      visibilityTime: 3000,
    });
  };

  const [activeTab, setActiveTab] = useState<TabType>("home");

  // Estados para foto de perfil
  const [selectedImage, setSelectedImage] = useState<{ uri: string } | null>(
    null
  );
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Estados para foto de mascota
  const [selectedPetImage, setSelectedPetImage] = useState<{
    uri: string;
  } | null>(null);
  const [isUploadingPetImage, setIsUploadingPetImage] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [petType, setPetType] = useState<"perro" | "gato">("perro");
  const [petName, setPetName] = useState("");
  const [petColor, setPetColor] = useState("");
  const [petSize, setPetSize] = useState("");
  const [petFeatures, setPetFeatures] = useState("");
  const [petPhotoUrl, setPetPhotoUrl] = useState<string | null>(null);
  const [showPets, setShowPets] = useState(false);
  const [pets, setPets] = useState<any[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [selectingPet, setSelectingPet] = useState(false);
  const [selectedLostPet, setSelectedLostPet] = useState<any>(null);
  const [showLostPets, setShowLostPets] = useState(false);
  const [lostPets, setLostPets] = useState<any[]>([]);
  const [loadingLostPets, setLoadingLostPets] = useState(false);
  const [showRecoveredSection, setShowRecoveredSection] = useState(false);
  const [foundPets, setFoundPets] = useState<any[]>([]);
  const [showFoundPets, setShowFoundPets] = useState(false);
  const handleLogout = () => {
    router.replace("/");
  };

  // Función para seleccionar imagen de perfil
  const selectImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        showToast(
          "error",
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
      showToast("error", "Error", "No se pudo seleccionar la imagen");
    }
  };

  // Función para seleccionar imagen de mascota
  const selectPetImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        showToast(
          "error",
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
        setSelectedPetImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error al seleccionar imagen de mascota:", error);
      showToast("error", "Error", "No se pudo seleccionar la imagen");
    }
  };

  // Función para subir imagen de perfil
  const uploadImage = async () => {
    if (!selectedImage) {
      showToast("error", "Error", "Primero selecciona una imagen");
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
        setSelectedImage(null);

        // Guardar imagen en base de datos
        await fetch("http://192.168.100.8:3000/api/user-profile-picture", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            imageUrl: data.imageUrl,
          }),
        });

        showToast("success", "Éxito", "Imagen subida y guardada correctamente");
        fetchProfile();
      } else {
        showToast("error", "Error", data.error || "Error al subir imagen");
      }
    } catch (error) {
      console.error("Error al subir imagen:", error);
      showToast("error", "Error", "No se pudo conectar con el servidor");
    } finally {
      setIsUploading(false);
    }
  };

  // Función para subir imagen de mascota
  const uploadPetImage = async () => {
    if (!selectedPetImage) {
      showToast(
        "error",
        "Error",
        "Primero selecciona una imagen para la mascota"
      );
      return;
    }

    setIsUploadingPetImage(true);

    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        const imageResponse = await fetch(selectedPetImage.uri);
        const blob = await imageResponse.blob();
        formData.append("image", blob, "pet-image.jpg");
      } else {
        formData.append("image", {
          uri: selectedPetImage.uri,
          type: "image/jpeg",
          name: "pet-image.jpg",
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
        setPetPhotoUrl(data.imageUrl);
        setSelectedPetImage(null);
        showToast("success", "Éxito", "Imagen de mascota subida correctamente");
      } else {
        showToast("error", "Error", data.error || "Error al subir imagen");
      }
    } catch (error) {
      console.error("Error al subir imagen de mascota:", error);
      showToast("error", "Error", "No se pudo conectar con el servidor");
    } finally {
      setIsUploadingPetImage(false);
    }
  };

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const response = await fetch(
        `http://192.168.100.8:3000/api/user-profile?email=${email}`
      );
      const data = await response.json();

      if (response.ok) {
        setProfile(data);
      } else {
        showToast(
          "error",
          "Error",
          data.error || "No se pudo cargar el perfil"
        );
      }
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      showToast("error", "Error", "No se pudo conectar al servidor");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [email]);

  useEffect(() => {
    if (!email) return;
    const registerPushToken = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;

      const token = (await Notifications.getExpoPushTokenAsync()).data;

      await fetch("http://192.168.100.8:3000/api/save-push-token", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, push_token: token }),
      });
    };

    registerPushToken();
  }, [email]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const handlePetRegister = async () => {
    if (!petName || !petColor || !petSize) {
      showToast("error", "Error", "Completa todos los campos obligatorios");
      return;
    }

    if (!petPhotoUrl) {
      showToast("error", "Error", "Debes subir una foto de la mascota");
      return;
    }

    try {
      const response = await fetch("http://192.168.100.8:3000/api/pet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          type: petType,
          name: petName,
          color: petColor,
          size: petSize,
          features: petFeatures,
          photoUrl: petPhotoUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(
          "success",
          "Mascota registrada",
          "¡Tu mascota ha sido guardada!"
        );
        // Limpia el formulario
        setPetName("");
        setPetColor("");
        setPetSize("");
        setPetFeatures("");
        setPetPhotoUrl(null);
        setPetType("perro");
      } else {
        showToast(
          "error",
          "Error",
          data.error || "No se pudo registrar la mascota"
        );
      }
    } catch (error) {
      showToast("error", "Error", "No se pudo conectar con el servidor");
    }
  };

  const fetchPets = async () => {
    setLoadingPets(true);
    try {
      const response = await fetch(
        `http://192.168.100.8:3000/api/pets?email=${email}`
      );
      const data = await response.json();
      if (response.ok) {
        setPets(data);
      } else {
        showToast(
          "error",
          "Error",
          data.error || "No se pudieron cargar las mascotas"
        );
      }
    } catch (error) {
      showToast("error", "Error", "No se pudo conectar con el servidor");
    } finally {
      setLoadingPets(false);
    }
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "home" && styles.activeTab]}
        onPress={() => setActiveTab("home")}
      >
        <Text
          style={[styles.tabText, activeTab === "home" && styles.activeTabText]}
        >
          🏠 Home
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "profile" && styles.activeTab]}
        onPress={() => setActiveTab("profile")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "profile" && styles.activeTabText,
          ]}
        >
          👤 Profile
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "emergency" && styles.activeTab]}
        onPress={() => setActiveTab("emergency")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "profile" && styles.activeTabText,
          ]}
        >
          🚨 Emergency
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHomeTab = () => (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 40,
        backgroundColor: "#f8f9fa",
      }}
    >
      <View
        style={{
          marginBottom: 30,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#1a1a1a",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Bienvenido al Dashboard 🐾
        </Text>
        {/* <Text style={styles.userEmail}>Usuario: {email}</Text> */}
      </View>

      <View style={{ marginBottom: 25 }}>
        <TouchableOpacity
          style={{
            backgroundColor: "#007AFF",
            paddingVertical: 15,
            paddingHorizontal: 25,
            borderRadius: 12,
            elevation: 3,
            shadowColor: "#007AFF",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          }}
          onPress={() => {
            if (!showPets) fetchPets();
            setShowPets((prev) => !prev);
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {showPets ? "➕ Crear mascota" : "👁️ Ver mascotas"}
          </Text>
        </TouchableOpacity>
      </View>

      {showPets ? (
        <View style={{ flex: 1 }}>
          {loadingPets ? (
            <View
              style={{
                alignItems: "center",
                marginTop: 60,
                marginBottom: 40,
              }}
            >
              <ActivityIndicator size="large" color="#007AFF" />
              <Text
                style={{
                  marginTop: 15,
                  fontSize: 16,
                  color: "#666",
                }}
              >
                Cargando mascotas...
              </Text>
            </View>
          ) : pets.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                marginTop: 60,
                marginBottom: 40,
                paddingHorizontal: 20,
              }}
            >
              <Text style={{ fontSize: 60, marginBottom: 20 }}>🐕‍🦺</Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Sin mascotas registradas
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "#666",
                  textAlign: "center",
                  lineHeight: 22,
                }}
              >
                Registra tu primera mascota para comenzar
              </Text>
            </View>
          ) : (
            <View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#1a1a1a",
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                Mis Mascotas ({pets.length})
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  gap: 15,
                }}
              >
                {pets.map((pet, idx) => (
                  <View
                    key={pet.id || idx}
                    style={{
                      backgroundColor: "white",
                      borderRadius: 16,
                      padding: 15,
                      width: "48%",
                      elevation: 4,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      borderWidth: 1,
                      borderColor: "#f0f0f0",
                      marginBottom: 15,
                    }}
                  >
                    <View
                      style={{
                        alignItems: "center",
                        marginBottom: 15,
                        backgroundColor: "#f8fafe",
                        borderRadius: 12,
                        padding: 12,
                        marginHorizontal: -5,
                        marginTop: -5,
                      }}
                    >
                      {pet.image_url ? (
                        <View
                          style={{
                            position: "relative",
                            marginBottom: 10,
                          }}
                        >
                          <Image
                            source={{ uri: pet.image_url }}
                            style={{
                              width: 150,
                              height: 150,
                              borderRadius: 35,
                              backgroundColor: "#f8f8f8",
                              borderWidth: 3,
                              borderColor: "#007AFF",
                            }}
                          />
                          <View
                            style={{
                              position: "absolute",
                              bottom: -2,
                              right: -2,
                              backgroundColor:
                                pet.type === "perro" ? "#4CAF50" : "#FF9800",
                              borderRadius: 12,
                              width: 24,
                              height: 24,
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 2,
                              borderColor: "white",
                            }}
                          >
                            <Text style={{ fontSize: 12 }}>
                              {pet.type === "perro" ? "🐶" : "🐱"}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View
                          style={{
                            position: "relative",
                            marginBottom: 10,
                          }}
                        >
                          <View
                            style={{
                              width: 70,
                              height: 70,
                              borderRadius: 35,
                              backgroundColor:
                                pet.type === "perro" ? "#e3f2fd" : "#fff3e0",
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 3,
                              borderColor:
                                pet.type === "perro" ? "#4CAF50" : "#FF9800",
                            }}
                          >
                            <Text style={{ fontSize: 32 }}>
                              {pet.type === "perro" ? "🐶" : "🐱"}
                            </Text>
                          </View>
                          <View
                            style={{
                              position: "absolute",
                              bottom: -2,
                              right: -2,
                              backgroundColor: "#007AFF",
                              borderRadius: 8,
                              width: 16,
                              height: 16,
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 2,
                              borderColor: "white",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 8,
                                color: "white",
                                fontWeight: "bold",
                              }}
                            >
                              📷
                            </Text>
                          </View>
                        </View>
                      )}
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "800",
                          color: "#1a1a1a",
                          textAlign: "center",
                          marginBottom: 4,
                          letterSpacing: 0.5,
                        }}
                      >
                        {pet.name}
                      </Text>
                      <View
                        style={{
                          backgroundColor:
                            pet.type === "perro" ? "#e8f5e8" : "#fff8e1",
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 15,
                          borderWidth: 1,
                          borderColor:
                            pet.type === "perro" ? "#4CAF50" : "#FF9800",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: pet.type === "perro" ? "#2e7d32" : "#f57c00",
                            fontWeight: "600",
                            textAlign: "center",
                          }}
                        >
                          {pet.type === "perro" ? "🐶 Perro" : "🐱 Gato"}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: "#f0f0f0",
                        paddingTop: 10,
                        gap: 6,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: "#666",
                          }}
                        >
                          Color:
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#333",
                            flex: 1,
                            textAlign: "right",
                          }}
                        >
                          {pet.color}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: "#666",
                          }}
                        >
                          Tamaño:
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#333",
                            flex: 1,
                            textAlign: "right",
                          }}
                        >
                          {pet.size}
                        </Text>
                      </View>
                      {pet.features && (
                        <View style={{ marginTop: 4 }}>
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "600",
                              color: "#666",
                              marginBottom: 2,
                            }}
                          >
                            Características:
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: "#333",
                              textAlign: "center",
                              fontStyle: "italic",
                            }}
                          >
                            {pet.features}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 25,
              elevation: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              borderWidth: 1,
              borderColor: "#f0f0f0",
            }}
          >
            <View
              style={{
                alignItems: "center",
                marginBottom: 30,
                paddingBottom: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: "#1a1a1a",
                  marginBottom: 8,
                }}
              >
                Registrar Nueva Mascota
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "#666",
                  textAlign: "center",
                }}
              >
                Completa la información de tu mascota
              </Text>
            </View>

            <View style={{ marginBottom: 25 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "#FF3B30", fontSize: 16 }}>*</Text> Tipo
                de mascota
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: petType === "perro" ? "#007AFF" : "#e0e0e0",
                    backgroundColor:
                      petType === "perro" ? "#007AFF15" : "#fafafa",
                    alignItems: "center",
                  }}
                  onPress={() => setPetType("perro")}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: petType === "perro" ? "#007AFF" : "#666",
                    }}
                  >
                    🐶 Perro
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: petType === "gato" ? "#007AFF" : "#e0e0e0",
                    backgroundColor:
                      petType === "gato" ? "#007AFF15" : "#fafafa",
                    alignItems: "center",
                  }}
                  onPress={() => setPetType("gato")}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: petType === "gato" ? "#007AFF" : "#666",
                    }}
                  >
                    🐱 Gato
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginBottom: 25 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "#FF3B30", fontSize: 16 }}>*</Text> Nombre
              </Text>
              <TextInput
                style={{
                  borderWidth: 2,
                  borderColor: "#e0e0e0",
                  borderRadius: 12,
                  paddingHorizontal: 15,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: "#fafafa",
                  color: "#333",
                }}
                value={petName}
                onChangeText={setPetName}
                placeholder="Nombre de la mascota"
                placeholderTextColor="#999"
              />
            </View>

            <View style={{ marginBottom: 25 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "#FF3B30", fontSize: 16 }}>*</Text> Color
              </Text>
              <TextInput
                style={{
                  borderWidth: 2,
                  borderColor: "#e0e0e0",
                  borderRadius: 12,
                  paddingHorizontal: 15,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: "#fafafa",
                  color: "#333",
                }}
                value={petColor}
                onChangeText={setPetColor}
                placeholder="Color principal"
                placeholderTextColor="#999"
              />
            </View>

            <View style={{ marginBottom: 25 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "#FF3B30", fontSize: 16 }}>*</Text> Tamaño
              </Text>
              <TextInput
                style={{
                  borderWidth: 2,
                  borderColor: "#e0e0e0",
                  borderRadius: 12,
                  paddingHorizontal: 15,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: "#fafafa",
                  color: "#333",
                }}
                value={petSize}
                onChangeText={setPetSize}
                placeholder="Ej: pequeño, mediano, grande"
                placeholderTextColor="#999"
              />
            </View>

            <View style={{ marginBottom: 25 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                Características especiales
              </Text>
              <TextInput
                style={{
                  borderWidth: 2,
                  borderColor: "#e0e0e0",
                  borderRadius: 12,
                  paddingHorizontal: 15,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: "#fafafa",
                  color: "#333",
                  height: 80,
                  textAlignVertical: "top",
                  paddingTop: 12,
                }}
                value={petFeatures}
                onChangeText={setPetFeatures}
                placeholder="Ej: manchas, cicatrices, comportamiento especial..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={{ marginBottom: 25 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "#FF3B30", fontSize: 16 }}>*</Text> Foto
                de la mascota
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginBottom: 15,
                }}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: "#007AFF",
                    backgroundColor: "transparent",
                    gap: 8,
                  }}
                  onPress={selectPetImage}
                >
                  <Text style={{ fontSize: 18 }}>📷</Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#007AFF",
                    }}
                  >
                    Seleccionar Foto
                  </Text>
                </TouchableOpacity>

                {selectedPetImage && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: isUploadingPetImage ? "#ccc" : "#34C759",
                      backgroundColor: "transparent",
                      gap: 8,
                      opacity: isUploadingPetImage ? 0.6 : 1,
                    }}
                    onPress={uploadPetImage}
                    disabled={isUploadingPetImage}
                  >
                    <Text style={{ fontSize: 18 }}>
                      {isUploadingPetImage ? "⏳" : "☁️"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#34C759",
                      }}
                    >
                      {isUploadingPetImage ? "Subiendo..." : "Subir Foto"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {selectedPetImage && (
                <View style={{ marginTop: 15 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#666",
                      marginBottom: 10,
                    }}
                  >
                    Previsualización:
                  </Text>
                  <View style={{ alignItems: "center" }}>
                    <Image
                      source={{ uri: selectedPetImage.uri }}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 12,
                        backgroundColor: "#f8f8f8",
                        borderWidth: 2,
                        borderColor: "#e0e0e0",
                      }}
                    />
                  </View>
                </View>
              )}

              {petPhotoUrl && (
                <View style={{ marginTop: 15 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#666",
                      marginBottom: 10,
                    }}
                  >
                    ✅ Foto guardada:
                  </Text>
                  <View style={{ alignItems: "center" }}>
                    <Image
                      source={{ uri: petPhotoUrl }}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 12,
                        backgroundColor: "#f8f8f8",
                        borderWidth: 2,
                        borderColor: "#e0e0e0",
                      }}
                    />
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: "#007AFF",
                paddingVertical: 16,
                paddingHorizontal: 30,
                borderRadius: 14,
                alignItems: "center",
                marginTop: 10,
                elevation: 4,
                shadowColor: "#007AFF",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
              }}
              onPress={handlePetRegister}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                🐾 Registrar Mascota
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const handleNotifyLostPet = async (pet: any) => {
    if (!profile || !profile.address) {
      showToast("error", "Perfil incompleto", "No se encontró tu colonia.");
      return;
    }

    try {
      const response = await fetch(
        "http://192.168.100.8:3000/api/send-emergency",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            colonia: profile.address, // o profile.address si eso representa la colonia
            pet,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        showToast(
          "success",
          "Notificación enviada",
          "Se ha alertado a tus vecinos."
        );
        setSelectingPet(false);
        setSelectedLostPet(null);
      } else {
        showToast(
          "error",
          "Error",
          data.error || "No se pudo enviar la alerta."
        );
      }
    } catch (error) {
      console.error("Error al enviar notificación:", error);
      showToast("error", "Error", "No se pudo conectar al servidor.");
    }
  };

  const fetchLostPets = async () => {
    if (!profile || !profile.address) {
      showToast("error", "Perfil incompleto", "No se encontró tu colonia.");
      return;
    }
    setLoadingLostPets(true);
    try {
      const response = await fetch(
        `http://192.168.100.8:3000/api/lost-pets?colonia=${encodeURIComponent(profile.address)}`
      );
      const data = await response.json();
      if (response.ok) {
        setLostPets(data);
      } else {
        showToast(
          "error",
          "Error",
          data.error || "No se pudieron cargar las mascotas perdidas"
        );
      }
    } catch (error) {
      showToast("error", "Error", "No se pudo conectar con el servidor");
    } finally {
      setLoadingLostPets(false);
    }
  };

  const uniqueLostPets = lostPets.filter(
    (pet, index, self) =>
      index ===
      self.findIndex((p) => p.pet_name === pet.pet_name && p.type === pet.type)
  );

  const iFoundAPet = async (petId: string) => {
    console.log(petId + "" + profile.user_id);

    try {
      const response = await fetch(
        "http://192.168.100.8:3000/api/i-found-a-pet",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pet_id: petId,
            user_id: profile.user_id,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        showToast("success", "Éxito", "Se notificó al dueño");
      } else {
        showToast(
          "error",
          "Error",
          data.error || "No se pudo encontrar la mascota"
        );
      }
    } catch (error) {
      showToast("error", "Error", "No se pudo conectar con el servidor");
    }
  };

  const fetchFoundPets = async () => {
    try {
      const response = await fetch(
        "http://192.168.100.8:3000/api/found-pets/" + profile.user_id
      );
      const data = await response.json();
      console.log(data);
      if (response.ok) {
        setFoundPets(data);
      } else {
        showToast(
          "error",
          "Error",
          data.error || "No se pudieron cargar las mascotas encontradas"
        );
      }
    } catch (error) {
      showToast("error", "Error", "No se pudo conectar con el servidor");
    }
  };

  const renderProfileTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Text style={styles.title}>Mi Perfil 👤</Text>

      {loadingProfile ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      ) : profile ? (
        <>
          {/* Card de Perfil Principal */}
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 16,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 6,
              overflow: "hidden",
            }}
          >
            {/* Header del Perfil */}
            <View
              style={{
                backgroundColor:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                paddingVertical: 24,
                paddingHorizontal: 20,
                alignItems: "center",
                position: "relative",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "#667eea",
                  opacity: 0.9,
                }}
              />

              <View
                style={{
                  position: "relative",
                  zIndex: 1,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    borderWidth: 4,
                    borderColor: "#ffffff",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                    marginBottom: 16,
                  }}
                >
                  <Image
                    source={{
                      uri:
                        typeof profile.profile_picture_url === "string" &&
                        profile.profile_picture_url.trim() !== ""
                          ? profile.profile_picture_url
                          : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ168Mp9N1EPzK86wWBf_Ipl7gqELKUyhryNg&s",
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 46,
                    }}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: "#ffffff",
                    marginBottom: 4,
                    textAlign: "center",
                  }}
                >
                  {profile.first_name} {profile.last_name}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#e8eaf6",
                    textAlign: "center",
                  }}
                >
                  {email}
                </Text>
              </View>
            </View>

            {/* Información Personal */}
            <View style={{ padding: 20 }}>
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: "#2c3e50",
                    marginBottom: 16,
                    paddingBottom: 8,
                    borderBottomWidth: 2,
                    borderBottomColor: "#e3f2fd",
                  }}
                >
                  📋 Información Personal
                </Text>

                <View
                  style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#e9ecef",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <Text style={{ fontSize: 16, marginRight: 8 }}>📱</Text>
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#6c757d",
                          fontWeight: "500",
                        }}
                      >
                        Teléfono:
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#2c3e50",
                        fontWeight: "600",
                        textAlign: "right",
                        flex: 1,
                      }}
                    >
                      {profile.phone}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <Text style={{ fontSize: 16, marginRight: 8 }}>🎂</Text>
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#6c757d",
                          fontWeight: "500",
                        }}
                      >
                        Fecha de nacimiento:
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#2c3e50",
                        fontWeight: "600",
                        textAlign: "right",
                        flex: 1,
                      }}
                    >
                      {formatDate(profile.birth_date)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Dirección */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: "#2c3e50",
                    marginBottom: 16,
                    paddingBottom: 8,
                    borderBottomWidth: 2,
                    borderBottomColor: "#e8f5e8",
                  }}
                >
                  🏠 Dirección
                </Text>

                <View
                  style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#e9ecef",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <Text style={{ fontSize: 16, marginRight: 8 }}>📍</Text>
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#6c757d",
                          fontWeight: "500",
                        }}
                      >
                        Dirección:
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#2c3e50",
                        fontWeight: "600",
                        textAlign: "right",
                        flex: 2,
                      }}
                    >
                      {profile.address}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#e9ecef",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <Text style={{ fontSize: 16, marginRight: 8 }}>📮</Text>
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#6c757d",
                          fontWeight: "500",
                        }}
                      >
                        Código Postal:
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#2c3e50",
                        fontWeight: "600",
                        textAlign: "right",
                        flex: 1,
                      }}
                    >
                      {profile.postal_code}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <Text style={{ fontSize: 16, marginRight: 8 }}>🏙️</Text>
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#6c757d",
                          fontWeight: "500",
                        }}
                      >
                        Ciudad:
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#2c3e50",
                        fontWeight: "600",
                        textAlign: "right",
                        flex: 1,
                      }}
                    >
                      {profile.city}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Información de Cuenta */}
              <View style={{ marginBottom: 0 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: "#2c3e50",
                    marginBottom: 16,
                    paddingBottom: 8,
                    borderBottomWidth: 2,
                    borderBottomColor: "#fff3e0",
                  }}
                >
                  ⏰ Información de Cuenta
                </Text>

                <View
                  style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <Text style={{ fontSize: 16, marginRight: 8 }}>📅</Text>
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#6c757d",
                          fontWeight: "500",
                        }}
                      >
                        Miembro desde:
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#2c3e50",
                        fontWeight: "600",
                        textAlign: "right",
                        flex: 1,
                      }}
                    >
                      {formatDate(profile.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Card de Actualizar Foto */}
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 16,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                backgroundColor: "#f3e5f5",
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#e1bee7",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#7b1fa2",
                  textAlign: "center",
                }}
              >
                📸 Actualizar Foto de Perfil
              </Text>
            </View>

            <View style={{ padding: 20 }}>
              <View style={{ gap: 12, marginBottom: 20 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#007AFF",
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                  onPress={selectImage}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 16, marginRight: 8 }}>🖼️</Text>
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    Seleccionar Imagen
                  </Text>
                </TouchableOpacity>

                {selectedImage && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: isUploading ? "#95a5a6" : "#34C759",
                      paddingVertical: 14,
                      paddingHorizontal: 24,
                      borderRadius: 12,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                    }}
                    onPress={uploadImage}
                    disabled={isUploading}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 16, marginRight: 8 }}>
                      {isUploading ? "⏳" : "☁️"}
                    </Text>
                    <Text
                      style={{
                        color: "#ffffff",
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      {isUploading ? "Subiendo..." : "Subir Imagen"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {selectedImage && (
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 12,
                      color: "#2c3e50",
                    }}
                  >
                    👀 Previsualización:
                  </Text>
                  <View
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                  >
                    <Image
                      source={{ uri: selectedImage.uri }}
                      style={{
                        width: 180,
                        height: 180,
                        borderRadius: 12,
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se encontró perfil.</Text>
        </View>
      )}

      {/* Botón de Cerrar Sesión */}
      <View style={{ marginTop: 20 }}>
        <TouchableOpacity
          style={{
            backgroundColor: "#FF3B30",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            shadowColor: "#FF3B30",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18, marginRight: 8 }}>🚪</Text>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const handlePetRecovered = async (pet: { pet_name: any; type: any }) => {
    try {
      const response = await fetch(
        "http://192.168.100.8:3000/api/emergency-alert",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            petName: pet.pet_name,
            petType: pet.type,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        showToast("success", "¡Excelente!", "Mascota marcada como recuperada");
        // Actualizar la lista de mascotas perdidas
        fetchLostPets();
      } else {
        showToast(
          "error",
          "Error",
          data.error || "No se pudo eliminar la alerta"
        );
      }
    } catch (error) {
      showToast("error", "Error", "No se pudo conectar al servidor");
    }
  };

  const renderEmergencyTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Text style={styles.title}>Emergencias 🚨</Text>
      <Text style={{ fontSize: 16, textAlign: "center", marginVertical: 10 }}>
        Si perdiste una mascota, notifícalo para que los vecinos puedan
        ayudarte.
      </Text>

      <View
        style={{
          flexDirection: "column",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 8,
          gap: 12,
        }}
      >
        {/* Card 1 - Reportar mascota perdida */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              backgroundColor: "#ffebee",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#ffcdd2",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#c62828",
                textAlign: "center",
              }}
            >
              Reportar mascota perdida
            </Text>
          </View>

          <View style={{ padding: 16 }}>
            <TouchableOpacity
              style={{
                backgroundColor: "#FF3B30",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: "center",
              }}
              onPress={() => {
                fetchPets();
                setSelectingPet((prev) => !prev);
                setShowLostPets(false);
                setShowRecoveredSection(false);
                setShowFoundPets(false);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                📢 Notificar pérdida
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 2 - Ver mascotas perdidas */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff3cd",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#ffeaa7",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#856404",
                textAlign: "center",
              }}
            >
              Ver mascotas perdidas
            </Text>
          </View>

          <View style={{ padding: 16 }}>
            <TouchableOpacity
              style={{
                backgroundColor: "#796c45",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: "center",
              }}
              onPress={() => {
                if (!showLostPets) fetchLostPets();
                setShowLostPets((prev) => !prev);
                setSelectingPet(false);
                setShowRecoveredSection(false);
                setShowFoundPets(false);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 10,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                {showLostPets
                  ? "Ocultar mascotas perdidas"
                  : "Mascotas perdidas en mi colonia"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 3 - Mascota recuperada */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              backgroundColor: "#e8f5e8",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#c8e6c9",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#2e7d32",
                textAlign: "center",
              }}
            >
              Mascota recuperada
            </Text>
          </View>

          <View style={{ padding: 16 }}>
            <TouchableOpacity
              style={{
                backgroundColor: "#34C759",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: "center",
              }}
              onPress={() => {
                if (!showRecoveredSection) fetchLostPets();
                setShowRecoveredSection((prev) => !prev);
                setSelectingPet(false);
                setShowLostPets(false);
                setShowFoundPets(false);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                ✅ Marcar como recuperada
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{
            backgroundColor: "#e8f5e8",
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#c8e6c9",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Mascotas encontradas
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#4f4f75",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              alignItems: "center",
            }}
            onPress={() => {
              if (!showFoundPets) fetchFoundPets();
              setShowFoundPets((prev) => !prev);
              setShowLostPets(false);
              setShowRecoveredSection(false);
              setSelectingPet(false);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              Mascotas Encontradas
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {showLostPets && (
        <View
          style={{
            marginHorizontal: 16,
            marginVertical: 8,
            backgroundColor: "#ffffff",
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff3cd",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#ffeaa7",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#856404",
                textAlign: "center",
              }}
            >
              🔍 Mascotas perdidas en tu colonia
            </Text>
          </View>

          <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
            {loadingLostPets ? (
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 12, fontSize: 16, color: "#6c757d" }}>
                  Buscando mascotas perdidas...
                </Text>
              </View>
            ) : lostPets.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🎉</Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: "#28a745",
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  ¡Buenas noticias!
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6c757d",
                    textAlign: "center",
                    lineHeight: 20,
                  }}
                >
                  No hay reportes de mascotas perdidas en tu colonia
                </Text>
              </View>
            ) : (
              uniqueLostPets.map((pet, idx) => (
                <View
                  key={pet.id || idx}
                  style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: idx === uniqueLostPets.length - 1 ? 0 : 16,
                    borderLeftWidth: 4,
                    borderLeftColor: "#ffc107",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <View
                    style={{ flexDirection: "row", alignItems: "flex-start" }}
                  >
                    {pet.image_url && (
                      <View style={{ marginRight: 16 }}>
                        <Image
                          source={{ uri: pet.image_url }}
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 12,
                            backgroundColor: "#e9ecef",
                          }}
                        />
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "bold",
                            color: "#2c3e50",
                            flex: 1,
                          }}
                        >
                          {pet.pet_name}
                        </Text>
                        <View
                          style={{
                            backgroundColor: "#e3f2fd",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#1976d2",
                              fontWeight: "500",
                            }}
                          >
                            {pet.type}
                          </Text>
                        </View>
                      </View>

                      <View style={{ marginBottom: 12 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#495057",
                            lineHeight: 20,
                          }}
                        >
                          {pet.description}
                        </Text>
                      </View>

                      <View style={{ gap: 6 }}>
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#6c757d",
                              fontWeight: "500",
                              marginRight: 6,
                            }}
                          >
                            📍
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#6c757d",
                              flex: 1,
                            }}
                          >
                            Último lugar visto: {pet.last_seen_location}
                          </Text>
                        </View>

                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#6c757d",
                              fontWeight: "500",
                              marginRight: 6,
                            }}
                          >
                            📅
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#6c757d",
                            }}
                          >
                            Fecha de desaparición:{" "}
                            {formatDate(pet.disappearance_date)}
                          </Text>
                        </View>
                        <View>
                          <TouchableOpacity
                            style={{
                              backgroundColor: "#34C759",
                              paddingVertical: 12,
                              marginTop: 8,
                              paddingHorizontal: 16,
                              width: "100%",
                              borderRadius: 8,
                              alignItems: "center",
                            }}
                            onPress={() => {
                              iFoundAPet(pet.id);
                              setShowLostPets((prev) => !prev);
                            }}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={{
                                color: "#ffffff",
                                fontSize: 12,
                                fontWeight: "600",
                              }}
                            >
                              Encontre a esta mascota
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}
      {selectingPet && (
        <View
          style={{
            marginHorizontal: 16,
            marginVertical: 8,
            backgroundColor: "#ffffff",
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              backgroundColor: "#ffebee",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#ffcdd2",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#c62828",
                textAlign: "center",
              }}
            >
              🚨 Selecciona la mascota perdida
            </Text>
          </View>

          <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
            {loadingPets ? (
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 12, fontSize: 16, color: "#6c757d" }}>
                  Cargando tus mascotas...
                </Text>
              </View>
            ) : pets.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🐕</Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: "#495057",
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  No tienes mascotas registradas
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6c757d",
                    textAlign: "center",
                    lineHeight: 20,
                  }}
                >
                  Registra una mascota primero para poder reportarla como
                  perdida
                </Text>
              </View>
            ) : (
              pets.map((pet, index) => (
                <TouchableOpacity
                  key={pet.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 16,
                    paddingHorizontal: 12,
                    borderBottomWidth: index === pets.length - 1 ? 0 : 1,
                    borderBottomColor: "#f1f3f4",
                    borderRadius: 8,
                    marginBottom: index === pets.length - 1 ? 0 : 8,
                    backgroundColor: "#fafafa",
                  }}
                  onPress={() => {
                    setSelectedLostPet(pet);
                    handleNotifyLostPet(pet);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      marginRight: 16,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    <Image
                      source={{ uri: pet.image_url }}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: "#e9ecef",
                        borderWidth: 2,
                        borderColor: "#ffffff",
                      }}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#2c3e50",
                        marginBottom: 4,
                      }}
                    >
                      {pet.name}
                    </Text>
                    <View
                      style={{
                        backgroundColor: "#e3f2fd",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 12,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#1976d2",
                          fontWeight: "500",
                        }}
                      >
                        {pet.type}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      paddingLeft: 8,
                      backgroundColor: "#fff3e0",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#f57c00",
                        fontWeight: "600",
                      }}
                    >
                      REPORTAR
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      )}
      {showRecoveredSection && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Mis mascotas perdidas - Marcar como recuperada
          </Text>
          {loadingLostPets ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : lostPets.filter((pet) => pet.user_id === profile.user_id)
              .length === 0 ? (
            <Text style={{ textAlign: "center", marginVertical: 10 }}>
              No tienes mascotas perdidas reportadas.
            </Text>
          ) : (
            // Filtrar solo las mascotas del usuario actual
            lostPets
              .filter((pet) => pet.user_id === profile.user_id)
              .map((pet, idx) => (
                <View key={pet.id || idx} style={styles.recoveredPetCard}>
                  {pet.image_url && (
                    <Image
                      source={{ uri: pet.image_url }}
                      style={styles.recoveredPetImage}
                    />
                  )}
                  <View style={styles.recoveredPetInfo}>
                    <Text style={styles.recoveredPetName}>{pet.pet_name}</Text>
                    <Text>Tipo: {pet.type}</Text>
                    <Text>Descripción: {pet.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.recoveredButton}
                    onPress={() => handlePetRecovered(pet)}
                  >
                    <Text style={styles.recoveredButtonText}>
                      ✅ Recuperada
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
          )}
        </View>
      )}
      {showFoundPets && (
        <View>
          {foundPets.length === 0 ? (
            <Text>No se encontraron mascotas encontradas</Text>
          ) : (
            foundPets.map((pet, idx) => (
              <View key={pet.id || idx} style={styles.recoveredPetCard}>
                {pet.image_url && (
                  <Image
                    source={{ uri: pet.image_url }}
                    style={styles.recoveredPetImage}
                  />
                )}
                <View style={styles.recoveredPetInfo}>
                  <Text style={styles.recoveredPetName}>{pet.pet_name}</Text>
                  <Text>
                    Nombre de la persona que encontró la mascota:{" "}
                    {pet.first_name}
                  </Text>
                  <Text>
                    Apellido de la persona que encontró la mascota:{" "}
                    {pet.last_name}
                  </Text>

                  <Text>Colonia: {pet.address}</Text>
                  <Text>
                    Numero de contacto de la persona que encontró la mascota:{" "}
                    {pet.phone}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {activeTab === "home"
          ? renderHomeTab()
          : activeTab === "profile"
            ? renderProfileTab()
            : renderEmergencyTab()}
      </View>
      {renderTabBar()}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    paddingBottom: 10,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 2,
    borderTopColor: "transparent",
  },
  activeTab: {
    borderTopColor: "#007AFF",
  },
  tabText: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#1C1C1E",
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#8E8E93",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1C1C1E",
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1C1C1E",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  petImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    marginBottom: 10,
  },
  petPreviewImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8E8E93",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: "#8E8E93",
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  infoLabel: {
    fontSize: 16,
    color: "#8E8E93",
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: "#1C1C1E",
    flex: 2,
    textAlign: "right",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 4,
    color: "#1C1C1E",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  petTypeButton: {
    flex: 1,
    padding: 10,
    marginRight: 5,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  petTypeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  petTypeText: {
    color: "#1C1C1E",
    fontWeight: "bold",
  },
  recoveredPetCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#E8F5E8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  recoveredPetImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  recoveredPetInfo: {
    flex: 1,
    marginRight: 8,
  },
  recoveredPetName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  recoveredButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  recoveredButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
});
