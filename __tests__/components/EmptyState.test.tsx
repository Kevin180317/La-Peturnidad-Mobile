import { EmptyState } from "@/components/EmptyState";
import { fireEvent, render, screen } from "@testing-library/react-native";

describe("EmptyState", () => {
  it("shows title only by default", async () => {
    await render(<EmptyState title="Sin mascotas" />);
    expect(screen.getByText("Sin mascotas")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows subtitle and action that fires", async () => {
    const onAction = jest.fn();
    await render(<EmptyState title="t" subtitle="sub" actionLabel="Agregar" onAction={onAction} />);
    expect(screen.getByText("sub")).toBeTruthy();
    await fireEvent.press(screen.getByText("Agregar"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("hides action when onAction missing", async () => {
    await render(<EmptyState title="t" actionLabel="Agregar" />);
    expect(screen.queryByText("Agregar")).toBeNull();
  });
});
