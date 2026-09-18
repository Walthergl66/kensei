import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/stores/userStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { supabase, getActiveTrainingPlan } from '@/lib/supabase';
import { getCoachAdvice } from '@/lib/agent';
import { getDayNameInSpanish } from '@/lib/utils';
import { TrainingPlan, PlanSession } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Divider from '@/components/ui/Divider';

function getTodaySession(plan: TrainingPlan | null): { session: PlanSession; index: number } | null {
  if (!plan?.weekly_structure) return null;
  const today = getDayNameInSpanish();
  const index = plan.weekly_structure.findIndex((s) => s.day.toLowerCase() === today.toLowerCase());
  if (index === -1) return null;
  return { session: plan.weekly_structure[index], index };
}

export default function HomeScreen() {
  const { profile, session, isDevMode } = useUserStore();
  const { plan, setPlan } = useTrainingStore();
  const [refreshing, setRefreshing] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState('La disciplina es el puente entre las metas y los logros.');

  const todayData = getTodaySession(plan);

  const loadAdvice = useCallback(async () => {
    if (profile) {
      const advice = await getCoachAdvice(profile);
      setCoachAdvice(advice);
    }
  }, [profile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAdvice();
    if (!isDevMode && supabase && session?.user?.id) {
      try {
        const freshPlan = await getActiveTrainingPlan(session.user.id);
        if (freshPlan) setPlan(freshPlan);
      } catch {}
    }
    setRefreshing(false);
  }, [session?.user?.id, isDevMode, loadAdvice]);

  useEffect(() => {
    loadAdvice();
  }, [loadAdvice]);

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8C547" />}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-8 pb-6">
          <Text className="text-[#E8C547] text-3xl font-bold tracking-tight">
            {profile?.name || 'Guerrero'}
          </Text>
          <Text className="text-[#666666] text-sm mt-1.5 tracking-wide">
            {getDayNameInSpanish()} — Listo para entrenar
          </Text>
        </View>

        <View className="mb-6">
          <Card accentColor="#E8C547" className="bg-[#1A1A1A]/50 border-[#E8C547]/20">
            <View className="flex-row items-center gap-3 mb-2">
              <View className="w-8 h-8 rounded-full bg-[#E8C547]/10 items-center justify-center">
                <Ionicons name="chatbubble-ellipses" size={16} color="#E8C547" />
              </View>
              <Text className="text-[#E8C547] text-xs font-bold uppercase tracking-wider">Consejo de Kensei</Text>
            </View>
            <Text className="text-[#F5F5F5] text-sm italic leading-5">"{coachAdvice}"</Text>
          </Card>
        </View>

        {todayData ? (
          <View className="mb-4">
            <Text className="text-[#666666] text-xs font-semibold uppercase tracking-widest mb-3 ml-1">Sesion de hoy</Text>
            <Card accentColor="#E8C547" className="mb-4">
              <Text className="text-[#F5F5F5] text-xl font-bold mb-1">{todayData.session.session_type}</Text>
              <Text className="text-[#666666] text-sm mb-4">{todayData.session.focus}</Text>
              <View className="flex-row gap-4 mb-5">
                <View className="bg-[#1A1A1A] rounded-lg px-3 py-1.5">
                  <Text className="text-[#888888] text-xs font-medium">{todayData.session.duration_minutes} min</Text>
                </View>
                <View className="bg-[#1A1A1A] rounded-lg px-3 py-1.5">
                  <Text className="text-[#888888] text-xs font-medium">{todayData.session.rounds} rondas</Text>
                </View>
                <View className="bg-[#1A1A1A] rounded-lg px-3 py-1.5">
                  <Text className="text-[#888888] text-xs font-medium">{todayData.session.exercises.length} ejercicios</Text>
                </View>
              </View>
              <Button
                title="Ver sesion"
                onPress={() => router.push(`/training/${todayData.index}`)}
                size="sm"
              />
            </Card>
          </View>
        ) : (
          <Card className="mb-4">
            <View className="items-center py-6">
              <View className="w-12 h-12 rounded-xl bg-[#1A1A1A] items-center justify-center mb-3">
                <Ionicons name="fitness-outline" size={24} color="#666666" />
              </View>
              <Text className="text-[#666666] text-sm text-center">
                No hay sesion programada para hoy
              </Text>
              <Text className="text-[#555555] text-xs text-center mt-1">
                Descansa o usa el temporizador libre
              </Text>
            </View>
          </Card>
        )}

        {plan ? (
          <View>
            <Text className="text-[#666666] text-xs font-semibold uppercase tracking-widest mb-3 ml-1">Tu plan</Text>
            <Card>
              <Text className="text-[#F5F5F5] font-bold text-lg mb-1">{plan.plan_name}</Text>
              <Text className="text-[#666666] text-sm mb-3">{plan.duration_weeks} semanas · {plan.sessions_per_week} sesiones/semana</Text>
              {plan.recommendations.length > 0 && (
                <>
                  <Divider />
                  <Text className="text-[#E8C547] text-xs font-semibold uppercase tracking-wider mb-3">Recomendaciones</Text>
                  {plan.recommendations.slice(0, 2).map((rec, i) => (
                    <View key={i} className="flex-row items-start mb-2">
                      <Text className="text-[#E8C547] text-xs mr-2">✦</Text>
                      <Text className="text-[#888888] text-xs flex-1 leading-5">{rec}</Text>
                    </View>
                  ))}
                </>
              )}
            </Card>
          </View>
        ) : (
          <Card>
            <View className="items-center py-6">
              <View className="w-12 h-12 rounded-xl bg-[#1A1A1A] items-center justify-center mb-3">
                <Ionicons name="clipboard-outline" size={24} color="#666666" />
              </View>
              <Text className="text-[#666666] text-sm text-center">
                No tienes un plan activo
              </Text>
              <Text className="text-[#555555] text-xs text-center mt-1">
                Completa el cuestionario para obtener tu plan
              </Text>
            </View>
          </Card>
        )}

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
