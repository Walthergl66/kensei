import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '@/types';
import { formatTime } from '@/lib/utils';

interface ExerciseItemProps {
  exercise: Exercise;
  index: number;
}

export default function ExerciseItem({ exercise, index }: ExerciseItemProps) {
  return (
    <View className="bg-[#141414] rounded-2xl p-4 border border-[#1E1E1E] mb-3">
      <View className="flex-row items-center gap-3 mb-2">
        <View className="w-8 h-8 rounded-lg bg-[#E8C547]/10 items-center justify-center">
          <Text className="text-[#E8C547] text-sm font-bold">{index + 1}</Text>
        </View>
        <Text className="text-[#F5F5F5] font-semibold text-base">{exercise.name}</Text>
      </View>

      <Text className="text-[#666666] text-xs ml-11 mb-3 leading-5">{exercise.description}</Text>

      <View className="flex-row gap-3 ml-11">
        <View className="bg-[#1A1A1A] rounded-lg px-3 py-1.5 flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={12} color="#888888" />
          <Text className="text-[#888888] text-xs">{formatTime(exercise.duration_seconds)}</Text>
        </View>
        <View className="bg-[#1A1A1A] rounded-lg px-3 py-1.5 flex-row items-center gap-1.5">
          <Ionicons name="repeat-outline" size={12} color="#888888" />
          <Text className="text-[#888888] text-xs">{exercise.sets} series</Text>
        </View>
        {exercise.reps && (
          <View className="bg-[#1A1A1A] rounded-lg px-3 py-1.5 flex-row items-center gap-1.5">
            <Ionicons name="stats-chart-outline" size={12} color="#888888" />
            <Text className="text-[#888888] text-xs">{exercise.reps} reps</Text>
          </View>
        )}
      </View>
    </View>
  );
}
