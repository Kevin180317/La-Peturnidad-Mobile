import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { CommentTarget } from "./FeedTab";

const comCatColor = (cat: string) => {
  switch (cat) { case "aviso": return "bg-red-100 text-red-600"; case "evento": return "bg-blue-100 text-blue-600"; case "pregunta": return "bg-yellow-100 text-yellow-600"; default: return "bg-gray-100 text-gray-600"; }
};
const comCatIcon = (cat: string): keyof typeof Ionicons.glyphMap => {
  const m: Record<string, keyof typeof Ionicons.glyphMap> = { general: "chatbubbles", aviso: "megaphone", evento: "calendar", pregunta: "help-circle" };
  return m[cat] || "chatbubbles";
};
const comCatLabel = (cat: string) => {
  const m: Record<string, string> = { general: "General", aviso: "Aviso", evento: "Evento", pregunta: "Pregunta" };
  return m[cat] || cat;
};

interface ComunidadTabProps {
  userId?: string;
  announcements: any[];
  myAnnouncements: any[];
  loadingAnnouncements: boolean;
  loadingMyAnnouncements: boolean;
  refreshing: boolean;
  comments: any[];
  commentTarget: CommentTarget | null;
  commentText: string;
  loadingComments: boolean;
  sendingComment: boolean;
  onRefresh: () => void;
  onLoadAnnouncements: () => void;
  onLoadMyAnnouncements: () => void;
  onToggleComments: (type: string, id: string) => void;
  onChangeComment: (text: string) => void;
  onAddComment: () => void;
  onCreateAnnouncement: (
    title: string,
    content: string,
    category: string,
  ) => Promise<boolean>;
  onDeleteAnnouncement: (id: string) => void;
}

export function ComunidadTab({
  userId,
  announcements,
  myAnnouncements,
  loadingAnnouncements,
  loadingMyAnnouncements,
  refreshing,
  comments,
  commentTarget,
  commentText,
  loadingComments,
  sendingComment,
  onRefresh,
  onLoadAnnouncements,
  onLoadMyAnnouncements,
  onToggleComments,
  onChangeComment,
  onAddComment,
  onCreateAnnouncement,
  onDeleteAnnouncement,
}: ComunidadTabProps) {
  const router = useRouter();
  const [comSubTab, setComSubTab] = useState<"all" | "mine">("all");
  const [comShowForm, setComShowForm] = useState(false);
  const [comFormTitle, setComFormTitle] = useState("");
  const [comFormContent, setComFormContent] = useState("");
  const [comFormCategory, setComFormCategory] = useState("general");
  const [comPosting, setComPosting] = useState(false);

  const visibleItems =
    comSubTab === "all"
      ? announcements.filter((a) => a.user_id !== userId)
      : myAnnouncements;
  const loading =
    comSubTab === "all" ? loadingAnnouncements : loadingMyAnnouncements;

  const handleComPost = async () => {
    if (!comFormTitle.trim() || !comFormContent.trim()) return;
    setComPosting(true);
    const ok = await onCreateAnnouncement(
      comFormTitle.trim(),
      comFormContent.trim(),
      comFormCategory,
    );
    if (ok) {
      setComShowForm(false);
      setComFormTitle("");
      setComFormContent("");
      setComFormCategory("general");
    }
    setComPosting(false);
  };

  return (
    <>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              onLoadAnnouncements();
              onLoadMyAnnouncements();
              onRefresh();
            }}
          />
        }
        contentContainerClassName="p-5 pb-10"
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-[#211f1e]">Comunidad</Text>
          <TouchableOpacity
            className="bg-[#ff7e70] py-2 px-4 rounded-lg flex-row items-center"
            onPress={() => setComShowForm(true)}
          >
            <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 2 }} />
            <Text className="text-white font-semibold">Nuevo</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row bg-white rounded-xl mb-4 shadow-sm">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-l-xl ${comSubTab === "all" ? "bg-[#ff7e70]" : "bg-white"}`}
            onPress={() => setComSubTab("all")}
          >
            <Text className={`text-center font-semibold ${comSubTab === "all" ? "text-white" : "text-gray-500"}`}>
              Comunidad
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 rounded-r-xl ${comSubTab === "mine" ? "bg-[#ff7e70]" : "bg-white"}`}
            onPress={() => setComSubTab("mine")}
          >
            <Text className={`text-center font-semibold ${comSubTab === "mine" ? "text-white" : "text-gray-500"}`}>
              Mis avisos
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#ff7e70" />
        ) : visibleItems.length === 0 ? (
          <View className="bg-white p-10 rounded-xl items-center">
            <View className="w-16 h-16 rounded-full bg-[#ff7e70]/10 items-center justify-center mb-3">
              <Ionicons name="chatbubbles-outline" size={32} color="#ff7e70" />
            </View>
            <Text className="text-gray-500 text-center">
              {comSubTab === "all" ? "No hay avisos todavía. ¡Sé el primero!" : "No has creado avisos aún"}
            </Text>
          </View>
        ) : (
          visibleItems.map((item: any) => {
            const isMine = item.user_id === userId;
            const annComments = comments.filter(
              (c) => c.target_type === "announcement" && c.target_id === item.id,
            );
            const isCommenting =
              commentTarget?.id === item.id && commentTarget?.type === "announcement";
            return (
              <View key={item.id} className="bg-white p-4 rounded-xl mb-3 shadow-sm">
                <TouchableOpacity
                  className="flex-row items-start gap-3 mb-2"
                  onPress={() => router.push(`/perfil/${item.user_id}`)}
                >
                  {item.owner_profile_picture ? (
                    <Image source={{ uri: item.owner_profile_picture }} className="w-10 h-10 rounded-full" />
                  ) : (
                    <View className="w-10 h-10 bg-[#ff7e70] rounded-full items-center justify-center">
                      <Text className="text-white font-bold">{item.owner_name?.[0]?.toUpperCase() || "U"}</Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-semibold text-[#211f1e]">{item.owner_name}</Text>
                    <Text className="text-gray-500 text-xs">{new Date(item.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</Text>
                  </View>
                  {isMine && (
                    <TouchableOpacity onPress={() => onDeleteAnnouncement(item.id)}>
                      <Ionicons name="trash-outline" size={20} color="#ff7e70" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                <View className={`self-start px-2.5 py-1 rounded-full mb-1 flex-row items-center gap-1 ${comCatColor(item.category)}`}>
                  <Ionicons name={comCatIcon(item.category)} size={12} />
                  <Text className="text-xs font-medium">{comCatLabel(item.category)}</Text>
                </View>
                <Text className="font-bold text-lg text-[#211f1e]">{item.title}</Text>
                <Text className="text-gray-600 leading-5 mt-1">{item.content}</Text>

                <TouchableOpacity
                  className="mt-3 pt-2 border-t border-gray-100 flex-row items-center gap-1.5"
                  onPress={() => onToggleComments("announcement", item.id)}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#6B7280" />
                  <Text className="text-gray-500 text-sm">{annComments.length} {isCommenting ? "Ocultar" : "Comentar"}</Text>
                </TouchableOpacity>

                {isCommenting && (
                  <View className="mt-3">
                    {loadingComments ? (
                      <ActivityIndicator size="small" color="#ff7e70" />
                    ) : annComments.length === 0 ? (
                      <Text className="text-gray-500 text-sm mb-2">Sin comentarios</Text>
                    ) : (
                      annComments.map((c) => (
                        <View key={c.id} className="flex-row items-start gap-2 mb-3">
                          {c.owner_profile_picture ? (
                            <Image source={{ uri: c.owner_profile_picture }} className="w-7 h-7 rounded-full" />
                          ) : (
                            <View className="w-7 h-7 bg-[#ff7e70] rounded-full items-center justify-center">
                              <Text className="text-white text-xs font-bold">{c.owner_name?.[0]?.toUpperCase() || "U"}</Text>
                            </View>
                          )}
                          <View className="flex-1 bg-[#faf5e0] p-2 rounded-lg">
                            <View className="flex-row items-center gap-2">
                              <TouchableOpacity onPress={() => router.push(`/perfil/${c.user_id}`)}>
                                <Text className="font-semibold text-xs text-[#ff7e70]">{c.owner_name}</Text>
                              </TouchableOpacity>
                              <Text className="text-gray-500 text-xs">
                                {new Date(c.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                              </Text>
                            </View>
                            <Text className="text-[#211f1e] text-sm mt-1">{c.content}</Text>
                          </View>
                        </View>
                      ))
                    )}
                    <View className="flex-row items-center gap-2 mt-2">
                      <TextInput
                        className="flex-1 bg-[#faf5e0] rounded-full px-4 py-2 text-sm border border-gray-200"
                        placeholder="Escribe un comentario..."
                        value={isCommenting ? commentText : ""}
                        onChangeText={onChangeComment}
                      />
                      <TouchableOpacity
                        className="bg-[#ff7e70] rounded-full w-8 h-8 items-center justify-center"
                        onPress={onAddComment}
                        disabled={sendingComment || !commentText.trim()}
                      >
                        {sendingComment ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons name="send" size={14} color="#fff" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal animationType="slide" transparent visible={comShowForm} onRequestClose={() => setComShowForm(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-[#211f1e]">Nuevo aviso</Text>
              <TouchableOpacity onPress={() => setComShowForm(false)}>
                <Ionicons name="close" size={26} color="#211f1e" />
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-2 mb-4 flex-wrap">
              {["general", "aviso", "evento", "pregunta"].map((cat) => (
                <TouchableOpacity key={cat} className={`py-2 px-4 rounded-full border-2 flex-row items-center gap-1.5 ${comFormCategory === cat ? "border-[#ff7e70] bg-[#ff7e70]" : "border-gray-200 bg-[#faf5e0]"}`} onPress={() => setComFormCategory(cat)}>
                  <Ionicons name={comCatIcon(cat)} size={14} color={comFormCategory === cat ? "#fff" : "#4B5563"} />
                  <Text className={`font-medium ${comFormCategory === cat ? "text-white" : "text-gray-600"}`}>{comCatLabel(cat)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput className="bg-white p-3 rounded-lg mb-3 border border-gray-300 text-[#211f1e]" placeholder="Título *" placeholderTextColor="#9BA1A6" value={comFormTitle} onChangeText={setComFormTitle} />
            <TextInput className="bg-white p-3 rounded-lg mb-4 border border-gray-300 text-[#211f1e]" placeholder="Escribe tu mensaje... *" placeholderTextColor="#9BA1A6" value={comFormContent} onChangeText={setComFormContent} multiline numberOfLines={4} textAlignVertical="top" />
            <View className="flex-row gap-3">
              <TouchableOpacity className={`flex-1 py-3 rounded-lg ${comPosting ? "bg-gray-400" : "bg-[#ff7e70]"}`} disabled={comPosting} onPress={handleComPost}>
                <Text className={`text-center font-bold ${comPosting ? "text-gray-700" : "text-white"}`}>{comPosting ? "Publicando..." : "Publicar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-[#211f1e] py-3 rounded-lg" onPress={() => setComShowForm(false)}>
                <Text className="text-white text-center font-bold">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
