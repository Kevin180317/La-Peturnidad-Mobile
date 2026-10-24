import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import { dashboardService, type PickedImage } from "@/services/dashboard.service";
import { reportsService } from "@/services/reports.service";
import {
  successStoriesService,
  type SuccessStoryWithOwner,
} from "@/services/success-stories.service";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function HistoriasScreen() {
  const router = useRouter();
  const [stories, setStories] = useState<SuccessStoryWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [petName, setPetName] = useState("");
  const [story, setStory] = useState("");
  const [image, setImage] = useState<PickedImage | null>(null);
  const [posting, setPosting] = useState(false);
  const [petNameFocused, setPetNameFocused] = useState(false);
  const [storyFocused, setStoryFocused] = useState(false);

  const loadStories = async () => {
    const result = await successStoriesService.getAll();
    if (result.success) {
      setStories(result.data ?? []);
    } else {
      Toast.show({ type: "error", text1: "Error al cargar historias", text2: result.error, position: "top" });
    }
    setLoading(false);
    setRefreshing(false);
  };

  const init = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) { router.replace("/"); return; }
    setUserId(user.user.id);
    const [blocked] = await Promise.all([
      reportsService.getBlockedUsers(user.user.id),
      loadStories(),
    ]);
    setBlockedIds(blocked.data ?? []);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStories();
  };

  const resetForm = () => {
    setShowForm(false);
    setPetName("");
    setStory("");
    setImage(null);
  };

  const handlePickImage = async () => {
    const r = await dashboardService.selectImage();
    if (r.success) {
      setImage(r.image);
    } else if (r.error !== "Selección cancelada") {
      Toast.show({ type: "error", text1: "Error", text2: r.error, position: "top" });
    }
  };

  const handleCreate = async () => {
    if (!userId || posting) return;
    if (!petName.trim() || !story.trim()) {
      Toast.show({
        type: "error",
        text1: "Completa los campos obligatorios",
        text2: "Nombre de la mascota e historia",
        position: "top",
        visibilityTime: 2500,
      });
      return;
    }
    setPosting(true);

    let imageUrl: string | undefined;
    if (image) {
      const upload = await dashboardService.uploadImage(image, "posts");
      if (!upload.success || !upload.url) {
        Toast.show({ type: "error", text1: "No se pudo subir la imagen", text2: upload.error, position: "top" });
        setPosting(false);
        return;
      }
      imageUrl = upload.url;
    }

    const result = await successStoriesService.create({
      user_id: userId,
      pet_name: petName.trim(),
      story: story.trim(),
      image_url: imageUrl,
    });
    if (result.success) {
      Toast.show({ type: "success", text1: "Historia publicada", position: "top", visibilityTime: 2000 });
      resetForm();
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

  // init corre una sola vez al montar (deps estables intencionales)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar: el setState ocurre tras la consulta async
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-[#faf5e0]">
        <CardSkeleton />
      </View>
    );
  }

  const blockedSet = new Set(blockedIds);
  const visibleStories = stories.filter((s) => !blockedSet.has(s.user_id));

  return (
    <View className="flex-1 bg-[#faf5e0]">
      <FlatList
        data={visibleStories}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerClassName="p-5 pb-10"
        ListHeaderComponent={
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-1.5 flex-1 mr-2">
              <Ionicons name="paw" size={20} color="#211f1e" />
              <Text className="text-2xl font-bold text-[#211f1e]">Reuniones exitosas</Text>
            </View>
            <TouchableOpacity
              className="bg-[#007275] py-2 px-4 rounded-xl flex-row items-center"
              onPress={() => setShowForm(true)}
            >
              <Ionicons name="sparkles" size={18} color="white" style={{ marginRight: 6 }} />
              <Text className="text-white font-semibold">Nueva</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="paw"
            title="No hay historias de éxito aún"
            subtitle="¿Encontraste a tu mascota? ¡Comparte tu historia!"
            actionLabel="Publicar historia"
            onAction={() => setShowForm(true)}
          />
        }
        renderItem={({ item: s }) => {
          const isMine = s.user_id === userId;
          return (
            <View className="bg-white p-5 rounded-2xl mb-4 shadow-[0_4px_24px_rgba(33,31,30,0.08)]">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2 flex-1">
                  <Ionicons name="paw" size={20} color="#007275" />
                  <Text className="font-bold text-lg text-[#211f1e]">{s.pet_name}</Text>
                </View>
                {isMine && (
                  <TouchableOpacity onPress={() => handleDelete(s.id)}>
                    <Ionicons name="trash-outline" size={20} color="#d93a3a" />
                  </TouchableOpacity>
                )}
              </View>
              {s.image_url && (
                <Image source={{ uri: s.image_url }} className="w-full h-48 rounded-xl mb-3" resizeMode="cover" />
              )}
              <Text className="text-gray-600 leading-6">{s.story}</Text>
              <TouchableOpacity onPress={() => router.push(`/perfil/${s.user_id}`)}>
                <Text className="text-gray-500 text-xs mt-3">
                  {s.owner_name}
                  {s.created_at
                    ? ` · ${new Date(s.created_at).toLocaleDateString("es-MX", {
                        day: "numeric", month: "long", year: "numeric",
                      })}`
                    : ""}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <Modal animationType="slide" transparent visible={showForm} onRequestClose={() => { if (!posting) setShowForm(false); }}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-[#211f1e]">Nueva historia</Text>
              <TouchableOpacity onPress={() => setShowForm(false)} disabled={posting}>
                <Ionicons name="close" size={24} color="#211f1e" />
              </TouchableOpacity>
            </View>
            <TextInput
              className={`bg-white p-3 rounded-lg mb-3 text-[#211f1e] ${petNameFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-300"}`}
              placeholder="Nombre de tu mascota *"
              placeholderTextColor="#9BA1A6"
              value={petName}
              onChangeText={setPetName}
              onFocus={() => setPetNameFocused(true)}
              onBlur={() => setPetNameFocused(false)}
            />
            <TextInput
              className={`bg-white p-3 rounded-lg mb-3 text-[#211f1e] ${storyFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-300"}`}
              placeholder="Cuenta tu historia de reencuentro... *"
              placeholderTextColor="#9BA1A6"
              value={story}
              onChangeText={setStory}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              onFocus={() => setStoryFocused(true)}
              onBlur={() => setStoryFocused(false)}
            />
            {image ? (
              <View className="mb-4">
                <Image source={{ uri: image.uri }} className="w-full h-40 rounded-xl" resizeMode="cover" />
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
                  onPress={() => setImage(null)}
                  disabled={posting}
                >
                  <Ionicons name="close" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="border border-dashed border-gray-300 rounded-xl py-4 mb-4 flex-row items-center justify-center"
                onPress={handlePickImage}
                disabled={posting}
              >
                <Ionicons name="image-outline" size={20} color="#4B5563" style={{ marginRight: 6 }} />
                <Text className="text-gray-600 font-medium">Agregar foto (opcional)</Text>
              </TouchableOpacity>
            )}
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl ${posting ? "bg-gray-400" : "bg-[#007275]"}`}
                disabled={posting}
                onPress={handleCreate}
              >
                <Text className={`text-center font-bold ${posting ? "text-gray-700" : "text-white"}`}>{posting ? "Publicando..." : "Publicar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-[#211f1e] py-3 rounded-xl" onPress={resetForm} disabled={posting}>
                <Text className="text-white text-center font-bold">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
