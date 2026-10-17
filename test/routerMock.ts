import { Text } from "react-native";
import React from "react";

export const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
export const useRouter = jest.fn(() => router);
export const useLocalSearchParams = jest.fn(() => ({}));
export const useFocusEffect = jest.fn();
export const Link = ({ children, href, ...rest }: any) =>
  React.createElement(Text, { ...rest, accessibilityHint: String(href) }, children);

export function resetRouterMock() {
  router.push.mockReset();
  router.replace.mockReset();
  router.back.mockReset();
  useLocalSearchParams.mockReset();
  useLocalSearchParams.mockReturnValue({});
}
