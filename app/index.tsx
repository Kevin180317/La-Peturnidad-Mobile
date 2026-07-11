import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

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
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const handleNext = () => {
    if (currentIndex < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace("/login");
    }
  };

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
        onPress={() => router.replace("/login")}
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
                index === currentIndex ? "bg-[#ff7e70]" : "bg-[#ff7e70]/30"
              }`}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          className="bg-[#ff7e70] py-4 px-16 rounded-xl shadow-md"
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
