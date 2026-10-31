import { ListRow, ListSection, PrimaryButton, ScreenTitle } from "@/components/kit/Kit";
import { notificationsService } from "@/services/notifications.service";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
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

  const loadPreferences = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      router.replace("/");
      return;
    }

    const result = await notificationsService.getPreferences(user.user.id);
    if (result.success && result.data) {
      setPushEnabled(result.data.push_enabled ?? true);
      setLostPetAlerts(result.data.lost_pet_alerts ?? true);
      setFoundPetAlerts(result.data.found_pet_alerts ?? true);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      setSaving(false);
      router.replace("/");
      return;
    }

    const result = await notificationsService.update(user.user.id, {
      push_enabled: pushEnabled,
      lost_pet_alerts: lostPetAlerts,
      found_pet_alerts: foundPetAlerts,
    });

    if (result.success) {
      Toast.show({ type: "success", text1: "Preferencias guardadas", position: "top", visibilityTime: 2000 });
    } else {
      Toast.show({ type: "error", text1: "Error", text2: result.error, position: "top", visibilityTime: 3000 });
    }
    setSaving(false);
  };

  // loadPreferences corre una sola vez al montar (deps estables intencionales)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar: el setState ocurre tras la consulta async
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#007275" />
      </View>
    );
  }

  const sw = (value: boolean) => ({
    trackColor: { false: "#D1D5DB", true: "#007275" },
    thumbColor: "#ffffff",
    ios_backgroundColor: "#D1D5DB",
    value,
  });

  return (
    <ScrollView className="bg-[#faf5e0]" contentContainerClassName="p-5 pb-10 grow">
      <ScreenTitle title="Preferencias" subtitle="Elige qué avisos quieres recibir" />

      <ListSection title="General">
        <ListRow
          first
          icon="notifications-outline"
          label="Notificaciones push"
          right={<Switch {...sw(pushEnabled)} onValueChange={setPushEnabled} accessibilityLabel="Notificaciones push" />}
        />
      </ListSection>

      <ListSection title="Alertas">
        <ListRow
          first
          icon="megaphone-outline"
          color="#ff7e70"
          label="Mascotas perdidas en tu colonia"
          right={
            <Switch {...sw(lostPetAlerts)} onValueChange={setLostPetAlerts} disabled={!pushEnabled} accessibilityLabel="Alertas de mascotas perdidas" />
          }
        />
        <ListRow
          icon="heart-outline"
          label="Alguien encontró a tu mascota"
          right={
            <Switch {...sw(foundPetAlerts)} onValueChange={setFoundPetAlerts} disabled={!pushEnabled} accessibilityLabel="Mascotas encontradas" />
          }
        />
      </ListSection>
      {!pushEnabled && (
        <Text className="text-gray-500 text-xs -mt-3 mb-6 ml-2">
          Activa las notificaciones push para recibir alertas.
        </Text>
      )}

      <PrimaryButton
        title={saving ? "Guardando..." : "Guardar preferencias"}
        icon="checkmark"
        onPress={handleSave}
        loading={saving}
      />
    </ScrollView>
  );
}
