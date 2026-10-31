import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Animated, Dimensions, Text, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";

export type TabType = "home" | "feed" | "emergency" | "messages" | "profile";

const TABS: {
  key: TabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "home", label: "Inicio", icon: "home-outline", iconActive: "home" },
  { key: "feed", label: "Feed", icon: "newspaper-outline", iconActive: "newspaper" },
  { key: "emergency", label: "Emergencia", icon: "warning-outline", iconActive: "warning" },
  { key: "messages", label: "Mensajes", icon: "chatbox-outline", iconActive: "chatbox" },
  { key: "profile", label: "Perfil", icon: "person-outline", iconActive: "person" },
];

interface TabBarProps {
  activeTab: TabType;
  onSelect: (tab: TabType) => void;
  unreadCount?: number;
}

export function TabBar({ activeTab, onSelect, unreadCount = 0 }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const tabWidth = screenWidth / TABS.length;

  // Animación para el indicador
  const [indicatorPosition] = useState(() => new Animated.Value(0));

  const PILL_WIDTH = 56;

  useEffect(() => {
    const activeIndex = TABS.findIndex(t => t.key === activeTab);
    Animated.spring(indicatorPosition, {
      toValue: activeIndex * tabWidth + (tabWidth - PILL_WIDTH) / 2,
      useNativeDriver: true,
      speed: 14,
      bounciness: 6,
    }).start();
  }, [activeTab, tabWidth, indicatorPosition]);

  const activeColor = (key: TabType) => (key === "emergency" ? "#ff7e70" : "#007275");
  const activeIsEmergency = activeTab === "emergency";

  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      className="bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(33,31,30,0.08)]"
    >
      {/* Pastilla que se desliza detrás del ícono activo */}
      <Animated.View
        style={{ transform: [{ translateX: indicatorPosition }], width: PILL_WIDTH }}
        className={`absolute top-2 h-8 rounded-full ${activeIsEmergency ? "bg-[#ff7e70]/15" : "bg-[#007275]/10"}`}
      />

      <View className="flex-row items-center pt-2 h-16">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === "messages" && unreadCount > 0;
          const color = isActive ? activeColor(tab.key) : tab.key === "emergency" ? "#ff7e70" : "#9BA1A6";

          return (
            <TouchableOpacity
              key={tab.key}
              className="flex-1 items-center justify-start h-full"
              onPress={() => onSelect(tab.key)}
              activeOpacity={0.6}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <View className="h-8 items-center justify-center">
                <Ionicons name={isActive ? tab.iconActive : tab.icon} size={22} color={color} />
                {showBadge && (
                  <View className="absolute -top-0.5 -right-3 bg-[#ff7e70] rounded-full min-w-5 h-5 items-center justify-center px-1 border-2 border-white">
                    <Text className="text-white text-[10px] font-bold leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                className={`text-[11px] mt-1 ${isActive ? "font-bold" : "font-medium"}`}
                style={{ color: isActive ? activeColor(tab.key) : "#6B7280" }}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
