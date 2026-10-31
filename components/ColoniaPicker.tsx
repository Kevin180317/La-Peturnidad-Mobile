import { Picker } from "@react-native-picker/picker";
import { Text, View } from "react-native";
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
  return (
    <View className="mb-4">
      <Text className="text-[13px] font-semibold text-[#211f1e] mb-1.5 ml-1">Colonia *</Text>
      <View className={`border-[1.5px] rounded-2xl overflow-hidden bg-white ${value ? "border-[#007275]" : "border-gray-200"}`}>
        <Picker
          selectedValue={value}
          onValueChange={(itemValue) => onChange(itemValue)}
          style={{ height: 52, color: "#211f1e", backgroundColor: "#ffffff" }}
        >
          <Picker.Item label="Selecciona una colonia *" value="" color="#211f1e" />
          {options.map((name) => (
            <Picker.Item key={name} label={name} value={name} color="#211f1e" />
          ))}
        </Picker>
      </View>
    </View>
  );
}
