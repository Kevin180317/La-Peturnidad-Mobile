import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import { successStoriesService } from "@/services/success-stories.service";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function HistoriasScreen() {
  const router = useRouter();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [petName, setPetName] = useState("");
  const [story, setStory] = useState("");
  const [posting, setPosting] = useState(false);

  // init corre una sola vez al montar (deps estables intencionales)
  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const init = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) { router.replace("/"); return; }
    setUserId(user.user.id);
    await loadStories();
  };

  const loadStories = async () => {
    const result = await successStoriesService.getAll();
    if (result.success) setStories(result.data ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStories();
  };

  const handleCreate = async () => {
    if (!petName.trim() || !story.trim() || !userId) return;
    setPosting(true);
    const result = await successStoriesService.create({
      user_id: userId,
      pet_name: petName.trim(),
      story: story.trim(),
    });
    if (result.success) {
      Toast.show({ type: "success", text1: "Historia publicada", position: "top", visibilityTime: 2000 });
      setShowForm(false);
      setPetName("");
      setStory("");
      await loadStories();
    } else {
      Toast.show({ type: "error", text1: "Error", text2: result.error, position: "top" });
    }
    setPosting(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Eliminar", "¿Eliminar esta historia?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const r = await successStoriesService.delete(id);
          if (r.success) await loadStories();
          else Toast.show({ type: "error", text1: "Error", text2: r.error, position: "top" });
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#faf5e0]">
        <CardSkeleton />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#faf5e0]">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerClassName="p-5 pb-10"
      >
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-[#211f1e]">🐾 Reuniones exitosas</Text>
          <TouchableOpacity
            className="bg-[#ff7e70] py-2 px-4 rounded-lg flex-row items-center"
            onPress={() => setShowForm(true)}
          >
            <Text className="text-white text-lg mr-1">✨</Text>
            <Text className="text-white font-semibold">Nueva</Text>
          </TouchableOpacity>
        </View>

        {stories.length === 0 ? (
          <EmptyState
            icon="🐕"
            title="No hay historias de éxito aún"
            subtitle="¿Encontraste a tu mascota? ¡Comparte tu historia!"
            actionLabel="Publicar historia"
            onAction={() => setShowForm(true)}
          />
        ) : (
          stories.map((s) => {
            const isMine = s.user_id === userId;
            return (
              <View key={s.id} className="bg-white p-5 rounded-xl mb-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-2xl">🐾</Text>
                    <Text className="font-bold text-lg text-[#211f1e]">{s.pet_name}</Text>
                  </View>
                  {isMine && (
                    <TouchableOpacity onPress={() => handleDelete(s.id)}>
                      <Text className="text-[#ff7e70]">🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {s.image_url && (
                  <Image source={{ uri: s.image_url }} className="w-full h-48 rounded-xl mb-3" resizeMode="cover" />
                )}
                <Text className="text-gray-600 leading-6">{s.story}</Text>
                <Text className="text-gray-500 text-xs mt-3">
                  {new Date(s.created_at).toLocaleDateString("es-MX", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal animationType="slide" transparent visible={showForm} onRequestClose={() => setShowForm(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-[#211f1e]">Nueva historia</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text className="text-[#211f1e] text-2xl">✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              className="bg-white p-3 rounded-lg mb-3 border border-gray-300 text-[#211f1e]"
              placeholder="Nombre de tu mascota *"
              placeholderTextColor="#9BA1A6"
              value={petName}
              onChangeText={setPetName}
            />
            <TextInput
              className="bg-white p-3 rounded-lg mb-4 border border-gray-300 text-[#211f1e]"
              placeholder="Cuenta tu historia de reencuentro... *"
              placeholderTextColor="#9BA1A6"
              value={story}
              onChangeText={setStory}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${posting ? "bg-gray-400" : "bg-[#ff7e70]"}`}
                disabled={posting}
                onPress={handleCreate}
              >
                <Text className={`text-center font-bold ${posting ? "text-gray-700" : "text-white"}`}>{posting ? "Publicando..." : "Publicar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-[#211f1e] py-3 rounded-lg" onPress={() => setShowForm(false)}>
                <Text className="text-white text-center font-bold">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
