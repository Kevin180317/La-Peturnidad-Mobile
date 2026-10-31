import { ConfirmHost, confirmDialog } from "@/components/ConfirmDialog";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

describe("confirmDialog", () => {
  it("shows nothing until called", async () => {
    await render(<ConfirmHost />);
    expect(screen.queryByText("Eliminar mascota")).toBeNull();
  });

  it("keeps the dialog open while the action runs, then closes", async () => {
    let openWhileRunning = false;
    const onConfirm = jest.fn(async () => {
      openWhileRunning = !!screen.queryByText("¿Seguro?");
    });
    await render(<ConfirmHost />);
    await act(async () =>
      confirmDialog({ title: "Eliminar mascota", message: "¿Seguro?", confirmLabel: "Eliminar", destructive: true, onConfirm }),
    );
    expect(screen.getByText("Eliminar mascota")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Eliminar"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(openWhileRunning).toBe(true);
    await waitFor(() => expect(screen.queryByText("¿Seguro?")).toBeNull());
  });

  it("cancel closes without running the action", async () => {
    const onConfirm = jest.fn();
    await render(<ConfirmHost />);
    await act(async () => confirmDialog({ title: "Eliminar chat", message: "¿Eliminar?", onConfirm }));
    await fireEvent.press(screen.getByLabelText("Cancelar"));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByText("¿Eliminar?")).toBeNull();
  });

  it("closes even if the action throws", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    await render(<ConfirmHost />);
    await act(async () =>
      confirmDialog({ title: "T", message: "M", confirmLabel: "Ok", onConfirm: () => Promise.reject(new Error("x")) }),
    );
    await fireEvent.press(screen.getByLabelText("Ok"));
    await waitFor(() => expect(screen.queryByText("M")).toBeNull());
  });
});
