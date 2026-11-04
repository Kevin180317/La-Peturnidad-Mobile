import { PhoneField } from "@/components/PhoneField";
import { fireEvent, render, screen } from "@testing-library/react-native";

describe("PhoneField", () => {
  it("shows the dial code of the selected country", async () => {
    await render(<PhoneField country="MX" onCountryChange={jest.fn()} value="" onChangeText={jest.fn()} />);
    expect(screen.getByText("+52")).toBeTruthy();
  });

  it("lets the user pick another country", async () => {
    const onCountryChange = jest.fn();
    await render(<PhoneField country="MX" onCountryChange={onCountryChange} value="" onChangeText={jest.fn()} />);
    await fireEvent.press(screen.getByLabelText("País del teléfono"));
    await fireEvent.press(screen.getByText("Estados Unidos / Canadá"));
    expect(onCountryChange).toHaveBeenCalledWith("US");
  });

  it("forwards typing and shows the error", async () => {
    const onChangeText = jest.fn();
    await render(
      <PhoneField country="US" onCountryChange={jest.fn()} value="" onChangeText={onChangeText} error="Número inválido" />,
    );
    await fireEvent.changeText(screen.getByLabelText("Teléfono"), "6195550123");
    expect(onChangeText).toHaveBeenCalledWith("6195550123");
    expect(screen.getByText("Número inválido")).toBeTruthy();
  });

  it("asks for the full international number when the country is other", async () => {
    await render(<PhoneField country="OTHER" onCountryChange={jest.fn()} value="" onChangeText={jest.fn()} />);
    expect(screen.getByPlaceholderText("+34 600 123 456")).toBeTruthy();
  });
});
