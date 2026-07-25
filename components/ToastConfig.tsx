import { View, Text, StyleSheet } from "react-native";
import { BaseToastProps } from "react-native-toast-message";

const primary = "#ff7e70";
const dark = "#211f1e";
const teal = "#007275";

const styles = StyleSheet.create({
  base: {
    marginHorizontal: 16,
    marginTop: 50,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  success: {
    backgroundColor: teal,
  },
  error: {
    backgroundColor: primary,
  },
  info: {
    backgroundColor: dark,
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  text1: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  text2: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
});

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <View style={[styles.base, styles.success]}>
      <Text style={styles.icon}>✓</Text>
      <View style={styles.textContainer}>
        <Text style={styles.text1} numberOfLines={1}>{props.text1}</Text>
        {props.text2 && <Text style={styles.text2} numberOfLines={2}>{props.text2}</Text>}
      </View>
    </View>
  ),
  error: (props: BaseToastProps) => (
    <View style={[styles.base, styles.error]}>
      <Text style={styles.icon}>✕</Text>
      <View style={styles.textContainer}>
        <Text style={styles.text1} numberOfLines={1}>{props.text1}</Text>
        {props.text2 && <Text style={styles.text2} numberOfLines={2}>{props.text2}</Text>}
      </View>
    </View>
  ),
  info: (props: BaseToastProps) => (
    <View style={[styles.base, styles.info]}>
      <Text style={styles.icon}>ℹ</Text>
      <View style={styles.textContainer}>
        <Text style={styles.text1} numberOfLines={1}>{props.text1}</Text>
        {props.text2 && <Text style={styles.text2} numberOfLines={2}>{props.text2}</Text>}
      </View>
    </View>
  ),
};
