import { View, Text } from 'react-native';
import { Exercise } from '@/types';
import { formatTime } from '@/lib/utils';

interface ExerciseItemProps {
  exercise: Exercise;
  index: number;
}

export default function ExerciseItem({ exercise, index }: ExerciseItemProps) {
  return (
    <View className="bg-[#141414] rounded-lg p-3 border border-[#2A2A2A] mb-2">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-[#E8C547] text-sm font-bold">{index + 1}.</Text>
          <Text className="text-[#F5F5F5] font-semibold">{exercise.name}</Text>
        </View>
      </View>
      <Text className="text-[#888888] text-xs ml-5 mb-1">{exercise.description}</Text>
      <View className="flex-row gap-3 ml-5">
        <Text className="text-[#888888] text-xs">Duración: {formatTime(exercise.duration_seconds)}</Text>
        <Text className="text-[#888888] text-xs">Series: {exercise.sets}</Text>
        {exercise.reps && <Text className="text-[#888888] text-xs">Reps: {exercise.reps}</Text>}
      </View>
    </View>
  );
}
