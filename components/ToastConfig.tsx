import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { BaseToastProps } from "react-native-toast-message";

const danger = "#d93a3a";
const dark = "#211f1e";
const teal = "#007275";

const styles = StyleSheet.create({
  base: {
    marginHorizontal: 16,
    marginTop: 50,
    borderRadius: 16,
    borderLeftWidth: 6,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  textContainer: {
    flex: 1,
  },
  text1: {
    color: dark,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  text2: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
});

// Tarjeta blanca con borde e ícono de color: contrasta con el header teal y el fondo crema
function AppToast({
  icon,
  color,
  text1,
  text2,
}: BaseToastProps & { icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={[styles.base, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={22} color={color} />
      <View style={styles.textContainer}>
        <Text style={styles.text1} numberOfLines={1}>{text1}</Text>
        {text2 && <Text style={styles.text2} numberOfLines={2}>{text2}</Text>}
      </View>
    </View>
  );
}

export const toastConfig = {
  success: (props: BaseToastProps) => <AppToast {...props} icon="checkmark-circle" color={teal} />,
  error: (props: BaseToastProps) => <AppToast {...props} icon="close-circle" color={danger} />,
  info: (props: BaseToastProps) => <AppToast {...props} icon="information-circle" color={dark} />,
};
