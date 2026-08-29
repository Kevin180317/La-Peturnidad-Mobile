import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

type PasswordInputProps = React.ComponentProps<typeof TextInput>;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View
      className={`flex-row items-center border-2 rounded-xl bg-white ${
        focused
          ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]"
          : "border-[#211f1e]/20"
      }`}
    >
      <TextInput
        className="flex-1 p-4 text-base text-[#211f1e]"
        placeholderTextColor="#9BA1A6"
        secureTextEntry={!visible}
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
        className="px-4 py-4"
        hitSlop={8}
      >
        <Ionicons name={visible ? "eye-off" : "eye"} size={22} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
}
