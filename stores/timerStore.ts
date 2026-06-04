import { create } from 'zustand';
import { TimerConfig, TimerStatus } from '@/types';
import { DEFAULT_TIMER } from '@/constants';

interface TimerState {
  config: TimerConfig;
  status: TimerStatus;
  currentRound: number;
  timeLeft: number;
  totalTimeLeft: number;
  sessionSource: string | null;
  setConfig: (config: Partial<TimerConfig>) => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  startFromSession: (config: TimerConfig, sessionName: string) => void;
}

function calculateTotalTime(config: TimerConfig): number {
  return config.rounds * config.round_duration + (config.rounds - 1) * config.rest_duration;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  config: { ...DEFAULT_TIMER },
  status: 'idle',
  currentRound: 1,
  timeLeft: DEFAULT_TIMER.round_duration,
  totalTimeLeft: calculateTotalTime(DEFAULT_TIMER),
  sessionSource: null,

  setConfig: (partial) =>
    set((state) => {
      const newConfig = { ...state.config, ...partial };
      const totalTimeLeft = state.status === 'idle' ? calculateTotalTime(newConfig) : state.totalTimeLeft;
      return { config: newConfig, totalTimeLeft };
    }),

  startTimer: () =>
    set({
      status: 'running',
      currentRound: 1,
      timeLeft: get().config.round_duration,
      totalTimeLeft: calculateTotalTime(get().config),
    }),

  stopTimer: () => set({ status: 'idle', sessionSource: null }),

  resetTimer: () =>
    set({
      status: 'idle',
      currentRound: 1,
      timeLeft: get().config.round_duration,
      totalTimeLeft: calculateTotalTime(get().config),
      sessionSource: null,
    }),

  tick: () => {
    const { status, timeLeft, currentRound, config } = get();
    if (status !== 'running' && status !== 'resting' && status !== 'warning') return;

    const newTimeLeft = timeLeft - 1;

    if (newTimeLeft <= 0) {
      if (status === 'running' || status === 'warning') {
        if (currentRound < config.rounds) {
          set({
            status: 'resting',
            timeLeft: config.rest_duration,
            totalTimeLeft: get().totalTimeLeft - 1,
          });
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
      }
    } else {
      const isWarning = (status === 'running' || status === 'warning') && newTimeLeft <= config.warning_seconds;
      set({
        timeLeft: newTimeLeft,
        totalTimeLeft: get().totalTimeLeft - 1,
        status: isWarning ? 'warning' : status === 'warning' && newTimeLeft > config.warning_seconds ? 'running' : status,
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
    }),
}));
