import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Pet } from "@/services/dashboard.service";
import { formatDate } from "@/utils/format";
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface PetDetailModalProps {
  pet: Pet | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: (pet: Pet) => void;
  onDelete: (petId: string) => void;
}

export function PetDetailModal({
  pet,
  visible,
  onClose,
  onEdit,
  onDelete,
}: PetDetailModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-2xl p-6 w-11/12 max-h-4/5">
          {pet && (
            <>
              <ScrollView>
                <Text className="text-2xl font-bold text-center mb-4">
                  {pet.name}
                </Text>

                {pet.image_url ? (
                  <Image
                    source={{ uri: pet.image_url }}
                    className="w-full h-64 rounded-xl mb-4"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-64 bg-gray-200 rounded-xl mb-4 items-center justify-center">
                    <MaterialCommunityIcons
                      name={pet.type === "perro" ? "dog" : "cat"}
                      size={80}
                      color="#9CA3AF"
                    />
                  </View>
                )}

                <View className="space-y-3">
                  <View className="flex-row border-b border-gray-100 py-2">
                    <Text className="font-semibold w-1/3">Tipo:</Text>
                    <Text className="flex-1 capitalize">{pet.type}</Text>
                  </View>
                  <View className="flex-row border-b border-gray-100 py-2">
                    <Text className="font-semibold w-1/3">Color:</Text>
                    <Text className="flex-1">{pet.color}</Text>
                  </View>
                  <View className="flex-row border-b border-gray-100 py-2">
                    <Text className="font-semibold w-1/3">Tamaño:</Text>
                    <Text className="flex-1 capitalize">{pet.size}</Text>
                  </View>
                  {pet.features && (
                    <View className="flex-row border-b border-gray-100 py-2">
                      <Text className="font-semibold w-1/3">
                        Características:
                      </Text>
                      <Text className="flex-1">{pet.features}</Text>
                    </View>
                  )}
                  <View className="flex-row border-b border-gray-100 py-2">
                    <Text className="font-semibold w-1/3">Registrada:</Text>
                    <Text className="flex-1">{formatDate(pet.created_at)}</Text>
                  </View>
                </View>
              </ScrollView>

              <View className="flex-row gap-3 mt-4">
                {onEdit && (
                  <TouchableOpacity
                    className="flex-1 bg-[#007275] py-3 rounded-lg"
                    onPress={() => {
                      onEdit(pet);
                      onClose();
                    }}
                  >
                    <Text className="text-white text-center font-semibold">
                      Editar
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  className="flex-1 bg-red-500 py-3 rounded-lg"
                  onPress={() => {
                    onClose();
                    onDelete(pet.id);
                  }}
                >
                  <Text className="text-white text-center font-semibold">
                    Eliminar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-[#211f1e] py-3 rounded-lg"
                  onPress={onClose}
                >
                  <Text className="text-white text-center font-semibold">Cerrar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
