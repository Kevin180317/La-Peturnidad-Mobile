import { CARD, Chip, EmptyCard, ScreenTitle, type ChipTone } from "@/components/kit/Kit";
import { formatTimeAgo } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { reportsService } from "@/services/reports.service";
import { supabase } from "@/utils/supabase";
import { getCurrentUser } from "@/utils/session";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function PanelModeracionScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fullName = (p?: { first_name: string | null; last_name: string | null }) =>
    p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Usuario" : "Usuario";

  const loadReports = async () => {
    const result = await reportsService.getAll();
    if (!result.success) {
      Toast.show({ type: "error", text1: "Error", text2: result.error, position: "top" });
      return;
    }
    const list = result.data ?? [];
    const ids = [...new Set(list.flatMap((r) => [r.target_user_id, r.reporter_id]).filter(Boolean))];
    const names: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", ids);
      profiles?.forEach((p) => {
        names[p.user_id] = fullName(p);
      });
    }
    setReports(
      list.map((r) => ({
        ...r,
        target_name: names[r.target_user_id] || "Usuario",
        reporter_name: names[r.reporter_id] || "Usuario",
      })),
    );
  };

  const init = async () => {
    const { data: user } = await getCurrentUser();
    if (!user?.user) { router.replace("/"); return; }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.user.id)
      .maybeSingle();

    if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) {
      Toast.show({ type: "error", text1: "Acceso denegado", text2: "No tienes permisos de moderador", position: "top" });
      router.replace("/dashboard");
      return;
    }

    setUserId(user.user.id);
    setUserRole(profile.role);
    await loadReports();
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const handleReview = async (reportId: string, status: string) => {
    if (!userId) return;
    const r = await reportsService.updateStatus(reportId, status, userId);
    if (r.success) {
      Toast.show({ type: "success", text1: `Reporte ${status === "dismissed" ? "descartado" : "revisado"}`, position: "top" });
      await loadReports();
    } else {
      Toast.show({ type: "error", text1: "Error", text2: r.error, position: "top" });
    }
  };

  const statusTone = (s: string): ChipTone => (s === "pending" ? "coral" : s === "reviewed" ? "teal" : "neutral");
  const statusLabel = (s: string) => {
    switch (s) {
      case "pending": return "Pendiente";
      case "reviewed": return "Revisado";
      case "dismissed": return "Descartado";
      default: return s;
    }
  };

  // init corre una sola vez al montar (deps estables intencionales)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar: el setState ocurre tras la consulta async
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      contentContainerClassName="p-5 pb-10 grow"
    >
      <ScreenTitle
        title="Panel de moderación"
        subtitle={`${reports.filter((r) => r.status === "pending").length} reportes pendientes`}
        right={userRole ? <Chip icon="shield-checkmark" text={userRole} tone="dark" /> : null}
      />

      {reports.length === 0 ? (
        <EmptyCard icon="shield-checkmark-outline" title="No hay reportes" text="Los reportes de la comunidad aparecerán aquí" />
      ) : (
        reports.map((report) => (
          <View key={report.id} className={`${CARD} p-4 mb-3`}>
            <View className="flex-row items-start mb-3">
              <View className="w-10 h-10 rounded-2xl bg-[#ff7e70]/10 items-center justify-center mr-3">
                <Ionicons name="flag" size={18} color="#c2402f" />
              </View>
              <View className="flex-1 mr-2">
                <Text className="font-bold text-[#211f1e] text-[15px]">Reporte a {report.target_name}</Text>
                <Text className="text-gray-500 text-xs mt-0.5">
                  Por {report.reporter_name} · {formatTimeAgo(report.created_at)}
                </Text>
              </View>
              <Chip text={statusLabel(report.status)} tone={statusTone(report.status)} />
            </View>
            <View className="bg-[#faf5e0] rounded-2xl p-3 mb-3">
              <Text className="text-xs text-gray-500">Razón</Text>
              <Text className="text-[#211f1e] text-sm font-semibold mt-0.5">{report.reason}</Text>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center gap-1.5 bg-[#007275]/10 h-10 rounded-full"
                onPress={() => router.push(`/perfil/${report.target_user_id}`)}
              >
                <Ionicons name="person-circle-outline" size={16} color="#007275" />
                <Text className="text-[#007275] text-sm font-semibold">Ver perfil</Text>
              </TouchableOpacity>
              {report.status === "pending" && (
                <>
                  <TouchableOpacity
                    className="flex-1 bg-[#007275] h-10 rounded-full flex-row items-center justify-center gap-1.5"
                    onPress={() => handleReview(report.id, "reviewed")}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                    <Text className="text-white text-sm font-semibold">Revisado</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-gray-100 h-10 rounded-full items-center justify-center"
                    onPress={() => handleReview(report.id, "dismissed")}
                  >
                    <Text className="text-gray-700 text-sm font-semibold">Descartar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
