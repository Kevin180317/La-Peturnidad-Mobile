import { Avatar, CARD, Chip, ListSection, PrimaryButton } from "@/components/kit/Kit";
import { Ionicons } from "@expo/vector-icons";
import { ConfirmModal } from "@/components/ConfirmModal";
import { groupsService } from "@/services/groups.service";
import { supabase } from "@/utils/supabase";
import { getCurrentUser } from "@/utils/session";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function GrupoDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadGroup = async () => {
    if (!id) return;
    const [groupRes, membersRes] = await Promise.all([
      groupsService.getById(id),
      groupsService.getMembers(id),
    ]);

    if (groupRes.success) setGroup(groupRes.data);
    else setGroup(null);

    if (membersRes.success) {
      const memberRows = membersRes.data ?? [];
      const userIds = memberRows.map((m) => m.user_id);
      const profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("user_id, first_name, last_name, profile_picture_url")
          .in("user_id", userIds);
        profiles?.forEach((p) => { profileMap[p.user_id] = p; });
      }

      setMembers(
        memberRows.map((m) => ({
          ...m,
          ...profileMap[m.user_id],
        })),
      );
    } else {
      Toast.show({ type: "error", text1: "Error", text2: membersRes.error, position: "top" });
    }
  };

  const init = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    const { data: user } = await getCurrentUser();
    if (!user?.user) { router.replace("/"); return; }
    setCurrentUserId(user.user.id);
    await loadGroup();
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGroup();
    setRefreshing(false);
  };

  const isMember = !!currentUserId && members.some((m) => m.user_id === currentUserId);
  const isCreator = !!currentUserId && group?.created_by === currentUserId;

  const handleJoin = async () => {
    if (!currentUserId || !id || busy) return;
    setBusy(true);
    const r = await groupsService.join(id, currentUserId);
    if (r.success) {
      Toast.show({ type: "success", text1: "Te uniste al grupo", position: "top", visibilityTime: 2000 });
      await loadGroup();
    } else {
      Toast.show({ type: "error", text1: "No se pudo unir", text2: r.error, position: "top" });
    }
    setBusy(false);
  };

  const handleLeave = async () => {
    if (!currentUserId || !id || busy) return;
    setBusy(true);
    const r = await groupsService.leave(id, currentUserId);
    if (r.success) {
      setShowLeaveConfirm(false);
      Toast.show({ type: "success", text1: "Saliste del grupo", position: "top", visibilityTime: 2000 });
      await loadGroup();
    } else {
      Toast.show({ type: "error", text1: "No se pudo salir", text2: r.error, position: "top" });
    }
    setBusy(false);
  };

  const handleOpenChat = async () => {
    if (!id || openingChat) return;
    setOpeningChat(true);
    const r = await groupsService.getGroupChat(id);
    setOpeningChat(false);
    if (!r.success) {
      Toast.show({ type: "error", text1: "No se pudo abrir el chat", text2: r.error, position: "top" });
      return;
    }
    if (r.data?.conversation_id) router.push(`/mensajes/${r.data.conversation_id}`);
  };

  const handleDelete = async () => {
    if (!id || deleting) return;
    setDeleting(true);
    const r = await groupsService.delete(id);
    setDeleting(false);
    if (r.success) {
      setShowDeleteConfirm(false);
      Toast.show({ type: "success", text1: "Grupo eliminado", position: "top", visibilityTime: 2000 });
      router.replace("/grupos");
    } else {
      Toast.show({ type: "error", text1: "No se pudo eliminar el grupo", text2: r.error, position: "top" });
    }
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

  if (!id || !group) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0] p-5">
        <View className="w-16 h-16 rounded-full bg-[#211f1e]/10 items-center justify-center mb-3">
          <Ionicons name="people-outline" size={32} color="#211f1e" />
        </View>
        <Text className="text-gray-500 text-center">Grupo no encontrado</Text>
        <TouchableOpacity className="bg-[#007275] py-2.5 px-6 rounded-full mt-4" onPress={() => router.back()}>
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="bg-[#faf5e0]"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerClassName="p-5 pb-10 grow"
      >
        <View className={`${CARD} items-center px-5 pt-6 pb-5 mb-6`}>
          <View className="w-20 h-20 rounded-3xl bg-[#007275]/10 items-center justify-center">
            <Ionicons name="people" size={38} color="#007275" />
          </View>
          <Text className="text-xl font-bold text-[#211f1e] mt-3 text-center">{group.name}</Text>
          {!!group.description && (
            <Text className="text-gray-600 text-sm text-center leading-5 mt-1.5">{group.description}</Text>
          )}
          <View className="mt-3">
            <Chip icon="people" text={`${members.length} miembros`} tone="teal" />
          </View>

          <View className="w-full mt-5">
            {!isMember ? (
              <PrimaryButton title="Unirse al grupo" icon="person-add" onPress={handleJoin} loading={busy} />
            ) : (
              <View className="flex-row gap-3">
                <PrimaryButton title="Chat grupal" icon="chatbubbles" onPress={handleOpenChat} loading={openingChat} className="flex-1" />
                {!isCreator && (
                  <PrimaryButton
                    title="Salir"
                    icon="exit-outline"
                    variant="ghost"
                    onPress={() => setShowLeaveConfirm(true)}
                    disabled={busy}
                    className="flex-1"
                  />
                )}
              </View>
            )}
            {isCreator && (
              <PrimaryButton
                title="Eliminar grupo"
                icon="trash-outline"
                variant="danger"
                onPress={() => setShowDeleteConfirm(true)}
                className="mt-3"
              />
            )}
          </View>
        </View>

        <ListSection title="Miembros">
          {members.map((m, i) => (
            <TouchableOpacity
              key={m.id}
              className={`flex-row items-center px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
              activeOpacity={0.7}
              onPress={() => router.push(`/perfil/${m.user_id}`)}
            >
              <Avatar uri={m.profile_picture_url} name={m.first_name} size={44} ring={false} />
              <Text className="flex-1 ml-3 font-semibold text-[#211f1e] text-[15px]">
                {m.first_name} {m.last_name}
              </Text>
              {m.role === "admin" && <Chip icon="star" text="Admin" tone="dark" />}
              <Ionicons name="chevron-forward" size={18} color="#C4C4C4" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          ))}
        </ListSection>
      </ScrollView>

      <ConfirmModal
        visible={showLeaveConfirm}
        icon="exit-outline"
        title="Salir del grupo"
        message={`¿Seguro que quieres salir de "${group.name}"? Dejarás de ver el chat grupal.`}
        confirmLabel="Salir"
        loading={busy}
        onConfirm={handleLeave}
        onCancel={() => setShowLeaveConfirm(false)}
      />

      <ConfirmModal
        visible={showDeleteConfirm}
        destructive
        icon="trash-outline"
        title="Eliminar grupo"
        message="¿Estás seguro? Esto eliminará el grupo y el chat asociado para todos los miembros."
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
