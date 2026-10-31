import { confirmDialog } from "@/components/ConfirmDialog";
import { Avatar, CARD, Chip, ChoiceChips, EmptyCard, Field, PrimaryButton, RoundIconButton, ScreenTitle, Sheet } from "@/components/kit/Kit";
import { formatTimeAgo } from "@/utils/format";
import { announcementsService } from "@/services/announcements.service";
import { reportsService } from "@/services/reports.service";
import { getCurrentUser } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const categories = [
  { key: "general", label: "General", icon: "chatbubbles" as const },
  { key: "aviso", label: "Aviso", icon: "megaphone" as const },
  { key: "evento", label: "Evento", icon: "calendar" as const },
  { key: "pregunta", label: "Pregunta", icon: "help-circle" as const },
];

export default function ComunidadScreen() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState<string>("general");
  const [posting, setPosting] = useState(false);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  const init = async () => {
    const { data: user } = await getCurrentUser();
    if (!user?.user) {
      router.replace("/");
      return;
    }
    setUserId(user.user.id);
    const [blocked] = await Promise.all([
      reportsService.getBlockedUsers(user.user.id),
      loadAnnouncements(),
    ]);
    setBlockedIds(blocked.data ?? []);
  };

  const loadAnnouncements = useCallback(async () => {
    const result = await announcementsService.getAll();
    if (result.success) {
      setAnnouncements(result.data ?? []);
    } else {
      Toast.show({ type: "error", text1: "Error", text2: result.error, position: "top", visibilityTime: 3000 });
    }
    setLoading(false);
  }, []);

  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      loadAnnouncements();
    }, [loadAnnouncements]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  };

  const handlePost = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      Toast.show({ type: "error", text1: "Completa todos los campos", position: "top", visibilityTime: 2000 });
      return;
    }
    if (!userId) return;

    setPosting(true);
    const result = await announcementsService.create({
      user_id: userId,
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory as any,
    });

    if (result.success) {
      Toast.show({ type: "success", text1: "Publicado", position: "top", visibilityTime: 2000 });
      setShowForm(false);
      setFormTitle("");
      setFormContent("");
      setFormCategory("general");
      await loadAnnouncements();
    } else {
      Toast.show({ type: "error", text1: "Error", text2: result.error, position: "top", visibilityTime: 3000 });
    }
    setPosting(false);
  };

  const handleDelete = (id: string) => {
    confirmDialog({
      title: "Eliminar",
      message: "¿Eliminar este aviso?",
      confirmLabel: "Eliminar",
      destructive: true,
      onConfirm: async () => {
        const result = await announcementsService.delete(id);
        if (result.success) {
          Toast.show({ type: "success", text1: "Eliminado", position: "top", visibilityTime: 2000 });
          await loadAnnouncements();
        } else {
          Toast.show({ type: "error", text1: "Error", text2: result.error, position: "top", visibilityTime: 3000 });
        }
      },
    });
  };

  // init corre una sola vez al montar (deps estables intencionales)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar: el setState ocurre tras la consulta async
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blockedSet = new Set(blockedIds);
  const visibleAnnouncements = announcements.filter((a) => !blockedSet.has(a.user_id));

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#007275" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#faf5e0]">
      <FlatList
        data={visibleAnnouncements}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerClassName="p-5 pb-10"
        ListHeaderComponent={
          <ScreenTitle
            title="Comunidad"
            subtitle="Avisos de tus vecinos"
            right={
              <TouchableOpacity
                className="bg-[#007275] py-2.5 pl-3 pr-4 rounded-full flex-row items-center gap-1.5 shadow-[0_4px_12px_rgba(0,114,117,0.3)]"
                activeOpacity={0.85}
                onPress={() => setShowForm(true)}
                accessibilityRole="button"
              >
                <Ionicons name="add" size={18} color="white" />
                <Text className="text-white font-semibold">Nuevo</Text>
              </TouchableOpacity>
            }
          />
        }
        ListEmptyComponent={
          <EmptyCard icon="chatbubbles-outline" title="No hay avisos en la comunidad todavía" text="¡Sé el primero en publicar!">
            <TouchableOpacity className="bg-[#007275] py-2.5 px-5 rounded-full mt-4" onPress={() => setShowForm(true)}>
              <Text className="text-white font-semibold">Publicar aviso</Text>
            </TouchableOpacity>
          </EmptyCard>
        }
        renderItem={({ item }) => {
          const isOwner = item.user_id === userId;
          const cat = categories.find((c) => c.key === item.category);
          return (
            <View className={`${CARD} mb-4 overflow-hidden`}>
              <View className="flex-row items-center gap-3 p-4">
                <TouchableOpacity className="flex-row items-center gap-3 flex-1" activeOpacity={0.7} onPress={() => router.push(`/perfil/${item.user_id}`)}>
                  <Avatar uri={item.owner_profile_picture} name={item.owner_name} />
                  <View className="flex-1">
                    <Text className="font-bold text-[#211f1e] text-[15px]" numberOfLines={1}>{item.owner_name}</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">{formatTimeAgo(item.created_at)}</Text>
                  </View>
                </TouchableOpacity>
                {isOwner && <RoundIconButton icon="trash-outline" tint="red" onPress={() => handleDelete(item.id)} label="Eliminar aviso" />}
              </View>
              <View className="px-4 pb-4">
                <View className="self-start mb-2.5">
                  <Chip icon={cat?.icon} text={cat?.label || item.category} tone={item.category === "evento" ? "teal" : item.category === "pregunta" ? "dark" : "neutral"} />
                </View>
                <Text className="font-bold text-lg text-[#211f1e] mb-1">{item.title}</Text>
                <Text className="text-gray-700 leading-6 text-[15px]">{item.content}</Text>
              </View>
            </View>
          );
        }}
      />

      <Sheet visible={showForm} title="Nuevo aviso" onClose={() => setShowForm(false)} closeDisabled={posting}>
        <Text className="text-[13px] font-semibold text-[#211f1e] mb-1.5 ml-1">Categoría</Text>
        <View className="mb-4">
          <ChoiceChips
            options={categories.map((c) => ({ value: c.key, label: c.label, icon: c.icon }))}
            value={formCategory}
            onChange={setFormCategory}
          />
        </View>
        <Field label="Título *" icon="text-outline" placeholder="Título" value={formTitle} onChangeText={setFormTitle} />
        <Field
          label="Mensaje *"
          placeholder="Escribe tu mensaje..."
          value={formContent}
          onChangeText={setFormContent}
          multiline
          numberOfLines={5}
        />
        <PrimaryButton title={posting ? "Publicando..." : "Publicar"} icon="paper-plane" loading={posting} onPress={handlePost} />
      </Sheet>
    </View>
  );
}
