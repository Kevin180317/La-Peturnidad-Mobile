import { Skeleton } from "@/components/Skeleton";
import { View } from "react-native";

export function DashboardSkeleton() {
  return (
    <View className="flex-1 bg-[#faf5e0] p-5 gap-4">
      <View className="flex-row items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </View>
      </View>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-5 w-1/2 mt-2" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </View>
  );
}
