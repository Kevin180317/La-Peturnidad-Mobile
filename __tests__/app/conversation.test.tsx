import ConversationScreen from "@/app/mensajes/[id]";
import { messagesService } from "@/services/messages.service";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import Toast from "react-native-toast-message";
import { resetRouterMock, useLocalSearchParams } from "../../test/routerMock";
import { mockTable, resetSupabaseMock, supabaseMock } from "../../test/supabaseMock";

// Realtime simulado: guarda los callbacks para dispararlos desde el test
const handlers: Record<string, (payload: { new: unknown }) => void> = {};
const channel: any = {
  on: jest.fn((_type: string, config: { event: string }, cb: (payload: { new: unknown }) => void) => {
    handlers[config.event] = cb;
    return channel;
  }),
  subscribe: jest.fn(() => channel),
};
Object.assign(supabaseMock, { channel: jest.fn(() => channel), removeChannel: jest.fn() });

const msg = (id: string, sender_id: string, content: string) => ({
  id,
  conversation_id: "c1",
  sender_id,
  content,
  created_at: new Date().toISOString(),
  read_at: null,
});

const toast = Toast.show as jest.Mock;

beforeEach(() => {
  resetRouterMock();
  resetSupabaseMock();
  toast.mockReset();
  channel.on.mockClear();
  useLocalSearchParams.mockReturnValue({ id: "c1" });
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: "me" } } });
  mockTable("conversations", { data: { id: "c1", group_id: null } });
  mockTable("messages", { data: [msg("m1", "other", "hola")] });
});

afterEach(() => jest.restoreAllMocks());

const openChat = async () => {
  await render(<ConversationScreen />);
  await waitFor(() => expect(screen.getByText("hola")).toBeTruthy());
};

describe("ConversationScreen", () => {
  it("loads the history and subscribes to this conversation's realtime channel", async () => {
    await openChat();
    expect((supabaseMock as any).channel).toHaveBeenCalledWith("messages:c1");
    expect(channel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({ event: "INSERT", table: "messages", filter: "conversation_id=eq.c1" }),
      expect.any(Function),
    );
  });

  it("shows a message that arrives in realtime, once even if it is delivered twice", async () => {
    await openChat();
    await act(async () => {
      handlers.INSERT({ new: msg("m2", "other", "nuevo mensaje") });
      handlers.INSERT({ new: msg("m2", "other", "nuevo mensaje") });
    });
    expect(screen.getAllByText("nuevo mensaje")).toHaveLength(1);
  });

  it("keeps what the user typed when sending fails", async () => {
    jest.spyOn(messagesService, "sendMessage").mockResolvedValue({ success: false, error: "No puedes enviar mensajes a este usuario" });
    await openChat();

    await fireEvent.changeText(screen.getByPlaceholderText("Escribe un mensaje..."), "mi respuesta");
    await fireEvent.press(screen.getByLabelText("Enviar mensaje"));

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ text1: "No se pudo enviar" })));
    expect(screen.getByDisplayValue("mi respuesta")).toBeTruthy();
  });

  it("clears the input and shows the sent message on success", async () => {
    jest.spyOn(messagesService, "sendMessage").mockResolvedValue({ success: true, data: msg("m3", "me", "mi respuesta") });
    await openChat();

    await fireEvent.changeText(screen.getByPlaceholderText("Escribe un mensaje..."), "mi respuesta");
    await fireEvent.press(screen.getByLabelText("Enviar mensaje"));

    await waitFor(() => expect(screen.getByText("mi respuesta")).toBeTruthy());
    expect(screen.queryByDisplayValue("mi respuesta")).toBeNull();
  });

  it("replaces the composer when the other person left the 1:1 chat", async () => {
    mockTable("conversation_participants", { data: [] });
    await openChat();
    expect(screen.getByText(/ya no está en el chat/)).toBeTruthy();
    expect(screen.queryByPlaceholderText("Escribe un mensaje...")).toBeNull();
  });

  it("keeps the composer when the other person is still in the chat", async () => {
    mockTable("conversation_participants", { data: [{ user_id: "other" }] });
    await openChat();
    expect(screen.getByPlaceholderText("Escribe un mensaje...")).toBeTruthy();
  });

  it("shows 'no disponible' when the conversation is not accessible", async () => {
    mockTable("conversations", { data: null });
    await render(<ConversationScreen />);
    await waitFor(() => expect(screen.getByText("Conversación no disponible")).toBeTruthy());
    expect(screen.queryByPlaceholderText("Escribe un mensaje...")).toBeNull();
  });
});
