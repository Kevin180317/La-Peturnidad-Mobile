import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** acción destructiva (eliminar): ícono y botón en rojo */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  icon = "log-out-outline",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        if (!loading) onCancel();
      }}
    >
      <TouchableOpacity
        className="flex-1 justify-center items-center bg-black/50"
        activeOpacity={1}
        onPress={() => {
          if (!loading) onCancel();
        }}
      >
        <TouchableOpacity
          className="w-[85%] bg-white rounded-3xl p-6 items-center shadow-[0_12px_32px_rgba(33,31,30,0.18)]"
          activeOpacity={1}
          onPress={() => {}}
        >
          <View className={`w-16 h-16 rounded-3xl items-center justify-center mb-4 ${destructive ? "bg-red-50" : "bg-[#007275]/10"}`}>
            <Ionicons name={icon} size={32} color={destructive ? "#dc2626" : "#007275"} />
          </View>

          <Text className="text-lg font-bold text-[#211f1e] mb-2 text-center">
            {title}
          </Text>
          <Text className="text-gray-500 text-sm text-center leading-5 mb-6">
            {message}
          </Text>

          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              className="flex-1 bg-gray-100 h-12 rounded-full items-center justify-center"
              onPress={onCancel}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text className="text-gray-700 text-center font-bold">
                {cancelLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 h-12 rounded-full flex-row items-center justify-center ${destructive ? "bg-[#dc2626] shadow-[0_6px_16px_rgba(220,38,38,0.3)]" : "bg-[#007275] shadow-[0_6px_16px_rgba(0,114,117,0.3)]"}`}
              onPress={onConfirm}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white text-center font-bold">
                  {confirmLabel}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
