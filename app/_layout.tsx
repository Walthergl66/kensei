import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUserStore } from '@/stores/userStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { supabase, getUserProfile, getActiveTrainingPlan } from '@/lib/supabase';
import { completePendingOnboarding } from '@/lib/onboarding';
import { DEFAULT_PLAN } from '@/constants';
import { UserProfile } from '@/types';
import '../global.css';

const DEFAULT_PROFILE: UserProfile = {
  id: 'guest',
  user_id: 'guest',
  name: 'Guerrero Kensei',
  discipline: 'both',
  goal: 'fitness',
  level: 'intermediate',
  days_per_week: 3,
  equipment: 'basic',
  fitness_level: 'medium',
  injuries: null,
  created_at: new Date().toISOString(),
};

export default function RootLayout() {
  const { session, isLoading, profile, setSession, setIsLoading, setProfile, setIsOnboarded, setDevMode } = useUserStore();
  const { setPlan } = useTrainingStore();

  useEffect(() => {
    if (!supabase) {
      setDevMode(true);
      // Solo inicializar si no hay un perfil ya cargado
      if (!profile) {
        setProfile(DEFAULT_PROFILE);
        setIsOnboarded(true);
        setPlan(DEFAULT_PLAN);
      }
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setProfile(null);
        setIsOnboarded(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData(userId: string) {
    try {
      setDevMode(false);
      const { pendingOnboarding, clearPendingOnboarding } = useUserStore.getState();
      if (pendingOnboarding) {
        const completedProfile = await completePendingOnboarding(userId, pendingOnboarding);
        setProfile(completedProfile);
        setPlan(pendingOnboarding.plan);
        setIsOnboarded(true);
        clearPendingOnboarding();
        return;
      }

      const profile = await getUserProfile(userId);
      if (profile) {
        setProfile(profile);
        setIsOnboarded(true);
        const plan = await getActiveTrainingPlan(userId);
        if (plan) setPlan(plan);
      } else {
        setIsOnboarded(false);
      }
    } catch {
      setIsOnboarded(false);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#0A0A0A] items-center justify-center">
        <View className="items-center gap-4">
          <View className="w-20 h-20 rounded-3xl bg-[#E8C547]/10 items-center justify-center">
            <Ionicons name="flame" size={40} color="#E8C547" />
          </View>
          <Text className="text-[#E8C547] text-3xl font-bold tracking-tight">Kensei</Text>
          <ActivityIndicator size="small" color="#E8C547" style={{ marginTop: 8 }} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="training/[sessionId]" />
      </Stack>
    </SafeAreaProvider>
  );
}
