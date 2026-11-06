import { messagesService } from "@/services/messages.service";
import { calls, mockTable, resetSupabaseMock, supabaseMock } from "../../test/supabaseMock";

beforeEach(resetSupabaseMock);

describe("messagesService.sendMessage", () => {
  it("inserts only conversation, sender and content (the server sets id and dates)", async () => {
    mockTable("messages", { data: { id: "m1", content: "hola" } });
    const res = await messagesService.sendMessage("c1", "u1", "hola");
    expect(res).toEqual({ success: true, data: { id: "m1", content: "hola" } });
    expect(calls).toContainEqual({
      table: "messages",
      method: "insert",
      args: [{ conversation_id: "c1", sender_id: "u1", content: "hola" }],
    });
  });

  it("explains a blocked recipient in Spanish", async () => {
    mockTable("messages", { error: { message: "No puedes enviar mensajes a este usuario" } });
    expect(await messagesService.sendMessage("c1", "u1", "hola")).toEqual({
      success: false,
      error: "No puedes enviar mensajes a este usuario",
    });
  });

  it("explains an RLS rejection (not a participant)", async () => {
    mockTable("messages", { error: { message: 'new row violates row-level security policy for table "messages"' } });
    const res = await messagesService.sendMessage("c1", "u1", "hola");
    expect(res).toEqual({ success: false, error: "No puedes enviar mensajes en esta conversación" });
  });
});

describe("messagesService.getOrCreateConversation", () => {
  it("delegates to the create_conversation RPC", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: "c9", error: null });
    const res = await messagesService.getOrCreateConversation("u1", "u2");
    expect(supabaseMock.rpc).toHaveBeenCalledWith("create_conversation", { user1_id: "u1", user2_id: "u2" });
    expect(res).toEqual({ success: true, data: { conversation_id: "c9" } });
  });

  it("fails when the RPC returns nothing", async () => {
    const res = await messagesService.getOrCreateConversation("u1", "u2");
    expect(res.success).toBe(false);
  });

  it("surfaces the block error from the RPC", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: null, error: { message: "No puedes enviar mensajes a este usuario" } });
    expect(await messagesService.getOrCreateConversation("u1", "u2")).toEqual({
      success: false,
      error: "No puedes enviar mensajes a este usuario",
    });
  });
});

describe("messagesService.markAsRead / deleteConversation", () => {
  it("marks only the other person's unread messages", async () => {
    await messagesService.markAsRead("c1", "u1");
    expect(calls).toContainEqual({ table: "messages", method: "eq", args: ["conversation_id", "c1"] });
    expect(calls).toContainEqual({ table: "messages", method: "neq", args: ["sender_id", "u1"] });
    expect(calls).toContainEqual({ table: "messages", method: "is", args: ["read_at", null] });
  });

  it("deleting a chat only clears it for me through the clear_conversation RPC", async () => {
    expect(await messagesService.deleteConversation("c1")).toEqual({ success: true });
    expect(supabaseMock.rpc).toHaveBeenCalledWith("clear_conversation", { p_conversation_id: "c1" });
    expect(calls.filter((c) => c.table === "conversation_participants" && c.method === "delete")).toEqual([]);
  });

  it("surfaces an RPC failure", async () => {
    supabaseMock.rpc.mockResolvedValueOnce({ data: null, error: { message: "No autorizado" } });
    expect(await messagesService.deleteConversation("c1")).toEqual({ success: false, error: "No autorizado" });
  });
});

describe("messagesService.getMessages", () => {
  it("asks for the newest messages and returns them oldest first", async () => {
    mockTable("messages", { data: [{ id: "m2" }, { id: "m1" }] });
    const res = await messagesService.getMessages("c1", "u1");
    expect(calls).toContainEqual({ table: "messages", method: "order", args: ["created_at", { ascending: false }] });
    expect(calls).toContainEqual({ table: "messages", method: "limit", args: [500] });
    expect(res.data?.map((m) => m.id)).toEqual(["m1", "m2"]);
  });

  it("returns everything when I never cleared the chat (cleared_at is null)", async () => {
    mockTable("conversation_participants", { data: { cleared_at: null } });
    mockTable("messages", { data: [{ id: "m1" }] });
    await messagesService.getMessages("c1", "u1");
    expect(calls).toContainEqual({ table: "conversation_participants", method: "eq", args: ["user_id", "u1"] });
    expect(calls.filter((c) => c.table === "messages" && c.method === "gt")).toEqual([]);
  });

  it("only returns messages after the moment I cleared the chat", async () => {
    mockTable("conversation_participants", { data: { cleared_at: "2026-10-24T10:00:00Z" } });
    mockTable("messages", { data: [] });
    await messagesService.getMessages("c1", "u1");
    expect(calls).toContainEqual({ table: "messages", method: "gt", args: ["created_at", "2026-10-24T10:00:00Z"] });
  });
});

describe("messagesService.getConversations", () => {
  it("returns [] when the user has no conversations", async () => {
    mockTable("conversation_participants", { data: [] });
    expect(await messagesService.getConversations("u1")).toEqual({ success: true, data: [] });
  });

  it("builds 1:1 and group rows, hides chats with blocked users, counts unread", async () => {
    mockTable(
      "conversation_participants",
      { data: [{ conversation_id: "c1" }, { conversation_id: "c2" }, { conversation_id: "c3" }] },
      { data: [{ conversation_id: "c1", user_id: "u2" }, { conversation_id: "c3", user_id: "u3" }] },
    );
    mockTable("conversations", {
      data: [
        { id: "c1", group_id: null, created_at: "t", updated_at: "t" },
        { id: "c2", group_id: "g1", created_at: "t", updated_at: "t" },
        { id: "c3", group_id: null, created_at: "t", updated_at: "t" },
      ],
    });
    mockTable("groups", { data: [{ id: "g1", name: "Vecinos" }] });
    mockTable("blocks", { data: [{ blocked_id: "u3" }] });
    mockTable("public_profiles", {
      data: [{ user_id: "u2", first_name: "Ana", last_name: "Pérez", profile_picture_url: null }],
    });
    // 1ª consulta a messages = recientes, 2ª = no leídos
    mockTable(
      "messages",
      { data: [{ conversation_id: "c1", content: "hola", created_at: "2026-10-24T10:00:00Z" }] },
      { data: [{ conversation_id: "c1" }, { conversation_id: "c1" }] },
    );

    const res = await messagesService.getConversations("u1");

    expect(res.success).toBe(true);
    const rows = res.data ?? [];
    expect(rows.map((r) => r.id)).toEqual(["c1", "c2"]);
    expect(rows[0]).toMatchObject({
      other_user_id: "u2",
      other_user_name: "Ana Pérez",
      last_message: "hola",
      unread_count: 2,
      is_group: false,
    });
    expect(rows[1]).toMatchObject({ is_group: true, group_name: "Vecinos", other_user_id: "", unread_count: 0 });
  });

  it("labels a 1:1 chat whose other participant is gone", async () => {
    mockTable("conversation_participants", { data: [{ conversation_id: "c1" }] }, { data: [] });
    mockTable("conversations", { data: [{ id: "c1", group_id: null, created_at: "t", updated_at: "t" }] });
    mockTable("blocks", { data: [] });
    mockTable("messages", { data: [] });
    const res = await messagesService.getConversations("u1");
    expect(res.data?.[0]).toMatchObject({ other_user_id: "", other_user_name: "Conversación cerrada" });
  });

  it("hides a chat I cleared until someone writes again, and shows it with only the new message", async () => {
    mockTable(
      "conversation_participants",
      {
        data: [
          { conversation_id: "c1", cleared_at: "2026-10-24T10:00:00Z" },
          { conversation_id: "c2", cleared_at: "2026-10-24T10:00:00Z" },
          { conversation_id: "c3", cleared_at: null },
        ],
      },
      { data: [{ conversation_id: "c2", user_id: "u2" }] },
    );
    mockTable("conversations", {
      data: [
        { id: "c1", group_id: null, created_at: "t", updated_at: "t" },
        { id: "c2", group_id: null, created_at: "t", updated_at: "t" },
        { id: "c3", group_id: null, created_at: "t", updated_at: "t" },
      ],
    });
    mockTable("blocks", { data: [] });
    mockTable("public_profiles", { data: [] });
    mockTable(
      "messages",
      {
        data: [
          { conversation_id: "c2", content: "nuevo", created_at: "2026-10-24T11:00:00Z" },
          { conversation_id: "c1", content: "viejo", created_at: "2026-10-24T09:00:00Z" },
        ],
      },
      { data: [] },
    );

    const res = await messagesService.getConversations("u1");

    // c1: vaciado sin mensajes posteriores → oculto. c3: nunca vaciado y sin mensajes → visible
    expect((res.data ?? []).map((r) => r.id).sort()).toEqual(["c2", "c3"]);
    expect(res.data?.find((r) => r.id === "c2")?.last_message).toBe("nuevo");
  });
});
