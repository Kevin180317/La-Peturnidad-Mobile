import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

export function Skeleton({ className = "" }: { className?: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity }}
      className={`bg-[#e8e2cd] rounded-xl ${className}`}
    />
  );
}

export function ListSkeleton({
  count = 5,
  withAvatar = true,
}: {
  count?: number;
  withAvatar?: boolean;
}) {
  return (
    <View className="p-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="bg-white rounded-2xl p-4 flex-row items-center gap-4"
        >
          {withAvatar && <Skeleton className="w-12 h-12 rounded-full" />}
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View className="p-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="bg-white rounded-2xl p-4 gap-3">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </View>
      ))}
    </View>
  );
}
