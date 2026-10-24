import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function pemToBinary(pem: string): Uint8Array {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getAccessToken(
  clientEmail: string,
  privateKey: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const signatureInput = `${encode(header)}.${encode(payload)}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBinary(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signatureInput),
  );

  const jwt = `${signatureInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OAuth2 token error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return data.access_token;
}

interface FcmResult {
  token: string;
  success: boolean;
  error?: string;
  errorCode?: string;
}

async function sendFcmMessage(
  token: string,
  title: string,
  body: string,
  image: string | null | undefined,
  channelId: string | undefined,
  data: Record<string, string> | undefined,
  accessToken: string,
  projectId: string,
): Promise<FcmResult> {
  const notification: Record<string, string> = { title, body };
  if (image) notification.image = image;

  const message: Record<string, unknown> = {
    token,
    notification,
    android: {
      priority: "high",
      notification: {
        channel_id: channelId || "emergency_alerts",
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
  };
  if (data) message.data = data;

  try {
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message }),
      },
    );

    const bodyRes = await res.json().catch(() => ({}));

    if (!res.ok || bodyRes.error) {
      const err = bodyRes.error ?? {};
      const details: { errorCode?: string }[] = Array.isArray(err.details) ? err.details : [];
      const errorCode = details.find((d) => typeof d?.errorCode === "string")?.errorCode;
      return {
        token,
        success: false,
        error: err.message || err.status || `HTTP ${res.status}`,
        errorCode,
      };
    }

    return { token, success: true };
  } catch (e) {
    return { token, success: false, error: e instanceof Error ? e.message : "fetch error" };
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const JSON_HEADERS = { ...CORS_HEADERS, "Content-Type": "application/json" };
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();

// Escapa los comodines de LIKE para que ilike funcione como igualdad sin distinguir mayúsculas
const escapeLike = (v: string) => v.replace(/[\\%_]/g, (c) => `\\${c}`);

const FCM_BATCH_SIZE = 100;

interface Message {
  recipients: string[];
  tokens: string[];
  title: string;
  body: string;
  image?: string | null;
  data: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Solo usuarios autenticados (la anon key no es un usuario)
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: auth } = await supabase.auth.getUser(jwt);
    const caller = auth?.user;
    if (!caller) return respond({ error: "No autenticado" }, 401);

    let input: { type?: unknown; alertId?: unknown; foundId?: unknown } | null;
    try {
      input = await req.json();
    } catch {
      return respond({ error: "JSON inválido" }, 400);
    }
    if (!input || typeof input !== "object") return respond({ error: "JSON inválido" }, 400);

    let message: Message | null = null;

    if (input.type === "emergency") {
      if (typeof input.alertId !== "string" || !input.alertId) {
        return respond({ error: "alertId requerido" }, 400);
      }

      // Reclama la alerta de forma atómica: solo una llamada puede notificarla
      const { data: alert, error: claimError } = await supabase
        .from("emergency_alerts")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", input.alertId)
        .eq("user_id", caller.id)
        .eq("status", "active")
        .is("notified_at", null)
        .select("*")
        .maybeSingle();
      if (claimError) console.error("claim emergency_alerts:", claimError.message);
      if (!alert) return respond({ error: "Alerta ya notificada o no válida" }, 409);

      const { data: owner } = await supabase
        .from("user_profiles")
        .select("first_name, last_name")
        .eq("user_id", caller.id)
        .maybeSingle();
      const ownerName = owner
        ? `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim() || "Un vecino"
        : "Un vecino";

      // Vecinos: misma dirección/colonia (igualdad normalizada), filtrado en SQL
      const location = (alert.last_seen_location ?? "").trim();
      let neighborIds: string[] = [];
      if (location) {
        const { data: profiles, error: profilesError } = await supabase
          .from("user_profiles")
          .select("user_id, address")
          .ilike("address", escapeLike(location))
          .neq("user_id", caller.id);
        if (profilesError) console.error("neighbour lookup:", profilesError.message);
        const target = norm(location);
        neighborIds = (profiles ?? [])
          .filter((p) => norm(p.address) === target)
          .map((p) => p.user_id);
      }

      const recipients = await allowedUsers(supabase, neighborIds, "lost_pet_alerts");
      const tokens = await tokensFor(supabase, recipients);
      message = {
        recipients,
        tokens,
        title: `⚠️ ${ownerName} reportó a ${alert.pet_name} perdida`,
        body: `Vista por última vez en ${location || "tu colonia"}.`,
        image: alert.image_url,
        data: {
          type: "emergency",
          url: `/dashboard?tab=emergency&alertId=${alert.id}`,
          alertId: String(alert.id),
          petName: alert.pet_name ?? "",
          ownerName,
        },
      };
    } else if (input.type === "found") {
      if (typeof input.foundId !== "string" || !input.foundId) {
        return respond({ error: "foundId requerido" }, 400);
      }

      // Reclama el reporte de forma atómica
      const { data: found, error: claimError } = await supabase
        .from("found_pets")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", input.foundId)
        .eq("user_id", caller.id)
        .is("notified_at", null)
        .select("*")
        .maybeSingle();
      if (claimError) console.error("claim found_pets:", claimError.message);
      if (!found || !found.alert_id) {
        return respond({ error: "Reporte ya notificado o no válido" }, 409);
      }

      // Destinatario, nombre e imagen salen de la alerta, no del reporte
      const { data: alert } = await supabase
        .from("emergency_alerts")
        .select("id, user_id, pet_name, image_url, status")
        .eq("id", found.alert_id)
        .maybeSingle();
      if (!alert || alert.status !== "active") {
        return respond({ error: "Alerta no válida" }, 409);
      }
      if (alert.user_id === caller.id) return respond({ succeeded: 0, failed: 0 });

      const { data: finder } = await supabase
        .from("user_profiles")
        .select("first_name, last_name")
        .eq("user_id", caller.id)
        .maybeSingle();
      const finderName = finder
        ? `${finder.first_name ?? ""} ${finder.last_name ?? ""}`.trim() || "Un vecino"
        : "Un vecino";

      const recipients = await allowedUsers(supabase, [alert.user_id], "found_pet_alerts");
      const tokens = await tokensFor(supabase, recipients);
      message = {
        recipients,
        tokens,
        title: `🐾 ${finderName} dice que encontró a ${alert.pet_name ?? "tu mascota"}`,
        body: "Abre la app para ver sus datos de contacto.",
        image: alert.image_url,
        data: {
          type: "found",
          url: `/dashboard?tab=emergency&alertId=${alert.id}`,
          alertId: String(alert.id),
          petName: alert.pet_name ?? "",
        },
      };
    } else {
      return respond({ error: "Tipo no soportado" }, 400);
    }

    const msg = message;

    // Bandeja dentro de la app: se guarda aunque el usuario no tenga token (el reclamo atómico evita duplicados)
    if (msg.recipients.length > 0) {
      const { error: inboxError } = await supabase.from("notifications").insert(
        msg.recipients.map((user_id) => ({ user_id, title: msg.title, body: msg.body, data: msg.data })),
      );
      if (inboxError) console.error("inbox insert:", inboxError.message);
    }

    if (msg.tokens.length === 0) return respond({ succeeded: 0, failed: 0 });

    const serviceAccountRaw = Deno.env.get("FCM_SERVICE_ACCOUNT");
    if (!serviceAccountRaw) {
      console.error("FCM_SERVICE_ACCOUNT not configured");
      return respond({ error: "Error interno" }, 500);
    }
    const sa = JSON.parse(serviceAccountRaw);
    if (!sa.client_email || !sa.private_key || !sa.project_id) {
      console.error("FCM_SERVICE_ACCOUNT missing required fields");
      return respond({ error: "Error interno" }, 500);
    }

    const accessToken = await getAccessToken(sa.client_email, sa.private_key);

    // Lotes secuenciales; dentro de cada lote, envíos en paralelo
    const results: FcmResult[] = [];
    for (let i = 0; i < msg.tokens.length; i += FCM_BATCH_SIZE) {
      const batch = msg.tokens.slice(i, i + FCM_BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((token) =>
          sendFcmMessage(token, msg.title, msg.body, msg.image, "emergency_alerts", msg.data, accessToken, sa.project_id)
        ),
      );
      results.push(...batchResults);
    }

    // Solo borra tokens que FCM reporta como UNREGISTERED (nunca por INVALID_ARGUMENT)
    const dead = results
      .filter((r) => !r.success && r.errorCode === "UNREGISTERED")
      .map((r) => r.token);
    if (dead.length) {
      const { error: delError } = await supabase.from("device_tokens").delete().in("token", dead);
      if (delError) console.error("delete dead tokens:", delError.message);
    }

    const failed = results.filter((r) => !r.success);
    if (failed.length) {
      console.error("FCM failures:", failed.map((r) => r.errorCode ?? r.error).join(", "));
    }

    return respond({
      succeeded: results.length - failed.length,
      failed: failed.length,
    });
  } catch (error) {
    console.error("send-push-notification error:", error instanceof Error ? error.message : error);
    return respond({ error: "Error interno" }, 500);
  }
});

// Usuarios que no desactivaron push ni este tipo de aviso (aplica a push y a la bandeja)
async function allowedUsers(
  supabase: ReturnType<typeof createClient>,
  userIds: string[],
  pref: "lost_pet_alerts" | "found_pet_alerts",
): Promise<string[]> {
  if (userIds.length === 0) return [];
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("user_id, push_enabled, lost_pet_alerts, found_pet_alerts")
    .in("user_id", userIds);
  const muted = new Set(
    (prefs ?? []).filter((p) => p.push_enabled === false || p[pref] === false).map((p) => p.user_id),
  );
  return userIds.filter((id) => !muted.has(id));
}

async function tokensFor(supabase: ReturnType<typeof createClient>, userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const { data: rows } = await supabase.from("device_tokens").select("token").in("user_id", userIds);
  return [...new Set((rows ?? []).map((r) => r.token).filter(Boolean))];
}
