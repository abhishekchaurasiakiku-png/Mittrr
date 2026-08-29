import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useOnlineStatus() {
  const { user } = useAuth();

  const setOnline = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ status: 'online', last_seen: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', user.id);
  }, [user]);

  const setOffline = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ status: 'offline', last_seen: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', user.id);
  }, [user]);

  const setAway = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ status: 'away', last_seen: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', user.id);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Set online on mount
    setOnline();

    // Set offline on window close/unload
    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for reliable offline status update
      const url = `https://sbqleiyzysrvpgiivztp.supabase.co/rest/v1/profiles?id=eq.${user.id}`;
      const body = JSON.stringify({ status: 'offline', last_seen: new Date().toISOString() });

      navigator.sendBeacon(
        url,
        new Blob([body], { type: 'application/json' })
      );
    };

    // Set away when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAway();
      } else {
        setOnline();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Heartbeat to keep online status
    const heartbeat = setInterval(() => {
      if (!document.hidden) {
        setOnline();
      }
    }, 60000); // every minute

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeat);
      setOffline();
    };
  }, [user, setOnline, setOffline, setAway]);
}
