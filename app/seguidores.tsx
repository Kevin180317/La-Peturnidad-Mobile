import { Ionicons } from "@expo/vector-icons";
import { followsService } from "@/services/follows.service";
import { reportsService } from "@/services/reports.service";
import { supabase } from "@/utils/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

    const { data: auth } = await supabase.auth.getUser();
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

  const renderUser = (user: any) => (
    <TouchableOpacity
      key={user.user_id}
      className="flex-row items-center p-3 bg-white rounded-2xl mb-2 shadow-[0_4px_24px_rgba(33,31,30,0.08)]"
      onPress={() => router.push(`/perfil/${user.user_id}`)}
    >
      {user.profile_picture_url ? (
        <Image source={{ uri: user.profile_picture_url }} className="w-12 h-12 rounded-full mr-3" />
      ) : (
        <View className="w-12 h-12 bg-[#007275] rounded-full items-center justify-center mr-3">
          <Text className="text-white font-bold text-lg">
            {user.first_name?.[0]?.toUpperCase() || "U"}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="font-semibold text-[#211f1e]">
          {user.first_name} {user.last_name}
        </Text>
        {user.city && <Text className="text-gray-500 text-sm">{user.city}</Text>}
      </View>
      <Text className="text-gray-500">›</Text>
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

  return (
    <View className="flex-1 bg-[#faf5e0]">
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === "followers" ? "border-[#007275]" : "border-transparent"}`}
          onPress={() => setActiveTab("followers")}
        >
          <Text className={`font-semibold ${activeTab === "followers" ? "text-[#007275]" : "text-gray-500"}`}>
            Seguidores ({followers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === "following" ? "border-[#007275]" : "border-transparent"}`}
          onPress={() => setActiveTab("following")}
        >
          <Text className={`font-semibold ${activeTab === "following" ? "text-[#007275]" : "text-gray-500"}`}>
            Siguiendo ({following.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerClassName="p-4">
        {activeTab === "followers" ? (
          followers.length === 0 ? (
            <View className="bg-white p-10 rounded-2xl items-center mt-10 shadow-[0_4px_24px_rgba(33,31,30,0.08)]">
              <View className="w-16 h-16 rounded-full bg-[#007275]/10 items-center justify-center mb-3">
                <Ionicons name="people-outline" size={32} color="#007275" />
              </View>
              <Text className="text-gray-500 text-center">Sin seguidores aún</Text>
            </View>
          ) : (
            followers.map(renderUser)
          )
        ) : following.length === 0 ? (
          <View className="bg-white p-10 rounded-2xl items-center mt-10 shadow-[0_4px_24px_rgba(33,31,30,0.08)]">
            <View className="w-16 h-16 rounded-full bg-[#007275]/10 items-center justify-center mb-3">
              <Ionicons name="person-outline" size={32} color="#007275" />
            </View>
            <Text className="text-gray-500 text-center">No sigues a nadie aún</Text>
          </View>
        ) : (
          following.map(renderUser)
        )}
      </ScrollView>
    </View>
  );
}
