import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MoreOptionsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function MoreOptionsDrawer({ visible, onClose }: MoreOptionsDrawerProps) {
  const router = useRouter();

  const menuItems = [
    {
      icon: "chatbubbles-outline" as const,
      label: "Comunidad",
      description: "Anuncios categorizados",
      color: "#005e66",
      onPress: () => {
        router.push("/comunidad");
        onClose();
      },
    },
    {
      icon: "warning-outline" as const,
      label: "Emergencias",
      description: "Alertas de mascotas perdidas",
      color: "#ff7e70",
      onPress: () => {
        router.push("/dashboard?tab=home");
        onClose();
      },
    },
    {
      icon: "people-outline" as const,
      label: "Grupos",
      description: "Únete a grupos locales",
      color: "#211f1e",
      onPress: () => {
        router.push("/grupos");
        onClose();
      },
    },
    {
      icon: "paw-outline" as const,
      label: "Reuniones Exitosas",
      description: "Historias de éxito",
      color: "#005e66",
      onPress: () => {
        router.push("/historias");
        onClose();
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        activeOpacity={1}
        className="flex-1 bg-black/40"
        onPress={onClose}
      />

      {/* Drawer desde abajo */}
      <View className="bg-white rounded-t-3xl p-6 shadow-2xl">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-xl font-bold text-[#211f1e]">Más opciones</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#211f1e" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="max-h-80">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              className="flex-row items-center py-4 px-3 mb-2 rounded-xl active:bg-gray-100"
              onPress={item.onPress}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: item.color + "15" }}
              >
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>

              <View className="flex-1">
                <Text className="font-semibold text-[#211f1e] text-base">
                  {item.label}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  {item.description}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
