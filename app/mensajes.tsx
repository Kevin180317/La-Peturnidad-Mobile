import { confirmDialog } from "@/components/ConfirmDialog";
import { messagesService } from "@/services/messages.service";
import { getCurrentUser } from "@/utils/session";
import { RoundIconButton, ScreenTitle } from "@/components/kit/Kit";
import { NewChatSheet } from "@/components/messages/NewChatSheet";
import { ConversationList, ConversationListSkeleton } from "@/components/messages/ConversationList";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";

export default function MensajesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [newChat, setNewChat] = useState(false);

  const init = async () => {
    const { data: user } = await getCurrentUser();
    if (!user?.user) { router.replace("/"); return; }
    setUserId(user.user.id);
    await loadConversations();
  };

  const loadConversations = useCallback(async () => {
    const { data: user } = await getCurrentUser();
    if (!user?.user) return;

    const result = await messagesService.getConversations(user.user.id);
    if (result.success) {
      setConversations(result.data ?? []);
    }
    setLoading(false);
  }, []);

  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      loadConversations();
    }, [loadConversations]),
  );

  const handleDelete = (convId: string) => {
    confirmDialog({
      title: "Eliminar chat",
      message: "¿Eliminar esta conversación?",
      confirmLabel: "Eliminar",
      destructive: true,
      onConfirm: async () => {
        if (!userId) return;
        const r = await messagesService.deleteConversation(convId);
        if (r.success) {
          setConversations((prev) => prev.filter((c) => c.id !== convId));
        }
      },
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // init corre una sola vez al montar (deps estables intencionales)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar: el setState ocurre tras la consulta async
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView
      className="bg-[#faf5e0]"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerClassName="p-5 pb-10"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <ScreenTitle title="Mensajes" subtitle="Mantén presionado un chat para eliminarlo" />
        </View>
        <RoundIconButton icon="add" tint="solid" size={44} label="Nuevo mensaje" onPress={() => setNewChat(true)} />
      </View>
      <NewChatSheet visible={newChat} onClose={() => setNewChat(false)} />
      {loading ? (
        <ConversationListSkeleton />
      ) : (
        <ConversationList
          conversations={conversations}
          onOpen={(conv) => router.push(`/mensajes/${conv.id}`)}
          onDelete={(conv) => handleDelete(conv.id)}
        />
      )}
    </ScrollView>
  );
}
