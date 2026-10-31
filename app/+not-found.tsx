import { EmptyCard } from "@/components/kit/Kit";
import { Link, Stack } from "expo-router";
import { View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "No encontrado" }} />
      <View className="flex-1 justify-center p-5 bg-[#faf5e0]">
        <EmptyCard icon="compass-outline" title="Esta pantalla no existe" text="Puede que el enlace esté roto o la página se haya movido.">
          <Link href="/" className="bg-[#007275] py-2.5 px-6 rounded-full mt-4 text-white font-semibold overflow-hidden">
            Ir al inicio
          </Link>
        </EmptyCard>
      </View>
    </>
  );
}
