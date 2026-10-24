import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { Pet } from "@/services/dashboard.service";
import { dashboardService } from "@/services/dashboard.service";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
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
  const [nameFocused, setNameFocused] = useState(false);
  const [colorFocused, setColorFocused] = useState(false);
  const [featuresFocused, setFeaturesFocused] = useState(false);

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
    <View className="bg-white p-5 rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] mb-6">
      <Text className="text-xl font-bold mb-4">
        {editingPet ? "Editar mascota" : "Registrar nueva mascota"}
      </Text>

      {/* Tipo */}
      <Text className="font-semibold mb-2">Tipo *</Text>
      <View className="flex-row gap-3 mb-4">
        {["perro", "gato"].map((type) => (
          <TouchableOpacity
            key={type}
            className={`flex-1 py-3 rounded-xl border-2 flex-row items-center justify-center gap-2 ${
              petType === type
                ? "border-[#007275] bg-[#007275]"
                : "border-[#211f1e]/20"
            }`}
            onPress={() => setPetType(type as "perro" | "gato")}
          >
            <MaterialCommunityIcons
              name={type === "perro" ? "dog" : "cat"}
              size={22}
              color={petType === type ? "#fff" : "#6B7280"}
            />
            <Text
              className={`text-center ${petType === type ? "text-white" : "text-gray-600"}`}
            >
              {type === "perro" ? "Perro" : "Gato"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Nombre */}
      <Text className="font-semibold mb-2">Nombre *</Text>
      <TextInput
        className={`${nameFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-300"} rounded-lg p-3 mb-4 bg-white text-[#211f1e]`}
        placeholder="Nombre de la mascota"
        placeholderTextColor="#9BA1A6"
        value={petName}
        onChangeText={setPetName}
        onFocus={() => setNameFocused(true)}
        onBlur={() => setNameFocused(false)}
      />

      {/* Color */}
      <Text className="font-semibold mb-2">Color *</Text>
      <TextInput
        className={`${colorFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-300"} rounded-lg p-3 mb-4 bg-white text-[#211f1e]`}
        placeholder="Color principal"
        placeholderTextColor="#9BA1A6"
        value={petColor}
        onChangeText={setPetColor}
        onFocus={() => setColorFocused(true)}
        onBlur={() => setColorFocused(false)}
      />

      {/* Tamaño */}
      <Text className="font-semibold mb-2">Tamaño *</Text>
      <View className="mb-4 border border-gray-300 rounded-lg overflow-hidden bg-white">
        <Picker
          selectedValue={petSize}
          onValueChange={(value) => setPetSize(value)}
          style={{ height: 50, color: "#211f1e", backgroundColor: "#ffffff" }}
        >
          <Picker.Item label="Selecciona un tamaño" value="" color="#211f1e" />
          <Picker.Item label="Pequeño" value="pequeño" color="#211f1e" />
          <Picker.Item label="Mediano" value="mediano" color="#211f1e" />
          <Picker.Item label="Grande" value="grande" color="#211f1e" />
        </Picker>
      </View>

      {/* Características */}
      <Text className="font-semibold mb-2">Características especiales</Text>
      <TextInput
        className={`${featuresFocused ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]" : "border border-gray-300"} rounded-lg p-3 mb-4 bg-white text-[#211f1e]`}
        placeholder="Ej: manchas, cicatrices, comportamiento especial..."
        placeholderTextColor="#9BA1A6"
        value={petFeatures}
        onChangeText={setPetFeatures}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        onFocus={() => setFeaturesFocused(true)}
        onBlur={() => setFeaturesFocused(false)}
      />

      {/* Foto */}
      <Text className="font-semibold mb-2">Foto *</Text>
      {shownImage && (
        <Image
          source={{ uri: shownImage }}
          className="w-24 h-24 rounded-lg mb-3 self-center"
        />
      )}
      <TouchableOpacity
        className={`py-3 rounded-xl flex-row items-center justify-center gap-2 mb-4 ${uploadingPetImage ? "bg-gray-400" : "bg-[#007275]"}`}
        onPress={handleSelectImage}
        disabled={busy}
      >
        {uploadingPetImage ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="camera" size={18} color="#fff" />
        )}
        <Text className={`text-center ${uploadingPetImage ? "text-gray-700" : "text-white"}`}>
          {uploadingPetImage
            ? "Subiendo..."
            : petImageUrl
              ? "Cambiar foto"
              : "Seleccionar foto"}
        </Text>
      </TouchableOpacity>

      {/* Botones */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          className={`flex-1 py-4 rounded-xl flex-row items-center justify-center ${busy ? "bg-gray-400" : "bg-[#007275]"}`}
          onPress={handleSubmit}
          disabled={busy}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className={`text-center font-bold ${busy ? "text-gray-700" : "text-white"}`}>
              {editingPet ? "Actualizar" : "Registrar"}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-[#211f1e] py-4 rounded-xl"
          onPress={onCancel}
          disabled={saving}
        >
          <Text className="text-white text-center font-bold">Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
