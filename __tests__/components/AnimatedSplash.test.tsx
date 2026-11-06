import { act, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import * as Reanimated from "react-native-reanimated";
import {
  AnimatedSplash,
  SPLASH_DURATION_MS,
  SPLASH_REDUCED_DURATION_MS,
} from "@/components/AnimatedSplash";

// Reanimated v4 inicializa el módulo nativo en Jest; se usa el mock mínimo del proyecto
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock("react-native-reanimated", () => require("../../test/reanimatedMock"));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Soft: "soft" },
}));

describe("AnimatedSplash", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("renders paws, beat rings and wordmark, and finishes after the full sequence", async () => {
    const onFinish = jest.fn();
    await render(<AnimatedSplash onFinish={onFinish} />);

    expect(screen.getByTestId("animated-splash")).toBeTruthy();
    expect(screen.getAllByTestId("animated-splash-paw")).toHaveLength(6);
    expect(screen.getAllByTestId("animated-splash-beat")).toHaveLength(2);
    expect(screen.getByText("Lucky Tracker")).toBeTruthy();

    await act(async () => jest.advanceTimersByTime(SPLASH_DURATION_MS - 1));
    expect(onFinish).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTime(1));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("vibrates softly once per heartbeat", async () => {
    await render(<AnimatedSplash onFinish={jest.fn()} />);
    await act(async () => jest.advanceTimersByTime(SPLASH_DURATION_MS));
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Soft);
  });

  it("only fades (no paws, wordmark or haptics) with reduced motion", async () => {
    jest.spyOn(Reanimated, "useReducedMotion").mockReturnValue(true);
    const onFinish = jest.fn();
    await render(<AnimatedSplash onFinish={onFinish} />);

    expect(screen.queryAllByTestId("animated-splash-paw")).toHaveLength(0);
    expect(screen.queryByText("Lucky Tracker")).toBeNull();
    await act(async () => jest.advanceTimersByTime(SPLASH_REDUCED_DURATION_MS));
    expect(onFinish).toHaveBeenCalledTimes(1);
    await act(async () => jest.advanceTimersByTime(SPLASH_DURATION_MS));
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it("does not call onFinish or vibrate after unmount", async () => {
    const onFinish = jest.fn();
    const { unmount } = await render(<AnimatedSplash onFinish={onFinish} />);
    await unmount();
    await act(async () => jest.advanceTimersByTime(SPLASH_DURATION_MS));
    expect(onFinish).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});
