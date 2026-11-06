import { Avatar, ChoiceChips, Field, ListRow, PrimaryButton, Segmented, Sheet, ToggleTile } from "@/components/kit/Kit";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

describe("Kit", () => {
  it("Avatar falls back to the initial", async () => {
    await render(<Avatar name=" ana" />);
    expect(screen.getByText("A")).toBeTruthy();
  });

  it("PrimaryButton does not fire while disabled or loading", async () => {
    const onPress = jest.fn();
    await render(
      <>
        <PrimaryButton title="Uno" onPress={onPress} disabled />
        <PrimaryButton title="Dos" onPress={onPress} loading />
      </>,
    );
    await fireEvent.press(screen.getByText("Uno"));
    await fireEvent.press(screen.getByText("Dos"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("Field shows its error and forwards focus handlers", async () => {
    const onFocus = jest.fn();
    await render(<Field placeholder="Correo" error="Correo inválido" onFocus={onFocus} />);
    expect(screen.getByText("Correo inválido")).toBeTruthy();
    await fireEvent(screen.getByPlaceholderText("Correo"), "focus");
    expect(onFocus).toHaveBeenCalled();
  });

  it("ToggleTile shows the count only while inactive", async () => {
    const { rerender } = await render(
      <ToggleTile icon="paw" title="T" subtitle="S" count={3} active={false} onPress={jest.fn()} label="tile" />,
    );
    expect(screen.getByText("3")).toBeTruthy();
    await rerender(<ToggleTile icon="paw" title="T" subtitle="S" count={3} active onPress={jest.fn()} label="tile" />);
    expect(screen.queryByText("3")).toBeNull();
  });

  it("Segmented reports the chosen option and marks the active one", async () => {
    const onChange = jest.fn();
    await render(
      <Segmented
        options={[
          { key: "a", label: "Uno", icon: "paw" },
          { key: "b", label: "Dos" },
        ]}
        value="a"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("Uno");
    await fireEvent.press(screen.getByText("Dos"));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("ChoiceChips selects a value", async () => {
    const onChange = jest.fn();
    await render(
      <ChoiceChips options={[{ value: "x", label: "Equis" }, { value: "y", label: "Ye" }]} value="" onChange={onChange} />,
    );
    await fireEvent.press(screen.getByText("Ye"));
    expect(onChange).toHaveBeenCalledWith("y");
  });

  it("ListRow shows info rows and actionable rows with badge", async () => {
    const onPress = jest.fn();
    await render(
      <>
        <ListRow first icon="call-outline" label="Teléfono" value={null} />
        <ListRow icon="chatbox-outline" label="Mensajes" badge={120} onPress={onPress} />
      </>,
    );
    expect(screen.getByText("No disponible")).toBeTruthy();
    expect(screen.getByText("99+")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Mensajes"));
    expect(onPress).toHaveBeenCalled();
  });

  it("Sheet closes from the X unless closing is disabled", async () => {
    const onClose = jest.fn();
    const { rerender } = await render(
      <Sheet visible title="Hoja" onClose={onClose}>
        <Text>contenido</Text>
      </Sheet>,
    );
    expect(screen.getByText("contenido")).toBeTruthy();
    await fireEvent.press(screen.getAllByLabelText("Cerrar")[1]);
    expect(onClose).toHaveBeenCalledTimes(1);
    await rerender(
      <Sheet visible title="Hoja" onClose={onClose} closeDisabled>
        <Text>contenido</Text>
      </Sheet>,
    );
    await fireEvent.press(screen.getAllByLabelText("Cerrar")[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
