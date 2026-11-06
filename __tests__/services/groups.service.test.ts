import { groupsService } from "@/services/groups.service";
import { calls, mockTable, resetSupabaseMock, supabaseMock } from "../../test/supabaseMock";

beforeEach(resetSupabaseMock);

describe("groupsService.leave", () => {
  it("removes the user from the group chat and from the group", async () => {
    mockTable("conversations", { data: { id: "c1" } });
    expect(await groupsService.leave("g1", "u1")).toEqual({ success: true });
    expect(calls).toContainEqual({ table: "conversation_participants", method: "delete", args: [] });
    expect(calls).toContainEqual({ table: "conversation_participants", method: "eq", args: ["conversation_id", "c1"] });
    expect(calls).toContainEqual({ table: "conversation_participants", method: "eq", args: ["user_id", "u1"] });
    expect(calls).toContainEqual({ table: "group_members", method: "delete", args: [] });
  });

  it("still leaves the group when it has no chat yet", async () => {
    mockTable("conversations", { data: null });
    expect(await groupsService.leave("g1", "u1")).toEqual({ success: true });
    expect(supabaseMock.from).not.toHaveBeenCalledWith("conversation_participants");
    expect(calls).toContainEqual({ table: "group_members", method: "delete", args: [] });
  });

  it("stays a member when removing the chat participation fails", async () => {
    mockTable("conversations", { data: { id: "c1" } });
    mockTable("conversation_participants", { error: { message: "fallo" } });
    expect(await groupsService.leave("g1", "u1")).toEqual({ success: false, error: "fallo" });
    expect(supabaseMock.from).not.toHaveBeenCalledWith("group_members");
  });
});
