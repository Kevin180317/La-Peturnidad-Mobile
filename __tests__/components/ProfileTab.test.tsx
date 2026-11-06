import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { fireEvent, render, screen } from "@testing-library/react-native";

const props = {
  email: "a@b.mx",
  userId: "u1",
  petsCount: 0,
  unreadCount: 0,
  notificationsUnread: 0,
  refreshing: false,
  onRefresh: jest.fn(),
  onLogout: jest.fn(),
  onDeleteAccount: jest.fn(),
  onGoComunidad: jest.fn(),
  onProfileUpdated: jest.fn(),
};

describe("ProfileTab without a profile", () => {
  it("offers a retry, not registration, when loading failed", async () => {
    await render(<ProfileTab {...props} profile={null} profileLoadFailed />);
    expect(screen.queryByText("Perfil incompleto")).toBeNull();
    await fireEvent.press(screen.getByText("Reintentar"));
    expect(props.onRefresh).toHaveBeenCalled();
  });

  it("asks to complete the profile only when it really does not exist", async () => {
    await render(<ProfileTab {...props} profile={null} />);
    expect(screen.getByText("Perfil incompleto")).toBeTruthy();
  });
});
