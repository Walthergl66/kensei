import { View, Text } from 'react-native';
import { TimerStatus } from '@/types';

interface TimerDisplayProps {
  timeLeft: number;
  status: TimerStatus;
  currentRound: number;
  totalRounds: number;
  sessionName?: string | null;
}

export default function TimerDisplay({ timeLeft, status, currentRound, totalRounds, sessionName }: TimerDisplayProps) {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const theme: Record<TimerStatus, { color: string; label: string; bg: string }> = {
    idle: { color: '#666666', label: 'Listo', bg: '#1A1A1A' },
    running: { color: '#F5F5F5', label: 'Ronda', bg: '#141414' },
    resting: { color: '#2196F3', label: 'Descanso', bg: '#0D1B2A' },
    warning: { color: '#FF9800', label: 'Aviso', bg: '#1A0F00' },
    finished: { color: '#4CAF50', label: 'Completado', bg: '#0A1A0A' },
  };

  const t = theme[status];
  const progress = status === 'idle' || status === 'finished' ? 0 : currentRound / totalRounds;

  return (
    <View className="items-center justify-center py-12 px-4">
      {sessionName && (
        <View className="bg-[#E8C547]/10 px-4 py-1.5 rounded-full mb-6 border border-[#E8C547]/20">
          <Text className="text-[#E8C547] text-sm font-medium tracking-wide">{sessionName}</Text>
        </View>
      )}

      <View className={`w-full rounded-3xl p-8 mb-4 border ${status === 'idle' ? 'border-[#1E1E1E]' : 'border-transparent'}`} style={{ backgroundColor: t.bg }}>
        <Text
          className="text-8xl font-bold text-center tracking-widest"
          style={{ color: t.color, fontFamily: 'monospace', lineHeight: 120 }}
        >
          {timeString}
        </Text>
      </View>

      <View className="items-center gap-2">
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
          <Text className="text-lg font-semibold tracking-wide" style={{ color: t.color }}>
            {t.label}
          </Text>
        </View>
        <Text className="text-[#666666] text-sm font-medium">
          Ronda {currentRound} de {totalRounds}
        </Text>
      </View>

      {status !== 'idle' && status !== 'finished' && (
        <View className="w-full bg-[#1A1A1A] rounded-full h-1 mt-8 overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: t.color,
            }}
          />
        </View>
      )}
    </View>
  );
}
