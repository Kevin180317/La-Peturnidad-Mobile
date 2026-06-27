import { followsService } from "@/services/follows.service";
import { messagesService } from "@/services/messages.service";
import { petsService } from "@/services/pets.service";
import { profileService } from "@/services/profile.service";
import { supabase } from "@/utils/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, [id]);

  const init = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) { router.replace("/"); return; }
    setCurrentUserId(user.user.id);
    await loadProfile();
  };

  const loadProfile = async () => {
    if (!id) return;
    setLoading(true);

    const profileResult = await profileService.getByUserId(id);
    if (profileResult.success && profileResult.data) {
      setProfile(profileResult.data);
    }

    const petsResult = await petsService.getAll(id);
    if (petsResult.success) {
      setPets(petsResult.data);
    }

    const { data: user } = await supabase.auth.getUser();
    if (user?.user) {
      const following = await followsService.isFollowing(user.user.id, id);
      setIsFollowing(following);
    }

    const followersRes = await followsService.getFollowers(id);
    if (followersRes.success) setFollowersCount(followersRes.data.length);

    const followingRes = await followsService.getFollowing(id);
    if (followingRes.success) setFollowingCount(followingRes.data.length);

    if (profileResult.data?.role) {
      setUserRole(profileResult.data.role);
    }

    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [id]);

  const handleFollow = async () => {
    if (!currentUserId) return;
    if (isFollowing) {
      const r = await followsService.unfollow(currentUserId, id);
      if (r.success) setIsFollowing(false);
      else Toast.show({ type: "error", text1: "Error", text2: r.error, position: "top" });
    } else {
      const r = await followsService.follow(currentUserId, id);
      if (r.success) setIsFollowing(true);
      else Toast.show({ type: "error", text1: "Error", text2: r.error, position: "top" });
    }
  };

  const handleMessage = async () => {
    if (!currentUserId) return;
    const r = await messagesService.getOrCreateConversation(currentUserId, id);
    if (r.success) {
      router.push(`/mensajes/${r.data?.conversation_id}`);
    } else {
      Toast.show({ type: "error", text1: "Error", text2: r.error, position: "top" });
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#ff7e70" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0] p-5">
        <Text className="text-4xl mb-3">😕</Text>
        <Text className="text-gray-500 text-center">Perfil no encontrado</Text>
        <TouchableOpacity className="bg-[#211f1e] py-3 px-6 rounded-lg mt-4" onPress={() => router.back()}>
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initial = profile.first_name?.[0]?.toUpperCase() || "U";
  const isOwn = currentUserId === id;

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerClassName="p-5 bg-[#faf5e0] flex-1"
    >
      <View className="items-center mb-6">
        {profile.profile_picture_url ? (
          <Image source={{ uri: profile.profile_picture_url }} className="w-28 h-28 rounded-full border-4 border-[#ff7e70]" />
        ) : (
          <View className="w-28 h-28 rounded-full bg-[#ff7e70] items-center justify-center border-4 border-[#ff7e70]/30">
            <Text className="text-4xl text-white font-bold">{initial}</Text>
          </View>
        )}
        <Text className="text-2xl font-bold mt-3 text-[#211f1e]">
          {profile.first_name} {profile.last_name}
        </Text>
        {profile.city && (
          <Text className="text-gray-500">{profile.city}</Text>
        )}
      </View>

      <View className="flex-row justify-around bg-white p-4 rounded-xl mb-6 shadow-sm">
        <View className="items-center">
          <Text className="text-xl font-bold text-[#ff7e70]">{pets.length}</Text>
          <Text className="text-gray-500 text-sm">Mascotas</Text>
        </View>
        <TouchableOpacity className="items-center" onPress={() => router.push(`/seguidores?id=${id}&tab=followers`)}>
          <Text className="text-xl font-bold text-[#ff7e70]">{followersCount}</Text>
          <Text className="text-gray-500 text-sm">Seguidores</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center" onPress={() => router.push(`/seguidores?id=${id}&tab=following`)}>
          <Text className="text-xl font-bold text-[#ff7e70]">{followingCount}</Text>
          <Text className="text-gray-500 text-sm">Siguiendo</Text>
        </TouchableOpacity>
      </View>

      {isOwn ? (
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className="flex-1 bg-[#007275] py-3 rounded-lg"
            onPress={() => router.push("/editar-perfil")}
          >
            <Text className="text-white text-center font-bold">✏️ Editar perfil</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg ${isFollowing ? "bg-gray-500" : "bg-[#ff7e70]"}`}
            onPress={handleFollow}
          >
            <Text className="text-white text-center font-bold">
              {isFollowing ? "Siguiendo" : "Seguir"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-[#005e66] py-3 rounded-lg"
            onPress={handleMessage}
          >
            <Text className="text-white text-center font-bold">Mensaje</Text>
          </TouchableOpacity>
        </View>
      )}

      {userRole && (userRole === "moderator" || userRole === "admin") && (
        <View className="bg-[#ff7e70]/10 p-3 rounded-xl mb-4">
          <Text className="text-[#ff7e70] text-center font-semibold capitalize">
            🛡️ {userRole === "admin" ? "Administrador" : "Moderador"}
          </Text>
        </View>
      )}

      <Text className="text-lg font-bold mb-3 text-[#211f1e]">🐾 Mascotas</Text>
      {pets.length === 0 ? (
        <View className="bg-white p-6 rounded-xl items-center mb-6">
          <Text className="text-gray-500">Sin mascotas registradas</Text>
        </View>
      ) : (
        pets.map((pet) => (
          <View key={pet.id} className="bg-white p-4 rounded-xl mb-3 shadow-sm flex-row">
            {pet.image_url ? (
              <Image source={{ uri: pet.image_url }} className="w-16 h-16 rounded-lg mr-3" />
            ) : (
              <View className="w-16 h-16 bg-gray-200 rounded-lg mr-3 items-center justify-center">
                <Text className="text-2xl">{pet.type === "perro" ? "🐶" : "🐱"}</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="font-bold text-lg">{pet.name}</Text>
              <Text className="text-gray-600 capitalize">{pet.type} • {pet.color}</Text>
              <Text className="text-gray-500 text-sm">Tamaño: {pet.size}</Text>
            </View>
          </View>
        ))
      )}

      <View className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <Text className="font-bold mb-2 text-[#211f1e]">Información</Text>
        <Text className="text-gray-600">Miembro desde: {formatDate(profile.created_at)}</Text>
      </View>
    </ScrollView>
  );
}
