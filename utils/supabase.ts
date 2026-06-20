// utils/supabase.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

// Configuración adaptada para diferentes plataformas
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "your-supabase-url";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
