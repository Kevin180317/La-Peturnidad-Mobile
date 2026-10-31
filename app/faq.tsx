import { CARD_SHADOW, ScreenTitle } from "@/components/kit/Kit";
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
      "Cuando reportas a tu mascota como perdida, enviamos una notificación push a los vecinos cuya dirección o colonia coincide con el lugar donde la viste por última vez. Además, recibes una notificación cuando un vecino marca que la encontró.",
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
    question: "¿Cómo bloqueo o reporto a un usuario?",
    answer:
      "Abre el perfil de la persona y toca el menú ⋯ en la parte superior. Ahí puedes reportarla para que nuestro equipo de moderación lo revise, o bloquearla para que ya no pueda enviarte mensajes.",
  },
  {
    question: "¿Cómo elimino mi cuenta?",
    answer:
      "Ve a Perfil → Eliminar cuenta y confirma. Se borrarán tu cuenta y tus datos (mascotas, alertas, publicaciones y mensajes) de forma permanente; esta acción no se puede deshacer.",
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
    <ScrollView className="bg-[#faf5e0]" contentContainerClassName="p-5 pb-10">
      <ScreenTitle title="Preguntas frecuentes" subtitle="Todo lo que necesitas saber sobre Lucky Tracker." />

      {FAQS.map((faq, index) => {
        const open = openIndex === index;
        return (
          <TouchableOpacity
            key={faq.question}
            activeOpacity={0.8}
            onPress={() => toggle(index)}
            className={`bg-white rounded-3xl p-4 mb-3 border-[1.5px] ${open ? "border-[#007275]/40" : `border-transparent ${CARD_SHADOW}`}`}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
          >
            <View className="flex-row items-center">
              <View className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${open ? "bg-[#007275]" : "bg-[#007275]/10"}`}>
                <Ionicons name="help" size={18} color={open ? "#fff" : "#007275"} />
              </View>
              <Text className="flex-1 font-bold text-[#211f1e] text-[15px] pr-3">{faq.question}</Text>
              <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color="#007275" />
            </View>
            {open && <Text className="text-gray-600 text-sm mt-3 leading-6 ml-12">{faq.answer}</Text>}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
