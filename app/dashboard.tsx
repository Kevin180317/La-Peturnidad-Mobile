import {
  dashboardService,
  type EmergencyAlert,
  type EmergencyAlertWithOwner,
  type FoundPetWithDetails,
  type Pet,
} from "@/services/dashboard.service";
import { announcementsService } from "@/services/announcements.service";
import { commentsService } from "@/services/comments.service";
import { postsService } from "@/services/posts.service";
import { supabase } from "@/utils/supabase";
import { Picker } from "@react-native-picker/picker";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

type TabType = "home" | "profile" | "emergency" | "comunidad" | "feed";

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const userId = params.userId as string;

  // Estados generales
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("home");

  // Estados para mascotas
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [showPets, setShowPets] = useState(false);

  // Estados para formulario de mascota
  const [showPetForm, setShowPetForm] = useState(false);
  const [petType, setPetType] = useState<"perro" | "gato">("perro");
  const [petName, setPetName] = useState("");
  const [petColor, setPetColor] = useState("");
  const [petSize, setPetSize] = useState("");
  const [petFeatures, setPetFeatures] = useState("");
  const [petImageUrl, setPetImageUrl] = useState<string | null>(null);
  const [uploadingPetImage, setUploadingPetImage] = useState(false);
  const [selectedPetImage, setSelectedPetImage] = useState<{
    uri: string;
  } | null>(null);

  // Estados para foto de perfil
  const [selectedProfileImage, setSelectedProfileImage] = useState<{
    uri: string;
  } | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);

  // Estados para emergencias
  const [emergencyAlerts, setEmergencyAlerts] = useState<
    EmergencyAlertWithOwner[]
  >([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [selectingPetForAlert, setSelectingPetForAlert] = useState(false);
  const [myAlerts, setMyAlerts] = useState<EmergencyAlert[]>([]);
  const [showMyAlerts, setShowMyAlerts] = useState(false);
  const [foundPets, setFoundPets] = useState<FoundPetWithDetails[]>([]);
  const [showFoundPets, setShowFoundPets] = useState(false);

  // Modal para ver detalles
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Estado para editar mascota
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  // Estados para comunidad
  const [comunidadAnnouncements, setComunidadAnnouncements] = useState<any[]>([]);
  const [loadingComunidad, setLoadingComunidad] = useState(false);
  const [comShowForm, setComShowForm] = useState(false);
  const [comFormTitle, setComFormTitle] = useState("");
  const [comFormContent, setComFormContent] = useState("");
  const [comFormCategory, setComFormCategory] = useState("general");
  const [comPosting, setComPosting] = useState(false);

  // Estados para feed
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);

  // Estados para comentarios
  const [commentTarget, setCommentTarget] = useState<{ type: string; id: string } | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const showToast = useCallback(
    (type: "success" | "error" | "info", text1: string, text2?: string) => {
      Toast.show({ type, text1, text2, position: "top", visibilityTime: 3000 });
    },
    [],
  );

  // Cargar datos iniciales
  useEffect(() => {
    loadUserData();
  }, []);

  // Registrar token de notificaciones
  useEffect(() => {
    if (user?.id) {
      registerPushToken();
    }
  }, [user]);

  const loadComunidad = useCallback(async () => {
    setLoadingComunidad(true);
    const result = await announcementsService.getAll();
    if (result.success) setComunidadAnnouncements(result.data);
    setLoadingComunidad(false);
  }, []);

  const loadFeed = useCallback(async () => {
    if (!user?.id) return;
    setLoadingFeed(true);
    const result = await postsService.getFeed(user.id);
    if (result.success) setFeedPosts(result.data);
    setLoadingFeed(false);
  }, [user?.id]);

  const handleCreatePost = async () => {
    if (!postContent.trim() || !user?.id) return;
    setPosting(true);
    const result = await postsService.create({ user_id: user.id, content: postContent.trim() });
    if (result.success) {
      setPostContent("");
      setShowPostForm(false);
      await loadFeed();
    } else {
      showToast("error", "Error", result.error);
    }
    setPosting(false);
  };

  const handleDeletePost = async (postId: string) => {
    const result = await postsService.delete(postId);
    if (result.success) await loadFeed();
    else showToast("error", "Error", result.error);
  };

  const loadComments = async (targetType: string, targetId: string) => {
    setLoadingComments(true);
    const result = await commentsService.getByTarget(targetType, targetId);
    if (result.success) setComments(result.data);
    setLoadingComments(false);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !commentTarget || !user?.id) return;
    setSendingComment(true);
    const result = await commentsService.create({
      user_id: user.id,
      target_type: commentTarget.type,
      target_id: commentTarget.id,
      content: commentText.trim(),
    });
    if (result.success) {
      setCommentText("");
      await loadComments(commentTarget.type, commentTarget.id);
      await loadFeed();
    } else {
      showToast("error", "Error", result.error);
    }
    setSendingComment(false);
  };

  useEffect(() => {
    if (activeTab === "comunidad") loadComunidad();
    if (activeTab === "feed") loadFeed();
  }, [activeTab]);

  const registerPushToken = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await dashboardService.savePushToken(user.id, token);
      console.log("Push token guardado:", token);
    } catch (error) {
      console.error("Error registering push token:", error);
    }
  };

  const loadUserData = async () => {
    setLoading(true);

    try {
      // Obtener usuario actual
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.replace("/");
        return;
      }

      setUser(currentUser);
      console.log("Usuario actual:", currentUser.id);

      // Cargar perfil
      const profileResult = await dashboardService.getProfileByUserId(
        userId || currentUser.id,
      );

      if (profileResult.success && profileResult.data) {
        console.log("Perfil cargado:", profileResult.data);

        const [followersRes, followingRes] = await Promise.all([
          import("@/services/follows.service").then((m) => m.followsService.getFollowers(currentUser.id)),
          import("@/services/follows.service").then((m) => m.followsService.getFollowing(currentUser.id)),
        ]);

        setProfile({
          ...profileResult.data,
          followers_count: followersRes.success ? followersRes.data.length : 0,
          following_count: followingRes.success ? followingRes.data.length : 0,
        });

        // Cargar mascotas automáticamente
        await loadPets(currentUser.id);
      } else {
        console.log("No se encontró perfil");
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      showToast("error", "Error", "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    if (showPets && user?.id) await loadPets(user.id);
    if (showAlerts && profile?.address) {
      await loadEmergencyAlerts(profile.address);
    }
    if (showMyAlerts && user?.id) await loadMyAlerts(user.id);
    if (showFoundPets && user?.id) await loadFoundPets(user.id);
    setRefreshing(false);
  }, [showPets, showAlerts, showMyAlerts, showFoundPets, profile, user]);

  // ============== FUNCIONES DE PERFIL ==============

  const handleSelectProfileImage = async () => {
    const result = await dashboardService.selectImage();
    if (result.success) {
      setSelectedProfileImage(result.image || null);
    } else if (result.error !== "Selección cancelada") {
      showToast("error", "Error", result.error);
    }
  };

  const handleUploadProfileImage = async () => {
    if (!selectedProfileImage || !user?.id) return;

    setUploadingProfileImage(true);

    const uploadResult = await dashboardService.uploadImage(
      selectedProfileImage.uri,
      "profile-pictures",
    );

    if (uploadResult.success) {
      const updateResult = await dashboardService.updateProfilePicture(
        user.id,
        uploadResult.url || "",
      );

      if (updateResult.success) {
        showToast("success", "Éxito", "Foto de perfil actualizada");
        setSelectedProfileImage(null);
        await loadUserData();
      } else {
        showToast("error", "Error", updateResult.error);
      }
    } else {
      showToast("error", "Error", uploadResult.error);
    }

    setUploadingProfileImage(false);
  };

  // ============== FUNCIONES DE MASCOTAS ==============

  const loadPets = async (uid?: string) => {
    if (!uid && !user?.id) return;

    setLoadingPets(true);
    const result = await dashboardService.getPets(uid || user?.id);
    if (result.success) {
      setPets(result.data);
    } else {
      showToast("error", "Error", result.error);
    }
    setLoadingPets(false);
  };

  const handleSelectPetImage = async () => {
    const result = await dashboardService.selectImage();
    if (result.success) {
      setSelectedPetImage(result.image || null);
    } else if (result.error !== "Selección cancelada") {
      showToast("error", "Error", result.error);
    }
  };

  const handleUploadPetImage = async () => {
    if (!selectedPetImage) return;

    setUploadingPetImage(true);
    const result = await dashboardService.uploadImage(
      selectedPetImage.uri,
      "pet-images",
    );

    if (result.success) {
      setPetImageUrl(result.url || null);
      setSelectedPetImage(null);
      showToast("success", "Éxito", "Imagen subida correctamente");
    } else {
      showToast("error", "Error", result.error);
    }

    setUploadingPetImage(false);
  };

  const handlePetRegister = async () => {
    if (!petName || !petColor || !petSize) {
      showToast("error", "Error", "Completa todos los campos obligatorios");
      return;
    }

    if (!petImageUrl) {
      showToast("error", "Error", "Debes subir una foto de la mascota");
      return;
    }

    if (!user?.id) return;

    const result = await dashboardService.registerPet({
      user_id: user.id,
      type: petType,
      name: petName,
      color: petColor,
      size: petSize,
      features: petFeatures || null,
      image_url: petImageUrl,
    });

    if (result.success) {
      showToast(
        "success",
        "Mascota registrada",
        "¡Tu mascota ha sido guardada!",
      );
      // Limpiar formulario
      setPetName("");
      setPetColor("");
      setPetSize("");
      setPetFeatures("");
      setPetImageUrl(null);
      setPetType("perro");
      setSelectedPetImage(null);
      setShowPetForm(false);

      // Recargar mascotas
      await loadPets(user.id);
    } else {
      showToast("error", "Error", result.error);
    }
  };

  const handleStartEdit = (pet: Pet) => {
    setEditingPet(pet);
    setPetType(pet.type);
    setPetName(pet.name);
    setPetColor(pet.color);
    setPetSize(pet.size);
    setPetFeatures(pet.features || "");
    setPetImageUrl(pet.image_url);
    setSelectedPetImage(null);
    setShowPetForm(true);
  };

  const handlePetUpdate = async () => {
    if (!editingPet) return;
    if (!petName || !petColor || !petSize) {
      showToast("error", "Error", "Completa todos los campos obligatorios");
      return;
    }

    const result = await dashboardService.updatePet(editingPet.id, {
      name: petName,
      type: petType,
      color: petColor,
      size: petSize,
      features: petFeatures || null,
      image_url: petImageUrl,
    });

    if (result.success) {
      showToast("success", "Mascota actualizada", "Los cambios han sido guardados");
      setEditingPet(null);
      setShowPetForm(false);
      setPetName("");
      setPetColor("");
      setPetSize("");
      setPetFeatures("");
      setPetImageUrl(null);
      setSelectedPetImage(null);
      await loadPets(user?.id);
    } else {
      showToast("error", "Error", result.error);
    }
  };

  const handleDeletePet = (petId: string) => {
    Alert.alert(
      "Eliminar mascota",
      "¿Estás seguro de que quieres eliminar esta mascota? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const result = await dashboardService.deletePet(petId);
            if (result.success) {
              showToast(
                "success",
                "Mascota eliminada",
                "La mascota ha sido eliminada",
              );
              await loadPets(user?.id);
              setModalVisible(false);
            } else {
              showToast("error", "Error", result.error);
            }
          },
        },
      ],
    );
  };

  // ============== FUNCIONES DE EMERGENCIA ==============

  const loadEmergencyAlerts = async (address: string) => {
    setLoadingAlerts(true);
    const result = await dashboardService.getEmergencyAlertsByLocation(address);
    if (result.success) {
      setEmergencyAlerts(result.data as EmergencyAlertWithOwner[]);
    } else {
      showToast("error", "Error", result.error);
    }
    setLoadingAlerts(false);
  };

  const loadMyAlerts = async (uid?: string) => {
    if (!uid && !user?.id) return;

    const result = await dashboardService.getUserEmergencyAlerts(
      uid || user?.id,
    );
    if (result.success) {
      setMyAlerts(result.data);
    } else {
      showToast("error", "Error", result.error);
    }
  };

  const handleCreateEmergencyAlert = async (pet: Pet) => {
    if (!profile?.address || !user?.id) {
      showToast("error", "Error", "Completa tu perfil primero");
      return;
    }

    Alert.alert(
      "Crear alerta de emergencia",
      `¿Estás seguro de que quieres reportar a ${pet.name} como perdido? Esta alerta será visible para todos los vecinos de tu colonia.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, crear alerta",
          onPress: async () => {
            const result = await dashboardService.createEmergencyAlert({
              user_id: user.id,
              pet_name: pet.name,
              type: pet.type,
              description: `Mascota perdida: ${pet.name}. Color: ${pet.color}, Tamaño: ${pet.size}. ${pet.features || ""}`,
              last_seen_location: profile.address,
              disappearance_date: new Date().toISOString().split("T")[0],
              image_url: pet.image_url,
            });

            if (result.success) {
              showToast(
                "success",
                "Alerta creada",
                "Se ha notificado a los vecinos",
              );
              setSelectingPetForAlert(false);
              await loadMyAlerts(user.id);
              if (profile?.address) {
                await loadEmergencyAlerts(profile.address);
              }
            } else {
              showToast("error", "Error", result.error);
            }
          },
        },
      ],
    );
  };

  const handleDeleteAlert = async (alertId: string) => {
    Alert.alert(
      "Eliminar alerta",
      "¿Estás seguro de que quieres eliminar esta alerta? Tu mascota ya no aparecerá como perdida.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const result = await dashboardService.deleteEmergencyAlert(alertId);
            if (result.success) {
              showToast(
                "success",
                "Alerta eliminada",
                "La alerta ha sido removida",
              );
              await loadMyAlerts(user?.id);
              if (profile?.address) await loadEmergencyAlerts(profile.address);
            } else {
              showToast("error", "Error", result.error);
            }
          },
        },
      ],
    );
  };

  const handleFoundPet = async (alert: EmergencyAlertWithOwner) => {
    if (!user?.id) return;

    Alert.alert(
      "Reportar mascota encontrada",
      `¿Has encontrado a ${alert.pet_name}? Al confirmar, te pondremos en contacto con el dueño.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, lo encontré",
          onPress: async () => {
            // Buscar la mascota por nombre para obtener su ID
            const pet = pets.find((p) => p.name === alert.pet_name);
            if (!pet) {
              showToast("error", "Error", "No se pudo identificar la mascota");
              return;
            }

            const result = await dashboardService.reportFoundPet({
              user_id: user.id,
              pet_id: pet.id,
            });

            if (result.success) {
              showToast(
                "success",
                "¡Gracias!",
                `El dueño de ${alert.pet_name} será notificado`,
              );

              // Eliminar la alerta automáticamente
              await dashboardService.deleteEmergencyAlert(alert.id);

              // Actualizar listas
              if (profile?.address) {
                await loadEmergencyAlerts(profile.address);
              }
              await loadFoundPets(user.id);
            } else {
              showToast("error", "Error", result.error);
            }
          },
        },
      ],
    );
  };

  const loadFoundPets = async (uid?: string) => {
    if (!uid && !user?.id) return;

    const result = await dashboardService.getFoundPetsByUser(uid || user?.id);
    if (result.success) {
      setFoundPets(result.data);
    } else {
      showToast("error", "Error", result.error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          onPress: async () => {
            const result = await dashboardService.signOut();
            if (result.success) {
              router.replace("/");
              showToast(
                "success",
                "¡Hasta luego!",
                "Has cerrado sesión correctamente",
              );
            } else {
              showToast("error", "Error", result.error);
            }
          },
        },
      ],
    );
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return "No disponible";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#ff7e70" />
        <Text className="mt-4 text-[#211f1e] font-medium">
          Cargando dashboard...
        </Text>
      </View>
    );
  }

  // ============== RENDERIZADO DE COMPONENTES ==============

  const renderTabBar = () => (
    <View className="flex-row bg-white border-t border-[#211f1e]/20 py-2 shadow-lg">
      {[
        { key: "feed", label: "Feed", icon: "📱" },
        { key: "home", label: "Inicio", icon: "🏠" },
        { key: "comunidad", label: "Comunidad", icon: "💬" },
        { key: "emergency", label: "Emergencia", icon: "🚨" },
        { key: "profile", label: "Perfil", icon: "👤" },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          className={`flex-1 py-3 items-center border-t-2 ${
            activeTab === tab.key ? "border-t-red-500" : "border-t-transparent"
          }`}
          onPress={() => setActiveTab(tab.key as TabType)}
        >
          <Text className="text-lg">{tab.icon}</Text>
          <Text
            className={`text-xs mt-1 ${
              activeTab === tab.key
                ? "text-[#ff7e70] font-bold"
                : "text-gray-400 font-medium"
            }`}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Modal de detalles de mascota
  const PetDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-2xl p-6 w-11/12 max-h-4/5">
          {selectedPet && (
            <>
              <ScrollView>
                <Text className="text-2xl font-bold text-center mb-4">
                  {selectedPet.name}
                </Text>

                {selectedPet.image_url ? (
                  <Image
                    source={{ uri: selectedPet.image_url }}
                    className="w-full h-64 rounded-xl mb-4"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-64 bg-gray-200 rounded-xl mb-4 items-center justify-center">
                    <Text className="text-6xl">
                      {selectedPet.type === "perro" ? "🐶" : "🐱"}
                    </Text>
                  </View>
                )}

                <View className="space-y-3">
                  <View className="flex-row border-b border-gray-100 py-2">
                    <Text className="font-semibold w-1/3">Tipo:</Text>
                    <Text className="flex-1 capitalize">
                      {selectedPet.type}
                    </Text>
                  </View>
                  <View className="flex-row border-b border-gray-100 py-2">
                    <Text className="font-semibold w-1/3">Color:</Text>
                    <Text className="flex-1">{selectedPet.color}</Text>
                  </View>
                  <View className="flex-row border-b border-gray-100 py-2">
                    <Text className="font-semibold w-1/3">Tamaño:</Text>
                    <Text className="flex-1 capitalize">
                      {selectedPet.size}
                    </Text>
                  </View>
                  {selectedPet.features && (
                    <View className="flex-row border-b border-gray-100 py-2">
                      <Text className="font-semibold w-1/3">
                        Características:
                      </Text>
                      <Text className="flex-1">{selectedPet.features}</Text>
                    </View>
                  )}
                  <View className="flex-row border-b border-gray-100 py-2">
                    <Text className="font-semibold w-1/3">Registrada:</Text>
                    <Text className="flex-1">
                      {formatDate(selectedPet.created_at)}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  className="flex-1 bg-[#ff7e70] py-3 rounded-lg"
                  onPress={() => {
                    setModalVisible(false);
                    handleDeletePet(selectedPet.id);
                  }}
                >
                  <Text className="text-white text-center font-semibold">
                    Eliminar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-[#211f1e] py-3 rounded-lg"
                  onPress={() => setModalVisible(false)}
                >
                  <Text className="text-center font-semibold">Cerrar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // ============== TABS ==============

  const renderHomeTab = () => (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerClassName="p-5 pb-10"
    >
      {/* Header de bienvenida */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-[#211f1e]">
          ¡Hola, {profile?.first_name || "Usuario"}! 👋
        </Text>
        <Text className="text-gray-600 mt-1">
          {new Date().toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      {/* Tarjetas de resumen */}
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-blue-50 p-4 rounded-xl">
          <Text className="text-2xl mb-1">🐾</Text>
          <Text className="text-xl font-bold text-blue-600">{pets.length}</Text>
          <Text className="text-gray-600 text-sm">Mascotas</Text>
        </View>
        <View className="flex-1 bg-yellow-50 p-4 rounded-xl">
          <Text className="text-2xl mb-1">🚨</Text>
          <Text className="text-xl font-bold text-yellow-600">
            {myAlerts.length}
          </Text>
          <Text className="text-gray-600 text-sm">Alertas</Text>
        </View>
        <View className="flex-1 bg-green-50 p-4 rounded-xl">
          <Text className="text-2xl mb-1">✅</Text>
          <Text className="text-xl font-bold text-green-600">
            {foundPets.length}
          </Text>
          <Text className="text-gray-600 text-sm">Encontradas</Text>
        </View>
      </View>

      {/* Botones de acción rápida */}
      <View className="flex-row gap-3 mb-6">
        <TouchableOpacity
          className="flex-1 bg-green-500 py-4 rounded-xl"
          onPress={() => {
            setShowPetForm(true);
            setShowPets(false);
          }}
        >
          <Text className="text-white text-center font-semibold">
            ➕ Registrar mascota
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-[#005e66] py-4 rounded-xl"
          onPress={async () => {
            await loadPets(user?.id);
            setShowPets(!showPets);
            setShowPetForm(false);
          }}
        >
          <Text className="text-white text-center font-semibold">
            {showPets ? "👁️ Ocultar" : "👁️ Ver"} mascotas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de mascotas */}
      {showPets && (
        <View className="mb-6">
          <Text className="text-lg font-bold mb-3">Mis mascotas</Text>
          {loadingPets ? (
            <ActivityIndicator size="large" color="#ff7e70" />
          ) : pets.length === 0 ? (
            <View className="bg-[#faf5e0] p-8 rounded-xl items-center">
              <Text className="text-4xl mb-3">🐕</Text>
              <Text className="text-gray-500 text-center">
                No tienes mascotas registradas. ¡Agrega tu primera mascota!
              </Text>
            </View>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                className="bg-white p-4 rounded-xl mb-3 shadow-sm flex-row"
                onPress={() => {
                  setSelectedPet(pet);
                  setModalVisible(true);
                }}
              >
                {pet.image_url ? (
                  <Image
                    source={{ uri: pet.image_url }}
                    className="w-16 h-16 rounded-lg mr-3"
                  />
                ) : (
                  <View className="w-16 h-16 bg-gray-200 rounded-lg mr-3 items-center justify-center">
                    <Text className="text-2xl">
                      {pet.type === "perro" ? "🐶" : "🐱"}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="font-bold text-lg">{pet.name}</Text>
                  <Text className="text-gray-600 capitalize">
                    {pet.type} • {pet.color}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Tamaño: {pet.size}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Formulario de registro de mascota */}
      {showPetForm && (
        <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
          <Text className="text-xl font-bold mb-4">
            Registrar nueva mascota
          </Text>

          {/* Tipo */}
          <Text className="font-semibold mb-2">Tipo *</Text>
          <View className="flex-row gap-3 mb-4">
            {["perro", "gato"].map((type) => (
              <TouchableOpacity
                key={type}
                className={`flex-1 py-3 rounded-xl border-2 ${
                  petType === type
                    ? "border-red-500 bg-[#ff7e70]"
                    : "border-[#211f1e]/20"
                }`}
                onPress={() => setPetType(type as "perro" | "gato")}
              >
                <Text
                  className={`text-center ${petType === type ? "text-[#ff7e70]" : "text-gray-600"}`}
                >
                  {type === "perro" ? "🐶 Perro" : "🐱 Gato"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nombre */}
          <Text className="font-semibold mb-2">Nombre *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 bg-[#faf5e0]"
            placeholder="Nombre de la mascota"
            value={petName}
            onChangeText={setPetName}
          />

          {/* Color */}
          <Text className="font-semibold mb-2">Color *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 bg-[#faf5e0]"
            placeholder="Color principal"
            value={petColor}
            onChangeText={setPetColor}
          />

          {/* Tamaño */}
          <Text className="font-semibold mb-2">Tamaño *</Text>
          <View className="mb-4 border border-gray-300 rounded-lg overflow-hidden bg-[#faf5e0]">
            <Picker
              selectedValue={petSize}
              onValueChange={(value) => setPetSize(value)}
              style={{ height: 50 }}
            >
              <Picker.Item label="Selecciona un tamaño" value="" />
              <Picker.Item label="Pequeño" value="pequeño" />
              <Picker.Item label="Mediano" value="mediano" />
              <Picker.Item label="Grande" value="grande" />
            </Picker>
          </View>

          {/* Características */}
          <Text className="font-semibold mb-2">Características especiales</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 bg-[#faf5e0]"
            placeholder="Ej: manchas, cicatrices, comportamiento especial..."
            value={petFeatures}
            onChangeText={setPetFeatures}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Foto */}
          <Text className="font-semibold mb-2">Foto *</Text>
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              className="flex-1 bg-[#005e66] py-3 rounded-lg"
              onPress={handleSelectPetImage}
            >
              <Text className="text-white text-center">📷 Seleccionar</Text>
            </TouchableOpacity>
            {selectedPetImage && (
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${uploadingPetImage ? "bg-gray-400" : "bg-green-500"}`}
                onPress={handleUploadPetImage}
                disabled={uploadingPetImage}
              >
                <Text className="text-white text-center">
                  {uploadingPetImage ? "⏳ Subiendo..." : "☁️ Subir"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedPetImage && (
            <Image
              source={{ uri: selectedPetImage.uri }}
              className="w-24 h-24 rounded-lg mb-4 self-center"
            />
          )}

          {petImageUrl && (
            <View className="bg-green-50 p-3 rounded-lg mb-4">
              <Text className="text-green-600 text-center">
                ✅ Foto lista para usar
              </Text>
            </View>
          )}

          {/* Botones */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-[#ff7e70] py-4 rounded-lg"
              onPress={editingPet ? handlePetUpdate : handlePetRegister}
            >
              <Text className="text-white text-center font-bold">
                {editingPet ? "Actualizar" : "Registrar"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-[#211f1e] py-4 rounded-lg"
              onPress={() => {
                setShowPetForm(false);
                setEditingPet(null);
                setPetName("");
                setPetColor("");
                setPetSize("");
                setPetFeatures("");
                setPetImageUrl(null);
                setSelectedPetImage(null);
              }}
            >
              <Text className="text-center font-bold">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <PetDetailModal onEdit={handleStartEdit} />
    </ScrollView>
  );

  const renderProfileTab = () => (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerClassName="p-5 pb-10"
    >
      <Text className="text-2xl font-bold mb-6">Mi Perfil</Text>

      {profile ? (
        <>
          {/* Foto de perfil */}
          <View className="items-center mb-6">
            <View className="relative">
              <Image
                source={{
                  uri:
                    profile.profile_picture_url ||
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ168Mp9N1EPzK86wWBf_Ipl7gqELKUyhryNg&s",
                }}
                className="w-32 h-32 rounded-full border-4 border-red-200"
              />
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-[#ff7e70] w-10 h-10 rounded-full items-center justify-center border-2 border-white"
                onPress={handleSelectProfileImage}
              >
                <Text className="text-white text-lg">📷</Text>
              </TouchableOpacity>
            </View>

            {selectedProfileImage && (
              <View className="mt-4 w-full">
                <Image
                  source={{ uri: selectedProfileImage.uri }}
                  className="w-24 h-24 rounded-lg self-center mb-2"
                />
                <TouchableOpacity
                  className={`py-2 rounded-lg ${uploadingProfileImage ? "bg-gray-400" : "bg-green-500"}`}
                  onPress={handleUploadProfileImage}
                  disabled={uploadingProfileImage}
                >
                  <Text className="text-white text-center">
                    {uploadingProfileImage
                      ? "Subiendo..."
                      : "Confirmar nueva foto"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Información personal */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-bold mb-4">Información personal</Text>

            <View className="space-y-3">
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">Nombre:</Text>
                <Text className="flex-1">
                  {profile.first_name} {profile.last_name}
                </Text>
              </View>
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">Email:</Text>
                <Text className="flex-1">{email}</Text>
              </View>
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">Teléfono:</Text>
                <Text className="flex-1">{profile.phone}</Text>
              </View>
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">Cumpleaños:</Text>
                <Text className="flex-1">{formatDate(profile.birth_date)}</Text>
              </View>
            </View>
          </View>

          {/* Dirección */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-bold mb-4">Dirección</Text>

            <View className="space-y-3">
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">Calle/Colonia:</Text>
                <Text className="flex-1">{profile.address}</Text>
              </View>
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">Ciudad:</Text>
                <Text className="flex-1">{profile.city}</Text>
              </View>
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">C.P.:</Text>
                <Text className="flex-1">{profile.postal_code}</Text>
              </View>
            </View>
          </View>

          {/* Estadísticas */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-bold mb-4">Estadísticas</Text>

            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-500">
                  {pets.length}
                </Text>
                <Text className="text-gray-600">Mascotas</Text>
              </View>
              <TouchableOpacity className="items-center" onPress={() => router.push(`/seguidores?id=${user?.id}&tab=followers`)}>
                <Text className="text-2xl font-bold text-[#ff7e70]">
                  {profile?.followers_count || 0}
                </Text>
                <Text className="text-gray-600">Seguidores</Text>
              </TouchableOpacity>
              <TouchableOpacity className="items-center" onPress={() => router.push(`/seguidores?id=${user?.id}&tab=following`)}>
                <Text className="text-2xl font-bold text-[#007275]">
                  {profile?.following_count || 0}
                </Text>
                <Text className="text-gray-600">Siguiendo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Acciones */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-bold mb-4">Acciones</Text>
            <TouchableOpacity
              className="bg-[#007275] py-3 rounded-lg mb-3"
              onPress={() => router.push("/editar-perfil")}
            >
              <Text className="text-white text-center font-semibold">
                ✏️ Editar perfil
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#007275] py-3 rounded-lg mb-3"
              onPress={() => router.push("/notificaciones")}
            >
              <Text className="text-white text-center font-semibold">
                🔔 Configurar notificaciones
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#005e66] py-3 rounded-lg mb-3"
              onPress={() => setActiveTab("comunidad")}
            >
              <Text className="text-white text-center font-semibold">
                💬 Ir a la comunidad
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#007275] py-3 rounded-lg mb-3"
              onPress={() => router.push("/mensajes")}
            >
              <Text className="text-white text-center font-semibold">
                ✉️ Mensajes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#005e66] py-3 rounded-lg mb-3"
              onPress={() => router.push("/grupos")}
            >
              <Text className="text-white text-center font-semibold">
                👥 Grupos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#007275] py-3 rounded-lg mb-3"
              onPress={() => router.push("/historias")}
            >
              <Text className="text-white text-center font-semibold">
                🐾 Reuniones exitosas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#211f1e] py-3 rounded-lg"
              onPress={() => router.push("/panel-moderacion")}
            >
              <Text className="text-white text-center font-semibold">
                🛡️ Panel de moderación
              </Text>
            </TouchableOpacity>
          </View>

          {/* Información de cuenta */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-bold mb-4">Cuenta</Text>
            <View className="space-y-3">
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">Miembro desde:</Text>
                <Text className="flex-1">{formatDate(profile.created_at)}</Text>
              </View>
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">
                  Última actualización:
                </Text>
                <Text className="flex-1">{formatDate(profile.updated_at)}</Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        <View className="bg-yellow-50 p-8 rounded-xl items-center">
          <Text className="text-4xl mb-3">⚠️</Text>
          <Text className="text-gray-600 text-center">
            No se encontró información de perfil. Completa tu registro.
          </Text>
          <TouchableOpacity
            className="bg-[#ff7e70] py-3 px-6 rounded-lg mt-4"
            onPress={() =>
              router.replace({
                pathname: "/register-extended",
                params: { email, userId },
              })
            }
          >
            <Text className="text-white font-semibold">Completar perfil</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botón de cerrar sesión */}
      <TouchableOpacity
        className="bg-[#ff7e70] py-4 rounded-xl mt-4"
        onPress={handleLogout}
      >
        <Text className="text-white text-center font-bold">Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderEmergencyTab = () => (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerClassName="p-5 pb-10"
    >
      <Text className="text-2xl font-bold mb-2 text-[#ff7e70]">
        Emergencia 🚨
      </Text>
      <Text className="text-gray-600 mb-6">
        Sistema de alertas para mascotas perdidas en tu comunidad
      </Text>

      {/* Botones principales */}
      <View className="gap-4 mb-6">
        <TouchableOpacity
          className="bg-[#ff7e70] py-4 rounded-xl flex-row items-center justify-center gap-2"
          onPress={async () => {
            await loadPets(user?.id);
            setSelectingPetForAlert(!selectingPetForAlert);
            setShowAlerts(false);
            setShowMyAlerts(false);
            setShowFoundPets(false);
          }}
        >
          <Text className="text-white text-lg">📢</Text>
          <Text className="text-white font-bold">Reportar mascota perdida</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-yellow-500 py-4 rounded-xl flex-row items-center justify-center gap-2"
          onPress={() => {
            if (!showAlerts && profile?.address) {
              loadEmergencyAlerts(profile.address);
            }
            setShowAlerts(!showAlerts);
            setSelectingPetForAlert(false);
            setShowMyAlerts(false);
            setShowFoundPets(false);
          }}
        >
          <Text className="text-white text-lg">👁️</Text>
          <Text className="text-white font-bold">
            {showAlerts ? "Ocultar" : "Ver"} mascotas perdidas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-[#005e66] py-4 rounded-xl flex-row items-center justify-center gap-2"
          onPress={async () => {
            await loadMyAlerts(user?.id);
            setShowMyAlerts(!showMyAlerts);
            setSelectingPetForAlert(false);
            setShowAlerts(false);
            setShowFoundPets(false);
          }}
        >
          <Text className="text-white text-lg">📋</Text>
          <Text className="text-white font-bold">
            {showMyAlerts ? "Ocultar" : "Ver"} mis alertas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-green-500 py-4 rounded-xl flex-row items-center justify-center gap-2"
          onPress={async () => {
            await loadFoundPets(user?.id);
            setShowFoundPets(!showFoundPets);
            setSelectingPetForAlert(false);
            setShowAlerts(false);
            setShowMyAlerts(false);
          }}
        >
          <Text className="text-white text-lg">✅</Text>
          <Text className="text-white font-bold">
            {showFoundPets ? "Ocultar" : "Ver"} mascotas encontradas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selección de mascota para alerta */}
      {selectingPetForAlert && (
        <View className="bg-white p-4 rounded-xl mb-6 shadow-sm">
          <Text className="font-bold mb-3">Selecciona la mascota perdida:</Text>
          {pets.length === 0 ? (
            <View className="bg-[#faf5e0] p-6 rounded-lg items-center">
              <Text className="text-gray-500">
                No tienes mascotas registradas
              </Text>
              <TouchableOpacity
                className="bg-[#ff7e70] py-2 px-4 rounded-lg mt-3"
                onPress={() => setActiveTab("home")}
              >
                <Text className="text-white">Registrar mascota</Text>
              </TouchableOpacity>
            </View>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                className="flex-row items-center p-3 border-b border-gray-100"
                onPress={() => handleCreateEmergencyAlert(pet)}
              >
                {pet.image_url ? (
                  <Image
                    source={{ uri: pet.image_url }}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                ) : (
                  <View className="w-12 h-12 bg-gray-200 rounded-full mr-3 items-center justify-center">
                    <Text className="text-xl">
                      {pet.type === "perro" ? "🐶" : "🐱"}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="font-semibold">{pet.name}</Text>
                  <Text className="text-gray-500 text-sm capitalize">
                    {pet.type}
                  </Text>
                </View>
                <View className="bg-red-100 px-3 py-1 rounded-full">
                  <Text className="text-[#ff7e70] text-xs font-semibold">
                    REPORTAR
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Alertas de mascotas perdidas */}
      {showAlerts && (
        <View className="bg-white p-4 rounded-xl mb-6 shadow-sm">
          <Text className="font-bold mb-3">
            🐾 Mascotas perdidas en tu colonia
          </Text>
          {loadingAlerts ? (
            <ActivityIndicator size="large" color="#ff7e70" />
          ) : emergencyAlerts.length === 0 ? (
            <View className="bg-green-50 p-8 rounded-lg items-center">
              <Text className="text-4xl mb-3">🎉</Text>
              <Text className="text-gray-600 text-center">
                No hay mascotas perdidas reportadas en tu colonia
              </Text>
            </View>
          ) : (
            emergencyAlerts.map((alert) => (
              <View
                key={alert.id}
                className="border-b border-gray-100 py-4 last:border-b-0"
              >
                <View className="flex-row">
                  {alert.image_url ? (
                    <Image
                      source={{ uri: alert.image_url }}
                      className="w-20 h-20 rounded-lg mr-3"
                    />
                  ) : (
                    <View className="w-20 h-20 bg-gray-200 rounded-lg mr-3 items-center justify-center">
                      <Text className="text-2xl">
                        {alert.type === "perro" ? "🐶" : "🐱"}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-bold text-lg">{alert.pet_name}</Text>
                    <Text className="text-gray-600 capitalize text-sm mb-1">
                      {alert.type}
                    </Text>
                    <Text className="text-gray-500 text-xs mb-1">
                      {alert.description}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      Perdido en: {alert.last_seen_location}
                    </Text>
                    <Text className="text-gray-400 text-xs mb-2">
                      Fecha: {formatDate(alert.disappearance_date)}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      Dueño: {alert.owner_name} - {alert.owner_phone}
                    </Text>
                    <TouchableOpacity
                      className="bg-green-500 py-2 px-4 rounded-lg mt-2 self-start"
                      onPress={() => handleFoundPet(alert)}
                    >
                      <Text className="text-white text-xs font-semibold">
                        ✅ Lo encontré
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Mis alertas */}
      {showMyAlerts && (
        <View className="bg-white p-4 rounded-xl mb-6 shadow-sm">
          <Text className="font-bold mb-3">📋 Mis alertas activas</Text>
          {myAlerts.length === 0 ? (
            <View className="bg-[#faf5e0] p-8 rounded-lg items-center">
              <Text className="text-gray-500 text-center">
                No tienes alertas activas
              </Text>
            </View>
          ) : (
            myAlerts.map((alert) => (
              <View
                key={alert.id}
                className="border-b border-gray-100 py-4 last:border-b-0"
              >
                <View className="flex-row">
                  {alert.image_url ? (
                    <Image
                      source={{ uri: alert.image_url }}
                      className="w-16 h-16 rounded-lg mr-3"
                    />
                  ) : (
                    <View className="w-16 h-16 bg-gray-200 rounded-lg mr-3 items-center justify-center">
                      <Text className="text-2xl">
                        {alert.type === "perro" ? "🐶" : "🐱"}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-bold">{alert.pet_name}</Text>
                    <Text className="text-gray-600 text-sm capitalize mb-1">
                      {alert.type}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      Perdido en: {alert.last_seen_location}
                    </Text>
                    <Text className="text-gray-400 text-xs mb-2">
                      {formatDate(alert.disappearance_date)}
                    </Text>
                    <TouchableOpacity
                      className="bg-[#ff7e70] py-2 px-4 rounded-lg self-start"
                      onPress={() => handleDeleteAlert(alert.id)}
                    >
                      <Text className="text-white text-xs font-semibold">
                        🗑️ Eliminar alerta
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Mascotas encontradas */}
      {showFoundPets && (
        <View className="bg-white p-4 rounded-xl mb-6 shadow-sm">
          <Text className="font-bold mb-3">✅ Mascotas que he encontrado</Text>
          {foundPets.length === 0 ? (
            <View className="bg-[#faf5e0] p-8 rounded-lg items-center">
              <Text className="text-gray-500 text-center">
                No has reportado mascotas encontradas
              </Text>
            </View>
          ) : (
            foundPets.map((found) => (
              <View
                key={found.id}
                className="border-b border-gray-100 py-3 last:border-b-0"
              >
                <View className="flex-row items-center">
                  {found.image_url && (
                    <Image
                      source={{ uri: found.image_url }}
                      className="w-12 h-12 rounded-full mr-3"
                    />
                  )}
                  <View>
                    <Text className="font-semibold">{found.pet_name}</Text>
                    <Text className="text-gray-500 text-xs">
                      Encontrada el: {formatDate(found.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );

  const comCatColor = (cat: string) => {
    switch (cat) { case "aviso": return "bg-red-100 text-red-600"; case "evento": return "bg-blue-100 text-blue-600"; case "pregunta": return "bg-yellow-100 text-yellow-600"; default: return "bg-gray-100 text-gray-600"; }
  };
  const comCatIcon = (cat: string) => {
    const m: Record<string, string> = { general: "💬", aviso: "📢", evento: "📅", pregunta: "❓" };
    return m[cat] || "💬";
  };
  const comCatLabel = (cat: string) => {
    const m: Record<string, string> = { general: "General", aviso: "Aviso", evento: "Evento", pregunta: "Pregunta" };
    return m[cat] || cat;
  };

  const handleComPost = async () => {
    if (!comFormTitle.trim() || !comFormContent.trim()) { showToast("error", "Completa todos los campos"); return; }
    setComPosting(true);
    const r = await announcementsService.create({ user_id: user?.id || "", title: comFormTitle.trim(), content: comFormContent.trim(), category: comFormCategory as any });
    if (r.success) { showToast("success", "Publicado"); setComShowForm(false); setComFormTitle(""); setComFormContent(""); setComFormCategory("general"); loadComunidad(); }
    else showToast("error", "Error", r.error);
    setComPosting(false);
  };

  const handleComDelete = async (id: string) => {
    const r = await announcementsService.delete(id);
    if (r.success) { loadComunidad(); showToast("success", "Eliminado"); }
    else showToast("error", "Error", r.error);
  };

  const renderFeedTab = () => (
    <>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { loadFeed(); onRefresh(); }} />}
        contentContainerClassName="p-5 pb-10"
      >
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-[#211f1e]">Feed</Text>
          <TouchableOpacity
            className="bg-[#ff7e70] py-2 px-4 rounded-lg flex-row items-center"
            onPress={() => setShowPostForm(true)}
          >
            <Text className="text-white text-lg mr-1">✏️</Text>
            <Text className="text-white font-semibold">Publicar</Text>
          </TouchableOpacity>
        </View>

        {showPostForm && (
          <View className="bg-white p-4 rounded-xl mb-6 shadow-sm">
            <TextInput
              className="bg-[#faf5e0] p-3 rounded-lg mb-3 border border-gray-300"
              placeholder="¿Qué quieres compartir?"
              value={postContent}
              onChangeText={setPostContent}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${posting ? "bg-gray-400" : "bg-[#ff7e70]"}`}
                onPress={handleCreatePost}
                disabled={posting}
              >
                <Text className="text-white text-center font-bold">{posting ? "Publicando..." : "Publicar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-[#211f1e] py-3 rounded-lg"
                onPress={() => { setShowPostForm(false); setPostContent(""); }}
              >
                <Text className="text-white text-center font-bold">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loadingFeed ? (
          <ActivityIndicator size="large" color="#ff7e70" />
        ) : feedPosts.length === 0 ? (
          <View className="bg-white p-10 rounded-xl items-center">
            <Text className="text-4xl mb-3">📱</Text>
            <Text className="text-gray-500 text-center">
              No hay publicaciones en tu feed aún
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-2">
              Sigue a otros usuarios y comparte tus propias publicaciones
            </Text>
          </View>
        ) : (
          feedPosts.map((post) => {
            const isMine = post.user_id === user?.id;
            const postComments = comments.filter(
              (c) => c.target_type === "post" && c.target_id === post.id,
            );
            return (
              <TouchableOpacity
                key={post.id}
                activeOpacity={1}
                className="bg-white p-4 rounded-xl mb-3 shadow-sm"
                onPress={() => {
                  if (commentTarget?.id === post.id && commentTarget?.type === "post") {
                    setCommentTarget(null);
                    setComments([]);
                  } else {
                    setCommentTarget({ type: "post", id: post.id });
                    loadComments("post", post.id);
                  }
                }}
              >
                <TouchableOpacity
                  className="flex-row items-center gap-3 mb-3"
                  onPress={() => router.push(`/perfil/${post.user_id}`)}
                >
                  {post.owner_profile_picture ? (
                    <Image source={{ uri: post.owner_profile_picture }} className="w-10 h-10 rounded-full" />
                  ) : (
                    <View className="w-10 h-10 bg-[#ff7e70] rounded-full items-center justify-center">
                      <Text className="text-white font-bold">{post.owner_name?.[0]?.toUpperCase() || "U"}</Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-semibold text-[#211f1e]">{post.owner_name}</Text>
                    <Text className="text-gray-400 text-xs">
                      {new Date(post.created_at).toLocaleDateString("es-MX", {
                        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  {isMine && (
                    <TouchableOpacity onPress={() => handleDeletePost(post.id)}>
                      <Text className="text-[#ff7e70]">🗑️</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                <Text className="text-[#211f1e] leading-5 mb-2">{post.content}</Text>

                <View className="flex-row items-center gap-2 pt-2 border-t border-gray-100">
                  <Text className="text-gray-400 text-sm">💬 {post.comment_count}</Text>
                  <Text className="text-[#ff7e70] text-xs ml-auto">
                    {commentTarget?.id === post.id ? "Ocultar comentarios" : "Ver comentarios"}
                  </Text>
                </View>

                {commentTarget?.id === post.id && commentTarget?.type === "post" && (
                  <View className="mt-3 pt-3 border-t border-gray-100">
                    {loadingComments ? (
                      <ActivityIndicator size="small" color="#ff7e70" />
                    ) : postComments.length === 0 ? (
                      <Text className="text-gray-400 text-sm mb-2">Sin comentarios</Text>
                    ) : (
                      postComments.map((c) => (
                        <View key={c.id} className="flex-row items-start gap-2 mb-3">
                          {c.owner_profile_picture ? (
                            <Image source={{ uri: c.owner_profile_picture }} className="w-7 h-7 rounded-full" />
                          ) : (
                            <View className="w-7 h-7 bg-[#ff7e70] rounded-full items-center justify-center">
                              <Text className="text-white text-xs font-bold">{c.owner_name?.[0]?.toUpperCase() || "U"}</Text>
                            </View>
                          )}
                          <View className="flex-1 bg-[#faf5e0] p-2 rounded-lg">
                            <View className="flex-row items-center gap-2">
                              <TouchableOpacity onPress={() => router.push(`/perfil/${c.user_id}`)}>
                                <Text className="font-semibold text-xs text-[#ff7e70]">{c.owner_name}</Text>
                              </TouchableOpacity>
                              <Text className="text-gray-400 text-xs">
                                {new Date(c.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                              </Text>
                            </View>
                            <Text className="text-[#211f1e] text-sm mt-1">{c.content}</Text>
                          </View>
                        </View>
                      ))
                    )}
                    <View className="flex-row items-center gap-2 mt-2">
                      <TextInput
                        className="flex-1 bg-[#faf5e0] rounded-full px-4 py-2 text-sm border border-gray-200"
                        placeholder="Escribe un comentario..."
                        value={commentTarget?.id === post.id ? commentText : ""}
                        onChangeText={setCommentText}
                      />
                      <TouchableOpacity
                        className="bg-[#ff7e70] rounded-full w-8 h-8 items-center justify-center"
                        onPress={handleAddComment}
                        disabled={sendingComment || !commentText.trim()}
                      >
                        <Text className="text-white text-sm">{sendingComment ? "⏳" : "➤"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </>
  );

  const renderComunidadTab = () => (
    <>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { loadComunidad(); onRefresh(); }} />}
        contentContainerClassName="p-5 pb-10"
      >
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-[#211f1e]">Comunidad</Text>
          <TouchableOpacity
            className="bg-[#ff7e70] py-2 px-4 rounded-lg flex-row items-center"
            onPress={() => setComShowForm(true)}
          >
            <Text className="text-white text-lg mr-1">➕</Text>
            <Text className="text-white font-semibold">Nuevo</Text>
          </TouchableOpacity>
        </View>

        {loadingComunidad ? (
          <ActivityIndicator size="large" color="#ff7e70" />
        ) : comunidadAnnouncements.length === 0 ? (
          <View className="bg-white p-10 rounded-xl items-center">
            <Text className="text-4xl mb-3">💬</Text>
            <Text className="text-gray-500 text-center">No hay avisos todavía. ¡Sé el primero!</Text>
          </View>
        ) : (
          comunidadAnnouncements.map((item: any) => {
            const isMine = item.user_id === user?.id;
            const annComments = comments.filter(
              (c) => c.target_type === "announcement" && c.target_id === item.id,
            );
            const isCommenting = commentTarget?.id === item.id && commentTarget?.type === "announcement";
            return (
              <View key={item.id} className="bg-white p-4 rounded-xl mb-3 shadow-sm">
                <TouchableOpacity
                  className="flex-row items-start gap-3 mb-2"
                  onPress={() => router.push(`/perfil/${item.user_id}`)}
                >
                  {item.owner_profile_picture ? (
                    <Image source={{ uri: item.owner_profile_picture }} className="w-10 h-10 rounded-full" />
                  ) : (
                    <View className="w-10 h-10 bg-[#ff7e70] rounded-full items-center justify-center">
                      <Text className="text-white font-bold">{item.owner_name?.[0]?.toUpperCase() || "U"}</Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-semibold text-[#211f1e]">{item.owner_name}</Text>
                    <Text className="text-gray-400 text-xs">{new Date(item.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</Text>
                  </View>
                  {isMine && (
                    <TouchableOpacity onPress={() => handleComDelete(item.id)}>
                      <Text className="text-[#ff7e70] text-lg">🗑️</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                <View className={`self-start px-2 py-0.5 rounded-full mb-1 ${comCatColor(item.category)}`}>
                  <Text className="text-xs font-medium">{comCatIcon(item.category)} {comCatLabel(item.category)}</Text>
                </View>
                <Text className="font-bold text-lg text-[#211f1e]">{item.title}</Text>
                <Text className="text-gray-600 leading-5 mt-1">{item.content}</Text>

                <TouchableOpacity
                  className="mt-3 pt-2 border-t border-gray-100"
                  onPress={() => {
                    if (isCommenting) {
                      setCommentTarget(null);
                      setComments([]);
                    } else {
                      setCommentTarget({ type: "announcement", id: item.id });
                      loadComments("announcement", item.id);
                    }
                  }}
                >
                  <Text className="text-gray-400 text-sm">💬 {annComments.length} {isCommenting ? "Ocultar" : "Comentar"}</Text>
                </TouchableOpacity>

                {isCommenting && (
                  <View className="mt-3">
                    {loadingComments ? (
                      <ActivityIndicator size="small" color="#ff7e70" />
                    ) : annComments.length === 0 ? (
                      <Text className="text-gray-400 text-sm mb-2">Sin comentarios</Text>
                    ) : (
                      annComments.map((c) => (
                        <View key={c.id} className="flex-row items-start gap-2 mb-3">
                          {c.owner_profile_picture ? (
                            <Image source={{ uri: c.owner_profile_picture }} className="w-7 h-7 rounded-full" />
                          ) : (
                            <View className="w-7 h-7 bg-[#ff7e70] rounded-full items-center justify-center">
                              <Text className="text-white text-xs font-bold">{c.owner_name?.[0]?.toUpperCase() || "U"}</Text>
                            </View>
                          )}
                          <View className="flex-1 bg-[#faf5e0] p-2 rounded-lg">
                            <View className="flex-row items-center gap-2">
                              <TouchableOpacity onPress={() => router.push(`/perfil/${c.user_id}`)}>
                                <Text className="font-semibold text-xs text-[#ff7e70]">{c.owner_name}</Text>
                              </TouchableOpacity>
                              <Text className="text-gray-400 text-xs">
                                {new Date(c.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                              </Text>
                            </View>
                            <Text className="text-[#211f1e] text-sm mt-1">{c.content}</Text>
                          </View>
                        </View>
                      ))
                    )}
                    <View className="flex-row items-center gap-2 mt-2">
                      <TextInput
                        className="flex-1 bg-[#faf5e0] rounded-full px-4 py-2 text-sm border border-gray-200"
                        placeholder="Escribe un comentario..."
                        value={isCommenting ? commentText : ""}
                        onChangeText={setCommentText}
                      />
                      <TouchableOpacity
                        className="bg-[#ff7e70] rounded-full w-8 h-8 items-center justify-center"
                        onPress={handleAddComment}
                        disabled={sendingComment || !commentText.trim()}
                      >
                        <Text className="text-white text-sm">{sendingComment ? "⏳" : "➤"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal animationType="slide" transparent visible={comShowForm} onRequestClose={() => setComShowForm(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-[#211f1e]">Nuevo aviso</Text>
              <TouchableOpacity onPress={() => setComShowForm(false)}><Text className="text-[#211f1e] text-2xl">✕</Text></TouchableOpacity>
            </View>
            <View className="flex-row gap-2 mb-4 flex-wrap">
              {["general", "aviso", "evento", "pregunta"].map((cat) => (
                <TouchableOpacity key={cat} className={`py-2 px-4 rounded-full border-2 ${comFormCategory === cat ? "border-[#ff7e70] bg-[#ff7e70]" : "border-gray-200 bg-[#faf5e0]"}`} onPress={() => setComFormCategory(cat)}>
                  <Text className={`font-medium ${comFormCategory === cat ? "text-white" : "text-gray-600"}`}>{comCatIcon(cat)} {comCatLabel(cat)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput className="bg-[#faf5e0] p-3 rounded-lg mb-3 border border-gray-300" placeholder="Título *" value={comFormTitle} onChangeText={setComFormTitle} />
            <TextInput className="bg-[#faf5e0] p-3 rounded-lg mb-4 border border-gray-300" placeholder="Escribe tu mensaje... *" value={comFormContent} onChangeText={setComFormContent} multiline numberOfLines={4} textAlignVertical="top" />
            <View className="flex-row gap-3">
              <TouchableOpacity className={`flex-1 py-3 rounded-lg ${comPosting ? "bg-gray-400" : "bg-[#ff7e70]"}`} disabled={comPosting} onPress={handleComPost}>
                <Text className="text-white text-center font-bold">{comPosting ? "Publicando..." : "Publicar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-[#211f1e] py-3 rounded-lg" onPress={() => setComShowForm(false)}>
                <Text className="text-white text-center font-bold">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );

  return (
    <View className="flex-1 bg-[#faf5e0]">
      <View className="flex-1">
        {activeTab === "feed" && renderFeedTab()}
        {activeTab === "home" && renderHomeTab()}
        {activeTab === "comunidad" && renderComunidadTab()}
        {activeTab === "profile" && renderProfileTab()}
        {activeTab === "emergency" && renderEmergencyTab()}
      </View>
      {renderTabBar()}
      <Toast />
    </View>
  );
}
