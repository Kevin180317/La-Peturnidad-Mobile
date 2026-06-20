import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

function SkeletonBlock({ className }: { className?: string }) {
  const opacity = useRef(new Animated.Value(0.3));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity.current, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity.current, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      className={`bg-gray-300 rounded-lg ${className || ""}`}
      style={{ opacity: opacity.current }}
    />
  );
}

export function ProfileSkeleton() {
  return (
    <View className="p-5">
      <View className="flex-row items-center gap-4 mb-6">
        <SkeletonBlock className="w-14 h-14 rounded-full" />
        <View className="flex-1 gap-2">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-3 w-28" />
        </View>
      </View>
      <View className="flex-row gap-3 mb-6">
        <SkeletonBlock className="flex-1 h-14 rounded-xl" />
        <SkeletonBlock className="flex-1 h-14 rounded-xl" />
      </View>
      {[1, 2, 3].map((i) => (
        <SkeletonBlock key={i} className="h-16 w-full mb-2 rounded-xl" />
      ))}
    </View>
  );
}

export function PetCardSkeleton() {
  return (
    <View className="flex-row items-center p-3 bg-white rounded-xl mb-2">
      <SkeletonBlock className="w-12 h-12 rounded-lg" />
      <SkeletonBlock className="flex-1 h-5 ml-3" />
    </View>
  );
}
