import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: string | null; autoLoggedIn?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile for a user with retry
  const fetchProfile = async (userId: string, retries = 3): Promise<void> => {
    for (let i = 0; i < retries; i++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        const profileData = data as unknown as Profile;
        
        // Enforce ban/suspend
        if (profileData.account_status === 'banned') {
          alert('Your account has been banned from the platform.');
          await supabase.auth.signOut();
          setProfile(null);
          return;
        }
        
        if (profileData.account_status === 'suspended') {
          if (profileData.suspended_until && new Date(profileData.suspended_until) > new Date()) {
            alert(`Your account is suspended until ${new Date(profileData.suspended_until).toLocaleString()}.`);
            await supabase.auth.signOut();
            setProfile(null);
            return;
          } else {
            // Suspension expired, ideally update DB but for now just let them in
          }
        }

        setProfile(profileData);
        return;
      }

      // If profile not found, try to create it using user's metadata (Fallback if DB trigger is missing)
      if (error && error.code === 'PGRST116') {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user && userData.user.id === userId) {
          const metadata = userData.user.user_metadata || {};
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              username: metadata.username || `user_${userId.substring(0, 8)}`,
              full_name: metadata.full_name || metadata.username || 'User',
              status: 'online',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as any)
            .select()
            .single();
            
          if (!insertError && newProfile) {
            setProfile(newProfile as unknown as Profile);
            return;
          }
        }
      }

      // Profile might not be created yet (trigger delay), wait and retry
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  };

  // Set online status safely (won't error if profile doesn't exist yet)
  const setOnlineStatus = async (userId: string, status: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ status, last_seen: new Date().toISOString() } as Record<string, unknown>)
        .eq('id', userId);
    } catch {
      // Silently fail - profile might not exist yet
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).then(() => {
          setOnlineStatus(currentSession.user.id, 'online');
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          await fetchProfile(newSession.user.id);
          await setOnlineStatus(newSession.user.id, 'online');
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string, fullName: string): Promise<{ error: string | null; autoLoggedIn?: boolean }> => {
    try {
      // 1. Try server API first if deployed on Vercel
      try {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username, full_name: fullName }),
        });
        if (res.ok) {
          // Immediately sign in to get active session
          const loginRes = await signIn(email, password);
          if (!loginRes.error) {
            return { error: null, autoLoggedIn: true };
          }
        }
      } catch {
        // Fallback to client-side supabase if API not available
      }

      // 2. Direct Supabase signUp
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
          },
        },
      });

      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        if (data.session.user) {
          await fetchProfile(data.session.user.id);
          await setOnlineStatus(data.session.user.id, 'online');
        }
        return { error: null, autoLoggedIn: true };
      }

      // 3. Attempt direct sign-in in case auto-confirmed or already registered
      try {
        const signInRes = await supabase.auth.signInWithPassword({ email, password });
        if (!signInRes.error && signInRes.data?.session) {
          setSession(signInRes.data.session);
          setUser(signInRes.data.session.user);
          if (signInRes.data.session.user) {
            await fetchProfile(signInRes.data.session.user.id);
            await setOnlineStatus(signInRes.data.session.user.id, 'online');
          }
          return { error: null, autoLoggedIn: true };
        }
      } catch {
        // Continue
      }

      if (error) {
        const errMsg = error.message || '';
        if (
          errMsg.toLowerCase().includes('rate limit') || 
          errMsg.toLowerCase().includes('over_email_send_rate_limit') ||
          errMsg.toLowerCase().includes('security purposes') ||
          (error as unknown as { status?: number }).status === 429
        ) {
          return { 
            error: 'Supabase email rate limit reached. To fix: Go to Supabase Dashboard -> Authentication -> Rate Limits -> Increase "Email sending rate limit" OR disable "Confirm email" in Providers -> Email.' 
          };
        }
        
        if (errMsg.toLowerCase().includes('email signups are disabled')) {
          return {
            error: 'Email signups are disabled. To fix: Go to Supabase Dashboard -> Authentication -> Providers -> Email -> Toggle ON "Enable Email Provider" and "Enable Email Signups".'
          };
        }

        return { error: error.message };
      }

      return { error: null, autoLoggedIn: false };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      return { error: msg };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };
    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      if (data.session.user) {
        await fetchProfile(data.session.user.id);
        await setOnlineStatus(data.session.user.id, 'online');
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    if (user) {
      await setOnlineStatus(user.id, 'offline');
    }
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('profiles')
      .update(updates as Record<string, unknown>)
      .eq('id', user.id);

    if (error) return { error: error.message };

    setProfile((prev) => prev ? { ...prev, ...updates } : null);
    return { error: null };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
