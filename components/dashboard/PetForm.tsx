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
  onSubmit: (data: PetFormData) => void;
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
  const [selectedPetImage, setSelectedPetImage] = useState<{
    uri: string;
  } | null>(null);
  const [uploadingPetImage, setUploadingPetImage] = useState(false);

  const handleSelectImage = async () => {
    const result = await dashboardService.selectImage();
    if (result.success) {
      setSelectedPetImage(result.image || null);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedPetImage) return;

    setUploadingPetImage(true);
    const result = await dashboardService.uploadImage(
      selectedPetImage.uri,
      "pet-images",
    );

    if (result.success) {
      setPetImageUrl(result.url || null);
      setSelectedPetImage(null);
      Toast.show({
        type: "success",
        text1: "Éxito",
        text2: "Imagen subida correctamente",
        position: "top",
        visibilityTime: 3000,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: result.error,
        position: "top",
        visibilityTime: 3000,
      });
    }

    setUploadingPetImage(false);
  };

  return (
    <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
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
                ? "border-red-500 bg-[#ff7e70]"
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
        className="border border-gray-300 rounded-lg p-3 mb-4 bg-white text-[#211f1e]"
        placeholder="Nombre de la mascota"
        placeholderTextColor="#9BA1A6"
        value={petName}
        onChangeText={setPetName}
      />

      {/* Color */}
      <Text className="font-semibold mb-2">Color *</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4 bg-white text-[#211f1e]"
        placeholder="Color principal"
        placeholderTextColor="#9BA1A6"
        value={petColor}
        onChangeText={setPetColor}
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
        className="border border-gray-300 rounded-lg p-3 mb-4 bg-white text-[#211f1e]"
        placeholder="Ej: manchas, cicatrices, comportamiento especial..."
        placeholderTextColor="#9BA1A6"
        value={petFeatures}
        onChangeText={setPetFeatures}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Foto */}
      <Text className="font-semibold mb-2">Foto *</Text>
      <View className="flex-row gap-3 mb-4">
        <TouchableOpacity
          className="flex-1 bg-[#007275] py-3 rounded-lg flex-row items-center justify-center gap-2"
          onPress={handleSelectImage}
        >
          <Ionicons name="camera" size={18} color="#fff" />
          <Text className="text-white text-center">Seleccionar</Text>
        </TouchableOpacity>
        {selectedPetImage && (
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg flex-row items-center justify-center gap-2 ${uploadingPetImage ? "bg-gray-400" : "bg-green-500"}`}
            onPress={handleUploadImage}
            disabled={uploadingPetImage}
          >
            {uploadingPetImage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="cloud-upload" size={18} color="#fff" />
            )}
            <Text className={`text-center ${uploadingPetImage ? "text-gray-700" : "text-white"}`}>
              {uploadingPetImage ? "Subiendo..." : "Subir"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedPetImage && (
        <Image
          source={{ uri: selectedPetImage.uri }}
          className="w-24 h-24 rounded-lg mb-4 self-center"
        />
      )}

      {petImageUrl && (
        <View className="bg-green-50 p-3 rounded-lg mb-4 flex-row items-center justify-center gap-1.5">
          <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
          <Text className="text-green-600 text-center">
            Foto lista para usar
          </Text>
        </View>
      )}

      {/* Botones */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 bg-[#ff7e70] py-4 rounded-lg"
          onPress={() => onSubmit({ type: petType, name: petName, color: petColor, size: petSize, features: petFeatures || null, image_url: petImageUrl })}
        >
          <Text className="text-white text-center font-bold">
            {editingPet ? "Actualizar" : "Registrar"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-[#211f1e] py-4 rounded-lg"
          onPress={onCancel}
        >
          <Text className="text-white text-center font-bold">Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
