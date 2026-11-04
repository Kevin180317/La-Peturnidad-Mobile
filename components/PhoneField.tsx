import { OptionSheet } from "@/components/OptionSheet";
import { COUNTRIES, sanitizePhoneInput, type CountryKey } from "@/utils/phone";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export function PhoneField({
  country,
  onCountryChange,
  value,
  onChangeText,
  error,
  label = "Teléfono *",
}: {
  country: CountryKey;
  onCountryChange: (country: CountryKey) => void;
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = COUNTRIES.find((c) => c.key === country) ?? COUNTRIES[0];
  const other = country === "OTHER";
  return (
    <View className="mb-4">
      <Text className="text-[13px] font-semibold text-[#211f1e] mb-1.5 ml-1">{label}</Text>
      <View className="flex-row">
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="País del teléfono"
          className="flex-row items-center h-[52px] px-3 mr-2 rounded-2xl border-[1.5px] border-gray-200 bg-white"
        >
          <Ionicons name="globe-outline" size={18} color="#007275" style={{ marginRight: 6 }} />
          <Text className="text-[15px] text-[#211f1e] font-semibold">{other ? "Otro" : current.dial}</Text>
          <Ionicons name="chevron-down" size={16} color="#9BA1A6" style={{ marginLeft: 4 }} />
        </Pressable>
        <View
          className={`flex-1 flex-row items-center h-[52px] px-4 rounded-2xl border-[1.5px] bg-white ${error ? "border-red-400" : "border-gray-200"}`}
        >
          <Ionicons name="call-outline" size={18} color="#9BA1A6" style={{ marginRight: 10 }} />
          <TextInput
            className="flex-1 text-[15px] text-[#211f1e]"
            placeholder={other ? "+34 600 123 456" : "10 dígitos"}
            placeholderTextColor="#9BA1A6"
            accessibilityLabel="Teléfono"
            value={value}
            onChangeText={(text) => onChangeText(sanitizePhoneInput(country, text))}
            keyboardType="phone-pad"
            maxLength={other ? 20 : 24}
          />
        </View>
      </View>
      {!!error && <Text className="text-red-600 text-xs mt-1.5 ml-1">{error}</Text>}
      <OptionSheet
        visible={open}
        title="País del teléfono"
        options={COUNTRIES.map((c) => ({ value: c.key, label: c.label, hint: c.key === "OTHER" ? undefined : c.dial }))}
        selected={country}
        onSelect={(key) => {
          onCountryChange(key as CountryKey);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}
