import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

// getUser() valida contra el servidor y sin red devuelve user = null: eso no significa que la sesión
// terminó, así que ante un fallo de red se usa la sesión guardada en el dispositivo
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (data.user || !isAuthRetryableFetchError(error)) return { data: { user: data.user } };
  const { data: stored } = await supabase.auth.getSession();
  return { data: { user: stored.session?.user ?? null } };
}
