import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
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
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Text style={styles.title}>Bienvenido al Dashboard 🐾</Text>
      {/* <Text style={styles.userEmail}>Usuario: {email}</Text> */}

      <View style={{ marginBottom: 20 }}>
        <Button
          title={showPets ? "Crear mascota" : "Ver mascotas"}
          onPress={() => {
            if (!showPets) fetchPets();
            setShowPets((prev) => !prev);
          }}
          color="#007AFF"
        />
      </View>

      {showPets ? (
        loadingPets ? (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ marginTop: 40 }}
          />
        ) : pets.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 40 }}>
            No tienes mascotas registradas.
          </Text>
        ) : (
          pets.map((pet, idx) => (
            <View key={pet.id || idx} style={styles.card}>
              {pet.image_url && (
                <Image
                  source={{ uri: pet.image_url }}
                  style={styles.petImage}
                />
              )}
              <Text style={styles.cardTitle}>{pet.name}</Text>
              <Text>Tipo: {pet.type}</Text>
              <Text>Color: {pet.color}</Text>
              <Text>Tamaño: {pet.size}</Text>
              {pet.features ? (
                <Text>Características: {pet.features}</Text>
              ) : null}
            </View>
          ))
        )
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Registrar Mascota</Text>

          <Text style={styles.inputLabel}>Tipo de mascota *</Text>
          <View style={{ flexDirection: "row", marginBottom: 10 }}>
            <TouchableOpacity
              style={[
                styles.petTypeButton,
                petType === "perro" && styles.petTypeButtonActive,
              ]}
              onPress={() => setPetType("perro")}
            >
              <Text style={styles.petTypeText}>🐶 Perro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.petTypeButton,
                petType === "gato" && styles.petTypeButtonActive,
              ]}
              onPress={() => setPetType("gato")}
            >
              <Text style={styles.petTypeText}>🐱 Gato</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Nombre *</Text>
          <TextInput
            style={styles.input}
            value={petName}
            onChangeText={setPetName}
            placeholder="Nombre de la mascota"
          />

          <Text style={styles.inputLabel}>Color *</Text>
          <TextInput
            style={styles.input}
            value={petColor}
            onChangeText={setPetColor}
            placeholder="Color"
          />

          <Text style={styles.inputLabel}>Tamaño *</Text>
          <TextInput
            style={styles.input}
            value={petSize}
            onChangeText={setPetSize}
            placeholder="Ej: pequeño, mediano, grande"
          />

          <Text style={styles.inputLabel}>Características especiales</Text>
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={petFeatures}
            onChangeText={setPetFeatures}
            placeholder="Ej: manchas, cicatrices, etc."
            multiline
          />

          {/* Sección de foto de mascota */}
          <Text style={styles.inputLabel}>Foto de la mascota *</Text>
          <View style={styles.buttonContainer}>
            <Button
              title="Seleccionar Foto"
              onPress={selectPetImage}
              color="#007AFF"
            />
            {selectedPetImage && (
              <Button
                title={isUploadingPetImage ? "Subiendo..." : "Subir Foto"}
                onPress={uploadPetImage}
                disabled={isUploadingPetImage}
                color="#34C759"
              />
            )}
          </View>

          {selectedPetImage && (
            <View style={styles.imageContainer}>
              <Text style={styles.imageLabel}>Previsualización:</Text>
              <Image
                source={{ uri: selectedPetImage.uri }}
                style={styles.petPreviewImage}
              />
            </View>
          )}

          {petPhotoUrl && (
            <View style={styles.imageContainer}>
              <Text style={styles.imageLabel}>Foto guardada:</Text>
              <Image
                source={{ uri: petPhotoUrl }}
                style={styles.petPreviewImage}
              />
            </View>
          )}

          <Button
            title="Registrar Mascota"
            onPress={handlePetRegister}
            color="#007AFF"
          />
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
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Image
                source={{
                  uri:
                    typeof profile.profile_picture_url === "string" &&
                    profile.profile_picture_url.trim() !== ""
                      ? profile.profile_picture_url
                      : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ168Mp9N1EPzK86wWBf_Ipl7gqELKUyhryNg&s",
                }}
                style={styles.avatar}
              />

              <Text style={styles.profileName}>
                {profile.first_name} {profile.last_name}
              </Text>
              <Text style={styles.profileEmail}>{email}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Información Personal</Text>
              {/* <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID:</Text>
                <Text style={styles.infoValue}>{profile.id}</Text>
              </View> */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                <Text style={styles.infoValue}>{profile.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha de nacimiento:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(profile.birth_date)}
                </Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Dirección</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dirección:</Text>
                <Text style={styles.infoValue}>{profile.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Código Postal:</Text>
                <Text style={styles.infoValue}>{profile.postal_code}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ciudad:</Text>
                <Text style={styles.infoValue}>{profile.city}</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Información de Cuenta</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Creado:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(profile.created_at)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actualizar Foto de Perfil</Text>
            <View style={styles.buttonContainer}>
              <Button
                title="Seleccionar Imagen"
                onPress={selectImage}
                color="#007AFF"
              />
              {selectedImage && (
                <Button
                  title={isUploading ? "Subiendo..." : "Subir Imagen"}
                  onPress={uploadImage}
                  disabled={isUploading}
                  color="#34C759"
                />
              )}
            </View>

            {selectedImage && (
              <View style={styles.imageContainer}>
                <Text style={styles.imageLabel}>Previsualización:</Text>
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.image}
                />
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se encontró perfil.</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Cerrar sesión" onPress={handleLogout} color="#FF3B30" />
      </View>
    </ScrollView>
  );

  const renderEmergencyTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Text style={styles.title}>Emergencias 🚨</Text>
      <Text style={{ fontSize: 16, textAlign: "center", marginVertical: 10 }}>
        Si perdiste una mascota, notifícalo para que los vecinos puedan
        ayudarte.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reportar mascota perdida</Text>
        <Button
          title="📢 Notificar pérdida"
          color="#FF3B30"
          onPress={() => {
            fetchPets();
            setSelectingPet((prev) => !prev);
            setShowLostPets(false);
          }}
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ver mascotas perdida</Text>
        <Button
          title={
            showLostPets
              ? "Ocultar mascotas perdidas"
              : "Mascotas perdidas en mi colonia"
          }
          color="#007AFF"
          onPress={() => {
            if (!showLostPets) fetchLostPets();
            setShowLostPets((prev) => !prev);
            setSelectingPet(false);
          }}
        />
      </View>
      {showLostPets && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mascotas perdidas en tu colonia</Text>
          {loadingLostPets ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : lostPets.length === 0 ? (
            <Text>No hay reportes de mascotas perdidas en tu colonia.</Text>
          ) : (
            uniqueLostPets.map((pet, idx) => (
              <View key={pet.id || idx} style={{ marginBottom: 16 }}>
                {pet.image_url && (
                  <Image
                    source={{ uri: pet.image_url }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  />
                )}
                <Text style={{ fontWeight: "bold" }}>{pet.pet_name}</Text>
                <Text>Tipo: {pet.type}</Text>
                <Text>Descripción: {pet.description}</Text>
                <Text>Última vez visto: {pet.last_seen_location}</Text>
                <Text>Fecha: {formatDate(pet.disappearance_date)}</Text>
              </View>
            ))
          )}
        </View>
      )}
      {selectingPet && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Selecciona la mascota perdida</Text>
          {loadingPets ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : pets.length === 0 ? (
            <Text>No tienes mascotas registradas.</Text>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: "#eee",
                }}
                onPress={() => {
                  setSelectedLostPet(pet);
                  handleNotifyLostPet(pet);
                }}
              >
                <Image
                  source={{ uri: pet.image_url }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    marginRight: 10,
                  }}
                />
                <View>
                  <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                    {pet.name}
                  </Text>
                  <Text>{pet.type}</Text>
                </View>
              </TouchableOpacity>
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
});
