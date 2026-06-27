import { type ConversationWithParticipant, type Message, type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

class MessagesService {
  async getConversations(userId: string): Promise<ServiceResult<ConversationWithParticipant[]>> {
    try {
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);

      if (!participations || participations.length === 0) {
        return { success: true, data: [] };
      }

      const convIds = participations.map((p) => p.conversation_id);

      const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .in("id", convIds)
        .order("updated_at", { ascending: false });

      if (!conversations || conversations.length === 0) {
        return { success: true, data: [] };
      }

      const { data: allParticipants } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", convIds);

      const otherUserIds: string[] = [];
      const convOtherUser: Record<string, string> = {};

      allParticipants?.forEach((p) => {
        if (p.user_id !== userId) {
          otherUserIds.push(p.user_id);
          convOtherUser[p.conversation_id] = p.user_id;
        }
      });

      const profileMap: Record<string, any> = {};
      if (otherUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("user_id, first_name, last_name, profile_picture_url")
          .in("user_id", otherUserIds);

        profiles?.forEach((p) => {
          profileMap[p.user_id] = p;
        });
      }

      const transformedData: ConversationWithParticipant[] = [];

      for (const conv of conversations) {
        const isGroup = !!conv.group_id;
        let groupName: string | null = null;
        let otherId = convOtherUser[conv.id];
        let otherName = "Usuario";
        let otherPicture: string | null = null;

        if (isGroup) {
          const { data: grp } = await supabase
            .from("groups")
            .select("name")
            .eq("id", conv.group_id)
            .single();

          groupName = grp?.name || "Grupo";
          otherName = `👥 ${groupName}`;
        } else {
          const profile = profileMap[otherId] || {};
          otherName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Usuario";
          otherPicture = profile.profile_picture_url || null;
        }

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", userId)
          .is("read_at", null);

        transformedData.push({
          id: conv.id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          group_id: conv.group_id,
          other_user_id: otherId,
          other_user_name: otherName,
          other_user_picture: otherPicture,
          last_message: lastMsg?.[0]?.content || null,
          last_message_at: lastMsg?.[0]?.created_at || null,
          unread_count: unreadCount || 0,
          is_group: isGroup,
          group_name: groupName,
        });
      }

      return { success: true, data: transformedData };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async getMessages(conversationId: string): Promise<ServiceResult<Message[]>> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<ServiceResult<Message>> {
    try {
      const messageId = generateUUID();
      const createdAt = new Date().toISOString();

      const { error } = await supabase
        .from("messages")
        .insert([{
          id: messageId,
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          created_at: createdAt,
        }]);

      if (error) throw error;

      await supabase
        .from("conversations")
        .update({ updated_at: createdAt })
        .eq("id", conversationId);

      return {
        success: true,
        data: {
          id: messageId,
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          created_at: createdAt,
          read_at: null,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getOrCreateConversation(userId1: string, userId2: string): Promise<ServiceResult<{ conversation_id: string }>> {
    try {
      const { data: convs1 } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId1);

      if (convs1 && convs1.length > 0) {
        const ids1 = convs1.map((c) => c.conversation_id);

        const { data: convs2 } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", userId2)
          .in("conversation_id", ids1);

        if (convs2 && convs2.length > 0) {
          return { success: true, data: { conversation_id: convs2[0].conversation_id } };
        }
      }

      const { data: convId, error: rpcError } = await supabase.rpc("create_conversation", {
        user1_id: userId1,
        user2_id: userId2,
      });

      if (rpcError) throw rpcError;

      return { success: true, data: { conversation_id: convId } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .is("read_at", null);
  }

  async deleteConversation(conversationId: string, userId: string): Promise<ServiceResult> {
    try {
      const { error } = await supabase
        .from("conversation_participants")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getOrCreateGroupConversation(groupId: string, userIds: string[]): Promise<ServiceResult<{ conversation_id: string }>> {
    try {
      const { data: existingConvs } = await supabase
        .from("conversations")
        .select("id")
        .eq("group_id", groupId);

      if (existingConvs && existingConvs.length > 0) {
        return { success: true, data: { conversation_id: existingConvs[0].id } };
      }

      const { data: convId, error: rpcError } = await supabase.rpc("create_group_conversation", {
        group_id_param: groupId,
        member_ids: userIds,
      });

      if (rpcError) throw rpcError;
      return { success: true, data: { conversation_id: convId } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const messagesService = new MessagesService();
