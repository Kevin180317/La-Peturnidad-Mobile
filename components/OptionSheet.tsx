import { Sheet } from "@/components/kit/Kit";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";

export interface Option {
  value: string;
  label: string;
  hint?: string;
}

// Lista en hoja inferior con fondo blanco y texto oscuro: el Picker nativo de Android se veía oscuro e ilegible
export function OptionSheet({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: Option[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
        {options.map((option) => {
          const active = option.value === selected;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              accessibilityRole="button"
              className={`flex-row items-center px-3 py-3.5 rounded-2xl mb-1 ${active ? "bg-[#007275]/10" : ""}`}
            >
              <Text className={`flex-1 text-[15px] ${active ? "font-bold text-[#007275]" : "text-[#211f1e]"}`}>{option.label}</Text>
              {!!option.hint && <Text className="text-[13px] text-gray-500 mr-2">{option.hint}</Text>}
              {active && <Ionicons name="checkmark-circle" size={20} color="#007275" />}
            </Pressable>
          );
        })}
        <View className="h-2" />
      </ScrollView>
    </Sheet>
  );
}
