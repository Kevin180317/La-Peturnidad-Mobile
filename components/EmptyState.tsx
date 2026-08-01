import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "paw",
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="bg-white p-10 rounded-2xl items-center border border-[#211f1e]/10">
      <View className="w-16 h-16 rounded-full bg-[#ff7e70]/10 items-center justify-center mb-3">
        <Ionicons name={icon} size={32} color="#ff7e70" />
      </View>
      <Text className="text-[#211f1e] font-semibold text-center">{title}</Text>
      {subtitle && (
        <Text className="text-gray-500 text-sm text-center mt-2">{subtitle}</Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          className="bg-[#ff7e70] py-3 px-6 rounded-xl mt-5"
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
