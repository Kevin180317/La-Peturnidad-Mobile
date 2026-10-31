import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";

// Piezas visuales compartidas (tarjetas blancas rounded-3xl, chips, botones píldora) para que
// todas las pantallas hablen el mismo lenguaje. Vive en components/: cubierto por @source en global.css.

type IconName = keyof typeof Ionicons.glyphMap;

export const CARD_SHADOW = "shadow-[0_4px_24px_rgba(33,31,30,0.08)]";
export const CARD = `bg-white rounded-3xl ${CARD_SHADOW}`;

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <View className={`${CARD} mb-4 overflow-hidden ${className}`}>{children}</View>;
}

export function ScreenTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between mb-5">
      <View className="flex-1 pr-3">
        <Text className="text-2xl font-bold text-[#211f1e]">{title}</Text>
        {!!subtitle && <Text className="text-gray-500 text-sm mt-0.5">{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({
  icon,
  color = "#007275",
  title,
  right,
}: {
  icon?: IconName;
  color?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      {icon && <Ionicons name={icon} size={18} color={color} />}
      <Text className="font-bold text-base text-[#211f1e] flex-1">{title}</Text>
      {right}
    </View>
  );
}

export function Avatar({
  uri,
  name,
  size = 44,
  ring = true,
}: {
  uri?: string | null;
  name?: string | null;
  size?: number;
  ring?: boolean;
}) {
  const inner = ring ? size - 6 : size;
  const content = uri ? (
    <Image source={{ uri }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
  ) : (
    <View
      className="bg-[#007275] items-center justify-center"
      style={{ width: inner, height: inner, borderRadius: inner / 2 }}
    >
      <Text className="text-white font-bold" style={{ fontSize: Math.max(12, inner * 0.38) }}>
        {name?.trim()?.[0]?.toUpperCase() || "U"}
      </Text>
    </View>
  );
  if (!ring) return content;
  return (
    <View
      className="border-2 border-[#007275] items-center justify-center"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      {content}
    </View>
  );
}

export function RoundIconButton({
  icon,
  tint = "teal",
  onPress,
  label,
  disabled,
  loading,
  size = 36,
}: {
  icon: IconName;
  tint?: "teal" | "red" | "white" | "solid";
  onPress: () => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  size?: number;
}) {
  const styles = {
    teal: { bg: "bg-[#007275]/10", color: "#007275" },
    red: { bg: "bg-red-50", color: "#ef4444" },
    white: { bg: `bg-white ${CARD_SHADOW}`, color: "#007275" },
    solid: { bg: "bg-[#007275]", color: "#ffffff" },
  }[tint];
  return (
    <TouchableOpacity
      className={`rounded-full items-center justify-center ${styles.bg}`}
      style={{ width: size, height: size }}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
    >
      {loading ? (
        <ActivityIndicator size="small" color={styles.color} />
      ) : (
        <Ionicons name={icon} size={Math.round(size * 0.48)} color={styles.color} />
      )}
    </TouchableOpacity>
  );
}

export type ChipTone = "neutral" | "coral" | "teal" | "dark";

const CHIP_TONES: Record<ChipTone, { bg: string; color: string }> = {
  neutral: { bg: "bg-gray-100", color: "#4B5563" },
  coral: { bg: "bg-[#ff7e70]/10", color: "#c2402f" },
  teal: { bg: "bg-[#007275]/10", color: "#007275" },
  dark: { bg: "bg-[#211f1e]/10", color: "#211f1e" },
};

export function Chip({ text, tone = "neutral", icon }: { text: string; tone?: ChipTone; icon?: IconName }) {
  const s = CHIP_TONES[tone];
  return (
    <View className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${s.bg}`}>
      {icon && <Ionicons name={icon} size={11} color={s.color} />}
      <Text className="text-[11px] font-semibold capitalize" style={{ color: s.color }}>
        {text}
      </Text>
    </View>
  );
}

export function EmptyCard({
  icon,
  color = "#007275",
  title,
  text,
  children,
}: {
  icon: IconName;
  color?: string;
  title?: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <View className={`${CARD} px-8 py-10 items-center mb-4`}>
      <View className="w-16 h-16 rounded-full items-center justify-center mb-3" style={{ backgroundColor: `${color}1A` }}>
        <Ionicons name={icon} size={30} color={color} />
      </View>
      {!!title && <Text className="font-bold text-[#211f1e] text-base">{title}</Text>}
      <Text className="text-gray-500 text-center text-sm mt-1">{text}</Text>
      {children}
    </View>
  );
}

export function PetThumb({
  uri,
  type,
  className,
  iconSize,
}: {
  uri?: string | null;
  type?: string | null;
  className: string;
  iconSize: number;
}) {
  if (uri) return <Image source={{ uri }} className={`${className} bg-gray-100`} />;
  return (
    <View className={`${className} bg-[#faf5e0] items-center justify-center`}>
      <MaterialCommunityIcons
        name={type === "perro" ? "dog" : type === "gato" ? "cat" : "paw"}
        size={iconSize}
        color="#007275"
      />
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  icon,
  loading,
  disabled,
  variant = "teal",
  testID,
  className = "",
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  variant?: "teal" | "coral" | "ghost" | "danger";
  testID?: string;
  className?: string;
}) {
  const off = disabled || loading;
  const styles = {
    teal: { bg: "bg-[#007275] shadow-[0_6px_16px_rgba(0,114,117,0.3)]", text: "text-white", color: "#fff" },
    coral: { bg: "bg-[#ff7e70] shadow-[0_6px_16px_rgba(255,126,112,0.35)]", text: "text-white", color: "#fff" },
    ghost: { bg: "bg-[#211f1e]/5", text: "text-[#211f1e]", color: "#211f1e" },
    danger: { bg: "bg-red-50", text: "text-red-600", color: "#dc2626" },
  }[variant];
  return (
    <TouchableOpacity
      className={`h-[52px] rounded-full flex-row items-center justify-center gap-2 px-5 ${off ? "bg-gray-300" : styles.bg} ${className}`}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size="small" color={off ? "#4B5563" : styles.color} />
      ) : (
        icon && <Ionicons name={icon} size={18} color={off ? "#4B5563" : styles.color} />
      )}
      <Text className={`font-bold text-[15px] ${off ? "text-gray-700" : styles.text}`}>{title}</Text>
    </TouchableOpacity>
  );
}

// Campo con etiqueta, ícono opcional y borde teal al enfocar (fondo blanco + texto oscuro, ver AGENTS.md)
export function Field({
  label,
  icon,
  error,
  multiline,
  right,
  ...input
}: TextInputProps & { label?: string; icon?: IconName; error?: string | null; right?: ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="mb-4">
      {!!label && <Text className="text-[13px] font-semibold text-[#211f1e] mb-1.5 ml-1">{label}</Text>}
      <View
        className={`flex-row bg-white rounded-2xl border-[1.5px] px-4 ${multiline ? "items-start py-3" : "items-center h-[52px]"} ${
          error ? "border-red-400" : focused ? "border-[#007275]" : "border-gray-200"
        }`}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? "#007275" : "#9BA1A6"}
            style={{ marginRight: 10, marginTop: multiline ? 2 : 0 }}
          />
        )}
        <TextInput
          placeholderTextColor="#9BA1A6"
          {...input}
          multiline={multiline}
          className={`flex-1 text-[15px] text-[#211f1e] ${multiline ? "min-h-[72px]" : ""}`}
          textAlignVertical={multiline ? "top" : "center"}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
        />
        {right}
      </View>
      {!!error && <Text className="text-red-600 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
}

// Selector de opciones como pastillas (reemplaza Pickers nativos con pocas opciones)
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T | "";
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full border-[1.5px] ${
              active ? "bg-[#007275] border-[#007275]" : "bg-white border-gray-200"
            }`}
            activeOpacity={0.8}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            {o.icon && <Ionicons name={o.icon} size={15} color={active ? "#fff" : "#6B7280"} />}
            <Text className={`text-sm font-semibold ${active ? "text-white" : "text-gray-600"}`}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Tarjeta tipo interruptor: muestra/oculta una sección; contador coral cuando está inactiva
export function ToggleTile({
  icon,
  title,
  subtitle,
  count,
  active,
  onPress,
  label,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  count: number;
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <TouchableOpacity
      className={`flex-1 rounded-3xl p-3.5 border-2 ${active ? "bg-[#007275]/10 border-[#007275]" : `bg-white border-transparent ${CARD_SHADOW}`}`}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className={`w-10 h-10 rounded-2xl items-center justify-center ${active ? "bg-[#007275]" : "bg-[#007275]/10"}`}>
          <Ionicons name={icon} size={20} color={active ? "#fff" : "#007275"} />
        </View>
        {active ? (
          <Ionicons name="checkmark-circle" size={18} color="#007275" />
        ) : count > 0 ? (
          <View className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#ff7e70] items-center justify-center">
            <Text className="text-white text-[11px] font-bold">{count > 99 ? "99+" : count}</Text>
          </View>
        ) : null}
      </View>
      <Text className="font-bold text-[#211f1e] text-sm" numberOfLines={1}>
        {title}
      </Text>
      <Text className="text-gray-500 text-[11px] mt-0.5" numberOfLines={1}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

// Grupo de filas tipo ajustes: título pequeño fuera de la tarjeta y filas separadas por líneas finas
export function ListSection({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <View className={`mb-6 ${className}`}>
      {!!title && (
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-2">{title}</Text>
      )}
      <View className={`${CARD} overflow-hidden`}>{children}</View>
    </View>
  );
}

export function ListRow({
  icon,
  color = "#007275",
  label,
  value,
  onPress,
  badge,
  first,
  right,
  destructive,
}: {
  icon: IconName;
  color?: string;
  label: string;
  /** si se da, la fila muestra label pequeño + valor (fila de información) */
  value?: string | number | null;
  onPress?: () => void;
  badge?: number;
  first?: boolean;
  right?: ReactNode;
  destructive?: boolean;
}) {
  const tint = destructive ? "#dc2626" : color;
  const content = (
    <>
      <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${tint}1A` }}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      {value !== undefined ? (
        <View className="flex-1">
          <Text className="text-xs text-gray-500">{label}</Text>
          <Text className="text-[#211f1e] font-semibold text-[15px] mt-0.5">{value === null || value === "" ? "No disponible" : value}</Text>
        </View>
      ) : (
        <Text className={`flex-1 font-semibold text-[15px] ${destructive ? "text-red-600" : "text-[#211f1e]"}`}>{label}</Text>
      )}
      {!!badge && badge > 0 && (
        <View className="bg-[#ff7e70] rounded-full min-w-[22px] h-[22px] items-center justify-center px-1.5 mr-2">
          <Text className="text-white text-[11px] font-bold">{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}
      {right}
      {onPress && !right && <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />}
    </>
  );
  const className = `flex-row items-center px-4 py-3.5 ${first ? "" : "border-t border-gray-100"}`;
  if (!onPress) return <View className={className}>{content}</View>;
  return (
    <TouchableOpacity className={className} activeOpacity={0.6} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {content}
    </TouchableOpacity>
  );
}

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
  icon?: IconName;
  /** color del ícono/texto cuando está activa (por defecto teal) */
  color?: string;
}

// Selector segmentado: pastilla blanca que se desliza bajo la opción activa sobre fondo crema
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "mb-5",
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [offset] = useState(() => new Animated.Value(0));
  const indexOf = (key: T) => Math.max(0, options.findIndex((o) => o.key === key));

  const select = (key: T) => {
    Animated.timing(offset, { toValue: indexOf(key) * segmentWidth, duration: 220, useNativeDriver: true }).start();
    onChange(key);
  };

  return (
    <View
      className={`flex-row bg-[#f1ead0] rounded-2xl p-1 ${className}`}
      onLayout={(e) => {
        const width = (e.nativeEvent.layout.width - 8) / options.length;
        setSegmentWidth(width);
        offset.setValue(indexOf(value) * width);
      }}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 && (
        <Animated.View
          className="absolute top-1 bottom-1 left-1 bg-white rounded-xl shadow-[0_2px_8px_rgba(33,31,30,0.1)]"
          style={{ width: segmentWidth, transform: [{ translateX: offset }] }}
        />
      )}
      {options.map((o) => {
        const active = o.key === value;
        const color = active ? (o.color ?? "#007275") : "#6B7280";
        const icon = o.icon && (active ? o.icon : (`${o.icon}-outline` as IconName));
        return (
          <TouchableOpacity
            key={o.key}
            className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5"
            activeOpacity={0.7}
            onPress={() => select(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            {icon && <Ionicons name={icon} size={15} color={color} />}
            <Text className="text-xs font-semibold" style={{ color }} numberOfLines={1}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Hoja inferior: fondo oscuro que cierra al tocar, asa, título y botón X
export function Sheet({
  visible,
  title,
  onClose,
  children,
  closeDisabled,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  closeDisabled?: boolean;
}) {
  const close = () => {
    if (!closeDisabled) onClose();
  };
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={close}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="flex-1 justify-end bg-black/50">
          <Pressable className="flex-1" onPress={close} accessibilityLabel="Cerrar" />
          <View className="bg-white rounded-t-[32px] px-5 pt-3 pb-8">
            <View className="w-10 h-1.5 rounded-full bg-gray-300 self-center mb-3" />
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-[#211f1e] flex-1">{title}</Text>
              <RoundIconButton icon="close" tint="teal" size={34} onPress={close} label="Cerrar" disabled={closeDisabled} />
            </View>
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
