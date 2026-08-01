import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

export type TabType = "home" | "profile" | "emergency" | "comunidad" | "feed";

const TABS: {
  key: TabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "feed", label: "Feed", icon: "newspaper-outline", iconActive: "newspaper" },
  { key: "home", label: "Inicio", icon: "home-outline", iconActive: "home" },
  { key: "comunidad", label: "Comunidad", icon: "chatbubbles-outline", iconActive: "chatbubbles" },
  { key: "emergency", label: "Emergencia", icon: "warning-outline", iconActive: "warning" },
  { key: "profile", label: "Perfil", icon: "person-outline", iconActive: "person" },
];

interface TabBarProps {
  activeTab: TabType;
  onSelect: (tab: TabType) => void;
}

export function TabBar({ activeTab, onSelect }: TabBarProps) {
  return (
    <View className="flex-row bg-white border-t border-[#211f1e]/20 py-2 shadow-lg">
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            className={`flex-1 py-3 items-center border-t-2 ${
              active ? "border-t-red-500" : "border-t-transparent"
            }`}
            onPress={() => onSelect(tab.key)}
          >
            <Ionicons
              name={active ? tab.iconActive : tab.icon}
              size={22}
              color={active ? "#ff7e70" : "#9CA3AF"}
            />
            <Text
              className={`text-xs mt-1 ${
                active ? "text-[#ff7e70] font-bold" : "text-gray-500 font-medium"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
