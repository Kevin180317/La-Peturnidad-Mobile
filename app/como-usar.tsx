import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";

const STEPS: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}[] = [
  {
    icon: "home",
    title: "Tu centro de control: el Dashboard",
    body: "Al iniciar sesión llegas al Dashboard. La barra inferior te lleva por las 5 secciones: Feed, Inicio, Comunidad, Emergencia y Perfil. Desliza hacia abajo para actualizar todo y usa la lupa para buscar mascotas, grupos y usuarios.",
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
    body: "En Perfil consulta tus estadísticas (mascotas, seguidores, siguiendo), edita tus datos, configura tus notificaciones, accede a Mensajes, Grupos y Reuniones Exitosas, y cierra sesión cuando quieras.",
  },
];

export default function ComoUsarScreen() {
  return (
    <ScrollView
      className="bg-[#faf5e0]"
      contentContainerClassName="p-5 pb-10"
    >
      <Text className="text-2xl font-bold font-[Inter\_700Bold] text-[#211f1e] mb-1">
        ¿Cómo funciona Lucky Tracker?
      </Text>
      <Text className="text-gray-500 font-[Inter\_400Regular] mb-6">
        Aprende en minutos cómo registrar tus mascotas, reportar emergencias y
        conectar con tu comunidad.
      </Text>

      {STEPS.map((step, index) => (
        <View
          key={step.title}
          className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(33,31,30,0.08)] p-5 mb-4 flex-row"
        >
          <View className="items-center mr-4">
            <View className="w-11 h-11 rounded-full bg-[#005e66] items-center justify-center">
              <Text className="text-white font-bold font-[Inter\_700Bold]">
                {index + 1}
              </Text>
            </View>
            {index < STEPS.length - 1 && (
              <View className="flex-1 w-[2px] bg-[#211f1e]/10 mt-2" />
            )}
          </View>
          <View className="flex-1 pb-2">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name={step.icon} size={18} color="#005e66" />
              <Text className="flex-1 font-bold font-[Inter\_700Bold] text-[#211f1e] text-base">
                {step.title}
              </Text>
            </View>
            <Text className="text-gray-500 font-[Inter\_400Regular] leading-relaxed">
              {step.body}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
