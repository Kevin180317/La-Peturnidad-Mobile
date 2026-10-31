import { confirmDialog } from "@/components/ConfirmDialog";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { EmergencyTab } from "@/components/dashboard/EmergencyTab";
import { FeedTab } from "@/components/dashboard/FeedTab";
import { HomeTab } from "@/components/dashboard/HomeTab";
import { MessagesTab } from "@/components/dashboard/MessagesTab";
import type { PetFormData } from "@/components/dashboard/PetForm";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { TabBar, type TabType } from "@/components/dashboard/TabBar";
import { FAB } from "@/components/FAB";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { PostFormData } from "@/components/PostForm";
import { announcementsService } from "@/services/announcements.service";
import { authService } from "@/services/auth.service";
import { commentsService } from "@/services/comments.service";
import {
  dashboardService,
  type EmergencyAlertWithOwner,
  type FoundPetWithDetails,
  type MyEmergencyAlert,
  type Pet,
} from "@/services/dashboard.service";
import { followsService } from "@/services/follows.service";
import { messagesService } from "@/services/messages.service";
import { notificationsService } from "@/services/notifications.service";
import { FEED_PAGE_SIZE, postsService } from "@/services/posts.service";
import { reportsService } from "@/services/reports.service";
import { toLocalDateString } from "@/utils/format";
import { supabase } from "@/utils/supabase";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Solo se usan para el deep link (tab / alertId); la identidad sale siempre de la sesión
  const params = useLocalSearchParams();

  // Estados generales
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsUnread, setNotificationsUnread] = useState(0);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  // Estados para mensajes
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

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
  const [myAlerts, setMyAlerts] = useState<MyEmergencyAlert[]>([]);
  const [showMyAlerts, setShowMyAlerts] = useState(false);
  const [foundPets, setFoundPets] = useState<FoundPetWithDetails[]>([]);
  const [showFoundPets, setShowFoundPets] = useState(false);

  // Estados para comunidad
  const [comunidadAnnouncements, setComunidadAnnouncements] = useState<any[]>([]);
  const [loadingComunidad, setLoadingComunidad] = useState(false);

  // Estados para feed
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [loadingMoreFeed, setLoadingMoreFeed] = useState(false);
  const loadingMoreFeedRef = useRef(false);

  // Estados para comentarios
  const [commentTarget, setCommentTarget] = useState<{ type: string; id: string } | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const isModerator = profile?.role === "moderator" || profile?.role === "admin";

  const showToast = useCallback(
    (type: "success" | "error" | "info", text1: string, text2?: string) => {
      Toast.show({ type, text1, text2, position: "top", visibilityTime: 3000 });
    },
    [],
  );

  const loadComunidad = useCallback(async () => {
    setLoadingComunidad(true);
    const result = await announcementsService.getAll();
    if (result.success) setComunidadAnnouncements(result.data ?? []);
    setLoadingComunidad(false);
  }, []);

  const loadFeed = useCallback(async () => {
    if (!user?.id) return;
    setLoadingFeed(true);
    const result = await postsService.getAllPosts();
    if (result.success) {
      setFeedPosts(result.data ?? []);
      setFeedHasMore((result.data?.length ?? 0) >= FEED_PAGE_SIZE);
    }
    setLoadingFeed(false);
  }, [user?.id]);

  // Siguiente página del feed (scroll infinito); la ref evita pedir la misma página dos veces seguidas
  const loadMoreFeed = async () => {
    const last = feedPosts[feedPosts.length - 1];
    if (!feedHasMore || loadingMoreFeedRef.current || !last) return;
    loadingMoreFeedRef.current = true;
    setLoadingMoreFeed(true);
    const result = await postsService.getAllPosts(last.created_at);
    if (result.success) {
      const page = result.data ?? [];
      setFeedPosts((current) => [...current, ...page.filter((p) => !current.some((c) => c.id === p.id))]);
      setFeedHasMore(page.length >= FEED_PAGE_SIZE);
    }
    setLoadingMoreFeed(false);
    loadingMoreFeedRef.current = false;
  };

  const handleCreatePost = async (data: PostFormData) => {
    if (!user?.id) return false;

    if (data.type === "announcements") {
      const r = await announcementsService.create({
        user_id: user.id,
        title: data.title ?? "",
        content: data.content,
        category: data.category ?? "general",
      });
      if (r.success) {
        showToast("success", "Publicado");
        await loadComunidad();
        return true;
      }
      showToast("error", "Error", r.error);
      return false;
    }

    // Social: la imagen se sube primero; si falla no se crea el post
    let imageUrl: string | null = null;
    if (data.image) {
      const upload = await dashboardService.uploadImage(data.image, "posts");
      if (!upload.success || !upload.url) {
        showToast("error", "No se pudo subir la imagen", upload.error);
        return false;
      }
      imageUrl = upload.url;
    }

    const result = await postsService.create({
      user_id: user.id,
      content: data.content,
      image_url: imageUrl,
    });

    if (result.success) {
      await loadFeed();
      return true;
    }
    // El post no se creó: la imagen ya subida queda huérfana, se borra
    await dashboardService.removeImageByUrl(imageUrl, "posts");
    showToast("error", "Error", result.error);
    return false;
  };

  const handleDeletePost = (post: { id: string; image_url?: string | null }) => {
    confirmDialog({
      title: "Eliminar publicación",
      message: "¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      destructive: true,
      onConfirm: async () => {
        const result = await postsService.delete(post.id, post.image_url);
        if (result.success) {
          showToast("success", "Publicación eliminada");
          await loadFeed();
        } else {
          showToast("error", "Error", result.error);
        }
      },
    });
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

  const handleDeleteComment = (commentId: string) => {
    confirmDialog({
      title: "Eliminar comentario",
      message: "¿Estás seguro de que quieres eliminar este comentario?",
      confirmLabel: "Eliminar",
      destructive: true,
      onConfirm: async () => {
        const result = await commentsService.delete(commentId);
        if (result.success) {
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          await loadFeed();
        } else {
          showToast("error", "Error", result.error);
        }
      },
    });
  };

  const registerFcmToken = async (Notifications: any) => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;

      const token = (await Notifications.getDevicePushTokenAsync()).data;
      await dashboardService.saveFcmToken(token);
    } catch (error) {
      console.error("Error registering FCM token:", error);
    }
  };

  // El skeleton solo se muestra en la carga inicial (loading arranca en true);
  // las recargas posteriores (refresh, foto de perfil) no desmontan la pantalla
  const loadUserData = async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.replace("/");
        return;
      }

      setUser(currentUser);

      // Siempre el usuario de la sesión: los params de ruta se pueden falsear por deep link
      const profileResult = await dashboardService.getProfileByUserId(
        currentUser.id,
      );

      if (profileResult.success && profileResult.data) {
        const [followersRes, followingRes] = await Promise.all([
          followsService.getFollowers(currentUser.id),
          followsService.getFollowing(currentUser.id),
        ]);

        setProfile({
          ...profileResult.data,
          followers_count: followersRes.data?.length ?? 0,
          following_count: followingRes.data?.length ?? 0,
        });

        const [, , , , , blockedRes] = await Promise.all([
          loadPets(currentUser.id),
          loadUnreadCount(currentUser.id),
          loadNotificationsUnread(currentUser.id),
          loadMyAlerts(currentUser.id),
          loadFoundPets(currentUser.id),
          reportsService.getBlockedUsers(currentUser.id),
        ]);
        if (blockedRes.success) setBlockedUserIds(blockedRes.data ?? []);
      } else {
        setProfile(null);
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
      setConversations(result.data ?? []);
    }
  };

  const loadNotificationsUnread = async (uid: string) => {
    setNotificationsUnread(await notificationsService.getUnreadCount(uid));
  };

  const loadConversations = useCallback(async () => {
    const uid = user?.id;
    if (!uid) return;
    setLoadingConversations(true);
    const result = await messagesService.getConversations(uid);
    if (result.success) {
      setConversations(result.data ?? []);
      const totalUnread = (result.data ?? []).reduce((sum, c) => sum + c.unread_count, 0);
      setUnreadCount(totalUnread);
    }
    setLoadingConversations(false);
  }, [user?.id]);

  const handleDeleteConversation = async (convId: string) => {
    if (!user?.id) return;
    const result = await messagesService.deleteConversation(convId, user.id);
    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      showToast("success", "Chat eliminado");
      await loadUnreadCount(user.id);
    } else {
      showToast("error", "Error", result.error);
    }
  };

  // ============== FUNCIONES DE MASCOTAS ==============

  const loadPets = async (uid?: string) => {
    const id = uid || user?.id;
    if (!id) return;

    setLoadingPets(true);
    const result = await dashboardService.getPets(id);
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
      showToast("error", "Error", "Agrega una foto de la mascota");
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
    const pet = pets.find((p) => p.id === petId);
    const hasActiveAlert = myAlerts.some(
      (a) => a.pet_id === petId && a.status === "active",
    );
    confirmDialog({
      title: "Eliminar mascota",
      message: hasActiveAlert
        ? "Esta mascota tiene una alerta de emergencia activa: se cerrará y dejará de mostrarse a tus vecinos. ¿Eliminar la mascota? Esta acción no se puede deshacer."
        : "¿Estás seguro de que quieres eliminar esta mascota? Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      destructive: true,
      onConfirm: async () => {
        const result = await dashboardService.deletePet(petId, pet?.image_url);
        if (result.success) {
          showToast(
            "success",
            "Mascota eliminada",
            "La mascota ha sido eliminada",
          );
          await loadPets(user?.id);
          if (hasActiveAlert) {
            await loadMyAlerts(user?.id);
            if (profile?.address) await loadEmergencyAlerts(profile.address);
          }
        } else {
          showToast("error", "Error", result.error);
        }
      },
    });
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
    const id = uid || user?.id;
    if (!id) return;

    const result = await dashboardService.getUserEmergencyAlerts(id);
    if (result.success) {
      setMyAlerts(result.data);
    } else {
      showToast("error", "Error", result.error);
    }
  };

  const loadFoundPets = async (uid?: string) => {
    const id = uid || user?.id;
    if (!id) return;

    const result = await dashboardService.getFoundPetsByUser(id);
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

    if (myAlerts.some((a) => a.pet_id === pet.id && a.status === "active")) {
      showToast("error", "Ya reportada", `${pet.name} ya tiene una alerta activa`);
      return;
    }

    confirmDialog({
      title: "Crear alerta de emergencia",
      icon: "megaphone-outline",
      message: `¿Estás seguro de que quieres reportar a ${pet.name} como perdido? Esta alerta será visible para todos los vecinos de tu colonia.`,
      confirmLabel: "Sí, crear alerta",
      onConfirm: async () => {
        const result = await dashboardService.createEmergencyAlert({
          user_id: user.id,
          pet_id: pet.id,
          pet_name: pet.name,
          type: pet.type,
          description: `Mascota perdida: ${pet.name}. Color: ${pet.color}, Tamaño: ${pet.size}. ${pet.features || ""}`,
          last_seen_location: profile.address,
          disappearance_date: toLocalDateString(),
          image_url: pet.image_url,
        });

        if (result.success) {
          if (result.notified) {
            showToast("success", "Alerta creada", "Se ha notificado a los vecinos");
          } else {
            showToast("success", "Alerta publicada", "Tus vecinos la verán en la app");
          }
          setSelectingPetForAlert(false);
          await loadMyAlerts(user.id);
          if (profile?.address) {
            await loadEmergencyAlerts(profile.address);
          }
        } else {
          showToast("error", "Error", result.error);
        }
      },
    });
  };

  const handleDeleteAlert = async (alertId: string) => {
    confirmDialog({
      title: "Eliminar alerta",
      message: "¿Estás seguro de que quieres eliminar esta alerta? Tu mascota ya no aparecerá como perdida.",
      confirmLabel: "Eliminar",
      destructive: true,
      onConfirm: async () => {
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
    });
  };

  const handleResolveAlert = async (alertId: string) => {
    confirmDialog({
      title: "Mascota encontrada",
      icon: "heart-outline",
      message: "¿Ya apareció tu mascota? La alerta dejará de mostrarse a tus vecinos.",
      confirmLabel: "Sí, ya apareció",
      onConfirm: async () => {
        const result = await dashboardService.resolveEmergencyAlert(alertId);
        if (result.success) {
          showToast("success", "¡Qué alegría!", "La alerta fue cerrada");
          await loadMyAlerts(user?.id);
          if (profile?.address) await loadEmergencyAlerts(profile.address);
        } else {
          showToast("error", "Error", result.error);
        }
      },
    });
  };

  const handleFoundPet = async (alert: EmergencyAlertWithOwner) => {
    if (!user?.id) return;

    if (alert.user_id === user.id) {
      showToast("error", "Es tu alerta", "Usa \"Ya apareció\" en Mis alertas");
      return;
    }

    confirmDialog({
      title: "Reportar mascota encontrada",
      icon: "checkmark-circle-outline",
      message: `¿Has encontrado a ${alert.pet_name}? Avisaremos al dueño para que se ponga en contacto contigo.`,
      confirmLabel: "Sí, lo encontré",
      onConfirm: async () => {
        const result = await dashboardService.reportFoundPet(alert, user.id);

        if (result.success) {
          showToast(
            "success",
            "¡Gracias!",
            result.notified
              ? `El dueño de ${alert.pet_name} fue notificado`
              : "Tu aviso quedó registrado para el dueño",
          );
          await loadFoundPets(user.id);
        } else {
          showToast("error", "No se pudo reportar", result.error);
          if (result.error === "La alerta ya no está activa" && profile?.address) {
            await loadEmergencyAlerts(profile.address);
          }
        }
      },
    });
  };

  // ============== FUNCIONES DE COMUNIDAD ==============

  const handleComDelete = (id: string) => {
    confirmDialog({
      title: "Eliminar anuncio",
      message: "¿Estás seguro de que quieres eliminar este anuncio? Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      destructive: true,
      onConfirm: async () => {
        const r = await announcementsService.delete(id);
        if (r.success) {
          showToast("success", "Eliminado");
          await loadComunidad();
        } else {
          showToast("error", "Error", r.error);
        }
      },
    });
  };

  // ============== FUNCIONES DE CUENTA ==============

  const handleLogout = () => {
    setLogoutVisible(true);
  };

  const handleLogoutConfirm = async () => {
    setSigningOut(true);
    if (user?.id) await dashboardService.removeDeviceToken(user.id);
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

  const handleDeleteAccountConfirm = async () => {
    setDeletingAccount(true);
    const result = await authService.deleteAccount();
    setDeletingAccount(false);
    if (result.success) {
      setDeleteAccountVisible(false);
      try {
        await AsyncStorage.removeItem("hasSeenOnboarding");
      } catch (error) {
        console.warn("Error borrando onboarding:", error);
      }
      router.replace("/");
      showToast("success", "Cuenta eliminada", "Tus datos fueron borrados");
    } else {
      showToast("error", "No se pudo eliminar la cuenta", result.error);
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

  // Datos de la pestaña Feed (posts, anuncios y emergencias de mi colonia)
  const loadFeedTabData = async () => {
    await Promise.all([
      loadFeed(),
      loadComunidad(),
      profile?.address ? loadEmergencyAlerts(profile.address) : Promise.resolve(),
    ]);
  };

  const onRefreshFeed = async () => {
    setRefreshing(true);
    await loadFeedTabData();
    setRefreshing(false);
  };

  // Cargar datos iniciales
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar: el setState ocurre tras la consulta async
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
  }, []);

  // Registrar token FCM nativo
  useEffect(() => {
    const initNotifications = async () => {
      // Expo Go (SDK 53+) no soporta push remotas en Android: requiere build de desarrollo
      if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
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
  }, [user?.id]);

  // Recargar mensajes no leídos al volver a la pantalla
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadUnreadCount(user.id);
        loadNotificationsUnread(user.id);
      }
    }, [user?.id]),
  );

  useEffect(() => {
    if (activeTab === "feed") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- recarga al cambiar de pestaña: el setState ocurre tras la consulta async
      loadFeedTabData();
    }
    if (activeTab === "messages") { loadConversations(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de pestaña
  }, [activeTab]);

  // Deep link de notificaciones: abre Emergencia y muestra la alerta (mía o de un vecino)
  const handledAlertRef = useRef<string | null>(null);
  useEffect(() => {
    const alertId = typeof params.alertId === "string" ? params.alertId : null;
    if (loading || !user?.id) return;
    if (params.tab !== "emergency" && !alertId) return;
    const key = alertId ?? "emergency";
    if (handledAlertRef.current === key) return;
    handledAlertRef.current = key;

    setActiveTab("emergency");
    const open = async () => {
      const mine = await dashboardService.getUserEmergencyAlerts(user.id);
      if (mine.success) setMyAlerts(mine.data as MyEmergencyAlert[]);
      if (alertId && mine.data.some((a) => a.id === alertId)) {
        setShowMyAlerts(true);
      } else if (profile?.address) {
        setShowAlerts(true);
        await loadEmergencyAlerts(profile.address);
      }
    };
    open();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacciona solo a los params del deep link y al fin de la carga
  }, [params.alertId, params.tab, loading, user?.id, profile?.address]);

  // loadUserData ya recarga mascotas, alertas propias, encontradas y no leídos
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    if (showAlerts && profile?.address) {
      await loadEmergencyAlerts(profile.address);
    }
    if (activeTab === "messages") await loadConversations();
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- las funciones de carga se recrean en cada render
  }, [showAlerts, profile, user, activeTab]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#faf5e0]" style={{ paddingTop: insets.top }}>
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#faf5e0]" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View className="flex-1">
        {activeTab === "home" && (
          <HomeTab
            profileName={profile?.first_name}
            pets={pets}
            loadingPets={loadingPets}
            myAlerts={myAlerts.filter((a) => a.status === "active")}
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
        {activeTab === "feed" && (
          <FeedTab
            userId={user?.id}
            isModerator={isModerator}
            blockedUserIds={blockedUserIds}
            feedPosts={feedPosts}
            announcements={comunidadAnnouncements}
            emergencyAlerts={emergencyAlerts}
            loadingFeed={loadingFeed}
            loadingMoreFeed={loadingMoreFeed}
            onLoadMoreFeed={loadMoreFeed}
            loadingAnnouncements={loadingComunidad}
            loadingAlerts={loadingAlerts}
            refreshing={refreshing}
            comments={comments}
            commentTarget={commentTarget}
            commentText={commentText}
            loadingComments={loadingComments}
            sendingComment={sendingComment}
            onRefresh={onRefreshFeed}
            onToggleComments={handleToggleComments}
            onChangeComment={setCommentText}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            onCreatePost={handleCreatePost}
            onDeletePost={handleDeletePost}
            onDeleteAnnouncement={handleComDelete}
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
            onResolveAlert={handleResolveAlert}
            onGoHome={() => setActiveTab("home")}
          />
        )}
        {activeTab === "messages" && (
          <MessagesTab
            userId={user?.id}
            conversations={conversations}
            loading={loadingConversations}
            refreshing={refreshing}
            unreadCount={unreadCount}
            onRefresh={onRefresh}
            onLoadConversations={loadConversations}
            onDeleteConversation={handleDeleteConversation}
          />
        )}
        {activeTab === "profile" && (
          <ProfileTab
            profile={profile}
            email={user?.email ?? ""}
            userId={user?.id}
            petsCount={pets.length}
            unreadCount={unreadCount}
            notificationsUnread={notificationsUnread}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onLogout={handleLogout}
            onDeleteAccount={() => setDeleteAccountVisible(true)}
            onGoComunidad={() => setActiveTab("feed")}
            onProfileUpdated={loadUserData}
          />
        )}
      </View>
      {activeTab === "messages" && (
        <FAB
          icon="add-circle"
          onPress={() => router.push("/buscar")}
          backgroundColor="#007275"
          color="#fff"
          position="bottom-right"
        />
      )}
      <TabBar activeTab={activeTab} onSelect={setActiveTab} unreadCount={unreadCount} />
      <ConfirmModal
        visible={logoutVisible}
        title="Cerrar sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
        confirmLabel="Cerrar sesión"
        loading={signingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutVisible(false)}
      />
      <ConfirmModal
        visible={deleteAccountVisible}
        destructive
        title="Eliminar cuenta"
        message="Se borrarán tu perfil, mascotas, alertas, publicaciones y mensajes. Esta acción no se puede deshacer."
        confirmLabel="Eliminar cuenta"
        icon="trash-outline"
        loading={deletingAccount}
        onConfirm={handleDeleteAccountConfirm}
        onCancel={() => setDeleteAccountVisible(false)}
      />
    </View>
  );
}
