import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { LayoutAnimation, Platform, ScrollView, Text, TouchableOpacity, UIManager, View } from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    question: "¿Qué es Lucky Tracker?",
    answer:
      "Lucky Tracker es una aplicación que permite a los dueños de mascotas mantener un seguimiento de sus seres queridos mediante el envío de alertas impulsadas por la comunidad en caso de que sus mascotas estén desaparecidas.",
  },
  {
    question: "¿Qué tipo de alertas recibo si mi mascota está perdida?",
    answer:
      "Recibes alertas sobre avistamientos de mascotas que coinciden con la descripción de tu mascota en tu área, así como notificaciones push cuando un vecino marca que la encontró.",
  },
  {
    question: "¿Cómo puedo reportar a una mascota perdida?",
    answer:
      "Desde la pestaña de Emergencia elige \"Reportar mascota perdida\", selecciona a una de tus mascotas y confirma. La alerta se publica al instante para todos los vecinos de tu colonia.",
  },
  {
    question: "¿Qué debo hacer si encuentro a una mascota?",
    answer:
      "Puedes crear un reporte de mascota encontrada desde la pestaña de Emergencia con \"Lo encontré\" para ayudar a conectarla con su dueño. Asegúrate de proporcionar fotos claras y detalles sobre dónde la encontraste.",
  },
  {
    question: "¿Hay alguna tarifa para usar Lucky Tracker?",
    answer: "No, Lucky Tracker es gratuito para todos.",
  },
];

export default function FaqScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <ScrollView
      className="bg-[#faf5e0]"
      contentContainerClassName="p-5 pb-10"
    >
      <Text className="text-2xl font-bold font-[Inter\_700Bold] text-[#211f1e] mb-1">
        Preguntas frecuentes
      </Text>
      <Text className="text-gray-500 font-[Inter\_400Regular] mb-6">
        Todo lo que necesitas saber sobre Lucky Tracker.
      </Text>

      {FAQS.map((faq, index) => {
        const open = openIndex === index;
        return (
          <TouchableOpacity
            key={faq.question}
            activeOpacity={0.8}
            onPress={() => toggle(index)}
            className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] p-5 mb-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 font-semibold font-[Inter\_600SemiBold] text-[#211f1e] pr-3">
                {faq.question}
              </Text>
              <Ionicons
                name={open ? "chevron-up" : "chevron-down"}
                size={20}
                color="#005e66"
              />
            </View>
            {open && (
              <Text className="text-gray-500 font-[Inter\_400Regular] mt-3 leading-relaxed">
                {faq.answer}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
