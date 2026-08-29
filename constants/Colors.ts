const emergency = "#ff7e70";
const dark = "#211f1e";
const tealDark = "#005e66";
const teal = "#007275";
const cream = "#faf5e0";

// Teal es el único color de acción/navegación primaria de la app.
// Coral ("emergency") queda reservado exclusivamente a la sección de Emergencia.
export const Colors = {
  light: {
    text: dark,
    background: cream,
    tint: teal,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: teal,
    primary: teal,
    secondary: dark,
    accent: teal,
    emergency: emergency,
  },
  dark: {
    text: cream,
    background: dark,
    tint: teal,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: teal,
    primary: teal,
    secondary: cream,
    accent: teal,
    emergency: emergency,
  },
};
