import { dashboardService, type PickedImage } from "@/services/dashboard.service";
import { Ionicons } from "@expo/vector-icons";
import { CARD, ChoiceChips, Field, PrimaryButton, RoundIconButton, Segmented } from "@/components/kit/Kit";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ScrollView,
  Text,
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <KeyboardAvoidingView
        className="flex-1 bg-[#faf5e0]"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View className="px-4 pt-12 pb-3 flex-row items-center justify-between">
          <RoundIconButton icon="close" tint="white" onPress={onClose} label="Cerrar" />
          <Text className="text-[#211f1e] text-lg font-bold">Crear publicación</Text>
          <View className="w-9" />
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-5 pb-8" keyboardShouldPersistTaps="handled">
          <Segmented
            options={[
              { key: "social", label: "Social · con imagen", icon: "images" },
              { key: "announcements", label: "Anuncio", icon: "megaphone" },
            ]}
            value={postType}
            onChange={setPostType}
          />

          <View className={`${CARD} p-4 mb-4`}>
            {postType === "announcements" && (
              <>
                <Field label="Título" icon="text-outline" placeholder="Título de la publicación" value={title} onChangeText={setTitle} />
                <Text className="text-[13px] font-semibold text-[#211f1e] mb-1.5 ml-1">Categoría</Text>
                <View className="mb-4">
                  <ChoiceChips
                    options={CATEGORIES.map((cat) => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))}
                    value={category}
                    onChange={setCategory}
                  />
                </View>
              </>
            )}

            <Field
              label={postType === "social" ? "Escribe tu historia" : "Descripción"}
              placeholder="Cuéntale a tu comunidad..."
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
            />

            {/* Imagen (una sola, obligatoria en Social) */}
            {postType === "social" && (
              <>
                <Text className="text-[13px] font-semibold text-[#211f1e] mb-1.5 ml-1">Imagen (requerida)</Text>
                {image ? (
                  <View>
                    <Image source={{ uri: image.uri }} className="w-full rounded-2xl bg-gray-100" style={{ aspectRatio: 4 / 5 }} />
                    <View className="absolute top-3 right-3">
                      <RoundIconButton icon="close" tint="white" onPress={() => setImage(null)} label="Quitar imagen" />
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleAddImage}
                    className="h-40 bg-[#faf5e0] rounded-2xl border-2 border-dashed border-[#007275]/40 items-center justify-center"
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Agregar imagen"
                  >
                    <View className="w-12 h-12 rounded-full bg-[#007275]/10 items-center justify-center mb-2">
                      <Ionicons name="image-outline" size={24} color="#007275" />
                    </View>
                    <Text className="text-sm text-[#007275] font-semibold">Agregar imagen</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </ScrollView>

        <View className="px-5 pt-3 pb-8 bg-[#faf5e0]">
          <PrimaryButton
            title={loading ? "Publicando..." : "Publicar"}
            icon="paper-plane"
            onPress={handleSubmit}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
