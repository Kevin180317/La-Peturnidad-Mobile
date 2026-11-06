import { toastConfig } from "@/components/ToastConfig";
import { fireEvent, render, screen } from "@testing-library/react-native";

const params = (overrides = {}) =>
  ({
    type: "success",
    position: "top",
    isVisible: true,
    text1: "Título",
    text2: "Detalle",
    show: jest.fn(),
    hide: jest.fn(),
    onPress: jest.fn(),
    props: {},
    ...overrides,
  }) as any;

describe("toastConfig", () => {
  it.each(["success", "error", "info", "welcome"])("renders the %s variant", async (type) => {
    const renderToast = toastConfig[type]!;
    await render(<>{renderToast(params({ type }))}</>);
    expect(screen.getByText("Título")).toBeTruthy();
    expect(screen.getByText("Detalle")).toBeTruthy();
  });

  it("closes with the X and on tap (calling onPress)", async () => {
    const p = params();
    await render(<>{toastConfig.success!(p)}</>);
    await fireEvent.press(screen.getByLabelText("Cerrar aviso"));
    expect(p.hide).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole("alert"));
    expect(p.onPress).toHaveBeenCalled();
    expect(p.hide).toHaveBeenCalledTimes(2);
  });

  it("omits the subtitle when there is none", async () => {
    await render(<>{toastConfig.error!(params({ text2: undefined }))}</>);
    expect(screen.queryByText("Detalle")).toBeNull();
  });
});
