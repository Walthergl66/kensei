import { create } from 'zustand';
import { TrainingPlan, PlanSession } from '@/types';

interface TrainingState {
  plan: TrainingPlan | null;
  currentSessionIndex: number;
  isLoading: boolean;
  setPlan: (plan: TrainingPlan | null) => void;
  setCurrentSessionIndex: (index: number) => void;
  setIsLoading: (loading: boolean) => void;
  getCurrentSession: () => PlanSession | null;
}

export const useTrainingStore = create<TrainingState>((set, get) => ({
  plan: null,
  currentSessionIndex: 0,
  isLoading: false,

  setPlan: (plan) => set({ plan, currentSessionIndex: 0 }),
  setCurrentSessionIndex: (currentSessionIndex) => set({ currentSessionIndex }),
  setIsLoading: (isLoading) => set({ isLoading }),

  getCurrentSession: () => {
    const { plan, currentSessionIndex } = get();
    if (!plan || !plan.weekly_structure[currentSessionIndex]) return null;
    return plan.weekly_structure[currentSessionIndex];
  },
}));
