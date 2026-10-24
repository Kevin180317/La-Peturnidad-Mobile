import { alertsService } from "@/services/alerts.service";
import { calls, mockTable, resetSupabaseMock } from "../../test/supabaseMock";

const alertData = {
  user_id: "u1",
  pet_name: "Luna",
  type: "perro",
  description: "d",
  image_url: null,
  last_seen_location: "Centro",
  disappearance_date: "2024-01-01",
} as any;

const fetchMock = jest.fn();

beforeEach(() => {
  resetSupabaseMock();
  fetchMock.mockReset();
  (global as any).fetch = fetchMock;
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("alertsService.create", () => {
  it("creates alert and pushes to neighbors with tokens", async () => {
    mockTable("emergency_alerts", { data: { id: "a1", image_url: null } });
    mockTable(
      "user_profiles",
      { data: { first_name: "Ana", last_name: "Lopez" } },
      { data: [{ fcm_token: "t1" }, { fcm_token: null }, { fcm_token: "t2" }] },
    );
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    const res = await alertsService.create(alertData);

    expect(res.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.tokens).toEqual(["t1", "t2"]);
    expect(body.title).toContain("Ana Lopez");
    expect(body.data.alertId).toBe("a1");
    expect(body.channelId).toBe("emergency_alerts");
  });

  it("skips profile lookup when ownerName given", async () => {
    mockTable("emergency_alerts", { data: { id: "a1" } });
    mockTable("user_profiles", { data: [{ fcm_token: "t1" }] });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    await alertsService.create(alertData, "Bob");

    expect(calls.filter((c) => c.table === "user_profiles" && c.method === "single")).toHaveLength(0);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).data.ownerName).toBe("Bob");
  });

  it("does not call edge function when no neighbors have tokens", async () => {
    mockTable("emergency_alerts", { data: { id: "a1" } });
    mockTable("user_profiles", { data: null }, { data: [] });

    const res = await alertsService.create(alertData);

    expect(res.success).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still succeeds when push fails", async () => {
    mockTable("emergency_alerts", { data: { id: "a1" } });
    mockTable("user_profiles", { data: null }, { data: [{ fcm_token: "t1" }] });
    fetchMock.mockRejectedValue(new Error("offline"));

    expect((await alertsService.create(alertData)).success).toBe(true);
  });

  it("fails when insert errors, without notifying", async () => {
    mockTable("emergency_alerts", { error: { message: "rls" } });

    expect(await alertsService.create(alertData)).toEqual({ success: false, error: "rls" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("alertsService.getByLocation", () => {
  it("joins owner info and falls back for missing profiles", async () => {
    mockTable("emergency_alerts", {
      data: [
        { id: "a1", user_id: "u1", pet_name: "Luna" },
        { id: "a2", user_id: "u2", pet_name: "Rex" },
      ],
    });
    mockTable("user_profiles", {
      data: [{ user_id: "u1", first_name: "Ana", last_name: "Lopez", phone: "555", address: "Centro" }],
    });

    const res = await alertsService.getByLocation("Centro");

    expect(res.data![0]).toMatchObject({ owner_name: "Ana Lopez", owner_phone: "555" });
    expect(res.data![1]).toMatchObject({
      owner_name: "Usuario",
      owner_phone: "No disponible",
      owner_address: "No disponible",
    });
  });

  it("returns [] early when no alerts", async () => {
    mockTable("emergency_alerts", { data: [] });
    expect(await alertsService.getByLocation("X")).toEqual({ success: true, data: [] });
  });
});

describe("alertsService misc", () => {
  it("getFoundPetsByUser maps pet name/image with fallback", async () => {
    mockTable("found_pets", { data: [{ id: "f1", pet_id: "p1", created_at: "c" }, { id: "f2", pet_id: "p9", created_at: "c" }] });
    mockTable("pets", { data: [{ id: "p1", name: "Luna", image_url: "i.jpg" }] });

    const res = await alertsService.getFoundPetsByUser("u1");

    expect(res.data).toEqual([
      { id: "f1", pet_id: "p1", pet_name: "Luna", image_url: "i.jpg", created_at: "c" },
      { id: "f2", pet_id: "p9", pet_name: "Mascota", image_url: null, created_at: "c" },
    ]);
  });

  it("checkIfPetIsFound reflects row presence", async () => {
    mockTable("found_pets", { data: { id: "f1" } });
    expect((await alertsService.checkIfPetIsFound("p1")).isFound).toBe(true);
    mockTable("found_pets", { data: null });
    expect((await alertsService.checkIfPetIsFound("p1")).isFound).toBe(false);
  });

  it("delete surfaces error", async () => {
    mockTable("emergency_alerts", { error: { message: "nope" } });
    expect(await alertsService.delete("a1")).toEqual({ success: false, error: "nope" });
  });
});
