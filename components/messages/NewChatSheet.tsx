import { FollowingList } from "@/components/FollowingList";
import { Sheet } from "@/components/kit/Kit";
import { messagesService } from "@/services/messages.service";
import { type UserSearchResult } from "@/services/search.service";
import { getCurrentUser } from "@/utils/session";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";
import Toast from "react-native-toast-message";

/** Hoja "Nuevo mensaje" (botón +): a quienes sigues; tocar abre (o crea) el chat 1:1. */
export function NewChatSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();

  const open = async (u: UserSearchResult) => {
    const { data } = await getCurrentUser();
    const me = data?.user?.id;
    if (!me) return;
    const r = await messagesService.getOrCreateConversation(me, u.user_id);
    if (!r.success) {
      Toast.show({ type: "error", text1: "No se pudo abrir el chat", text2: r.error, position: "top" });
      return;
    }
    if (!r.data) return;
    onClose();
    router.push(`/mensajes/${r.data.conversation_id}`);
  };

  return (
    <Sheet visible={visible} title="Nuevo mensaje" onClose={onClose}>
      <ScrollView style={{ maxHeight: 400 }}>
        <FollowingList
          showTitle={false}
          emptyText="Aún no sigues a nadie. Sigue a alguien para escribirle."
          onSelect={open}
        />
      </ScrollView>
    </Sheet>
  );
}
