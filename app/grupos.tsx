import { CARD, Chip, EmptyCard, Field, PrimaryButton, ScreenTitle, Sheet } from "@/components/kit/Kit";
import { Ionicons } from "@expo/vector-icons";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ListSkeleton } from "@/components/Skeleton";
import { groupsService } from "@/services/groups.service";
import { supabase } from "@/utils/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
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
        <ScreenTitle
          title="Grupos"
          subtitle="Organízate con tu colonia"
          right={
            <TouchableOpacity
              className="bg-[#007275] py-2.5 pl-3 pr-4 rounded-full flex-row items-center gap-1.5 shadow-[0_4px_12px_rgba(0,114,117,0.3)]"
              activeOpacity={0.85}
              onPress={() => setShowForm(true)}
              accessibilityRole="button"
            >
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white font-semibold">Crear</Text>
            </TouchableOpacity>
          }
        />

        {groups.length === 0 ? (
          <EmptyCard icon="people-outline" title="No hay grupos aún" text="¡Crea el primero y reúne a tu colonia!">
            <TouchableOpacity className="bg-[#007275] py-2.5 px-5 rounded-full mt-4" onPress={() => setShowForm(true)}>
              <Text className="text-white font-semibold">Crear grupo</Text>
            </TouchableOpacity>
          </EmptyCard>
        ) : (
          groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              className={`${CARD} p-4 mb-3`}
              activeOpacity={0.85}
              onPress={() => router.push(`/grupos/${group.id}`)}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-[#007275]/10 items-center justify-center mr-3">
                  <Ionicons name="people" size={22} color="#007275" />
                </View>
                <View className="flex-1 mr-2">
                  <Text className="font-bold text-base text-[#211f1e]" numberOfLines={1}>{group.name}</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">{group.memberCount} miembros</Text>
                </View>
                {group.created_by === userId ? (
                  <Chip icon="star" text="Creador" tone="dark" />
                ) : (
                  <TouchableOpacity
                    className={`px-4 h-9 rounded-full min-w-[80px] items-center justify-center ${group.isMember ? "bg-gray-100" : "bg-[#007275]"} ${pendingId === group.id ? "opacity-60" : ""}`}
                    disabled={!!pendingId}
                    onPress={() =>
                      group.isMember ? setLeaveTarget({ id: group.id, name: group.name }) : handleJoin(group.id)
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
              {!!group.description && (
                <Text className="text-gray-600 text-sm leading-5 mt-3">{group.description}</Text>
              )}
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

      <Sheet visible={showForm} title="Crear grupo" onClose={() => setShowForm(false)} closeDisabled={creating}>
        <Field label="Nombre *" icon="people-outline" placeholder="Nombre del grupo" value={formName} onChangeText={setFormName} />
        <Field
          label="Descripción"
          placeholder="Descripción (opcional)"
          value={formDesc}
          onChangeText={setFormDesc}
          multiline
          numberOfLines={3}
        />
        <PrimaryButton title={creating ? "Creando..." : "Crear grupo"} icon="add" loading={creating} onPress={handleCreate} />
      </Sheet>
    </View>
  );
}
