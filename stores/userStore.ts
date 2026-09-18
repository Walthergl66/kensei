import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PendingOnboarding, UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface UserState {
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isOnboarded: boolean;
  isDevMode: boolean;
  remindersEnabled: boolean;
  reminderTime: { hour: number; minute: number };
  pendingOnboarding: PendingOnboarding | null;
  setProfile: (profile: UserProfile | null) => void;
  setSession: (session: Session | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsOnboarded: (onboarded: boolean) => void;
  setDevMode: (dev: boolean) => void;
  setReminders: (enabled: boolean, time?: { hour: number; minute: number }) => void;
  setPendingOnboarding: (pending: PendingOnboarding | null) => void;
  clearPendingOnboarding: () => void;
  signOut: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      session: null,
      isLoading: true,
      isOnboarded: false,
      isDevMode: false,
      remindersEnabled: false,
      reminderTime: { hour: 9, minute: 0 },
      pendingOnboarding: null,
      setProfile: (profile) => set({ profile }),
      setSession: (session) => set({ session }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
      setDevMode: (isDevMode) => set({ isDevMode }),
      setReminders: (remindersEnabled, reminderTime) => set((state) => ({ 
        remindersEnabled, 
        reminderTime: reminderTime || state.reminderTime 
      })),
      setPendingOnboarding: (pendingOnboarding) => set({ pendingOnboarding }),
      clearPendingOnboarding: () => set({ pendingOnboarding: null }),
      signOut: async () => {
        if (supabase) {
          await supabase.auth.signOut();
        }
        set({ profile: null, session: null, isOnboarded: false });
      },
    }),
    {
      name: 'kensei-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        profile: state.profile,
        remindersEnabled: state.remindersEnabled, 
        reminderTime: state.reminderTime,
        pendingOnboarding: state.pendingOnboarding,
        isOnboarded: state.isOnboarded,
        isDevMode: state.isDevMode
      }),
    }
  )
);
