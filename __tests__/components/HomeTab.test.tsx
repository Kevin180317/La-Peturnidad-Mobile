import { HomeTab } from "@/components/dashboard/HomeTab";
import { PetDetailModal } from "@/components/dashboard/PetDetailModal";
import { PetForm } from "@/components/dashboard/PetForm";
import { fireEvent, render, screen } from "@testing-library/react-native";

jest.mock("@/services/dashboard.service", () => ({
  dashboardService: { selectImage: jest.fn(), uploadImage: jest.fn() },
}));

const pet = {
  id: "pet1",
  name: "Lucky",
  type: "perro",
  color: "café",
  size: "mediano",
  features: null,
  image_url: null,
  created_at: "2026-10-01T10:00:00Z",
} as any;

const setupHome = async (props = {}) => {
  const handlers = {
    onRefresh: jest.fn(),
    onLoadPets: jest.fn(),
    onOpenSearch: jest.fn(),
    onRegisterPet: jest.fn().mockResolvedValue(true),
    onUpdatePet: jest.fn().mockResolvedValue(true),
    onDeletePet: jest.fn(),
  };
  await render(
    <HomeTab
      profileName="Kevin"
      pets={[pet]}
      loadingPets={false}
      myAlerts={[]}
      foundPets={[]}
      refreshing={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
};

describe("HomeTab", () => {
  it("greets the user and opens search", async () => {
    const h = await setupHome();
    expect(screen.getByText("Hola, Kevin")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Buscar"));
    expect(h.onOpenSearch).toHaveBeenCalled();
  });

  it("'Mis mascotas' loads and lists pets; tapping one opens its detail", async () => {
    const h = await setupHome();
    await fireEvent.press(screen.getByLabelText("Ver mascotas"));
    expect(h.onLoadPets).toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText("Ver ficha de Lucky"));
    expect(screen.getByText("Registrada")).toBeTruthy();
  });

  it("hero card opens the new pet form", async () => {
    await setupHome();
    await fireEvent.press(screen.getAllByLabelText("Registrar mascota")[0]);
    expect(screen.getByText("Registrar nueva mascota")).toBeTruthy();
  });
});

describe("PetForm", () => {
  it("submits the chosen type and size chips", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    await render(<PetForm onSubmit={onSubmit} onCancel={jest.fn()} />);
    await fireEvent.press(screen.getByText("Gato"));
    await fireEvent.changeText(screen.getByPlaceholderText("Nombre de la mascota"), "Michi");
    await fireEvent.changeText(screen.getByPlaceholderText("Color principal"), "negro");
    await fireEvent.press(screen.getByText("Grande"));
    await fireEvent.press(screen.getByText("Registrar mascota"));
    expect(onSubmit).toHaveBeenCalledWith({
      type: "gato",
      name: "Michi",
      color: "negro",
      size: "grande",
      features: null,
      image_url: null,
    });
  });

  it("prefills when editing and cancels", async () => {
    const onCancel = jest.fn();
    await render(<PetForm editingPet={pet} onSubmit={jest.fn()} onCancel={onCancel} />);
    expect(screen.getByDisplayValue("Lucky")).toBeTruthy();
    expect(screen.getByText("Guardar cambios")).toBeTruthy();
    await fireEvent.press(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe("PetDetailModal", () => {
  it("edit and delete close the sheet and call back with the pet", async () => {
    const onClose = jest.fn();
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    await render(<PetDetailModal pet={pet} visible onClose={onClose} onEdit={onEdit} onDelete={onDelete} />);
    await fireEvent.press(screen.getByText("Editar"));
    await fireEvent.press(screen.getByText("Eliminar"));
    expect(onEdit).toHaveBeenCalledWith(pet);
    expect(onDelete).toHaveBeenCalledWith("pet1");
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("close button closes", async () => {
    const onClose = jest.fn();
    await render(<PetDetailModal pet={pet} visible onClose={onClose} onDelete={jest.fn()} />);
    await fireEvent.press(screen.getByLabelText("Cerrar ficha"));
    expect(onClose).toHaveBeenCalled();
  });
});
