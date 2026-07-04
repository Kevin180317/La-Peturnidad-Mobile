import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface NotificationPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface FcmResponse {
  name?: string;
  error?: { code: number; message: string; status: string };
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
    new TextEncoder().encode(privateKey).buffer as ArrayBuffer,
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

  const data = await res.json();
  return data.access_token;
}

async function sendFcmMessage(
  token: string,
  title: string,
  body: string,
  data: Record<string, string> | undefined,
  accessToken: string,
  projectId: string,
): Promise<FcmResponse> {
  const message: Record<string, unknown> = {
    token,
    notification: { title, body },
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

  return res.json();
}

Deno.serve(async (req) => {
  try {
    const payload: NotificationPayload = await req.json();

    if (!payload.tokens?.length || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: tokens, title, body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const serviceAccountRaw = Deno.env.get("FCM_SERVICE_ACCOUNT");
    if (!serviceAccountRaw) {
      return new Response(
        JSON.stringify({ error: "FCM_SERVICE_ACCOUNT not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const sa = JSON.parse(serviceAccountRaw);
    const accessToken = await getAccessToken(sa.client_email, sa.private_key);

    const results = await Promise.allSettled(
      payload.tokens.map((token) =>
        sendFcmMessage(token, payload.title, payload.body, payload.data, accessToken, sa.project_id)
      ),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return new Response(
      JSON.stringify({ succeeded, failed }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
