import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/stores/userStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { getDayNameInSpanish } from '@/lib/utils';
import { PlanSession } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Divider from '@/components/ui/Divider';

function getTodaySession(plan: any): PlanSession | null {
  if (!plan?.weekly_structure) return null;
  const today = getDayNameInSpanish();
  return plan.weekly_structure.find((s: PlanSession) => s.day.toLowerCase() === today.toLowerCase()) ?? null;
}

export default function HomeScreen() {
  const { profile } = useUserStore();
  const { plan } = useTrainingStore();
  const [refreshing, setRefreshing] = useState(false);

  const todaySession = getTodaySession(plan);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8C547" />}
      >
        <View className="py-6">
          <Text className="text-[#E8C547] text-2xl font-bold">
            Hola, {profile?.name || 'Guerrero'} {profile?.name ? '👊' : ''}
          </Text>
          <Text className="text-[#888888] text-sm mt-1">{getDayNameInSpanish()} - Listo para entrenar</Text>
        </View>

        {todaySession ? (
          <Card accentColor="#E8C547" className="mb-4">
            <Text className="text-[#E8C547] text-sm font-semibold mb-1">Sesión de hoy</Text>
            <Text className="text-[#F5F5F5] text-lg font-bold">{todaySession.session_type}</Text>
            <Text className="text-[#888888] text-sm mb-3">{todaySession.focus}</Text>
            <View className="flex-row gap-4 mb-4">
              <Text className="text-[#888888] text-xs">{todaySession.duration_minutes} min</Text>
              <Text className="text-[#888888] text-xs">{todaySession.rounds} rondas</Text>
              <Text className="text-[#888888] text-xs">{todaySession.exercises.length} ejercicios</Text>
            </View>
            <Button
              title="Ver sesión"
              onPress={() => router.push(`/training/${plan?.weekly_structure.indexOf(todaySession) || 0}`)}
              size="sm"
            />
          </Card>
        ) : (
          <Card className="mb-4">
            <Text className="text-[#888888] text-center py-4">
              No hay sesión programada para hoy{'\n'}Descansa o usa el temporizador libre
            </Text>
          </Card>
        )}

        {plan ? (
          <Card className="mb-4">
            <Text className="text-[#F5F5F5] font-bold mb-2">{plan.plan_name}</Text>
            <Text className="text-[#888888] text-sm mb-1">{plan.duration_weeks} semanas · {plan.sessions_per_week} sesiones/semana</Text>
            {plan.recommendations.length > 0 && (
              <>
                <Divider />
                <Text className="text-[#E8C547] text-xs font-semibold mb-2">Recomendaciones</Text>
                {plan.recommendations.slice(0, 2).map((rec, i) => (
                  <Text key={i} className="text-[#888888] text-xs mb-1">• {rec}</Text>
                ))}
              </>
            )}
          </Card>
        ) : (
          <Card className="mb-4">
            <Text className="text-[#888888] text-center py-4">No tienes un plan activo</Text>
          </Card>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
