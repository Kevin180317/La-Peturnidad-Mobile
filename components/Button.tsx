import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useState } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewProps,
} from "react-native";

interface ButtonProps extends Omit<ViewProps, "onBlur" | "onFocus"> {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  style,
  ...props
}: ButtonProps) {
  const baseStyles = [
    "items-center justify-center rounded-xl font-bold",
    fullWidth && "w-full",
  ];

  const variantStyles = {
    primary: "bg-[#007275] active:opacity-80",
    secondary: "bg-[#211f1e] active:opacity-80",
    outline: "border-2 border-[#007275] bg-transparent active:bg-[#007275]/10",
    ghost: "bg-transparent active:bg-[#211f1e]/10",
  };

  const sizeStyles = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-6 text-base",
    lg: "py-4 px-8 text-lg",
  };

  const textColors = {
    primary: "text-white",
    secondary: "text-white",
    outline: "text-[#007275]",
    ghost: "text-[#211f1e]",
  };

  return (
    <TouchableOpacity
      className={`${baseStyles.join(" ")} ${variantStyles[variant]} ${sizeStyles[size]} ${
        disabled || loading ? "opacity-50" : ""
      }`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "secondary" ? "#fff" : "#211f1e"}
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon && <View>{icon}</View>}
          <Text
            className={`font-bold ${sizeStyles[size]} ${textColors[variant]}`}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface CardProps extends ViewProps {
  children: ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  variant = "default",
  padding = "md",
  style,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-white rounded-2xl",
    elevated: "bg-white rounded-2xl shadow-[0_1px_2px_rgba(33,31,30,0.08)]",
    outlined: "bg-white rounded-2xl border border-[#211f1e]/20",
  };

  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <View
      className={`${variantStyles[variant]} ${paddingStyles[padding]}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

interface InputProps extends ViewProps {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({
  label,
  error,
  icon,
  style,
  ...props
}: InputProps & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-[#211f1e] font-semibold mb-2">{label}</Text>
      )}
      <View
        className={`flex-row items-center border-2 rounded-lg bg-white ${
          error
            ? "border-[#d93a3a]"
            : focused
              ? "border-[#007275] shadow-[0_0_0_3px_rgba(0,114,117,0.14)]"
              : "border-[#211f1e]/20"
        }`}
      >
        {icon && <View className="pl-4">{icon}</View>}
        <TextInput
          className={`flex-1 p-4 text-base text-[#211f1e] ${
            icon ? "" : "pl-4"
          } pr-4`}
          placeholderTextColor="#9BA1A6"
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
      </View>
      {error && <Text className="text-[#d93a3a] text-sm mt-1">{error}</Text>}
    </View>
  );
}

interface BadgeProps extends ViewProps {
  label: string;
  variant?: "primary" | "success" | "warning" | "error" | "info";
}

export function Badge({ label, variant = "primary", style, ...props }: BadgeProps) {
  const variantStyles = {
    primary: "bg-[#007275]/10 text-[#007275]",
    success: "bg-[#007275]/10 text-[#007275]",
    warning: "bg-[#e8a93b]/15 text-[#8a5a15]",
    error: "bg-[#d93a3a]/10 text-[#d93a3a]",
    info: "bg-[#007275]/10 text-[#007275]",
  };

  return (
    <View
      className={`px-3 py-1 rounded-full ${variantStyles[variant]}`}
      {...props}
    >
      <Text className="text-xs font-semibold">{label}</Text>
    </View>
  );
}

export function Avatar({
  uri,
  size = "md",
  fallback,
}: {
  uri?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  fallback?: string;
}) {
  const sizeStyles = {
    sm: "w-8 h-8 text-xl",
    md: "w-12 h-12 text-2xl",
    lg: "w-16 h-16 text-3xl",
    xl: "w-24 h-24 text-4xl",
  };

  const borderSizes = {
    sm: "border-2",
    md: "border-2",
    lg: "border-4",
    xl: "border-4",
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={`${sizeStyles[size]} rounded-full border-[#007275] ${borderSizes[size]}`}
      />
    );
  }

  return (
    <View
      className={`${sizeStyles[size]} rounded-full bg-[#faf5e0] items-center justify-center border-2 border-[#007275] ${borderSizes[size]}`}
    >
      {fallback ? (
        <Text className="text-[#007275] font-bold">
          {fallback[0].toUpperCase()}
        </Text>
      ) : (
        <Ionicons name="paw" size={size === "sm" ? 14 : size === "xl" ? 36 : 22} color="#007275" />
      )}
    </View>
  );
}