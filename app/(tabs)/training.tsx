import { useState } from 'react';
import { View, Text, ScrollView, Alert, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useTrainingStore } from '@/stores/trainingStore';
import { useUserStore } from '@/stores/userStore';
import { supabase, saveTrainingPlan, deactivateOtherPlans } from '@/lib/supabase';
import { generateTrainingPlan } from '@/lib/agent';
import { DEFAULT_PLAN } from '@/constants';
import SessionCard from '@/components/training/SessionCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

export default function TrainingScreen() {
  const { plan, setPlan, setIsLoading, isLoading } = useTrainingStore();
  const { profile, session, isDevMode } = useUserStore();
  const [regenerating, setRegenerating] = useState(false);

  async function handleRegenerate() {
    if (!profile) return;
    setRegenerating(true);

    if (isDevMode || !supabase) {
      setPlan(DEFAULT_PLAN);
      setRegenerating(false);
      return;
    }

    try {
      const newPlan = await generateTrainingPlan(profile);
      if (session?.user?.id) {
        await deactivateOtherPlans(session.user.id);
        await saveTrainingPlan(session.user.id, newPlan);
      }
      setPlan(newPlan);
    } catch {
      Alert.alert('Error', 'No se pudo generar el plan. Usando plan por defecto.');
      setPlan(DEFAULT_PLAN);
    } finally {
      setRegenerating(false);
    }
  }

  if (!plan) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0A]">
        <EmptyState
          icon="📋"
          title="Sin plan de entrenamiento"
          subtitle="Completa el cuestionario para obtener tu plan personalizado"
          actionLabel="Ir al onboarding"
          onAction={() => router.replace('/(onboarding)/welcome')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <ScrollView className="flex-1 px-4">
        <View className="py-4">
          <Text className="text-[#F5F5F5] text-2xl font-bold">{plan.plan_name}</Text>
          <Text className="text-[#888888] text-sm mt-1">
            {plan.duration_weeks} semanas · {plan.sessions_per_week} sesiones/semana
          </Text>
        </View>

        {plan.warnings.length > 0 && (
          <Card accentColor="#FF9800" className="mb-4">
            <Text className="text-[#FF9800] font-semibold mb-2">Advertencias</Text>
            {plan.warnings.map((w, i) => (
              <Text key={i} className="text-[#888888] text-xs mb-1">⚠ {w}</Text>
            ))}
          </Card>
        )}

        {plan.weekly_structure.map((session, index) => (
          <SessionCard
            key={index}
            session={session}
            onPress={() => router.push(`/training/${index}`)}
          />
        ))}

        <View className="py-6">
          <Button
            title={regenerating ? 'Generando...' : 'Regenerar plan con IA'}
            onPress={handleRegenerate}
            loading={regenerating}
            disabled={regenerating}
            variant="outline"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
