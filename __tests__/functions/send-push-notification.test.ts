// La edge function es código Deno: se carga con Deno/jsr simulados y el cliente de supabase de test/supabaseMock.
/* eslint-disable @typescript-eslint/no-require-imports */
import { calls, mockTable, resetSupabaseMock, supabaseMock } from "../../test/supabaseMock";

const mockCreateClient = jest.fn();
jest.mock("jsr:@supabase/functions-js/edge-runtime.d.ts", () => ({}), { virtual: true });
jest.mock("jsr:@supabase/supabase-js@2", () => ({ createClient: (...args: unknown[]) => mockCreateClient(...args) }), {
  virtual: true,
});

type Handler = (req: unknown) => Promise<{ status: number; json: () => Promise<any> }>;
let handler: Handler;

const FCM_ACCOUNT = JSON.stringify({
  client_email: "svc@project.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nQUJD\n-----END PRIVATE KEY-----",
  project_id: "proj",
});

beforeAll(() => {
  const env: Record<string, string> = {
    SUPABASE_URL: "https://x.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    FCM_SERVICE_ACCOUNT: FCM_ACCOUNT,
  };
  (globalThis as any).Deno = {
    env: { get: (key: string) => env[key] },
    serve: (fn: Handler) => {
      handler = fn;
    },
  };
  jest.isolateModules(() => {
    require("../../supabase/functions/send-push-notification/index");
  });
});

// Respuesta de FCM por token: "ok", "unregistered" (token muerto) o "invalid" (error de payload)
let fcmOutcome: Record<string, "ok" | "unregistered" | "invalid">;
let sentTokens: string[];

beforeEach(() => {
  resetSupabaseMock();
  mockCreateClient.mockReturnValue(supabaseMock);
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: "caller" } } });
  jest.spyOn(console, "error").mockImplementation(() => {});

  (globalThis as any).crypto = {
    subtle: {
      importKey: jest.fn().mockResolvedValue({}),
      sign: jest.fn().mockResolvedValue(new ArrayBuffer(4)),
    },
  };
  fcmOutcome = {};
  sentTokens = [];
  global.fetch = jest.fn(async (url: string, init?: { body?: unknown }) => {
    if (String(url).includes("oauth2")) {
      return { ok: true, json: async () => ({ access_token: "at" }), text: async () => "" };
    }
    const token = JSON.parse(String(init?.body)).message.token as string;
    sentTokens.push(token);
    const outcome = fcmOutcome[token] ?? "ok";
    if (outcome === "ok") return { ok: true, json: async () => ({ name: "msg" }) };
    const errorCode = outcome === "unregistered" ? "UNREGISTERED" : "INVALID_ARGUMENT";
    return {
      ok: false,
      status: 400,
      json: async () => ({ error: { message: errorCode, status: errorCode, details: [{ errorCode }] } }),
    };
  }) as unknown as typeof fetch;
});

afterEach(() => jest.restoreAllMocks());

const request = (body: unknown, opts: { badJson?: boolean } = {}) => ({
  method: "POST",
  headers: { get: (key: string) => (key === "Authorization" ? "Bearer jwt" : null) },
  json: async () => {
    if (opts.badJson) throw new SyntaxError("bad json");
    return body;
  },
});

const call = async (body: unknown, opts?: { badJson?: boolean }) => {
  const res = await handler(request(body, opts));
  return { status: res.status, body: await res.json() };
};

const inboxInserts = () => calls.filter((c) => c.table === "notifications" && c.method === "insert");

describe("send-push-notification: request validation", () => {
  it("rejects callers without a user", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });
    expect((await call({ type: "emergency", alertId: "a1" })).status).toBe(401);
  });

  it("rejects an invalid JSON body", async () => {
    expect((await call(null, { badJson: true })).status).toBe(400);
  });

  it("rejects an unknown type", async () => {
    expect((await call({ type: "spam" })).status).toBe(400);
  });
});

describe("send-push-notification: emergency", () => {
  const alert = { id: "a1", pet_name: "Luna", image_url: null, last_seen_location: "Col. Centro" };

  it("refuses an alert that was already notified or is not the caller's", async () => {
    mockTable("emergency_alerts", { data: null });
    const res = await call({ type: "emergency", alertId: "a1" });
    expect(res.status).toBe(409);
    expect(inboxInserts()).toHaveLength(0);
  });

  it("only reaches exact-colonia neighbours who did not mute alerts, and saves them in the inbox", async () => {
    mockTable("emergency_alerts", { data: alert });
    mockTable(
      "user_profiles",
      { data: { first_name: "Ana", last_name: "Gómez" } },
      {
        data: [
          { user_id: "n1", address: "Col. Centro" },
          { user_id: "n2", address: " col. centro " },
          { user_id: "n3", address: "Col. Centro Norte" },
        ],
      },
    );
    mockTable("notification_preferences", { data: [{ user_id: "n2", push_enabled: false }] });
    mockTable("device_tokens", { data: [] });

    const res = await call({ type: "emergency", alertId: "a1" });

    expect(res).toEqual({ status: 200, body: { succeeded: 0, failed: 0 } });
    expect(inboxInserts()).toHaveLength(1);
    const rows = inboxInserts()[0].args[0] as { user_id: string; title: string; data: { alertId: string } }[];
    expect(rows.map((r) => r.user_id)).toEqual(["n1"]);
    expect(rows[0].title).toContain("Ana Gómez");
    expect(rows[0].data.alertId).toBe("a1");
  });

  it("pushes to every token and cleans up only UNREGISTERED ones", async () => {
    mockTable("emergency_alerts", { data: alert });
    mockTable(
      "user_profiles",
      { data: { first_name: "Ana", last_name: "Gómez" } },
      { data: [{ user_id: "n1", address: "Col. Centro" }] },
    );
    mockTable("device_tokens", { data: [{ token: "ok" }, { token: "dead" }, { token: "bad" }] });
    fcmOutcome = { dead: "unregistered", bad: "invalid" };

    const res = await call({ type: "emergency", alertId: "a1" });

    expect(res).toEqual({ status: 200, body: { succeeded: 1, failed: 2 } });
    expect(sentTokens.sort()).toEqual(["bad", "dead", "ok"]);
    expect(calls).toContainEqual({ table: "device_tokens", method: "in", args: ["token", ["dead"]] });
    expect(calls.some((c) => c.table === "device_tokens" && c.method === "in" && JSON.stringify(c.args).includes('"bad"') && c.args[0] === "token")).toBe(false);
  });
});

describe("send-push-notification: found", () => {
  const found = { id: "f1", alert_id: "a1" };

  it("refuses a report that was already notified", async () => {
    mockTable("found_pets", { data: null });
    expect((await call({ type: "found", foundId: "f1" })).status).toBe(409);
  });

  it("refuses when the alert is no longer active", async () => {
    mockTable("found_pets", { data: found });
    mockTable("emergency_alerts", { data: { id: "a1", user_id: "owner", pet_name: "Luna", status: "resolved" } });
    expect((await call({ type: "found", foundId: "f1" })).status).toBe(409);
  });

  it("notifies the alert owner using the alert's data, not the finder's", async () => {
    mockTable("found_pets", { data: { ...found, pet_name: "TEXTO MALICIOSO" } });
    mockTable("emergency_alerts", {
      data: { id: "a1", user_id: "owner", pet_name: "Luna", image_url: null, status: "active" },
    });
    mockTable("user_profiles", { data: { first_name: "Beto", last_name: "Ruiz" } });
    mockTable("device_tokens", { data: [{ token: "owner-phone" }] });

    const res = await call({ type: "found", foundId: "f1" });

    expect(res).toEqual({ status: 200, body: { succeeded: 1, failed: 0 } });
    const rows = inboxInserts()[0].args[0] as { user_id: string; title: string }[];
    expect(rows.map((r) => r.user_id)).toEqual(["owner"]);
    expect(rows[0].title).toContain("Luna");
    expect(rows[0].title).not.toContain("MALICIOSO");
    expect(sentTokens).toEqual(["owner-phone"]);
  });
});
