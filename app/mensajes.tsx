import { messagesService } from "@/services/messages.service";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MensajesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) { router.replace("/"); return; }
    await loadConversations();
  };

  const loadConversations = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return;

    const result = await messagesService.getConversations(user.user.id);
    if (result.success) {
      setConversations(result.data);
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, []);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) {
      return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#ff7e70" />
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerClassName="p-5 bg-[#faf5e0] flex-1"
    >
      <Text className="text-2xl font-bold text-[#211f1e] mb-6">Mensajes</Text>

      {conversations.length === 0 ? (
        <View className="bg-white p-10 rounded-xl items-center">
          <Text className="text-4xl mb-3">💬</Text>
          <Text className="text-gray-500 text-center">No tienes conversaciones aún</Text>
          <Text className="text-gray-400 text-sm text-center mt-2">
            Visita un perfil público y envía un mensaje para iniciar una conversación
          </Text>
        </View>
      ) : (
        conversations.map((conv) => (
          <TouchableOpacity
            key={conv.id}
            className="bg-white p-4 rounded-xl mb-3 shadow-sm flex-row items-center"
            onPress={() => router.push(`/mensajes/${conv.id}`)}
          >
            {conv.other_user_picture ? (
              <Image source={{ uri: conv.other_user_picture }} className="w-14 h-14 rounded-full mr-3" />
            ) : (
              <View className="w-14 h-14 rounded-full bg-[#ff7e70] items-center justify-center mr-3">
                <Text className="text-xl text-white font-bold">
                  {conv.other_user_name?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-[#211f1e]">{conv.other_user_name}</Text>
                {conv.last_message_at && (
                  <Text className="text-gray-400 text-xs">{formatTime(conv.last_message_at)}</Text>
                )}
              </View>
              <Text className="text-gray-500 text-sm mt-1" numberOfLines={1}>
                {conv.last_message || "Sin mensajes aún"}
              </Text>
            </View>
            {conv.unread_count > 0 && (
              <View className="bg-[#ff7e70] rounded-full w-6 h-6 items-center justify-center ml-2">
                <Text className="text-white text-xs font-bold">{conv.unread_count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
