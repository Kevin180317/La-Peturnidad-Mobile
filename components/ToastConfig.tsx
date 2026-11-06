import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ToastConfig, ToastConfigParams } from "react-native-toast-message";

const danger = "#d93a3a";
const dark = "#211f1e";
const teal = "#007275";

const styles = StyleSheet.create({
  base: {
    width: "92%",
    maxWidth: 480,
    borderRadius: 22,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    shadowColor: dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  text1: {
    color: dark,
    fontSize: 15,
    fontWeight: "700",
  },
  text2: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});

type Variant = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  /** tarjeta rellena del color (texto blanco) en vez de blanca */
  filled?: boolean;
};

// Tarjeta flotante con ícono en cuadro tintado; se cierra al tocarla o con la X
function AppToast({ text1, text2, hide, onPress, icon, color, filled }: ToastConfigParams<unknown> & Variant) {
  const fg = filled ? "#fff" : dark;
  return (
    <Pressable
      onPress={() => {
        onPress?.();
        hide();
      }}
      style={[styles.base, filled && { backgroundColor: color, shadowColor: color, shadowOpacity: 0.35 }]}
      accessibilityRole="alert"
      accessibilityLabel={[text1, text2].filter(Boolean).join(". ")}
    >
      <View style={[styles.iconBox, { backgroundColor: filled ? "rgba(255,255,255,0.2)" : `${color}1A` }]}>
        <Ionicons name={icon} size={22} color={filled ? "#fff" : color} />
      </View>
      <View style={styles.textContainer}>
        {!!text1 && (
          <Text style={[styles.text1, { color: fg }]} numberOfLines={1}>
            {text1}
          </Text>
        )}
        {!!text2 && (
          <Text style={[styles.text2, filled && { color: "rgba(255,255,255,0.85)" }]} numberOfLines={2}>
            {text2}
          </Text>
        )}
      </View>
      <Pressable onPress={() => hide()} hitSlop={8} style={styles.close} accessibilityRole="button" accessibilityLabel="Cerrar aviso">
        <Ionicons name="close" size={18} color={filled ? "rgba(255,255,255,0.8)" : "#9BA1A6"} />
      </Pressable>
    </Pressable>
  );
}

export const toastConfig: ToastConfig = {
  success: (props) => <AppToast {...props} icon="checkmark-circle" color={teal} />,
  error: (props) => <AppToast {...props} icon="alert-circle" color={danger} />,
  info: (props) => <AppToast {...props} icon="information-circle" color={dark} />,
  // Saludo al iniciar sesión
  welcome: (props) => <AppToast {...props} icon="paw" color={teal} filled />,
};
