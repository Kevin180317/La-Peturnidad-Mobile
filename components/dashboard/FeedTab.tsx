import { Avatar, CARD as CARD_BASE, EmptyCard, RoundIconButton, Segmented, type SegmentOption } from "@/components/kit/Kit";
import { PostForm, type PostFormData } from "@/components/PostForm";
import { Skeleton } from "@/components/Skeleton";
import { messagesService } from "@/services/messages.service";
import { formatDate, formatTimeAgo } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
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

type MainTab = "emergencies" | "announcements" | "social";

const CARD = `${CARD_BASE} mb-4 overflow-hidden`;

const SEGMENTS: SegmentOption<MainTab>[] = [
  { key: "emergencies", label: "Emergencias", icon: "warning", color: "#ff7e70" },
  { key: "announcements", label: "Anuncios", icon: "megaphone", color: "#007275" },
  { key: "social", label: "Social", icon: "people", color: "#007275" },
];

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
  const [mainTab, setMainTab] = useState<MainTab>("social");
  const [showPostForm, setShowPostForm] = useState(false);
  const [posting, setPosting] = useState(false);
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

  const handleContact = async (authorId: string) => {
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerClassName="p-5 pb-10"
      testID="feed-scroll"
      scrollEventThrottle={200}
      onScroll={({ nativeEvent: { layoutMeasurement, contentOffset, contentSize } }) => {
        if (mainTab === "social" && layoutMeasurement.height + contentOffset.y >= contentSize.height - 400) {
          onLoadMoreFeed?.();
        }
      }}
    >
      <View className="flex-row items-center justify-between mb-5">
        <View>
          <Text className="text-2xl font-bold text-[#211f1e]">Feed</Text>
          <Text className="text-gray-500 text-sm mt-0.5">Lo que pasa en tu comunidad</Text>
        </View>
        <TouchableOpacity
          className="bg-[#007275] py-2.5 pl-3 pr-4 rounded-full flex-row items-center gap-1.5 shadow-[0_4px_12px_rgba(0,114,117,0.3)]"
          activeOpacity={0.85}
          onPress={() => setShowPostForm(true)}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text className="text-white font-semibold">Publicar</Text>
        </TouchableOpacity>
      </View>

      <Segmented options={SEGMENTS} value={mainTab} onChange={setMainTab} />

      <PostForm
        visible={showPostForm}
        onClose={() => setShowPostForm(false)}
        onSubmit={handleCreatePost}
        loading={posting}
      />

      {/* EMERGENCIAS */}
      {mainTab === "emergencies" &&
        (loadingAlerts ? (
          <FeedSkeleton />
        ) : !emergencyAlerts?.length ? (
          <EmptyCard icon="shield-checkmark-outline" color="#ff7e70" title="Todo tranquilo" text="No hay alertas de emergencia activas" />
        ) : (
          emergencyAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        ))}

      {/* ANUNCIOS */}
      {mainTab === "announcements" &&
        (loadingAnnouncements ? (
          <FeedSkeleton />
        ) : !visibleAnnouncements.length ? (
          <EmptyCard icon="newspaper-outline" color="#007275" title="Sin anuncios" text="No hay anuncios disponibles" />
        ) : (
          visibleAnnouncements.map((item: any) => {
            const isMine = item.user_id === userId;
            return (
              <View key={item.id} className={CARD}>
                <AuthorRow
                  name={item.owner_name}
                  picture={item.owner_profile_picture}
                  createdAt={item.created_at}
                  onPressAuthor={() => router.push(`/perfil/${item.user_id}`)}
                >
                  {!isMine && (
                    <RoundIconButton icon="chatbubble-outline" tint="teal" onPress={() => handleContact(item.user_id)} label="Enviar mensaje" />
                  )}
                  {(isMine || isModerator) && (
                    <RoundIconButton icon="trash-outline" tint="red" onPress={() => onDeleteAnnouncement(item.id)} label="Eliminar anuncio" />
                  )}
                </AuthorRow>
                <View className="px-4 pb-4">
                  <View className={`self-start px-3 py-1 rounded-full flex-row items-center gap-1.5 mb-2.5 ${getCategoryStyle(item.category).bg}`}>
                    <Ionicons name={getCategoryIcon(item.category)} size={12} color={getCategoryStyle(item.category).color} />
                    <Text className="text-xs font-semibold" style={{ color: getCategoryStyle(item.category).color }}>
                      {getCategoryLabel(item.category)}
                    </Text>
                  </View>
                  <Text className="font-bold text-lg text-[#211f1e] mb-1">{item.title}</Text>
                  <Text className="text-gray-700 leading-6 text-[15px]">{item.content}</Text>
                </View>
              </View>
            );
          })
        ))}

      {/* SOCIAL */}
      {mainTab === "social" &&
        (loadingFeed ? (
          <FeedSkeleton />
        ) : visiblePosts.length === 0 ? (
          <EmptyCard icon="images-outline" color="#007275" title="Aún no hay publicaciones" text="Sé el primero en compartir algo con tu comunidad" />
        ) : (
          visiblePosts.map((post) => {
            const isMine = post.user_id === userId;
            const isOpen = commentTarget?.id === post.id && commentTarget?.type === "post";
            const contacting = contactingUserId === post.user_id;
            return (
              <View key={post.id} className={CARD}>
                <AuthorRow
                  name={post.owner_name}
                  picture={post.owner_profile_picture}
                  createdAt={post.created_at}
                  onPressAuthor={() => router.push(`/perfil/${post.user_id}`)}
                >
                  {!isMine && (
                    <RoundIconButton
                      icon="chatbubble-outline"
                      tint="teal"
                      onPress={() => handleContact(post.user_id)}
                      disabled={contacting}
                      loading={contacting}
                      label="Enviar mensaje"
                    />
                  )}
                  {(isMine || isModerator) && (
                    <RoundIconButton icon="trash-outline" tint="red" onPress={() => onDeletePost(post)} label="Eliminar publicación" />
                  )}
                </AuthorRow>

                {!!post.content && (
                  <Text
                    className={`px-4 text-[#211f1e] ${post.image_url ? "text-[15px] leading-6 pb-3" : "text-lg leading-7 pb-2"}`}
                  >
                    {post.content}
                  </Text>
                )}

                {post.image_url && (
                  <View className="px-3">
                    <Image
                      source={{ uri: post.image_url }}
                      resizeMode="cover"
                      className="w-full rounded-2xl bg-gray-100"
                      style={{ aspectRatio: 4 / 5 }}
                    />
                  </View>
                )}

                <View className="flex-row items-center px-4 py-3">
                  <TouchableOpacity
                    className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full ${isOpen ? "bg-[#007275]" : "bg-[#007275]/10"}`}
                    activeOpacity={0.8}
                    onPress={() => onToggleComments("post", post.id)}
                    accessibilityRole="button"
                    accessibilityLabel={isOpen ? "Ocultar comentarios" : "Ver comentarios"}
                  >
                    <Ionicons name="chatbubble-ellipses" size={15} color={isOpen ? "#fff" : "#007275"} />
                    <Text className={`text-xs font-semibold ${isOpen ? "text-white" : "text-[#007275]"}`}>
                      {post.comment_count ?? 0} {post.comment_count === 1 ? "comentario" : "comentarios"}
                    </Text>
                    <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={14} color={isOpen ? "#fff" : "#007275"} />
                  </TouchableOpacity>
                </View>

                {isOpen && (
                  <CommentsSection
                    comments={visibleComments.filter((c) => c.target_type === "post" && c.target_id === post.id)}
                    loading={loadingComments}
                    userId={userId}
                    isModerator={isModerator}
                    text={commentText}
                    sending={sendingComment}
                    onChangeText={onChangeComment}
                    onSend={onAddComment}
                    onDelete={onDeleteComment}
                    onPressAuthor={(id) => router.push(`/perfil/${id}`)}
                  />
                )}
              </View>
            );
          })
        ))}
      {mainTab === "social" && loadingMoreFeed && <ActivityIndicator className="mt-2" color="#007275" />}
    </ScrollView>
  );
}


function AuthorRow({
  name,
  picture,
  createdAt,
  onPressAuthor,
  children,
}: {
  name?: string | null;
  picture?: string | null;
  createdAt?: string | null;
  onPressAuthor: () => void;
  children?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3 p-4">
      <TouchableOpacity className="flex-row items-center gap-3 flex-1" activeOpacity={0.7} onPress={onPressAuthor}>
        <Avatar uri={picture} name={name} />
        <View className="flex-1">
          <Text className="font-bold text-[#211f1e] text-[15px]" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-gray-500 text-xs mt-0.5">{formatTimeAgo(createdAt)}</Text>
        </View>
      </TouchableOpacity>
      {children && <View className="flex-row gap-2">{children}</View>}
    </View>
  );
}


function AlertCard({ alert }: { alert: any }) {
  return (
    <View className={CARD}>
      <View className="bg-[#ff7e70] flex-row items-center gap-2 px-4 py-2">
        <Ionicons name="alert-circle" size={16} color="#fff" />
        <Text className="text-white text-xs font-bold tracking-widest">SE BUSCA</Text>
        <Text className="text-white/90 text-xs ml-auto">{formatDate(alert.disappearance_date)}</Text>
      </View>
      {alert.image_url ? (
        <Image source={{ uri: alert.image_url }} resizeMode="cover" className="w-full bg-gray-100" style={{ aspectRatio: 4 / 3 }} />
      ) : (
        <View className="w-full h-32 bg-[#ff7e70]/10 items-center justify-center">
          <Ionicons name="paw" size={40} color="#ff7e70" />
        </View>
      )}
      <View className="p-4">
        <Text className="font-bold text-xl text-[#211f1e]">{alert.pet_name}</Text>
        {!!alert.description && <Text className="text-[15px] text-gray-700 leading-6 mt-1">{alert.description}</Text>}
        {!!alert.last_seen_location && (
          <View className="flex-row items-center gap-1.5 bg-[#ff7e70]/10 self-start px-3 py-1.5 rounded-full mt-3">
            <Ionicons name="location" size={13} color="#c2402f" />
            <Text className="text-xs font-semibold text-[#c2402f]">{alert.last_seen_location}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function CommentsSection({
  comments,
  loading,
  userId,
  isModerator,
  text,
  sending,
  onChangeText,
  onSend,
  onDelete,
  onPressAuthor,
}: {
  comments: any[];
  loading: boolean;
  userId?: string;
  isModerator: boolean;
  text: string;
  sending: boolean;
  onChangeText: (t: string) => void;
  onSend: () => void;
  onDelete: (id: string) => void;
  onPressAuthor: (userId: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const canSend = !sending && !!text.trim();

  return (
    <View className="px-4 pb-4 pt-1 border-t border-gray-100">
      {loading ? (
        <ActivityIndicator className="my-3" size="small" color="#007275" />
      ) : comments.length === 0 ? (
        <Text className="text-gray-500 text-sm text-center my-3">Sin comentarios todavía. Escribe el primero.</Text>
      ) : (
        comments.map((c) => (
          <View key={c.id} className="flex-row items-start gap-2 mt-3">
            {c.owner_profile_picture ? (
              <Image source={{ uri: c.owner_profile_picture }} className="w-8 h-8 rounded-full" />
            ) : (
              <View className="w-8 h-8 bg-[#007275] rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">{c.owner_name?.[0]?.toUpperCase() || "U"}</Text>
              </View>
            )}
            <View className="flex-1 bg-[#faf5e0] px-3 py-2 rounded-2xl rounded-tl-md">
              <View className="flex-row items-center gap-2">
                <TouchableOpacity onPress={() => onPressAuthor(c.user_id)}>
                  <Text className="font-bold text-xs text-[#211f1e]">{c.owner_name}</Text>
                </TouchableOpacity>
                <Text className="text-gray-500 text-[11px]">{formatTimeAgo(c.created_at)}</Text>
              </View>
              <Text className="text-[#211f1e] text-sm mt-0.5 leading-5">{c.content}</Text>
            </View>
            {(c.user_id === userId || isModerator) && (
              <TouchableOpacity className="p-1.5" onPress={() => onDelete(c.id)} accessibilityLabel="Eliminar comentario" hitSlop={6}>
                <Ionicons name="trash-outline" size={15} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
      <View
        className={`flex-row items-center gap-2 mt-4 bg-white rounded-full pl-4 pr-1 py-1 border ${focused ? "border-[#007275]" : "border-gray-200"}`}
      >
        <TextInput
          className="flex-1 py-1.5 text-sm text-[#211f1e]"
          placeholder="Escribe un comentario..."
          placeholderTextColor="#9BA1A6"
          value={text}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <TouchableOpacity
          className={`rounded-full w-9 h-9 items-center justify-center ${canSend ? "bg-[#007275]" : "bg-gray-200"}`}
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Enviar comentario"
        >
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={15} color={canSend ? "#fff" : "#9BA1A6"} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}


function FeedSkeleton() {
  return (
    <>
      {[0, 1].map((i) => (
        <View key={i} className={`${CARD} p-4 gap-3`} testID="feed-skeleton">
          <View className="flex-row items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-full" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/5" />
            </View>
          </View>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </View>
      ))}
    </>
  );
}

// Helper functions para categorías de anuncios
function getCategoryStyle(category: string): { bg: string; color: string } {
  switch (category) {
    case "evento":
      return { bg: "bg-[#007275]/10", color: "#007275" };
    case "pregunta":
      return { bg: "bg-[#211f1e]/10", color: "#211f1e" };
    default:
      return { bg: "bg-gray-100", color: "#4B5563" };
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
