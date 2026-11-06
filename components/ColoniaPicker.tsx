import { OptionSheet } from "@/components/OptionSheet";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import colonias from "../assets/colonias.json";

// Las alertas a vecinos comparan la colonia con igualdad exacta: debe salir de este catálogo, no de texto libre
export function coloniasForPostalCode(postalCode: string): string[] {
  const names = colonias
    .filter((item) => String(item["Código Postal"]) === postalCode)
    .map((item) => item["Asentamiento"]);
  return [...new Set(names)];
}

export function ColoniaPicker({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (colonia: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-[13px] font-semibold text-[#211f1e] mb-1.5 ml-1">Colonia *</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Colonia"
        className={`flex-row items-center h-[52px] px-4 rounded-2xl border-[1.5px] bg-white ${value ? "border-[#007275]" : "border-gray-200"}`}
      >
        <Ionicons name="home-outline" size={18} color={value ? "#007275" : "#9BA1A6"} style={{ marginRight: 10 }} />
        <Text className={`flex-1 text-[15px] ${value ? "text-[#211f1e]" : "text-[#9BA1A6]"}`} numberOfLines={1}>
          {value || "Selecciona una colonia"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#9BA1A6" />
      </Pressable>
      <OptionSheet
        visible={open}
        title="Selecciona tu colonia"
        options={options.map((name) => ({ value: name, label: name }))}
        selected={value}
        onSelect={(name) => {
          onChange(name);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}
