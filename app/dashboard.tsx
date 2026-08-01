import AsyncStorage from "@react-native-async-storage/async-storage";
import { ComunidadTab } from "@/components/dashboard/ComunidadTab";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { EmergencyTab } from "@/components/dashboard/EmergencyTab";
import { FeedTab } from "@/components/dashboard/FeedTab";
import { HomeTab } from "@/components/dashboard/HomeTab";
import type { PetFormData } from "@/components/dashboard/PetForm";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { TabBar, type TabType } from "@/components/dashboard/TabBar";
import { ConfirmModal } from "@/components/ConfirmModal";
import { announcementsService } from "@/services/announcements.service";
import { commentsService } from "@/services/comments.service";
import {
  dashboardService,
  type EmergencyAlert,
  type EmergencyAlertWithOwner,
  type FoundPetWithDetails,
  type Pet,
} from "@/services/dashboard.service";
import { messagesService } from "@/services/messages.service";
import { postsService } from "@/services/posts.service";
import { supabase } from "@/utils/supabase";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, View } from "react-native";
import Toast from "react-native-toast-message";

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Estados para mascotas
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);

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

  // Estados para comunidad
  const [comunidadAnnouncements, setComunidadAnnouncements] = useState<any[]>([]);
  const [loadingComunidad, setLoadingComunidad] = useState(false);
  const [myAnnouncements, setMyAnnouncements] = useState<any[]>([]);
  const [loadingMyAnnouncements, setLoadingMyAnnouncements] = useState(false);

  // Estados para feed
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingMyPosts, setLoadingMyPosts] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Registrar token FCM nativo
  useEffect(() => {
    const initNotifications = async () => {
      try {
        const Notifications = await import("expo-notifications");

        if (user?.id) {
          registerFcmToken(Notifications);
        }
      } catch (error) {
        console.warn("Notificaciones no disponibles en este entorno:", error);
      }
    };

    initNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Recargar mensajes no leídos al volver a la pantalla
  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadUnreadCount(user.id);
    }, [user?.id]),
  );

  const loadComunidad = useCallback(async () => {
    setLoadingComunidad(true);
    const result = await announcementsService.getAll();
    if (result.success) setComunidadAnnouncements(result.data ?? []);
    setLoadingComunidad(false);
  }, []);

  const loadMyAnnouncements = useCallback(async () => {
    if (!user?.id) return;
    setLoadingMyAnnouncements(true);
    const result = await announcementsService.getMyAnnouncements(user.id);
    if (result.success) setMyAnnouncements(result.data ?? []);
    setLoadingMyAnnouncements(false);
  }, [user?.id]);

  const loadFeed = useCallback(async () => {
    if (!user?.id) return;
    setLoadingFeed(true);
    const result = await postsService.getAllPosts();
    if (result.success) setFeedPosts(result.data ?? []);
    setLoadingFeed(false);
  }, [user?.id]);

  const loadMyPosts = useCallback(async () => {
    if (!user?.id) return;
    setLoadingMyPosts(true);
    const result = await postsService.getMyPosts(user.id);
    if (result.success) setMyPosts(result.data ?? []);
    setLoadingMyPosts(false);
  }, [user?.id]);

  const handleCreatePost = async (content: string) => {
    if (!user?.id) return false;
    const result = await postsService.create({ user_id: user.id, content });
    if (result.success) {
      await loadFeed();
      await loadMyPosts();
      return true;
    }
    showToast("error", "Error", result.error);
    return false;
  };

  const handleDeletePost = async (postId: string) => {
    const result = await postsService.delete(postId);
    if (result.success) { await loadFeed(); await loadMyPosts(); }
    else showToast("error", "Error", result.error);
  };

  const loadComments = async (targetType: string, targetId: string) => {
    setLoadingComments(true);
    const result = await commentsService.getByTarget(targetType, targetId);
    if (result.success) setComments(result.data ?? []);
    setLoadingComments(false);
  };

  const handleToggleComments = (type: string, id: string) => {
    if (commentTarget?.id === id && commentTarget?.type === type) {
      setCommentTarget(null);
      setComments([]);
    } else {
      setCommentTarget({ type, id });
      loadComments(type, id);
    }
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
    if (activeTab === "comunidad") { loadComunidad(); loadMyAnnouncements(); }
    if (activeTab === "feed") { loadFeed(); loadMyPosts(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const registerFcmToken = async (Notifications: any) => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;

      const token = (await Notifications.getDevicePushTokenAsync()).data;
      await dashboardService.saveFcmToken(user.id, token);
      console.log("FCM token guardado:", token);
    } catch (error) {
      console.error("Error registering FCM token:", error);
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
          followers_count: followersRes.data?.length ?? 0,
          following_count: followingRes.data?.length ?? 0,
        });

        // Cargar mascotas automáticamente
        await loadPets(currentUser.id);

        // Cargar mensajes no leídos
        await loadUnreadCount(currentUser.id);
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

  const loadUnreadCount = async (uid: string) => {
    const result = await messagesService.getConversations(uid);
    if (result.success) {
      const totalUnread = (result.data ?? []).reduce((sum, c) => sum + c.unread_count, 0);
      setUnreadCount(totalUnread);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    await loadPets(user?.id);
    if (showAlerts && profile?.address) {
      await loadEmergencyAlerts(profile.address);
    }
    if (showMyAlerts && user?.id) await loadMyAlerts(user.id);
    if (showFoundPets && user?.id) await loadFoundPets(user.id);
    if (user?.id) await loadUnreadCount(user.id);
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAlerts, showMyAlerts, showFoundPets, profile, user]);

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

  const handlePetRegister = async (data: PetFormData) => {
    if (!data.name || !data.color || !data.size) {
      showToast("error", "Error", "Completa todos los campos obligatorios");
      return false;
    }

    if (!data.image_url) {
      showToast("error", "Error", "Debes subir una foto de la mascota");
      return false;
    }

    if (!user?.id) return false;

    const result = await dashboardService.registerPet({
      user_id: user.id,
      type: data.type,
      name: data.name,
      color: data.color,
      size: data.size,
      features: data.features,
      image_url: data.image_url,
    });

    if (result.success) {
      showToast(
        "success",
        "Mascota registrada",
        "¡Tu mascota ha sido guardada!",
      );
      await loadPets(user.id);
      return true;
    }
    showToast("error", "Error", result.error);
    return false;
  };

  const handlePetUpdate = async (petId: string, data: PetFormData) => {
    if (!data.name || !data.color || !data.size) {
      showToast("error", "Error", "Completa todos los campos obligatorios");
      return false;
    }

    const result = await dashboardService.updatePet(petId, {
      name: data.name,
      type: data.type,
      color: data.color,
      size: data.size,
      features: data.features,
      image_url: data.image_url,
    });

    if (result.success) {
      showToast("success", "Mascota actualizada", "Los cambios han sido guardados");
      await loadPets(user?.id);
      return true;
    }
    showToast("error", "Error", result.error);
    return false;
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

  const loadFoundPets = async (uid?: string) => {
    if (!uid && !user?.id) return;

    const result = await dashboardService.getFoundPetsByUser(uid || user?.id);
    if (result.success) {
      setFoundPets(result.data);
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
            }, `${profile.first_name} ${profile.last_name}`);

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

  // ============== FUNCIONES DE COMUNIDAD ==============

  const handleComPost = async (title: string, content: string, category: string) => {
    if (!title.trim() || !content.trim()) {
      showToast("error", "Completa todos los campos");
      return false;
    }
    const r = await announcementsService.create({ user_id: user?.id || "", title, content, category: category as any });
    if (r.success) {
      showToast("success", "Publicado");
      await loadComunidad();
      await loadMyAnnouncements();
      return true;
    }
    showToast("error", "Error", r.error);
    return false;
  };

  const handleComDelete = async (id: string) => {
    const r = await announcementsService.delete(id);
    if (r.success) { loadComunidad(); loadMyAnnouncements(); showToast("success", "Eliminado"); }
    else showToast("error", "Error", r.error);
  };

  // ============== FUNCIONES DE CUENTA ==============

  const handleLogout = () => {
    setLogoutVisible(true);
  };

  const handleLogoutConfirm = async () => {
    setSigningOut(true);
    const result = await dashboardService.signOut();
    setSigningOut(false);
    if (result.success) {
      setLogoutVisible(false);
      try {
        await AsyncStorage.removeItem("hasSeenOnboarding");
      } catch (error) {
        console.warn("Error borrando onboarding:", error);
      }
      router.replace("/");
      showToast(
        "success",
        "¡Hasta luego!",
        "Has cerrado sesión correctamente",
      );
    } else {
      showToast("error", "Error", result.error);
    }
  };

  // ============== HANDLERS DE TABS ==============

  const handleToggleSelectingPet = () => {
    setSelectingPetForAlert(!selectingPetForAlert);
    setShowAlerts(false);
    setShowMyAlerts(false);
    setShowFoundPets(false);
  };

  const handleToggleAlerts = () => {
    if (!showAlerts && profile?.address) {
      loadEmergencyAlerts(profile.address);
    }
    setShowAlerts(!showAlerts);
    setSelectingPetForAlert(false);
    setShowMyAlerts(false);
    setShowFoundPets(false);
  };

  const handleToggleMyAlerts = () => {
    loadMyAlerts(user?.id);
    setShowMyAlerts(!showMyAlerts);
    setSelectingPetForAlert(false);
    setShowAlerts(false);
    setShowFoundPets(false);
  };

  const handleToggleFoundPets = () => {
    loadFoundPets(user?.id);
    setShowFoundPets(!showFoundPets);
    setSelectingPetForAlert(false);
    setShowAlerts(false);
    setShowMyAlerts(false);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <View className="flex-1 bg-[#faf5e0]">
      <View className="flex-1">
        {activeTab === "feed" && (
          <FeedTab
            userId={user?.id}
            feedPosts={feedPosts}
            myPosts={myPosts}
            loadingFeed={loadingFeed}
            loadingMyPosts={loadingMyPosts}
            refreshing={refreshing}
            comments={comments}
            commentTarget={commentTarget}
            commentText={commentText}
            loadingComments={loadingComments}
            sendingComment={sendingComment}
            onRefresh={onRefresh}
            onLoadFeed={loadFeed}
            onLoadMyPosts={loadMyPosts}
            onToggleComments={handleToggleComments}
            onChangeComment={setCommentText}
            onAddComment={handleAddComment}
            onCreatePost={handleCreatePost}
            onDeletePost={handleDeletePost}
          />
        )}
        {activeTab === "home" && (
          <HomeTab
            profileName={profile?.first_name}
            pets={pets}
            loadingPets={loadingPets}
            myAlerts={myAlerts}
            foundPets={foundPets}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onLoadPets={() => loadPets(user?.id)}
            onOpenSearch={() => router.push("/buscar")}
            onRegisterPet={handlePetRegister}
            onUpdatePet={handlePetUpdate}
            onDeletePet={handleDeletePet}
          />
        )}
        {activeTab === "comunidad" && (
          <ComunidadTab
            userId={user?.id}
            announcements={comunidadAnnouncements}
            myAnnouncements={myAnnouncements}
            loadingAnnouncements={loadingComunidad}
            loadingMyAnnouncements={loadingMyAnnouncements}
            refreshing={refreshing}
            comments={comments}
            commentTarget={commentTarget}
            commentText={commentText}
            loadingComments={loadingComments}
            sendingComment={sendingComment}
            onRefresh={onRefresh}
            onLoadAnnouncements={loadComunidad}
            onLoadMyAnnouncements={loadMyAnnouncements}
            onToggleComments={handleToggleComments}
            onChangeComment={setCommentText}
            onAddComment={handleAddComment}
            onCreateAnnouncement={handleComPost}
            onDeleteAnnouncement={handleComDelete}
          />
        )}
        {activeTab === "profile" && (
          <ProfileTab
            profile={profile}
            email={email}
            userId={user?.id}
            petsCount={pets.length}
            unreadCount={unreadCount}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onLogout={handleLogout}
            onGoComunidad={() => setActiveTab("comunidad")}
            onProfileUpdated={loadUserData}
          />
        )}
        {activeTab === "emergency" && (
          <EmergencyTab
            pets={pets}
            emergencyAlerts={emergencyAlerts}
            myAlerts={myAlerts}
            foundPets={foundPets}
            loadingAlerts={loadingAlerts}
            refreshing={refreshing}
            selectingPetForAlert={selectingPetForAlert}
            showAlerts={showAlerts}
            showMyAlerts={showMyAlerts}
            showFoundPets={showFoundPets}
            onRefresh={onRefresh}
            onLoadPets={() => loadPets(user?.id)}
            onToggleSelectingPet={handleToggleSelectingPet}
            onLoadEmergencyAlerts={() => {
              if (profile?.address) loadEmergencyAlerts(profile.address);
            }}
            onToggleAlerts={handleToggleAlerts}
            onLoadMyAlerts={() => loadMyAlerts(user?.id)}
            onToggleMyAlerts={handleToggleMyAlerts}
            onLoadFoundPets={() => loadFoundPets(user?.id)}
            onToggleFoundPets={handleToggleFoundPets}
            onCreateAlert={handleCreateEmergencyAlert}
            onFoundPet={handleFoundPet}
            onDeleteAlert={handleDeleteAlert}
            onGoHome={() => setActiveTab("home")}
          />
        )}
      </View>
      <TabBar activeTab={activeTab} onSelect={setActiveTab} />
      <ConfirmModal
        visible={logoutVisible}
        title="Cerrar sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
        confirmLabel="Cerrar sesión"
        loading={signingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutVisible(false)}
      />
      <Toast />
    </View>
  );
}
