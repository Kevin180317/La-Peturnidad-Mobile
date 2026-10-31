import { Ionicons } from "@expo/vector-icons";
import { EmptyCard } from "@/components/kit/Kit";
import { messagesService } from "@/services/messages.service";
import { type Message } from "@/types";
import { formatChatDay } from "@/utils/format";
import { supabase } from "@/utils/supabase";
import { getCurrentUser } from "@/utils/session";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HeaderHeightContext } from "expo-router/react-navigation";
import { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const [otherLeft, setOtherLeft] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const headerHeight = useContext(HeaderHeightContext) ?? 0;

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages]);

  const init = async () => {
    const { data: user } = await getCurrentUser();
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
    if (!conv.group_id) {
      // Si la otra persona eliminó el chat o su cuenta, lo que se envíe aquí no le llegaría a nadie
      const { data: others } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", id)
        .neq("user_id", uid);
      setOtherLeft(others?.length === 0);
    }
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
        <EmptyCard icon="lock-closed-outline" title="Conversación no disponible" text="Esta conversación no existe o no tienes acceso a ella.">
          <TouchableOpacity className="bg-[#007275] py-2.5 px-6 rounded-full mt-4" onPress={goBack}>
            <Text className="text-white font-semibold">Volver</Text>
          </TouchableOpacity>
        </EmptyCard>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#faf5e0]"
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pt-2 pb-4"
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <View className="w-16 h-16 rounded-full bg-[#007275]/10 items-center justify-center mb-3">
              <Ionicons name="chatbubbles-outline" size={30} color="#007275" />
            </View>
            <Text className="font-bold text-[#211f1e] text-base">No hay mensajes aún</Text>
            <Text className="text-gray-500 text-sm mt-1">Envía el primer mensaje</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isMine = item.sender_id === userId;
          const showDate = index === 0 ||
            new Date(item.created_at ?? 0).toDateString() !==
            new Date(messages[index - 1]?.created_at ?? 0).toDateString();
          // Agrupa burbujas seguidas del mismo remitente (menos espacio y sin repetir nombre)
          const sameAsPrev = !showDate && messages[index - 1]?.sender_id === item.sender_id;

          return (
            <>
              {showDate && (
                <View className="self-center bg-white/80 px-3 py-1 rounded-full my-3 shadow-[0_1px_4px_rgba(33,31,30,0.06)]">
                  <Text className="text-gray-600 text-[11px] font-semibold">{formatChatDay(item.created_at)}</Text>
                </View>
              )}
              <View className={`max-w-[80%] ${sameAsPrev ? "mt-1" : "mt-3"} ${isMine ? "self-end" : "self-start"}`}>
                {isGroup && !isMine && !sameAsPrev && (
                  <Text className="text-xs font-bold text-[#007275] mb-1 ml-3">
                    {senderNames[item.sender_id] || "Usuario"}
                  </Text>
                )}
                <View
                  className={`px-3.5 pt-2 pb-1.5 rounded-3xl ${
                    isMine
                      ? "bg-[#007275] rounded-br-lg shadow-[0_4px_12px_rgba(0,114,117,0.2)]"
                      : "bg-white rounded-bl-lg shadow-[0_2px_8px_rgba(33,31,30,0.06)]"
                  }`}
                >
                  <Text className={`text-[15px] leading-5 ${isMine ? "text-white" : "text-[#211f1e]"}`}>
                    {item.content}
                  </Text>
                  <View className="flex-row items-center justify-end gap-1 mt-0.5">
                    <Text className={`text-[10px] ${isMine ? "text-white/75" : "text-gray-500"}`}>
                      {formatTime(item.created_at)}
                    </Text>
                    {isMine && (
                      <Ionicons
                        name={item.read_at ? "checkmark-done" : "checkmark"}
                        size={13}
                        color={item.read_at ? "#ffffff" : "rgba(255,255,255,0.6)"}
                      />
                    )}
                  </View>
                </View>
              </View>
            </>
          );
        }}
      />

      {otherLeft ? (
        <View className="px-5 pt-3 bg-[#faf5e0]" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <Text className="text-gray-500 text-sm text-center">
            Esta persona ya no está en el chat. Para escribirle, abre su perfil y envía un mensaje nuevo.
          </Text>
        </View>
      ) : (
      <View className="px-3 pt-2 bg-[#faf5e0]" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <View
          className={`flex-row items-end bg-white rounded-[26px] pl-4 pr-1.5 py-1.5 border-[1.5px] shadow-[0_4px_16px_rgba(33,31,30,0.08)] ${inputFocused ? "border-[#007275]" : "border-transparent"}`}
        >
          <TextInput
            className="flex-1 py-2 text-[15px] text-[#211f1e] max-h-28"
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#9BA1A6"
            value={input}
            onChangeText={setInput}
            multiline
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          <TouchableOpacity
            className={`w-10 h-10 rounded-full items-center justify-center ml-2 ${sending || !input.trim() ? "bg-gray-200" : "bg-[#007275]"}`}
            onPress={handleSend}
            disabled={sending || !input.trim()}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={17} color={!input.trim() ? "#9BA1A6" : "white"} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      )}
    </KeyboardAvoidingView>
  );
}
