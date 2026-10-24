import { FEED_PAGE_SIZE, postsService } from "@/services/posts.service";
import { calls, mockTable, resetSupabaseMock } from "../../test/supabaseMock";

beforeEach(resetSupabaseMock);

const post = { id: "p1", user_id: "u1", content: "hola", image_url: null, created_at: "2026-10-24T10:00:00Z", updated_at: null };

describe("postsService.getAllPosts pagination", () => {
  it("first page: newest first, page size limit, no cursor", async () => {
    mockTable("posts", { data: [post] });
    await postsService.getAllPosts();
    expect(calls).toContainEqual({ table: "posts", method: "limit", args: [FEED_PAGE_SIZE] });
    expect(calls.some((c) => c.table === "posts" && c.method === "lt")).toBe(false);
  });

  it("next page: asks for posts older than the cursor", async () => {
    mockTable("posts", { data: [post] });
    await postsService.getAllPosts("2026-10-24T09:00:00Z");
    expect(calls).toContainEqual({ table: "posts", method: "lt", args: ["created_at", "2026-10-24T09:00:00Z"] });
  });

  it("returns error + empty data on failure", async () => {
    mockTable("posts", { error: { message: "rls" } });
    expect(await postsService.getAllPosts()).toEqual({ success: false, error: "rls", data: [] });
  });
});
