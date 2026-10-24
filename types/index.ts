// types/index.ts
// Tipos de dominio derivados del esquema generado (types/database.ts): la base es la fuente de verdad.
// Solo se sobrescriben las columnas `text` que la app trata como uniones literales (CHECK / convención).
import type { Tables } from "@/types/database";

type Override<T, O> = Omit<T, keyof O> & O;

export type ServiceResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string; data?: T };

export type UserProfile = Override<
  Tables<"user_profiles">,
  { role: "user" | "moderator" | "admin" }
>;

export type Pet = Tables<"pets">;

export type EmergencyAlert = Override<
  Tables<"emergency_alerts">,
  { status: "active" | "resolved" }
>;

export type EmergencyAlertWithOwner = EmergencyAlert & {
  owner_name: string;
  owner_phone: string;
  owner_address: string;
};

export type FoundPet = Tables<"found_pets">;

export type NotificationPreference = Tables<"notification_preferences">;

export type Announcement = Override<
  Tables<"announcements">,
  { category: "aviso" | "evento" | "pregunta" | "general" }
>;

export type AnnouncementWithOwner = Announcement & {
  owner_name: string;
  owner_profile_picture: string | null;
};

export type Post = Tables<"posts">;

export type PostWithOwner = Post & {
  owner_name: string;
  owner_profile_picture: string | null;
  comment_count: number;
};

export type Comment = Override<
  Tables<"comments">,
  { target_type: "post" | "announcement" | "alert" }
>;

export type CommentWithOwner = Comment & {
  owner_name: string;
  owner_profile_picture: string | null;
};

export type Follow = Tables<"follows">;

export type Conversation = Tables<"conversations">;

export type ConversationWithParticipant = Conversation & {
  other_user_id: string;
  other_user_name: string;
  other_user_picture: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_group: boolean;
  group_name: string | null;
};

export type Message = Tables<"messages">;

export type Group = Tables<"groups">;

export type GroupMember = Override<Tables<"group_members">, { role: "member" | "admin" }>;

export type SuccessStory = Tables<"success_stories">;

export type Report = Override<
  Tables<"reports">,
  { status: "pending" | "reviewed" | "dismissed" }
>;
