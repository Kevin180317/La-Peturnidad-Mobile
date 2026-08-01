import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { dashboardService } from "@/services/dashboard.service";
import { supabase } from "@/utils/supabase";

const { width } = Dimensions.get("window");

const ONBOARDING_KEY = "hasSeenOnboarding";

const STEPS = [
  {
    id: "1",
    title: "Reporta",
    subtitle: "Reportá mascotas perdidas o encontradas al instante",
  },
  {
    id: "2",
    title: "Conecta",
    subtitle: "Conectá con la comunidad y ayudá a reunirlas",
  },
  {
    id: "3",
    title: "Actúa",
    subtitle: "Recibí alertas y activá la red de emergencia",
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checking, setChecking] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;
        if (sessionUser) {
          if (!sessionUser.email_confirmed_at) {
            router.replace({
              pathname: "/email-confirmacion",
              params: { email: sessionUser.email ?? "" },
            });
            return;
          }
          const profileResult = await dashboardService.getProfileByUserId(
            sessionUser.id,
          );
          if (profileResult.success && profileResult.data) {
            router.replace({
              pathname: "/dashboard",
              params: { email: sessionUser.email, userId: sessionUser.id },
            });
          } else {
            router.replace({
              pathname: "/register-extended",
              params: { email: sessionUser.email ?? "", userId: sessionUser.id },
            });
          }
          return;
        }

        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (seen === "true") {
          router.replace("/login");
          return;
        }
      } catch (error) {
        console.warn("Error leyendo onboarding:", error);
      }
      setChecking(false);
    })();
  }, [router]);

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch (error) {
      console.warn("Error guardando onboarding:", error);
    }
    router.replace("/login");
  };

  const handleNext = () => {
    if (currentIndex < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      finishOnboarding();
    }
  };

  if (checking) {
    return (
      <View className="flex-1 justify-center items-center bg-[#faf5e0]">
        <ActivityIndicator size="large" color="#007275" />
      </View>
    );
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const renderItem = ({ item }: { item: (typeof STEPS)[0] }) => (
    <View style={{ width }} className="flex-1 items-center justify-center px-8">
      <Image
        source={require("../assets/images/Isotipo_espacio_positivo.png")}
        style={{ width: 128, height: 128 }}
        contentFit="contain"
        className="mb-12"
      />
      <Text className="text-4xl font-bold text-[#ff7e70] mt-4 mb-4">
        Lucky Tracker
      </Text>
      <Text className="text-4xl font-bold text-[#ff7e70] mb-4">
        {item.title}
      </Text>
      <Text className="text-lg text-[#211f1e] text-center leading-6">
        {item.subtitle}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#faf5e0]">
      <TouchableOpacity
        onPress={finishOnboarding}
        className="absolute top-16 right-6 z-10"
      >
        <Text className="text-[#ff7e70] font-semibold text-base">Saltar</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={STEPS}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        bounces={false}
        className="flex-1"
      />

      <View className="items-center pb-12">
        <View className="flex-row gap-2 mb-10">
          {STEPS.map((_, index) => (
            <View
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentIndex ? "bg-[#007275]" : "bg-[#007275]/30"
              }`}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          className="bg-[#007275] py-4 px-16 rounded-xl shadow-md"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-lg">
            {currentIndex === STEPS.length - 1 ? "Comenzar" : "Siguiente"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
