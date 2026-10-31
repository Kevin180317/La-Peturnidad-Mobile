import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { Pet } from "@/services/dashboard.service";
import { dashboardService } from "@/services/dashboard.service";
import { CARD, ChoiceChips, Field, PrimaryButton, RoundIconButton } from "@/components/kit/Kit";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export interface PetFormData {
  type: "perro" | "gato";
  name: string;
  color: string;
  size: string;
  features: string | null;
  image_url: string | null;
}

interface PetFormProps {
  editingPet?: Pet | null;
  onSubmit: (data: PetFormData) => Promise<void>;
  onCancel: () => void;
}

export function PetForm({ editingPet, onSubmit, onCancel }: PetFormProps) {
  const [petType, setPetType] = useState<"perro" | "gato">(
    editingPet?.type === "gato" ? "gato" : "perro",
  );
  const [petName, setPetName] = useState(editingPet?.name ?? "");
  const [petColor, setPetColor] = useState(editingPet?.color ?? "");
  const [petSize, setPetSize] = useState(editingPet?.size ?? "");
  const [petFeatures, setPetFeatures] = useState(editingPet?.features ?? "");
  const [petImageUrl, setPetImageUrl] = useState<string | null>(
    editingPet?.image_url ?? null,
  );
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [uploadingPetImage, setUploadingPetImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const showError = (text2?: string) =>
    Toast.show({
      type: "error",
      text1: "Error",
      text2,
      position: "top",
      visibilityTime: 3000,
    });

  // Al elegir la foto se sube de inmediato; si falla se conserva la anterior
  const handleSelectImage = async () => {
    const result = await dashboardService.selectImage();
    if (!result.success) {
      if (result.error !== "Selección cancelada") showError(result.error);
      return;
    }

    setPreviewUri(result.image.uri);
    setUploadingPetImage(true);
    const upload = await dashboardService.uploadImage(result.image, "pet-images");
    setUploadingPetImage(false);

    if (upload.success && upload.url) {
      setPetImageUrl(upload.url);
    } else {
      setPreviewUri(null);
      showError(upload.error);
    }
  };

  const handleSubmit = async () => {
    if (saving || uploadingPetImage) return;
    setSaving(true);
    try {
      await onSubmit({
        type: petType,
        name: petName,
        color: petColor,
        size: petSize,
        features: petFeatures || null,
        image_url: petImageUrl,
      });
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || uploadingPetImage;
  const shownImage = previewUri ?? petImageUrl;

  return (
    <View className={`${CARD} p-5 mb-6`}>
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-xl font-bold text-[#211f1e]">
          {editingPet ? "Editar mascota" : "Registrar nueva mascota"}
        </Text>
        <RoundIconButton icon="close" tint="teal" size={34} onPress={onCancel} label="Cerrar formulario" disabled={saving} />
      </View>

      {/* Foto */}
      <TouchableOpacity
        className="self-center mb-5"
        activeOpacity={0.85}
        onPress={handleSelectImage}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={petImageUrl ? "Cambiar foto" : "Seleccionar foto"}
      >
        {shownImage ? (
          <Image source={{ uri: shownImage }} className="w-32 h-32 rounded-3xl bg-gray-100" />
        ) : (
          <View className="w-32 h-32 rounded-3xl bg-[#faf5e0] border-2 border-dashed border-[#007275]/40 items-center justify-center">
            <Ionicons name="camera" size={30} color="#007275" />
            <Text className="text-[#007275] text-xs font-semibold mt-1">Agregar foto</Text>
          </View>
        )}
        <View className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#007275] border-[3px] border-white items-center justify-center">
          {uploadingPetImage ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name={shownImage ? "pencil" : "add"} size={18} color="#fff" />
          )}
        </View>
      </TouchableOpacity>
      {uploadingPetImage && <Text className="text-center text-gray-500 text-xs -mt-2 mb-4">Subiendo...</Text>}

      {/* Tipo */}
      <Text className="text-[13px] font-semibold text-[#211f1e] mb-1.5 ml-1">Tipo *</Text>
      <View className="flex-row gap-3 mb-4">
        {(["perro", "gato"] as const).map((type) => {
          const active = petType === type;
          return (
            <TouchableOpacity
              key={type}
              className={`flex-1 py-3.5 rounded-2xl border-[1.5px] flex-row items-center justify-center gap-2 ${
                active ? "border-[#007275] bg-[#007275]" : "border-gray-200 bg-white"
              }`}
              activeOpacity={0.85}
              onPress={() => setPetType(type)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <MaterialCommunityIcons name={type === "perro" ? "dog" : "cat"} size={22} color={active ? "#fff" : "#6B7280"} />
              <Text className={`font-semibold ${active ? "text-white" : "text-gray-600"}`}>
                {type === "perro" ? "Perro" : "Gato"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Field label="Nombre *" icon="paw-outline" placeholder="Nombre de la mascota" value={petName} onChangeText={setPetName} />
      <Field label="Color *" icon="color-palette-outline" placeholder="Color principal" value={petColor} onChangeText={setPetColor} />

      {/* Tamaño */}
      <Text className="text-[13px] font-semibold text-[#211f1e] mb-1.5 ml-1">Tamaño *</Text>
      <View className="mb-4">
        <ChoiceChips
          options={[
            { value: "pequeño", label: "Pequeño" },
            { value: "mediano", label: "Mediano" },
            { value: "grande", label: "Grande" },
          ]}
          value={petSize}
          onChange={setPetSize}
        />
      </View>

      <Field
        label="Características especiales"
        icon="sparkles-outline"
        placeholder="Ej: manchas, cicatrices, comportamiento especial..."
        value={petFeatures}
        onChangeText={setPetFeatures}
        multiline
        numberOfLines={3}
      />

      <PrimaryButton
        title={editingPet ? "Guardar cambios" : "Registrar mascota"}
        icon={editingPet ? "checkmark" : "paw"}
        onPress={handleSubmit}
        loading={saving}
        disabled={busy}
        className="mt-2"
      />
      <TouchableOpacity className="py-3 mt-1" onPress={onCancel} disabled={saving}>
        <Text className="text-center font-semibold text-gray-600">Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}
