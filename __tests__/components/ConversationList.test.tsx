import { ConversationList } from "@/components/messages/ConversationList";
import { fireEvent, render, screen } from "@testing-library/react-native";

const conv = (id: string, name: string, unread = 0, is_group = false) => ({
  id,
  other_user_name: name,
  other_user_picture: null,
  last_message: `último de ${name}`,
  last_message_at: null,
  unread_count: unread,
  is_group,
});

describe("ConversationList", () => {
  it("shows the empty state", async () => {
    await render(<ConversationList conversations={[]} onOpen={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText("No tienes conversaciones aún")).toBeTruthy();
  });

  it("opens, deletes (button and long press) and shows unread badges", async () => {
    const onOpen = jest.fn();
    const onDelete = jest.fn();
    await render(
      <ConversationList conversations={[conv("c1", "Ana", 120), conv("c2", "Grupo", 0, true)]} onOpen={onOpen} onDelete={onDelete} />,
    );
    expect(screen.getByText("99+")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Abrir chat con Ana"));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "c1" }));
    await fireEvent.press(screen.getByLabelText("Eliminar chat con Grupo"));
    await fireEvent(screen.getByLabelText("Abrir chat con Ana"), "longPress");
    expect(onDelete.mock.calls.map((c) => c[0].id)).toEqual(["c2", "c1"]);
  });
});
