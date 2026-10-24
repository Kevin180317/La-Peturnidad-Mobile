import { PostForm, type PostFormData } from "@/components/PostForm";
import { messagesService } from "@/services/messages.service";
import { formatDate } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export interface CommentTarget {
  type: string;
  id: string;
}

interface FeedTabProps {
  userId?: string;
  /** moderator/admin: puede borrar cualquier post, anuncio o comentario */
  isModerator?: boolean;
  /** usuarios que bloqueé: su contenido no se muestra */
  blockedUserIds?: string[];
  feedPosts: any[];
  /** scroll infinito de posts */
  loadingMoreFeed?: boolean;
  onLoadMoreFeed?: () => void;
  announcements?: any[];
  emergencyAlerts?: any[];
  loadingFeed: boolean;
  loadingAnnouncements?: boolean;
  loadingAlerts?: boolean;
  refreshing: boolean;
  comments: any[];
  commentTarget: CommentTarget | null;
  commentText: string;
  loadingComments: boolean;
  sendingComment: boolean;
  /** recarga solo los datos del feed */
  onRefresh: () => void;
  onToggleComments: (type: string, id: string) => void;
  onChangeComment: (text: string) => void;
  onAddComment: () => void;
  onDeleteComment: (commentId: string) => void;
  onCreatePost: (data: PostFormData) => Promise<boolean>;
  onDeletePost: (post: any) => void;
  onDeleteAnnouncement?: (id: string) => void;
}

export function FeedTab({
  userId,
  isModerator = false,
  blockedUserIds = [],
  feedPosts,
  loadingMoreFeed = false,
  onLoadMoreFeed,
  announcements = [],
  emergencyAlerts = [],
  loadingFeed,
  loadingAnnouncements = false,
  loadingAlerts = false,
  refreshing,
  comments,
  commentTarget,
  commentText,
  loadingComments,
  sendingComment,
  onRefresh,
  onToggleComments,
  onChangeComment,
  onAddComment,
  onDeleteComment,
  onCreatePost,
  onDeletePost,
  onDeleteAnnouncement = () => {},
}: FeedTabProps) {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<"emergencies" | "announcements" | "social">("social");
  const [showPostForm, setShowPostForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [commentFocused, setCommentFocused] = useState(false);
  const [contactingUserId, setContactingUserId] = useState<string | null>(null);

  const blocked = new Set(blockedUserIds);
  // Incluye mis propios posts para que pueda verlos y borrarlos
  const visiblePosts = feedPosts.filter((p) => !blocked.has(p.user_id));
  const visibleAnnouncements = announcements.filter((a) => !blocked.has(a.user_id));
  const visibleComments = comments.filter((c) => !blocked.has(c.user_id));

  const handleCreatePost = async (data: PostFormData) => {
    setPosting(true);
    const ok = await onCreatePost(data);
    setPosting(false);
    return ok;
  };

  const handleContact = async (authorId: string, authorName: string) => {
    if (!userId) return;
    setContactingUserId(authorId);
    const result = await messagesService.getOrCreateConversation(userId, authorId);
    setContactingUserId(null);
    if (result.success) {
      router.push(`/mensajes/${result.data?.conversation_id}`);
      Toast.show({ type: "success", text1: "Conversación iniciada", position: "top" });
    } else {
      Toast.show({ type: "error", text1: "Error", text2: result.error, position: "top" });
    }
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
      contentContainerClassName="p-5 pb-10"
      testID="feed-scroll"
      scrollEventThrottle={200}
      onScroll={({ nativeEvent: { layoutMeasurement, contentOffset, contentSize } }) => {
        if (mainTab === "social" && layoutMeasurement.height + contentOffset.y >= contentSize.height - 400) {
          onLoadMoreFeed?.();
        }
      }}
    >
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-bold text-[#211f1e]">Feed</Text>
        <TouchableOpacity
          className="bg-[#007275] py-2 px-4 rounded-xl flex-row items-center"
          onPress={() => setShowPostForm(true)}
        >
          <Ionicons name="create-outline" size={18} color="#fff" style={{ marginRight: 4 }} />
          <Text className="text-white font-semibold">Publicar</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs principales: Emergencias, Anuncios, Social */}
      <View className="flex-row bg-white rounded-xl mb-4 shadow-sm gap-1 p-1">
        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-lg ${mainTab === "emergencies" ? "bg-[#ff7e70]" : "bg-white"}`}
          onPress={() => setMainTab("emergencies")}
        >
          <Text className={`text-center font-semibold text-xs ${mainTab === "emergencies" ? "text-white" : "text-gray-600"}`}>
            Emergencias
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-lg ${mainTab === "announcements" ? "bg-[#007275]" : "bg-white"}`}
          onPress={() => setMainTab("announcements")}
        >
          <Text className={`text-center font-semibold text-xs ${mainTab === "announcements" ? "text-white" : "text-gray-600"}`}>
            Anuncios
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-lg ${mainTab === "social" ? "bg-[#007275]" : "bg-white"}`}
          onPress={() => setMainTab("social")}
        >
          <Text className={`text-center font-semibold text-xs ${mainTab === "social" ? "text-white" : "text-gray-600"}`}>
            Social
          </Text>
        </TouchableOpacity>
      </View>

      <PostForm
        visible={showPostForm}
        onClose={() => setShowPostForm(false)}
        onSubmit={handleCreatePost}
        loading={posting}
      />

      {/* EMERGENCIAS TAB */}
      {mainTab === "emergencies" && (
        <>
          {(loadingAlerts || !emergencyAlerts?.length) && (
            <View className="bg-white p-10 rounded-2xl shadow-[0_2px_8px_rgba(33,31,30,0.08)] items-center">
              {loadingAlerts ? (
                <ActivityIndicator size="large" color="#ff7e70" />
              ) : (
                <>
                  <View className="w-16 h-16 rounded-full bg-[#ff7e70]/10 items-center justify-center mb-3">
                    <Ionicons name="alert-circle-outline" size={32} color="#ff7e70" />
                  </View>
                  <Text className="text-gray-500 text-center">No hay alertas de emergencia activas</Text>
                </>
              )}
            </View>
          )}
          {emergencyAlerts?.map((alert) => (
            <View key={alert.id} className="bg-red-50 border-l-4 border-[#ff7e70] rounded-2xl mb-3 p-4 shadow-[0_2px_8px_rgba(255,126,112,0.12)]">
              <View className="flex-row items-start gap-3 mb-3">
                {alert.image_url ? (
                  <Image source={{ uri: alert.image_url }} className="w-16 h-16 rounded-lg bg-gray-100" />
                ) : (
                  <View className="w-16 h-16 rounded-lg bg-gray-200 items-center justify-center">
                    <Ionicons name="alert-outline" size={24} color="#ff7e70" />
                  </View>
                )}
                <View className="flex-1">
                  <View className="bg-[#ff7e70] px-2 py-1 rounded-full self-start mb-2">
                    <Text className="text-white text-xs font-bold">EMERGENCIA</Text>
                  </View>
                  <Text className="font-bold text-base text-[#211f1e]">{alert.pet_name}</Text>
                  <Text className="text-[#ff7e70] text-xs font-medium mt-1">{formatDate(alert.disappearance_date)}</Text>
                </View>
              </View>
              <Text className="text-sm text-gray-700 leading-5 mb-3">{alert.description}</Text>
              {alert.last_seen_location && (
                <View className="flex-row items-center gap-2 bg-white/60 px-3 py-2 rounded-lg">
                  <Ionicons name="location-sharp" size={12} color="#ff7e70" />
                  <Text className="text-xs font-medium text-[#211f1e]">{alert.last_seen_location}</Text>
                </View>
              )}
            </View>
          ))}
        </>
      )}

      {/* ANUNCIOS TAB */}
      {mainTab === "announcements" && (
        <>
          {(loadingAnnouncements || !visibleAnnouncements.length) && (
            <View className="bg-white p-10 rounded-2xl shadow-[0_2px_8px_rgba(33,31,30,0.08)] items-center">
              {loadingAnnouncements ? (
                <ActivityIndicator size="large" color="#007275" />
              ) : (
                <>
                  <View className="w-16 h-16 rounded-full bg-[#007275]/10 items-center justify-center mb-3">
                    <Ionicons name="newspaper-outline" size={32} color="#007275" />
                  </View>
                  <Text className="text-gray-500 text-center">No hay anuncios disponibles</Text>
                </>
              )}
            </View>
          )}
          {visibleAnnouncements.map((item: any) => {
            const isMine = item.user_id === userId;
            return (
              <View key={item.id} className="bg-white rounded-2xl mb-3 shadow-[0_2px_8px_rgba(33,31,30,0.08)] overflow-hidden">
                <TouchableOpacity
                  className="flex-row items-center gap-3 p-4"
                  onPress={() => router.push(`/perfil/${item.user_id}`)}
                >
                  {item.owner_profile_picture ? (
                    <Image source={{ uri: item.owner_profile_picture }} className="w-10 h-10 rounded-full" />
                  ) : (
                    <View className="w-10 h-10 bg-[#007275] rounded-full items-center justify-center">
                      <Text className="text-white font-bold text-sm">{item.owner_name?.[0]?.toUpperCase() || "U"}</Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-semibold text-[#211f1e] text-sm">{item.owner_name}</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">{new Date(item.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</Text>
                  </View>
                  <View className="flex-row gap-3">
                    {!isMine && (
                      <TouchableOpacity onPress={() => handleContact(item.user_id, item.owner_name)}>
                        <Ionicons name="chatbubble-outline" size={18} color="#007275" />
                      </TouchableOpacity>
                    )}
                    {(isMine || isModerator) && (
                      <TouchableOpacity onPress={() => onDeleteAnnouncement(item.id)} accessibilityLabel="Eliminar anuncio">
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>

                <View className="px-4 pb-2">
                  <View className={`self-start px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${getCategoryStyle(item.category)}`}>
                    <Ionicons name={getCategoryIcon(item.category)} size={13} />
                    <Text className="text-xs font-semibold">{getCategoryLabel(item.category)}</Text>
                  </View>
                </View>

                <View className="px-4 pb-3">
                  <Text className="font-bold text-base text-[#211f1e] mb-1">{item.title}</Text>
                  <Text className="text-gray-700 leading-5 text-sm">{item.content}</Text>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* SOCIAL TAB */}
      {mainTab === "social" && (
        <>
          {loadingFeed ? (
            <ActivityIndicator size="large" color="#007275" />
          ) : visiblePosts.length === 0 ? (
            <View className="bg-white p-10 rounded-2xl shadow-[0_2px_8px_rgba(33,31,30,0.08)] items-center">
              <View className="w-16 h-16 rounded-full bg-[#007275]/10 items-center justify-center mb-3">
                <Ionicons name="images-outline" size={32} color="#007275" />
              </View>
              <Text className="text-gray-500 text-center">No hay publicaciones en el feed</Text>
            </View>
          ) : (
            visiblePosts.map((post) => {
          const isMine = post.user_id === userId;
          const postComments = visibleComments.filter(
            (c) => c.target_type === "post" && c.target_id === post.id,
          );
          return (
            <TouchableOpacity
              key={post.id}
              activeOpacity={0.95}
              className="bg-white rounded-2xl mb-4 shadow-[0_2px_8px_rgba(33,31,30,0.08)] overflow-hidden"
              onPress={() => onToggleComments("post", post.id)}
            >
              {/* Header: Avatar + Nombre + Acciones */}
              <TouchableOpacity
                className="flex-row items-center gap-3 p-4"
                onPress={() => router.push(`/perfil/${post.user_id}`)}
              >
                {post.owner_profile_picture ? (
                  <Image source={{ uri: post.owner_profile_picture }} className="w-10 h-10 rounded-full" />
                ) : (
                  <View className="w-10 h-10 bg-[#007275] rounded-full items-center justify-center">
                    <Text className="text-white font-bold text-sm">{post.owner_name?.[0]?.toUpperCase() || "U"}</Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="font-semibold text-[#211f1e] text-sm">{post.owner_name}</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    {new Date(post.created_at).toLocaleDateString("es-MX", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </Text>
                </View>
                <View className="flex-row gap-3">
                  {!isMine && (
                    <TouchableOpacity
                      onPress={() => handleContact(post.user_id, post.owner_name)}
                      disabled={contactingUserId === post.user_id}
                    >
                      <Ionicons name="chatbubble-outline" size={18} color={contactingUserId === post.user_id ? "#E5E7EB" : "#007275"} />
                    </TouchableOpacity>
                  )}
                  {(isMine || isModerator) && (
                    <TouchableOpacity onPress={() => onDeletePost(post)} accessibilityLabel="Eliminar publicación">
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>

              {/* Contenido texto */}
              <View className="px-4 pb-3">
                <Text className="text-[#211f1e] leading-5 text-sm">{post.content}</Text>
              </View>

              {/* IMAGEN FOCAL - primaria (si existe, si no: placeholder) */}
              <View className="w-full bg-gray-100 overflow-hidden">
                {post.image_url ? (
                  <Image
                    source={{ uri: post.image_url }}
                    resizeMode="cover"
                    className="w-full h-72"
                  />
                ) : (
                  <View className="w-full h-48 items-center justify-center bg-gray-100">
                    <Ionicons name="image-outline" size={48} color="#D1D5DB" />
                  </View>
                )}
              </View>

              {/* Footer: comentarios */}
              <View className="flex-row items-center gap-2 px-4 py-3 border-t border-gray-100">
                <Ionicons name="chatbubble-ellipses-outline" size={14} color="#6B7280" />
                <Text className="text-gray-500 text-xs font-medium">{post.comment_count} comentarios</Text>
                <Text className="text-[#007275] text-xs font-semibold ml-auto">
                  {commentTarget?.id === post.id ? "Ocultar" : "Ver"}
                </Text>
              </View>

              {commentTarget?.id === post.id && commentTarget?.type === "post" && (
                <View className="mt-3 pt-3 border-t border-gray-100">
                  {loadingComments ? (
                    <ActivityIndicator size="small" color="#007275" />
                  ) : postComments.length === 0 ? (
                    <Text className="text-gray-500 text-sm mb-2">Sin comentarios</Text>
                  ) : (
                    postComments.map((c) => (
                      <View key={c.id} className="flex-row items-start gap-2 mb-3">
                        {c.owner_profile_picture ? (
                          <Image source={{ uri: c.owner_profile_picture }} className="w-7 h-7 rounded-full" />
                        ) : (
                          <View className="w-7 h-7 bg-[#007275] rounded-full items-center justify-center">
                            <Text className="text-white text-xs font-bold">{c.owner_name?.[0]?.toUpperCase() || "U"}</Text>
                          </View>
                        )}
                        <View className="flex-1 bg-[#faf5e0] p-2 rounded-lg">
                          <View className="flex-row items-center gap-2">
                            <TouchableOpacity onPress={() => router.push(`/perfil/${c.user_id}`)}>
                              <Text className="font-semibold text-xs text-[#211f1e]">{c.owner_name}</Text>
                            </TouchableOpacity>
                            <Text className="text-gray-500 text-xs">
                              {new Date(c.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                            </Text>
                          </View>
                          <Text className="text-[#211f1e] text-sm mt-1">{c.content}</Text>
                        </View>
                        {(c.user_id === userId || isModerator) && (
                          <TouchableOpacity
                            className="p-1"
                            onPress={() => onDeleteComment(c.id)}
                            accessibilityLabel="Eliminar comentario"
                          >
                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))
                  )}
                  <View className="flex-row items-center gap-2 mt-2">
                    <TextInput
                      className={`flex-1 bg-white rounded-full px-4 py-2 text-sm ${commentFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-200"} text-[#211f1e]`}
                      placeholder="Escribe un comentario..."
                      placeholderTextColor="#9BA1A6"
                      value={commentTarget?.id === post.id ? commentText : ""}
                      onChangeText={onChangeComment}
                      onFocus={() => setCommentFocused(true)}
                      onBlur={() => setCommentFocused(false)}
                    />
                    <TouchableOpacity
                      className="bg-[#007275] rounded-full w-8 h-8 items-center justify-center"
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
            </TouchableOpacity>
            );
          })
          )}
        </>
      )}
      {mainTab === "social" && loadingMoreFeed && <ActivityIndicator className="mt-4" color="#007275" />}
    </ScrollView>
  );
}

// Helper functions para categorías de anuncios
function getCategoryStyle(category: string): string {
  switch (category) {
    case "aviso":
      return "bg-gray-100 text-gray-600";
    case "evento":
      return "bg-[#007275]/10 text-[#007275]";
    case "pregunta":
      return "bg-[#211f1e]/10 text-[#211f1e]";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getCategoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    general: "chatbubbles",
    aviso: "megaphone",
    evento: "calendar",
    pregunta: "help-circle",
  };
  return iconMap[category] || "chatbubbles";
}

function getCategoryLabel(category: string): string {
  const labelMap: Record<string, string> = {
    general: "General",
    aviso: "Aviso",
    evento: "Evento",
    pregunta: "Pregunta",
  };
  return labelMap[category] || category;
}
