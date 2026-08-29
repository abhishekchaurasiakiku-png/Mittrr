import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Conversation, ConversationParticipant, ConversationWithDetails, Profile, Message } from '../types/database';

const DEFAULT_PROFILE: Profile = {
  id: '',
  username: 'Unknown',
  full_name: 'Unknown',
  avatar_url: null,
  status: 'offline',
  last_seen: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    // Get conversations the user participates in
    const { data: participantData, error: pError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    const participants = (participantData || []) as unknown as ConversationParticipant[];

    if (pError || participants.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const conversationIds = participants.map((p) => p.conversation_id);

    // Get conversation details
    const { data: convData, error: cError } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    const convList = (convData || []) as unknown as Conversation[];

    if (cError || convList.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Get all participants for these conversations
    const { data: allParticipantsRaw } = await supabase
      .from('conversation_participants')
      .select('*')
      .in('conversation_id', conversationIds);

    const allParticipants = (allParticipantsRaw || []) as unknown as ConversationParticipant[];

    // Get unique user IDs from participants
    const userIds = [...new Set(allParticipants.map((p) => p.user_id))];

    // Fetch profiles
    const { data: profilesRaw } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    const profilesList = (profilesRaw || []) as unknown as Profile[];
    const profileMap = new Map<string, Profile>();
    profilesList.forEach((p) => profileMap.set(p.id, p));

    // Get last message for each conversation
    const conversationsWithDetails: ConversationWithDetails[] = await Promise.all(
      convList.map(async (conv) => {
        const convParticipants = allParticipants
          .filter((p) => p.conversation_id === conv.id)
          .map((p) => ({
            ...p,
            profile: profileMap.get(p.user_id) || { ...DEFAULT_PROFILE, id: p.user_id },
          }));

        // Fetch last message
        const { data: lastMsgData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMsgList = (lastMsgData || []) as unknown as Message[];

        let lastMessage: (Message & { sender: Profile }) | undefined;
        if (lastMsgList.length > 0) {
          const msg = lastMsgList[0];
          lastMessage = {
            ...msg,
            sender: profileMap.get(msg.sender_id) || { ...DEFAULT_PROFILE, id: msg.sender_id },
          };
        }

        // Calculate unread count
        const myParticipation = allParticipants.find(
          (p) => p.conversation_id === conv.id && p.user_id === user.id
        );
        let unreadCount = 0;
        if (myParticipation?.last_read_at) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .gt('created_at', myParticipation.last_read_at);
          unreadCount = count || 0;
        }

        return {
          ...conv,
          participants: convParticipants,
          last_message: lastMessage,
          unread_count: unreadCount,
        } as ConversationWithDetails;
      })
    );

    setConversations(conversationsWithDetails);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();

    if (!user) return;

    // Subscribe to conversation updates
    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  // Create a new conversation
  const createConversation = async (participantIds: string[], name?: string, type: 'direct' | 'group' = 'direct') => {
    if (!user) return null;

    // For direct chats, check if conversation already exists
    if (type === 'direct' && participantIds.length === 1) {
      const otherUserId = participantIds[0];

      // Get conversations where current user is a participant
      const { data: myConvsRaw } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      const myConvs = (myConvsRaw || []) as unknown as ConversationParticipant[];

      if (myConvs.length > 0) {
        for (const mc of myConvs) {
          const { data: otherParticipantRaw } = await supabase
            .from('conversation_participants')
            .select('*')
            .eq('conversation_id', mc.conversation_id)
            .eq('user_id', otherUserId);

          const otherParticipant = (otherParticipantRaw || []) as unknown as ConversationParticipant[];

          if (otherParticipant.length > 0) {
            // Check if it's a direct conversation
            const { data: convRaw } = await supabase
              .from('conversations')
              .select('*')
              .eq('id', mc.conversation_id)
              .eq('type', 'direct')
              .single();

            const conv = convRaw as unknown as Conversation | null;

            if (conv) {
              await fetchConversations();
              return conv.id;
            }
          }
        }
      }
    }

    // Generate ID client-side so we know it without needing .select()
    const newConvId = crypto.randomUUID();

    // Create new conversation
    const { error: convError } = await supabase
      .from('conversations')
      .insert({
        id: newConvId,
        type,
        name: name || null,
        created_by: user.id,
      } as Record<string, unknown>);

    if (convError) {
      console.error('Error creating conversation:', convError);
      return null;
    }

    // Add participants (including self)
    const allParticipantIds = [...new Set([user.id, ...participantIds])];
    const { error: insertError } = await supabase
      .from('conversation_participants')
      .insert(
        allParticipantIds.map((uid) => ({
          conversation_id: newConvId,
          user_id: uid,
        })) as Record<string, unknown>[]
      );

    if (insertError) {
      console.error('Error adding participants:', insertError);
      return null;
    }

    await fetchConversations();
    return newConvId;
  };

  // Mark conversation as read
  const markAsRead = async (conversationId: string) => {
    if (!user) return;

    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
  };

  return { conversations, loading, createConversation, markAsRead, refetch: fetchConversations };
}
