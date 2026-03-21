import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  wallet_balance: number;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile | null;
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }));

        // Defer profile fetch with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(profile => {
              setAuthState(prev => ({ ...prev, profile }));
            });
          }, 0);
        } else {
          setAuthState(prev => ({ ...prev, profile: null }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));

      if (session?.user) {
        fetchProfile(session.user.id).then(profile => {
          setAuthState(prev => ({ ...prev, profile }));
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { username },
      },
    });

    if (error) {
      return { error };
    }

    return { data, error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateWalletBalance = async (newBalance: number) => {
    if (!authState.user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('user_id', authState.user.id);

    if (!error && authState.profile) {
      setAuthState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, wallet_balance: newBalance } : null,
      }));
    }

    return { error };
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateWalletBalance,
    refreshProfile: () => authState.user && fetchProfile(authState.user.id),
  };
};
