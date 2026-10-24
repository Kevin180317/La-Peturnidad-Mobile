import { dashboardService, type PickedImage } from "@/services/dashboard.service";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

// Las alertas de emergencia se crean desde la pestaña Emergencia
export type PostType = "social" | "announcements";

export type AnnouncementCategory = "general" | "aviso" | "evento" | "pregunta";

const CATEGORIES: AnnouncementCategory[] = ["general", "aviso", "evento", "pregunta"];

export interface PostFormData {
  type: PostType;
  content: string;
  /** Solo "social": una imagen (posts.image_url) */
  image?: PickedImage;
  /** Solo "announcements" */
  title?: string;
  category?: AnnouncementCategory;
}

interface PostFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: PostFormData) => Promise<boolean>;
  loading?: boolean;
}

export function PostForm({
  visible,
  onClose,
  onSubmit,
  loading = false,
}: PostFormProps) {
  const [postType, setPostType] = useState<PostType>("social");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("general");
  const [image, setImage] = useState<PickedImage | null>(null);
  const [contentFocused, setContentFocused] = useState(false);

  const showError = (text2: string) =>
    Toast.show({ type: "error", text1: "Error", text2, position: "top" });

  const handleAddImage = async () => {
    const result = await dashboardService.selectImage();
    if (result.success) {
      setImage(result.image);
    } else if (result.error !== "Selección cancelada") {
      showError(result.error);
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!content.trim()) {
      showError("Escribe el contenido");
      return;
    }

    if (postType === "announcements" && !title.trim()) {
      showError("Agrega un titulo");
      return;
    }

    if (postType === "social" && !image) {
      showError("Agrega una imagen");
      return;
    }

    const success = await onSubmit(
      postType === "social"
        ? { type: "social", content: content.trim(), image: image ?? undefined }
        : {
            type: "announcements",
            content: content.trim(),
            title: title.trim(),
            category,
          },
    );

    if (success) {
      setContent("");
      setTitle("");
      setCategory("general");
      setImage(null);
      setPostType("social");
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent
    >
      <View className="flex-1 bg-[#faf5e0]">
        {/* Header */}
        <View className="bg-[#007275] px-4 py-4 flex-row items-center justify-between shadow-lg">
          <TouchableOpacity onPress={onClose} className="active:opacity-70">
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Crear publicacion</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="active:opacity-70"
          >
            <Text className={`font-semibold ${loading ? "text-gray-300" : "text-white"}`}>
              {loading ? "..." : "Publicar"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Selector de tipo de post */}
          <Text className="font-semibold text-[#211f1e] mb-2">Tipo de publicacion</Text>
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={() => setPostType("social")}
              className={`flex-1 py-3 rounded-xl border-2 items-center ${
                postType === "social"
                  ? "bg-[#007275] border-[#007275]"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text className={`font-semibold text-sm ${postType === "social" ? "text-white" : "text-gray-600"}`}>
                Social
              </Text>
              <Text className={`text-xs mt-0.5 ${postType === "social" ? "text-white/70" : "text-gray-500"}`}>
                Con imagen
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPostType("announcements")}
              className={`flex-1 py-3 rounded-xl border-2 items-center ${
                postType === "announcements"
                  ? "bg-[#007275] border-[#007275]"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text className={`font-semibold text-sm ${postType === "announcements" ? "text-white" : "text-gray-600"}`}>
                Anuncios
              </Text>
              <Text className={`text-xs mt-0.5 ${postType === "announcements" ? "text-white/70" : "text-gray-500"}`}>
                Categorizado
              </Text>
            </TouchableOpacity>
          </View>

          {postType === "announcements" && (
            <>
              <Text className="font-semibold text-[#211f1e] mb-2">Titulo</Text>
              <TextInput
                className="bg-white p-3 rounded-lg mb-4 border border-gray-300 text-[#211f1e]"
                placeholder="Titulo de la publicacion"
                placeholderTextColor="#9BA1A6"
                value={title}
                onChangeText={setTitle}
              />

              <Text className="font-semibold text-[#211f1e] mb-2">Categoria</Text>
              <View className="flex-row gap-2 mb-4 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-full border-2 ${
                      category === cat
                        ? "bg-[#007275] border-[#007275]"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${category === cat ? "text-white" : "text-gray-600"}`}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Contenido */}
          <Text className="font-semibold text-[#211f1e] mb-2">
            {postType === "social" ? "Escribe tu historia" : "Descripcion"}
          </Text>
          <TextInput
            className={`bg-white p-4 rounded-lg mb-4 ${
              contentFocused
                ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]"
                : "border border-gray-300"
            } text-[#211f1e]`}
            placeholder="Cuéntale a tu comunidad..."
            placeholderTextColor="#9BA1A6"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            onFocus={() => setContentFocused(true)}
            onBlur={() => setContentFocused(false)}
          />

          {/* Imagen (una sola, obligatoria en Social) */}
          {postType === "social" && (
            <>
              <Text className="font-semibold text-[#211f1e] mb-2">Imagen (Requerida)</Text>
              <View className="flex-row gap-2 mb-4 flex-wrap">
                {image ? (
                  <View className="relative">
                    <Image source={{ uri: image.uri }} className="w-24 h-24 rounded-xl" />
                    <TouchableOpacity
                      onPress={() => setImage(null)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 shadow-lg"
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleAddImage}
                    className="w-24 h-24 bg-[#007275]/5 rounded-xl border-2 border-dashed border-[#007275] items-center justify-center active:bg-[#007275]/10"
                  >
                    <Ionicons name="image-outline" size={32} color="#007275" />
                    <Text className="text-xs text-[#007275] mt-1 font-semibold">Agregar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </ScrollView>

        {/* Botones */}
        <View className="bg-white border-t border-gray-200 px-4 py-3 flex-row gap-3 shadow-lg">
          <TouchableOpacity
            onPress={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 active:bg-gray-200"
          >
            <Text className="text-center font-semibold text-[#211f1e]">
              Cancelar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl ${
              loading ? "bg-gray-400" : "bg-[#007275] active:bg-[#004052]"
            }`}
          >
            <Text className={`text-center font-semibold ${loading ? "text-gray-700" : "text-white"}`}>
              {loading ? "Publicando..." : "Publicar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
