import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface NotificationPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

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
  data: Record<string, string> | undefined,
  accessToken: string,
  projectId: string,
): Promise<FcmResult> {
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

  const bodyRes = await res.json();

  if (bodyRes.error) {
    return { token, success: false, error: bodyRes.error.message || bodyRes.error.status };
  }

  return { token, success: true };
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
    if (!sa.client_email || !sa.private_key || !sa.project_id) {
      return new Response(
        JSON.stringify({ error: "FCM_SERVICE_ACCOUNT missing required fields (client_email, private_key, project_id)" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const accessToken = await getAccessToken(sa.client_email, sa.private_key);

    const results = await Promise.all(
      payload.tokens.map((token) =>
        sendFcmMessage(token, payload.title, payload.body, payload.data, accessToken, sa.project_id)
      ),
    );

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const details = results.filter((r) => !r.success).map((r) => ({
      token: r.token.slice(0, 8) + "...",
      error: r.error,
    }));

    return new Response(
      JSON.stringify({ succeeded, failed, details }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
