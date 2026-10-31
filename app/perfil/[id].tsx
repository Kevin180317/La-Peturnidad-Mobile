import { Ionicons } from "@expo/vector-icons";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Avatar, CARD, Chip, EmptyCard, ListRow, ListSection, PetThumb, PrimaryButton, SectionTitle } from "@/components/kit/Kit";
import { followsService } from "@/services/follows.service";
import { messagesService } from "@/services/messages.service";
import { petsService } from "@/services/pets.service";
import { profileService } from "@/services/profile.service";
import { reportsService } from "@/services/reports.service";
import { getCurrentUser } from "@/utils/session";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const REPORT_REASONS = [
  "Spam",
  "Contenido inapropiado",
  "Acoso",
  "Suplantación",
  "Otro",
];

export default function PublicProfileScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const loadProfile = async (uid: string) => {
    if (!id) return;
    const [profileResult, petsResult, following, countsRes, blockedRes] = await Promise.all([
      profileService.getByUserId(id),
      petsService.getAll(id),
      uid !== id ? followsService.isFollowing(uid, id) : Promise.resolve(false),
      followsService.getCounts(id),
      uid !== id
        ? reportsService.getBlockedUsers(uid)
        : Promise.resolve({ success: true, data: [] as string[] }),
    ]);

    if (profileResult.success && profileResult.data) {
      setProfile(profileResult.data);
    }
    if (petsResult.success) setPets(petsResult.data ?? []);
    setIsFollowing(following);
    if (countsRes.success && countsRes.data) {
      setFollowersCount(countsRes.data.followers);
      setFollowingCount(countsRes.data.following);
    }
    setIsBlocked((blockedRes.data ?? []).includes(id));
  };

  const init = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    const { data: user } = await getCurrentUser();
    if (!user?.user) { router.replace("/"); return; }
    setCurrentUserId(user.user.id);
    await loadProfile(user.user.id);
    setLoading(false);
  };

  // Pull-to-refresh: no toca `loading` para no desmontar la pantalla
  const onRefresh = async () => {
    if (!currentUserId) return;
    setRefreshing(true);
    await loadProfile(currentUserId);
    setRefreshing(false);
  };

  const handleFollow = async () => {
    if (!currentUserId || !id || followBusy) return;
    setFollowBusy(true);
    if (isFollowing) {
      const r = await followsService.unfollow(currentUserId, id);
      if (r.success) {
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
      } else {
        Toast.show({ type: "error", text1: "Error", text2: r.error, position: "top" });
      }
    } else {
      const r = await followsService.follow(currentUserId, id);
      if (r.success) {
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
      } else {
        Toast.show({ type: "error", text1: "Error", text2: r.error, position: "top" });
      }
    }
    setFollowBusy(false);
  };

  const handleMessage = async () => {
    if (!currentUserId || !id || messaging) return;
    setMessaging(true);
    const r = await messagesService.getOrCreateConversation(currentUserId, id);
    setMessaging(false);
    if (!r.success) {
      // p. ej. 'No puedes enviar mensajes a este usuario' (bloqueo en cualquier sentido)
      Toast.show({
        type: "error",
        text1: "No se pudo abrir el chat",
        text2: r.error,
        position: "top",
      });
      return;
    }
    if (r.data?.conversation_id) router.push(`/mensajes/${r.data.conversation_id}`);
  };

  const openReport = () => {
    setShowMenu(false);
    setReportReason(null);
    setShowReport(true);
  };

  const openBlockConfirm = () => {
    setShowMenu(false);
    setShowBlockConfirm(true);
  };

  const handleReport = async () => {
    if (!currentUserId || !id || !reportReason || reporting) return;
    setReporting(true);
    const r = await reportsService.create({
      reporter_id: currentUserId,
      target_user_id: id,
      reason: reportReason,
    });
    setReporting(false);
    if (r.success) {
      setShowReport(false);
      Toast.show({
        type: "success",
        text1: "Reporte enviado",
        text2: "Gracias, nuestro equipo lo revisará.",
        position: "top",
      });
    } else {
      Toast.show({ type: "error", text1: "No se pudo enviar el reporte", text2: r.error, position: "top" });
    }
  };

  const handleBlockToggle = async () => {
    if (!currentUserId || !id || blocking) return;
    setBlocking(true);
    if (isBlocked) {
      const r = await reportsService.unblockUser(currentUserId, id);
      if (r.success) {
        setIsBlocked(false);
        Toast.show({ type: "success", text1: "Usuario desbloqueado", position: "top" });
      } else {
        Toast.show({ type: "error", text1: "Error", text2: r.error, position: "top" });
      }
    } else {
      const r = await reportsService.blockUser(currentUserId, id);
      if (r.success) {
        setIsBlocked(true);
        if (isFollowing) {
          const u = await followsService.unfollow(currentUserId, id);
          if (u.success) {
            setIsFollowing(false);
            setFollowersCount((c) => Math.max(0, c - 1));
          }
        }
        Toast.show({ type: "success", text1: "Usuario bloqueado", position: "top" });
      } else {
        Toast.show({ type: "error", text1: "Error", text2: r.error, position: "top" });
      }
    }
    setBlocking(false);
    setShowBlockConfirm(false);
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  // init corre al montar o cambiar id (recarga intencional)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar: el setState ocurre tras la consulta async
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#007275" />
      </View>
    );
  }

  if (!id || !profile) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0] p-5">
        <View className="w-16 h-16 rounded-full bg-[#211f1e]/10 items-center justify-center mb-3">
          <Ionicons name="person-remove-outline" size={32} color="#211f1e" />
        </View>
        <Text className="text-gray-500 text-center">Perfil no encontrado</Text>
        <TouchableOpacity className="bg-[#007275] py-2.5 px-6 rounded-full mt-4" onPress={() => router.back()}>
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initial = profile.first_name?.[0]?.toUpperCase() || "U";
  const isOwn = currentUserId === id;
  const userRole: string | null = profile.role ?? null;

  return (
    <>
      {!isOwn && (
        <Stack.Screen
          options={{
            headerRight: () => (
              <TouchableOpacity
                onPress={() => setShowMenu(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Más opciones"
              >
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </TouchableOpacity>
            ),
          }}
        />
      )}
      <ScrollView
        className="bg-[#faf5e0]"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerClassName="p-5 pb-10 grow"
      >
        {/* Cabecera */}
        <View className={`${CARD} items-center px-5 pt-6 pb-5 mb-6`}>
          <Avatar uri={profile.profile_picture_url} name={initial} size={108} />
          <Text className="text-xl font-bold text-[#211f1e] mt-3 text-center">
            {profile.first_name} {profile.last_name}
          </Text>
          <View className="flex-row flex-wrap justify-center gap-1.5 mt-2">
            {!!profile.city && <Chip icon="location" text={profile.city} tone="teal" />}
            {userRole && (userRole === "moderator" || userRole === "admin") && (
              <Chip icon="shield-checkmark" text={userRole === "admin" ? "Administrador" : "Moderador"} tone="dark" />
            )}
          </View>

          <View className="flex-row w-full mt-5 pt-4 border-t border-gray-100">
            <Stat value={pets.length} label="Mascotas" />
            <Stat value={followersCount} label="Seguidores" onPress={() => router.push(`/seguidores?id=${id}&tab=followers`)} />
            <Stat value={followingCount} label="Siguiendo" onPress={() => router.push(`/seguidores?id=${id}&tab=following`)} />
          </View>

          <View className="w-full mt-5">
            {isOwn ? (
              <PrimaryButton title="Editar perfil" icon="pencil" onPress={() => router.push("/editar-perfil")} />
            ) : isBlocked ? (
              <View className="bg-gray-100 h-[52px] rounded-full flex-row items-center justify-center gap-2">
                <Ionicons name="ban" size={18} color="#4B5563" />
                <Text className="text-gray-700 font-semibold">Usuario bloqueado</Text>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <PrimaryButton
                  title={isFollowing ? "Siguiendo" : "Seguir"}
                  icon={isFollowing ? "checkmark" : "person-add"}
                  variant={isFollowing ? "ghost" : "teal"}
                  onPress={handleFollow}
                  loading={followBusy}
                  className="flex-1"
                />
                <PrimaryButton
                  title="Mensaje"
                  icon="chatbubble-outline"
                  variant="ghost"
                  onPress={handleMessage}
                  loading={messaging}
                  className="flex-1"
                />
              </View>
            )}
          </View>
        </View>

        <SectionTitle icon="paw" title="Mascotas" />
        {pets.length === 0 ? (
          <EmptyCard icon="paw-outline" text="Sin mascotas registradas" />
        ) : (
          pets.map((pet) => (
            <View key={pet.id} className={`${CARD} p-3 mb-3 flex-row items-center`}>
              <PetThumb uri={pet.image_url} type={pet.type} className="w-[72px] h-[72px] rounded-2xl" iconSize={32} />
              <View className="flex-1 ml-3">
                <Text className="font-bold text-lg text-[#211f1e]" numberOfLines={1}>{pet.name}</Text>
                <View className="flex-row flex-wrap gap-1.5 mt-1.5">
                  {!!pet.type && <Chip text={pet.type} tone="teal" />}
                  {!!pet.color && <Chip text={pet.color} />}
                  {!!pet.size && <Chip text={pet.size} />}
                </View>
              </View>
            </View>
          ))
        )}

        <ListSection className="mt-3">
          <ListRow first icon="sparkles-outline" label="Miembro desde" value={formatDate(profile.created_at)} />
        </ListSection>
      </ScrollView>

      {/* Menú ⋯: reportar / bloquear */}
      <Modal animationType="fade" transparent visible={showMenu} onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} className="bg-white rounded-t-[32px] px-5 pt-3 pb-8">
            <View className="w-10 h-1.5 rounded-full bg-gray-300 self-center mb-3" />
            <TouchableOpacity className="flex-row items-center py-4" onPress={openReport}>
              <Ionicons name="flag-outline" size={22} color="#211f1e" />
              <Text className="ml-3 text-base font-semibold text-[#211f1e]">Reportar usuario</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center py-4" onPress={openBlockConfirm}>
              <Ionicons name={isBlocked ? "lock-open-outline" : "ban"} size={22} color="#d93a3a" />
              <Text className="ml-3 text-base font-semibold text-[#d93a3a]">
                {isBlocked ? "Desbloquear usuario" : "Bloquear usuario"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-100 h-[52px] justify-center rounded-full mt-2" onPress={() => setShowMenu(false)}>
              <Text className="text-gray-700 text-center font-semibold">Cancelar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Reporte con motivo */}
      <Modal
        animationType="slide"
        transparent
        visible={showReport}
        onRequestClose={() => { if (!reporting) setShowReport(false); }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[32px] px-5 pt-3 pb-8">
            <View className="w-10 h-1.5 rounded-full bg-gray-300 self-center mb-3" />
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xl font-bold text-[#211f1e]">Reportar usuario</Text>
              <TouchableOpacity onPress={() => setShowReport(false)} disabled={reporting}>
                <Ionicons name="close" size={24} color="#211f1e" />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-500 mb-4">¿Por qué quieres reportar a este usuario?</Text>
            {REPORT_REASONS.map((reason) => {
              const selected = reportReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  className={`flex-row items-center p-3.5 rounded-2xl mb-2 border-[1.5px] ${selected ? "border-[#007275] bg-[#007275]/10" : "border-gray-200"}`}
                  onPress={() => setReportReason(reason)}
                >
                  <Ionicons
                    name={selected ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={selected ? "#007275" : "#6B7280"}
                  />
                  <Text className="ml-3 text-[#211f1e]">{reason}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              className={`h-[52px] rounded-full mt-3 flex-row items-center justify-center ${!reportReason || reporting ? "bg-gray-300" : "bg-[#007275]"}`}
              onPress={handleReport}
              disabled={!reportReason || reporting}
            >
              {reporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className={`text-center font-bold ${!reportReason ? "text-gray-700" : "text-white"}`}>
                  Enviar reporte
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={showBlockConfirm}
        destructive={!isBlocked}
        icon={isBlocked ? "lock-open-outline" : "ban"}
        title={isBlocked ? "Desbloquear usuario" : "Bloquear usuario"}
        message={
          isBlocked
            ? "Podrá volver a enviarte mensajes y verás su contenido de nuevo."
            : "No podrá enviarte mensajes y dejarás de ver su contenido en la comunidad."
        }
        confirmLabel={isBlocked ? "Desbloquear" : "Bloquear"}
        loading={blocking}
        onConfirm={handleBlockToggle}
        onCancel={() => setShowBlockConfirm(false)}
      />
    </>
  );
}

function Stat({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  const body = (
    <>
      <Text className="text-xl font-bold text-[#211f1e]">{value}</Text>
      <Text className="text-gray-500 text-xs mt-0.5">{label}</Text>
    </>
  );
  if (!onPress) return <View className="flex-1 items-center">{body}</View>;
  return (
    <TouchableOpacity className="flex-1 items-center" activeOpacity={0.6} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Ver ${label.toLowerCase()}`}>
      {body}
    </TouchableOpacity>
  );
}
