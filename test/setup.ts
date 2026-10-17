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
