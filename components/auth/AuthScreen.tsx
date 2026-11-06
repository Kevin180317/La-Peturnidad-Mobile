import { CARD, RoundIconButton } from "@/components/kit/Kit";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReactNode } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

const isotipo = require("../../assets/images/Isotipo_color_Salmon.png");

// Marco común de las pantallas de acceso: fondo crema, isotipo, título y formulario en tarjeta blanca
export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  showLogo = true,
  hero,
  headerless,
  onBack,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** contenido bajo la tarjeta (enlaces secundarios) */
  footer?: ReactNode;
  showLogo?: boolean;
  /** reemplaza el isotipo por otro elemento (p. ej. ícono de correo) */
  hero?: ReactNode;
  /** la pantalla oculta la barra de navegación: respeta la zona segura superior */
  headerless?: boolean;
  /** botón circular de regreso (solo útil sin barra de navegación) */
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#faf5e0]"
      style={headerless ? { paddingTop: insets.top } : undefined}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      {headerless && <StatusBar style="dark" />}
      {onBack && (
        <View className="px-5 pt-2">
          <RoundIconButton icon="arrow-back" tint="white" size={42} onPress={onBack} label="Regresar" />
        </View>
      )}
      <ScrollView contentContainerClassName="grow justify-center p-6 pb-10" keyboardShouldPersistTaps="handled">
        {hero ? <View className="items-center mb-5">{hero}</View> : showLogo && (
          <View className="items-center mb-5">
            <View className="w-20 h-20 rounded-3xl bg-white items-center justify-center shadow-[0_8px_24px_rgba(240,131,116,0.25)]">
              <Image source={isotipo} className="w-12 h-12" resizeMode="contain" />
            </View>
          </View>
        )}
        <Text className="text-[26px] font-bold text-[#211f1e] text-center">{title}</Text>
        {!!subtitle && <Text className="text-gray-600 text-[15px] text-center mt-1.5 mb-6 px-4">{subtitle}</Text>}
        {!subtitle && <View className="mb-6" />}
        <View className={`${CARD} p-5`}>{children}</View>
        {footer && <View className="mt-6">{footer}</View>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text className="text-[13px] font-semibold text-[#211f1e] mb-1.5 ml-1">{children}</Text>;
}
