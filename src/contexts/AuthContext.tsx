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

      if (error) {
        // If Supabase hits rate limit on email sending or requests
        const errMsg = error.message || '';
        if (
          errMsg.toLowerCase().includes('rate limit') || 
          errMsg.toLowerCase().includes('over_email_send_rate_limit') ||
          errMsg.toLowerCase().includes('for security purposes') ||
          (error as unknown as { status?: number }).status === 429
        ) {
          // Attempt direct sign-in in case credentials were saved or user exists
          try {
            const signInRes = await supabase.auth.signInWithPassword({ email, password });
            if (!signInRes.error && signInRes.data.session) {
              setSession(signInRes.data.session);
              setUser(signInRes.data.session.user);
              if (signInRes.data.session.user) {
                await fetchProfile(signInRes.data.session.user.id);
                await setOnlineStatus(signInRes.data.session.user.id, 'online');
              }
              return { error: null, autoLoggedIn: true };
            }
          } catch {
            // Ignore fallback error
          }
          return { 
            error: 'Account rate limit reached on email verification. If your account was already created, please click "Sign In" with your password.' 
          };
        }
        return { error: error.message };
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        if (data.session.user) {
          await fetchProfile(data.session.user.id);
          await setOnlineStatus(data.session.user.id, 'online');
        }
        return { error: null, autoLoggedIn: true };
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
