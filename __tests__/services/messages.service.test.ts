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

  it("leaving a conversation only removes my participation", async () => {
    expect(await messagesService.deleteConversation("c1", "u1")).toEqual({ success: true });
    expect(calls).toContainEqual({ table: "conversation_participants", method: "eq", args: ["user_id", "u1"] });
  });
});

describe("messagesService.getMessages", () => {
  it("asks for the newest messages and returns them oldest first", async () => {
    mockTable("messages", { data: [{ id: "m2" }, { id: "m1" }] });
    const res = await messagesService.getMessages("c1");
    expect(calls).toContainEqual({ table: "messages", method: "order", args: ["created_at", { ascending: false }] });
    expect(calls).toContainEqual({ table: "messages", method: "limit", args: [500] });
    expect(res.data?.map((m) => m.id)).toEqual(["m1", "m2"]);
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
    mockTable("user_profiles", {
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
});
