import { EmergencyTab } from "@/components/dashboard/EmergencyTab";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";

const alert = (id: string, owner_phone: string) => ({
  id,
  pet_name: `Mascota ${id}`,
  type: "perro",
  description: "Collar rojo",
  last_seen_location: "Parque",
  disappearance_date: "2026-10-20",
  image_url: null,
  owner_name: "Ana",
  owner_phone,
});

const setup = async (props = {}) => {
  const handlers = {
    onRefresh: jest.fn(),
    onLoadPets: jest.fn(),
    onToggleSelectingPet: jest.fn(),
    onLoadEmergencyAlerts: jest.fn(),
    onToggleAlerts: jest.fn(),
    onLoadMyAlerts: jest.fn(),
    onToggleMyAlerts: jest.fn(),
    onLoadFoundPets: jest.fn(),
    onToggleFoundPets: jest.fn(),
    onCreateAlert: jest.fn(),
    onFoundPet: jest.fn(),
    onDeleteAlert: jest.fn(),
    onResolveAlert: jest.fn(),
    onGoHome: jest.fn(),
  };
  await render(
    <EmergencyTab
      pets={[]}
      emergencyAlerts={[]}
      myAlerts={[]}
      foundPets={[]}
      loadingAlerts={false}
      refreshing={false}
      selectingPetForAlert={false}
      showAlerts={false}
      showMyAlerts={false}
      showFoundPets={false}
      {...handlers}
      {...(props as any)}
    />,
  );
  return handlers;
};

describe("EmergencyTab actions", () => {
  it("report card loads pets and opens the pet picker", async () => {
    const h = await setup();
    await fireEvent.press(screen.getByLabelText("Reportar mascota perdida"));
    expect(h.onLoadPets).toHaveBeenCalled();
    expect(h.onToggleSelectingPet).toHaveBeenCalled();
  });

  it("tiles toggle each section and reflect the active state in their label", async () => {
    const h = await setup({ showMyAlerts: true });
    await fireEvent.press(screen.getByLabelText("Ver mascotas perdidas"));
    await fireEvent.press(screen.getByLabelText("Ocultar mis alertas"));
    await fireEvent.press(screen.getByLabelText("Ver mascotas encontradas"));
    expect(h.onToggleAlerts).toHaveBeenCalled();
    expect(h.onToggleMyAlerts).toHaveBeenCalled();
    expect(h.onToggleFoundPets).toHaveBeenCalled();
  });

  it("shows a count badge on inactive tiles with data", async () => {
    await setup({ emergencyAlerts: [alert("a1", "5512345678"), alert("a2", "5512345678")] });
    expect(screen.getByText("2")).toBeTruthy();
  });
});

describe("EmergencyTab lost pets list", () => {
  it("calls the owner only when there is a real phone number", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    await setup({
      showAlerts: true,
      emergencyAlerts: [alert("a1", "55 1234 5678"), alert("a2", "No disponible")],
    });
    const callButtons = screen.getAllByLabelText("Llamar a Ana");
    expect(callButtons).toHaveLength(1);
    await fireEvent.press(callButtons[0]);
    expect(openURL).toHaveBeenCalledWith("tel:5512345678");
  });

  it("'Lo encontré' reports the right alert", async () => {
    const h = await setup({ showAlerts: true, emergencyAlerts: [alert("a1", "5512345678")] });
    await fireEvent.press(screen.getByText("Lo encontré"));
    expect(h.onFoundPet).toHaveBeenCalledWith(expect.objectContaining({ id: "a1" }));
  });
});

describe("EmergencyTab my alerts", () => {
  const mine = (status: string) => ({ ...alert("m1", "5512345678"), status, finders: [] });

  it("active alert can be resolved or deleted", async () => {
    const h = await setup({ showMyAlerts: true, myAlerts: [mine("active")] });
    expect(screen.getByText("Activa")).toBeTruthy();
    await fireEvent.press(screen.getByText("Ya apareció"));
    await fireEvent.press(screen.getByLabelText("Eliminar alerta"));
    expect(h.onResolveAlert).toHaveBeenCalledWith("m1");
    expect(h.onDeleteAlert).toHaveBeenCalledWith("m1");
  });

  it("resolved alert hides 'Ya apareció'", async () => {
    await setup({ showMyAlerts: true, myAlerts: [mine("resolved")] });
    expect(screen.getByText("Resuelta")).toBeTruthy();
    expect(screen.queryByText("Ya apareció")).toBeNull();
  });
});
