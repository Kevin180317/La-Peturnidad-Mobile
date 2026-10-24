import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeleton";

interface Conversation {
  id: string;
  other_user_name: string;
  other_user_picture: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_group: boolean;
}

interface MessagesTabProps {
  userId?: string;
  conversations: Conversation[];
  loading: boolean;
  refreshing: boolean;
  unreadCount: number;
  onRefresh: () => void;
  onLoadConversations: () => void;
  onDeleteConversation: (convId: string) => void;
}

export function MessagesTab({
  userId,
  conversations,
  loading,
  refreshing,
  unreadCount,
  onRefresh,
  onLoadConversations,
  onDeleteConversation,
}: MessagesTabProps) {
  const router = useRouter();

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) {
      return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  const handleDelete = (convId: string, otherUserName: string) => {
    Alert.alert("Eliminar chat", `¿Eliminar conversación con ${otherUserName}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          onDeleteConversation(convId);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#faf5e0]">
        <ListSkeleton />
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerClassName="p-4 pb-10 bg-[#faf5e0]"
    >
      {/* Header mejorado */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-[#211f1e]">Mensajes</Text>
        <Text className="text-gray-500 text-sm mt-1">
          {conversations.length === 0 ? "Inicia una conversación" : `${conversations.length} conversación${conversations.length !== 1 ? "s" : ""}`}
        </Text>
      </View>

      {conversations.length === 0 ? (
        <EmptyState
          icon="chatbubbles"
          title="No tienes conversaciones aún"
          subtitle="Visita un perfil público y envía un mensaje para iniciar una conversación"
        />
      ) : (
        conversations.map((conv) => (
          <TouchableOpacity
            key={conv.id}
            className="bg-white rounded-2xl mb-3 shadow-[0_2px_8px_rgba(33,31,30,0.06)] overflow-hidden active:bg-gray-50"
            onPress={() => router.push(`/mensajes/${conv.id}`)}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center p-4">
              {/* Avatar */}
              <View className="relative">
                {conv.other_user_picture ? (
                  <Image
                    source={{ uri: conv.other_user_picture }}
                    className="w-14 h-14 rounded-full"
                  />
                ) : (
                  <View className="w-14 h-14 rounded-full bg-gradient-to-br from-[#005e66] to-[#003d42] items-center justify-center">
                    <Text className="text-white font-bold text-xl">
                      {conv.other_user_name?.[0]?.toUpperCase() || "U"}
                    </Text>
                  </View>
                )}
                {/* Badge de no leídos en avatar */}
                {conv.unread_count > 0 && (
                  <View className="absolute -top-1 -right-1 bg-[#ff7e70] rounded-full w-6 h-6 items-center justify-center border-2 border-white">
                    <Text className="text-white text-xs font-bold">{conv.unread_count > 99 ? "99+" : conv.unread_count}</Text>
                  </View>
                )}
              </View>

              {/* Información principal */}
              <View className="flex-1 ml-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-bold text-[#211f1e] text-base flex-1">
                    {conv.other_user_name}
                  </Text>
                  <Text className="text-gray-400 text-xs ml-2 flex-shrink-0">
                    {formatTime(conv.last_message_at)}
                  </Text>
                </View>

                {/* Preview del mensaje */}
                <Text
                  className={`text-sm leading-4 ${
                    conv.unread_count > 0
                      ? "text-[#211f1e] font-semibold"
                      : "text-gray-500"
                  }`}
                  numberOfLines={2}
                >
                  {conv.last_message || "Sin mensajes aún"}
                </Text>
              </View>

              {/* Botón de eliminar */}
              <TouchableOpacity
                className="ml-3 p-2 active:bg-gray-100 rounded-lg"
                onPress={() =>
                  handleDelete(conv.id, conv.other_user_name)
                }
              >
                <Ionicons name="trash-outline" size={18} color="#ff7e70" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
