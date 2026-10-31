import { Ionicons } from "@expo/vector-icons";
import { CARD } from "@/components/kit/Kit";
import { ScrollView, Text, View } from "react-native";

const STEPS: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}[] = [
  {
    icon: "home",
    title: "Tu centro de control: el Dashboard",
    body: "Al iniciar sesión llegas al Dashboard. La barra inferior te lleva por las 5 secciones: Inicio, Feed, Emergencia, Mensajes y Perfil. Desliza hacia abajo para actualizar todo y usa la lupa para buscar mascotas, grupos y usuarios.",
  },
  {
    icon: "paw",
    title: "Registra tus mascotas",
    body: "En la sección Inicio encontrarás tarjetas resumen (mascotas, alertas, encontradas) y tus herramientas de mascotas. Toca \"Registrar mascota\" y completa tipo (perro/gato), nombre, color, tamaño, características y foto. Toca una mascota para abrir su ficha, donde puedes editarla o eliminarla.",
  },
  {
    icon: "warning",
    title: "Reporta una mascota perdida",
    body: "Desde la pestaña de Emergencia elige \"Reportar mascota perdida\", selecciona a una de tus mascotas y confirma. La alerta se publica para todos los vecinos de tu colonia y reciben una notificación push al instante. Consulta \"Mis alertas\" cuando quieras y elimínala cuando tu mascota vuelva a casa.",
  },
  {
    icon: "checkmark-circle",
    title: "¿Encontraste una mascota perdida?",
    body: "Si ves a una mascota perdida, toca \"Lo encontré\". Al confirmar, te pondremos en contacto con el dueño y la mascota quedará registrada en encontradas.",
  },
  {
    icon: "newspaper",
    title: "Comparte con la comunidad: Feed",
    body: "Publica mensajes para toda la comunidad en la sección Feed: escribe tu publicación con \"Publicar\", comenta en las publicaciones de otros y revisa lo que has publicado en Mis posts.",
  },
  {
    icon: "chatbubbles",
    title: "Avisos vecinales: Comunidad",
    body: "En Comunidad encuentras avisos por categoría: general, aviso, evento o pregunta. Crea el tuyo con \"Nuevo\" y publícalo tras validar título y contenido.",
  },
  {
    icon: "person",
    title: "Tu perfil y ajustes",
    body: "En Perfil consulta tus estadísticas (mascotas, seguidores, siguiendo), edita tus datos y tu foto, configura tus notificaciones, accede a Mensajes, Grupos y Reuniones Exitosas, cierra sesión o elimina tu cuenta de forma permanente.",
  },
];

export default function ComoUsarScreen() {
  return (
    <ScrollView className="bg-[#faf5e0]" contentContainerClassName="p-5 pb-10">
      <View className="bg-[#007275] rounded-3xl p-5 mb-6 overflow-hidden shadow-[0_8px_24px_rgba(0,114,117,0.3)]">
        <Ionicons name="paw" size={110} color="rgba(255,255,255,0.1)" style={{ position: "absolute", right: -18, bottom: -24, transform: [{ rotate: "-20deg" }] }} />
        <Text className="text-white text-2xl font-bold">¿Cómo funciona Lucky Tracker?</Text>
        <Text className="text-white/85 mt-1.5 leading-5">
          Aprende en minutos cómo registrar tus mascotas, reportar emergencias y conectar con tu comunidad.
        </Text>
      </View>

      {STEPS.map((step, index) => (
        <View key={step.title} className={`${CARD} p-4 mb-3 flex-row`}>
          <View className="w-12 h-12 rounded-2xl bg-[#007275]/10 items-center justify-center mr-4">
            <Ionicons name={step.icon} size={22} color="#007275" />
          </View>
          <View className="flex-1">
            <Text className="text-[11px] font-bold text-[#007275] uppercase tracking-wider">Paso {index + 1}</Text>
            <Text className="font-bold text-[#211f1e] text-base mt-0.5 mb-1.5">{step.title}</Text>
            <Text className="text-gray-600 text-sm leading-5">{step.body}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
