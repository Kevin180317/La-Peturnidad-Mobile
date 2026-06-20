import type { Pet } from "@/types";
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface PetDetailModalProps {
  visible: boolean;
  pet: Pet | null;
  onClose: () => void;
  onDelete: (petId: string) => void;
  onEdit?: (pet: Pet) => void;
}

export function PetDetailModal({ visible, pet, onClose, onDelete, onEdit }: PetDetailModalProps) {
  if (!pet) return null;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white rounded-2xl p-4 w-11/12 max-h-[80%]">
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-2xl font-bold text-center text-[#ff7e70] mb-2">
              {pet.name}
            </Text>

            {pet.image_url ? (
              <Image
                source={{ uri: pet.image_url }}
                className="w-full h-72 rounded-xl mb-3"
                resizeMode="contain"
              />
            ) : (
              <View className="w-full h-72 bg-[#faf5e0] rounded-xl mb-3 items-center justify-center">
                <Text className="text-6xl">🐾</Text>
              </View>
            )}

            <View className="bg-[#faf5e0] rounded-xl p-3 mb-3">
              <Text className="text-center text-[#005e66] capitalize mb-1">
                {pet.type}
              </Text>
              <Text className="text-center text-[#005e66]">🎨 {pet.color}</Text>
              <Text className="text-center text-[#ff7e70] text-sm">
                📏 {pet.size}
              </Text>
              {pet.features && (
                <Text className="text-center text-gray-400 text-sm mt-1">
                  ✨ {pet.features}
                </Text>
              )}
            </View>

            <View className="flex-row gap-3">
              {onEdit && (
                <TouchableOpacity
                  className="flex-1 bg-[#007275] py-3 rounded-lg"
                  onPress={() => { onEdit(pet); onClose(); }}
                >
                  <Text className="text-white text-center font-bold">Editar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className="flex-1 bg-red-500 py-3 rounded-lg"
                onPress={() => onDelete(pet.id)}
              >
                <Text className="text-white text-center font-bold">Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-[#005e66] py-3 rounded-lg"
                onPress={onClose}
              >
                <Text className="text-white text-center font-bold">Cerrar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
