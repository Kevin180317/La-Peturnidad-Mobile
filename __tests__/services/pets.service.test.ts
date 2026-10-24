import { petsService } from "@/services/pets.service";
import { calls, mockTable, resetSupabaseMock } from "../../test/supabaseMock";

beforeEach(resetSupabaseMock);

const pet = { id: "p1", name: "Luna" };

describe("petsService", () => {
  it("getAll filters by user, newest first", async () => {
    mockTable("pets", { data: [pet] });
    const res = await petsService.getAll("u1");
    expect(res).toEqual({ success: true, data: [pet] });
    expect(calls).toContainEqual({ table: "pets", method: "eq", args: ["user_id", "u1"] });
    expect(calls).toContainEqual({
      table: "pets",
      method: "order",
      args: ["created_at", { ascending: false }],
    });
  });

  it("getAll returns [] on null data", async () => {
    mockTable("pets", { data: null });
    expect((await petsService.getAll("u1")).data).toEqual([]);
  });

  it("getAll returns error + empty data on failure", async () => {
    mockTable("pets", { error: { message: "rls" } });
    expect(await petsService.getAll("u1")).toEqual({ success: false, error: "rls", data: [] });
  });

  it("register inserts with created_at", async () => {
    mockTable("pets", { data: pet });
    const res = await petsService.register({ name: "Luna" } as any);
    expect(res).toEqual({ success: true, data: pet });
    const insert = calls.find((c) => c.method === "insert")!;
    expect((insert.args[0] as any[])[0]).toMatchObject({ name: "Luna" });
    expect((insert.args[0] as any[])[0].created_at).toEqual(expect.any(String));
  });

  it("register surfaces error", async () => {
    mockTable("pets", { error: { message: "dup" } });
    expect(await petsService.register({} as any)).toEqual({ success: false, error: "dup" });
  });

  it("update targets pet id", async () => {
    mockTable("pets", { data: pet });
    await petsService.update("p1", { name: "Nova" });
    expect(calls).toContainEqual({ table: "pets", method: "update", args: [{ name: "Nova" }] });
    expect(calls).toContainEqual({ table: "pets", method: "eq", args: ["id", "p1"] });
  });

  it("delete ok / error", async () => {
    mockTable("pets", { error: null });
    expect(await petsService.delete("p1")).toEqual({ success: true });
    mockTable("pets", { error: { message: "fk" } });
    expect(await petsService.delete("p1")).toEqual({ success: false, error: "fk" });
  });
});
