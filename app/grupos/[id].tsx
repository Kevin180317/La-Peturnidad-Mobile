import { groupsService } from "@/services/groups.service";
import { messagesService } from "@/services/messages.service";
import { supabase } from "@/utils/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function GrupoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, [id]);

  const init = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) { router.replace("/"); return; }
    setCurrentUserId(user.user.id);
    if (!id) return;
    const [groupRes, membersRes] = await Promise.all([
      groupsService.getById(id),
      groupsService.getMembers(id),
    ]);

    if (groupRes.success) setGroup(groupRes.data);

    if (membersRes.success) {
      const userIds = membersRes.data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name, profile_picture_url")
        .in("user_id", userIds);

      const profileMap: Record<string, any> = {};
      profiles?.forEach((p) => { profileMap[p.user_id] = p; });

      setMembers(
        membersRes.data.map((m) => ({
          ...m,
          ...profileMap[m.user_id],
        })),
      );
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#ff7e70" />
      </View>
    );
  }

  if (!group) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <Text className="text-gray-500">Grupo no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={init} />}
      contentContainerClassName="p-5 bg-[#faf5e0] flex-1"
    >
      <Text className="text-2xl font-bold text-[#211f1e] mb-2">{group.name}</Text>
      {group.description && (
        <Text className="text-gray-600 mb-4">{group.description}</Text>
      )}
      <Text className="text-gray-400 text-sm mb-4">👥 {members.length} miembros</Text>

      <TouchableOpacity
        className="bg-[#007275] py-3 rounded-lg mb-6 flex-row items-center justify-center"
        onPress={async () => {
          if (!currentUserId || !id) return;
          const userIds = members.map((m) => m.user_id);
          const r = await messagesService.getOrCreateGroupConversation(id, userIds);
          if (r.success) {
            router.push(`/mensajes/${r.data?.conversation_id}`);
          }
        }}
      >
        <Text className="text-white font-semibold mr-2">💬</Text>
        <Text className="text-white font-semibold">Chat grupal</Text>
      </TouchableOpacity>

        {group.created_by === currentUserId && (
          <TouchableOpacity
            className="bg-red-500 py-3 rounded-lg mb-6 flex-row items-center justify-center"
            onPress={() => {
              Alert.alert(
                "Eliminar grupo",
                "¿Estás seguro? Esto eliminará el grupo y el chat asociado para todos los miembros.",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                      if (!id) return;
                      const r = await groupsService.delete(id);
                      if (r.success) {
                        router.replace("/grupos");
                      } else {
                        Alert.alert("Error", r.error || "No se pudo eliminar el grupo");
                      }
                    },
                  },
                ],
              );
            }}
          >
            <Text className="text-white font-semibold mr-2">🗑️</Text>
            <Text className="text-white font-semibold">Eliminar grupo</Text>
          </TouchableOpacity>
        )}

        <Text className="text-lg font-bold text-[#211f1e] mb-3">Miembros</Text>
      {members.map((m) => (
        <TouchableOpacity
          key={m.id}
          className="flex-row items-center p-3 bg-white rounded-xl mb-2"
          onPress={() => router.push(`/perfil/${m.user_id}`)}
        >
          {m.profile_picture_url ? (
            <Image source={{ uri: m.profile_picture_url }} className="w-10 h-10 rounded-full mr-3" />
          ) : (
            <View className="w-10 h-10 bg-[#ff7e70] rounded-full items-center justify-center mr-3">
              <Text className="text-white font-bold">{m.first_name?.[0]?.toUpperCase() || "U"}</Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="font-semibold text-[#211f1e]">
              {m.first_name} {m.last_name}
            </Text>
          </View>
          {m.role === "admin" && (
            <View className="bg-[#ff7e70]/20 px-3 py-1 rounded-full">
              <Text className="text-[#ff7e70] text-xs font-semibold">Admin</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
