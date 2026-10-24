import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

interface FABProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
  position?: "bottom-right" | "bottom-center";
}

export function FAB({
  icon,
  onPress,
  color = "#fff",
  backgroundColor = "#005e66",
  position = "bottom-right",
}: FABProps) {
  const positionClasses =
    position === "bottom-right"
      ? "bottom-24 right-5"
      : "bottom-24 self-center";

  return (
    <TouchableOpacity
      className={`absolute ${positionClasses} w-16 h-16 rounded-full items-center justify-center shadow-lg active:shadow-xl`}
      style={{ backgroundColor }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={24} color={color} />
    </TouchableOpacity>
  );
}
