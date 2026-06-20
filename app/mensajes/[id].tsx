import { messagesService } from "@/services/messages.service";
import { supabase } from "@/utils/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    init();
  }, [id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages]);

  const init = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) { router.replace("/"); return; }
    setUserId(user.user.id);
    await loadMessages();
    if (id) await messagesService.markAsRead(id, user.user.id);
  };

  const loadMessages = async () => {
    if (!id) return;
    const result = await messagesService.getMessages(id);
    if (result.success) {
      setMessages(result.data);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !id || !userId) return;
    setSending(true);
    const text = input.trim();
    setInput("");

    const result = await messagesService.sendMessage(id, userId, text);
    if (result.success) {
      setMessages((prev) => [...prev, result.data]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    } else {
      Toast.show({ type: "error", text1: "Error", text2: result.error, position: "top" });
    }
    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return "Hoy";
    if (diff < 172800000) return "Ayer";
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
    <KeyboardAvoidingView
      className="flex-1 bg-[#faf5e0]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-gray-400">No hay mensajes aún</Text>
            <Text className="text-gray-400 text-sm mt-1">Envía el primer mensaje</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isMine = item.sender_id === userId;
          const showDate = index === 0 ||
            new Date(item.created_at).toDateString() !==
            new Date(messages[index - 1]?.created_at).toDateString();

          return (
            <>
              {showDate && (
                <Text className="text-center text-gray-400 text-xs my-3">
                  {formatDate(item.created_at)}
                </Text>
              )}
              <View className={`mb-3 max-w-[80%] ${isMine ? "self-end" : "self-start"}`}>
                <View
                  className={`p-3 rounded-2xl ${
                    isMine
                      ? "bg-[#ff7e70] rounded-br-md"
                      : "bg-white rounded-bl-md shadow-sm"
                  }`}
                >
                  <Text className={isMine ? "text-white" : "text-[#211f1e]"}>
                    {item.content}
                  </Text>
                </View>
                <Text className={`text-xs mt-1 text-gray-400 ${isMine ? "text-right" : "text-left"}`}>
                  {formatTime(item.created_at)}
                  {isMine && item.read_at && " ✓✓"}
                </Text>
              </View>
            </>
          );
        }}
      />

      <View className="flex-row items-center gap-2 p-3 bg-white border-t border-gray-200">
        <TextInput
          className="flex-1 bg-[#faf5e0] rounded-full px-4 py-3 border border-gray-200"
          placeholder="Escribe un mensaje..."
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          className={`w-12 h-12 rounded-full items-center justify-center ${sending || !input.trim() ? "bg-gray-300" : "bg-[#ff7e70]"}`}
          onPress={handleSend}
          disabled={sending || !input.trim()}
        >
          <Text className="text-white text-xl">{sending ? "⏳" : "➤"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
