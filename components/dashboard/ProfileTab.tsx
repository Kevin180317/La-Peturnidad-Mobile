import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ProfileTabProps {
  profile: any;
  email?: string;
  petsCount: number;
  myAlertsCount: number;
  foundPetsCount: number;
  selectedProfileImage: { uri: string } | null;
  uploadingProfileImage: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onSelectProfileImage: () => void;
  onUploadProfileImage: () => void;
  onLogout: () => void;
}

export function ProfileTab({
  profile, email, petsCount, myAlertsCount, foundPetsCount,
  selectedProfileImage, uploadingProfileImage,
  refreshing, onRefresh, onSelectProfileImage,
  onUploadProfileImage, onLogout,
}: ProfileTabProps) {
  const initial = profile?.first_name?.[0]?.toUpperCase() || "🐾";

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerClassName="p-5"
    >
      <View className="items-center mb-6">
        {profile?.profile_picture_url ? (
          <Image
            source={{ uri: profile.profile_picture_url }}
            className="w-24 h-24 rounded-full border-2 border-[#ff7e70]"
          />
        ) : (
          <View className="w-24 h-24 rounded-full bg-[#ff7e70] items-center justify-center">
            <Text className="text-4xl text-white font-bold">{initial}</Text>
          </View>
        )}
        <TouchableOpacity className="mt-2" onPress={onSelectProfileImage}>
          <Text className="text-[#ff7e70] text-sm">Cambiar foto</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold mt-3 text-[#ff7e70]">
          {profile?.first_name} {profile?.last_name}
        </Text>
        <Text className="text-[#ff7e70]">{email}</Text>

        {selectedProfileImage && (
          <View className="mt-3 items-center">
            <Image source={{ uri: selectedProfileImage.uri }} className="w-16 h-16 rounded-lg mb-2" />
            <TouchableOpacity
              className={`py-2 px-4 rounded-lg ${uploadingProfileImage ? "bg-gray-400" : "bg-green-500"}`}
              onPress={onUploadProfileImage}
              disabled={uploadingProfileImage}
            >
              <Text className="text-white">
                {uploadingProfileImage ? "Subiendo..." : "Confirmar"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View className="bg-white p-5 rounded-xl mb-5 border border-gray-200">
        <View className="flex-row items-center gap-2 mb-3">
          <Ionicons name="person" size={18} color="#ff7e70" />
          <Text className="font-bold text-[#ff7e70]">Información</Text>
        </View>
        {[
          { label: "Teléfono", value: profile?.phone },
          { label: "Colonia", value: profile?.address },
          { label: "Ciudad", value: profile?.city },
          { label: "C.P.", value: profile?.postal_code },
        ].map((item, i) => (
          <View
            key={item.label}
            className={`flex-row justify-between py-2 ${i < 3 ? "border-b border-gray-100" : ""}`}
          >
            <Text className="text-[#ff7e70]">{item.label}</Text>
            <Text className="text-[#ff7e70]">{item.value || "-"}</Text>
          </View>
        ))}
      </View>

      <View className="bg-white p-5 rounded-xl mb-5 border border-gray-200">
        <View className="flex-row items-center gap-2 mb-3">
          <Ionicons name="stats-chart" size={18} color="#ff7e70" />
          <Text className="font-bold text-[#ff7e70]">Stats</Text>
        </View>
        <View className="flex-row justify-around">
          <StatItem value={petsCount} label="Mascotas" color="#ff7e70" />
          <StatItem value={myAlertsCount} label="Alertas" color="#005e66" />
          <StatItem value={foundPetsCount} label="Encontradas" color="#007275" />
        </View>
      </View>

      <TouchableOpacity
        className="bg-[#ff7e70] py-4 rounded-xl border-2 border-[#ff7e70]/30"
        onPress={onLogout}
      >
        <View className="flex-row items-center justify-center gap-2">
          <Ionicons name="log-out" size={18} color="white" />
          <Text className="text-white text-center font-bold">Cerrar sesión</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View className="items-center">
      <Text className="text-2xl font-bold" style={{ color }}>{value}</Text>
      <Text className="text-[#ff7e70] text-sm">{label}</Text>
    </View>
  );
}
