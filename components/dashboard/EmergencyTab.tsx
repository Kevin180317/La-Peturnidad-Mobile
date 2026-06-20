import type { EmergencyAlert, EmergencyAlertWithOwner, FoundPetWithDetails, Pet } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface EmergencyTabProps {
  pets: Pet[];
  emergencyAlerts: EmergencyAlertWithOwner[];
  myAlerts: EmergencyAlert[];
  foundPets: FoundPetWithDetails[];
  selectingPetForAlert: boolean;
  showAlerts: boolean;
  showMyAlerts: boolean;
  showFoundPets: boolean;
  refreshing: boolean;
  profileAddress?: string;
  onRefresh: () => void;
  onReportPet: () => void;
  onToggleAlerts: () => void;
  onToggleMyAlerts: () => void;
  onToggleFoundPets: () => void;
  onSelectPetForAlert: (pet: Pet) => void;
  onFoundPet: (alert: EmergencyAlertWithOwner) => void;
  onDeleteAlert: (alertId: string) => void;
}

export function EmergencyTab({
  pets, emergencyAlerts, myAlerts, foundPets,
  selectingPetForAlert, showAlerts, showMyAlerts, showFoundPets,
  refreshing, profileAddress, onRefresh,
  onReportPet, onToggleAlerts, onToggleMyAlerts, onToggleFoundPets,
  onSelectPetForAlert, onFoundPet, onDeleteAlert,
}: EmergencyTabProps) {
  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerClassName="p-5"
    >
      <View className="flex-row items-center gap-3 mb-6">
        <View className="w-12 h-12 rounded-full bg-[#ff7e70] items-center justify-center">
          <Ionicons name="alert-circle" size={24} color="white" />
        </View>
        <View>
          <Text className="text-xl font-bold text-[#ff7e70]">Urgencia</Text>
          <Text className="text-sm text-[#ff7e70]/70">Reporta mascotas perdidas</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-6">
        <GridButton icon="megaphone" label="Reportar" color="bg-[#ff7e70]" onPress={onReportPet} />
        <GridButton
          icon={showAlerts ? "eye-off" : "eye"}
          label={showAlerts ? "Ocultar" : "Ver perdidas"}
          color="bg-[#005e66]"
          onPress={onToggleAlerts}
        />
        <GridButton
          icon="document-text"
          label={showMyAlerts ? "Ocultar" : "Mis alertas"}
          color="bg-[#007275]"
          onPress={onToggleMyAlerts}
        />
        <GridButton
          icon="checkmark-done"
          label={showFoundPets ? "Ocultar" : "Encontradas"}
          color="bg-[#211f1e]"
          onPress={onToggleFoundPets}
        />
      </View>

      {selectingPetForAlert && (
        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
          <Text className="font-bold text-[#ff7e70] mb-3">Selecciona mascota</Text>
          {pets.length === 0 ? (
            <Text className="text-[#ff7e70] text-center py-4">Sin mascotas registradas</Text>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                className="flex-row items-center p-3 bg-[#faf5e0] rounded-lg mb-2"
                onPress={() => onSelectPetForAlert(pet)}
              >
                {pet.image_url ? (
                  <Image source={{ uri: pet.image_url }} className="w-10 h-10 rounded-full" />
                ) : (
                  <View className="w-10 h-10 rounded-full bg-[#ff7e70]/20 items-center justify-center">
                    <Ionicons name="paw" size={18} color="#ff7e70" />
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <Text className="font-bold text-[#211f1e]">{pet.name}</Text>
                  <Text className="text-xs text-[#ff7e70]">{pet.type}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#ff7e70" />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {showAlerts && (
        <SectionCard title="En tu zona" count={emergencyAlerts.length}>
          {emergencyAlerts.length === 0 ? (
            <View className="py-6 items-center">
              <Ionicons name="checkmark-circle" size={40} color="#007275" />
              <Text className="text-[#007275] mt-2">Todo bien aquí</Text>
            </View>
          ) : (
            emergencyAlerts.map((alert) => (
              <View key={alert.id} className="flex-row items-center p-3 border-b border-gray-100">
                {alert.image_url ? (
                  <Image source={{ uri: alert.image_url }} className="w-12 h-12 rounded-lg" />
                ) : (
                  <View className="w-12 h-12 rounded-lg bg-[#faf5e0] items-center justify-center">
                    <Ionicons name="paw" size={20} color="#ff7e70" />
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <Text className="font-bold">{alert.pet_name}</Text>
                  <Text className="text-xs text-gray-500">{alert.last_seen_location}</Text>
                </View>
                <TouchableOpacity
                  className="bg-[#007275] py-2 px-4 rounded-lg"
                  onPress={() => onFoundPet(alert)}
                >
                  <Text className="text-white text-xs font-medium">Encontré</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </SectionCard>
      )}

      {showMyAlerts && (
        <SectionCard title="Mis alertas">
          {myAlerts.length === 0 ? (
            <Text className="text-[#ff7e70] text-center py-4">Sin alertas activas</Text>
          ) : (
            myAlerts.map((alert) => (
              <View key={alert.id} className="flex-row items-center justify-between p-3 border-b border-gray-100">
                <View>
                  <Text className="font-bold">{alert.pet_name}</Text>
                  <Text className="text-xs text-gray-500">{alert.disappearance_date}</Text>
                </View>
                <TouchableOpacity
                  className="bg-red-100 py-2 px-4 rounded-lg"
                  onPress={() => onDeleteAlert(alert.id)}
                >
                  <Text className="text-red-500 text-xs">Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </SectionCard>
      )}

      {showFoundPets && (
        <SectionCard title="Encontradas">
          {foundPets.length === 0 ? (
            <Text className="text-[#ff7e70] text-center py-4">Sin mascotas encontradas</Text>
          ) : (
            foundPets.map((found) => (
              <View key={found.id} className="flex-row items-center p-3 border-b border-gray-100">
                <Ionicons name="checkmark-circle" size={20} color="#007275" />
                <Text className="flex-1 ml-3 font-medium">{found.pet_name}</Text>
                <Text className="text-xs text-gray-400">
                  {found.created_at?.split("T")[0]}
                </Text>
              </View>
            ))
          )}
        </SectionCard>
      )}
    </ScrollView>
  );
}

function GridButton({
  icon, label, color, onPress,
}: {
  icon: string; label: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity className={`w-[48%] ${color} py-4 rounded-xl`} onPress={onPress}>
      <View className="items-center">
        <Ionicons name={icon as any} size={22} color="white" />
        <Text className="text-white text-sm mt-1 font-medium">{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function SectionCard({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-bold text-[#ff7e70]">{title}</Text>
        {count !== undefined && <Text className="text-xs text-[#ff7e70]">{count}</Text>}
      </View>
      {children}
    </View>
  );
}
