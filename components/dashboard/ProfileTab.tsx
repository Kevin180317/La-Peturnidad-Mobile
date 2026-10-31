import { Ionicons } from "@expo/vector-icons";
import { dashboardService, type PickedImage } from "@/services/dashboard.service";
import { formatDate } from "@/utils/format";
import { openLegalUrl } from "@/utils/legal";
import { Avatar, CARD, Chip, EmptyCard, ListRow, ListSection, PrimaryButton } from "@/components/kit/Kit";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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
  notificationsUnread: number;
  refreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onGoComunidad: () => void;
  onProfileUpdated: () => void;
}

export function ProfileTab({
  profile,
  email,
  userId,
  petsCount,
  unreadCount,
  notificationsUnread,
  refreshing,
  onRefresh,
  onLogout,
  onDeleteAccount,
  onGoComunidad,
  onProfileUpdated,
}: ProfileTabProps) {
  const router = useRouter();
  const [selectedProfileImage, setSelectedProfileImage] =
    useState<PickedImage | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);

  const handleSelectProfileImage = async () => {
    const result = await dashboardService.selectImage();
    if (result.success) {
      setSelectedProfileImage(result.image);
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
      selectedProfileImage,
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

  type MenuItem = {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bg: string;
    label: string;
    onPress: () => void;
    badge?: number;
  };

  const menuCategories: { title: string; items: MenuItem[] }[] = [
    {
      title: "Mensajería",
      items: [
        {
          icon: "chatbox-ellipses-outline",
          color: "#007275",
          bg: "bg-[#007275]/10",
          label: "Mensajes",
          onPress: () => router.push("/mensajes"),
          badge: unreadCount,
        },
        {
          icon: "notifications-outline",
          color: "#007275",
          bg: "bg-[#007275]/10",
          label: "Notificaciones",
          onPress: () => router.push("/bandeja"),
          badge: notificationsUnread,
        },
        {
          icon: "chatbubbles-outline",
          color: "#007275",
          bg: "bg-[#007275]/10",
          label: "Comunidad",
          onPress: onGoComunidad,
        },
      ],
    },
    {
      title: "Exploración",
      items: [
        {
          icon: "people-outline",
          color: "#211f1e",
          bg: "bg-[#211f1e]/10",
          label: "Grupos",
          onPress: () => router.push("/grupos"),
        },
        {
          icon: "paw-outline",
          color: "#007275",
          bg: "bg-[#007275]/10",
          label: "Reuniones exitosas",
          onPress: () => router.push("/historias"),
        },
      ],
    },
    {
      title: "Configuración",
      items: [
        {
          icon: "create-outline",
          color: "#007275",
          bg: "bg-[#007275]/10",
          label: "Editar perfil",
          onPress: () => router.push("/editar-perfil"),
        },
        {
          icon: "lock-closed-outline",
          color: "#007275",
          bg: "bg-[#007275]/10",
          label: "Cuenta y seguridad",
          onPress: () => router.push("/seguridad"),
        },
        {
          icon: "notifications-outline",
          color: "#007275",
          bg: "bg-[#007275]/10",
          label: "Preferencias de notificaciones",
          onPress: () => router.push("/notificaciones"),
        },
      ],
    },
    {
      title: "Ayuda",
      items: [
        {
          icon: "book-outline",
          color: "#007275",
          bg: "bg-[#007275]/10",
          label: "Cómo funciona",
          onPress: () => router.push("/como-usar"),
        },
        {
          icon: "help-circle-outline",
          color: "#007275",
          bg: "bg-[#007275]/10",
          label: "Preguntas frecuentes",
          onPress: () => router.push("/faq"),
        },
        {
          icon: "document-text-outline",
          color: "#007275",
          bg: "bg-[#007275]/10",
          label: "Términos y condiciones",
          onPress: () => openLegalUrl("terms"),
        },
        {
          icon: "shield-outline",
          color: "#007275",
          bg: "bg-[#007275]/10",
          label: "Política de privacidad",
          onPress: () => openLegalUrl("privacy"),
        },
      ],
    },
  ];

  const moderationItems: { title: string; items: MenuItem[] }[] =
    profile?.role === "admin" || profile?.role === "moderator"
      ? [
          {
            title: "Administración",
            items: [
              {
                icon: "shield-checkmark-outline",
                color: "#211f1e",
                bg: "bg-[#211f1e]/10",
                label: "Panel de moderación",
                onPress: () => router.push("/panel-moderacion"),
              },
            ],
          },
        ]
      : [];

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerClassName="p-5 pb-10"
    >
      {profile ? (
        <>
          {/* Cabecera del perfil */}
          <View className={`${CARD} items-center px-5 pt-6 pb-5 mb-6`}>
            <View>
              <Avatar
                uri={selectedProfileImage?.uri ?? profile.profile_picture_url}
                name={profile.first_name}
                size={108}
              />
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-[#007275] w-10 h-10 rounded-full items-center justify-center border-[3px] border-white"
                onPress={handleSelectProfileImage}
                accessibilityRole="button"
                accessibilityLabel="Cambiar foto de perfil"
              >
                <Ionicons name="camera" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text className="text-xl font-bold text-[#211f1e] mt-3 text-center">
              {profile.first_name} {profile.last_name}
            </Text>
            <Text className="text-gray-500 text-sm mt-0.5">{email}</Text>
            {!!profile.city && (
              <View className="mt-2">
                <Chip icon="location" text={profile.city} tone="teal" />
              </View>
            )}

            {selectedProfileImage && (
              <View className="flex-row gap-2 mt-4 w-full">
                <PrimaryButton
                  title={uploadingProfileImage ? "Subiendo..." : "Guardar foto"}
                  icon="checkmark"
                  loading={uploadingProfileImage}
                  onPress={handleUploadProfileImage}
                  className="flex-1"
                />
                <PrimaryButton
                  title="Descartar"
                  variant="ghost"
                  disabled={uploadingProfileImage}
                  onPress={() => setSelectedProfileImage(null)}
                  className="flex-1"
                />
              </View>
            )}

            <View className="flex-row w-full mt-5 pt-4 border-t border-gray-100">
              <ProfileStat value={petsCount} label="Mascotas" />
              <ProfileStat
                value={profile?.followers_count || 0}
                label="Seguidores"
                onPress={() => router.push(`/seguidores?id=${userId}&tab=followers`)}
              />
              <ProfileStat
                value={profile?.following_count || 0}
                label="Siguiendo"
                onPress={() => router.push(`/seguidores?id=${userId}&tab=following`)}
              />
            </View>
          </View>

          <ListSection title="Información personal">
            <ListRow first icon="call-outline" label="Teléfono" value={profile.phone} />
            <ListRow icon="calendar-outline" label="Cumpleaños" value={formatDate(profile.birth_date)} />
            <ListRow icon="home-outline" label="Calle / colonia" value={profile.address} />
            <ListRow icon="location-outline" label="Ciudad" value={profile.city} />
            <ListRow icon="map-outline" label="Código postal" value={profile.postal_code} />
          </ListSection>

          {[...menuCategories, ...moderationItems].map((category) => (
            <ListSection key={category.title} title={category.title}>
              {category.items.map((item, i) => (
                <ListRow
                  key={item.label}
                  first={i === 0}
                  icon={item.icon}
                  color={item.color}
                  label={item.label}
                  badge={item.badge}
                  onPress={item.onPress}
                />
              ))}
            </ListSection>
          ))}

          <ListSection title="Cuenta">
            <ListRow first icon="sparkles-outline" label="Miembro desde" value={formatDate(profile.created_at)} />
            <ListRow icon="refresh-outline" label="Última actualización" value={formatDate(profile.updated_at)} />
          </ListSection>
        </>
      ) : (
        <EmptyCard icon="alert-circle-outline" color="#211f1e" title="Perfil incompleto" text="No se encontró información de perfil. Completa tu registro.">
          <TouchableOpacity
            className="bg-[#007275] py-2.5 px-5 rounded-full mt-4"
            onPress={() =>
              router.replace({
                pathname: "/register-extended",
                params: { email, userId },
              })
            }
          >
            <Text className="text-white font-semibold">Completar perfil</Text>
          </TouchableOpacity>
        </EmptyCard>
      )}

      {/* Cerrar sesión (el texto "Cerrar Sesión" lo usa el flujo Maestro 05-logout) */}
      <TouchableOpacity
        className={`${CARD} h-[52px] flex-row items-center justify-center gap-2`}
        activeOpacity={0.8}
        onPress={onLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        <Text className="text-red-600 text-center font-bold text-[15px]">Cerrar Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="py-4 mt-2 flex-row items-center justify-center gap-2"
        onPress={onDeleteAccount}
        accessibilityRole="button"
        accessibilityLabel="Eliminar cuenta"
      >
        <Ionicons name="trash-outline" size={16} color="#9BA1A6" />
        <Text className="text-gray-500 text-center font-semibold text-sm">Eliminar cuenta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ProfileStat({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  const body = (
    <>
      <Text className="text-xl font-bold text-[#211f1e]">{value}</Text>
      <Text className="text-gray-500 text-xs mt-0.5">{label}</Text>
    </>
  );
  if (!onPress) return <View className="flex-1 items-center">{body}</View>;
  return (
    <TouchableOpacity className="flex-1 items-center" activeOpacity={0.6} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Ver ${label.toLowerCase()}`}>
      {body}
    </TouchableOpacity>
  );
}
