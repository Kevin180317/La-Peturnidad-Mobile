import { Avatar, CARD, EmptyCard } from "@/components/kit/Kit";
import { searchService, type UserSearchResult } from "@/services/search.service";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

/** Resultados de buscar usuarios por nombre (debounce 300 ms); tocar abre su perfil. */
export function UserSearchResults({ query }: { query: string }) {
  const router = useRouter();
  const [done, setDone] = useState<{ q: string; users: UserSearchResult[] } | null>(null);

  useEffect(() => {
    let stale = false;
    const t = setTimeout(async () => {
      const r = await searchService.searchUsers(query);
      if (!stale) setDone({ q: query, users: r.data ?? [] });
    }, 300);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [query]);

  if (done?.q !== query) return <ActivityIndicator color="#007275" className="mt-6" />;
  if (!done.users.length) return <EmptyCard icon="search-outline" text="Sin usuarios con ese nombre" />;
  return <UserRows users={done.users} onPress={(u) => router.push(`/perfil/${u.user_id}`)} />;
}

/** Filas de usuarios (buscador del feed y selector de chat nuevo). */
export function UserRows({
  users,
  onPress,
  card = true,
}: {
  users: UserSearchResult[];
  onPress: (user: UserSearchResult) => void;
  card?: boolean;
}) {
  return (
    <View className={card ? `${CARD} overflow-hidden` : ""}>
      {users.map((u, i) => (
        <TouchableOpacity
          key={u.user_id}
          className={`flex-row items-center px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
          activeOpacity={0.7}
          onPress={() => onPress(u)}
          accessibilityRole="button"
          accessibilityLabel={`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()}
        >
          <Avatar uri={u.profile_picture_url} name={u.first_name} size={44} ring={false} />
          <View className="flex-1 ml-3">
            <Text className="font-bold text-[#211f1e] text-[15px]" numberOfLines={1}>
              {u.first_name} {u.last_name}
            </Text>
            {!!u.city && <Text className="text-gray-500 text-xs mt-0.5">{u.city}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
        </TouchableOpacity>
      ))}
    </View>
  );
}
