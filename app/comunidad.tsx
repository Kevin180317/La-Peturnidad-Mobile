import { announcementsService } from "@/services/announcements.service";
import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

const categories = [
  { key: "general", label: "General", icon: "💬" },
  { key: "aviso", label: "Aviso", icon: "📢" },
  { key: "evento", label: "Evento", icon: "📅" },
  { key: "pregunta", label: "Pregunta", icon: "❓" },
] as const;

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

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      router.replace("/");
      return;
    }
    setUserId(user.user.id);
    await loadAnnouncements();
  };

  const loadAnnouncements = async () => {
    const result = await announcementsService.getAll();
    if (result.success) {
      setAnnouncements(result.data);
    } else {
      Toast.show({ type: "error", text1: "Error", text2: result.error, position: "top", visibilityTime: 3000 });
    }
    setLoading(false);
  };

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
    Alert.alert("Eliminar", "¿Eliminar este aviso?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const result = await announcementsService.delete(id);
          if (result.success) {
            Toast.show({ type: "success", text1: "Eliminado", position: "top", visibilityTime: 2000 });
            await loadAnnouncements();
          } else {
            Toast.show({ type: "error", text1: "Error", text2: result.error, position: "top", visibilityTime: 3000 });
          }
        },
      },
    ]);
  };

  const categoryIcon = (cat: string) => {
    const found = categories.find((c) => c.key === cat);
    return found?.icon || "💬";
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "aviso": return "bg-red-100 text-red-600";
      case "evento": return "bg-blue-100 text-blue-600";
      case "pregunta": return "bg-yellow-100 text-yellow-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#ff7e70" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#faf5e0]">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerClassName="p-5 pb-10"
      >
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-[#211f1e]">Comunidad</Text>
          <TouchableOpacity
            className="bg-[#ff7e70] py-2 px-4 rounded-lg flex-row items-center gap-1"
            onPress={() => setShowForm(true)}
          >
            <Ionicons name="add" size={18} color="white" />
            <Text className="text-white font-semibold">Nuevo</Text>
          </TouchableOpacity>
        </View>

        {announcements.length === 0 ? (
          <View className="bg-white p-10 rounded-xl items-center">
            <Text className="text-4xl mb-3">💬</Text>
            <Text className="text-gray-500 text-center">
              No hay avisos en la comunidad todavía. ¡Sé el primero en publicar!
            </Text>
          </View>
        ) : (
          announcements.map((item) => {
            const isOwner = item.user_id === userId;
            return (
              <View key={item.id} className="bg-white p-4 rounded-xl mb-3 shadow-sm">
                <View className="flex-row items-start gap-3 mb-2">
                  {item.owner_profile_picture ? (
                    <Image source={{ uri: item.owner_profile_picture }} className="w-10 h-10 rounded-full" />
                  ) : (
                    <View className="w-10 h-10 bg-[#ff7e70] rounded-full items-center justify-center">
                      <Text className="text-white font-bold">
                        {item.owner_name?.[0]?.toUpperCase() || "U"}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-semibold text-[#211f1e]">{item.owner_name}</Text>
                    <Text className="text-gray-400 text-xs">
                      {new Date(item.created_at).toLocaleDateString("es-MX", {
                        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  {isOwner && (
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Ionicons name="trash-outline" size={18} color="#ff7e70" />
                    </TouchableOpacity>
                  )}
                </View>

                <View className="mb-2">
                  <View className={`self-start px-2 py-0.5 rounded-full mb-1 ${categoryColor(item.category)}`}>
                    <Text className="text-xs font-medium">
                      {categoryIcon(item.category)} {categories.find((c) => c.key === item.category)?.label || item.category}
                    </Text>
                  </View>
                  <Text className="font-bold text-lg text-[#211f1e]">{item.title}</Text>
                </View>

                <Text className="text-gray-600 leading-5">{item.content}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal animationType="slide" transparent visible={showForm} onRequestClose={() => setShowForm(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-5 max-h-[90%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-[#211f1e]">Nuevo aviso</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color="#211f1e" />
              </TouchableOpacity>
            </View>

            <Text className="font-semibold mb-2 text-gray-600">Categoría</Text>
            <View className="flex-row gap-2 mb-4 flex-wrap">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  className={`py-2 px-4 rounded-full border-2 ${
                    formCategory === cat.key ? "border-[#ff7e70] bg-[#ff7e70]" : "border-gray-200 bg-[#faf5e0]"
                  }`}
                  onPress={() => setFormCategory(cat.key)}
                >
                  <Text className={`font-medium ${formCategory === cat.key ? "text-white" : "text-gray-600"}`}>
                    {cat.icon} {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              className="bg-[#faf5e0] p-3 rounded-lg mb-3 border border-gray-300"
              placeholder="Título *"
              value={formTitle}
              onChangeText={setFormTitle}
            />
            <TextInput
              className="bg-[#faf5e0] p-3 rounded-lg mb-4 border border-gray-300"
              placeholder="Escribe tu mensaje... *"
              value={formContent}
              onChangeText={setFormContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${posting ? "bg-gray-400" : "bg-[#ff7e70]"}`}
                onPress={handlePost}
                disabled={posting}
              >
                <Text className="text-white text-center font-bold">
                  {posting ? "Publicando..." : "Publicar"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-[#211f1e] py-3 rounded-lg"
                onPress={() => setShowForm(false)}
              >
                <Text className="text-white text-center font-bold">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
