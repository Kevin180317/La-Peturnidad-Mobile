import { Avatar, CARD, CARD_SHADOW, Chip, EmptyCard, PetThumb, Segmented } from "@/components/kit/Kit";
import { ListSkeleton } from "@/components/Skeleton";
import { reportsService } from "@/services/reports.service";
import { Ionicons } from "@expo/vector-icons";
import {
  searchService,
  type GroupSearchResult,
  type PetSearchResult,
  type UserSearchResult,
} from "@/services/search.service";
import { getCurrentUser } from "@/utils/session";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

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
  const [searchFocused, setSearchFocused] = useState(false);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const firstRun = useRef(true);
  // Id incremental por búsqueda: las respuestas de búsquedas viejas se ignoran
  const requestId = useRef(0);

  useEffect(() => {
    getCurrentUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/");
        return;
      }
      const blocked = await reportsService.getBlockedUsers(data.user.id);
      setBlockedIds(blocked.data ?? []);
    });
  }, [router]);

  const performSearch = async () => {
    const reqId = ++requestId.current;
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
    const tab = activeTab;
    const res =
      tab === "pets"
        ? await searchService.searchPets(q)
        : tab === "groups"
          ? await searchService.searchGroups(q)
          : await searchService.searchUsers(q);

    if (reqId !== requestId.current) return; // respuesta obsoleta

    if (res.success) {
      if (tab === "pets") setPets((res.data ?? []) as PetSearchResult[]);
      else if (tab === "groups") setGroups((res.data ?? []) as GroupSearchResult[]);
      else setUsers((res.data ?? []) as UserSearchResult[]);
    } else {
      Toast.show({ type: "error", text1: "Error al buscar", text2: res.error, position: "top" });
    }
    setSearched(true);
    setLoading(false);
  };

  const blocked = new Set(blockedIds);
  const visiblePets = pets.filter((p) => !blocked.has(p.user_id));
  const visibleGroups = groups.filter((g) => !g.created_by || !blocked.has(g.created_by));
  const visibleUsers = users.filter((u) => !blocked.has(u.user_id));

  const ROW = `${CARD} flex-row items-center p-3 mb-3`;

  const renderPet = (pet: PetSearchResult) => (
    <TouchableOpacity key={pet.id} className={ROW} onPress={() => router.push(`/perfil/${pet.user_id}`)} activeOpacity={0.8}>
      <PetThumb uri={pet.image_url} type={pet.type} className="w-14 h-14 rounded-2xl" iconSize={26} />
      <View className="flex-1 ml-3">
        <Text className="text-[#211f1e] font-bold text-[15px]">{pet.name || "Mascota"}</Text>
        <View className="flex-row flex-wrap gap-1.5 mt-1">
          <Chip text={pet.type === "gato" ? "Gato" : "Perro"} tone="teal" />
          {!!pet.color && <Chip text={pet.color} />}
          {!!pet.size && <Chip text={pet.size} />}
        </View>
        <Text className="text-gray-500 text-xs mt-1">Dueño: {pet.owner_name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
    </TouchableOpacity>
  );

  const renderGroup = (group: GroupSearchResult) => (
    <TouchableOpacity key={group.id} className={ROW} onPress={() => router.push(`/grupos/${group.id}`)} activeOpacity={0.8}>
      <View className="w-14 h-14 rounded-2xl bg-[#007275]/10 items-center justify-center">
        <Ionicons name="people" size={24} color="#007275" />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-[#211f1e] font-bold text-[15px]">{group.name}</Text>
        <Text className="text-gray-500 text-sm" numberOfLines={1}>
          {group.description || "Sin descripción"}
        </Text>
        <Text className="text-gray-500 text-xs mt-0.5">
          {group.member_count} miembro{group.member_count === 1 ? "" : "s"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
    </TouchableOpacity>
  );

  const renderUser = (user: UserSearchResult) => (
    <TouchableOpacity key={user.user_id} className={ROW} onPress={() => router.push(`/perfil/${user.user_id}`)} activeOpacity={0.8}>
      <Avatar uri={user.profile_picture_url} name={user.first_name} size={52} ring={false} />
      <View className="flex-1 ml-3">
        <Text className="text-[#211f1e] font-bold text-[15px]">
          {[user.first_name, user.last_name].filter(Boolean).join(" ") || "Usuario"}
        </Text>
        <View className="flex-row items-center gap-1 mt-0.5">
          <Ionicons name="location-outline" size={12} color="#6B7280" />
          <Text className="text-gray-500 text-xs">{user.city || "Sin ubicación"}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
    </TouchableOpacity>
  );

  const isEmpty =
    !loading &&
    searched &&
    (activeTab === "pets"
      ? visiblePets.length === 0
      : activeTab === "groups"
        ? visibleGroups.length === 0
        : visibleUsers.length === 0);

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

  return (
    <View className="flex-1 bg-[#faf5e0] px-5 pt-4">
      {/* Input de búsqueda */}
      <View
        className={`flex-row items-center bg-white rounded-full h-[52px] px-4 border-[1.5px] ${searchFocused ? "border-[#007275]" : "border-transparent"} ${CARD_SHADOW}`}
      >
        <Ionicons name="search" size={18} color={searchFocused ? "#007275" : "#9BA1A6"} style={{ marginRight: 10 }} />
        <TextInput
          className="flex-1 text-[15px] text-[#211f1e]"
          placeholder="Buscar mascotas, grupos, usuarios..."
          placeholderTextColor="#9BA1A6"
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={performSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.7} accessibilityLabel="Borrar búsqueda">
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <Segmented options={TABS} value={activeTab} onChange={setActiveTab} className="mt-4 mb-4" />

      {/* Resultados */}
      {loading ? (
        <ListSkeleton count={4} />
      ) : isEmpty ? (
        <EmptyCard
          icon="search"
          title="Sin resultados"
          text={`No encontramos ${activeTab === "pets" ? "mascotas" : activeTab === "groups" ? "grupos" : "usuarios"} con "${query.trim()}"`}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10" keyboardShouldPersistTaps="handled">
          {activeTab === "pets" && visiblePets.map((p) => renderPet(p))}
          {activeTab === "groups" && visibleGroups.map((g) => renderGroup(g))}
          {activeTab === "users" && visibleUsers.map((u) => renderUser(u))}
        </ScrollView>
      )}
    </View>
  );
}
