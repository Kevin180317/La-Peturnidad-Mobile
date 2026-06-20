import type { Pet } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PetDetailModal } from "./PetDetailModal";
import { PetForm } from "./PetForm";

interface PetFormState {
  name: string;
  color: string;
  size: string;
  features: string;
  type: "perro" | "gato";
  imageUrl: string | null;
  selectedImage: { uri: string } | null;
  uploading: boolean;
  visible: boolean;
}

interface HomeTabProps {
  profile: any;
  pets: Pet[];
  showPets: boolean;
  petForm: PetFormState;
  onRefresh: () => void;
  refreshing: boolean;
  onTogglePets: () => void;
  onShowForm: () => void;
  onSelectPet: (pet: Pet) => void;
  onFormChange: (field: keyof PetFormState, value: any) => void;
  onPetSizeChange: (v: string) => void;
  onSelectPetImage: () => void;
  onUploadPetImage: () => void;
  onSavePet: () => void;
  onCancelForm: () => void;
  selectedPet: Pet | null;
  modalVisible: boolean;
  onCloseModal: () => void;
  onDeletePet: (petId: string) => void;
}

export function HomeTab({
  profile, pets, showPets, petForm,
  onRefresh, refreshing, onTogglePets, onShowForm,
  onSelectPet, onFormChange, onPetSizeChange, onSelectPetImage,
  onUploadPetImage, onSavePet, onCancelForm,
  selectedPet, modalVisible, onCloseModal, onDeletePet,
}: HomeTabProps) {
  const initial = profile?.first_name?.[0]?.toUpperCase() || "P";

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerClassName="p-5"
    >
      <View className="flex-row items-center gap-4 mb-6">
        {profile?.profile_picture_url ? (
          <Image
            source={{ uri: profile.profile_picture_url }}
            className="w-14 h-14 rounded-full border-2 border-[#ff7e70]"
          />
        ) : (
          <View className="w-14 h-14 rounded-full bg-[#ff7e70] items-center justify-center">
            <Text className="text-2xl text-white font-bold">{initial}</Text>
          </View>
        )}
        <View>
          <Text className="text-xl font-bold text-[#ff7e70]">
            ¡Hola, {profile?.first_name || "Usuario"}!
          </Text>
          <Text className="text-sm text-[#ff7e70]">
            {new Date().toLocaleDateString("es-MX", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3 mb-6">
        <TouchableOpacity
          className="flex-1 bg-[#ff7e70] py-4 rounded-xl border-2 border-[#ff7e70]/30"
          onPress={onShowForm}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Ionicons name="add-circle" size={18} color="white" />
            <Text className="text-white text-center font-bold">Registrar</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-[#ff7e70] py-4 rounded-xl border-2 border-[#ff7e70]/30"
          onPress={onTogglePets}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Ionicons name="paw" size={18} color="white" />
            <Text className="text-white text-center font-bold">
              {showPets ? "Ocultar" : "Mis mascotas"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {showPets && (
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="paw" size={18} color="#ff7e70" />
            <Text className="font-bold text-[#ff7e70]">
              Mis mascotas ({pets.length})
            </Text>
          </View>
          {pets.length === 0 ? (
            <View className="bg-white p-6 rounded-xl items-center">
              <Ionicons name="paw" size={40} color="#ff7e70" />
              <Text className="text-[#ff7e70] mt-2">Sin mascotas registradas</Text>
            </View>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                className="flex-row items-center p-3 bg-[#faf5e0] rounded-xl mb-2"
                onPress={() => onSelectPet(pet)}
              >
                {pet.image_url ? (
                  <Image source={{ uri: pet.image_url }} className="w-12 h-12 rounded-lg" />
                ) : (
                  <View className="w-12 h-12 bg-white rounded-lg items-center justify-center">
                    <Ionicons
                      name={pet.type === "perro" ? "paw" : "help-circle"}
                      size={20} color="#ff7e70"
                    />
                  </View>
                )}
                <Text className="flex-1 ml-3 font-bold text-[#ff7e70]">{pet.name}</Text>
                <Ionicons name="chevron-forward" size={20} color="#ff7e70" />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {petForm.visible && (
        <PetForm
          petName={petForm.name}
          petColor={petForm.color}
          petSize={petForm.size}
          petFeatures={petForm.features}
          petType={petForm.type}
          selectedPetImage={petForm.selectedImage}
          petImageUrl={petForm.imageUrl}
          uploadingPetImage={petForm.uploading}
          onNameChange={(v) => onFormChange("name", v)}
          onColorChange={(v) => onFormChange("color", v)}
          onSizeChange={onPetSizeChange}
          onFeaturesChange={(v) => onFormChange("features", v)}
          onSelectImage={onSelectPetImage}
          onUploadImage={onUploadPetImage}
          onSave={onSavePet}
          onCancel={onCancelForm}
        />
      )}

      <PetDetailModal
        visible={modalVisible}
        pet={selectedPet}
        onClose={onCloseModal}
        onDelete={onDeletePet}
      />
    </ScrollView>
  );
}
