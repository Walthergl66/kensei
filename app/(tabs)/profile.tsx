import { View, Text, ScrollView, Alert, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/stores/userStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { getInitials } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Divider from '@/components/ui/Divider';

const disciplineLabels: Record<string, string> = {
  boxing: 'Boxeo',
  mma: 'MMA',
  both: 'Boxeo + MMA',
};

const goalLabels: Record<string, string> = {
  compete: 'Competir',
  fitness: 'Ponerme en forma',
  selfdefense: 'Defensa personal',
  beginner: 'Aprender desde cero',
};

const levelLabels: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export default function ProfileScreen() {
  const { profile, isDevMode, signOut, setProfile, setIsOnboarded } = useUserStore();
  const { plan, clearPlan } = useTrainingStore();

  function handleRestartOnboarding() {
    Alert.alert(
      'Reiniciar onboarding',
      'Estas seguro? Esto borrara tus datos actuales.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => {
            setProfile(null);
            setIsOnboarded(false);
            clearPlan();
            router.replace('/(onboarding)/welcome');
          },
        },
      ]
    );
  }

  async function handleSignOut() {
    if (isDevMode) {
      setProfile(null);
      setIsOnboarded(false);
      clearPlan();
      router.replace('/(onboarding)/welcome');
      return;
    }
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="items-center pt-8 pb-6">
          <View className="w-20 h-20 rounded-full bg-[#E8C547] items-center justify-center mb-4 border-2 border-[#E8C547]/30">
            <Text className="text-[#0A0A0A] text-3xl font-bold">
              {profile?.name ? getInitials(profile.name) : 'K'}
            </Text>
          </View>
          <Text className="text-[#F5F5F5] text-2xl font-bold tracking-tight">{profile?.name || 'Guerrero'}</Text>
          {profile?.discipline && (
            <Text className="text-[#666666] text-sm mt-1">{disciplineLabels[profile.discipline] || profile.discipline}</Text>
          )}
        </View>

        {profile && (
          <Card>
            <View className="gap-4">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-xl bg-[#E8C547]/10 items-center justify-center">
                  <Ionicons name="flag" size={18} color="#E8C547" />
                </View>
                <View>
                  <Text className="text-[#666666] text-xs uppercase tracking-wider">Objetivo</Text>
                  <Text className="text-[#F5F5F5] text-sm font-medium mt-0.5">{goalLabels[profile.goal] || profile.goal}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-xl bg-[#E8C547]/10 items-center justify-center">
                  <Ionicons name="trending-up" size={18} color="#E8C547" />
                </View>
                <View>
                  <Text className="text-[#666666] text-xs uppercase tracking-wider">Nivel</Text>
                  <Text className="text-[#F5F5F5] text-sm font-medium mt-0.5">{levelLabels[profile.level] || profile.level}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-xl bg-[#E8C547]/10 items-center justify-center">
                  <Ionicons name="calendar" size={18} color="#E8C547" />
                </View>
                <View>
                  <Text className="text-[#666666] text-xs uppercase tracking-wider">Dias por semana</Text>
                  <Text className="text-[#F5F5F5] text-sm font-medium mt-0.5">{profile.days_per_week} dias</Text>
                </View>
              </View>
              {profile.injuries && (
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-xl bg-[#FF9800]/10 items-center justify-center">
                    <Ionicons name="alert-circle" size={18} color="#FF9800" />
                  </View>
                  <View>
                    <Text className="text-[#666666] text-xs uppercase tracking-wider">Lesiones</Text>
                    <Text className="text-[#F5F5F5] text-sm font-medium mt-0.5">{profile.injuries}</Text>
                  </View>
                </View>
              )}
            </View>
          </Card>
        )}

        <View className="mt-4">
          {plan ? (
            <Card>
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-xl bg-[#4CAF50]/10 items-center justify-center">
                  <Ionicons name="fitness" size={18} color="#4CAF50" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#4CAF50] text-xs uppercase tracking-wider font-semibold">Plan activo</Text>
                  <Text className="text-[#F5F5F5] font-semibold mt-0.5">{plan.plan_name}</Text>
                  <Text className="text-[#666666] text-xs mt-0.5">{plan.duration_weeks} semanas · {plan.sessions_per_week} sesiones/semana</Text>
                </View>
              </View>
            </Card>
          ) : (
            <Card>
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-xl bg-[#1A1A1A] items-center justify-center">
                  <Ionicons name="fitness-outline" size={18} color="#666666" />
                </View>
                <View>
                  <Text className="text-[#666666] text-xs uppercase tracking-wider">Sin plan activo</Text>
                </View>
              </View>
            </Card>
          )}
        </View>

        <Divider />

        <View className="gap-3 pb-8">
          <Button
            title="Reiniciar onboarding"
            onPress={handleRestartOnboarding}
            variant="outline"
          />
          <Button
            title={isDevMode ? 'Salir del modo desarrollo' : 'Cerrar sesion'}
            onPress={handleSignOut}
            variant="danger"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
