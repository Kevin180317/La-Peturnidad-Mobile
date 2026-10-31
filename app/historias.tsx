import { confirmDialog } from "@/components/ConfirmDialog";
import { Avatar, CARD, EmptyCard, Field, PrimaryButton, RoundIconButton, ScreenTitle, Sheet } from "@/components/kit/Kit";
import { formatTimeAgo } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
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
  FlatList,
  Image,
  RefreshControl,
  Text,
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
    confirmDialog({
      title: "Eliminar",
      message: "¿Eliminar esta historia?",
      confirmLabel: "Eliminar",
      destructive: true,
      onConfirm: async () => {
        const r = await successStoriesService.delete(id);
        if (r.success) await loadStories();
        else Toast.show({ type: "error", text1: "Error", text2: r.error, position: "top" });
      },
    });
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
          <ScreenTitle
            title="Reuniones exitosas"
            subtitle="Mascotas que volvieron a casa"
            right={
              <TouchableOpacity
                className="bg-[#007275] py-2.5 pl-3 pr-4 rounded-full flex-row items-center gap-1.5 shadow-[0_4px_12px_rgba(0,114,117,0.3)]"
                activeOpacity={0.85}
                onPress={() => setShowForm(true)}
                accessibilityRole="button"
              >
                <Ionicons name="sparkles" size={16} color="white" />
                <Text className="text-white font-semibold">Nueva</Text>
              </TouchableOpacity>
            }
          />
        }
        ListEmptyComponent={
          <EmptyCard icon="heart-outline" title="No hay historias de éxito aún" text="¿Encontraste a tu mascota? ¡Comparte tu historia!">
            <TouchableOpacity className="bg-[#007275] py-2.5 px-5 rounded-full mt-4" onPress={() => setShowForm(true)}>
              <Text className="text-white font-semibold">Publicar historia</Text>
            </TouchableOpacity>
          </EmptyCard>
        }
        renderItem={({ item: s }) => {
          const isMine = s.user_id === userId;
          return (
            <View className={`${CARD} mb-4 overflow-hidden`}>
              {s.image_url ? (
                <View>
                  <Image source={{ uri: s.image_url }} className="w-full bg-gray-100" style={{ aspectRatio: 4 / 3 }} resizeMode="cover" />
                  <View className="absolute top-3 left-3">
                    <View className="bg-white/95 px-3 py-1.5 rounded-full flex-row items-center gap-1">
                      <Ionicons name="heart" size={13} color="#ff7e70" />
                      <Text className="text-xs font-bold text-[#211f1e]">De vuelta en casa</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View className="h-24 bg-[#007275]/10 items-center justify-center">
                  <Ionicons name="heart" size={34} color="#007275" />
                </View>
              )}
              <View className="p-4">
                <View className="flex-row items-center">
                  <Text className="font-bold text-xl text-[#211f1e] flex-1">{s.pet_name}</Text>
                  {isMine && <RoundIconButton icon="trash-outline" tint="red" onPress={() => handleDelete(s.id)} label="Eliminar historia" />}
                </View>
                <Text className="text-gray-700 leading-6 text-[15px] mt-1.5">{s.story}</Text>
                <TouchableOpacity className="flex-row items-center gap-2 mt-4 pt-3 border-t border-gray-100" onPress={() => router.push(`/perfil/${s.user_id}`)}>
                  <Avatar name={s.owner_name} size={28} ring={false} />
                  <Text className="text-[#211f1e] text-sm font-semibold flex-1" numberOfLines={1}>{s.owner_name}</Text>
                  {!!s.created_at && <Text className="text-gray-500 text-xs">{formatTimeAgo(s.created_at)}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <Sheet visible={showForm} title="Nueva historia" onClose={() => setShowForm(false)} closeDisabled={posting}>
        <Field label="Nombre de tu mascota *" icon="paw-outline" placeholder="Nombre" value={petName} onChangeText={setPetName} />
        <Field
          label="Tu historia *"
          placeholder="Cuenta tu historia de reencuentro..."
          value={story}
          onChangeText={setStory}
          multiline
          numberOfLines={6}
        />
        {image ? (
          <View className="mb-4">
            <Image source={{ uri: image.uri }} className="w-full h-40 rounded-2xl" resizeMode="cover" />
            <View className="absolute top-2 right-2">
              <RoundIconButton icon="close" tint="white" size={32} onPress={() => setImage(null)} label="Quitar foto" disabled={posting} />
            </View>
          </View>
        ) : (
          <TouchableOpacity
            className="border-2 border-dashed border-[#007275]/40 bg-[#faf5e0] rounded-2xl py-4 mb-4 flex-row items-center justify-center gap-2"
            onPress={handlePickImage}
            disabled={posting}
          >
            <Ionicons name="image-outline" size={20} color="#007275" />
            <Text className="text-[#007275] font-semibold">Agregar foto (opcional)</Text>
          </TouchableOpacity>
        )}
        <PrimaryButton title={posting ? "Publicando..." : "Publicar"} icon="paper-plane" loading={posting} onPress={handleCreate} />
        <TouchableOpacity className="py-3 mt-1" onPress={resetForm} disabled={posting}>
          <Text className="text-center font-semibold text-gray-600">Cancelar</Text>
        </TouchableOpacity>
      </Sheet>
    </View>
  );
}
