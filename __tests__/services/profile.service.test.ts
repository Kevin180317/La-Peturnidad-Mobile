import { profileService } from "@/services/profile.service";
import { calls, mockTable, resetSupabaseMock } from "../../test/supabaseMock";

beforeEach(resetSupabaseMock);

describe("profileService.getPublicByUserId", () => {
  it("reads only from the public_profiles view", async () => {
    mockTable("public_profiles", {
      data: { user_id: "u2", first_name: "Ana", last_name: null, profile_picture_url: null, city: null, role: "user" },
    });
    const res = await profileService.getPublicByUserId("u2");
    expect(calls).toContainEqual({ table: "public_profiles", method: "eq", args: ["user_id", "u2"] });
    expect(calls.filter((c) => c.table === "user_profiles")).toEqual([]);
    expect(res).toMatchObject({ success: true, data: { first_name: "Ana", last_name: null, city: null } });
  });

  it("returns no data when the profile does not exist", async () => {
    mockTable("public_profiles", { data: null });
    expect(await profileService.getPublicByUserId("nope")).toEqual({ success: true, data: undefined });
  });

  it("reports the error", async () => {
    mockTable("public_profiles", { error: { message: "boom" } });
    expect(await profileService.getPublicByUserId("u2")).toEqual({ success: false, error: "boom", data: undefined });
  });
});
