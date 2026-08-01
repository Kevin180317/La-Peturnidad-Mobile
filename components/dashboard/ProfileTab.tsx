import { Ionicons } from "@expo/vector-icons";
import { dashboardService } from "@/services/dashboard.service";
import { formatDate } from "@/utils/format";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface ProfileTabProps {
  profile: any;
  email: string;
  userId: string;
  petsCount: number;
  unreadCount: number;
  refreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  onGoComunidad: () => void;
  onProfileUpdated: () => void;
}

export function ProfileTab({
  profile,
  email,
  userId,
  petsCount,
  unreadCount,
  refreshing,
  onRefresh,
  onLogout,
  onGoComunidad,
  onProfileUpdated,
}: ProfileTabProps) {
  const router = useRouter();
  const [selectedProfileImage, setSelectedProfileImage] = useState<{
    uri: string;
  } | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);

  const handleSelectProfileImage = async () => {
    const result = await dashboardService.selectImage();
    if (result.success) {
      setSelectedProfileImage(result.image || null);
    } else if (result.error !== "Selección cancelada") {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: result.error,
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const handleUploadProfileImage = async () => {
    if (!selectedProfileImage || !userId) return;

    setUploadingProfileImage(true);

    const uploadResult = await dashboardService.uploadImage(
      selectedProfileImage.uri,
      "profile-pictures",
    );

    if (uploadResult.success) {
      const updateResult = await dashboardService.updateProfilePicture(
        userId,
        uploadResult.url || "",
      );

      if (updateResult.success) {
        Toast.show({
          type: "success",
          text1: "Éxito",
          text2: "Foto de perfil actualizada",
          position: "top",
          visibilityTime: 3000,
        });
        setSelectedProfileImage(null);
        onProfileUpdated();
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: updateResult.error,
          position: "top",
          visibilityTime: 3000,
        });
      }
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: uploadResult.error,
        position: "top",
        visibilityTime: 3000,
      });
    }

    setUploadingProfileImage(false);
  };

  const menuItems: {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bg: string;
    label: string;
    onPress: () => void;
    badge?: number;
  }[] = [
    {
      icon: "create-outline",
      color: "#007275",
      bg: "bg-teal-50",
      label: "Editar perfil",
      onPress: () => router.push("/editar-perfil"),
    },
    {
      icon: "notifications-outline",
      color: "#d97706",
      bg: "bg-amber-50",
      label: "Configurar notificaciones",
      onPress: () => router.push("/notificaciones"),
    },
    {
      icon: "chatbubbles-outline",
      color: "#ff7e70",
      bg: "bg-red-50",
      label: "Ir a la comunidad",
      onPress: onGoComunidad,
    },
    {
      icon: "chatbox-ellipses-outline",
      color: "#2563eb",
      bg: "bg-blue-50",
      label: "Mensajes",
      onPress: () => router.push("/mensajes"),
      badge: unreadCount,
    },
    {
      icon: "people-outline",
      color: "#7c3aed",
      bg: "bg-violet-50",
      label: "Grupos",
      onPress: () => router.push("/grupos"),
    },
    {
      icon: "paw-outline",
      color: "#16a34a",
      bg: "bg-green-50",
      label: "Reuniones exitosas",
      onPress: () => router.push("/historias"),
    },
  ];

  if (profile?.role === "admin" || profile?.role === "moderator") {
    menuItems.push({
      icon: "shield-checkmark-outline",
      color: "#211f1e",
      bg: "bg-gray-100",
      label: "Panel de moderación",
      onPress: () => router.push("/panel-moderacion"),
    });
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerClassName="p-5 pb-10"
    >
      <Text className="text-2xl font-bold mb-6">Mi Perfil</Text>

      {profile ? (
        <>
          {/* Foto de perfil */}
          <View className="items-center mb-6">
            <View className="relative">
              <Image
                source={{
                  uri:
                    profile.profile_picture_url ||
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ168Mp9N1EPzK86wWBf_Ipl7gqELKUyhryNg&s",
                }}
                className="w-32 h-32 rounded-full border-4 border-[#ff7e70]/30"
              />
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-[#ff7e70] w-10 h-10 rounded-full items-center justify-center border-2 border-white"
                onPress={handleSelectProfileImage}
              >
                <Ionicons name="camera" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedProfileImage && (
              <View className="mt-4 w-full">
                <Image
                  source={{ uri: selectedProfileImage.uri }}
                  className="w-24 h-24 rounded-lg self-center mb-2"
                />
                <TouchableOpacity
                  className={`py-2 rounded-lg ${uploadingProfileImage ? "bg-gray-400" : "bg-green-500"}`}
                  onPress={handleUploadProfileImage}
                  disabled={uploadingProfileImage}
                >
                  <Text className={`text-center ${uploadingProfileImage ? "text-gray-700" : "text-white"}`}>
                    {uploadingProfileImage
                      ? "Subiendo..."
                      : "Confirmar nueva foto"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Información personal */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-bold mb-4">Información personal</Text>

            <View className="space-y-3">
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">Nombre:</Text>
                <Text className="flex-1">
                  {profile.first_name} {profile.last_name}
                </Text>
              </View>
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">Email:</Text>
                <Text className="flex-1">{email}</Text>
              </View>
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">Teléfono:</Text>
                <Text className="flex-1">{profile.phone}</Text>
              </View>
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">Cumpleaños:</Text>
                <Text className="flex-1">{formatDate(profile.birth_date)}</Text>
              </View>
            </View>
          </View>

          {/* Dirección */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-bold mb-4">Dirección</Text>

            <View className="space-y-3">
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">Calle/Colonia:</Text>
                <Text className="flex-1">{profile.address}</Text>
              </View>
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">Ciudad:</Text>
                <Text className="flex-1">{profile.city}</Text>
              </View>
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">C.P.:</Text>
                <Text className="flex-1">{profile.postal_code}</Text>
              </View>
            </View>
          </View>

          {/* Estadísticas */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-bold mb-4">Estadísticas</Text>

            <View className="flex-row justify-around">
              <View className="items-center">
                <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mb-1">
                  <Ionicons name="paw" size={18} color="#2563eb" />
                </View>
                <Text className="text-xl font-bold text-blue-500">
                  {petsCount}
                </Text>
                <Text className="text-gray-600">Mascotas</Text>
              </View>
              <TouchableOpacity className="items-center" onPress={() => router.push(`/seguidores?id=${userId}&tab=followers`)}>
                <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mb-1">
                  <Ionicons name="people" size={18} color="#ff7e70" />
                </View>
                <Text className="text-xl font-bold text-[#ff7e70]">
                  {profile?.followers_count || 0}
                </Text>
                <Text className="text-gray-600">Seguidores</Text>
              </TouchableOpacity>
              <TouchableOpacity className="items-center" onPress={() => router.push(`/seguidores?id=${userId}&tab=following`)}>
                <View className="w-10 h-10 rounded-full bg-teal-50 items-center justify-center mb-1">
                  <Ionicons name="person-add" size={18} color="#007275" />
                </View>
                <Text className="text-xl font-bold text-[#007275]">
                  {profile?.following_count || 0}
                </Text>
                <Text className="text-gray-600">Siguiendo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Acciones - lista de menú */}
          <View className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
            <Text className="text-lg font-bold p-5 pb-3">Acciones</Text>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                className={`flex-row items-center px-5 py-4 ${
                  index < menuItems.length - 1 ? "border-b border-gray-100" : ""
                }`}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View className={`w-10 h-10 rounded-full ${item.bg} items-center justify-center mr-3`}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text className="flex-1 font-medium text-[#211f1e]">
                  {item.label}
                </Text>
                {item.badge && item.badge > 0 ? (
                  <View className="bg-[#ff7e70] rounded-full min-w-[22px] h-[22px] items-center justify-center px-1 mr-1">
                    <Text className="text-white text-xs font-bold">{item.badge}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Información de cuenta */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-bold mb-4">Cuenta</Text>
            <View className="space-y-3">
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">Miembro desde:</Text>
                <Text className="flex-1">{formatDate(profile.created_at)}</Text>
              </View>
              <View className="flex-row border-b border-gray-100 py-2">
                <Text className="font-semibold w-1/3">
                  Última actualización:
                </Text>
                <Text className="flex-1">{formatDate(profile.updated_at)}</Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        <View className="bg-yellow-50 p-8 rounded-xl items-center">
          <Ionicons name="alert-circle-outline" size={44} color="#d97706" />
          <Text className="text-gray-600 text-center mt-3">
            No se encontró información de perfil. Completa tu registro.
          </Text>
          <TouchableOpacity
            className="bg-[#ff7e70] py-3 px-6 rounded-lg mt-4"
            onPress={() =>
              router.replace({
                pathname: "/register-extended",
                params: { email, userId },
              })
            }
          >
            <Text className="text-white font-semibold">Completar perfil</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botón de cerrar sesión */}
      <TouchableOpacity
        className="bg-[#ff7e70] py-4 rounded-xl mt-4 flex-row items-center justify-center gap-2"
        onPress={onLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text className="text-white text-center font-bold">Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
