import { authService, EMAIL_CONFIRMATION_REDIRECT_URL } from "@/services/auth.service";
import { resetSupabaseMock, supabaseMock } from "../../test/supabaseMock";

const auth = supabaseMock.auth;

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

  describe("getCurrentUser", () => {
    it("returns user", async () => {
      auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
      expect(await authService.getCurrentUser()).toEqual({ success: true, user: { id: "u1" } });
    });

    it("returns error message on failure", async () => {
      auth.getUser.mockResolvedValue({ data: {}, error: new Error("jwt expired") });
      expect(await authService.getCurrentUser()).toEqual({ success: false, error: "jwt expired" });
    });
  });

  describe("signOut", () => {
    it("succeeds", async () => {
      expect(await authService.signOut()).toEqual({ success: true });
    });

    it("surfaces error", async () => {
      auth.signOut.mockResolvedValue({ error: new Error("net") });
      expect(await authService.signOut()).toEqual({ success: false, error: "net" });
    });
  });

  describe("isEmailConfirmed", () => {
    it("true when email_confirmed_at set", async () => {
      auth.getUser.mockResolvedValue({ data: { user: { email_confirmed_at: "2024-01-01" } } });
      expect(await authService.isEmailConfirmed()).toBe(true);
    });

    it("false when unset", async () => {
      auth.getUser.mockResolvedValue({ data: { user: { email_confirmed_at: null } } });
      expect(await authService.isEmailConfirmed()).toBe(false);
    });

    it("false when call throws", async () => {
      auth.getUser.mockRejectedValue(new Error("boom"));
      expect(await authService.isEmailConfirmed()).toBe(false);
    });
  });

  it("resetPassword passes deep link redirect", async () => {
    await authService.resetPassword(" a@b.com ");
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("a@b.com", {
      redirectTo: "lapeturnidad://",
    });
  });
});
