import { Ionicons } from "@expo/vector-icons";
import type {
  EmergencyAlert,
  FoundPetWithDetails,
  Pet,
} from "@/services/dashboard.service";
import { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CARD, Chip, EmptyCard, PetThumb, RoundIconButton, SectionTitle, ToggleTile } from "@/components/kit/Kit";
import { PetDetailModal } from "./PetDetailModal";
import { PetForm, type PetFormData } from "./PetForm";

interface HomeTabProps {
  profileName: string | null;
  pets: Pet[];
  loadingPets: boolean;
  myAlerts: EmergencyAlert[];
  foundPets: FoundPetWithDetails[];
  refreshing: boolean;
  onRefresh: () => void;
  onLoadPets: () => void;
  onOpenSearch: () => void;
  onRegisterPet: (data: PetFormData) => Promise<boolean>;
  onUpdatePet: (petId: string, data: PetFormData) => Promise<boolean>;
  onDeletePet: (petId: string) => void;
}

export function HomeTab({
  profileName,
  pets,
  loadingPets,
  myAlerts,
  foundPets,
  refreshing,
  onRefresh,
  onLoadPets,
  onOpenSearch,
  onRegisterPet,
  onUpdatePet,
  onDeletePet,
}: HomeTabProps) {
  const [showPets, setShowPets] = useState(false);
  const [showPetForm, setShowPetForm] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const handleSubmit = async (data: PetFormData) => {
    const ok = editingPet
      ? await onUpdatePet(editingPet.id, data)
      : await onRegisterPet(data);
    if (ok) {
      setShowPetForm(false);
      setEditingPet(null);
    }
  };

  const handleStartEdit = (pet: Pet) => {
    setEditingPet(pet);
    setShowPetForm(true);
  };

  const openNewPetForm = () => {
    setEditingPet(null);
    setShowPetForm(true);
    setShowPets(false);
  };

  const today = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerClassName="p-5 pb-10"
    >
      {/* Saludo */}
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-1 pr-3">
          <Text className="text-gray-500 text-sm">{today.charAt(0).toUpperCase() + today.slice(1)}</Text>
          <Text className="text-2xl font-bold text-[#211f1e] mt-0.5" numberOfLines={1}>
            Hola, {profileName || "Usuario"}
          </Text>
        </View>
        <RoundIconButton icon="search" tint="white" size={46} onPress={onOpenSearch} label="Buscar" />
      </View>

      {/* Resumen */}
      <View className={`${CARD} flex-row p-4 mb-4`}>
        <Stat icon="paw" color="#007275" value={pets.length} label="Mascotas" />
        <View className="w-px bg-gray-100 my-1" />
        <Stat icon="warning" color="#ff7e70" value={myAlerts.length} label="Alertas" />
        <View className="w-px bg-gray-100 my-1" />
        <Stat icon="heart" color="#007275" value={foundPets.length} label="Encontradas" />
      </View>

      {/* Acción principal */}
      <TouchableOpacity
        className="bg-[#007275] rounded-3xl p-5 mb-4 overflow-hidden shadow-[0_8px_24px_rgba(0,114,117,0.3)]"
        activeOpacity={0.9}
        onPress={openNewPetForm}
        accessibilityRole="button"
        accessibilityLabel="Registrar mascota"
      >
        <Ionicons name="paw" size={110} color="rgba(255,255,255,0.1)" style={{ position: "absolute", right: -18, bottom: -24, transform: [{ rotate: "-20deg" }] }} />
        <Ionicons name="paw" size={44} color="rgba(255,255,255,0.1)" style={{ position: "absolute", right: 88, top: 8, transform: [{ rotate: "15deg" }] }} />
        <View className="flex-row items-center gap-4">
          <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center">
            <Ionicons name="add" size={30} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">Registrar mascota</Text>
            <Text className="text-white/85 text-sm mt-0.5">Tenla lista por si algún día se pierde</Text>
          </View>
          <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#007275" />
          </View>
        </View>
      </TouchableOpacity>

      <View className="flex-row gap-3 mb-6">
        <ToggleTile
          icon="paw"
          title="Mis mascotas"
          subtitle="Toca para ver sus fichas"
          count={pets.length}
          active={showPets}
          onPress={() => {
            onLoadPets();
            setShowPets(!showPets);
            setShowPetForm(false);
          }}
          label={`${showPets ? "Ocultar" : "Ver"} mascotas`}
        />
      </View>

      {/* Lista de mascotas */}
      {showPets && (
        <View className="mb-2">
          <SectionTitle icon="paw" title="Mis mascotas" />
          {loadingPets ? (
            <ActivityIndicator className="my-6" size="large" color="#007275" />
          ) : pets.length === 0 ? (
            <EmptyCard
              icon="paw"
              title="No tienes mascotas registradas"
              text="Agrega tu primera mascota para empezar a protegerla."
            >
              <TouchableOpacity className="bg-[#007275] py-2.5 px-5 rounded-full mt-4" onPress={openNewPetForm}>
                <Text className="text-white font-semibold">Registrar mascota</Text>
              </TouchableOpacity>
            </EmptyCard>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                className={`${CARD} p-3 mb-3 flex-row items-center`}
                activeOpacity={0.85}
                onPress={() => {
                  setSelectedPet(pet);
                  setModalVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Ver ficha de ${pet.name}`}
              >
                <PetThumb uri={pet.image_url} type={pet.type} className="w-[72px] h-[72px] rounded-2xl" iconSize={32} />
                <View className="flex-1 ml-3">
                  <Text className="font-bold text-lg text-[#211f1e]" numberOfLines={1}>
                    {pet.name}
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5 mt-1.5">
                    {!!pet.type && <Chip text={pet.type} tone="teal" />}
                    {!!pet.color && <Chip text={pet.color} />}
                    {!!pet.size && <Chip text={pet.size} />}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9BA1A6" />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Formulario de registro de mascota */}
      {showPetForm && (
        <PetForm
          key={editingPet?.id ?? "new"}
          editingPet={editingPet}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowPetForm(false);
            setEditingPet(null);
          }}
        />
      )}

      <PetDetailModal
        pet={selectedPet}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onEdit={handleStartEdit}
        onDelete={onDeletePet}
      />
    </ScrollView>
  );
}

function Stat({
  icon,
  color,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: number;
  label: string;
}) {
  return (
    <View className="flex-1 items-center">
      <View className="w-9 h-9 rounded-full items-center justify-center mb-1.5" style={{ backgroundColor: `${color}1A` }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text className="text-xl font-bold text-[#211f1e]">{value}</Text>
      <Text className="text-gray-500 text-xs" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
