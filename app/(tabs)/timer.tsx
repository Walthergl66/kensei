import { useEffect, useRef, useState } from 'react';
import { View, Text, AppState, AppStateStatus, Alert, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTimerStore } from '@/stores/timerStore';
import TimerDisplay from '@/components/timer/TimerDisplay';
import TimerConfigComponent from '@/components/timer/TimerConfig';
import SessionSaveSheet from '@/components/timer/SessionSaveSheet';
import { saveSession } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import Button from '@/components/ui/Button';

export default function TimerScreen() {
  const { config, status, currentRound, timeLeft, sessionSource, presets, setConfig, startTimer, stopTimer, resetTimer, tick, pauseTimer, resumeTimer, savePreset, loadPreset, deletePreset } = useTimerStore();
  const { session, isDevMode } = useUserStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showSave, setShowSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showPresetModal, setShowPresetModal] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active') {
        pauseTimer();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        resumeTimer();
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

  async function handleSave(rating: number, notes: string): Promise<boolean> {
    if (isDevMode || !session?.user?.id) return true;

    setSaving(true);
    try {
      await saveSession(session.user.id, {
        date: new Date().toISOString().split('T')[0],
        discipline: sessionSource || 'boxing',
        duration_minutes: Math.round((config.rounds * config.round_duration + (config.rounds - 1) * config.rest_duration) / 60),
        rounds_completed: config.rounds,
        notes,
        rating,
        plan_session_day: sessionSource || undefined,
      });
      return true;
    } catch {
      Alert.alert('Error', 'No se pudo guardar la sesion');
      return false;
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setShowSave(false);
    resetTimer();
  }

  const isActive = status !== 'idle' && status !== 'finished';

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <View className="flex-1 px-4 justify-between pb-8">
        <View className="flex-1 justify-center">
          <TimerDisplay
            timeLeft={timeLeft}
            status={status}
            currentRound={currentRound}
            totalRounds={config.rounds}
            sessionName={sessionSource}
            roundDuration={config.round_duration}
            restDuration={config.rest_duration}
          />
        </View>

        {!isActive && !showSave && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-[#666666] text-xs font-semibold uppercase tracking-widest ml-1">Preconfigurados</Text>
              <TouchableOpacity onPress={() => { setPresetName(''); setShowPresetModal(true); }}>
                <Text className="text-[#E8C547] text-xs font-semibold">+ GUARDAR ACTUAL</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3 mb-6">
              {presets.map((preset) => {
                const isSelected = JSON.stringify(config) === JSON.stringify(preset.config);
                return (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => loadPreset(preset)}
                    onLongPress={() => {
                      Alert.alert('Eliminar preset', `¿Quieres eliminar "${preset.name}"?`, [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Eliminar', style: 'destructive', onPress: () => deletePreset(preset.id) },
                      ]);
                    }}
                    className={`px-4 py-3 rounded-xl border ${isSelected ? 'bg-[#E8C547] border-[#E8C547]' : 'bg-[#141414] border-[#1E1E1E]'} min-w-[100px] items-center`}
                  >
                    <Text className={`font-bold ${isSelected ? 'text-[#0A0A0A]' : 'text-[#F5F5F5]'}`}>
                      {preset.name}
                    </Text>
                    <Text className={`text-[10px] mt-1 ${isSelected ? 'text-[#0A0A0A]/60' : 'text-[#666666]'}`}>
                      {preset.config.rounds}R · {Math.floor(preset.config.round_duration / 60)}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TimerConfigComponent config={config} onChange={setConfig} disabled={isActive} />
          </View>
        )}

        {!showSave && (
          <View className="flex-row gap-3">
            {!isActive ? (
              <Button
                title="Iniciar entrenamiento"
                onPress={() => { setShowSave(false); startTimer(); }}
                variant="primary"
                size="lg"
                className="flex-1"
              />
            ) : (
              <Button
                title="Detener"
                onPress={() => { setShowSave(false); stopTimer(); }}
                variant="danger"
                size="lg"
                className="flex-1"
              />
            )}
          </View>
        )}

        {showSave && (
          <SessionSaveSheet onSave={handleSave} onDiscard={handleDiscard} saving={saving} />
        )}

        {showPresetModal && (
          <View className="absolute inset-0 bg-black/80 items-center justify-center px-6" style={{ zIndex: 100 }}>
            <View className="bg-[#141414] w-full p-6 rounded-3xl border border-[#1E1E1E]">
              <Text className="text-[#F5F5F5] text-xl font-bold mb-4">Guardar como preset</Text>
              <TextInput
                className="bg-[#0A0A0A] text-[#F5F5F5] rounded-2xl p-4 mb-6 border border-[#1E1E1E]"
                placeholder="Nombre del preset (ej. Boxeo suave)"
                placeholderTextColor="#555555"
                value={presetName}
                onChangeText={setPresetName}
                autoFocus
              />
              <View className="flex-row gap-3">
                <Button title="Cancelar" onPress={() => setShowPresetModal(false)} variant="secondary" className="flex-1" />
                <Button
                  title="Guardar"
                  onPress={() => {
                    if (presetName.trim()) {
                      savePreset(presetName.trim());
                      setShowPresetModal(false);
                    }
                  }}
                  className="flex-1"
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
