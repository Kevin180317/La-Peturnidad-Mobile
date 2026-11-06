import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

type PasswordInputProps = React.ComponentProps<typeof TextInput>;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View
      className={`flex-row items-center h-[52px] border-[1.5px] rounded-2xl bg-white pl-4 ${
        focused ? "border-[#007275]" : "border-gray-200"
      }`}
    >
      <Ionicons name="lock-closed-outline" size={18} color={focused ? "#007275" : "#9BA1A6"} style={{ marginRight: 10 }} />
      <TextInput
        className="flex-1 text-[15px] text-[#211f1e]"
        placeholderTextColor="#9BA1A6"
        secureTextEntry={!visible}
        accessibilityLabel="Contraseña"
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
      <TouchableOpacity
        onPress={() => setVisible(!visible)}
        className="px-4 h-full justify-center"
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        <Ionicons name={visible ? "eye-off" : "eye"} size={20} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
}
