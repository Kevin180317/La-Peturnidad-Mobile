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
          className="w-[85%] bg-white rounded-3xl p-6 items-center"
          activeOpacity={1}
          onPress={() => {}}
        >
          <View className="w-16 h-16 rounded-full bg-[#007275]/10 items-center justify-center mb-4">
            <Ionicons name={icon} size={32} color="#007275" />
          </View>

          <Text className="text-lg font-bold text-[#211f1e] mb-2 text-center">
            {title}
          </Text>
          <Text className="text-gray-500 text-sm text-center leading-5 mb-6">
            {message}
          </Text>

          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              className="flex-1 bg-gray-100 py-3 rounded-xl"
              onPress={onCancel}
              disabled={loading}
            >
              <Text className="text-gray-700 text-center font-semibold">
                {cancelLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-[#007275] py-3 rounded-xl flex-row items-center justify-center"
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white text-center font-semibold">
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
