import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Button from '@/components/ui/Button';

const features = [
  { icon: 'flame' as const, title: 'Planes personalizados', desc: 'Generados por IA segun tu nivel y objetivo' },
  { icon: 'timer' as const, title: 'Temporizador de rondas', desc: 'Configurable y preciso para tu entrenamiento' },
  { icon: 'bar-chart' as const, title: 'Historial y progreso', desc: 'Seguimiento detallado de tus sesiones' },
];

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-12">
          <View className="w-20 h-20 rounded-3xl bg-[#E8C547]/10 items-center justify-center mb-6">
            <Ionicons name="flame" size={40} color="#E8C547" />
          </View>
          <Text className="text-[#E8C547] text-5xl font-bold tracking-tight mb-3">Kensei</Text>
          <Text className="text-[#888888] text-lg text-center tracking-wide">
            Tu entrenador personal de artes marciales
          </Text>
        </View>

        <View className="gap-5 mb-10">
          {features.map((f, i) => (
            <View key={i} className="flex-row items-center gap-4 bg-[#141414] rounded-2xl p-4 border border-[#1E1E1E]">
              <View className="w-12 h-12 rounded-xl bg-[#E8C547]/10 items-center justify-center">
                <Ionicons name={f.icon} size={22} color="#E8C547" />
              </View>
              <View className="flex-1">
                <Text className="text-[#F5F5F5] font-semibold">{f.title}</Text>
                <Text className="text-[#666666] text-sm mt-0.5">{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button title="Comenzar" onPress={() => router.push('/(onboarding)/questionnaire')} size="lg" />
      </View>
    </SafeAreaView>
  );
}
