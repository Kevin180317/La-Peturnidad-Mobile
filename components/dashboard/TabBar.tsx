import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

export type TabType = "home" | "profile" | "emergency";

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { key: "home" as TabType, label: "Inicio", icon: "home" as const },
  { key: "profile" as TabType, label: "Perfil", icon: "person" as const },
  { key: "emergency" as TabType, label: "Urgencia", icon: "alert-circle" as const },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <View className="flex-row bg-white border-t border-[#ff7e70]/20 py-3">
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          className="flex-1 items-center"
          onPress={() => onTabChange(tab.key)}
        >
          <Ionicons
            name={tab.icon}
            size={24}
            color={activeTab === tab.key ? "#ff7e70" : "#ccc"}
          />
          <Text
            className={`text-xs mt-1 font-medium ${activeTab === tab.key ? "text-[#ff7e70] font-bold" : "text-gray-400"}`}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
