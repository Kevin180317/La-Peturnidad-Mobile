import { Skeleton } from "@/components/Skeleton";
import { View } from "react-native";

// Imita el layout de Inicio (saludo, resumen, tarjeta principal y accesos) mientras carga el dashboard
export function DashboardSkeleton() {
  return (
    <View className="flex-1 bg-[#faf5e0] p-5 gap-4">
      <View className="flex-row items-center gap-4">
        <View className="flex-1 gap-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-6 w-2/3" />
        </View>
        <Skeleton className="w-[46px] h-[46px] rounded-full" />
      </View>
      <Skeleton className="h-28 w-full rounded-3xl" />
      <Skeleton className="h-24 w-full rounded-3xl" />
      <View className="flex-row gap-3">
        <Skeleton className="flex-1 h-24 rounded-3xl" />
      </View>
      <Skeleton className="h-20 w-full rounded-3xl" />
    </View>
  );
}
