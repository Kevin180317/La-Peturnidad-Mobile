import { Text, TouchableOpacity, View } from "react-native";

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "🐾",
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="bg-white p-10 rounded-2xl items-center border border-[#211f1e]/10">
      <Text className="text-4xl mb-3">{icon}</Text>
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
