import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
          <Text className="text-[#666666] text-lg">Sesion no encontrada</Text>
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
      session.session_type,
      session.day
    );
    router.push('/(tabs)/timer');
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="chevron-back" size={24} color="#E8C547" />
          </TouchableOpacity>
          <View>
            <Text className="text-[#E8C547] text-xs font-semibold uppercase tracking-wider">{session.day}</Text>
            <Text className="text-[#F5F5F5] text-2xl font-bold tracking-tight">{session.session_type}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3 mt-4 mb-6">
          <Badge label={getIntensityLabel(session.intensity)} variant={session.intensity} />
          <View className="bg-[#1A1A1A] rounded-lg px-3 py-1.5">
            <Text className="text-[#888888] text-xs font-medium">{session.duration_minutes} min</Text>
          </View>
          <View className="bg-[#1A1A1A] rounded-lg px-3 py-1.5">
            <Text className="text-[#888888] text-xs font-medium">{session.rounds} rondas</Text>
          </View>
        </View>

        <View className="bg-[#1A1A1A] rounded-2xl px-4 py-3 mb-6 border border-[#222222]">
          <Text className="text-[#666666] text-xs font-semibold uppercase tracking-wider mb-1">Enfoque</Text>
          <Text className="text-[#F5F5F5] text-sm font-medium">{session.focus}</Text>
        </View>

        <Text className="text-[#F5F5F5] text-lg font-bold mb-4 tracking-tight">Ejercicios</Text>
        {session.exercises.map((exercise, i) => (
          <ExerciseItem key={i} exercise={exercise} index={i} />
        ))}

        <View className="py-8">
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
