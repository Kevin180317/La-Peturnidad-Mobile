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

    // Solo los chats 1:1 de ESTE usuario se borran con su cuenta
    const { data: myParticipations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", caller.id);
    const myConvIds = (myParticipations ?? []).map((p) => p.conversation_id);
    const { data: myDirectConvs } = myConvIds.length
      ? await supabase.from("conversations").select("id").in("id", myConvIds).is("group_id", null)
      : { data: [] };

    // reports.reviewed_by referencia auth.users: si queda, deleteUser falla para moderadores
    const { error: reviewedError } = await supabase
      .from("reports")
      .update({ reviewed_by: null })
      .eq("reviewed_by", caller.id);
    if (reviewedError) throw new Error(`reports.reviewed_by: ${reviewedError.message}`);

    // Comentarios de otros en publicaciones del usuario: sin FK, quedarían huérfanos
    for (const [table, targetType] of [
      ["posts", "post"],
      ["announcements", "announcement"],
      ["emergency_alerts", "alert"],
    ]) {
      const { data: owned } = await supabase.from(table).select("id").eq("user_id", caller.id);
      const ids = (owned ?? []).map((r) => r.id);
      if (ids.length) {
        const { error } = await supabase
          .from("comments")
          .delete()
          .eq("target_type", targetType)
          .in("target_id", ids);
        if (error) throw new Error(`comments.${targetType}: ${error.message}`);
      }
    }

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

    // Chats 1:1 de este usuario (guardados antes de borrar sus participaciones)
    const directIds = (myDirectConvs ?? []).map((c) => c.id);
    if (directIds.length) await supabase.from("conversations").delete().in("id", directIds);

    // list devuelve máximo 1000 archivos por llamada: se repite hasta vaciar la carpeta
    for (const bucket of BUCKETS) {
      for (let page = 0; page < 100; page++) {
        const { data: files } = await supabase.storage.from(bucket).list(caller.id, { limit: 1000 });
        if (!files?.length) break;
        const { error } = await supabase.storage
          .from(bucket)
          .remove(files.map((f) => `${caller.id}/${f.name}`));
        if (error) throw new Error(`storage ${bucket}: ${error.message}`);
      }
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(caller.id);
    if (deleteError) throw deleteError;

    return respond({ success: true });
  } catch (error) {
    console.error("delete-account failed", error);
    return respond({ error: "No se pudo eliminar la cuenta" }, 500);
  }
});
