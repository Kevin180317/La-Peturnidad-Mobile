import AsyncStorage from "@react-native-async-storage/async-storage";
import { dashboardService, getImageType, getStoragePath } from "@/services/dashboard.service";
import { File } from "expo-file-system";
import { calls, mockTable, resetSupabaseMock, storageBucket, supabaseMock } from "../../test/supabaseMock";

// La imagen local se lee con expo-file-system: fetch("file://...") en Expo Go devolvía "File not found"
// (14 bytes) por la ruta doblemente codificada y se subía como si fuera la foto
jest.mock("expo-file-system", () => ({ File: jest.fn() }));
const MockFile = File as unknown as jest.Mock;

const MB = 1024 * 1024;
type Err = { message: string };

beforeEach(async () => {
  resetSupabaseMock();
  await AsyncStorage.clear();
  supabaseMock.auth.getSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

const mockDownload = (bytes: number) => {
  MockFile.mockImplementation(() => ({ arrayBuffer: async () => new ArrayBuffer(bytes) }));
};

describe("image helpers", () => {
  it("getImageType prefers the mime type, then the extension, then jpeg", () => {
    expect(getImageType({ uri: "file:///a.jpg", mimeType: "image/png" })).toMatchObject({ ext: "png", contentType: "image/png" });
    expect(getImageType({ uri: "file:///a.webp?x=1" })).toMatchObject({ ext: "webp" });
    expect(getImageType({ uri: "file:///a.bin", mimeType: "application/pdf" })).toMatchObject({ ext: "jpg" });
  });

  it("getStoragePath extracts the path only for the right bucket", () => {
    const url = "https://x.supabase.co/storage/v1/object/public/pet-images/u1/a%20b.jpg?t=1";
    expect(getStoragePath(url, "pet-images")).toBe("u1/a b.jpg");
    expect(getStoragePath(url, "posts")).toBeNull();
    expect(getStoragePath(null, "pet-images")).toBeNull();
  });
});

describe("dashboardService.uploadImage", () => {
  it("rejects files over 5 MB before touching storage", async () => {
    const res = await dashboardService.uploadImage({ uri: "file:///a.jpg", fileSize: 6 * MB }, "posts");
    expect(res).toEqual({ success: false, error: "La imagen supera 5 MB" });
    expect(supabaseMock.storage.from).not.toHaveBeenCalled();
  });

  it("rejects when the downloaded file is over 5 MB even if the picker did not report a size", async () => {
    mockDownload(5 * MB + 1);
    const res = await dashboardService.uploadImage({ uri: "file:///a.jpg" }, "posts");
    expect(res).toEqual({ success: false, error: "La imagen supera 5 MB" });
    expect(storageBucket.upload).not.toHaveBeenCalled();
  });

  it("fails without a session", async () => {
    supabaseMock.auth.getSession.mockResolvedValue({ data: { session: null } });
    const res = await dashboardService.uploadImage("file:///a.jpg", "posts");
    expect(res.success).toBe(false);
    expect(storageBucket.upload).not.toHaveBeenCalled();
  });

  it("reads the local file with expo-file-system, not fetch", async () => {
    mockDownload(1000);
    global.fetch = jest.fn() as typeof fetch;
    const uri = "file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540idarko%252Fapp/ImagePicker/a.jpeg";
    const res = await dashboardService.uploadImage({ uri }, "profile-pictures");
    expect(res.success).toBe(true);
    expect(MockFile).toHaveBeenCalledWith(uri);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(storageBucket.upload.mock.calls[0][1].byteLength).toBe(1000);
  });

  it("does not upload when the local file cannot be read", async () => {
    MockFile.mockImplementation(() => ({ arrayBuffer: async () => { throw new Error("File not found"); } }));
    const res = await dashboardService.uploadImage({ uri: "file:///missing.jpg" }, "profile-pictures");
    expect(res.success).toBe(false);
    expect(storageBucket.upload).not.toHaveBeenCalled();
  });

  it("does not upload an empty file", async () => {
    mockDownload(0);
    const res = await dashboardService.uploadImage({ uri: "file:///empty.jpg" }, "profile-pictures");
    expect(res).toEqual({ success: false, error: "No se pudo leer la imagen, intenta con otra" });
    expect(storageBucket.upload).not.toHaveBeenCalled();
  });

  it("uploads under the user's folder with the real content type and returns the public url", async () => {
    mockDownload(1000);
    const res = await dashboardService.uploadImage({ uri: "file:///a.png", mimeType: "image/png" }, "posts");
    expect(res.success).toBe(true);
    expect(res.url).toContain("/object/public/");
    const [path, , options] = storageBucket.upload.mock.calls[0];
    expect(path).toMatch(/^u1\/\d+_[a-z0-9]+\.png$/);
    expect(options).toMatchObject({ contentType: "image/png", upsert: false });
  });
});

describe("dashboardService.deletePet", () => {
  it("resolves the pet's active alerts, deletes the pet and removes its image", async () => {
    const url = "https://x.supabase.co/storage/v1/object/public/pet-images/u1/luna.jpg";
    expect(await dashboardService.deletePet("p1", url)).toEqual({ success: true });

    const alertUpdate = calls.findIndex((c) => c.table === "emergency_alerts" && c.method === "update");
    const petDelete = calls.findIndex((c) => c.table === "pets" && c.method === "delete");
    expect(alertUpdate).toBeGreaterThanOrEqual(0);
    expect(alertUpdate).toBeLessThan(petDelete);
    expect(calls[alertUpdate].args[0]).toMatchObject({ status: "resolved" });
    expect(calls).toContainEqual({ table: "emergency_alerts", method: "eq", args: ["pet_id", "p1"] });
    expect(storageBucket.remove).toHaveBeenCalledWith(["u1/luna.jpg"]);
  });

  it("does not delete the pet if its alerts cannot be resolved", async () => {
    mockTable("emergency_alerts", { error: { message: "rls" } });
    const res = await dashboardService.deletePet("p1", null);
    expect(res).toEqual({ success: false, error: "rls" });
    expect(calls.some((c) => c.table === "pets" && c.method === "delete")).toBe(false);
  });
});

describe("dashboardService.createEmergencyAlert", () => {
  const alertData = { user_id: "u1", pet_name: "Luna", last_seen_location: "Centro" };

  it("maps the unique-index violation to a friendly message", async () => {
    mockTable("emergency_alerts", { error: { code: "23505", message: "dup" } as Err });
    expect(await dashboardService.createEmergencyAlert(alertData)).toEqual({
      success: false,
      error: "Esta mascota ya tiene una alerta activa",
    });
    expect(supabaseMock.functions.invoke).not.toHaveBeenCalled();
  });

  it("notifies the neighbours after creating the alert", async () => {
    mockTable("emergency_alerts", { data: { id: "a1" } });
    const res = await dashboardService.createEmergencyAlert(alertData);
    expect(res).toMatchObject({ success: true, notified: true });
    expect(supabaseMock.functions.invoke).toHaveBeenCalledWith("send-push-notification", {
      body: { type: "emergency", alertId: "a1" },
    });
  });

  it("still succeeds but reports notified=false when the push fails", async () => {
    mockTable("emergency_alerts", { data: { id: "a1" } });
    supabaseMock.functions.invoke.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await dashboardService.createEmergencyAlert(alertData)).toMatchObject({ success: true, notified: false });
  });
});

describe("dashboardService.reportFoundPet", () => {
  const alert = { id: "a1", user_id: "owner" } as never;

  it("inserts only finder and alert (a DB trigger fills the rest) and pushes the owner", async () => {
    mockTable("found_pets", { data: { id: "f1" } });
    const res = await dashboardService.reportFoundPet(alert, "finder");
    expect(res).toMatchObject({ success: true, notified: true });
    expect(calls).toContainEqual({
      table: "found_pets",
      method: "insert",
      args: [[{ user_id: "finder", alert_id: "a1" }]],
    });
    expect(supabaseMock.functions.invoke).toHaveBeenCalledWith("send-push-notification", {
      body: { type: "found", foundId: "f1" },
    });
  });

  it("maps a duplicate report", async () => {
    mockTable("found_pets", { error: { code: "23505", message: "dup" } as Err });
    expect(await dashboardService.reportFoundPet(alert, "finder")).toEqual({
      success: false,
      error: "Ya avisaste al dueño de esta mascota",
    });
  });

  it("maps the trigger error for an alert that is no longer active", async () => {
    mockTable("found_pets", { error: { message: "La alerta ya no está activa" } });
    expect(await dashboardService.reportFoundPet(alert, "finder")).toEqual({
      success: false,
      error: "La alerta ya no está activa",
    });
  });
});

describe("push token for this device", () => {
  it("saveFcmToken registers through the RPC", async () => {
    expect(await dashboardService.saveFcmToken("tok-1")).toEqual({ success: true });
    expect(supabaseMock.rpc).toHaveBeenCalledWith("register_device_token", { p_token: "tok-1" });
  });

  it("saveFcmToken reports the failure", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: null, error: { message: "No autorizado" } });
    expect(await dashboardService.saveFcmToken("tok-2")).toEqual({ success: false, error: "No autorizado" });
  });

  it("logout removes only this device's token", async () => {
    await dashboardService.saveFcmToken("tok-3");
    await dashboardService.removeDeviceToken("u1");
    expect(calls).toContainEqual({ table: "device_tokens", method: "eq", args: ["user_id", "u1"] });
    expect(calls).toContainEqual({ table: "device_tokens", method: "eq", args: ["token", "tok-3"] });
  });
});

describe("dashboardService.signOut", () => {
  it("only closes this device's session", async () => {
    supabaseMock.auth.signOut.mockResolvedValue({ error: null });
    expect(await dashboardService.signOut()).toEqual({ success: true });
    expect(supabaseMock.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("succeeds offline, when the local session was removed despite the error", async () => {
    supabaseMock.auth.signOut.mockResolvedValue({ error: { message: "offline" } });
    supabaseMock.auth.getSession.mockResolvedValue({ data: { session: null } });
    expect(await dashboardService.signOut()).toEqual({ success: true });
  });

  it("fails if the session is still there", async () => {
    supabaseMock.auth.signOut.mockResolvedValue({ error: { message: "fallo" } });
    supabaseMock.auth.getSession.mockResolvedValue({ data: { session: { user: {} } } });
    expect(await dashboardService.signOut()).toEqual({ success: false, error: "fallo" });
  });
});
