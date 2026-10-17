import { followsService } from "@/services/follows.service";
import { calls, mockTable, resetSupabaseMock } from "../../test/supabaseMock";

beforeEach(resetSupabaseMock);

describe("followsService", () => {
  it("isFollowing true/false by row presence", async () => {
    mockTable("follows", { data: { id: "1" } });
    expect(await followsService.isFollowing("a", "b")).toBe(true);
    mockTable("follows", { data: null });
    expect(await followsService.isFollowing("a", "b")).toBe(false);
  });

  it("follow inserts pair; error surfaced", async () => {
    mockTable("follows", { error: null });
    expect(await followsService.follow("a", "b")).toEqual({ success: true });
    expect(calls).toContainEqual({
      table: "follows",
      method: "insert",
      args: [[{ follower_id: "a", following_id: "b" }]],
    });
    mockTable("follows", { error: { message: "dup" } });
    expect(await followsService.follow("a", "b")).toEqual({ success: false, error: "dup" });
  });

  it("unfollow deletes by both ids", async () => {
    mockTable("follows", { error: null });
    expect(await followsService.unfollow("a", "b")).toEqual({ success: true });
    expect(calls).toContainEqual({ table: "follows", method: "eq", args: ["follower_id", "a"] });
    expect(calls).toContainEqual({ table: "follows", method: "eq", args: ["following_id", "b"] });
  });

  it("getFollowers / getFollowing default to []", async () => {
    mockTable("follows", { data: null });
    expect((await followsService.getFollowers("u")).data).toEqual([]);
    expect((await followsService.getFollowing("u")).data).toEqual([]);
  });
});
