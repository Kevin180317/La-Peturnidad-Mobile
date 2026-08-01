import type {
  EmergencyAlert,
  EmergencyAlertWithOwner,
  FoundPetWithDetails,
  Pet,
} from "@/services/dashboard.service";
import { formatDate } from "@/utils/format";
import {
  ActivityIndicator,
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
  loadingAlerts: boolean;
  refreshing: boolean;
  selectingPetForAlert: boolean;
  showAlerts: boolean;
  showMyAlerts: boolean;
  showFoundPets: boolean;
  onRefresh: () => void;
  onLoadPets: () => void;
  onToggleSelectingPet: () => void;
  onLoadEmergencyAlerts: () => void;
  onToggleAlerts: () => void;
  onLoadMyAlerts: () => void;
  onToggleMyAlerts: () => void;
  onLoadFoundPets: () => void;
  onToggleFoundPets: () => void;
  onCreateAlert: (pet: Pet) => void;
  onFoundPet: (alert: EmergencyAlertWithOwner) => void;
  onDeleteAlert: (alertId: string) => void;
  onGoHome: () => void;
}

export function EmergencyTab({
  pets,
  emergencyAlerts,
  myAlerts,
  foundPets,
  loadingAlerts,
  refreshing,
  selectingPetForAlert,
  showAlerts,
  showMyAlerts,
  showFoundPets,
  onRefresh,
  onLoadPets,
  onToggleSelectingPet,
  onLoadEmergencyAlerts,
  onToggleAlerts,
  onLoadMyAlerts,
  onToggleMyAlerts,
  onLoadFoundPets,
  onToggleFoundPets,
  onCreateAlert,
  onFoundPet,
  onDeleteAlert,
  onGoHome,
}: EmergencyTabProps) {
  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerClassName="p-5 pb-10"
    >
      <Text className="text-2xl font-bold mb-2 text-[#ff7e70]">
        Emergencia 🚨
      </Text>
      <Text className="text-gray-600 mb-6">
        Sistema de alertas para mascotas perdidas en tu comunidad
      </Text>

      {/* Botones principales - cuadrícula 2x2 */}
      <View className="mb-6">
        <View className="flex-row gap-4 mb-4">
          <TouchableOpacity
            className="flex-1 bg-[#ff7e70] rounded-2xl p-4 items-center shadow-sm"
            onPress={() => {
              onLoadPets();
              onToggleSelectingPet();
            }}
          >
            <Text className="text-3xl mb-2">📢</Text>
            <Text className="text-white font-bold text-center text-sm leading-5">
              Reportar mascota perdida
            </Text>
            <Text className="text-white/90 text-[11px] text-center mt-1">
              Crea una alerta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 rounded-2xl p-4 items-center shadow-sm ${showAlerts ? "bg-[#211f1e]" : "bg-yellow-500"}`}
            onPress={onToggleAlerts}
          >
            <Text className="text-3xl mb-2">👁️</Text>
            <Text className="text-white font-bold text-center text-sm leading-5">
              {showAlerts ? "Ocultar" : "Ver"} mascotas perdidas
            </Text>
            <Text className={`text-[11px] text-center mt-1 ${showAlerts ? "text-green-400" : "text-white/90"}`}>
              {showAlerts ? "✓ Visible" : "En tu zona"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-4">
          <TouchableOpacity
            className={`flex-1 rounded-2xl p-4 items-center shadow-sm ${showMyAlerts ? "bg-[#211f1e]" : "bg-[#007275]"}`}
            onPress={onToggleMyAlerts}
          >
            <Text className="text-3xl mb-2">📋</Text>
            <Text className="text-white font-bold text-center text-sm leading-5">
              {showMyAlerts ? "Ocultar" : "Ver"} mis alertas
            </Text>
            <Text className={`text-[11px] text-center mt-1 ${showMyAlerts ? "text-green-400" : "text-white/90"}`}>
              {showMyAlerts ? "✓ Visible" : "Historial propio"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 rounded-2xl p-4 items-center shadow-sm ${showFoundPets ? "bg-[#211f1e]" : "bg-green-500"}`}
            onPress={onToggleFoundPets}
          >
            <Text className="text-3xl mb-2">✅</Text>
            <Text className="text-white font-bold text-center text-sm leading-5">
              {showFoundPets ? "Ocultar" : "Ver"} mascotas encontradas
            </Text>
            <Text className={`text-[11px] text-center mt-1 ${showFoundPets ? "text-green-400" : "text-white/90"}`}>
              {showFoundPets ? "✓ Visible" : "Rescatadas"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selección de mascota para alerta */}
      {selectingPetForAlert && (
        <View className="bg-white p-4 rounded-xl mb-6 shadow-sm">
          <Text className="font-bold mb-3">Selecciona la mascota perdida:</Text>
          {pets.length === 0 ? (
            <View className="bg-[#faf5e0] p-6 rounded-lg items-center">
              <Text className="text-gray-500">
                No tienes mascotas registradas
              </Text>
              <TouchableOpacity
                className="bg-[#ff7e70] py-2 px-4 rounded-lg mt-3"
                onPress={onGoHome}
              >
                <Text className="text-white">Registrar mascota</Text>
              </TouchableOpacity>
            </View>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                className="flex-row items-center p-3 border-b border-gray-100"
                onPress={() => onCreateAlert(pet)}
              >
                {pet.image_url ? (
                  <Image
                    source={{ uri: pet.image_url }}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                ) : (
                  <View className="w-12 h-12 bg-gray-200 rounded-full mr-3 items-center justify-center">
                    <Text className="text-xl">
                      {pet.type === "perro" ? "🐶" : "🐱"}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="font-semibold">{pet.name}</Text>
                  <Text className="text-gray-500 text-sm capitalize">
                    {pet.type}
                  </Text>
                </View>
                <View className="bg-red-100 px-3 py-1 rounded-full">
                  <Text className="text-[#ff7e70] text-xs font-semibold">
                    REPORTAR
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Alertas de mascotas perdidas */}
      {showAlerts && (
        <View className="bg-white p-4 rounded-xl mb-6 shadow-sm">
          <Text className="font-bold mb-3">
            🐾 Mascotas perdidas en tu colonia
          </Text>
          {loadingAlerts ? (
            <ActivityIndicator size="large" color="#ff7e70" />
          ) : emergencyAlerts.length === 0 ? (
            <View className="bg-green-50 p-8 rounded-lg items-center">
              <Text className="text-4xl mb-3">🎉</Text>
              <Text className="text-gray-600 text-center">
                No hay mascotas perdidas reportadas en tu colonia
              </Text>
            </View>
          ) : (
            emergencyAlerts.map((alert) => (
              <View
                key={alert.id}
                className="border-b border-gray-100 py-4 last:border-b-0"
              >
                <View className="flex-row">
                  {alert.image_url ? (
                    <Image
                      source={{ uri: alert.image_url }}
                      className="w-20 h-20 rounded-lg mr-3"
                    />
                  ) : (
                    <View className="w-20 h-20 bg-gray-200 rounded-lg mr-3 items-center justify-center">
                      <Text className="text-2xl">
                        {alert.type === "perro" ? "🐶" : "🐱"}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-bold text-lg">{alert.pet_name}</Text>
                    <Text className="text-gray-600 capitalize text-sm mb-1">
                      {alert.type}
                    </Text>
                    <Text className="text-gray-500 text-xs mb-1">
                      {alert.description}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      Perdido en: {alert.last_seen_location}
                    </Text>
                    <Text className="text-gray-500 text-xs mb-2">
                      Fecha: {formatDate(alert.disappearance_date)}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      Dueño: {alert.owner_name} - {alert.owner_phone}
                    </Text>
                    <TouchableOpacity
                      className="bg-green-500 py-2 px-4 rounded-lg mt-2 self-start"
                      onPress={() => onFoundPet(alert)}
                    >
                      <Text className="text-white text-xs font-semibold">
                        ✅ Lo encontré
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Mis alertas */}
      {showMyAlerts && (
        <View className="bg-white p-4 rounded-xl mb-6 shadow-sm">
          <Text className="font-bold mb-3">📋 Mis alertas activas</Text>
          {myAlerts.length === 0 ? (
            <View className="bg-[#faf5e0] p-8 rounded-lg items-center">
              <Text className="text-gray-500 text-center">
                No tienes alertas activas
              </Text>
            </View>
          ) : (
            myAlerts.map((alert) => (
              <View
                key={alert.id}
                className="border-b border-gray-100 py-4 last:border-b-0"
              >
                <View className="flex-row">
                  {alert.image_url ? (
                    <Image
                      source={{ uri: alert.image_url }}
                      className="w-16 h-16 rounded-lg mr-3"
                    />
                  ) : (
                    <View className="w-16 h-16 bg-gray-200 rounded-lg mr-3 items-center justify-center">
                      <Text className="text-2xl">
                        {alert.type === "perro" ? "🐶" : "🐱"}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-bold">{alert.pet_name}</Text>
                    <Text className="text-gray-600 text-sm capitalize mb-1">
                      {alert.type}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      Perdido en: {alert.last_seen_location}
                    </Text>
                    <Text className="text-gray-500 text-xs mb-2">
                      {formatDate(alert.disappearance_date)}
                    </Text>
                    <TouchableOpacity
                      className="bg-[#ff7e70] py-2 px-4 rounded-lg self-start"
                      onPress={() => onDeleteAlert(alert.id)}
                    >
                      <Text className="text-white text-xs font-semibold">
                        🗑️ Eliminar alerta
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Mascotas encontradas */}
      {showFoundPets && (
        <View className="bg-white p-4 rounded-xl mb-6 shadow-sm">
          <Text className="font-bold mb-3">✅ Mascotas que he encontrado</Text>
          {foundPets.length === 0 ? (
            <View className="bg-[#faf5e0] p-8 rounded-lg items-center">
              <Text className="text-gray-500 text-center">
                No has reportado mascotas encontradas
              </Text>
            </View>
          ) : (
            foundPets.map((found) => (
              <View
                key={found.id}
                className="border-b border-gray-100 py-3 last:border-b-0"
              >
                <View className="flex-row items-center">
                  {found.image_url && (
                    <Image
                      source={{ uri: found.image_url }}
                      className="w-12 h-12 rounded-full mr-3"
                    />
                  )}
                  <View>
                    <Text className="font-semibold">{found.pet_name}</Text>
                    <Text className="text-gray-500 text-xs">
                      Encontrada el: {formatDate(found.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}
