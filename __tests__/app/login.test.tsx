import LoginScreen from "@/app/login";
import { dashboardService } from "@/services/dashboard.service";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import Toast from "react-native-toast-message";
import { resetRouterMock, router } from "../../test/routerMock";
import { resetSupabaseMock, supabaseMock } from "../../test/supabaseMock";

jest.mock("@/services/dashboard.service", () => ({
  dashboardService: { getProfileByUserId: jest.fn() },
}));

const getProfile = dashboardService.getProfileByUserId as jest.Mock;
const toast = Toast.show as jest.Mock;
const auth = supabaseMock.auth;

const user = { id: "u1", email: "a@b.com", email_confirmed_at: "2024-01-01" };

async function fillAndSubmit(email = "a@b.com", password = "pw123456") {
  await fireEvent.changeText(screen.getByPlaceholderText("ejemplo@correo.com"), email);
  await fireEvent.changeText(screen.getByPlaceholderText("••••••••"), password);
  await fireEvent.press(screen.getByText("Iniciar sesión"));
}

beforeEach(() => {
  resetRouterMock();
  resetSupabaseMock();
  toast.mockReset();
  getProfile.mockReset();
  auth.getSession.mockResolvedValue({ data: { session: null } });
});

describe("LoginScreen", () => {
  it("requires email and password", async () => {
    await render(<LoginScreen />);
    await fireEvent.press(screen.getByText("Iniciar sesión"));
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ text1: "Campos requeridos" }));
  });

  it("shows auth error and returns to the form", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { message: "Invalid login" } });
    await render(<LoginScreen />);
    await fillAndSubmit();
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ text1: "Error de autenticación", text2: "Invalid login" }),
      ),
    );
    expect(await screen.findByText("Iniciar sesión")).toBeTruthy();
  });

  it("sends unconfirmed users to email-confirmacion", async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: { ...user, email_confirmed_at: null } },
      error: null,
    });
    await render(<LoginScreen />);
    await fillAndSubmit();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith({
        pathname: "/email-confirmacion",
        params: { email: "a@b.com" },
      }),
    );
  });

  it("welcomes users with profile and routes to dashboard on toast hide", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user }, error: null });
    getProfile.mockResolvedValue({ success: true, data: { first_name: "Ana" } });
    await render(<LoginScreen />);
    await fillAndSubmit("  a@b.com ", " pw123456 ");
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ text2: "Hola Ana" })),
    );
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@b.com", password: "pw123456" });
    toast.mock.calls[0][0].onHide();
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/dashboard",
      params: { email: "a@b.com", userId: "u1" },
    });
  });

  it("routes users without profile to register-extended", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user }, error: null });
    getProfile.mockResolvedValue({ success: false });
    await render(<LoginScreen />);
    await fillAndSubmit();
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: "info" })));
    toast.mock.calls[0][0].onHide();
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/register-extended",
      params: { email: "a@b.com", userId: "u1" },
    });
  });

  it("reports unexpected exceptions", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    auth.signInWithPassword.mockRejectedValue(new Error("network down"));
    await render(<LoginScreen />);
    await fillAndSubmit();
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ text1: "Error inesperado", text2: "network down" }),
      ),
    );
  });

  describe("auto-login", () => {
    it("goes to dashboard when session + profile exist", async () => {
      auth.getSession.mockResolvedValue({ data: { session: { user } } });
      getProfile.mockResolvedValue({ success: true, data: {} });
      await render(<LoginScreen />);
      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith({
          pathname: "/dashboard",
          params: { email: "a@b.com", userId: "u1" },
        }),
      );
    });

    it("goes to email-confirmacion when session unconfirmed", async () => {
      auth.getSession.mockResolvedValue({
        data: { session: { user: { ...user, email_confirmed_at: null } } },
      });
      await render(<LoginScreen />);
      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith({
          pathname: "/email-confirmacion",
          params: { email: "a@b.com" },
        }),
      );
    });

    it("stays put with no session", async () => {
      await render(<LoginScreen />);
      await waitFor(() => expect(auth.getSession).toHaveBeenCalled());
      expect(router.replace).not.toHaveBeenCalled();
    });
  });
});
