import { View, Text, TouchableOpacity } from 'react-native';
import { PlanSession } from '@/types';
import Badge from '@/components/ui/Badge';
import { getIntensityColor, getIntensityLabel } from '@/lib/utils';

interface SessionCardProps {
  session: PlanSession;
  onPress?: () => void;
}

export default function SessionCard({ session, onPress }: SessionCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-[#141414] rounded-xl p-4 border border-[#2A2A2A] mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[#F5F5F5] text-lg font-bold">{session.day}</Text>
        <Badge label={getIntensityLabel(session.intensity)} variant={session.intensity} />
      </View>
      <Text className="text-[#888888] text-sm mb-2">{session.session_type}</Text>
      <View className="flex-row gap-4">
        <Text className="text-[#888888] text-xs">{session.duration_minutes} min</Text>
        <Text className="text-[#888888] text-xs">{session.rounds} rondas</Text>
        <Text className="text-[#888888] text-xs">{session.exercises.length} ejercicios</Text>
      </View>
      <View className="flex-row items-center mt-2">
        <Text className="text-[#E8C547] text-xs font-medium">Enfoque: {session.focus}</Text>
      </View>
    </TouchableOpacity>
  );
}
