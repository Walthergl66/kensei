import { create } from 'zustand';
import { TrainingPlan, PlanSession } from '@/types';

interface TrainingState {
  plan: TrainingPlan | null;
  currentSessionIndex: number;
  setPlan: (plan: TrainingPlan | null) => void;
  setCurrentSessionIndex: (index: number) => void;
  getCurrentSession: () => PlanSession | null;
  clearPlan: () => void;
}

export const useTrainingStore = create<TrainingState>((set, get) => ({
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
}));
