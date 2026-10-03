import { dashboardService } from "@/services/dashboard.service";
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

export interface PostFormData {
  content: string;
  image_urls?: string[];
  location?: string;
  tags?: string[];
  urls?: string[];
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
  const [content, setContent] = useState("");
  const [images, setImages] = useState<{ uri: string }[]>([]);
  const [location, setLocation] = useState("");
  const [tagText, setTagText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [urlText, setUrlText] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [contentFocused, setContentFocused] = useState(false);

  const handleAddImage = async () => {
    const result = await dashboardService.selectImage();
    if (result.success && result.image) {
      setImages([...images, result.image]);
    } else if (result.error !== "Selección cancelada") {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: result.error,
        position: "top",
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleGetLocation = async () => {
    Toast.show({
      type: "info",
      text1: "Ingresa la ubicación",
      text2: "Escribe tu ciudad o ubicación manualmente",
      position: "top",
    });
  };

  const handleAddTag = () => {
    if (tagText.trim() && !tags.includes(tagText.trim())) {
      setTags([...tags, tagText.trim()]);
      setTagText("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleAddUrl = () => {
    if (urlText.trim() && !urls.includes(urlText.trim())) {
      setUrls([...urls, urlText.trim()]);
      setUrlText("");
    }
  };

  const handleRemoveUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Escribe algo para compartir",
        position: "top",
      });
      return;
    }

    const imageUrls = images.map((img) => img.uri);
    const success = await onSubmit({
      content: content.trim(),
      image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      location: location.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      urls: urls.length > 0 ? urls : undefined,
    });

    if (success) {
      setContent("");
      setImages([]);
      setLocation("");
      setTags([]);
      setUrls([]);
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
        <View className="bg-[#005e66] px-4 py-4 flex-row items-center justify-between shadow-lg">
          <TouchableOpacity onPress={onClose} className="active:opacity-70">
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Nuevo post</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="active:opacity-70"
          >
            <Text className={`font-semibold ${loading ? "text-gray-300" : "text-white"}`}>
              {loading ? "..." : "Compartir"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Contenido */}
          <Text className="font-semibold text-[#211f1e] mb-2">
            ¿Qué quieres compartir?
          </Text>
          <TextInput
            className={`bg-white p-4 rounded-lg mb-4 ${
              contentFocused
                ? "border-[#005e66] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]"
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

          {/* Imágenes */}
          <Text className="font-semibold text-[#211f1e] mb-2">Imágenes</Text>
          <View className="flex-row gap-2 mb-4 flex-wrap">
            <TouchableOpacity
              onPress={handleAddImage}
              className="w-24 h-24 bg-[#005e66]/5 rounded-xl border-2 border-dashed border-[#005e66] items-center justify-center active:bg-[#005e66]/10"
            >
              <Ionicons name="image-outline" size={32} color="#005e66" />
              <Text className="text-xs text-[#005e66] mt-1 font-semibold">Agregar</Text>
            </TouchableOpacity>
            {images.map((img, idx) => (
              <View key={idx} className="relative">
                <Image
                  source={{ uri: img.uri }}
                  className="w-24 h-24 rounded-xl"
                />
                <TouchableOpacity
                  onPress={() => handleRemoveImage(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 shadow-lg"
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Localización */}
          <Text className="font-semibold text-[#211f1e] mb-2">Ubicación</Text>
          <View className="flex-row gap-2 mb-4">
            <TextInput
              className="flex-1 bg-white p-3 rounded-lg border border-gray-300 text-[#211f1e]"
              placeholder="Ej: Tijuana, México"
              placeholderTextColor="#9BA1A6"
              value={location}
              onChangeText={setLocation}
            />
            <TouchableOpacity
              onPress={handleGetLocation}
              className="bg-[#005e66] px-4 rounded-lg items-center justify-center"
            >
              <Ionicons name="location" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Tags */}
          <Text className="font-semibold text-[#211f1e] mb-2">Mencionar personas</Text>
          <View className="flex-row gap-2 mb-3">
            <TextInput
              className="flex-1 bg-white p-3 rounded-xl border border-gray-200 text-[#211f1e]"
              placeholder="@usuario"
              placeholderTextColor="#9BA1A6"
              value={tagText}
              onChangeText={setTagText}
            />
            <TouchableOpacity
              onPress={handleAddTag}
              className="bg-[#005e66] px-4 rounded-xl items-center justify-center active:bg-[#004052]"
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {tags.map((tag, idx) => (
              <View
                key={idx}
                className="bg-[#005e66] px-3 py-1.5 rounded-full flex-row items-center gap-2"
              >
                <Text className="text-white font-semibold text-sm">@{tag}</Text>
                <TouchableOpacity onPress={() => handleRemoveTag(idx)}>
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* URLs */}
          <Text className="font-semibold text-[#211f1e] mb-2">Agregar links</Text>
          <View className="flex-row gap-2 mb-3">
            <TextInput
              className="flex-1 bg-white p-3 rounded-xl border border-gray-200 text-[#211f1e]"
              placeholder="https://ejemplo.com"
              placeholderTextColor="#9BA1A6"
              value={urlText}
              onChangeText={setUrlText}
            />
            <TouchableOpacity
              onPress={handleAddUrl}
              className="bg-[#005e66] px-4 rounded-xl items-center justify-center active:bg-[#004052]"
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View className="gap-2 mb-4">
            {urls.map((url, idx) => (
              <View
                key={idx}
                className="bg-blue-50 p-3 rounded-xl border border-blue-200 flex-row items-center justify-between"
              >
                <Text className="text-blue-600 flex-1 text-sm font-semibold" numberOfLines={1}>
                  {url}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveUrl(idx)} className="ml-2">
                  <Ionicons name="close-circle" size={18} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
              loading ? "bg-gray-400" : "bg-[#005e66] active:bg-[#004052]"
            }`}
          >
            <Text className="text-center font-semibold text-white">
              {loading ? "Publicando..." : "Publicar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
