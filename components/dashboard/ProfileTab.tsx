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
      color: "#005e66",
      bg: "bg-[#005e66]/10",
      label: "Editar perfil",
      onPress: () => router.push("/editar-perfil"),
    },
    {
      icon: "notifications-outline",
      color: "#005e66",
      bg: "bg-[#005e66]/10",
      label: "Configurar notificaciones",
      onPress: () => router.push("/notificaciones"),
    },
    {
      icon: "chatbubbles-outline",
      color: "#005e66",
      bg: "bg-[#005e66]/10",
      label: "Ir a la comunidad",
      onPress: onGoComunidad,
    },
    {
      icon: "chatbox-ellipses-outline",
      color: "#005e66",
      bg: "bg-[#005e66]/10",
      label: "Mensajes",
      onPress: () => router.push("/mensajes"),
      badge: unreadCount,
    },
    {
      icon: "people-outline",
      color: "#211f1e",
      bg: "bg-[#211f1e]/10",
      label: "Grupos",
      onPress: () => router.push("/grupos"),
    },
    {
      icon: "paw-outline",
      color: "#005e66",
      bg: "bg-[#005e66]/10",
      label: "Reuniones exitosas",
      onPress: () => router.push("/historias"),
    },
    {
      icon: "book-outline",
      color: "#005e66",
      bg: "bg-[#005e66]/10",
      label: "Cómo funciona la app",
      onPress: () => router.push("/como-usar"),
    },
    {
      icon: "help-circle-outline",
      color: "#005e66",
      bg: "bg-[#005e66]/10",
      label: "Preguntas frecuentes",
      onPress: () => router.push("/faq"),
    },
  ];

  if (profile?.role === "admin" || profile?.role === "moderator") {
    menuItems.push({
      icon: "shield-checkmark-outline",
      color: "#211f1e",
      bg: "bg-[#211f1e]/10",
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
                className="w-32 h-32 rounded-full border-4 border-[#005e66]"
              />
              <TouchableOpacity
                className="absolute bottom-1 right-1 bg-[#005e66] w-11 h-11 rounded-full items-center justify-center border-3 border-white shadow-lg active:bg-[#004052]"
                onPress={handleSelectProfileImage}
              >
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedProfileImage && (
              <View className="mt-4 w-full">
                <Image
                  source={{ uri: selectedProfileImage.uri }}
                  className="w-24 h-24 rounded-lg self-center mb-2"
                />
                <TouchableOpacity
                  className={`py-2 rounded-xl ${uploadingProfileImage ? "bg-gray-400" : "bg-[#005e66]"}`}
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
          <View className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] mb-6 overflow-hidden">
            <Text className="text-lg font-bold p-5 pb-3">Información personal</Text>
            <View>
              <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
                <View className="w-10 h-10 rounded-full bg-[#005e66]/10 items-center justify-center mr-3">
                  <Ionicons name="person" size={20} color="#005e66" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold">NOMBRE</Text>
                  <Text className="text-[#211f1e] font-semibold">{profile.first_name} {profile.last_name}</Text>
                </View>
              </View>
              <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
                <View className="w-10 h-10 rounded-full bg-[#005e66]/10 items-center justify-center mr-3">
                  <Ionicons name="mail" size={20} color="#005e66" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold">CORREO ELECTRÓNICO</Text>
                  <Text className="text-[#211f1e] font-semibold text-sm">{email}</Text>
                </View>
              </View>
              <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
                <View className="w-10 h-10 rounded-full bg-[#005e66]/10 items-center justify-center mr-3">
                  <Ionicons name="call" size={20} color="#005e66" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold">TELÉFONO</Text>
                  <Text className="text-[#211f1e] font-semibold">{profile.phone}</Text>
                </View>
              </View>
              <View className="flex-row items-center px-5 py-4">
                <View className="w-10 h-10 rounded-full bg-[#005e66]/10 items-center justify-center mr-3">
                  <Ionicons name="calendar" size={20} color="#005e66" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold">CUMPLEAÑOS</Text>
                  <Text className="text-[#211f1e] font-semibold">{formatDate(profile.birth_date)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Dirección */}
          <View className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] mb-6 overflow-hidden">
            <Text className="text-lg font-bold p-5 pb-3">Dirección</Text>
            <View>
              <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
                <View className="w-10 h-10 rounded-full bg-[#005e66]/10 items-center justify-center mr-3">
                  <Ionicons name="home" size={20} color="#005e66" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold">CALLE/COLONIA</Text>
                  <Text className="text-[#211f1e] font-semibold">{profile.address}</Text>
                </View>
              </View>
              <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
                <View className="w-10 h-10 rounded-full bg-[#005e66]/10 items-center justify-center mr-3">
                  <Ionicons name="location" size={20} color="#005e66" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold">CIUDAD</Text>
                  <Text className="text-[#211f1e] font-semibold">{profile.city}</Text>
                </View>
              </View>
              <View className="flex-row items-center px-5 py-4">
                <View className="w-10 h-10 rounded-full bg-[#005e66]/10 items-center justify-center mr-3">
                  <Ionicons name="map" size={20} color="#005e66" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold">CÓDIGO POSTAL</Text>
                  <Text className="text-[#211f1e] font-semibold">{profile.postal_code}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Estadísticas */}
          <View className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] mb-6 overflow-hidden">
            <Text className="text-lg font-bold p-5 pb-3">Estadísticas</Text>
            <View>
              <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
                <View className="w-10 h-10 rounded-full bg-[#005e66]/10 items-center justify-center mr-3">
                  <Ionicons name="paw" size={20} color="#005e66" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold">MASCOTAS</Text>
                  <Text className="text-[#211f1e] font-semibold text-lg">{petsCount}</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => router.push(`/seguidores?id=${userId}&tab=followers`)} className="flex-row items-center px-5 py-4 border-b border-gray-100 active:bg-gray-50">
                <View className="w-10 h-10 rounded-full bg-[#005e66]/10 items-center justify-center mr-3">
                  <Ionicons name="people" size={20} color="#005e66" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold">SEGUIDORES</Text>
                  <Text className="text-[#211f1e] font-semibold text-lg">{profile?.followers_count || 0}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push(`/seguidores?id=${userId}&tab=following`)} className="flex-row items-center px-5 py-4 active:bg-gray-50">
                <View className="w-10 h-10 rounded-full bg-[#005e66]/10 items-center justify-center mr-3">
                  <Ionicons name="person-add" size={20} color="#005e66" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold">SIGUIENDO</Text>
                  <Text className="text-[#211f1e] font-semibold text-lg">{profile?.following_count || 0}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Acciones - lista de menú */}
          <View className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] mb-6 overflow-hidden">
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
                  <View className="bg-[#d93a3a] rounded-full min-w-[22px] h-[22px] items-center justify-center px-1 mr-1">
                    <Text className="text-white text-xs font-bold">{item.badge}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Información de cuenta */}
          <View className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] mb-6 overflow-hidden">
            <Text className="text-lg font-bold p-5 pb-3">Cuenta</Text>
            <View>
              <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
                <View className="w-10 h-10 rounded-full bg-[#005e66]/10 items-center justify-center mr-3">
                  <Ionicons name="calendar" size={20} color="#005e66" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold">MIEMBRO DESDE</Text>
                  <Text className="text-[#211f1e] font-semibold">{formatDate(profile.created_at)}</Text>
                </View>
              </View>

              <View className="flex-row items-center px-5 py-4">
                <View className="w-10 h-10 rounded-full bg-[#005e66]/10 items-center justify-center mr-3">
                  <Ionicons name="refresh" size={20} color="#005e66" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold">ÚLTIMA ACTUALIZACIÓN</Text>
                  <Text className="text-[#211f1e] font-semibold">{formatDate(profile.updated_at)}</Text>
                </View>
              </View>
            </View>
          </View>
        </>
      ) : (
        <View className="bg-[#211f1e]/10 p-8 rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] items-center">
          <Ionicons name="alert-circle-outline" size={44} color="#211f1e" />
          <Text className="text-gray-600 text-center mt-3">
            No se encontró información de perfil. Completa tu registro.
          </Text>
          <TouchableOpacity
            className="bg-[#005e66] py-3 px-6 rounded-xl mt-4"
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
        className="bg-red-600 py-4 rounded-xl mt-4 flex-row items-center justify-center gap-2 shadow-sm active:bg-red-700"
        onPress={onLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text className="text-white text-center font-bold">Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
