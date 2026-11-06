import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PrimaryButton } from "@/components/kit/Kit";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
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
import { consumePendingNotificationUrl } from "./_layout";

const { width } = Dimensions.get("window");

const ONBOARDING_KEY = "hasSeenOnboarding";

const STEPS = [
  {
    id: "1",
    title: "Reporta",
    subtitle: "Reporta mascotas perdidas o encontradas al instante",
    icon: "megaphone" as const,
    color: "#ff7e70",
  },
  {
    id: "2",
    title: "Conecta",
    subtitle: "Conecta con la comunidad y ayuda a reunirlas",
    icon: "people" as const,
    color: "#007275",
  },
  {
    id: "3",
    title: "Actúa",
    subtitle: "Recibe alertas y activa la red de emergencia",
    icon: "notifications" as const,
    color: "#211f1e",
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
          if (!profileResult.success) {
            // Error al cargar el perfil (red, etc.): no asumir que falta; login reintenta y avisa
            router.replace("/login");
          } else if (profileResult.data) {
            const pendingUrl = await consumePendingNotificationUrl();
            router.replace((pendingUrl ?? "/dashboard") as Href);
          } else {
            router.replace({
              pathname: "/register-extended",
              params: { email: sessionUser.email ?? "" },
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
      <View className="w-56 h-56 rounded-full items-center justify-center mb-10" style={{ backgroundColor: `${item.color}14` }}>
        <View className="w-40 h-40 rounded-full items-center justify-center" style={{ backgroundColor: `${item.color}1F` }}>
          <View
            className="w-24 h-24 rounded-[32px] items-center justify-center"
            style={{ backgroundColor: item.color, shadowColor: item.color, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
          >
            <Ionicons name={item.icon} size={44} color="#fff" />
          </View>
        </View>
      </View>
      <Text className="text-4xl font-bold text-[#211f1e] mb-3">{item.title}</Text>
      <Text className="text-lg text-gray-600 text-center leading-7 px-2">{item.subtitle}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#faf5e0]">
      <View className="absolute top-14 left-6 right-6 z-10 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Image
            source={require("../assets/images/Isotipo_color_Salmon.png")}
            style={{ width: 28, height: 28 }}
            contentFit="contain"
          />
          <Text className="font-bold text-[#211f1e] text-base">Lucky Tracker</Text>
        </View>
        <TouchableOpacity
          onPress={finishOnboarding}
          className="bg-white px-4 py-2 rounded-full"
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Saltar introducción"
        >
          <Text className="text-[#211f1e] font-semibold">Saltar</Text>
        </TouchableOpacity>
      </View>

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

      <View className="items-center px-6 pb-12">
        <View className="flex-row gap-2 mb-8">
          {STEPS.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${index === currentIndex ? "w-7 bg-[#007275]" : "w-2 bg-[#007275]/25"}`}
            />
          ))}
        </View>

        <PrimaryButton
          title={currentIndex === STEPS.length - 1 ? "Comenzar" : "Siguiente"}
          icon={currentIndex === STEPS.length - 1 ? "paw" : "arrow-forward"}
          onPress={handleNext}
          className="self-stretch"
        />
      </View>
    </View>
  );
}
