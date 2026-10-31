import { confirmDialog } from "@/components/ConfirmDialog";
import { useRouter } from "expo-router";
import { RefreshControl, ScrollView } from "react-native";
import { ScreenTitle } from "@/components/kit/Kit";
import {
  ConversationList,
  ConversationListSkeleton,
  type ConversationItem,
} from "@/components/messages/ConversationList";

interface MessagesTabProps {
  userId?: string;
  conversations: ConversationItem[];
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

  const handleDelete = (convId: string, otherUserName: string) => {
    confirmDialog({
      title: "Eliminar chat",
      message: `¿Eliminar conversación con ${otherUserName}?`,
      confirmLabel: "Eliminar",
      destructive: true,
      onConfirm: async () => {
        onDeleteConversation(convId);
      },
    });
  };

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerClassName="p-5 pb-10"
    >
      <ScreenTitle
        title="Mensajes"
        subtitle={
          loading
            ? "Cargando conversaciones..."
            : conversations.length === 0
              ? "Inicia una conversación"
              : `${conversations.length} conversación${conversations.length !== 1 ? "es" : ""}${unreadCount > 0 ? ` · ${unreadCount} sin leer` : ""}`
        }
      />
      {loading ? (
        <ConversationListSkeleton />
      ) : (
        <ConversationList
          conversations={conversations}
          onOpen={(conv) => router.push(`/mensajes/${conv.id}`)}
          onDelete={(conv) => handleDelete(conv.id, conv.other_user_name)}
        />
      )}
    </ScrollView>
  );
}
