import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTrainingStore } from '@/stores/trainingStore';
import { useTimerStore } from '@/stores/timerStore';
import { getIntensityLabel } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ExerciseItem from '@/components/training/ExerciseItem';

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams();
  const { plan } = useTrainingStore();
  const { startFromSession } = useTimerStore();

  const index = parseInt(sessionId as string, 10);
  const session = plan?.weekly_structure?.[index];

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0A]">
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-[#888888] text-lg">Sesión no encontrada</Text>
          <Button title="Volver" onPress={() => router.back()} variant="ghost" className="mt-4" />
        </View>
      </SafeAreaView>
    );
  }

  function handleStartTraining() {
    if (!session) return;
    startFromSession(
      {
        rounds: session.rounds,
        round_duration: session.round_duration_seconds,
        rest_duration: session.rest_seconds,
        warning_seconds: 10,
      },
      session.session_type
    );
    router.push('/(tabs)/timer');
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <ScrollView className="flex-1 px-4">
        <View className="py-4">
          <Text className="text-[#E8C547] text-sm font-semibold">{session.day}</Text>
          <Text className="text-[#F5F5F5] text-2xl font-bold mt-1">{session.session_type}</Text>
          <Badge label={getIntensityLabel(session.intensity)} variant={session.intensity} className="mt-2" />
        </View>

        <View className="flex-row gap-3 mb-6">
          <View className="bg-[#141414] rounded-xl px-4 py-3 border border-[#2A2A2A] flex-1 items-center">
            <Text className="text-[#888888] text-xs">Duración</Text>
            <Text className="text-[#F5F5F5] font-bold">{session.duration_minutes} min</Text>
          </View>
          <View className="bg-[#141414] rounded-xl px-4 py-3 border border-[#2A2A2A] flex-1 items-center">
            <Text className="text-[#888888] text-xs">Rondas</Text>
            <Text className="text-[#F5F5F5] font-bold">{session.rounds}</Text>
          </View>
          <View className="bg-[#141414] rounded-xl px-4 py-3 border border-[#2A2A2A] flex-1 items-center">
            <Text className="text-[#888888] text-xs">Enfoque</Text>
            <Text className="text-[#F5F5F5] font-bold text-xs">{session.focus}</Text>
          </View>
        </View>

        <Text className="text-[#F5F5F5] text-lg font-bold mb-3">Ejercicios</Text>
        {session.exercises.map((exercise, i) => (
          <ExerciseItem key={i} exercise={exercise} index={i} />
        ))}

        <View className="py-6">
          <Button
            title="Iniciar entrenamiento"
            onPress={handleStartTraining}
            size="lg"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
