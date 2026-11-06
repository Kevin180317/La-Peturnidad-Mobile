// Mock mínimo de Reanimated para Jest: el mock oficial de v4 inicializa el módulo nativo y falla en jest-expo.
// Los valores se aplican de inmediato (sin animación).
/* eslint-disable @typescript-eslint/no-require-imports */
const RN = require("react-native");

const identity = (v: unknown) => v;
const passthrough = (component: unknown) => component;

const Animated = {
  View: RN.View,
  Text: RN.Text,
  Image: RN.Image,
  ScrollView: RN.ScrollView,
  FlatList: RN.FlatList,
  createAnimatedComponent: passthrough,
};

module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  useSharedValue: (init: unknown) => {
    const sv = { value: init, get: () => sv.value, set: (v: unknown) => { sv.value = v; } };
    return sv;
  },
  useAnimatedStyle: (fn: () => unknown) => fn(),
  useAnimatedProps: (fn: () => unknown) => fn(),
  useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
  useAnimatedScrollHandler: () => () => {},
  useAnimatedReaction: () => {},
  useReducedMotion: () => false,
  withSpring: identity,
  withTiming: identity,
  withDelay: (_: number, v: unknown) => v,
  withSequence: (...v: unknown[]) => v[v.length - 1],
  withRepeat: identity,
  cancelAnimation: () => {},
  interpolate: (_v: number, _i: number[], out: number[]) => out[0],
  Extrapolation: { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" },
  Easing: new Proxy({}, { get: () => () => identity }),
  runOnJS: (fn: (...a: unknown[]) => unknown) => fn,
  scheduleOnRN: (fn: (...a: unknown[]) => unknown, ...args: unknown[]) => fn(...args),
};
