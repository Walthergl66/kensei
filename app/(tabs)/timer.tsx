import { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, AppState, AppStateStatus, Alert, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TimerPreset, useTimerStore } from '@/stores/timerStore';
import TimerDisplay from '@/components/timer/TimerDisplay';
import TimerConfigComponent from '@/components/timer/TimerConfig';
import SessionSaveSheet from '@/components/timer/SessionSaveSheet';
import { saveSession } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import Button from '@/components/ui/Button';

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function PresetCard({ preset, selected, onPress, onDelete }: {
  preset: TimerPreset;
  selected: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const isSystem = preset.userId === '__system__';
  const totalSeconds = preset.config.rounds * preset.config.round_duration + (preset.config.rounds - 1) * preset.config.rest_duration;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={isSystem ? undefined : onDelete}
      activeOpacity={0.84}
      className={`rounded-2xl px-5 py-4 border ${selected ? 'bg-[#E8C547] border-[#E8C547]' : 'bg-[#141414] border-[#1E1E1E]'}`}
      style={{ shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-4">
          <View className={`w-11 h-11 rounded-full items-center justify-center mr-4 ${selected ? 'bg-[#0A0A0A]/10' : 'bg-[#E8C547]/10'}`}>
            <Ionicons name={isSystem ? 'sparkles' : 'person'} size={21} color={selected ? '#0A0A0A' : '#E8C547'} />
          </View>
          <View className="flex-1">
            <Text className={`text-lg font-black tracking-tight ${selected ? 'text-[#0A0A0A]' : 'text-[#F5F5F5]'}`}>{preset.name}</Text>
            <Text className={`text-xs font-semibold mt-1 ${selected ? 'text-[#0A0A0A]/65' : 'text-[#888888]'}`}>
              {preset.config.rounds} rondas · {formatDuration(preset.config.round_duration)} trabajo · {formatDuration(preset.config.rest_duration)} descanso
            </Text>
          </View>
        </View>

        <View className="items-end">
          <Text className={`text-xl font-black font-mono ${selected ? 'text-[#0A0A0A]' : 'text-[#E8C547]'}`}>{formatDuration(totalSeconds)}</Text>
          <Text className={`text-[10px] font-black uppercase tracking-wider mt-1 ${selected ? 'text-[#0A0A0A]/50' : 'text-[#888888]'}`}>
            {isSystem ? 'Sistema' : 'Personal'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TimerScreen() {
  const { config, status, currentRound, timeLeft, sessionSource, sessionDay, presets, setConfig, startTimer, stopTimer, resetTimer, tick, pauseTimer, resumeTimer, savePreset, loadPreset, deletePreset, getPresetsForUser } = useTimerStore();
  const { session, isDevMode, profile } = useUserStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showSave, setShowSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [timerTab, setTimerTab] = useState<'new' | 'saved'>('new');
  const [resumeNonce, setResumeNonce] = useState(0);

  const currentUserId = isDevMode ? 'dev' : (session?.user?.id || profile?.user_id || 'guest');
  const userPresets = useMemo(() => getPresetsForUser(currentUserId), [presets, currentUserId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active') {
        pauseTimer();
      } else {
        resumeTimer();
        setResumeNonce((n) => n + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (status === 'running' || status === 'resting' || status === 'warning') {
      if (intervalRef.current) clearInterval(intervalRef.current);
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
  }, [status, resumeNonce]);

  async function handleSave(rating: number, notes: string): Promise<boolean> {
    if (isDevMode || !session?.user?.id) return true;

    setSaving(true);
    try {
      await saveSession(session.user.id, {
        date: new Date().toISOString().split('T')[0],
        discipline: profile?.discipline || 'boxing',
        duration_minutes: Math.round((config.rounds * config.round_duration + (config.rounds - 1) * config.rest_duration) / 60),
        rounds_completed: config.rounds,
        notes,
        rating,
        plan_session_day: sessionDay || undefined,
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
  const totalConfiguredSeconds = config.rounds * config.round_duration + (config.rounds - 1) * config.rest_duration;

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <View className="flex-1 px-4 pb-8">
        {!isActive && !showSave ? (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 18, paddingBottom: 28 }}>
            <View className="flex-row items-center justify-between mb-7">
              <View>
                <Text className="text-[#888888] text-xs font-black uppercase tracking-widest mb-2">Temporizador</Text>
                <Text className="text-[#F5F5F5] text-4xl font-black tracking-tight">Timer Kensei</Text>
              </View>
              <TouchableOpacity
                onPress={() => { setPresetName(''); setShowPresetModal(true); }}
                className="w-[52px] h-[52px] rounded-full bg-[#E8C547]/15 items-center justify-center border border-[#E8C547]/30"
                activeOpacity={0.82}
              >
                <Ionicons name="save-outline" size={24} color="#E8C547" />
              </TouchableOpacity>
            </View>

            {sessionSource && (
              <View className="bg-[#E8C547]/10 border border-[#E8C547]/20 rounded-2xl px-4 py-3 mb-5 flex-row items-center">
                <Ionicons name="fitness" size={18} color="#E8C547" />
                <Text className="text-[#E8C547] font-bold ml-2 flex-1">{sessionSource}</Text>
              </View>
            )}

            <TimerConfigComponent
              config={config}
              onChange={setConfig}
              disabled={isActive}
              activeTab={timerTab}
              onTabChange={setTimerTab}
            />

            {timerTab === 'saved' && (
              <View className="gap-3">
                <View className="flex-row justify-between items-center px-1">
                  <Text className="text-[#888888] text-xs font-semibold uppercase tracking-widest">Timers guardados</Text>
                  <TouchableOpacity onPress={() => { setPresetName(''); setShowPresetModal(true); }}>
                    <Text className="text-[#E8C547] text-xs font-semibold">+ GUARDAR ACTUAL</Text>
                  </TouchableOpacity>
                </View>

                {userPresets.map((preset) => {
                  const isSelected = JSON.stringify(config) === JSON.stringify(preset.config);
                  return (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      selected={isSelected}
                      onPress={() => loadPreset(preset)}
                      onDelete={() => {
                        Alert.alert('Eliminar timer', `Eliminar "${preset.name}"?`, [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Eliminar', style: 'destructive', onPress: () => deletePreset(preset.id) },
                        ]);
                      }}
                    />
                  );
                })}
              </View>
            )}

            <View className="rounded-[28px] bg-[#E8C547] mt-7 px-6 py-7 min-h-[210px] justify-between">
              <View className="flex-row items-start justify-between">
                <View>
                  <Text className="text-[#0A0A0A]/80 text-xs font-black uppercase tracking-widest">Total</Text>
                  <Text className="text-[#0A0A0A] text-6xl font-black font-mono mt-1">{formatDuration(totalConfiguredSeconds)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => { setPresetName(''); setShowPresetModal(true); }}
                  className="px-4 py-3 rounded-full bg-[#0A0A0A]/15"
                  activeOpacity={0.82}
                >
                  <Text className="text-[#0A0A0A] font-bold">Guardar</Text>
                </TouchableOpacity>
              </View>

              <View className="items-center">
                <TouchableOpacity
                  onPress={() => { setShowSave(false); startTimer(); }}
                  className="w-24 h-24 rounded-full border-[6px] border-[#0A0A0A] items-center justify-center"
                  activeOpacity={0.82}
                >
                  <Ionicons name="play" size={46} color="#0A0A0A" style={{ marginLeft: 5 }} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View className="flex-1 justify-between">
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

            {!showSave && (
              <View className="flex-row gap-3">
                <Button
                  title="Detener"
                  onPress={() => { setShowSave(false); stopTimer(); }}
                  variant="danger"
                  size="lg"
                  className="flex-1"
                />
              </View>
            )}
          </View>
        )}

        {showSave && (
          <SessionSaveSheet onSave={handleSave} onDiscard={handleDiscard} saving={saving} />
        )}

        {showPresetModal && (
          <View className="absolute inset-0 bg-black/80 items-center justify-center px-6" style={{ zIndex: 100 }}>
            <View className="bg-[#141414] w-full p-6 rounded-3xl border border-[#1E1E1E]">
              <Text className="text-[#F5F5F5] text-xl font-bold mb-4">Guardar preset</Text>
              <TextInput
                className="bg-[#0A0A0A] text-[#F5F5F5] rounded-2xl p-4 mb-6 border border-[#1E1E1E]"
                placeholder="Nombre del preset (ej. Boxeo suave)"
                placeholderTextColor="#666666"
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
                      savePreset(presetName.trim(), currentUserId);
                      setTimerTab('saved');
                      setPresetName('');
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
