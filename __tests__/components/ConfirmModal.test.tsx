import { ConfirmModal } from "@/components/ConfirmModal";
import { fireEvent, render, screen } from "@testing-library/react-native";

const setup = async (props = {}) => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  await render(
    <ConfirmModal
      visible
      title="Cerrar sesión"
      message="¿Seguro?"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onConfirm, onCancel };
};

describe("ConfirmModal", () => {
  it("renders title, message and default labels", async () => {
    await setup();
    expect(screen.getByText("Cerrar sesión")).toBeTruthy();
    expect(screen.getByText("¿Seguro?")).toBeTruthy();
    expect(screen.getByText("Confirmar")).toBeTruthy();
    expect(screen.getByText("Cancelar")).toBeTruthy();
  });

  it("fires confirm and cancel", async () => {
    const { onConfirm, onCancel } = await setup({ confirmLabel: "Salir" });
    await fireEvent.press(screen.getByText("Salir"));
    await fireEvent.press(screen.getByText("Cancelar"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("hides label and blocks actions while loading", async () => {
    const { onConfirm, onCancel } = await setup({ loading: true });
    expect(screen.queryByText("Confirmar")).toBeNull();
    await fireEvent.press(screen.getByText("Cancelar"));
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("renders nothing when not visible", async () => {
    await setup({ visible: false });
    expect(screen.queryByText("Cerrar sesión")).toBeNull();
  });
});
