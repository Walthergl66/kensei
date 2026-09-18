import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrainingPlan, PlanSession } from '@/types';

interface TrainingState {
  plan: TrainingPlan | null;
  currentSessionIndex: number;
  setPlan: (plan: TrainingPlan | null) => void;
  setCurrentSessionIndex: (index: number) => void;
  getCurrentSession: () => PlanSession | null;
  clearPlan: () => void;
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      plan: null,
      currentSessionIndex: 0,

      setPlan: (plan) => set({ plan, currentSessionIndex: 0 }),
      setCurrentSessionIndex: (currentSessionIndex) => set({ currentSessionIndex }),

      getCurrentSession: () => {
        const { plan, currentSessionIndex } = get();
        if (!plan || !plan.weekly_structure[currentSessionIndex]) return null;
        return plan.weekly_structure[currentSessionIndex];
      },

      clearPlan: () => set({ plan: null, currentSessionIndex: 0 }),
    }),
    {
      name: 'kensei-training-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ plan: state.plan }),
    }
  )
);