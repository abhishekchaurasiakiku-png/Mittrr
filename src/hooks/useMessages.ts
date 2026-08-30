import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Message, MessageWithSender, Profile } from '../types/database';

const DEFAULT_PROFILE: Profile = {
  id: '',
  username: 'Unknown',
  full_name: 'Unknown User',
  avatar_url: null,
  status: 'offline',
  last_seen: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function useMessages(conversationId: string | null) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
      return;
    }

    const msgData = (data || []) as unknown as Message[];

    if (msgData.length > 0) {
      // Fetch sender profiles
      const senderIds = [...new Set(msgData.map((m) => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', senderIds);

      const profileList = (profiles || []) as unknown as Profile[];
      const profileMap = new Map<string, Profile>();
      profileList.forEach((p) => profileMap.set(p.id, p));

      const messagesWithSenders: MessageWithSender[] = msgData.map((m) => ({
        ...m,
        sender: profileMap.get(m.sender_id) || { ...DEFAULT_PROFILE, id: m.sender_id },
      }));

      setMessages(messagesWithSenders);
    } else {
      setMessages([]);
    }

    setLoading(false);
  }, [conversationId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as unknown as Message;

          // Fetch sender profile
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single();

          const sender = senderProfile
            ? (senderProfile as unknown as Profile)
            : { ...DEFAULT_PROFILE, id: newMessage.sender_id };

          const messageWithSender: MessageWithSender = {
            ...newMessage,
            sender,
          };

          setMessages((prev) => [...prev, messageWithSender]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const deletedId = (payload.old as Record<string, string>).id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as unknown as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  // Send message
  const sendMessage = async (content: string, type: 'text' | 'image' | 'file' = 'text', fileUrl?: string, fileName?: string) => {
    if (!user || !conversationId) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      type,
      file_url: fileUrl || null,
      file_name: fileName || null,
    } as Record<string, unknown>);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      // Trigger Web Push Notification
      try {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId)
          .neq('user_id', user.id);
          
        if (participants && participants.length > 0) {
          for (const p of participants) {
            fetch('/api/send-push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                receiver_id: p.user_id,
                sender_name: profile?.full_name || profile?.username || 'Someone',
                sender_avatar: profile?.avatar_url,
                message_content: type === 'text' ? content : `Sent a ${type}`,
              })
            }).catch(e => console.error('Push API failed:', e));
          }
        }
      } catch (err) {
        console.error('Failed to trigger push API', err);
      }
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) console.error('Error deleting message:', error);
  };

  // Edit message
  const editMessage = async (messageId: string, newContent: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ content: newContent, is_edited: true } as Record<string, unknown>)
      .eq('id', messageId);

    if (error) console.error('Error editing message:', error);
  };

  return { messages, loading, sendMessage, deleteMessage, editMessage, refetch: fetchMessages };
}
