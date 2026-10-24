import VerifyOtpScreen from "@/app/verify-otp";
import { authService } from "@/services/auth.service";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import Toast from "react-native-toast-message";
import { resetRouterMock, router, useLocalSearchParams } from "../../test/routerMock";

jest.mock("@/services/auth.service", () => ({
  ...jest.requireActual("@/services/auth.service"),
  authService: { verifyOtp: jest.fn(), sendOtp: jest.fn() },
}));

const verifyOtp = authService.verifyOtp as jest.Mock;
const sendOtp = authService.sendOtp as jest.Mock;
const toast = Toast.show as jest.Mock;

beforeEach(() => {
  resetRouterMock();
  useLocalSearchParams.mockReturnValue({ email: "a@b.com" });
  verifyOtp.mockReset().mockResolvedValue({ error: null });
  sendOtp.mockReset().mockResolvedValue({ error: null });
  toast.mockReset();
});

const input = () => screen.getByPlaceholderText("--------");

describe("VerifyOtpScreen", () => {
  it("shows the email", async () => {
    await render(<VerifyOtpScreen />);
    expect(screen.getByText("a@b.com")).toBeTruthy();
  });

  it("strips non-digits and caps at 8", async () => {
    await render(<VerifyOtpScreen />);
    await fireEvent.changeText(input(), "12a3-45");
    expect(input().props.value).toBe("12345");
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("enables one-time-code autofill", async () => {
    await render(<VerifyOtpScreen />);
    expect(input().props.autoComplete).toBe("one-time-code");
  });

  it("auto-verifies on 8th digit", async () => {
    await render(<VerifyOtpScreen />);
    await fireEvent.changeText(input(), "1234567890");
    await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith("a@b.com", "12345678"));
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
  });

  it("navigates to reset-password when success toast hides", async () => {
    await render(<VerifyOtpScreen />);
    await fireEvent.changeText(input(), "12345678");
    await waitFor(() => expect(toast).toHaveBeenCalled());
    toast.mock.calls[0][0].onHide();
    expect(router.replace).toHaveBeenCalledWith("/reset-password");
  });

  it("shows translated error toast on bad code and lets user retry", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "expired", code: "otp_expired" } });
    await render(<VerifyOtpScreen />);
    await fireEvent.changeText(input(), "12345678");
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text1: "Código incorrecto",
          text2: "El código expiró o no es válido",
        }),
      ),
    );
    expect(await screen.findByPlaceholderText("--------")).toBeTruthy();
  });

  it("rejects short code on manual submit", async () => {
    await render(<VerifyOtpScreen />);
    await fireEvent.changeText(input(), "123");
    await fireEvent.press(screen.getByText("Verificar código"));
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ text1: "Código inválido" }));
  });

  it("resends code and starts the cooldown", async () => {
    await render(<VerifyOtpScreen />);
    await fireEvent.press(screen.getByText("Reenviar código"));
    await waitFor(() => expect(sendOtp).toHaveBeenCalledWith("a@b.com"));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ text1: "Código reenviado" })),
    );
    expect(await screen.findByText(/Reenviar código en \d+ s/)).toBeTruthy();
    await fireEvent.press(screen.getByText(/Reenviar código en/));
    expect(sendOtp).toHaveBeenCalledTimes(1);
  });

  it("shows a Spanish message when resend is rate limited", async () => {
    sendOtp.mockResolvedValue({ error: { message: "rate", code: "over_email_send_rate_limit" } });
    await render(<VerifyOtpScreen />);
    await fireEvent.press(screen.getByText("Reenviar código"));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", text2: "Demasiados intentos, espera un momento" }),
      ),
    );
    expect(await screen.findByText("Reenviar código")).toBeTruthy();
  });

  it("recovers from a resend exception", async () => {
    sendOtp.mockRejectedValue(new Error("network"));
    await render(<VerifyOtpScreen />);
    await fireEvent.press(screen.getByText("Reenviar código"));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ text1: "Error inesperado" })),
    );
    expect(await screen.findByText("Reenviar código")).toBeTruthy();
  });
});
