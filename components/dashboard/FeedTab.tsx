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

export interface CommentTarget {
  type: string;
  id: string;
}

interface FeedTabProps {
  userId?: string;
  feedPosts: any[];
  myPosts: any[];
  loadingFeed: boolean;
  loadingMyPosts: boolean;
  refreshing: boolean;
  comments: any[];
  commentTarget: CommentTarget | null;
  commentText: string;
  loadingComments: boolean;
  sendingComment: boolean;
  onRefresh: () => void;
  onLoadFeed: () => void;
  onLoadMyPosts: () => void;
  onToggleComments: (type: string, id: string) => void;
  onChangeComment: (text: string) => void;
  onAddComment: () => void;
  onCreatePost: (content: string) => Promise<boolean>;
  onDeletePost: (postId: string) => void;
}

export function FeedTab({
  userId,
  feedPosts,
  myPosts,
  loadingFeed,
  loadingMyPosts,
  refreshing,
  comments,
  commentTarget,
  commentText,
  loadingComments,
  sendingComment,
  onRefresh,
  onLoadFeed,
  onLoadMyPosts,
  onToggleComments,
  onChangeComment,
  onAddComment,
  onCreatePost,
  onDeletePost,
}: FeedTabProps) {
  const router = useRouter();
  const [feedSubTab, setFeedSubTab] = useState<"all" | "mine">("all");
  const [showPostForm, setShowPostForm] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);

  const visiblePosts =
    feedSubTab === "all"
      ? feedPosts.filter((p) => p.user_id !== userId)
      : myPosts;
  const loading = feedSubTab === "all" ? loadingFeed : loadingMyPosts;

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    setPosting(true);
    const ok = await onCreatePost(postContent.trim());
    if (ok) {
      setPostContent("");
      setShowPostForm(false);
    }
    setPosting(false);
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            onLoadFeed();
            onLoadMyPosts();
            onRefresh();
          }}
        />
      }
      contentContainerClassName="p-5 pb-10"
    >
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-bold text-[#211f1e]">Feed</Text>
        <TouchableOpacity
          className="bg-[#ff7e70] py-2 px-4 rounded-lg flex-row items-center"
          onPress={() => setShowPostForm(true)}
        >
          <Text className="text-white text-lg mr-1">✏️</Text>
          <Text className="text-white font-semibold">Publicar</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row bg-white rounded-xl mb-4 shadow-sm">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-l-xl ${feedSubTab === "all" ? "bg-[#ff7e70]" : "bg-white"}`}
          onPress={() => setFeedSubTab("all")}
        >
          <Text className={`text-center font-semibold ${feedSubTab === "all" ? "text-white" : "text-gray-500"}`}>
            Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-r-xl ${feedSubTab === "mine" ? "bg-[#ff7e70]" : "bg-white"}`}
          onPress={() => setFeedSubTab("mine")}
        >
          <Text className={`text-center font-semibold ${feedSubTab === "mine" ? "text-white" : "text-gray-500"}`}>
            Mis posts
          </Text>
        </TouchableOpacity>
      </View>

      {showPostForm && (
        <View className="bg-white p-4 rounded-xl mb-6 shadow-sm">
          <TextInput
            className="bg-white p-3 rounded-lg mb-3 border border-gray-300 text-[#211f1e]"
            placeholder="¿Qué quieres compartir?"
            placeholderTextColor="#9BA1A6"
            value={postContent}
            onChangeText={setPostContent}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg ${posting ? "bg-gray-400" : "bg-[#ff7e70]"}`}
              onPress={handleCreatePost}
              disabled={posting}
            >
              <Text className={`text-center font-bold ${posting ? "text-gray-700" : "text-white"}`}>{posting ? "Publicando..." : "Publicar"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-[#211f1e] py-3 rounded-lg"
              onPress={() => {
                setShowPostForm(false);
                setPostContent("");
              }}
            >
              <Text className="text-white text-center font-bold">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#ff7e70" />
      ) : visiblePosts.length === 0 ? (
        <View className="bg-white p-10 rounded-xl items-center">
          <Text className="text-4xl mb-3">📱</Text>
          <Text className="text-gray-500 text-center">
            {feedSubTab === "all" ? "No hay publicaciones en el feed" : "No has publicado nada aún"}
          </Text>
        </View>
      ) : (
        visiblePosts.map((post) => {
          const isMine = post.user_id === userId;
          const postComments = comments.filter(
            (c) => c.target_type === "post" && c.target_id === post.id,
          );
          return (
            <TouchableOpacity
              key={post.id}
              activeOpacity={1}
              className="bg-white p-4 rounded-xl mb-3 shadow-sm"
              onPress={() => onToggleComments("post", post.id)}
            >
              <TouchableOpacity
                className="flex-row items-center gap-3 mb-3"
                onPress={() => router.push(`/perfil/${post.user_id}`)}
              >
                {post.owner_profile_picture ? (
                  <Image source={{ uri: post.owner_profile_picture }} className="w-10 h-10 rounded-full" />
                ) : (
                  <View className="w-10 h-10 bg-[#ff7e70] rounded-full items-center justify-center">
                    <Text className="text-white font-bold">{post.owner_name?.[0]?.toUpperCase() || "U"}</Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="font-semibold text-[#211f1e]">{post.owner_name}</Text>
                  <Text className="text-gray-500 text-xs">
                    {new Date(post.created_at).toLocaleDateString("es-MX", {
                      day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                    })}
                  </Text>
                </View>
                {isMine && (
                  <TouchableOpacity onPress={() => onDeletePost(post.id)}>
                    <Text className="text-[#ff7e70]">🗑️</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              <Text className="text-[#211f1e] leading-5 mb-2">{post.content}</Text>

              <View className="flex-row items-center gap-2 pt-2 border-t border-gray-100">
                <Text className="text-gray-500 text-sm">💬 {post.comment_count}</Text>
                <Text className="text-[#ff7e70] text-xs ml-auto">
                  {commentTarget?.id === post.id ? "Ocultar comentarios" : "Ver comentarios"}
                </Text>
              </View>

              {commentTarget?.id === post.id && commentTarget?.type === "post" && (
                <View className="mt-3 pt-3 border-t border-gray-100">
                  {loadingComments ? (
                    <ActivityIndicator size="small" color="#ff7e70" />
                  ) : postComments.length === 0 ? (
                    <Text className="text-gray-500 text-sm mb-2">Sin comentarios</Text>
                  ) : (
                    postComments.map((c) => (
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
                      className="flex-1 bg-white rounded-full px-4 py-2 text-sm border border-gray-200 text-[#211f1e]"
                      placeholder="Escribe un comentario..."
                      placeholderTextColor="#9BA1A6"
                      value={commentTarget?.id === post.id ? commentText : ""}
                      onChangeText={onChangeComment}
                    />
                    <TouchableOpacity
                      className="bg-[#ff7e70] rounded-full w-8 h-8 items-center justify-center"
                      onPress={onAddComment}
                      disabled={sendingComment || !commentText.trim()}
                    >
                      <Text className="text-white text-sm">{sendingComment ? "⏳" : "➤"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}
