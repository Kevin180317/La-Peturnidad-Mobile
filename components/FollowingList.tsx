import { EmptyCard, SectionTitle } from "@/components/kit/Kit";
import { UserRows } from "@/components/UserRows";
import { followsService } from "@/services/follows.service";
import { type UserSearchResult } from "@/services/search.service";
import { getCurrentUser } from "@/utils/session";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator } from "react-native";

/** "Personas que sigues": se recarga al enfocar la pantalla (seguir/dejar de seguir se refleja al volver). */
export function FollowingList({
  onSelect,
  emptyText,
  showTitle = true,
}: {
  showTitle?: boolean;
  onSelect: (user: UserSearchResult) => void;
  /** Si se pasa, se muestra como tarjeta vacía; si no, la sección se oculta cuando no hay seguidos */
  emptyText?: string;
}) {
  const [users, setUsers] = useState<UserSearchResult[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let stale = false;
      (async () => {
        const { data } = await getCurrentUser();
        const me = data?.user?.id;
        const r = me ? await followsService.getFollowingProfiles(me) : null;
        if (!stale) setUsers(r?.data ?? []);
      })();
      return () => {
        stale = true;
      };
    }, []),
  );

  if (users === null) return <ActivityIndicator color="#007275" className="mt-6" />;
  if (!users.length) return emptyText ? <EmptyCard icon="people-outline" text={emptyText} /> : null;
  return (
    <>
      {showTitle && <SectionTitle icon="people" title="Personas que sigues" />}
      <UserRows users={users} onPress={onSelect} />
    </>
  );
}
