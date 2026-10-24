import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Borra la cuenta de quien llama: sus filas en public, sus archivos en Storage y su usuario de Auth.
// Requisito de Google Play: el usuario debe poder eliminar su cuenta desde la app.

const JSON_HEADERS = { "Content-Type": "application/json" };
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

// Tablas sin FK a auth.users: hay que limpiarlas a mano (orden: hijos antes que padres)
const OWNED_ROWS: [table: string, column: string][] = [
  ["messages", "sender_id"],
  ["conversation_participants", "user_id"],
  ["comments", "user_id"],
  ["found_pets", "user_id"],
  ["found_pets", "alert_owner_id"],
  ["emergency_alerts", "user_id"],
  ["pets", "user_id"],
  ["posts", "user_id"],
  ["announcements", "user_id"],
  ["success_stories", "user_id"],
  ["follows", "follower_id"],
  ["follows", "following_id"],
  ["blocks", "blocker_id"],
  ["blocks", "blocked_id"],
  ["reports", "reporter_id"],
  ["reports", "target_user_id"],
  ["group_members", "user_id"],
  ["groups", "created_by"],
  ["notifications", "user_id"],
  ["notification_preferences", "user_id"],
  ["device_tokens", "user_id"],
  ["user_profiles", "user_id"],
];

const BUCKETS = ["pet-images", "profile-pictures", "posts"];

Deno.serve(async (req) => {
  if (req.method !== "POST") return respond({ error: "Método no permitido" }, 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: auth } = await supabase.auth.getUser(jwt);
    const caller = auth?.user;
    if (!caller) return respond({ error: "No autenticado" }, 401);

    // Conversaciones de grupo del usuario: se van con sus grupos (cascade a mensajes/participantes)
    const { data: ownedGroups } = await supabase.from("groups").select("id").eq("created_by", caller.id);
    const groupIds = (ownedGroups ?? []).map((g) => g.id);
    if (groupIds.length) {
      await supabase.from("conversations").delete().in("group_id", groupIds);
      await supabase.from("group_members").delete().in("group_id", groupIds);
    }

    for (const [table, column] of OWNED_ROWS) {
      const { error } = await supabase.from(table).delete().eq(column, caller.id);
      if (error) throw new Error(`${table}.${column}: ${error.message}`);
    }

    // Conversaciones 1:1 que quedaron con un solo participante
    const { data: convs } = await supabase
      .from("conversations")
      .select("id, conversation_participants(count)")
      .is("group_id", null);
    const orphanIds = (convs ?? [])
      .filter((c) => (c.conversation_participants as { count: number }[])[0]?.count < 2)
      .map((c) => c.id);
    if (orphanIds.length) await supabase.from("conversations").delete().in("id", orphanIds);

    for (const bucket of BUCKETS) {
      const { data: files } = await supabase.storage.from(bucket).list(caller.id, { limit: 1000 });
      const paths = (files ?? []).map((f) => `${caller.id}/${f.name}`);
      if (paths.length) await supabase.storage.from(bucket).remove(paths);
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(caller.id);
    if (deleteError) throw deleteError;

    return respond({ success: true });
  } catch (error) {
    console.error("delete-account failed", error);
    return respond({ error: "No se pudo eliminar la cuenta" }, 500);
  }
});
