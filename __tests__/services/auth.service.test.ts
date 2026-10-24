import {
  authErrorMessage,
  authService,
  EMAIL_CONFIRMATION_REDIRECT_URL,
  GENERIC_AUTH_ERROR,
  isRateLimitError,
  passwordError,
} from "@/services/auth.service";
import { resetSupabaseMock, supabaseMock } from "../../test/supabaseMock";

const auth = supabaseMock.auth;
// El mock compartido no incluye auth.resend; resetSupabaseMock lo reinicia junto al resto.
auth.resend = jest.fn();

beforeEach(resetSupabaseMock);

describe("authService", () => {
  it("signIn trims email and password", async () => {
    await authService.signIn("  a@b.com ", " pw ");
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@b.com", password: "pw" });
  });

  it("signUp sends redirect url", async () => {
    await authService.signUp(" a@b.com", "pw");
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "pw",
      options: { emailRedirectTo: EMAIL_CONFIRMATION_REDIRECT_URL },
    });
  });

  it("sendOtp never creates users", async () => {
    await authService.sendOtp("a@b.com ");
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: "a@b.com",
      options: { shouldCreateUser: false },
    });
  });

  it("verifyOtp uses email type", async () => {
    await authService.verifyOtp("a@b.com", "12345678");
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: "a@b.com",
      token: "12345678",
      type: "email",
    });
  });

  it("resendConfirmation uses auth.resend with the signup type", async () => {
    await authService.resendConfirmation(" a@b.com ");
    expect(auth.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "a@b.com",
      options: { emailRedirectTo: EMAIL_CONFIRMATION_REDIRECT_URL },
    });
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("updatePassword trims the password", async () => {
    await authService.updatePassword(" newpass ");
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "newpass" });
  });

  describe("signOut", () => {
    it("succeeds with local scope", async () => {
      expect(await authService.signOut()).toEqual({ success: true });
      expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    });

    it("surfaces error", async () => {
      auth.signOut.mockResolvedValue({ error: new Error("net") });
      expect(await authService.signOut()).toEqual({ success: false, error: "net" });
    });
  });
});

describe("authErrorMessage", () => {
  it("maps known codes to Spanish", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toBe("Correo o contraseña incorrectos");
    expect(authErrorMessage({ code: "over_email_send_rate_limit" })).toBe(
      "Demasiados intentos, espera un momento",
    );
    expect(authErrorMessage({ code: "over_request_rate_limit" })).toBe(
      "Demasiados intentos, espera un momento",
    );
    expect(authErrorMessage({ status: 429, message: "Too many" })).toBe(
      "Demasiados intentos, espera un momento",
    );
  });

  it("falls back to a generic Spanish message", () => {
    expect(authErrorMessage({ code: "something_new", message: "raw english" })).toBe(GENERIC_AUTH_ERROR);
    expect(authErrorMessage(null)).toBe(GENERIC_AUTH_ERROR);
  });

  it("detects rate limit errors", () => {
    expect(isRateLimitError({ code: "over_email_send_rate_limit" })).toBe(true);
    expect(isRateLimitError({ code: "otp_disabled" })).toBe(false);
    expect(isRateLimitError(null)).toBe(false);
  });
});

describe("passwordError", () => {

  it("rechaza contraseñas cortas", () => {
    expect(passwordError("abc123")).toMatch(/al menos 8/);
  });

  it("exige letras y números", () => {
    expect(passwordError("abcdefgh")).toMatch(/letras y números/);
    expect(passwordError("12345678")).toMatch(/letras y números/);
  });

  it("acepta una contraseña válida", () => {
    expect(passwordError("lucky2026")).toBeNull();
  });
});
