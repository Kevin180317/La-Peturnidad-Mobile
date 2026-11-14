import { Avatar, CARD, EmptyCard, ScreenTitle } from "@/components/kit/Kit";
import { followsService, type FollowRequestItem } from "@/services/follows.service";
import { getCurrentUser } from "@/utils/session";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function SolicitudesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<FollowRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await getCurrentUser();
    const me = data?.user?.id;
    if (!me) {
      setLoading(false);
      return;
    }
    const r = await followsService.getIncomingRequests(me);
    if (!r.success) Toast.show({ type: "error", text1: "Error al cargar", text2: r.error, position: "top" });
    setItems(r.data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const respond = async (item: FollowRequestItem, accept: boolean) => {
    if (busy) return;
    setBusy(item.request_id);
    const r = await followsService.respondToRequest(item.request_id, accept);
    setBusy(null);
    if (!r.success) {
      Toast.show({ type: "error", text1: "Error", text2: r.error, position: "top" });
      return;
    }
    setItems((prev) => prev.filter((x) => x.request_id !== item.request_id));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#007275" />
      </View>
    );
  }

  return (
    <ScrollView
      className="bg-[#faf5e0]"
      contentContainerClassName="p-5 pb-10"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ScreenTitle title="Solicitudes" subtitle="Personas que quieren seguirte" />
      {items.length === 0 ? (
        <EmptyCard icon="person-add-outline" text="No tienes solicitudes pendientes" />
      ) : (
        <View className={`${CARD} overflow-hidden`}>
          {items.map((u, i) => (
            <View key={u.request_id} className={`flex-row items-center px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}>
              <TouchableOpacity className="flex-row items-center flex-1" activeOpacity={0.7} onPress={() => router.push(`/perfil/${u.user_id}`)}>
                <Avatar uri={u.profile_picture_url} name={u.first_name} size={44} ring={false} />
                <View className="flex-1 ml-3">
                  <Text className="font-bold text-[#211f1e] text-[15px]" numberOfLines={1}>
                    {u.first_name} {u.last_name}
                  </Text>
                  {!!u.city && <Text className="text-gray-500 text-xs mt-0.5">{u.city}</Text>}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-100 py-2 px-3 rounded-full mr-2"
                disabled={!!busy}
                onPress={() => respond(u, false)}
                accessibilityRole="button"
                accessibilityLabel={`Rechazar a ${u.first_name}`}
              >
                <Text className="text-gray-700 font-semibold text-sm">Rechazar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-[#007275] py-2 px-3 rounded-full"
                disabled={!!busy}
                onPress={() => respond(u, true)}
                accessibilityRole="button"
                accessibilityLabel={`Aceptar a ${u.first_name}`}
              >
                <Text className="text-white font-semibold text-sm">Aceptar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
