import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useUserActions() {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [favoriteUsers, setFavoriteUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBlockedUsers(new Set());
      setFavoriteUsers(new Set());
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchActions() {
      try {
        const [blocksRes, favsRes] = await Promise.all([
          supabase.from('blocked_users').select('blocked_id').eq('blocker_id', user!.id),
          supabase.from('favorite_users').select('favorite_id').eq('user_id', user!.id)
        ]);

        if (mounted) {
          const blocks = new Set(blocksRes.data?.map(b => b.blocked_id) || []);
          const favs = new Set(favsRes.data?.map(f => f.favorite_id) || []);
          setBlockedUsers(blocks);
          setFavoriteUsers(favs);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching user actions:', err);
        if (mounted) setLoading(false);
      }
    }

    fetchActions();

    // Subscribe to changes
    const blocksSub = supabase
      .channel(`blocked_users_${user.id}_${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blocked_users', filter: `blocker_id=eq.${user.id}` },
        () => fetchActions()
      )
      .subscribe();

    const favsSub = supabase
      .channel(`favorite_users_${user.id}_${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'favorite_users', filter: `user_id=eq.${user.id}` },
        () => fetchActions()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(blocksSub);
      supabase.removeChannel(favsSub);
    };
  }, [user]);

  const blockUser = async (userId: string) => {
    if (!user) return false;
    const { error } = await supabase.from('blocked_users').insert({ blocker_id: user.id, blocked_id: userId });
    return !error;
  };

  const unblockUser = async (userId: string) => {
    if (!user) return false;
    const { error } = await supabase.from('blocked_users').delete().eq('blocker_id', user.id).eq('blocked_id', userId);
    return !error;
  };

  const favoriteUser = async (userId: string) => {
    if (!user) return false;
    const { error } = await supabase.from('favorite_users').insert({ user_id: user.id, favorite_id: userId });
    return !error;
  };

  const unfavoriteUser = async (userId: string) => {
    if (!user) return false;
    const { error } = await supabase.from('favorite_users').delete().eq('user_id', user.id).eq('favorite_id', userId);
    return !error;
  };

  return {
    blockedUsers,
    favoriteUsers,
    loading,
    blockUser,
    unblockUser,
    favoriteUser,
    unfavoriteUser
  };
}
