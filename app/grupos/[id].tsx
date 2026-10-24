import { Ionicons } from "@expo/vector-icons";
import { ConfirmModal } from "@/components/ConfirmModal";
import { groupsService } from "@/services/groups.service";
import { supabase } from "@/utils/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
    const { data: user } = await supabase.auth.getUser();
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
        <TouchableOpacity className="bg-[#211f1e] py-3 px-6 rounded-xl mt-4" onPress={() => router.back()}>
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerClassName="p-5 bg-[#faf5e0] grow"
      >
        <Text className="text-2xl font-bold text-[#211f1e] mb-2">{group.name}</Text>
        {group.description && (
          <Text className="text-gray-600 mb-4">{group.description}</Text>
        )}
        <View className="flex-row items-center mb-4">
          <Ionicons name="people" size={15} color="#6B7280" style={{ marginRight: 4 }} />
          <Text className="text-gray-500 text-sm">{members.length} miembros</Text>
        </View>

        {!isMember ? (
          <TouchableOpacity
            className={`bg-[#007275] py-3 rounded-xl mb-6 flex-row items-center justify-center ${busy ? "opacity-60" : ""}`}
            onPress={handleJoin}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add" size={18} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-semibold">Unirse al grupo</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              className={`flex-1 bg-[#007275] py-3 rounded-xl flex-row items-center justify-center ${openingChat ? "opacity-60" : ""}`}
              onPress={handleOpenChat}
              disabled={openingChat}
            >
              {openingChat ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="chatbubbles" size={18} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-semibold">Chat grupal</Text>
                </>
              )}
            </TouchableOpacity>
            {!isCreator && (
              <TouchableOpacity
                className="flex-1 bg-gray-300 py-3 rounded-xl flex-row items-center justify-center"
                onPress={() => setShowLeaveConfirm(true)}
                disabled={busy}
              >
                <Ionicons name="exit-outline" size={18} color="#4B5563" style={{ marginRight: 8 }} />
                <Text className="text-gray-700 font-semibold">Salir</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isCreator && (
          <TouchableOpacity
            className="bg-[#d93a3a] py-3 rounded-xl mb-6 flex-row items-center justify-center"
            onPress={() => setShowDeleteConfirm(true)}
          >
            <Ionicons name="trash" size={18} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-semibold">Eliminar grupo</Text>
          </TouchableOpacity>
        )}

        <Text className="text-lg font-bold text-[#211f1e] mb-3">Miembros</Text>
        {members.map((m) => (
          <TouchableOpacity
            key={m.id}
            className="flex-row items-center p-3 bg-white rounded-2xl mb-2 shadow-[0_4px_24px_rgba(33,31,30,0.08)]"
            onPress={() => router.push(`/perfil/${m.user_id}`)}
          >
            {m.profile_picture_url ? (
              <Image source={{ uri: m.profile_picture_url }} className="w-10 h-10 rounded-full mr-3" />
            ) : (
              <View className="w-10 h-10 bg-[#007275] rounded-full items-center justify-center mr-3">
                <Text className="text-white font-bold">{m.first_name?.[0]?.toUpperCase() || "U"}</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="font-semibold text-[#211f1e]">
                {m.first_name} {m.last_name}
              </Text>
            </View>
            {m.role === "admin" && (
              <View className="bg-[#211f1e] px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-semibold">Admin</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
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
