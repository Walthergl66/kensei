import { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTrainingStore } from '@/stores/trainingStore';
import { useUserStore } from '@/stores/userStore';
import { supabase, saveTrainingPlan, deactivateOtherPlans } from '@/lib/supabase';
import { generateTrainingPlan } from '@/lib/agent';
import SessionCard from '@/components/training/SessionCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

export default function TrainingScreen() {
  const { plan, setPlan } = useTrainingStore();
  const { profile, session, isDevMode, profileContext } = useUserStore();
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  async function handleRegenerate() {
    if (!profile) return;
    setRegenerating(true);
    setRegenError(null);

    try {
      const newPlan = await generateTrainingPlan(profile, profileContext || undefined);
      
      if (!isDevMode && supabase && session?.user?.id) {
        await deactivateOtherPlans(session.user.id);
        await saveTrainingPlan(session.user.id, newPlan);
      }
      
      setPlan(newPlan);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo generar el plan. Intenta de nuevo.';
      setRegenError(message);
      Alert.alert('Error del Agente', message);
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
          subtitle="Completa el cuestionario para obtener tu plan personalizado generado por IA"
          actionLabel="Ir al onboarding"
          onAction={() => router.replace('/(onboarding)/welcome')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="pt-8 pb-4">
          <View className="flex-row items-center gap-3 mb-1">
            <View className="w-10 h-10 rounded-xl bg-[#E8C547]/10 items-center justify-center">
              <Ionicons name="fitness" size={20} color="#E8C547" />
            </View>
            <View>
              <Text className="text-[#F5F5F5] text-2xl font-bold tracking-tight">{plan.plan_name}</Text>
              <Text className="text-[#666666] text-sm mt-0.5">
                {plan.duration_weeks} semanas · {plan.sessions_per_week} sesiones/semana
              </Text>
            </View>
          </View>
        </View>

        {plan.warnings.length > 0 && (
          <Card accentColor="#FF9800" className="mb-4">
            <Text className="text-[#FF9800] font-semibold mb-3">Advertencias</Text>
            {plan.warnings.map((w, i) => (
              <View key={i} className="flex-row items-start mb-2">
                <Text className="text-[#FF9800] text-xs mr-2">⚠</Text>
                <Text className="text-[#888888] text-xs flex-1 leading-5">{w}</Text>
              </View>
            ))}
          </Card>
        )}

        <Text className="text-[#666666] text-xs font-semibold uppercase tracking-widest mb-3 ml-1">
          Sesiones ({plan.weekly_structure.length})
        </Text>

        {plan.weekly_structure.map((session, index) => (
          <SessionCard
            key={index}
            session={session}
            onPress={() => router.push(`/training/${index}`)}
          />
        ))}

        {regenError && (
          <View className="bg-[#F44336]/10 border border-[#F44336]/40 rounded-2xl p-3 mb-4">
            <Text className="text-[#F44336] text-xs">{regenError}</Text>
          </View>
        )}

        <View className="py-8">
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
