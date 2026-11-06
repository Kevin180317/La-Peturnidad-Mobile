import { Ionicons } from "@expo/vector-icons";
import type {
  EmergencyAlertWithOwner,
  FoundPetWithDetails,
  MyEmergencyAlert,
  Pet,
} from "@/services/dashboard.service";
import { Chip, PetThumb, SectionTitle, ToggleTile } from "@/components/kit/Kit";
import { formatDate } from "@/utils/format";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface EmergencyTabProps {
  pets: Pet[];
  emergencyAlerts: EmergencyAlertWithOwner[];
  myAlerts: MyEmergencyAlert[];
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
  onResolveAlert: (alertId: string) => void;
  onGoHome: () => void;
}

const SECTION = "bg-white p-4 rounded-3xl mb-6 shadow-[0_4px_24px_rgba(33,31,30,0.08)]";

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
  onToggleAlerts,
  onToggleMyAlerts,
  onToggleFoundPets,
  onCreateAlert,
  onFoundPet,
  onDeleteAlert,
  onResolveAlert,
  onGoHome,
}: EmergencyTabProps) {
  const callOwner = (phone?: string | null) => {
    if (isPhone(phone)) Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`).catch(() => {});
  };

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerClassName="p-5 pb-10"
    >
      <Text className="text-2xl font-bold text-[#211f1e]">Emergencia</Text>
      <Text className="text-gray-500 text-sm mt-0.5 mb-5">
        Alertas para mascotas perdidas en tu comunidad
      </Text>

      {/* Acción principal */}
      <TouchableOpacity
        className="bg-[#ff7e70] rounded-3xl p-5 mb-4 overflow-hidden shadow-[0_8px_24px_rgba(255,126,112,0.35)]"
        activeOpacity={0.9}
        onPress={() => {
          onLoadPets();
          onToggleSelectingPet();
        }}
        accessibilityRole="button"
        accessibilityLabel="Reportar mascota perdida"
      >
        {/* Huellas decorativas */}
        <Ionicons name="paw" size={110} color="rgba(255,255,255,0.13)" style={{ position: "absolute", right: -18, bottom: -24, transform: [{ rotate: "-20deg" }] }} />
        <Ionicons name="paw" size={44} color="rgba(255,255,255,0.13)" style={{ position: "absolute", right: 88, top: 8, transform: [{ rotate: "15deg" }] }} />
        <View className="flex-row items-center gap-4">
          <View className="w-14 h-14 rounded-2xl bg-white/25 items-center justify-center">
            <Ionicons name="megaphone" size={28} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">Reportar mascota perdida</Text>
            <Text className="text-white/90 text-sm mt-0.5">Avisa a tus vecinos al instante</Text>
          </View>
          <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
            <Ionicons
              name={selectingPetForAlert ? "chevron-up" : "arrow-forward"}
              size={18}
              color="#ff7e70"
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Accesos secundarios */}
      <View className="flex-row gap-3 mb-6">
        <ToggleTile
          icon="eye"
          title="Perdidas"
          subtitle="En tu zona"
          count={emergencyAlerts.length}
          active={showAlerts}
          onPress={onToggleAlerts}
          label={`${showAlerts ? "Ocultar" : "Ver"} mascotas perdidas`}
        />
        <ToggleTile
          icon="clipboard"
          title="Mis alertas"
          subtitle="Historial"
          count={myAlerts.length}
          active={showMyAlerts}
          onPress={onToggleMyAlerts}
          label={`${showMyAlerts ? "Ocultar" : "Ver"} mis alertas`}
        />
        <ToggleTile
          icon="checkmark-circle"
          title="Encontradas"
          subtitle="Rescatadas"
          count={foundPets.length}
          active={showFoundPets}
          onPress={onToggleFoundPets}
          label={`${showFoundPets ? "Ocultar" : "Ver"} mascotas encontradas`}
        />
      </View>

      {/* Selección de mascota para alerta */}
      {selectingPetForAlert && (
        <View className={SECTION}>
          <SectionTitle icon="megaphone" color="#c2402f" title="¿Qué mascota se perdió?" />
          {pets.length === 0 ? (
            <EmptyBox icon="paw-outline" text="No tienes mascotas registradas">
              <TouchableOpacity className="bg-[#007275] py-2.5 px-5 rounded-full mt-3" onPress={onGoHome}>
                <Text className="text-white font-semibold">Registrar mascota</Text>
              </TouchableOpacity>
            </EmptyBox>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                className="flex-row items-center p-3 mb-2 rounded-2xl bg-[#faf5e0]"
                activeOpacity={0.8}
                onPress={() => onCreateAlert(pet)}
              >
                <PetThumb uri={pet.image_url} type={pet.type} className="w-12 h-12 rounded-full" iconSize={24} />
                <View className="flex-1 ml-3">
                  <Text className="font-bold text-[#211f1e]">{pet.name}</Text>
                  <Text className="text-gray-500 text-sm capitalize">{pet.type}</Text>
                </View>
                <View className="bg-[#ff7e70] px-3 py-1.5 rounded-full flex-row items-center gap-1">
                  <Text className="text-white text-xs font-bold">Reportar</Text>
                  <Ionicons name="chevron-forward" size={12} color="#fff" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Alertas de mascotas perdidas */}
      {showAlerts && (
        <View className="mb-2">
          <SectionTitle icon="paw" color="#c2402f" title="Mascotas perdidas en tu colonia" />
          {loadingAlerts ? (
            <ActivityIndicator className="my-6" size="large" color="#007275" />
          ) : emergencyAlerts.length === 0 ? (
            <View className={SECTION}>
              <EmptyBox icon="happy-outline" text="No hay mascotas perdidas reportadas en tu colonia" />
            </View>
          ) : (
            emergencyAlerts.map((alert) => (
              <View key={alert.id} className="bg-white rounded-3xl mb-4 overflow-hidden shadow-[0_4px_24px_rgba(33,31,30,0.08)]">
                <View className="flex-row p-4 gap-3">
                  <PetThumb uri={alert.image_url} type={alert.type} className="w-24 h-24 rounded-2xl" iconSize={36} />
                  <View className="flex-1">
                    <Text className="font-bold text-lg text-[#211f1e]">{alert.pet_name}</Text>
                    <View className="flex-row flex-wrap gap-1.5 mt-1">
                      {!!alert.type && <Chip text={alert.type} tone="neutral" />}
                      <Chip icon="calendar-outline" text={formatDate(alert.disappearance_date)} tone="coral" />
                    </View>
                    {!!alert.last_seen_location && (
                      <View className="flex-row items-center gap-1 mt-2">
                        <Ionicons name="location-outline" size={13} color="#6B7280" />
                        <Text className="text-gray-600 text-xs flex-1" numberOfLines={2}>
                          {alert.last_seen_location}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                {!!alert.description && (
                  <Text className="text-gray-700 text-sm leading-5 px-4 pb-3">{alert.description}</Text>
                )}
                <View className="flex-row items-center gap-3 mx-4 mb-3 p-3 rounded-2xl bg-[#faf5e0]">
                  <View className="w-9 h-9 rounded-full bg-[#007275]/10 items-center justify-center">
                    <Ionicons name="person" size={16} color="#007275" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] text-gray-500">Dueño</Text>
                    <Text className="text-sm font-semibold text-[#211f1e]" numberOfLines={1}>
                      {alert.owner_name}
                    </Text>
                  </View>
                  {isPhone(alert.owner_phone) && (
                    <TouchableOpacity
                      className="flex-row items-center gap-1.5 bg-white px-3 py-2 rounded-full border border-[#007275]/20"
                      onPress={() => callOwner(alert.owner_phone)}
                      accessibilityRole="button"
                      accessibilityLabel={`Llamar a ${alert.owner_name}`}
                    >
                      <Ionicons name="call" size={14} color="#007275" />
                      <Text className="text-[#007275] text-xs font-semibold">{alert.owner_phone}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  className="bg-[#007275] mx-4 mb-4 py-3 rounded-2xl flex-row items-center justify-center gap-2"
                  activeOpacity={0.85}
                  onPress={() => onFoundPet(alert)}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text className="text-white font-bold">Lo encontré</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      {/* Mis alertas */}
      {showMyAlerts && (
        <View className={SECTION}>
          <SectionTitle icon="clipboard" color="#007275" title="Mis alertas" />
          {myAlerts.length === 0 ? (
            <EmptyBox icon="clipboard-outline" text="No tienes alertas" />
          ) : (
            myAlerts.map((alert, i) => {
              const resolved = alert.status === "resolved";
              return (
                <View key={alert.id} className={`py-4 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                  <View className="flex-row gap-3">
                    <PetThumb uri={alert.image_url} type={alert.type} className="w-16 h-16 rounded-2xl" iconSize={28} />
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-bold text-base text-[#211f1e] flex-shrink">{alert.pet_name}</Text>
                        <Chip
                          icon={resolved ? "checkmark-circle" : "time-outline"}
                          text={resolved ? "Resuelta" : "Activa"}
                          tone={resolved ? "teal" : "coral"}
                        />
                      </View>
                      <Text className="text-gray-500 text-xs mt-1">
                        {formatDate(alert.disappearance_date)}
                        {alert.last_seen_location ? ` · ${alert.last_seen_location}` : ""}
                      </Text>
                    </View>
                  </View>

                  {alert.finders.map((finder) => (
                    <View key={finder.id} className="flex-row items-center gap-3 bg-[#007275]/10 rounded-2xl p-3 mt-3">
                      <Ionicons name="sparkles" size={18} color="#007275" />
                      <View className="flex-1">
                        <Text className="text-[#211f1e] text-sm font-semibold">
                          {finder.finder_name} dice que la encontró
                        </Text>
                        <Text className="text-gray-600 text-xs">Contacto: {finder.finder_phone}</Text>
                      </View>
                      {isPhone(finder.finder_phone) && (
                        <TouchableOpacity
                          className="w-9 h-9 rounded-full bg-[#007275] items-center justify-center"
                          onPress={() => callOwner(finder.finder_phone)}
                          accessibilityRole="button"
                          accessibilityLabel={`Llamar a ${finder.finder_name}`}
                        >
                          <Ionicons name="call" size={16} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  <View className="flex-row gap-2 mt-3">
                    {!resolved && (
                      <TouchableOpacity
                        className="flex-1 bg-[#007275] py-2.5 rounded-xl flex-row items-center justify-center gap-1.5"
                        onPress={() => onResolveAlert(alert.id)}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text className="text-white text-sm font-semibold">Ya apareció</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      className={`${resolved ? "flex-1" : "px-4"} bg-red-50 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5`}
                      onPress={() => onDeleteAlert(alert.id)}
                      accessibilityLabel="Eliminar alerta"
                    >
                      <Ionicons name="trash-outline" size={16} color="#dc2626" />
                      <Text className="text-red-600 text-sm font-semibold">Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Mascotas encontradas */}
      {showFoundPets && (
        <View className={SECTION}>
          <SectionTitle icon="checkmark-circle" color="#007275" title="Mascotas que he encontrado" />
          {foundPets.length === 0 ? (
            <EmptyBox icon="heart-outline" text="No has reportado mascotas encontradas" />
          ) : (
            foundPets.map((found, i) => (
              <View key={found.id} className={`flex-row items-center py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                <PetThumb uri={found.image_url} className="w-12 h-12 rounded-full" iconSize={22} />
                <View className="flex-1 ml-3">
                  <Text className="font-bold text-[#211f1e]">{found.pet_name}</Text>
                  <Text className="text-gray-500 text-xs">Encontrada el {formatDate(found.created_at)}</Text>
                </View>
                <Ionicons name="heart" size={18} color="#ff7e70" />
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

// El servicio devuelve "No disponible" cuando no hay teléfono; solo se ofrece llamar si hay dígitos
function isPhone(phone?: string | null): phone is string {
  return !!phone && /\d{7,}/.test(phone.replace(/\D/g, ""));
}



function EmptyBox({ icon, text, children }: { icon: keyof typeof Ionicons.glyphMap; text: string; children?: ReactNode }) {
  return (
    <View className="bg-[#faf5e0] p-6 rounded-2xl items-center">
      <View className="w-14 h-14 rounded-full bg-white items-center justify-center mb-2">
        <Ionicons name={icon} size={28} color="#007275" />
      </View>
      <Text className="text-gray-600 text-center text-sm">{text}</Text>
      {children}
    </View>
  );
}


