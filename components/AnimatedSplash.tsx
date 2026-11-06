import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// Continúa el splash nativo (mismo fondo, isotipo y tamaño que en app.json) para que hideAsync no se note.
// Secuencia: huellitas caminando en curva hacia el isotipo → halo + 2 latidos con onda y vibración
// → wordmark → salida con anticipación y zoom.
const BACKGROUND = "#faf5e0";
const BRAND = "#f08374"; // tono del isotipo (splash-icon.png)
const DARK = "#211f1e";
const LOGO_SIZE = 200;
const PAW_SIZE = 30;
const PAW_COUNT = 6;
const STEP_MS = 140;
const PAW_HOLD_MS = 450;
const WORDMARK_START_MS = 700;
const BEAT_TIMES_MS = [950, 1200];
const EXIT_START_MS = 1550;
const ZOOM_START_MS = 1650;
const ANTICIPATION_MS = 120;
const ZOOM_MS = 450;
const REDUCED_FADE_MS = 300;

export const SPLASH_DURATION_MS = ZOOM_START_MS + ANTICIPATION_MS + ZOOM_MS;
export const SPLASH_REDUCED_DURATION_MS = REDUCED_FADE_MS;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

const logo = require("../assets/images/splash-icon.png");

interface PawStep {
  x: number;
  y: number;
  rotate: string;
  depth: number; // 0 = lejos (más chica y tenue), 1 = cerca del isotipo
}

// Pasos sobre una curva (bezier cuadrática) desde abajo-izquierda hasta debajo del isotipo,
// alternando pata izquierda/derecha y rotando cada huella según la tangente de la curva
function buildPawSteps(width: number, height: number): PawStep[] {
  const p0 = { x: -width * 0.34, y: height * 0.34 };
  const p1 = { x: width * 0.18, y: height * 0.3 };
  const p2 = { x: -LOGO_SIZE * 0.15, y: LOGO_SIZE * 0.62 };

  return Array.from({ length: PAW_COUNT }, (_, i) => {
    const t = i / (PAW_COUNT - 1);
    const u = 1 - t;
    const x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x;
    const y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y;
    const dx = 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
    const dy = 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
    const length = Math.hypot(dx, dy) || 1;
    const side = i % 2 === 0 ? -1 : 1;
    // El ícono "paw" apunta hacia arriba; se rota hacia la dirección de avance
    const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
    return {
      x: x + (-dy / length) * 13 * side,
      y: y + (dx / length) * 13 * side,
      rotate: `${angle}deg`,
      depth: t,
    };
  });
}

// Huella que "se sella": cae grande, se asienta con spring, deja una onda y se desvanece encogiéndose
function Paw({ step, index }: { step: PawStep; index: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1.5);
  const rippleScale = useSharedValue(0.4);
  const rippleOpacity = useSharedValue(0);
  const peak = 0.55 + 0.45 * step.depth;
  const size = 0.75 + 0.25 * step.depth;

  useEffect(() => {
    const delay = index * STEP_MS;
    opacity.set(
      withDelay(
        delay,
        withSequence(
          withTiming(peak, { duration: 140, easing: EASE_OUT }),
          withDelay(PAW_HOLD_MS, withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) })),
        ),
      ),
    );
    scale.set(
      withDelay(
        delay,
        withSequence(
          withSpring(1, { damping: 12, stiffness: 260 }),
          withDelay(PAW_HOLD_MS - 100, withTiming(0.85, { duration: 350 })),
        ),
      ),
    );
    rippleOpacity.set(
      withDelay(delay + 80, withSequence(withTiming(0.3, { duration: 60 }), withTiming(0, { duration: 440 }))),
    );
    rippleScale.set(withDelay(delay + 80, withTiming(1.7, { duration: 500, easing: EASE_OUT })));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la animación corre una sola vez al montar
  }, []);

  const pawStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ rotate: step.rotate }, { scale: scale.value * size }],
  }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value,
    transform: [{ scale: rippleScale.value * size }],
  }));

  return (
    <Animated.View
      style={[styles.pawSlot, { transform: [{ translateX: step.x }, { translateY: step.y }] }]}
      testID="animated-splash-paw"
    >
      <Animated.View style={[styles.ring, styles.pawRipple, rippleStyle]} />
      <Animated.View style={pawStyle}>
        <MaterialCommunityIcons name="paw" size={PAW_SIZE} color={BRAND} />
      </Animated.View>
    </Animated.View>
  );
}

// Onda tipo sonar que sale del isotipo en cada latido
function BeatRing({ delay }: { delay: number }) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.set(withDelay(delay, withSequence(withTiming(0.45, { duration: 80 }), withTiming(0, { duration: 620 }))));
    scale.set(withDelay(delay, withTiming(1.9, { duration: 700, easing: EASE_OUT })));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la animación corre una sola vez al montar
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  return <Animated.View style={[styles.ring, styles.beatRing, style]} testID="animated-splash-beat" />;
}

export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const overlayOpacity = useSharedValue(1);
  const logoScale = useSharedValue(1);
  const haloOpacity = useSharedValue(0);
  const haloScale = useSharedValue(0.85);
  const wordOpacity = useSharedValue(0);
  const wordOffset = useSharedValue(8);
  const wordSpacing = useSharedValue(8);

  useEffect(() => {
    if (reduceMotion) {
      overlayOpacity.set(withTiming(0, { duration: REDUCED_FADE_MS }));
      const timer = setTimeout(onFinish, SPLASH_REDUCED_DURATION_MS);
      return () => clearTimeout(timer);
    }

    // Halo que aparece y "respira" detrás del isotipo; se va antes que el logo
    haloOpacity.set(
      withSequence(
        withTiming(0.16, { duration: 700, easing: EASE_OUT }),
        withDelay(EXIT_START_MS - 700, withTiming(0, { duration: 250 })),
      ),
    );
    haloScale.set(
      withRepeat(withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true),
    );

    // Wordmark: sube, aparece y el espaciado de letras se cierra
    wordOpacity.set(
      withDelay(
        WORDMARK_START_MS,
        withSequence(
          withTiming(1, { duration: 500, easing: EASE_OUT }),
          withDelay(EXIT_START_MS - WORDMARK_START_MS - 500, withTiming(0, { duration: 220 })),
        ),
      ),
    );
    wordOffset.set(withDelay(WORDMARK_START_MS, withTiming(0, { duration: 600, easing: EASE_OUT })));
    wordSpacing.set(withDelay(WORDMARK_START_MS, withTiming(1, { duration: 800, easing: EASE_OUT })));

    // Dos latidos → anticipación → zoom
    const beatUp = { duration: 110, easing: EASE_OUT };
    const beatDown = { duration: 140, easing: Easing.inOut(Easing.quad) };
    logoScale.set(
      withSequence(
        withDelay(BEAT_TIMES_MS[0], withTiming(1.1, beatUp)),
        withTiming(1, beatDown),
        withTiming(1.1, beatUp),
        withTiming(1, beatDown),
        withDelay(
          ZOOM_START_MS - BEAT_TIMES_MS[1] - 250,
          withTiming(0.94, { duration: ANTICIPATION_MS, easing: Easing.out(Easing.quad) }),
        ),
        withTiming(9, { duration: ZOOM_MS, easing: EASE_IN }),
      ),
    );
    overlayOpacity.set(
      withDelay(ZOOM_START_MS + ANTICIPATION_MS + 120, withTiming(0, { duration: ZOOM_MS - 120 })),
    );

    // Vibración suave sincronizada con cada latido; el fin se marca con un timer de JS
    // (no con el callback de withTiming) para no depender del hilo de UI
    const timers = BEAT_TIMES_MS.map((ms) =>
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
      }, ms),
    );
    timers.push(setTimeout(onFinish, SPLASH_DURATION_MS));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la secuencia corre una sola vez al montar
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }] }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
    transform: [{ scale: haloScale.value }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    letterSpacing: wordSpacing.value,
    transform: [{ translateY: wordOffset.value }],
  }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} testID="animated-splash">
      {!reduceMotion && (
        <>
          <Animated.View style={[styles.halo, haloStyle]} />
          {BEAT_TIMES_MS.map((ms) => (
            <BeatRing key={ms} delay={ms} />
          ))}
          {buildPawSteps(width, height).map((step, i) => (
            <Paw key={i} step={step} index={i} />
          ))}
        </>
      )}
      <Animated.Image source={logo} style={[styles.logo, logoStyle]} resizeMode="contain" />
      {!reduceMotion && (
        <Animated.Text style={[styles.wordmark, wordStyle]} testID="animated-splash-wordmark">
          Lucky Tracker
        </Animated.Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    elevation: 1000,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  halo: {
    position: "absolute",
    width: LOGO_SIZE * 1.5,
    height: LOGO_SIZE * 1.5,
    borderRadius: LOGO_SIZE * 0.75,
    backgroundColor: BRAND,
    // Halo suave: color de marca muy tenue (opacidad animada) con sombra difusa en iOS
    shadowColor: BRAND,
    shadowOpacity: 0.6,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  ring: {
    position: "absolute",
    borderWidth: 2,
    borderColor: BRAND,
  },
  beatRing: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
  },
  pawSlot: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  pawRipple: {
    width: PAW_SIZE * 1.4,
    height: PAW_SIZE * 1.4,
    borderRadius: PAW_SIZE * 0.7,
  },
  wordmark: {
    position: "absolute",
    top: "50%",
    marginTop: LOGO_SIZE / 2 + 4,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: DARK,
  },
});
