import { reportsService } from "@/services/reports.service";
import { mockTable, resetSupabaseMock, supabaseMock } from "../../test/supabaseMock";

beforeEach(resetSupabaseMock);

describe("reportsService.getHiddenUserIds", () => {
  it("returns the union from the RPC without duplicates", async () => {
    supabaseMock.rpc.mockResolvedValueOnce({ data: ["a", "b", "a"], error: null });
    expect(await reportsService.getHiddenUserIds("me")).toEqual({ success: true, data: ["a", "b"] });
    expect(supabaseMock.rpc).toHaveBeenCalledWith("get_hidden_user_ids");
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("falls back to the users I blocked when the RPC fails", async () => {
    supabaseMock.rpc.mockResolvedValueOnce({ data: null, error: { message: "function does not exist" } });
    mockTable("blocks", { data: [{ blocked_id: "x" }, { blocked_id: "y" }] });
    expect(await reportsService.getHiddenUserIds("me")).toEqual({ success: true, data: ["x", "y"] });
    expect(supabaseMock.from).toHaveBeenCalledWith("blocks");
  });

  it("treats an empty RPC result as nobody hidden", async () => {
    supabaseMock.rpc.mockResolvedValueOnce({ data: null, error: null });
    expect(await reportsService.getHiddenUserIds("me")).toEqual({ success: true, data: [] });
  });
});
