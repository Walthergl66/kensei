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

  const statusColors: Record<TimerStatus, string> = {
    idle: '#888888',
    running: '#F5F5F5',
    resting: '#2196F3',
    warning: '#FF9800',
    finished: '#4CAF50',
  };

  const statusLabels: Record<TimerStatus, string> = {
    idle: 'Listo',
    running: 'Ronda',
    resting: 'Descanso',
    warning: '¡Aviso!',
    finished: 'Completado',
  };

  return (
    <View className="items-center justify-center py-8">
      {sessionName && (
        <View className="bg-[#E8C547]/20 px-4 py-1 rounded-full mb-4">
          <Text className="text-[#E8C547] text-sm font-medium">{sessionName}</Text>
        </View>
      )}
      <Text className="text-7xl font-bold mb-2" style={{ fontFamily: 'monospace', color: statusColors[status] }}>
        {timeString}
      </Text>
      <Text className="text-lg font-semibold mb-1" style={{ color: statusColors[status] }}>
        {statusLabels[status]}
      </Text>
      <Text className="text-[#888888] text-sm">
        Ronda {currentRound} de {totalRounds}
      </Text>
    </View>
  );
}
