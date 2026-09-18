import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import { useTrainingStore } from '@/stores/trainingStore';

export default function IndexScreen() {
  const { session, isLoading, isOnboarded, isDevMode } = useUserStore();
  const plan = useTrainingStore(s => s.plan);

  useEffect(() => {
    if (isLoading) return;

    if (isDevMode) {
      if (isOnboarded) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(onboarding)/welcome');
      }
    } else if (session) {
      if (isOnboarded && plan) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(onboarding)/questionnaire');
      }
    } else {
      router.replace('/(onboarding)/welcome');
    }
  }, [session, isLoading, isOnboarded, isDevMode, plan]);

  return (
    <View className="flex-1 bg-[#0A0A0A] items-center justify-center">
      <ActivityIndicator size="large" color="#E8C547" />
    </View>
  );
}
