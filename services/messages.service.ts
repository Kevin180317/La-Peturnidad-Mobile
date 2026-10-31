import { type ConversationWithParticipant, type Message, type ServiceResult } from "@/types";
import { reportsService } from "@/services/reports.service";
import { supabase } from "@/utils/supabase";

const BLOCKED_MESSAGE = "No puedes enviar mensajes a este usuario";
const MESSAGES_LIMIT = 500;

// Traduce errores del backend (bloqueo / RLS) a mensajes legibles
function friendlyError(error: any, fallback = "Ocurrió un error, intenta de nuevo"): string {
  const msg: string = error?.message ?? "";
  if (msg.includes(BLOCKED_MESSAGE)) return BLOCKED_MESSAGE;
  if (error?.code === "42501" || /row-level security/i.test(msg)) {
    return "No puedes enviar mensajes en esta conversación";
  }
  return msg || fallback;
}

class MessagesService {
  async getConversations(userId: string): Promise<ServiceResult<ConversationWithParticipant[]>> {
    try {
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);
      if (partError) throw partError;

      if (!participations || participations.length === 0) {
        return { success: true, data: [] };
      }

      const convIds = participations.map((p) => p.conversation_id);

      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", convIds)
        .order("updated_at", { ascending: false });
      if (convError) throw convError;

      if (!conversations || conversations.length === 0) {
        return { success: true, data: [] };
      }

      const directIds = conversations.filter((c) => !c.group_id).map((c) => c.id);
      const groupIds = [...new Set(conversations.filter((c) => c.group_id).map((c) => c.group_id as string))];

      // Otro participante solo para chats 1:1 (en grupos no interesa cada miembro)
      const [participantsRes, groupsRes, blockedRes] = await Promise.all([
        directIds.length > 0
          ? supabase
            .from("conversation_participants")
            .select("conversation_id, user_id")
            .in("conversation_id", directIds)
            .neq("user_id", userId)
          : Promise.resolve({ data: [] as { conversation_id: string; user_id: string }[], error: null }),
        groupIds.length > 0
          ? supabase.from("groups").select("id, name").in("id", groupIds)
          : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
        reportsService.getBlockedUsers(userId),
      ]);

      const convOtherUser: Record<string, string> = {};
      (participantsRes.data ?? []).forEach((p) => {
        if (!convOtherUser[p.conversation_id]) convOtherUser[p.conversation_id] = p.user_id;
      });

      const groupNames: Record<string, string> = {};
      (groupsRes.data ?? []).forEach((g) => {
        groupNames[g.id] = g.name;
      });

      const blocked = new Set(blockedRes.data ?? []);

      // Oculta chats 1:1 con usuarios que bloqueé
      const visible = conversations.filter((c) => {
        if (c.group_id) return true;
        const other = convOtherUser[c.id];
        return !other || !blocked.has(other);
      });
      if (visible.length === 0) return { success: true, data: [] };

      const visibleIds = visible.map((c) => c.id);
      const otherUserIds = [...new Set(visible.map((c) => convOtherUser[c.id]).filter(Boolean))];

      const [profilesRes, recentRes, unreadRes] = await Promise.all([
        otherUserIds.length > 0
          ? supabase
            .from("user_profiles")
            .select("user_id, first_name, last_name, profile_picture_url")
            .in("user_id", otherUserIds)
          : Promise.resolve({ data: [] as any[], error: null }),
        // Mensajes recientes de todas las conversaciones; se reduce al último por conversación
        supabase
          .from("messages")
          .select("conversation_id, content, created_at")
          .in("conversation_id", visibleIds)
          .order("created_at", { ascending: false })
          .limit(Math.min(visibleIds.length * 20, 1000)),
        supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", visibleIds)
          .neq("sender_id", userId)
          .is("read_at", null)
          .limit(5000),
      ]);

      const profileMap: Record<string, any> = {};
      (profilesRes.data ?? []).forEach((p: any) => {
        profileMap[p.user_id] = p;
      });

      const lastMsg: Record<string, { content: string; created_at: string | null }> = {};
      (recentRes.data ?? []).forEach((m) => {
        if (!lastMsg[m.conversation_id]) lastMsg[m.conversation_id] = m;
      });

      // Conversaciones que no aparecieron en la ventana reciente (pocas): consulta individual
      const missing = visibleIds.filter((cid) => !lastMsg[cid]);
      if (missing.length > 0 && (recentRes.data?.length ?? 0) >= Math.min(visibleIds.length * 20, 1000)) {
        const extra = await Promise.all(
          missing.map((cid) =>
            supabase
              .from("messages")
              .select("conversation_id, content, created_at")
              .eq("conversation_id", cid)
              .order("created_at", { ascending: false })
              .limit(1),
          ),
        );
        extra.forEach((r) => {
          const m = r.data?.[0];
          if (m) lastMsg[m.conversation_id] = m;
        });
      }

      const unread: Record<string, number> = {};
      (unreadRes.data ?? []).forEach((m) => {
        unread[m.conversation_id] = (unread[m.conversation_id] ?? 0) + 1;
      });

      const transformedData: ConversationWithParticipant[] = visible.map((conv) => {
        const isGroup = !!conv.group_id;
        let groupName: string | null = null;
        const otherId = isGroup ? "" : convOtherUser[conv.id] ?? "";
        let otherName = "Usuario";
        let otherPicture: string | null = null;

        if (isGroup) {
          groupName = groupNames[conv.group_id ?? ""] || "Grupo";
          otherName = groupName;
        } else {
          const profile = profileMap[otherId] || {};
          // Sin otro participante: la otra persona eliminó el chat o su cuenta
          otherName = otherId
            ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Usuario"
            : "Conversación cerrada";
          otherPicture = profile.profile_picture_url || null;
        }

        return {
          id: conv.id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          group_id: conv.group_id,
          other_user_id: otherId,
          other_user_name: otherName,
          other_user_picture: otherPicture,
          last_message: lastMsg[conv.id]?.content || null,
          last_message_at: lastMsg[conv.id]?.created_at || null,
          unread_count: unread[conv.id] || 0,
          is_group: isGroup,
          group_name: groupName,
        };
      });

      return { success: true, data: transformedData };
    } catch (error: any) {
      return { success: false, error: friendlyError(error), data: [] };
    }
  }

  async getMessages(conversationId: string): Promise<ServiceResult<Message[]>> {
    try {
      // Los más recientes primero: en orden ascendente, el tope de filas dejaba fuera los mensajes nuevos
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(MESSAGES_LIMIT);

      if (error) throw error;
      return { success: true, data: (data ?? []).reverse() };
    } catch (error: any) {
      return { success: false, error: friendlyError(error), data: [] };
    }
  }

  // El trigger del backend fija created_at/read_at y actualiza conversations.updated_at
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<ServiceResult<Message>> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: senderId, content })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: friendlyError(error) };
    }
  }

  // create_conversation devuelve el DM 1:1 existente si lo hay (deduplica en el servidor)
  async getOrCreateConversation(userId1: string, userId2: string): Promise<ServiceResult<{ conversation_id: string }>> {
    try {
      const { data: convId, error } = await supabase.rpc("create_conversation", {
        user1_id: userId1,
        user2_id: userId2,
      });

      if (error) throw error;
      if (!convId) throw new Error("No se pudo abrir la conversación");

      return { success: true, data: { conversation_id: convId } };
    } catch (error: any) {
      return { success: false, error: friendlyError(error) };
    }
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .is("read_at", null);
    if (error && __DEV__) console.error("markAsRead:", error.message);
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
      return { success: false, error: friendlyError(error) };
    }
  }
}

export const messagesService = new MessagesService();
