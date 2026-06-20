import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

interface PetFormProps {
  petName: string;
  petColor: string;
  petSize: string;
  petFeatures: string;
  petType: "perro" | "gato";
  selectedPetImage: { uri: string } | null;
  petImageUrl: string | null;
  uploadingPetImage: boolean;
  onNameChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onSizeChange: (v: string) => void;
  onFeaturesChange: (v: string) => void;
  onSelectImage: () => void;
  onUploadImage: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function PetForm({
  petName, petColor, petSize, petFeatures, petType: _petType,
  selectedPetImage, petImageUrl, uploadingPetImage,
  onNameChange, onColorChange, onSizeChange, onFeaturesChange,
  onSelectImage, onUploadImage, onSave, onCancel,
}: PetFormProps) {
  return (
    <View className="bg-white p-5 rounded-xl mb-5 border-2 border-[#ff7e70]/30">
      <View className="flex-row items-center gap-2 mb-4">
        <Ionicons name="paw" size={20} color="#ff7e70" />
        <Text className="font-bold text-[#ff7e70] text-lg">Nueva mascota</Text>
      </View>

      <TextInput
        className="bg-[#faf5e0] p-3 rounded-lg mb-2 border border-gray-300"
        placeholder="Nombre *"
        value={petName}
        onChangeText={onNameChange}
      />
      <TextInput
        className="bg-[#faf5e0] p-3 rounded-lg mb-2 border border-gray-300"
        placeholder="Color *"
        value={petColor}
        onChangeText={onColorChange}
      />
      <View className="mb-2 border border-gray-200 rounded-lg overflow-hidden bg-[#faf5e0]">
        <Picker
          selectedValue={petSize}
          onValueChange={onSizeChange}
          style={{ height: 50 }}
        >
          <Picker.Item label="Tamaño *" value="" />
          <Picker.Item label="Pequeño" value="pequeño" />
          <Picker.Item label="Mediano" value="mediano" />
          <Picker.Item label="Grande" value="grande" />
        </Picker>
      </View>
      <TextInput
        className="bg-[#faf5e0] p-3 rounded-lg mb-2 border border-gray-300"
        placeholder="Características"
        value={petFeatures}
        onChangeText={onFeaturesChange}
        multiline
      />

      <View className="flex-row gap-2 mb-3">
        <TouchableOpacity
          className="flex-1 bg-[#005e66] py-3 rounded-lg border border-[#005e66]/30"
          onPress={onSelectImage}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Ionicons name="camera" size={18} color="white" />
            <Text className="text-white">Foto</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg border ${uploadingPetImage ? "bg-gray-400 border-gray-400" : "bg-[#007275] border-[#007275]/30"}`}
          onPress={onUploadImage}
          disabled={uploadingPetImage}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Ionicons name={uploadingPetImage ? "hourglass" : "cloud-upload"} size={18} color="white" />
            <Text className="text-white">{uploadingPetImage ? "Subiendo" : "Subir"}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {selectedPetImage && (
        <Image source={{ uri: selectedPetImage.uri }} className="w-16 h-16 rounded-lg mb-3 self-center" />
      )}
      {petImageUrl && (
        <View className="flex-row items-center justify-center gap-2 mb-3">
          <Ionicons name="checkmark-circle" size={18} color="green" />
          <Text className="text-green-600">Foto lista</Text>
        </View>
      )}

      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 bg-[#ff7e70] py-3 rounded-lg border-2 border-[#ff7e70]/30"
          onPress={onSave}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Ionicons name="checkmark" size={18} color="white" />
            <Text className="text-white text-center font-bold">Guardar</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-gray-500 py-3 rounded-lg border-2 border-gray-500/30"
          onPress={onCancel}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Ionicons name="close" size={18} color="white" />
            <Text className="text-center text-white">Cancelar</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
