import { View, Text } from 'react-native';
import { router } from 'expo-router';
import Button from '@/components/ui/Button';

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-[#0A0A0A] justify-center px-6">
      <Text className="text-[#E8C547] text-5xl font-bold text-center mb-4">Kensei</Text>
      <Text className="text-[#F5F5F5] text-xl text-center mb-2">
        Tu entrenador personal de artes marciales
      </Text>
      <Text className="text-[#888888] text-center mb-12 leading-6">
        Boxeo, MMA y más. Planes de entrenamiento personalizados generados por IA, temporizador de rondas, y seguimiento de tu progreso.
      </Text>

      <View className="gap-4 mb-8">
        <View className="flex-row items-center gap-4">
          <Text className="text-2xl">🥊</Text>
          <View>
            <Text className="text-[#F5F5F5] font-semibold">Planes personalizados</Text>
            <Text className="text-[#888888] text-sm">Generados según tu nivel y objetivo</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-4">
          <Text className="text-2xl">⏱️</Text>
          <View>
            <Text className="text-[#F5F5F5] font-semibold">Temporizador de rondas</Text>
            <Text className="text-[#888888] text-sm">Configurable y preciso</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-4">
          <Text className="text-2xl">📊</Text>
          <View>
            <Text className="text-[#F5F5F5] font-semibold">Historial y progreso</Text>
            <Text className="text-[#888888] text-sm">Seguimiento de tus entrenamientos</Text>
          </View>
        </View>
      </View>

      <Button title="Comenzar" onPress={() => router.push('/(onboarding)/questionnaire')} size="lg" />
    </View>
  );
}
