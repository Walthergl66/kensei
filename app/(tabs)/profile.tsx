import { View, Text, ScrollView, Alert, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
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
  const { plan, setPlan } = useTrainingStore();

  function handleRestartOnboarding() {
    Alert.alert(
      'Reiniciar onboarding',
      '¿Estás seguro? Esto borrará tus datos actuales.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => {
            setProfile(null);
            setIsOnboarded(false);
            setPlan(null);
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
      setPlan(null);
      router.replace('/(onboarding)/welcome');
      return;
    }
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <ScrollView className="flex-1 px-4">
        <View className="items-center py-8">
          <View className="w-20 h-20 rounded-full bg-[#E8C547] items-center justify-center mb-4">
            <Text className="text-[#0A0A0A] text-2xl font-bold">
              {profile?.name ? getInitials(profile.name) : 'K'}
            </Text>
          </View>
          <Text className="text-[#F5F5F5] text-xl font-bold">{profile?.name || 'Guerrero'}</Text>
          {profile?.discipline && (
            <Text className="text-[#888888] text-sm">{disciplineLabels[profile.discipline] || profile.discipline}</Text>
          )}
        </View>

        {profile && (
          <Card className="mb-4">
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <Text className="text-lg">🎯</Text>
                <View>
                  <Text className="text-[#888888] text-xs">Objetivo</Text>
                  <Text className="text-[#F5F5F5] text-sm">{goalLabels[profile.goal] || profile.goal}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="text-lg">📈</Text>
                <View>
                  <Text className="text-[#888888] text-xs">Nivel</Text>
                  <Text className="text-[#F5F5F5] text-sm">{levelLabels[profile.level] || profile.level}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="text-lg">📅</Text>
                <View>
                  <Text className="text-[#888888] text-xs">Días por semana</Text>
                  <Text className="text-[#F5F5F5] text-sm">{profile.days_per_week} días</Text>
                </View>
              </View>
              {profile.injuries && (
                <View className="flex-row items-center gap-3">
                  <Text className="text-lg">⚠️</Text>
                  <View>
                    <Text className="text-[#888888] text-xs">Lesiones</Text>
                    <Text className="text-[#F5F5F5] text-sm">{profile.injuries}</Text>
                  </View>
                </View>
              )}
            </View>
          </Card>
        )}

        {plan ? (
          <Card className="mb-4">
            <Text className="text-[#E8C547] font-bold mb-2">Plan activo</Text>
            <Text className="text-[#F5F5F5]">{plan.plan_name}</Text>
            <Text className="text-[#888888] text-xs">{plan.duration_weeks} semanas · {plan.sessions_per_week} sesiones/semana</Text>
          </Card>
        ) : (
          <Card className="mb-4">
            <Text className="text-[#888888] text-center py-2">Sin plan activo</Text>
          </Card>
        )}

        <Divider />

        <View className="gap-3 pb-8">
          <Button
            title="Reiniciar onboarding"
            onPress={handleRestartOnboarding}
            variant="outline"
          />
          <Button
            title={isDevMode ? 'Salir del modo desarrollo' : 'Cerrar sesión'}
            onPress={handleSignOut}
            variant="danger"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
