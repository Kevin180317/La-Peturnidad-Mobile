const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

// Configuración de Metro + Uniwind para React Native (mobile-first)
module.exports = withUniwindConfig(config, {
  // Ruta relativa a tu global.css
  cssEntryFile: "./app/global.css",
  // Generar typings FUERA de `app/` para que expo-router no lo trate como ruta
  dtsFile: "./uniwind-types.d.ts",
});
