import EditarPerfilScreen from "@/app/editar-perfil";
import { profileService } from "@/services/profile.service";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import Toast from "react-native-toast-message";
import { resetRouterMock, router } from "../../test/routerMock";
import { resetSupabaseMock, supabaseMock } from "../../test/supabaseMock";

jest.mock("@react-native-picker/picker", () => {
  const Picker: any = () => null;
  Picker.Item = () => null;
  return { Picker };
});

const toast = Toast.show as jest.Mock;
const profile = (over: object) => ({
  first_name: "Ana",
  last_name: "Pérez",
  phone: "6641234567",
  city: "Tijuana",
  postal_code: "22220",
  address: "Hacienda el Colorado",
  profile_picture_url: null,
  ...over,
});

const mockLoad = (over: object) =>
  jest.spyOn(profileService, "getByUserId").mockResolvedValue({ success: true, data: profile(over) as any });

beforeEach(() => {
  resetRouterMock();
  resetSupabaseMock();
  toast.mockReset();
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
});

afterEach(() => jest.restoreAllMocks());

describe("EditarPerfilScreen", () => {
  it("saves the catalog spelling of a colonia that only differs in case or spaces", async () => {
    mockLoad({ address: "  hacienda EL colorado " });
    const update = jest.spyOn(profileService, "update").mockResolvedValue({ success: true });
    await render(<EditarPerfilScreen />);
    await fireEvent.press(await screen.findByText("Guardar cambios"));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0][1]).toMatchObject({ address: "Hacienda el Colorado", postal_code: "22220" });
  });

  it("does not save a free-text address that is not in the catalog", async () => {
    mockLoad({ address: "Calle 1, Hacienda el Colorado" });
    const update = jest.spyOn(profileService, "update").mockResolvedValue({ success: true });
    await render(<EditarPerfilScreen />);
    expect(await screen.findByText(/no coincide con una colonia/)).toBeTruthy();
    await fireEvent.press(screen.getByText("Guardar cambios"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ text1: "Colonia requerida" })));
    expect(update).not.toHaveBeenCalled();
  });

  it("clears the colonia when the postal code changes", async () => {
    mockLoad({});
    const update = jest.spyOn(profileService, "update").mockResolvedValue({ success: true });
    await render(<EditarPerfilScreen />);
    await fireEvent.changeText(await screen.findByPlaceholderText("Código postal"), "22000");
    await fireEvent.press(screen.getByText("Guardar cambios"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ text1: "Colonia requerida" })));
    expect(update).not.toHaveBeenCalled();
  });

  it("leaves the screen instead of showing an empty form when loading fails", async () => {
    jest.spyOn(profileService, "getByUserId").mockResolvedValue({ success: false, error: "offline" });
    await render(<EditarPerfilScreen />);
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ text1: "No pudimos cargar tu perfil" }));
  });
});
