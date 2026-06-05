import { View, Text, Dimensions } from 'react-native';
import { TimerStatus } from '@/types';
import { useMemo } from 'react';

interface TimerDisplayProps {
  timeLeft: number;
  status: TimerStatus;
  currentRound: number;
  totalRounds: number;
  sessionName?: string | null;
  roundDuration: number;
  restDuration: number;
}

const { width } = Dimensions.get('window');

export default function TimerDisplay({ 
  timeLeft, 
  status, 
  currentRound, 
  totalRounds, 
  sessionName,
  roundDuration,
  restDuration
}: TimerDisplayProps) {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const currentMax = status === 'resting' ? restDuration : roundDuration;
  const progressHeight = (1 - timeLeft / currentMax) * 100;

  const themes: Record<TimerStatus, { accent: string; label: string; bg: string }> = {
    idle: { accent: '#E8C547', label: 'PREPARADO', bg: '#0A0A0A' },
    running: { accent: '#E8C547', label: 'ENTRENANDO', bg: '#0A0A0A' },
    resting: { accent: '#2196F3', label: 'DESCANSO', bg: '#0D1B2A' },
    warning: { accent: '#FF5252', label: 'FINALIZANDO', bg: '#1A0F00' },
    finished: { accent: '#4CAF50', label: 'COMPLETADO', bg: '#0A1A0A' },
  };

  const t = themes[status];

  return (
    <View className="flex-1 items-center justify-center relative">
      {/* Kinetic Background Progress (Simple version to avoid Reanimated errors in Expo Go) */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${progressHeight}%`,
          backgroundColor: t.accent,
          opacity: 0.05,
        }}
      />

      {/* Timeline Segments */}
      <View className="absolute top-0 left-0 right-0 flex-row gap-1 px-4 py-8">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <View
            key={i}
            className="h-[3px] flex-1 rounded-full"
            style={{
              backgroundColor: i < currentRound - 1 ? t.accent : i === currentRound - 1 ? '#FFF' : 'rgba(255,255,255,0.1)',
              opacity: i < currentRound - 1 ? 0.3 : 1,
            }}
          />
        ))}
      </View>

      {/* Main Timer Display */}
      <View className="items-center">
        <View className="bg-white/5 px-4 py-1 rounded-full mb-6 border border-white/10">
          <Text className="text-white text-[10px] font-bold tracking-[3px] uppercase">
            {sessionName || t.label}
          </Text>
        </View>

        <Text
          className="text-[120px] font-bold text-center italic"
          style={{ 
            color: '#F5F5F5', 
            fontFamily: 'System', 
            letterSpacing: -5,
            lineHeight: 140 
          }}
        >
          {timeString}
        </Text>

        <View className="flex-row items-center gap-2 mt-4">
          <Text className="text-[#666666] font-mono tracking-widest uppercase text-xs">
            Ronda {currentRound} de {totalRounds}
          </Text>
        </View>
      </View>

      {/* Simplified Warning Indicator */}
      {(timeLeft <= 3 && status !== 'idle' && status !== 'finished') && (
        <View
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: 150,
            borderWidth: 1,
            borderColor: t.accent,
            opacity: 0.2,
          }}
        />
      )}
    </View>
  );
}
