import { Avatar, CARD, SectionTitle } from "@/components/kit/Kit";
import { followsService, type SuggestedUser } from "@/services/follows.service";
import { getCurrentUser } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

const VISIBLE = 5;
const FETCHED = 10;

/** "Sugeridos para ti": perfiles recomendados con el motivo y botón Seguir. */
export function SuggestedUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<SuggestedUser[]>([]);

  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    // Se piden más de las que se muestran: al descartar o seguir, entra la siguiente
    followsService.getSuggestions(FETCHED).then((r) => {
      if (!stale) setUsers(r.data ?? []);
    });
    return () => {
      stale = true;
    };
  }, []);

  const follow = async (u: SuggestedUser) => {
    if (busy) return;
    setBusy(u.user_id);
    const { data } = await getCurrentUser();
    const me = data?.user?.id;
    const r = me ? await followsService.followOrRequest(me, u.user_id, u.is_private) : null;
    setBusy(null);
    if (!r) return;
    if (!r.success) {
      Toast.show({ type: "error", text1: "Error", text2: r.error, position: "top" });
      return;
    }
    if (r.data?.status === "requested") Toast.show({ type: "info", text1: "Solicitud enviada", position: "top" });
    setUsers((prev) => prev.filter((x) => x.user_id !== u.user_id));
  };

  const dismiss = async (u: SuggestedUser) => {
    // Se quita al instante; si falla el guardado reaparecerá en la próxima carga
    setUsers((prev) => prev.filter((x) => x.user_id !== u.user_id));
    const { data } = await getCurrentUser();
    const me = data?.user?.id;
    if (me) await followsService.dismissSuggestion(me, u.user_id);
  };

  if (!users.length) return null;
  return (
    <View className="mb-4">
      <SectionTitle icon="sparkles" title="Sugeridos para ti" />
      <View className={`${CARD} overflow-hidden`}>
        {users.slice(0, VISIBLE).map((u, i) => (
          <View key={u.user_id} className={`flex-row items-center px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}>
            <TouchableOpacity className="flex-row items-center flex-1" activeOpacity={0.7} onPress={() => router.push(`/perfil/${u.user_id}`)}>
              <Avatar uri={u.profile_picture_url} name={u.first_name} size={44} ring={false} />
              <View className="flex-1 ml-3">
                <Text className="font-bold text-[#211f1e] text-[15px]" numberOfLines={1}>
                  {u.first_name} {u.last_name}
                </Text>
                <Text className="text-gray-500 text-xs mt-0.5">{u.reason}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#007275] py-2 px-4 rounded-full flex-row items-center gap-1"
              activeOpacity={0.85}
              onPress={() => follow(u)}
              accessibilityRole="button"
              accessibilityLabel={`Seguir a ${u.first_name}`}
            >
              <Ionicons name="person-add" size={14} color="#fff" />
              <Text className="text-white font-semibold text-sm">Seguir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="ml-1 p-2"
              onPress={() => dismiss(u)}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={`Descartar a ${u.first_name}`}
            >
              <Ionicons name="close" size={18} color="#9BA1A6" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}
