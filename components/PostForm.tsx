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
import { LIMITS, POST_MAX } from "@/utils/limits";
import { displayLink, extractHashtags, mergeTags, normalizeLink, normalizeTag } from "@/utils/postMeta";

// Las alertas de emergencia se crean desde la pestaña Emergencia
export type PostType = "social" | "announcements";

export type AnnouncementCategory = "general" | "aviso" | "evento" | "pregunta";

const CATEGORIES: AnnouncementCategory[] = ["general", "aviso", "evento", "pregunta"];

export interface PostFormData {
  type: PostType;
  content: string;
  /** Solo "social": hasta POST_MAX.images imágenes (galería y/o cámara) */
  images?: PickedImage[];
  /** Solo "social": lugar en texto libre */
  location?: string;
  /** Solo "social": etiquetas sin "#" (las escritas en el texto se agregan solas) */
  tags?: string[];
  /** Solo "social": enlaces http(s) */
  links?: string[];
  /** Solo "announcements" */
  title?: string;
  category?: AnnouncementCategory;
}

interface PostFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: PostFormData) => Promise<boolean>;
  loading?: boolean;
  /** Ubicación sugerida (colonia y ciudad del perfil) para el botón "Usar mi zona" */
  defaultLocation?: string;
}

export function PostForm({
  visible,
  onClose,
  onSubmit,
  loading = false,
  defaultLocation = "",
}: PostFormProps) {
  const [postType, setPostType] = useState<PostType>("social");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("general");
  const [images, setImages] = useState<PickedImage[]>([]);
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");

  const showError = (text2: string) =>
    Toast.show({ type: "error", text1: "Error", text2, position: "top" });

  const remaining = POST_MAX.images - images.length;

  const handleAddFromGallery = async () => {
    const result = await dashboardService.selectImages(remaining);
    if (result.success) {
      setImages((current) => [...current, ...result.images].slice(0, POST_MAX.images));
    } else if (result.error !== "Selección cancelada") {
      showError(result.error);
    }
  };

  const handleTakePhoto = async (facing: "front" | "back") => {
    if (remaining < 1) return;
    const result = await dashboardService.takePhoto(facing);
    if (result.success) {
      setImages((current) => [...current, result.image].slice(0, POST_MAX.images));
    } else if (result.error !== "Selección cancelada") {
      showError(result.error);
    }
  };

  const handleAddTag = () => {
    // Acepta varias separadas por espacio o coma: "#perro, gato"
    const parts = tagInput.split(/[\s,]+/).map(normalizeTag).filter(Boolean);
    if (!parts.length) {
      setTagInput("");
      return;
    }
    const merged = mergeTags(tags, parts);
    if (merged.length === tags.length && merged.length >= POST_MAX.tags) {
      showError(`Máximo ${POST_MAX.tags} etiquetas`);
      return;
    }
    setTags(merged);
    setTagInput("");
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) return;
    if (links.length >= POST_MAX.links) {
      showError(`Máximo ${POST_MAX.links} enlaces`);
      return;
    }
    const url = normalizeLink(linkInput);
    if (!url) {
      showError("Escribe un enlace válido, por ejemplo sitio.com");
      return;
    }
    if (!links.includes(url)) setLinks([...links, url]);
    setLinkInput("");
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

    if (postType === "social" && images.length === 0) {
      showError("Agrega al menos una imagen");
      return;
    }

    // Lo que quedó escrito sin confirmar en etiquetas/enlaces también cuenta
    const pendingTags = tagInput.split(/[\s,]+/).map(normalizeTag).filter(Boolean);
    const pendingLink = linkInput.trim() ? normalizeLink(linkInput) : null;
    if (postType === "social" && linkInput.trim() && !pendingLink) {
      showError("Revisa el enlace: no es una URL válida");
      return;
    }
    const finalLinks = pendingLink && !links.includes(pendingLink) ? [...links, pendingLink].slice(0, POST_MAX.links) : links;

    const success = await onSubmit(
      postType === "social"
        ? {
            type: "social",
            content: content.trim(),
            images,
            location: location.trim() || undefined,
            tags: mergeTags(tags, pendingTags, extractHashtags(content)),
            links: finalLinks,
          }
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
      setImages([]);
      setLocation("");
      setTags([]);
      setTagInput("");
      setLinks([]);
      setLinkInput("");
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
                <Field label="Título" icon="text-outline" placeholder="Título de la publicación" value={title} onChangeText={setTitle} maxLength={LIMITS.title} />
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
              maxLength={LIMITS.description}
              multiline
              numberOfLines={4}
            />

            {postType === "social" && (
              <>
                {/* Imágenes: galería y cámara (frontal/trasera), hasta POST_MAX.images */}
                <Text className="text-[13px] font-semibold text-[#211f1e] mb-1.5 ml-1">
                  Imágenes ({images.length}/{POST_MAX.images}, mínimo 1)
                </Text>
                {images.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerClassName="gap-3">
                    {images.map((img, index) => (
                      <View key={`${img.uri}-${index}`}>
                        <Image source={{ uri: img.uri }} className="rounded-2xl bg-gray-100" style={{ width: 120, height: 150 }} />
                        <View className="absolute top-2 right-2">
                          <RoundIconButton
                            icon="close"
                            tint="white"
                            onPress={() => setImages((current) => current.filter((_, i) => i !== index))}
                            label="Quitar imagen"
                          />
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
                <View className="flex-row gap-2 mb-4">
                  <SourceButton icon="images-outline" label="Galería" onPress={handleAddFromGallery} disabled={remaining < 1} />
                  <SourceButton icon="camera-outline" label="Cámara" onPress={() => handleTakePhoto("back")} disabled={remaining < 1} />
                  <SourceButton icon="camera-reverse-outline" label="Selfie" onPress={() => handleTakePhoto("front")} disabled={remaining < 1} />
                </View>

                {/* Ubicación */}
                <Field
                  label="Ubicación (opcional)"
                  icon="location-outline"
                  placeholder="Ej. Colonia Centro, Tijuana"
                  value={location}
                  onChangeText={setLocation}
                  maxLength={LIMITS.location}
                  right={
                    !!defaultLocation && location !== defaultLocation ? (
                      <TouchableOpacity onPress={() => setLocation(defaultLocation.slice(0, LIMITS.location))} accessibilityRole="button" accessibilityLabel="Usar mi zona">
                        <Text className="text-xs font-semibold text-[#007275]">Mi zona</Text>
                      </TouchableOpacity>
                    ) : undefined
                  }
                />

                {/* Etiquetas */}
                <Field
                  label="Etiquetas (opcional)"
                  icon="pricetag-outline"
                  placeholder="perro, adopcion"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                  returnKeyType="done"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={LIMITS.tag * 2}
                  right={
                    <TouchableOpacity onPress={handleAddTag} accessibilityRole="button" accessibilityLabel="Agregar etiqueta">
                      <Ionicons name="add-circle" size={26} color="#007275" />
                    </TouchableOpacity>
                  }
                />
                {tags.length > 0 && (
                  <View className="flex-row flex-wrap gap-2 -mt-2 mb-4">
                    {tags.map((tag) => (
                      <RemovableChip key={tag} text={`#${tag}`} onRemove={() => setTags(tags.filter((t) => t !== tag))} />
                    ))}
                  </View>
                )}

                {/* Enlaces */}
                <Field
                  label="Enlaces (opcional)"
                  icon="link-outline"
                  placeholder="sitio.com/pagina"
                  value={linkInput}
                  onChangeText={setLinkInput}
                  onSubmitEditing={handleAddLink}
                  returnKeyType="done"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  maxLength={LIMITS.link}
                  right={
                    <TouchableOpacity onPress={handleAddLink} accessibilityRole="button" accessibilityLabel="Agregar enlace">
                      <Ionicons name="add-circle" size={26} color="#007275" />
                    </TouchableOpacity>
                  }
                />
                {links.length > 0 && (
                  <View className="flex-row flex-wrap gap-2 -mt-2">
                    {links.map((url) => (
                      <RemovableChip key={url} text={displayLink(url)} onRemove={() => setLinks(links.filter((l) => l !== url))} />
                    ))}
                  </View>
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

function SourceButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      className={`flex-1 h-20 rounded-2xl border-2 border-dashed border-[#007275]/40 bg-[#faf5e0] items-center justify-center ${disabled ? "opacity-40" : ""}`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={24} color="#007275" />
      <Text className="text-xs text-[#007275] font-semibold mt-1">{label}</Text>
    </TouchableOpacity>
  );
}

function RemovableChip({ text, onRemove }: { text: string; onRemove: () => void }) {
  return (
    <View className="flex-row items-center gap-1 bg-[#007275]/10 rounded-full pl-3 pr-1.5 py-1">
      <Text className="text-[13px] font-semibold text-[#007275]">{text}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Quitar ${text}`}>
        <Ionicons name="close-circle" size={18} color="#007275" />
      </TouchableOpacity>
    </View>
  );
}
