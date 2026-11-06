// utils/supabase.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppState, Platform } from "react-native";

// Configuración adaptada para diferentes plataformas
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan variables de entorno de Supabase: define EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY (en .env.local o en el perfil de eas.json).",
  );
}

// Storage adaptado para web y móvil
const getStorage = () => {
  if (Platform.OS === "web") {
    // Para web, usar localStorage con verificación de window
    return {
      getItem: (key: string) => {
        if (typeof window !== "undefined") {
          return Promise.resolve(localStorage.getItem(key));
        }
        return Promise.resolve(null);
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== "undefined") {
          localStorage.setItem(key, value);
        }
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(key);
        }
        return Promise.resolve();
      },
    };
  }
  // Para móvil, usar AsyncStorage
  return AsyncStorage;
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// En móvil, refrescar el token solo con la app en primer plano (recomendación de Supabase para RN)
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
