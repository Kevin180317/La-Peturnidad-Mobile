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

// El mock compartido del router no incluye canDismiss/dismissAll; se agregan aquí.
const nav = Object.assign(router, { canDismiss: jest.fn(), dismissAll: jest.fn() });

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
  nav.canDismiss.mockReset().mockReturnValue(true);
  nav.dismissAll.mockReset();
  auth.getSession.mockResolvedValue({ data: { session: null } });
});

describe("LoginScreen", () => {
  it("requires email and password", async () => {
    await render(<LoginScreen />);
    await fireEvent.press(screen.getByText("Iniciar sesión"));
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ text1: "Campos requeridos" }));
  });

  it("shows translated auth error and returns to the form", async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: "Invalid login credentials", code: "invalid_credentials" },
    });
    await render(<LoginScreen />);
    await fillAndSubmit();
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          text1: "Error de autenticación",
          text2: "Correo o contraseña incorrectos",
        }),
      ),
    );
    expect(await screen.findByText("Iniciar sesión")).toBeTruthy();
  });

  it("maps rate limit errors to Spanish", async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: "rate limited", code: "over_request_rate_limit" },
    });
    await render(<LoginScreen />);
    await fillAndSubmit();
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ text2: "Demasiados intentos, espera un momento" }),
      ),
    );
  });

  it("sends unconfirmed users to email-confirmacion", async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Email not confirmed", code: "email_not_confirmed" },
    });
    await render(<LoginScreen />);
    await fillAndSubmit(" a@b.com ");
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith({
        pathname: "/email-confirmacion",
        params: { email: "a@b.com" },
      }),
    );
    expect(toast).not.toHaveBeenCalled();
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
    expect(nav.dismissAll).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/dashboard");
  });

  it("stays on login when the profile fails to load", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user }, error: null });
    getProfile.mockResolvedValue({ success: false, data: null, error: "network" });
    await render(<LoginScreen />);
    await fillAndSubmit();
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", text1: "No pudimos cargar tu perfil" }),
      ),
    );
    expect(router.replace).not.toHaveBeenCalled();
    expect(await screen.findByText("Iniciar sesión")).toBeTruthy();
  });

  it("routes users without profile to register-extended", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user }, error: null });
    getProfile.mockResolvedValue({ success: true, data: null });
    await render(<LoginScreen />);
    await fillAndSubmit();
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: "info" })));
    toast.mock.calls[0][0].onHide();
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/register-extended",
      params: { email: "a@b.com" },
    });
  });

  it("reports unexpected exceptions with a generic message", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    auth.signInWithPassword.mockRejectedValue(new Error("network down"));
    await render(<LoginScreen />);
    await fillAndSubmit();
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ text1: "Error inesperado", text2: "Intenta de nuevo más tarde" }),
      ),
    );
  });

  describe("auto-login", () => {
    it("goes to dashboard when session + profile exist, clearing the back stack", async () => {
      auth.getSession.mockResolvedValue({ data: { session: { user } } });
      getProfile.mockResolvedValue({ success: true, data: {} });
      await render(<LoginScreen />);
      await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dashboard"));
      expect(nav.dismissAll).toHaveBeenCalled();
    });

    it("does not dismiss when there is nothing to dismiss", async () => {
      nav.canDismiss.mockReturnValue(false);
      auth.getSession.mockResolvedValue({ data: { session: { user } } });
      getProfile.mockResolvedValue({ success: true, data: {} });
      await render(<LoginScreen />);
      await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dashboard"));
      expect(nav.dismissAll).not.toHaveBeenCalled();
    });

    it("goes to register-extended only when the profile query returns no row", async () => {
      auth.getSession.mockResolvedValue({ data: { session: { user } } });
      getProfile.mockResolvedValue({ success: true, data: null });
      await render(<LoginScreen />);
      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith({
          pathname: "/register-extended",
          params: { email: "a@b.com" },
        }),
      );
    });

    it("stays on login with an error toast when the profile fails to load", async () => {
      auth.getSession.mockResolvedValue({ data: { session: { user } } });
      getProfile.mockResolvedValue({ success: false, data: null, error: "network" });
      await render(<LoginScreen />);
      await waitFor(() =>
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({ text1: "No pudimos cargar tu perfil" }),
        ),
      );
      expect(router.replace).not.toHaveBeenCalled();
    });

    it("survives a getSession failure", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      auth.getSession.mockRejectedValue(new Error("storage"));
      await render(<LoginScreen />);
      await waitFor(() => expect(auth.getSession).toHaveBeenCalled());
      expect(router.replace).not.toHaveBeenCalled();
      expect(screen.getByText("Iniciar sesión")).toBeTruthy();
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
