import { create } from 'zustand';
import { UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface UserState {
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isOnboarded: boolean;
  isDevMode: boolean;
  setProfile: (profile: UserProfile | null) => void;
  setSession: (session: Session | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsOnboarded: (onboarded: boolean) => void;
  setDevMode: (dev: boolean) => void;
  signOut: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  session: null,
  isLoading: true,
  isOnboarded: false,
  isDevMode: true,
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
  setDevMode: (isDevMode) => set({ isDevMode }),
  signOut: async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    set({ profile: null, session: null, isOnboarded: false });
  },
}));
