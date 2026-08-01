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
                className="w-32 h-32 rounded-full border-4 border-red-200"
              />
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-[#ff7e70] w-10 h-10 rounded-full items-center justify-center border-2 border-white"
                onPress={handleSelectProfileImage}
              >
                <Text className="text-white text-lg">📷</Text>
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
                <Text className="text-2xl font-bold text-blue-500">
                  {petsCount}
                </Text>
                <Text className="text-gray-600">Mascotas</Text>
              </View>
              <TouchableOpacity className="items-center" onPress={() => router.push(`/seguidores?id=${userId}&tab=followers`)}>
                <Text className="text-2xl font-bold text-[#ff7e70]">
                  {profile?.followers_count || 0}
                </Text>
                <Text className="text-gray-600">Seguidores</Text>
              </TouchableOpacity>
              <TouchableOpacity className="items-center" onPress={() => router.push(`/seguidores?id=${userId}&tab=following`)}>
                <Text className="text-2xl font-bold text-[#007275]">
                  {profile?.following_count || 0}
                </Text>
                <Text className="text-gray-600">Siguiendo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Acciones */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-bold mb-4">Acciones</Text>
            <TouchableOpacity
              className="bg-[#007275] py-3 rounded-lg mb-3"
              onPress={() => router.push("/editar-perfil")}
            >
              <Text className="text-white text-center font-semibold">
                ✏️ Editar perfil
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#007275] py-3 rounded-lg mb-3"
              onPress={() => router.push("/notificaciones")}
            >
              <Text className="text-white text-center font-semibold">
                🔔 Configurar notificaciones
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#007275] py-3 rounded-lg mb-3"
              onPress={onGoComunidad}
            >
              <Text className="text-white text-center font-semibold">
                💬 Ir a la comunidad
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#007275] py-3 rounded-lg mb-3 flex-row items-center justify-center"
              onPress={() => router.push("/mensajes")}
            >
              <Text className="text-white text-center font-semibold">
                ✉️ Mensajes
              </Text>
              {unreadCount > 0 && (
                <View className="bg-[#ff7e70] rounded-full min-w-[22px] h-[22px] items-center justify-center ml-2 px-1">
                  <Text className="text-white text-xs font-bold">{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#007275] py-3 rounded-lg mb-3"
              onPress={() => router.push("/grupos")}
            >
              <Text className="text-white text-center font-semibold">
                👥 Grupos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#007275] py-3 rounded-lg mb-3"
              onPress={() => router.push("/historias")}
            >
              <Text className="text-white text-center font-semibold">
                🐾 Reuniones exitosas
              </Text>
            </TouchableOpacity>
            {profile?.role === "admin" || profile?.role === "moderator" ? (
              <TouchableOpacity
                className="bg-[#211f1e] py-3 rounded-lg"
                onPress={() => router.push("/panel-moderacion")}
              >
                <Text className="text-white text-center font-semibold">
                  🛡️ Panel de moderación
                </Text>
              </TouchableOpacity>
            ) : null}
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
          <Text className="text-4xl mb-3">⚠️</Text>
          <Text className="text-gray-600 text-center">
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
        className="bg-[#ff7e70] py-4 rounded-xl mt-4"
        onPress={onLogout}
      >
        <Text className="text-white text-center font-bold">Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
