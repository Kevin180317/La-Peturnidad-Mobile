import { notificationsService } from "@/services/notifications.service";
import { calls, mockTable, resetSupabaseMock } from "../../test/supabaseMock";

beforeEach(resetSupabaseMock);

describe("notificationsService inbox", () => {
  it("getInbox returns the user's latest 50, newest first", async () => {
    mockTable("notifications", { data: [{ id: "n1" }] });
    const res = await notificationsService.getInbox("u1");
    expect(res).toEqual({ success: true, data: [{ id: "n1" }] });
    expect(calls).toContainEqual({ table: "notifications", method: "eq", args: ["user_id", "u1"] });
    expect(calls).toContainEqual({ table: "notifications", method: "order", args: ["created_at", { ascending: false }] });
    expect(calls).toContainEqual({ table: "notifications", method: "limit", args: [50] });
  });

  it("getInbox returns error + empty data on failure", async () => {
    mockTable("notifications", { error: { message: "rls" } });
    expect(await notificationsService.getInbox("u1")).toEqual({ success: false, error: "rls", data: [] });
  });

  it("markAllRead only touches this user's unread rows", async () => {
    await notificationsService.markAllRead("u1");
    expect(calls).toContainEqual({ table: "notifications", method: "update", args: [{ read: true }] });
    expect(calls).toContainEqual({ table: "notifications", method: "eq", args: ["user_id", "u1"] });
    expect(calls).toContainEqual({ table: "notifications", method: "eq", args: ["read", false] });
  });
});
