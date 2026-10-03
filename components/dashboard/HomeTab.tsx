import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  EmergencyAlert,
  FoundPetWithDetails,
  Pet,
} from "@/services/dashboard.service";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EmptyState } from "@/components/EmptyState";
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

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerClassName="p-5 pb-10"
    >
      {/* Header de bienvenida */}
      <View className="mb-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold font-[Inter\_700Bold] text-[#211f1e]">
              ¡Hola, {profileName || "Usuario"}!
            </Text>
            <Text className="text-gray-600 font-[Inter\_400Regular] mt-1">
              {(() => {
                const date = new Date().toLocaleDateString("es-MX", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                return date.charAt(0).toUpperCase() + date.slice(1);
              })()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onOpenSearch}
            className="bg-[#005e66] p-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tarjetas de resumen */}
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-white p-4 rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] items-center">
          <View className="w-10 h-10 rounded-full bg-[#005e66]/10 items-center justify-center mb-2">
            <Ionicons name="paw" size={20} color="#005e66" />
          </View>
          <Text className="text-xl font-bold font-[Inter\_700Bold] text-[#005e66]">{pets.length}</Text>
          <Text className="text-gray-600 font-[Inter\_400Regular] text-sm">Mascotas</Text>
        </View>
        <View className="flex-1 bg-white p-4 rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] items-center">
          <View className="w-10 h-10 rounded-full bg-[#ff7e70]/10 items-center justify-center mb-2">
            <Ionicons name="warning" size={20} color="#ff7e70" />
          </View>
          <Text className="text-xl font-bold font-[Inter\_700Bold] text-[#c2402f]">
            {myAlerts.length}
          </Text>
          <Text className="text-gray-600 font-[Inter\_400Regular] text-sm">Alertas</Text>
        </View>
        <View className="flex-1 bg-white p-4 rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] items-center">
          <View className="w-10 h-10 rounded-full bg-[#005e66]/10 items-center justify-center mb-2">
            <Ionicons name="checkmark-circle" size={20} color="#005e66" />
          </View>
          <Text className="text-xl font-bold font-[Inter\_700Bold] text-[#005e66]">
            {foundPets.length}
          </Text>
          <Text className="text-gray-600 font-[Inter\_400Regular] text-sm">Encontradas</Text>
        </View>
      </View>

      {/* Botones de acción rápida */}
      <View className="flex-row gap-3 mb-6">
        <TouchableOpacity
          className="flex-1 bg-[#005e66] py-4 rounded-xl flex-row items-center justify-center gap-2"
          onPress={() => {
            setShowPetForm(true);
            setShowPets(false);
          }}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text className="text-white text-center font-semibold font-[Inter\_600SemiBold]">
            Registrar mascota
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-[#005e66] py-4 rounded-xl flex-row items-center justify-center gap-2"
          onPress={() => {
            onLoadPets();
            setShowPets(!showPets);
            setShowPetForm(false);
          }}
        >
          <Ionicons name={showPets ? "eye-off" : "eye"} size={20} color="#fff" />
          <Text className="text-white text-center font-semibold font-[Inter\_600SemiBold]">
            {showPets ? "Ocultar" : "Ver"} mascotas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de mascotas */}
      {showPets && (
        <View className="mb-6">
          <Text className="text-lg font-bold font-[Inter\_700Bold] mb-3">Mis mascotas</Text>
          {loadingPets ? (
            <ActivityIndicator size="large" color="#005e66" />
          ) : pets.length === 0 ? (
            <EmptyState
              icon="paw"
              title="No tienes mascotas registradas"
              subtitle="Agrega tu primera mascota para empezar a protegerla."
              actionLabel="Registrar mascota"
              onAction={() => {
                setShowPetForm(true);
                setShowPets(false);
              }}
            />
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                className="bg-white p-4 rounded-2xl mb-3 shadow-[0_4px_24px_rgba(33,31,30,0.08)] flex-row"
                onPress={() => {
                  setSelectedPet(pet);
                  setModalVisible(true);
                }}
              >
                {pet.image_url ? (
                  <Image
                    source={{ uri: pet.image_url }}
                    className="w-16 h-16 rounded-lg mr-3"
                  />
                ) : (
                  <View className="w-16 h-16 bg-gray-200 rounded-lg mr-3 items-center justify-center">
                    <MaterialCommunityIcons
                      name={pet.type === "perro" ? "dog" : "cat"}
                      size={28}
                      color="#6B7280"
                    />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="font-bold font-[Inter\_700Bold] text-lg">{pet.name}</Text>
                  <Text className="text-gray-600 font-[Inter\_400Regular] capitalize">
                    {pet.type} • {pet.color}
                  </Text>
                  <Text className="text-gray-500 font-[Inter\_400Regular] text-sm">
                    Tamaño: {pet.size}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Formulario de registro de mascota */}
      {showPetForm && (
        <PetForm
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
