import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlanSession } from '@/types';
import Badge from '@/components/ui/Badge';
import { getIntensityLabel } from '@/lib/utils';

interface SessionCardProps {
  session: PlanSession;
  onPress?: () => void;
}

export default function SessionCard({ session, onPress }: SessionCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-[#141414] rounded-2xl p-5 border border-[#1E1E1E] mb-3"
      activeOpacity={0.8}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-xl bg-[#1A1A1A] items-center justify-center">
            <Ionicons name="fitness" size={18} color="#E8C547" />
          </View>
          <View>
            <Text className="text-[#F5F5F5] text-lg font-bold">{session.day}</Text>
            <Text className="text-[#666666] text-xs mt-0.5">{session.session_type}</Text>
          </View>
        </View>
        <Badge label={getIntensityLabel(session.intensity)} variant={session.intensity} />
      </View>

      <View className="flex-row gap-3 mt-2">
        <View className="bg-[#1A1A1A] rounded-lg px-3 py-1.5">
          <Text className="text-[#888888] text-xs font-medium">{session.duration_minutes} min</Text>
        </View>
        <View className="bg-[#1A1A1A] rounded-lg px-3 py-1.5">
          <Text className="text-[#888888] text-xs font-medium">{session.rounds} rondas</Text>
        </View>
        <View className="bg-[#1A1A1A] rounded-lg px-3 py-1.5">
          <Text className="text-[#888888] text-xs font-medium">{session.exercises.length} ejercicios</Text>
        </View>
      </View>

      <View className="flex-row items-center mt-3 pt-3 border-t border-[#1E1E1E]">
        <Text className="text-[#E8C547] text-xs font-medium tracking-wide">Enfoque: {session.focus}</Text>
        <View className="flex-1" />
        <Ionicons name="chevron-forward" size={14} color="#555555" />
      </View>
    </TouchableOpacity>
  );
}
