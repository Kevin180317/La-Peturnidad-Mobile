import { AuthRetryableFetchError } from "@supabase/supabase-js";
import { getCurrentUser } from "@/utils/session";
import { resetSupabaseMock, supabaseMock } from "../../test/supabaseMock";

const auth = supabaseMock.auth;

beforeEach(resetSupabaseMock);

describe("getCurrentUser", () => {
  it("returns the validated user", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    expect((await getCurrentUser()).data.user).toEqual({ id: "u1" });
    expect(auth.getSession).not.toHaveBeenCalled();
  });

  it("falls back to the stored session on a network failure", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: new AuthRetryableFetchError("offline", 0) });
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });
    expect((await getCurrentUser()).data.user).toEqual({ id: "u1" });
  });

  it("returns null when the network fails and nothing is stored", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: new AuthRetryableFetchError("offline", 0) });
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect((await getCurrentUser()).data.user).toBeNull();
  });

  it("does not trust the stored session when the server rejects it", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: "invalid JWT", status: 401 } });
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });
    expect((await getCurrentUser()).data.user).toBeNull();
    expect(auth.getSession).not.toHaveBeenCalled();
  });
});
