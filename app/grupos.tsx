import { groupsService } from "@/services/groups.service";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) { router.replace("/"); return; }
    setUserId(user.user.id);
    await loadGroups();
  };

  const loadGroups = async () => {
    const result = await groupsService.getAll();
    if (result.success) {
      const enriched = await Promise.all(
        result.data.map(async (g) => {
          const members = await groupsService.getMembers(g.id);
          const isMember = userId ? await groupsService.isMember(g.id, userId) : false;
          return { ...g, memberCount: members.success ? members.data.length : 0, isMember };
        }),
      );
      setGroups(enriched);
    }
    setLoading(false);
  };

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
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#ff7e70" />
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
            <Text className="text-white text-lg mr-1">➕</Text>
            <Text className="text-white font-semibold">Crear</Text>
          </TouchableOpacity>
        </View>

        {groups.length === 0 ? (
          <View className="bg-white p-10 rounded-xl items-center">
            <Text className="text-4xl mb-3">👥</Text>
            <Text className="text-gray-500 text-center">No hay grupos aún. ¡Crea el primero!</Text>
          </View>
        ) : (
          groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              className="bg-white p-4 rounded-xl mb-3 shadow-sm"
              onPress={() => router.push(`/grupos/${group.id}`)}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-bold text-lg text-[#211f1e]">{group.name}</Text>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg ${group.isMember ? "bg-gray-300" : "bg-[#ff7e70]"}`}
                  onPress={() => handleJoinLeave(group.id, group.isMember)}
                >
                  <Text className={`font-semibold text-sm ${group.isMember ? "text-gray-600" : "text-white"}`}>
                    {group.isMember ? "Salir" : "Unirse"}
                  </Text>
                </TouchableOpacity>
              </View>
              {group.description && (
                <Text className="text-gray-600 text-sm mb-2">{group.description}</Text>
              )}
              <Text className="text-gray-400 text-xs">👥 {group.memberCount} miembros</Text>
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
                <Text className="text-[#211f1e] text-2xl">✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              className="bg-[#faf5e0] p-3 rounded-lg mb-3 border border-gray-300"
              placeholder="Nombre del grupo *"
              value={formName}
              onChangeText={setFormName}
            />
            <TextInput
              className="bg-[#faf5e0] p-3 rounded-lg mb-4 border border-gray-300"
              placeholder="Descripción (opcional)"
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
                <Text className="text-white text-center font-bold">{creating ? "Creando..." : "Crear"}</Text>
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
