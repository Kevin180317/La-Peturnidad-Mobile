import { FeedTab } from "@/components/dashboard/FeedTab";
import { fireEvent, render, screen } from "@testing-library/react-native";

const post = (id: string, user_id: string, owner_name: string) => ({
  id,
  user_id,
  owner_name,
  owner_profile_picture: null,
  content: `contenido de ${owner_name}`,
  image_url: null,
  created_at: "2026-10-24T10:00:00Z",
  comment_count: 0,
});

const posts = [post("p1", "me", "Yo"), post("p2", "other", "Ana"), post("p3", "blocked", "Mala")];

const setup = async (props = {}) => {
  const handlers = {
    onDeletePost: jest.fn(),
    onLoadMoreFeed: jest.fn(),
    onRefresh: jest.fn(),
    onToggleComments: jest.fn(),
    onChangeComment: jest.fn(),
    onAddComment: jest.fn(),
    onDeleteComment: jest.fn(),
    onCreatePost: jest.fn().mockResolvedValue(true),
  };
  await render(
    <FeedTab
      userId="me"
      feedPosts={posts}
      loadingFeed={false}
      refreshing={false}
      comments={[]}
      commentTarget={null}
      commentText=""
      loadingComments={false}
      sendingComment={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
};

const scrollTo = async (offsetY: number) => {
  await fireEvent.scroll(screen.getByTestId("feed-scroll"), {
    nativeEvent: {
      layoutMeasurement: { height: 800 },
      contentOffset: { y: offsetY },
      contentSize: { height: 2000 },
    },
  });
};

describe("FeedTab delete button", () => {
  it("regular user: only on their own posts", async () => {
    const { onDeletePost } = await setup({ blockedUserIds: ["blocked"] });
    const buttons = screen.getAllByLabelText("Eliminar publicación");
    expect(buttons).toHaveLength(1);
    await fireEvent.press(buttons[0]);
    expect(onDeletePost).toHaveBeenCalledWith(expect.objectContaining({ id: "p1" }));
  });

  it("moderator: on every visible post", async () => {
    await setup({ isModerator: true, blockedUserIds: ["blocked"] });
    expect(screen.getAllByLabelText("Eliminar publicación")).toHaveLength(2);
  });
});

describe("FeedTab blocked users", () => {
  it("hides posts from users I blocked", async () => {
    await setup({ blockedUserIds: ["blocked"] });
    expect(screen.getByText("contenido de Ana")).toBeTruthy();
    expect(screen.queryByText("contenido de Mala")).toBeNull();
  });
});

describe("FeedTab infinite scroll", () => {
  it("asks for more posts near the bottom", async () => {
    const { onLoadMoreFeed } = await setup();
    await scrollTo(1500);
    expect(onLoadMoreFeed).toHaveBeenCalledTimes(1);
  });

  it("does not ask while far from the bottom", async () => {
    const { onLoadMoreFeed } = await setup();
    await scrollTo(100);
    expect(onLoadMoreFeed).not.toHaveBeenCalled();
  });
});

describe("FeedTab post card", () => {
  it("comments pill toggles comments for that post", async () => {
    const { onToggleComments } = await setup();
    await fireEvent.press(screen.getAllByLabelText("Ver comentarios")[0]);
    expect(onToggleComments).toHaveBeenCalledWith("post", "p1");
  });

  it("shows the comment box only for the open post and sends", async () => {
    const { onAddComment } = await setup({ commentTarget: { type: "post", id: "p2" }, commentText: "hola" });
    expect(screen.getAllByLabelText("Ocultar comentarios")).toHaveLength(1);
    await fireEvent.press(screen.getByLabelText("Enviar comentario"));
    expect(onAddComment).toHaveBeenCalled();
  });

  it("does not send an empty comment", async () => {
    const { onAddComment } = await setup({ commentTarget: { type: "post", id: "p2" }, commentText: "  " });
    await fireEvent.press(screen.getByLabelText("Enviar comentario"));
    expect(onAddComment).not.toHaveBeenCalled();
  });

  it("shows skeletons while loading", async () => {
    await setup({ loadingFeed: true });
    expect(screen.getAllByTestId("feed-skeleton").length).toBeGreaterThan(0);
  });
});

describe("FeedTab sections", () => {
  it("switches to emergencies and shows the empty state", async () => {
    await setup();
    await fireEvent.press(screen.getByText("Emergencias"));
    expect(screen.getByText("No hay alertas de emergencia activas")).toBeTruthy();
  });
});
