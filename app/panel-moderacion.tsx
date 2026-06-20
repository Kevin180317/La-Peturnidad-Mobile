import { reportsService } from "@/services/reports.service";
import { supabase } from "@/utils/supabase";
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
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) { router.replace("/"); return; }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.user.id)
      .single();

    if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) {
      Toast.show({ type: "error", text1: "Acceso denegado", text2: "No tienes permisos de moderador", position: "top" });
      router.back();
      return;
    }

    setUserId(user.user.id);
    setUserRole(profile.role);

    const result = await reportsService.getAll();
    if (result.success) {
      const enriched = await Promise.all(
        result.data.map(async (r) => {
          const { data: target } = await supabase
            .from("user_profiles")
            .select("first_name, last_name")
            .eq("user_id", r.target_user_id)
            .single();

          const { data: reporter } = await supabase
            .from("user_profiles")
            .select("first_name, last_name")
            .eq("user_id", r.reporter_id)
            .single();

          return {
            ...r,
            target_name: target ? `${target.first_name || ""} ${target.last_name || ""}`.trim() : "Usuario",
            reporter_name: reporter ? `${reporter.first_name || ""} ${reporter.last_name || ""}`.trim() : "Usuario",
          };
        }),
      );
      setReports(enriched);
    }
    setLoading(false);
  };

  const handleReview = async (reportId: string, status: string) => {
    if (!userId) return;
    const r = await reportsService.updateStatus(reportId, status, userId);
    if (r.success) {
      Toast.show({ type: "success", text1: `Reporte ${status === "dismissed" ? "descartado" : "revisado"}`, position: "top" });
      await init();
    } else {
      Toast.show({ type: "error", text1: "Error", text2: r.error, position: "top" });
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "reviewed": return "bg-green-100 text-green-700";
      case "dismissed": return "bg-gray-100 text-gray-500";
      default: return "bg-gray-100 text-gray-500";
    }
  };
  const statusLabel = (s: string) => {
    switch (s) {
      case "pending": return "Pendiente";
      case "reviewed": return "Revisado";
      case "dismissed": return "Descartado";
      default: return s;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#ff7e70" />
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={init} />}
      contentContainerClassName="p-5 bg-[#faf5e0] flex-1"
    >
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-2xl font-bold text-[#211f1e]">Panel de moderación</Text>
        <Text className="text-gray-500 text-sm capitalize">{userRole}</Text>
      </View>

      {reports.length === 0 ? (
        <View className="bg-white p-10 rounded-xl items-center">
          <Text className="text-4xl mb-3">🛡️</Text>
          <Text className="text-gray-500 text-center">No hay reportes</Text>
        </View>
      ) : (
        reports.map((report) => (
          <View key={report.id} className="bg-white p-4 rounded-xl mb-3 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="font-bold text-[#211f1e]">Reporte a {report.target_name}</Text>
              <View className={`px-2 py-1 rounded-full ${statusColor(report.status)}`}>
                <Text className="text-xs font-medium">{statusLabel(report.status)}</Text>
              </View>
            </View>
            <Text className="text-gray-500 text-sm mb-1">
              Reportado por: {report.reporter_name}
            </Text>
            <Text className="text-gray-500 text-sm mb-1">Razón: {report.reason}</Text>
            <Text className="text-gray-400 text-xs mb-3">
              {new Date(report.created_at).toLocaleDateString("es-MX", {
                day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
              })}
            </Text>

            {report.status === "pending" && (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-green-500 py-2 rounded-lg"
                  onPress={() => handleReview(report.id, "reviewed")}
                >
                  <Text className="text-white text-center text-sm font-semibold">✅ Revisado</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-gray-500 py-2 rounded-lg"
                  onPress={() => handleReview(report.id, "dismissed")}
                >
                  <Text className="text-white text-center text-sm font-semibold">Descartar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}
