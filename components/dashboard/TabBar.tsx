import { Text, TouchableOpacity, View } from "react-native";

export type TabType = "home" | "profile" | "emergency" | "comunidad" | "feed";

const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: "feed", label: "Feed", icon: "📱" },
  { key: "home", label: "Inicio", icon: "🏠" },
  { key: "comunidad", label: "Comunidad", icon: "💬" },
  { key: "emergency", label: "Emergencia", icon: "🚨" },
  { key: "profile", label: "Perfil", icon: "👤" },
];

interface TabBarProps {
  activeTab: TabType;
  onSelect: (tab: TabType) => void;
}

export function TabBar({ activeTab, onSelect }: TabBarProps) {
  return (
    <View className="flex-row bg-white border-t border-[#211f1e]/20 py-2 shadow-lg">
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          className={`flex-1 py-3 items-center border-t-2 ${
            activeTab === tab.key ? "border-t-red-500" : "border-t-transparent"
          }`}
          onPress={() => onSelect(tab.key)}
        >
          <Text className="text-lg">{tab.icon}</Text>
          <Text
            className={`text-xs mt-1 ${
              activeTab === tab.key
                ? "text-[#ff7e70] font-bold"
                : "text-gray-500 font-medium"
            }`}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
