import { followsService } from "@/services/follows.service";
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

export default function SeguidoresScreen() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    tab === "following" ? "following" : "followers",
  );
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    const [followersRes, followingRes] = await Promise.all([
      followsService.getFollowers(id),
      followsService.getFollowing(id),
    ]);

    const followerIds = followersRes.success ? followersRes.data.map((f) => f.follower_id) : [];
    const followingIds = followingRes.success ? followingRes.data.map((f) => f.following_id) : [];

    const allIds = [...new Set([...followerIds, ...followingIds])];

    if (allIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name, profile_picture_url, city")
        .in("user_id", allIds);

      const profileMap: Record<string, any> = {};
      profiles?.forEach((p) => {
        profileMap[p.user_id] = p;
      });

      setFollowers(
        followerIds.map((fid) => profileMap[fid]).filter(Boolean),
      );
      setFollowing(
        followingIds.map((fid) => profileMap[fid]).filter(Boolean),
      );
    }

    setLoading(false);
  };

  const renderUser = (user: any) => (
    <TouchableOpacity
      key={user.user_id}
      className="flex-row items-center p-3 bg-white rounded-xl mb-2"
      onPress={() => router.push(`/perfil/${user.user_id}`)}
    >
      {user.profile_picture_url ? (
        <Image source={{ uri: user.profile_picture_url }} className="w-12 h-12 rounded-full mr-3" />
      ) : (
        <View className="w-12 h-12 bg-[#ff7e70] rounded-full items-center justify-center mr-3">
          <Text className="text-white font-bold text-lg">
            {user.first_name?.[0]?.toUpperCase() || "U"}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="font-semibold text-[#211f1e]">
          {user.first_name} {user.last_name}
        </Text>
        {user.city && <Text className="text-gray-400 text-sm">{user.city}</Text>}
      </View>
      <Text className="text-gray-400">›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#ff7e70" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#faf5e0]">
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === "followers" ? "border-[#ff7e70]" : "border-transparent"}`}
          onPress={() => setActiveTab("followers")}
        >
          <Text className={`font-semibold ${activeTab === "followers" ? "text-[#ff7e70]" : "text-gray-500"}`}>
            Seguidores ({followers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === "following" ? "border-[#ff7e70]" : "border-transparent"}`}
          onPress={() => setActiveTab("following")}
        >
          <Text className={`font-semibold ${activeTab === "following" ? "text-[#ff7e70]" : "text-gray-500"}`}>
            Siguiendo ({following.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerClassName="p-4">
        {activeTab === "followers" ? (
          followers.length === 0 ? (
            <View className="bg-white p-10 rounded-xl items-center mt-10">
              <Text className="text-4xl mb-3">👥</Text>
              <Text className="text-gray-500 text-center">Sin seguidores aún</Text>
            </View>
          ) : (
            followers.map(renderUser)
          )
        ) : following.length === 0 ? (
          <View className="bg-white p-10 rounded-xl items-center mt-10">
            <Text className="text-4xl mb-3">👤</Text>
            <Text className="text-gray-500 text-center">No sigues a nadie aún</Text>
          </View>
        ) : (
          following.map(renderUser)
        )}
      </ScrollView>
    </View>
  );
}
