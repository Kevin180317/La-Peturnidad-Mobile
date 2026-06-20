import { notificationsService } from "@/services/notifications.service";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function NotificacionesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [lostPetAlerts, setLostPetAlerts] = useState(true);
  const [foundPetAlerts, setFoundPetAlerts] = useState(true);
  const [communityAnnouncements, setCommunityAnnouncements] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      router.replace("/");
      return;
    }

    const result = await notificationsService.getPreferences(user.user.id);
    if (result.success && result.data) {
      setPushEnabled(result.data.push_enabled);
      setLostPetAlerts(result.data.lost_pet_alerts);
      setFoundPetAlerts(result.data.found_pet_alerts);
      setCommunityAnnouncements(result.data.community_announcements);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return;

    const result = await notificationsService.update(user.user.id, {
      push_enabled: pushEnabled,
      lost_pet_alerts: lostPetAlerts,
      found_pet_alerts: foundPetAlerts,
      community_announcements: communityAnnouncements,
    });

    if (result.success) {
      Toast.show({ type: "success", text1: "Preferencias guardadas", position: "top", visibilityTime: 2000 });
    } else {
      Toast.show({ type: "error", text1: "Error", text2: result.error, position: "top", visibilityTime: 3000 });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#ff7e70" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerClassName="p-5 bg-[#faf5e0] flex-1">
      <Text className="text-2xl font-bold text-[#211f1e] mb-6">
        Configuración de notificaciones
      </Text>

      <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
        <Text className="text-lg font-bold mb-4">Preferencias</Text>

        <View className="space-y-4">
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-1 mr-4">
              <Text className="font-semibold text-[#211f1e]">Notificaciones push</Text>
              <Text className="text-gray-500 text-sm">Recibir notificaciones en general</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: "#ccc", true: "#ff7e70" }}
              thumbColor={pushEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-1 mr-4">
              <Text className="font-semibold text-[#211f1e]">Alertas de mascotas perdidas</Text>
              <Text className="text-gray-500 text-sm">Cuando alguien reporte una mascota perdida en tu colonia</Text>
            </View>
            <Switch
              value={lostPetAlerts}
              onValueChange={setLostPetAlerts}
              trackColor={{ false: "#ccc", true: "#ff7e70" }}
              thumbColor={lostPetAlerts ? "#fff" : "#f4f3f4"}
              disabled={!pushEnabled}
            />
          </View>

          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-1 mr-4">
              <Text className="font-semibold text-[#211f1e]">Mascotas encontradas</Text>
              <Text className="text-gray-500 text-sm">Cuando alguien encuentre a tu mascota</Text>
            </View>
            <Switch
              value={foundPetAlerts}
              onValueChange={setFoundPetAlerts}
              trackColor={{ false: "#ccc", true: "#ff7e70" }}
              thumbColor={foundPetAlerts ? "#fff" : "#f4f3f4"}
              disabled={!pushEnabled}
            />
          </View>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1 mr-4">
              <Text className="font-semibold text-[#211f1e]">Avisos de la comunidad</Text>
              <Text className="text-gray-500 text-sm">Nuevos avisos y eventos en tu colonia</Text>
            </View>
            <Switch
              value={communityAnnouncements}
              onValueChange={setCommunityAnnouncements}
              trackColor={{ false: "#ccc", true: "#ff7e70" }}
              thumbColor={communityAnnouncements ? "#fff" : "#f4f3f4"}
              disabled={!pushEnabled}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        className={`py-4 rounded-xl ${saving ? "bg-gray-400" : "bg-[#ff7e70]"}`}
        onPress={handleSave}
        disabled={saving}
      >
        <Text className="text-white text-center font-bold">
          {saving ? "Guardando..." : "Guardar preferencias"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="py-4 rounded-xl mt-3 bg-[#211f1e]"
        onPress={() => router.back()}
      >
        <Text className="text-white text-center font-bold">Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
