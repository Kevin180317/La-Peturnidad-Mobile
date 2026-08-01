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
            <Text className="text-2xl font-bold text-[#211f1e]">
              ¡Hola, {profileName || "Usuario"}!
            </Text>
            <Text className="text-gray-600 mt-1">
              {new Date().toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onOpenSearch}
            className="bg-[#007275] p-3 rounded-2xl"
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tarjetas de resumen */}
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm items-center">
          <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mb-2">
            <Ionicons name="paw" size={20} color="#2563eb" />
          </View>
          <Text className="text-xl font-bold text-blue-600">{pets.length}</Text>
          <Text className="text-gray-600 text-sm">Mascotas</Text>
        </View>
        <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm items-center">
          <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mb-2">
            <Ionicons name="warning" size={20} color="#d97706" />
          </View>
          <Text className="text-xl font-bold text-amber-600">
            {myAlerts.length}
          </Text>
          <Text className="text-gray-600 text-sm">Alertas</Text>
        </View>
        <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm items-center">
          <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mb-2">
            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
          </View>
          <Text className="text-xl font-bold text-green-600">
            {foundPets.length}
          </Text>
          <Text className="text-gray-600 text-sm">Encontradas</Text>
        </View>
      </View>

      {/* Botones de acción rápida */}
      <View className="flex-row gap-3 mb-6">
        <TouchableOpacity
          className="flex-1 bg-green-500 py-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
          onPress={() => {
            setShowPetForm(true);
            setShowPets(false);
          }}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text className="text-white text-center font-semibold">
            Registrar mascota
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-[#007275] py-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
          onPress={() => {
            onLoadPets();
            setShowPets(!showPets);
            setShowPetForm(false);
          }}
        >
          <Ionicons name={showPets ? "eye-off" : "eye"} size={20} color="#fff" />
          <Text className="text-white text-center font-semibold">
            {showPets ? "Ocultar" : "Ver"} mascotas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de mascotas */}
      {showPets && (
        <View className="mb-6">
          <Text className="text-lg font-bold mb-3">Mis mascotas</Text>
          {loadingPets ? (
            <ActivityIndicator size="large" color="#ff7e70" />
          ) : pets.length === 0 ? (
            <View className="bg-[#faf5e0] p-8 rounded-xl items-center">
              <View className="w-14 h-14 rounded-full bg-[#ff7e70]/10 items-center justify-center mb-3">
                <Ionicons name="paw" size={28} color="#ff7e70" />
              </View>
              <Text className="text-gray-500 text-center">
                No tienes mascotas registradas. ¡Agrega tu primera mascota!
              </Text>
            </View>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                className="bg-white p-4 rounded-xl mb-3 shadow-sm flex-row"
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
                  <Text className="font-bold text-lg">{pet.name}</Text>
                  <Text className="text-gray-600 capitalize">
                    {pet.type} • {pet.color}
                  </Text>
                  <Text className="text-gray-500 text-sm">
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
