import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Notification, NotificationWithSender, Profile } from '../types/database';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithSender[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
      return;
    }

    const notifData = (data || []) as unknown as Notification[];

    if (notifData.length > 0) {
      // Fetch senders
      const senderIds = [...new Set(notifData.map((n) => n.sender_id).filter(Boolean))] as string[];
      let profileMap = new Map<string, Profile>();
      
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', senderIds);
          
        if (profiles) {
          profileMap = new Map(profiles.map(p => [p.id, p as unknown as Profile]));
        }
      }

      const withSenders = notifData.map(n => ({
        ...n,
        sender: n.sender_id ? profileMap.get(n.sender_id) : undefined
      }));

      setNotifications(withSenders);
      setUnreadCount(withSenders.filter(n => !n.is_read).length);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }

    setLoading(false);
  }, [user]);

  // Request browser permission and fetch initial notifications
  useEffect(() => {
    if (!user) return;
    
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    fetchNotifications();
  }, [user, fetchNotifications]);

  // Subscribe to real-time new notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newNotif = payload.new as unknown as Notification;
          
          let senderProfile: Profile | undefined;
          if (newNotif.sender_id) {
             const { data: profile } = await supabase
               .from('profiles')
               .select('*')
               .eq('id', newNotif.sender_id)
               .single();
             if (profile) senderProfile = profile as unknown as Profile;
          }
          
          const notifWithSender: NotificationWithSender = {
            ...newNotif,
            sender: senderProfile,
          };
          
          setNotifications(prev => [notifWithSender, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Trigger browser notification
          if (Notification.permission === 'granted') {
             const senderName = senderProfile?.full_name || senderProfile?.username || 'Someone';
             const title = `${senderName} texted you`;
             new Notification(title, {
               body: newNotif.content || 'New message',
               icon: senderProfile?.avatar_url || '/favicon.ico'
             });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as unknown as Notification;
          setNotifications(prev => prev.map(n => n.id === updated.id ? { ...n, ...updated } : n));
          // Recalculate unread count
          setNotifications(prev => {
             const newUnread = prev.filter(n => !n.is_read).length;
             setUnreadCount(newUnread);
             return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    await supabase
      .from('notifications')
      .update({ is_read: true } as any)
      .eq('id', id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    
    await supabase
      .from('notifications')
      .update({ is_read: true } as any)
      .eq('user_id', user?.id);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
}
