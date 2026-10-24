import { PasswordInput } from "@/components/PasswordInput";
import { fireEvent, render, screen } from "@testing-library/react-native";

describe("PasswordInput", () => {
  it("hides text by default and toggles visibility", async () => {
    await render(<PasswordInput placeholder="pw" />);
    const input = screen.getByPlaceholderText("pw");
    expect(input.props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByLabelText("Mostrar contraseña"));
    expect(screen.getByPlaceholderText("pw").props.secureTextEntry).toBe(false);

    await fireEvent.press(screen.getByLabelText("Ocultar contraseña"));
    expect(screen.getByPlaceholderText("pw").props.secureTextEntry).toBe(true);
  });

  it("forwards onChangeText and focus/blur handlers", async () => {
    const onChangeText = jest.fn();
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await render(
      <PasswordInput placeholder="pw" onChangeText={onChangeText} onFocus={onFocus} onBlur={onBlur} />,
    );
    const input = screen.getByPlaceholderText("pw");
    await fireEvent(input, "focus");
    await fireEvent.changeText(input, "secret");
    await fireEvent(input, "blur");
    expect(onFocus).toHaveBeenCalled();
    expect(onChangeText).toHaveBeenCalledWith("secret");
    expect(onBlur).toHaveBeenCalled();
  });
});
