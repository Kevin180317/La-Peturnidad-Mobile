import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeleton";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  searchService,
  type GroupSearchResult,
  type PetSearchResult,
  type UserSearchResult,
} from "@/services/search.service";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type SearchTab = "pets" | "groups" | "users";

const TABS: {
  key: SearchTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "pets", label: "Mascotas", icon: "paw" },
  { key: "groups", label: "Grupos", icon: "people" },
  { key: "users", label: "Usuarios", icon: "person" },
];

export default function BuscarScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("pets");
  const [pets, setPets] = useState<PetSearchResult[]>([]);
  const [groups, setGroups] = useState<GroupSearchResult[]>([]);
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const firstRun = useRef(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/");
      }
    });
  }, [router]);

  // Búsqueda con debounce de 300ms (primer render no dispara búsqueda)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const timer = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTab]);

  const performSearch = async () => {
    const q = query.trim();
    if (!q) {
      setPets([]);
      setGroups([]);
      setUsers([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (activeTab === "pets") {
      const res = await searchService.searchPets(q);
      if (res.success) setPets(res.data ?? []);
      setSearched(true);
    } else if (activeTab === "groups") {
      const res = await searchService.searchGroups(q);
      if (res.success) setGroups(res.data ?? []);
      setSearched(true);
    } else {
      const res = await searchService.searchUsers(q);
      if (res.success) setUsers(res.data ?? []);
      setSearched(true);
    }
    setLoading(false);
  };

  const renderPet = (pet: PetSearchResult) => (
    <TouchableOpacity
      key={pet.id}
      className="flex-row items-center bg-white p-4 rounded-2xl border border-[#211f1e]/10 mb-3"
      onPress={() => router.push(`/perfil/${pet.user_id}`)}
      activeOpacity={0.8}
    >
      {pet.image_url ? (
        <Image
          source={{ uri: pet.image_url }}
          className="w-12 h-12 rounded-xl"
        />
      ) : (
        <View className="w-12 h-12 rounded-xl bg-[#faf5e0] items-center justify-center">
          <MaterialCommunityIcons
            name={pet.type === "gato" ? "cat" : "dog"}
            size={24}
            color="#6B7280"
          />
        </View>
      )}
      <View className="flex-1 ml-3">
        <Text className="text-[#211f1e] font-bold">{pet.name || "Mascota"}</Text>
        <Text className="text-gray-500 text-sm">
          {pet.type === "gato" ? "Gato" : "Perro"}
          {pet.color ? ` · ${pet.color}` : ""}
          {pet.size ? ` · ${pet.size}` : ""}
        </Text>
        <Text className="text-gray-500 text-xs">Dueño: {pet.owner_name}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderGroup = (group: GroupSearchResult) => (
    <TouchableOpacity
      key={group.id}
      className="flex-row items-center bg-white p-4 rounded-2xl border border-[#211f1e]/10 mb-3"
      onPress={() => router.push(`/grupos/${group.id}`)}
      activeOpacity={0.8}
    >
      <View className="w-12 h-12 rounded-xl bg-[#faf5e0] items-center justify-center">
        <Ionicons name="people-outline" size={24} color="#6B7280" />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-[#211f1e] font-bold">{group.name}</Text>
        <Text className="text-gray-500 text-sm" numberOfLines={1}>
          {group.description || "Sin descripción"}
        </Text>
        <Text className="text-gray-500 text-xs">
          {group.member_count} miembro{group.member_count === 1 ? "" : "s"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderUser = (user: UserSearchResult) => (
    <TouchableOpacity
      key={user.user_id}
      className="flex-row items-center bg-white p-4 rounded-2xl border border-[#211f1e]/10 mb-3"
      onPress={() => router.push(`/perfil/${user.user_id}`)}
      activeOpacity={0.8}
    >
      {user.profile_picture_url ? (
        <Image
          source={{ uri: user.profile_picture_url }}
          className="w-12 h-12 rounded-full"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-[#007275] items-center justify-center">
          <Text className="text-white font-bold text-lg">
            {(user.first_name || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View className="flex-1 ml-3">
        <Text className="text-[#211f1e] font-bold">
          {[user.first_name, user.last_name].filter(Boolean).join(" ") || "Usuario"}
        </Text>
        <Text className="text-gray-500 text-sm">{user.city || "Sin ubicación"}</Text>
      </View>
    </TouchableOpacity>
  );

  const isEmpty =
    !loading &&
    searched &&
    (activeTab === "pets"
      ? pets.length === 0
      : activeTab === "groups"
        ? groups.length === 0
        : users.length === 0);

  return (
    <View className="flex-1 bg-[#faf5e0] p-4">
      {/* Input de búsqueda */}
      <View className="flex-row items-center bg-white rounded-2xl border border-[#211f1e]/10 px-4">
        <Ionicons name="search" size={18} color="#6B7280" style={{ marginRight: 8 }} />
        <TextInput
          className="flex-1 py-3 text-[#211f1e]"
          placeholder="Buscar mascotas, grupos, usuarios..."
          placeholderTextColor="#9BA1A6"
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={performSearch}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View className="flex-row gap-2 mt-4 mb-4">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
                isActive ? "bg-[#007275]" : "bg-white"
              }`}
              activeOpacity={0.8}
            >
              <Ionicons name={tab.icon} size={16} color={isActive ? "#fff" : "#4B5563"} />
              <Text className={`font-semibold ${isActive ? "text-white" : "text-gray-600"}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Resultados */}
      {loading ? (
        <ListSkeleton count={4} />
      ) : isEmpty ? (
        <EmptyState
          icon="search"
          title="Sin resultados"
          subtitle={`No encontramos ${activeTab === "pets" ? "mascotas" : activeTab === "groups" ? "grupos" : "usuarios"} con "${query.trim()}"`}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
          {activeTab === "pets" &&
            pets.map((p) => renderPet(p))}
          {activeTab === "groups" &&
            groups.map((g) => renderGroup(g))}
          {activeTab === "users" &&
            users.map((u) => renderUser(u))}
        </ScrollView>
      )}
    </View>
  );
}
