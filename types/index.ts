// types/index.ts
export type ServiceResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string; data?: T };

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  address: string;
  postal_code: string;
  city: string;
  profile_picture_url: string | null;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  type: "perro" | "gato";
  color: string;
  size: string;
  features?: string;
  image_url: string | null;
  created_at: string;
}

export interface EmergencyAlert {
  id: string;
  user_id: string;
  pet_name: string;
  type: string;
  description: string;
  last_seen_location: string;
  disappearance_date: string;
  image_url: string | null;
  created_at: string;
}

export interface EmergencyAlertWithOwner extends EmergencyAlert {
  owner_name: string;
  owner_phone: string;
  owner_address: string;
}

export interface FoundPet {
  id: string;
  pet_id: string;
  user_id: string;
  created_at: string;
}

export interface FoundPetWithDetails {
  id: string;
  pet_id: string;
  pet_name: string;
  image_url: string | null;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  push_enabled: boolean;
  lost_pet_alerts: boolean;
  found_pet_alerts: boolean;
  community_announcements: boolean;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: "aviso" | "evento" | "pregunta" | "general";
  created_at: string;
  updated_at: string;
}

export interface AnnouncementWithOwner extends Announcement {
  owner_name: string;
  owner_profile_picture: string | null;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithOwner extends Post {
  owner_name: string;
  owner_profile_picture: string | null;
  comment_count: number;
}

export interface Comment {
  id: string;
  user_id: string;
  target_type: "post" | "announcement" | "alert";
  target_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
}

export interface CommentWithOwner extends Comment {
  owner_name: string;
  owner_profile_picture: string | null;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithParticipant extends Conversation {
  other_user_id: string;
  other_user_name: string;
  other_user_picture: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}
