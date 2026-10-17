import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Animated, Dimensions, Text, TouchableOpacity, View } from "react-native";
import { useEffect, useRef } from "react";

export type TabType = "home" | "feed" | "messages" | "profile";

const TABS: {
  key: TabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "home", label: "Inicio", icon: "home-outline", iconActive: "home" },
  { key: "feed", label: "Feed", icon: "newspaper-outline", iconActive: "newspaper" },
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
  const indicatorPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const activeIndex = TABS.findIndex(t => t.key === activeTab);
    Animated.spring(indicatorPosition, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      speed: 10,
      bounciness: 5,
    }).start();
  }, [activeTab, tabWidth]);

  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      className="bg-white border-t border-[#211f1e]/8"
    >
      {/* Indicador de tab activo - MD3 Style */}
      <Animated.View
        style={{
          transform: [{ translateX: indicatorPosition }],
          width: tabWidth,
          height: 3,
          backgroundColor: "#005e66",
        }}
        className="absolute top-0"
      />

      {/* Container principal - altura estándar MD3: 56dp ≈ 56px */}
      <View className="flex-row items-center h-14">
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === "messages" && unreadCount > 0;

          return (
            <TouchableOpacity
              key={tab.key}
              className="flex-1 items-center justify-center h-full"
              onPress={() => onSelect(tab.key)}
              activeOpacity={0.6}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              {/* Icon con badge */}
              <View className="relative mb-1">
                <Ionicons
                  name={isActive ? tab.iconActive : tab.icon}
                  size={24}
                  color={isActive ? "#005e66" : "#9CA3AF"}
                  style={{ opacity: isActive ? 1 : 0.7 }}
                />

                {/* Badge para notificaciones - Material Design badge */}
                {showBadge && (
                  <View className="absolute -top-1 -right-1.5 bg-[#ff7e70] rounded-full min-w-5 h-5 items-center justify-center px-1 border-2 border-white">
                    <Text className="text-white text-xs font-bold leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </View>

              {/* Label - solo visible cuando activo (Material Design 3 pattern) */}
              {isActive && (
                <Text
                  className="text-[#005e66] text-xs font-semibold leading-3"
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
