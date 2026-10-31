import { Ionicons } from "@expo/vector-icons";
import { Avatar, CARD, EmptyCard, RoundIconButton } from "@/components/kit/Kit";
import { Skeleton } from "@/components/Skeleton";
import { formatShortTime } from "@/utils/format";
import { Text, TouchableOpacity, View } from "react-native";

export interface ConversationItem {
  id: string;
  other_user_name: string;
  other_user_picture: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_group: boolean;
}

// Lista de conversaciones compartida por la pestaña Mensajes del dashboard y la pantalla /mensajes
export function ConversationList({
  conversations,
  onOpen,
  onDelete,
}: {
  conversations: ConversationItem[];
  onOpen: (conv: ConversationItem) => void;
  onDelete: (conv: ConversationItem) => void;
}) {
  if (conversations.length === 0) {
    return (
      <EmptyCard
        icon="chatbubbles-outline"
        title="No tienes conversaciones aún"
        text="Visita un perfil público y envía un mensaje para iniciar una conversación"
      />
    );
  }

  return (
    <View className={`${CARD} overflow-hidden`}>
      {conversations.map((conv, i) => {
        const unread = conv.unread_count > 0;
        return (
          <TouchableOpacity
            key={conv.id}
            className={`flex-row items-center px-4 py-3.5 ${i > 0 ? "border-t border-gray-100" : ""}`}
            activeOpacity={0.7}
            onPress={() => onOpen(conv)}
            onLongPress={() => onDelete(conv)}
            accessibilityRole="button"
            accessibilityLabel={`Abrir chat con ${conv.other_user_name}`}
          >
            {conv.is_group ? (
              <View className="w-[52px] h-[52px] rounded-full bg-[#007275]/10 items-center justify-center">
                <Ionicons name="people" size={24} color="#007275" />
              </View>
            ) : (
              <Avatar uri={conv.other_user_picture} name={conv.other_user_name} size={52} ring={unread} />
            )}
            <View className="flex-1 ml-3">
              <View className="flex-row items-center">
                <Text className="font-bold text-[#211f1e] text-[15px] flex-1" numberOfLines={1}>
                  {conv.other_user_name}
                </Text>
                <Text className={`text-xs ml-2 ${unread ? "text-[#007275] font-semibold" : "text-gray-500"}`}>
                  {formatShortTime(conv.last_message_at)}
                </Text>
              </View>
              <View className="flex-row items-center mt-1">
                <Text
                  className={`text-sm flex-1 ${unread ? "text-[#211f1e] font-semibold" : "text-gray-500"}`}
                  numberOfLines={1}
                >
                  {conv.last_message || "Sin mensajes aún"}
                </Text>
                {unread && (
                  <View className="bg-[#ff7e70] rounded-full min-w-[22px] h-[22px] px-1.5 items-center justify-center ml-2">
                    <Text className="text-white text-[11px] font-bold">
                      {conv.unread_count > 99 ? "99+" : conv.unread_count}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View className="ml-2">
              <RoundIconButton
                icon="trash-outline"
                tint="red"
                size={32}
                onPress={() => onDelete(conv)}
                label={`Eliminar chat con ${conv.other_user_name}`}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function ConversationListSkeleton() {
  return (
    <View className={`${CARD} overflow-hidden`} testID="conversations-skeleton">
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} className={`flex-row items-center px-4 py-3.5 ${i > 0 ? "border-t border-gray-100" : ""}`}>
          <Skeleton className="w-[52px] h-[52px] rounded-full" />
          <View className="flex-1 ml-3 gap-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </View>
        </View>
      ))}
    </View>
  );
}
