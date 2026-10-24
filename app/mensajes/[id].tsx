import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/EmptyState";
import { messagesService } from "@/services/messages.service";
import { type Message } from "@/types";
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

// Agrega o reemplaza un mensaje por id (evita duplicados entre envío propio y realtime)
function upsertMessage(list: Message[], msg: Message): Message[] {
  const idx = list.findIndex((m) => m.id === msg.id);
  if (idx === -1) return [...list, msg];
  const next = [...list];
  next[idx] = { ...next[idx], ...msg };
  return next;
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isGroup, setIsGroup] = useState(false);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [inputFocused, setInputFocused] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages]);

  const init = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) { router.replace("/"); return; }
    const uid = user.user.id;
    if (!id) { setUnavailable(true); setLoading(false); return; }

    // RLS solo devuelve la conversación si soy participante
    const { data: conv, error } = await supabase
      .from("conversations")
      .select("id, group_id")
      .eq("id", id)
      .maybeSingle();
    if (error || !conv) {
      setUnavailable(true);
      setLoading(false);
      return;
    }

    setIsGroup(!!conv.group_id);
    const result = await messagesService.getMessages(id);
    if (result.success) {
      setMessages(result.data ?? []);
    } else {
      Toast.show({ type: "error", text1: "Error", text2: result.error, position: "top" });
    }
    setUserId(uid);
    setLoading(false);
    await messagesService.markAsRead(id, uid);
  };

  const handleSend = async () => {
    if (!input.trim() || !id || !userId) return;
    setSending(true);
    const text = input.trim();
    setInput("");

    const result = await messagesService.sendMessage(id, userId, text);
    if (!result.success) {
      // Restaura el texto para que el usuario no lo pierda
      setInput((current) => current || text);
      Toast.show({ type: "error", text1: "No se pudo enviar", text2: result.error, position: "top" });
    } else if (result.data) {
      const sent = result.data;
      setMessages((prev) => upsertMessage(prev, sent));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    }
    setSending(false);
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/mensajes");
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

  // init corre al montar o cambiar id (recarga intencional)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar: el setState ocurre tras la consulta async
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Mensajes en tiempo real de esta conversación
  useEffect(() => {
    if (!id || !userId) return;
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => upsertMessage(prev, msg));
          if (msg.sender_id !== userId) {
            messagesService.markAsRead(id, userId);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? upsertMessage(prev, msg) : prev));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, userId]);

  // En grupos, carga el nombre de remitentes que aún no conocemos (incluye mensajes nuevos)
  useEffect(() => {
    if (!isGroup) return;
    const missing = [
      ...new Set(messages.map((m) => m.sender_id).filter((sid) => sid !== userId && !(sid in senderNames))),
    ];
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", missing);
      if (cancelled) return;
      const map: Record<string, string> = {};
      // Marca todos como resueltos para no reintentar en bucle si falta el perfil
      missing.forEach((sid) => { map[sid] = "Usuario"; });
      profiles?.forEach((p: any) => {
        map[p.user_id] = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Usuario";
      });
      setSenderNames((prev) => ({ ...map, ...prev }));
    })();
    return () => {
      cancelled = true;
    };
  }, [isGroup, messages, senderNames, userId]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#007275" />
      </View>
    );
  }

  if (unavailable) {
    return (
      <View className="flex-1 justify-center p-5 bg-[#faf5e0]">
        <EmptyState
          icon="lock-closed"
          title="Conversación no disponible"
          subtitle="Esta conversación no existe o no tienes acceso a ella."
          actionLabel="Volver"
          onAction={goBack}
        />
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
            <Text className="text-gray-500">No hay mensajes aún</Text>
            <Text className="text-gray-500 text-sm mt-1">Envía el primer mensaje</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isMine = item.sender_id === userId;
          const showDate = index === 0 ||
            new Date(item.created_at ?? 0).toDateString() !==
            new Date(messages[index - 1]?.created_at ?? 0).toDateString();

          return (
            <>
              {showDate && (
                <Text className="text-center text-gray-500 text-xs my-3">
                  {formatDate(item.created_at)}
                </Text>
              )}
              <View className={`mb-3 max-w-[80%] ${isMine ? "self-end" : "self-start"}`}>
                {isGroup && !isMine && (
                  <Text className="text-xs font-semibold text-[#211f1e] mb-0.5 ml-1">
                    {senderNames[item.sender_id] || "Usuario"}
                  </Text>
                )}
                <View
                  className={`p-3 rounded-2xl ${
                    isMine
                      ? "bg-[#007275] rounded-br-md"
                      : "bg-white rounded-bl-md shadow-sm"
                  }`}
                >
                  <Text className={isMine ? "text-white" : "text-[#211f1e]"}>
                    {item.content}
                  </Text>
                </View>
                <Text className={`text-xs mt-1 text-gray-500 ${isMine ? "text-right" : "text-left"}`}>
                  {formatTime(item.created_at)}
                  {isMine && item.read_at && (
                    <Ionicons name="checkmark-done" size={14} color="#9CA3AF" />
                  )}
                </Text>
              </View>
            </>
          );
        }}
      />

      <View className="flex-row items-center gap-2 p-3 bg-white border-t border-gray-200">
        <TextInput
          className={`flex-1 bg-white rounded-full px-4 py-3 text-[#211f1e] ${inputFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-200"}`}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#9BA1A6"
          value={input}
          onChangeText={setInput}
          multiline
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        />
        <TouchableOpacity
          className={`w-12 h-12 rounded-full items-center justify-center ${sending || !input.trim() ? "bg-gray-300" : "bg-[#007275]"}`}
          onPress={handleSend}
          disabled={sending || !input.trim()}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensaje"
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name="send"
              size={18}
              color={!input.trim() ? "#9CA3AF" : "white"}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
