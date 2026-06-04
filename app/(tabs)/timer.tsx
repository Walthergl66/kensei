import { useEffect, useRef, useState } from 'react';
import { View, Text, SafeAreaView, AppState, AppStateStatus } from 'react-native';
import { useTimerStore } from '@/stores/timerStore';
import TimerDisplay from '@/components/timer/TimerDisplay';
import TimerConfigComponent from '@/components/timer/TimerConfig';
import SessionSaveSheet from '@/components/timer/SessionSaveSheet';
import { saveSession } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import Button from '@/components/ui/Button';

export default function TimerScreen() {
  const { config, status, currentRound, timeLeft, sessionSource, setConfig, startTimer, stopTimer, resetTimer, tick } = useTimerStore();
  const { session, isDevMode } = useUserStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showSave, setShowSave] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active' && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (status === 'running' || status === 'resting' || status === 'warning') {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (status === 'finished') {
        setShowSave(true);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  async function handleSave(rating: number, notes: string) {
    if (isDevMode || !session?.user?.id) return;

    await saveSession(session.user.id, {
      date: new Date().toISOString().split('T')[0],
      discipline: sessionSource || 'boxing',
      duration_minutes: Math.round((config.rounds * config.round_duration + (config.rounds - 1) * config.rest_duration) / 60),
      rounds_completed: config.rounds,
      notes,
      rating,
      plan_session_day: sessionSource || undefined,
    });
  }

  function handleDiscard() {
    setShowSave(false);
    resetTimer();
  }

  const isActive = status !== 'idle' && status !== 'finished';

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <View className="flex-1 px-4">
        <TimerDisplay
          timeLeft={timeLeft}
          status={status}
          currentRound={currentRound}
          totalRounds={config.rounds}
          sessionName={sessionSource}
        />

        {!isActive && !showSave && (
          <TimerConfigComponent config={config} onChange={setConfig} disabled={isActive} />
        )}

        {!showSave && (
          <View className="flex-row gap-4 mt-6">
            {!isActive ? (
              <Button
                title="Iniciar"
                onPress={startTimer}
                variant="primary"
                size="lg"
                className="flex-1"
              />
            ) : (
              <Button
                title="Detener"
                onPress={stopTimer}
                variant="danger"
                size="lg"
                className="flex-1"
              />
            )}
          </View>
        )}

        {showSave && (
          <SessionSaveSheet onSave={handleSave} onDiscard={handleDiscard} />
        )}
      </View>
    </SafeAreaView>
  );
}
