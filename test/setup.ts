// Las factories de jest.mock requieren require() para cargar módulos de forma perezosa.
/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Services import the real client; tests override per-table results via supabaseMock.
jest.mock("@/utils/supabase", () => require("./supabaseMock").supabaseModule);

jest.mock("expo-router", () => require("./routerMock"));

jest.mock("react-native-toast-message", () => {
  const Toast = () => null;
  Toast.show = jest.fn();
  Toast.hide = jest.fn();
  return { __esModule: true, default: Toast };
});

// Icon sets load font assets on mount, which the asset registry can't resolve in Jest.
jest.mock("@expo/vector-icons", () => {
  const icon = () => null;
  return new Proxy({ __esModule: true }, { get: (target, key) => (key in target ? target[key as keyof typeof target] : icon) });
});

// useSafeAreaInsets necesita SafeAreaProvider; el mock oficial devuelve insets fijos
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

// El chat solo lee la altura del header; sin Stack en los tests es 0
jest.mock("expo-router/react-navigation", () => ({ HeaderHeightContext: require("react").createContext(undefined) }));
