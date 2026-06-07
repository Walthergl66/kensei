import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimerConfig, TimerStatus } from '@/types';
import { DEFAULT_TIMER } from '@/constants';

export interface TimerPreset {
  id: string;
  name: string;
  config: TimerConfig;
  userId: string;
}

interface TimerState {
  config: TimerConfig;
  status: TimerStatus;
  currentRound: number;
  timeLeft: number;
  totalTimeLeft: number;
  sessionSource: string | null;
  pausedAt: number | null;
  presets: TimerPreset[];
  setConfig: (config: Partial<TimerConfig>) => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  startFromSession: (config: TimerConfig, sessionName: string) => void;
  savePreset: (name: string, userId: string) => void;
  deletePreset: (id: string) => void;
  loadPreset: (preset: TimerPreset) => void;
  getPresetsForUser: (userId: string) => TimerPreset[];
}

function calculateTotalTime(config: TimerConfig): number {
  return config.rounds * config.round_duration + (config.rounds - 1) * config.rest_duration;
}

const SYSTEM_PRESETS: TimerPreset[] = [
  { id: 'sys-1', name: 'Boxeo Pro', config: { rounds: 12, round_duration: 180, rest_duration: 60, warning_seconds: 10 }, userId: '__system__' },
  { id: 'sys-2', name: 'MMA', config: { rounds: 5, round_duration: 300, rest_duration: 60, warning_seconds: 10 }, userId: '__system__' },
  { id: 'sys-3', name: 'Tabata', config: { rounds: 8, round_duration: 20, rest_duration: 10, warning_seconds: 5 }, userId: '__system__' },
];

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      config: { ...DEFAULT_TIMER },
      status: 'idle',
      currentRound: 1,
      timeLeft: DEFAULT_TIMER.round_duration,
      totalTimeLeft: calculateTotalTime(DEFAULT_TIMER),
      sessionSource: null,
      pausedAt: null,
      presets: [...SYSTEM_PRESETS],

      getPresetsForUser: (userId: string) => {
        const all = get().presets;
        const system = all.filter((p) => p.userId === '__system__');
        const user = all.filter((p) => p.userId === userId);
        return [...system, ...user];
      },

      setConfig: (partial) =>
        set((state) => {
          const newConfig = { ...state.config, ...partial };
          const totalTimeLeft = state.status === 'idle' ? calculateTotalTime(newConfig) : state.totalTimeLeft;
          return { config: newConfig, totalTimeLeft };
        }),

      startTimer: () => {
        const { config } = get();
        set({
          status: 'running',
          currentRound: 1,
          timeLeft: config.round_duration,
          totalTimeLeft: calculateTotalTime(config),
          pausedAt: null,
        });
      },

      stopTimer: () => set({ status: 'idle', sessionSource: null, pausedAt: null }),

      resetTimer: () =>
        set({
          status: 'idle',
          currentRound: 1,
          timeLeft: get().config.round_duration,
          totalTimeLeft: calculateTotalTime(get().config),
          sessionSource: null,
          pausedAt: null,
        }),

      pauseTimer: () => set({ pausedAt: Date.now() }),

      resumeTimer: () => {
        const { pausedAt, status } = get();
        if (!pausedAt || (status !== 'running' && status !== 'resting' && status !== 'warning')) return;
        const elapsed = Math.floor((Date.now() - pausedAt) / 1000);
        if (elapsed <= 0) {
          set({ pausedAt: null });
          return;
        }

        let { timeLeft, totalTimeLeft, status: currentStatus, currentRound, config } = get();
        let remainingTime = timeLeft - elapsed;
        let remainingTotal = totalTimeLeft - elapsed;
        if (remainingTotal <= 0) {
          set({ status: 'finished', timeLeft: 0, totalTimeLeft: 0, pausedAt: null });
          return;
        }

        while (remainingTime <= 0 && currentStatus !== 'finished') {
          if (currentStatus === 'running' || currentStatus === 'warning') {
            if (currentRound < config.rounds) {
              currentStatus = 'resting';
              remainingTime = config.rest_duration + remainingTime;
              currentRound = currentRound;
            } else {
              set({ status: 'finished', timeLeft: 0, totalTimeLeft: 0, pausedAt: null });
              return;
            }
          } else if (currentStatus === 'resting') {
            currentStatus = 'running';
            currentRound = currentRound + 1;
            remainingTime = config.round_duration + remainingTime;
          }
        }

        const isWarning = (currentStatus === 'running' || currentStatus === 'warning') && remainingTime <= config.warning_seconds;
        set({
          status: remainingTime <= 0 ? 'finished' : isWarning ? 'warning' : currentStatus,
          currentRound,
          timeLeft: Math.max(0, remainingTime),
          totalTimeLeft: Math.max(0, remainingTotal),
          pausedAt: null,
        });
      },

      tick: () => {
        const { status, timeLeft, currentRound, config } = get();
        if (status !== 'running' && status !== 'resting' && status !== 'warning') return;

        const newTimeLeft = timeLeft - 1;

        const isWork = status === 'running' || status === 'warning';
        const duration = isWork ? config.round_duration : config.rest_duration;
        const halfway = Math.floor(duration / 2);

        if (isWork && newTimeLeft === halfway) {
          import('@/lib/notifications').then(({ soundManager }) => soundManager.play('halfway'));
        }
        if (newTimeLeft <= 3 && newTimeLeft > 0) {
          import('@/lib/notifications').then(({ soundManager }) => soundManager.play('beep'));
        }
        if (newTimeLeft === 0) {
          import('@/lib/notifications').then(({ soundManager }) => soundManager.play('finish'));
        }

        if (newTimeLeft <= 0) {
          if (isWork) {
            if (currentRound < config.rounds) {
              set({
                status: 'resting',
                timeLeft: config.rest_duration,
                totalTimeLeft: get().totalTimeLeft - 1,
              });
              import('@/lib/notifications').then(({ soundManager }) => soundManager.play('finish'));
            } else {
              set({ status: 'finished', timeLeft: 0, totalTimeLeft: 0 });
            }
          } else if (status === 'resting') {
            set({
              status: 'running',
              currentRound: currentRound + 1,
              timeLeft: config.round_duration,
              totalTimeLeft: get().totalTimeLeft - 1,
            });
            import('@/lib/notifications').then(({ soundManager }) => soundManager.play('finish'));
          }
        } else {
          const isWarning = isWork && newTimeLeft <= config.warning_seconds;
          set({
            timeLeft: newTimeLeft,
            totalTimeLeft: get().totalTimeLeft - 1,
            status: isWarning ? 'warning' : (status === 'warning' && newTimeLeft > config.warning_seconds ? 'running' : status),
          });
        }
      },

      startFromSession: (config, sessionName) =>
        set({
          config,
          status: 'idle',
          currentRound: 1,
          timeLeft: config.round_duration,
          totalTimeLeft: calculateTotalTime(config),
          sessionSource: sessionName,
          pausedAt: null,
        }),

      savePreset: (name, userId) => {
        const newPreset: TimerPreset = {
          id: Date.now().toString(),
          name,
          config: { ...get().config },
          userId,
        };
        set((state) => ({ presets: [...state.presets, newPreset] }));
      },

      deletePreset: (id) => {
        set((state) => ({ presets: state.presets.filter((p) => p.id !== id) }));
      },

      loadPreset: (preset) => {
        set({
          config: { ...preset.config },
          timeLeft: preset.config.round_duration,
          totalTimeLeft: calculateTotalTime(preset.config),
          currentRound: 1,
          status: 'idle',
        });
      },
    }),
    {
      name: 'kensei-timer-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ presets: state.presets }),
    }
  )
);
