import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeleton";
import { groupsService } from "@/services/groups.service";
import { supabase } from "@/utils/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
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

  // init corre una sola vez al montar (deps estables intencionales)
  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const enriched = await Promise.all(
        (result.data ?? []).map(async (g) => {
          const members = await groupsService.getMembers(g.id);
          const isMember = uid_or_state ? await groupsService.isMember(g.id, uid_or_state) : false;
          return { ...g, memberCount: members.data?.length ?? 0, isMember };
        }),
      );
      setGroups(enriched);
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

  const handleJoinLeave = async (groupId: string, isMember: boolean) => {
    if (!userId) return;
    if (isMember) {
      const r = await groupsService.leave(groupId, userId);
      if (r.success) await loadGroups();
    } else {
      const r = await groupsService.join(groupId, userId);
      if (r.success) await loadGroups();
    }
  };

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
            className="bg-[#ff7e70] py-2 px-4 rounded-lg flex-row items-center"
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
              className="bg-white p-4 rounded-xl mb-3 shadow-sm"
              onPress={() => router.push(`/grupos/${group.id}`)}
              onLongPress={() => {
                if (group.created_by !== userId) return;
                Alert.alert(
                  "Eliminar grupo",
                  `¿Eliminar "${group.name}" permanentemente?`,
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Eliminar",
                      style: "destructive",
                      onPress: async () => {
                        const r = await groupsService.delete(group.id);
                        if (r.success) await loadGroups();
                        else Alert.alert("Error", r.error || "No se pudo eliminar");
                      },
                    },
                  ],
                );
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-bold text-lg text-[#211f1e]">{group.name}</Text>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg ${group.isMember ? "bg-gray-300" : "bg-[#ff7e70]"}`}
                  onPress={() => handleJoinLeave(group.id, group.isMember)}
                >
                  <Text className={`font-semibold text-sm ${group.isMember ? "text-gray-700" : "text-white"}`}>
                    {group.isMember ? "Salir" : "Unirse"}
                  </Text>
                </TouchableOpacity>
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
              className="bg-white p-3 rounded-lg mb-3 border border-gray-300 text-[#211f1e]"
              placeholder="Nombre del grupo *"
              placeholderTextColor="#9BA1A6"
              value={formName}
              onChangeText={setFormName}
            />
            <TextInput
              className="bg-white p-3 rounded-lg mb-4 border border-gray-300 text-[#211f1e]"
              placeholder="Descripción (opcional)"
              placeholderTextColor="#9BA1A6"
              value={formDesc}
              onChangeText={setFormDesc}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${creating ? "bg-gray-400" : "bg-[#ff7e70]"}`}
                disabled={creating}
                onPress={handleCreate}
              >
                <Text className={`text-center font-bold ${creating ? "text-gray-700" : "text-white"}`}>{creating ? "Creando..." : "Crear"}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-[#211f1e] py-3 rounded-lg" onPress={() => setShowForm(false)}>
                <Text className="text-white text-center font-bold">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
