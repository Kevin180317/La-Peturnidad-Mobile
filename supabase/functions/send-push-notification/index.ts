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

  const bodyRes = await res.json();

  if (bodyRes.error) {
    return { token, success: false, error: bodyRes.error.message || bodyRes.error.status };
  }

  return { token, success: true };
}

const JSON_HEADERS = { "Content-Type": "application/json" };
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();

interface Message {
  tokens: string[];
  title: string;
  body: string;
  image?: string | null;
  data: Record<string, string>;
}

Deno.serve(async (req) => {
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

    const input = await req.json();
    let message: Message | null = null;

    if (input.type === "emergency") {
      const { data: alert } = await supabase
        .from("emergency_alerts")
        .select("*")
        .eq("id", input.alertId)
        .maybeSingle();
      if (!alert || alert.user_id !== caller.id || alert.status !== "active") {
        return respond({ error: "Alerta no válida" }, 403);
      }

      const { data: owner } = await supabase
        .from("user_profiles")
        .select("first_name, last_name")
        .eq("user_id", caller.id)
        .maybeSingle();
      const ownerName = owner ? `${owner.first_name} ${owner.last_name}`.trim() : "Un vecino";

      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, address")
        .neq("user_id", caller.id);
      const target = norm(alert.last_seen_location);
      const neighborIds = (profiles ?? [])
        .filter((p) => norm(p.address) === target)
        .map((p) => p.user_id);

      const tokens = await tokensFor(supabase, neighborIds, "lost_pet_alerts");
      message = {
        tokens,
        title: `⚠️ ${ownerName} reportó a ${alert.pet_name} perdida`,
        body: `Vista por última vez en ${alert.last_seen_location}.`,
        image: alert.image_url,
        data: {
          type: "emergency",
          url: `/dashboard?tab=emergency&alertId=${alert.id}`,
          alertId: alert.id,
          petName: alert.pet_name,
          ownerName,
        },
      };
    } else if (input.type === "found") {
      const { data: found } = await supabase
        .from("found_pets")
        .select("*")
        .eq("id", input.foundId)
        .maybeSingle();
      if (!found || found.user_id !== caller.id || !found.alert_owner_id) {
        return respond({ error: "Reporte no válido" }, 403);
      }

      const { data: finder } = await supabase
        .from("user_profiles")
        .select("first_name, last_name")
        .eq("user_id", caller.id)
        .maybeSingle();
      const finderName = finder ? `${finder.first_name} ${finder.last_name}`.trim() : "Un vecino";

      const tokens = await tokensFor(supabase, [found.alert_owner_id], "found_pet_alerts");
      message = {
        tokens,
        title: `🐾 ${finderName} dice que encontró a ${found.pet_name ?? "tu mascota"}`,
        body: "Abre la app para ver sus datos de contacto.",
        image: found.image_url,
        data: {
          type: "found",
          url: `/dashboard?tab=emergency&alertId=${found.alert_id ?? ""}`,
          alertId: found.alert_id ?? "",
          petName: found.pet_name ?? "",
        },
      };
    } else {
      return respond({ error: "Tipo no soportado" }, 400);
    }

    if (message.tokens.length === 0) return respond({ succeeded: 0, failed: 0, details: [] });

    const serviceAccountRaw = Deno.env.get("FCM_SERVICE_ACCOUNT");
    if (!serviceAccountRaw) return respond({ error: "FCM_SERVICE_ACCOUNT not configured" }, 500);
    const sa = JSON.parse(serviceAccountRaw);
    if (!sa.client_email || !sa.private_key || !sa.project_id) {
      return respond({ error: "FCM_SERVICE_ACCOUNT missing required fields" }, 500);
    }

    const accessToken = await getAccessToken(sa.client_email, sa.private_key);
    const results = await Promise.all(
      message.tokens.map((token) =>
        sendFcmMessage(token, message!.title, message!.body, message!.image, "emergency_alerts", message!.data, accessToken, sa.project_id)
      ),
    );

    // Limpia tokens que FCM ya no reconoce
    const dead = results.filter((r) => !r.success && /UNREGISTERED|NOT_FOUND|INVALID_ARGUMENT/.test(r.error ?? "")).map((r) => r.token);
    if (dead.length) await supabase.from("device_tokens").delete().in("token", dead);

    return respond({
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

// Tokens de los usuarios que no desactivaron push ni este tipo de aviso
async function tokensFor(
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
  const { data: rows } = await supabase
    .from("device_tokens")
    .select("user_id, token")
    .in("user_id", userIds.filter((id) => !muted.has(id)));
  return [...new Set((rows ?? []).map((r) => r.token).filter(Boolean))];
}
