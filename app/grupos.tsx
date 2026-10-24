import { Ionicons } from "@expo/vector-icons";
import { ConfirmModal } from "@/components/ConfirmModal";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeleton";
import { groupsService } from "@/services/groups.service";
import { supabase } from "@/utils/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function GruposScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<{ id: string; name: string } | null>(null);

  const init = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) { router.replace("/"); return; }
    setUserId(user.user.id);
    await loadGroups(user.user.id);
  };

  const loadGroups = useCallback(async (uid?: string) => {
    const uid_or_state = uid || userId;
    const result = await groupsService.getAll();
    if (result.success) {
      const list = result.data ?? [];
      // Una sola consulta a group_members para conteos y membresía (evita N+1)
      const summary = await groupsService.getMembershipSummary(
        list.map((g) => g.id),
        uid_or_state ?? null,
      );
      if (!summary.success) {
        Toast.show({ type: "error", text1: "Error", text2: summary.error, position: "top" });
      }
      const counts = summary.data?.counts ?? {};
      const memberOf = new Set(summary.data?.memberOf ?? []);
      setGroups(
        list.map((g) => ({
          ...g,
          memberCount: counts[g.id] ?? 0,
          isMember: memberOf.has(g.id),
        })),
      );
    } else {
      Toast.show({ type: "error", text1: "Error al cargar grupos", text2: result.error, position: "top" });
    }
    setLoading(false);
  }, [userId]);

  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      if (userId) loadGroups(userId);
    }, [userId, loadGroups]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!formName.trim() || !userId) return;
    setCreating(true);
    const result = await groupsService.create({
      name: formName.trim(),
      description: formDesc.trim() || undefined,
      created_by: userId,
    });
    if (result.success) {
      Toast.show({ type: "success", text1: "Grupo creado", position: "top", visibilityTime: 2000 });
      setShowForm(false);
      setFormName("");
      setFormDesc("");
      await loadGroups();
    } else {
      Toast.show({ type: "error", text1: "Error", text2: result.error, position: "top" });
    }
    setCreating(false);
  };

  const handleJoin = async (groupId: string) => {
    if (!userId || pendingId) return;
    setPendingId(groupId);
    const r = await groupsService.join(groupId, userId);
    if (r.success) {
      Toast.show({ type: "success", text1: "Te uniste al grupo", position: "top", visibilityTime: 2000 });
      await loadGroups();
    } else {
      Toast.show({ type: "error", text1: "No se pudo unir", text2: r.error, position: "top" });
    }
    setPendingId(null);
  };

  const handleLeaveConfirm = async () => {
    if (!userId || !leaveTarget || pendingId) return;
    const groupId = leaveTarget.id;
    setPendingId(groupId);
    const r = await groupsService.leave(groupId, userId);
    if (r.success) {
      setLeaveTarget(null);
      Toast.show({ type: "success", text1: "Saliste del grupo", position: "top", visibilityTime: 2000 });
      await loadGroups();
    } else {
      Toast.show({ type: "error", text1: "No se pudo salir", text2: r.error, position: "top" });
    }
    setPendingId(null);
  };

  // init corre una sola vez al montar (deps estables intencionales)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar: el setState ocurre tras la consulta async
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-[#faf5e0]">
        <ListSkeleton withAvatar={false} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#faf5e0]">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerClassName="p-5 pb-10"
      >
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-[#211f1e]">Grupos</Text>
          <TouchableOpacity
            className="bg-[#007275] py-2 px-4 rounded-xl flex-row items-center"
            onPress={() => setShowForm(true)}
          >
            <Ionicons name="add" size={20} color="white" style={{ marginRight: 6 }} />
            <Text className="text-white font-semibold">Crear</Text>
          </TouchableOpacity>
        </View>

        {groups.length === 0 ? (
          <EmptyState
            icon="people"
            title="No hay grupos aún"
            subtitle="¡Crea el primero y reúne a tu colonia!"
            actionLabel="Crear grupo"
            onAction={() => setShowForm(true)}
          />
        ) : (
          groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              className="bg-white p-4 rounded-2xl mb-3 shadow-[0_4px_24px_rgba(33,31,30,0.08)]"
              onPress={() => router.push(`/grupos/${group.id}`)}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-bold text-lg text-[#211f1e] flex-1 mr-2">{group.name}</Text>
                {group.created_by === userId ? (
                  <View className="bg-[#211f1e] px-3 py-1 rounded-full">
                    <Text className="text-white text-xs font-semibold">Creador</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    className={`px-4 py-2 rounded-xl min-w-[72px] items-center ${group.isMember ? "bg-gray-300" : "bg-[#007275]"} ${pendingId === group.id ? "opacity-60" : ""}`}
                    disabled={!!pendingId}
                    onPress={() =>
                      group.isMember
                        ? setLeaveTarget({ id: group.id, name: group.name })
                        : handleJoin(group.id)
                    }
                  >
                    {pendingId === group.id ? (
                      <ActivityIndicator size="small" color={group.isMember ? "#4B5563" : "#fff"} />
                    ) : (
                      <Text className={`font-semibold text-sm ${group.isMember ? "text-gray-700" : "text-white"}`}>
                        {group.isMember ? "Salir" : "Unirse"}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              {group.description && (
                <Text className="text-gray-600 text-sm mb-2">{group.description}</Text>
              )}
              <Text className="text-gray-500 text-xs flex-row items-center">
                <Ionicons name="people" size={13} color="#6B7280" style={{ marginRight: 3 }} />
                {group.memberCount} miembros
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!leaveTarget}
        icon="exit-outline"
        title="Salir del grupo"
        message={`¿Seguro que quieres salir de "${leaveTarget?.name ?? ""}"?`}
        confirmLabel="Salir"
        loading={!!pendingId}
        onConfirm={handleLeaveConfirm}
        onCancel={() => setLeaveTarget(null)}
      />

      <Modal animationType="slide" transparent visible={showForm} onRequestClose={() => setShowForm(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-[#211f1e]">Crear grupo</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color="#211f1e" />
              </TouchableOpacity>
            </View>
            <TextInput
              className={`bg-white p-3 rounded-lg mb-3 text-[#211f1e] ${nameFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-300"}`}
              placeholder="Nombre del grupo *"
              placeholderTextColor="#9BA1A6"
              value={formName}
              onChangeText={setFormName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
            <TextInput
              className={`bg-white p-3 rounded-lg mb-4 text-[#211f1e] ${descFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-300"}`}
              placeholder="Descripción (opcional)"
              placeholderTextColor="#9BA1A6"
              value={formDesc}
              onChangeText={setFormDesc}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              onFocus={() => setDescFocused(true)}
              onBlur={() => setDescFocused(false)}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl ${creating ? "bg-gray-400" : "bg-[#007275]"}`}
                disabled={creating}
                onPress={handleCreate}
              >
                <Text className={`text-center font-bold ${creating ? "text-gray-700" : "text-white"}`}>{creating ? "Creando..." : "Crear"}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-[#211f1e] py-3 rounded-xl" onPress={() => setShowForm(false)}>
                <Text className="text-white text-center font-bold">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
