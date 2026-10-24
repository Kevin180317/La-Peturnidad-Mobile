import { matchingService } from "@/services/matching.service";
import { mockTable, resetSupabaseMock } from "../../test/supabaseMock";

const alert = {
  id: "a1",
  user_id: "u1",
  pet_name: "Luna",
  type: "dog",
  last_seen_location: "Parque Centro",
  image_url: "alert.jpg",
};

const found = (pet: object) => ({
  id: "f1",
  user_id: "u2",
  pets: pet,
});

beforeEach(() => {
  resetSupabaseMock();
  mockTable("user_profiles", {
    data: { first_name: "Ana", last_name: "Lopez", phone: "555" },
  });
});

describe("matchingService.findMatches", () => {
  it("scores name + type + photo and sorts best first", async () => {
    mockTable("emergency_alerts", { data: [alert] });
    mockTable("found_pets", {
      data: [
        found({ name: "Rex", type: "dog", image_url: null }),
        found({ name: "luna", type: "dog", image_url: "p.jpg" }),
      ],
    });

    const res = await matchingService.findMatches();

    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(2);
    expect(res.data![0].score).toBe(60); // name 30 + type 20 + photos 10
    expect(res.data![0].reasons).toEqual([
      "Mismo nombre",
      "Mismo tipo",
      "Ambos tienen foto",
    ]);
    expect(res.data![1].score).toBe(20);
    expect(res.data![0].alert_owner_name).toBe("Ana Lopez");
    expect(res.data![0].alert_owner_phone).toBe("555");
  });

  it("matches location/features by substring either way", async () => {
    mockTable("emergency_alerts", { data: [alert] });
    mockTable("found_pets", {
      data: [found({ name: "X", type: "cat", features: "centro", image_url: null })],
    });

    const res = await matchingService.findMatches();

    expect(res.data).toHaveLength(1);
    expect(res.data![0].reasons).toEqual(["Misma ubicación/color"]);
  });

  it("skips non-matching pairs and found rows without pet", async () => {
    mockTable("emergency_alerts", { data: [alert] });
    mockTable("found_pets", {
      data: [found({ name: "X", type: "cat", image_url: null }), { id: "f2", pets: null }],
    });

    const res = await matchingService.findMatches();

    expect(res).toEqual({ success: true, data: [] });
  });

  it("falls back when owner profile missing", async () => {
    mockTable("user_profiles", { data: null });
    mockTable("emergency_alerts", { data: [alert] });
    mockTable("found_pets", {
      data: [found({ name: "Luna", type: "dog", image_url: null })],
    });

    const res = await matchingService.findMatches();

    expect(res.data![0].alert_owner_name).toBe("Usuario");
    expect(res.data![0].alert_owner_phone).toBe("No disponible");
  });

  it("returns empty when a query yields null data", async () => {
    mockTable("emergency_alerts", { data: null });
    mockTable("found_pets", { data: [] });

    expect(await matchingService.findMatches()).toEqual({ success: true, data: [] });
  });
});
