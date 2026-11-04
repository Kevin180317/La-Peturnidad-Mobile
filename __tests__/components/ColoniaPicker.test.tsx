import { ColoniaPicker } from "@/components/ColoniaPicker";
import { fireEvent, render, screen } from "@testing-library/react-native";

const options = ["Hacienda el Colorado", "Villa Fontana", "Otay"];

describe("ColoniaPicker", () => {
  it("shows the placeholder until a colonia is chosen", async () => {
    await render(<ColoniaPicker options={options} value="" onChange={jest.fn()} />);
    expect(screen.getByText("Selecciona una colonia")).toBeTruthy();
  });

  it("shows the selected colonia", async () => {
    await render(<ColoniaPicker options={options} value="Otay" onChange={jest.fn()} />);
    expect(screen.getByText("Otay")).toBeTruthy();
  });

  it("opens a readable list and reports the colonia that was tapped", async () => {
    const onChange = jest.fn();
    await render(<ColoniaPicker options={options} value="" onChange={onChange} />);
    expect(screen.queryByText("Villa Fontana")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Colonia"));
    expect(screen.getByText("Hacienda el Colorado")).toBeTruthy();
    await fireEvent.press(screen.getByText("Villa Fontana"));
    expect(onChange).toHaveBeenCalledWith("Villa Fontana");
    expect(screen.queryByText("Hacienda el Colorado")).toBeNull();
  });
});
