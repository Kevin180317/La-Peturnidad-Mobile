import { Ionicons } from "@expo/vector-icons";
import { followsService } from "@/services/follows.service";
import { reportsService } from "@/services/reports.service";
import { supabase } from "@/utils/supabase";
import { getCurrentUser } from "@/utils/session";
import { Avatar, CARD, EmptyCard, Segmented } from "@/components/kit/Kit";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function SeguidoresScreen() {
  const params = useLocalSearchParams<{ id?: string | string[]; tab?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const tab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    tab === "following" ? "following" : "followers",
  );
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    const { data: auth } = await getCurrentUser();
    const me = auth?.user?.id;

    const [followersRes, followingRes, blockedRes] = await Promise.all([
      followsService.getFollowers(id),
      followsService.getFollowing(id),
      me
        ? reportsService.getBlockedUsers(me)
        : Promise.resolve({ success: true, data: [] as string[] }),
    ]);

    const loadError = !followersRes.success
      ? followersRes.error
      : !followingRes.success
        ? followingRes.error
        : null;
    if (loadError) {
      Toast.show({ type: "error", text1: "Error al cargar", text2: loadError, position: "top" });
    }

    const blocked = new Set(blockedRes.data ?? []);
    const followerIds = (followersRes.data?.map((f) => f.follower_id) ?? []).filter((u) => !blocked.has(u));
    const followingIds = (followingRes.data?.map((f) => f.following_id) ?? []).filter((u) => !blocked.has(u));

    const allIds = [...new Set([...followerIds, ...followingIds])];

    const profileMap: Record<string, any> = {};
    if (allIds.length > 0) {
      const { data: profiles, error } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name, profile_picture_url, city")
        .in("user_id", allIds);

      if (error) {
        Toast.show({ type: "error", text1: "Error al cargar perfiles", text2: error.message, position: "top" });
      }
      profiles?.forEach((p) => {
        profileMap[p.user_id] = p;
      });
    }

    // Siempre se asignan (aunque estén vacías) para no mostrar datos viejos
    setFollowers(followerIds.map((fid) => profileMap[fid]).filter(Boolean));
    setFollowing(followingIds.map((fid) => profileMap[fid]).filter(Boolean));
    setLoading(false);
  };

  const renderUser = (user: any, i: number) => (
    <TouchableOpacity
      key={user.user_id}
      className={`flex-row items-center px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
      activeOpacity={0.7}
      onPress={() => router.push(`/perfil/${user.user_id}`)}
    >
      <Avatar uri={user.profile_picture_url} name={user.first_name} size={48} ring={false} />
      <View className="flex-1 ml-3">
        <Text className="font-bold text-[#211f1e] text-[15px]">
          {user.first_name} {user.last_name}
        </Text>
        {!!user.city && (
          <View className="flex-row items-center gap-1 mt-0.5">
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text className="text-gray-500 text-xs">{user.city}</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
    </TouchableOpacity>
  );

  // loadData corre al montar o cambiar id (recarga intencional)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar: el setState ocurre tras la consulta async
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#007275" />
      </View>
    );
  }

  if (!id) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0] p-5">
        <View className="w-16 h-16 rounded-full bg-[#211f1e]/10 items-center justify-center mb-3">
          <Ionicons name="person-remove-outline" size={32} color="#211f1e" />
        </View>
        <Text className="text-gray-500 text-center">Usuario no encontrado</Text>
        <TouchableOpacity className="bg-[#211f1e] py-3 px-6 rounded-xl mt-4" onPress={() => router.back()}>
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const list = activeTab === "followers" ? followers : following;

  return (
    <ScrollView className="flex-1 bg-[#faf5e0]" contentContainerClassName="p-5 pb-10">
      <Segmented
        options={[
          { key: "followers", label: `Seguidores (${followers.length})`, icon: "people" },
          { key: "following", label: `Siguiendo (${following.length})`, icon: "person-add" },
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />
      {list.length === 0 ? (
        <EmptyCard
          icon={activeTab === "followers" ? "people-outline" : "person-outline"}
          text={activeTab === "followers" ? "Sin seguidores aún" : "No sigues a nadie aún"}
        />
      ) : (
        <View className={`${CARD} overflow-hidden`}>{list.map(renderUser)}</View>
      )}
    </ScrollView>
  );
}
