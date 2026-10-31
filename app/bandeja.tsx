import { notificationsService } from "@/services/notifications.service";
import type { Tables } from "@/types/database";
import { formatDate, formatTimeAgo } from "@/utils/format";
import { CARD_SHADOW, EmptyCard, ScreenTitle } from "@/components/kit/Kit";
import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

type Notification = Tables<"notifications">;
type NotificationData = { type?: string; url?: string } | null;

export default function BandejaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Notification[]>([]);

  const load = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      router.replace("/login");
      return;
    }
    setUserId(data.user.id);
    const result = await notificationsService.getInbox(data.user.id);
    if (result.success) setItems(result.data ?? []);
    else Toast.show({ type: "error", text1: "No se pudieron cargar tus notificaciones", text2: result.error, position: "top" });
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleOpen = async (item: Notification) => {
    if (!item.read) {
      setItems((current) => current.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
      notificationsService.markRead(item.id);
    }
    const url = (item.data as NotificationData)?.url;
    // Solo rutas internas de la app
    if (url?.startsWith("/")) router.navigate(url as Href);
  };

  const handleMarkAll = async () => {
    if (!userId) return;
    setItems((current) => current.map((n) => ({ ...n, read: true })));
    notificationsService.markAllRead(userId);
  };

  // Recarga al entrar y al volver a la pantalla (sin realtime: la bandeja se actualiza al enfocarla)
  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#007275" />
      </View>
    );
  }

  const hasUnread = items.some((n) => !n.read);

  return (
    <FlatList
      className="flex-1 bg-[#faf5e0]"
      contentContainerClassName="p-5 pb-10 grow"
      data={items}
      keyExtractor={(item) => item.id}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      ListHeaderComponent={
        <ScreenTitle
          title="Notificaciones"
          subtitle={hasUnread ? "Tienes avisos sin leer" : "Estás al día"}
          right={
            hasUnread ? (
              <TouchableOpacity
                className="bg-[#007275]/10 px-3 py-2 rounded-full flex-row items-center gap-1"
                onPress={handleMarkAll}
                accessibilityRole="button"
                accessibilityLabel="Marcar todas como leídas"
              >
                <Ionicons name="checkmark-done" size={15} color="#007275" />
                <Text className="text-[#007275] font-semibold text-xs">Marcar leídas</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      }
      ListEmptyComponent={
        <EmptyCard
          icon="notifications-outline"
          title="Sin notificaciones"
          text="Aquí verás las alertas de mascotas perdidas en tu colonia y los avisos de mascotas encontradas."
        />
      }
      renderItem={({ item }) => {
        const emergency = (item.data as NotificationData)?.type === "emergency";
        return (
          <TouchableOpacity
            className={`flex-row items-start p-4 rounded-3xl mb-3 ${item.read ? `bg-white ${CARD_SHADOW}` : "bg-white border-[1.5px] border-[#007275]/40 shadow-[0_6px_20px_rgba(0,114,117,0.12)]"}`}
            onPress={() => handleOpen(item)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${item.read ? "" : "No leída. "}${item.title}`}
          >
            <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-3 ${emergency ? "bg-[#ff7e70]/15" : "bg-[#007275]/10"}`}>
              <Ionicons name={emergency ? "megaphone" : "paw"} size={20} color={emergency ? "#ff7e70" : "#007275"} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-start">
                <Text className={`flex-1 text-[15px] text-[#211f1e] ${item.read ? "font-semibold" : "font-bold"}`}>{item.title}</Text>
                {!item.read && <View className="w-2.5 h-2.5 rounded-full bg-[#ff7e70] mt-1.5 ml-2" />}
              </View>
              <Text className="text-gray-600 text-sm mt-1 leading-5">{item.body}</Text>
              <Text className="text-gray-500 text-xs mt-2">{formatTimeAgo(item.created_at) || formatDate(item.created_at)}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}
