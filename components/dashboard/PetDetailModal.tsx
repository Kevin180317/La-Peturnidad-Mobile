import { Ionicons } from "@expo/vector-icons";
import { Chip, PetThumb, PrimaryButton, RoundIconButton } from "@/components/kit/Kit";
import type { Pet } from "@/services/dashboard.service";
import { formatDate } from "@/utils/format";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

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
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        {/* Tocar fuera de la hoja la cierra */}
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Cerrar" />
        <View className="bg-white rounded-t-[32px] max-h-[88%] pb-8 shadow-[0_-12px_32px_rgba(33,31,30,0.18)]">
          <View className="w-10 h-1.5 rounded-full bg-gray-300 self-center mt-3 mb-2" />
          {pet && (
            <>
              <ScrollView contentContainerClassName="px-5 pt-2">
                <View>
                  <PetThumb uri={pet.image_url} type={pet.type} className="w-full h-64 rounded-3xl" iconSize={80} />
                  <View className="absolute top-3 right-3">
                    <RoundIconButton icon="close" tint="white" onPress={onClose} label="Cerrar ficha" />
                  </View>
                </View>

                <Text className="text-2xl font-bold text-[#211f1e] mt-4">{pet.name}</Text>
                <View className="flex-row flex-wrap gap-1.5 mt-2">
                  {!!pet.type && <Chip text={pet.type} tone="teal" />}
                  {!!pet.size && <Chip text={pet.size} />}
                </View>

                <View className="bg-[#faf5e0] rounded-3xl px-4 mt-4">
                  <InfoRow icon="color-palette-outline" label="Color" value={pet.color} />
                  <InfoRow icon="resize-outline" label="Tamaño" value={pet.size} capitalize />
                  {!!pet.features && <InfoRow icon="sparkles-outline" label="Características" value={pet.features} />}
                  <InfoRow icon="calendar-outline" label="Registrada" value={formatDate(pet.created_at)} last />
                </View>
              </ScrollView>

              <View className="flex-row gap-3 px-5 mt-4">
                {onEdit && (
                  <PrimaryButton
                    title="Editar"
                    icon="pencil"
                    className="flex-1"
                    onPress={() => {
                      onEdit(pet);
                      onClose();
                    }}
                  />
                )}
                <PrimaryButton
                  title="Eliminar"
                  icon="trash-outline"
                  variant="danger"
                  className="flex-1"
                  onPress={() => {
                    onClose();
                    onDelete(pet.id);
                  }}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({
  icon,
  label,
  value,
  capitalize,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
  capitalize?: boolean;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-start gap-3 py-3.5 ${last ? "" : "border-b border-[#211f1e]/5"}`}>
      <View className="w-8 h-8 rounded-full bg-white items-center justify-center">
        <Ionicons name={icon} size={16} color="#007275" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-500 text-xs">{label}</Text>
        <Text className={`text-[#211f1e] font-semibold text-[15px] mt-0.5 ${capitalize ? "capitalize" : ""}`}>
          {value || "No disponible"}
        </Text>
      </View>
    </View>
  );
}
