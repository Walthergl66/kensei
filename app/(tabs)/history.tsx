import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getSessions } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { Session } from '@/types';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

const disciplineIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  boxing: 'bonfire',
  mma: 'fitness',
  both: 'bonfire',
};

const disciplineColors: Record<string, string> = {
  boxing: '#E8C547',
  mma: '#F44336',
  both: '#E8C547',
};

const MOCK_SESSIONS: Session[] = [
  {
    id: '1',
    user_id: 'guest',
    date: '2026-06-01',
    discipline: 'boxing',
    duration_minutes: 30,
    rounds_completed: 3,
    rating: 5,
    notes: 'Excelente sesion de sparring técnico.',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'guest',
    date: '2026-05-30',
    discipline: 'mma',
    duration_minutes: 45,
    rounds_completed: 5,
    rating: 4,
    notes: 'Enfoque en grappling y derribos.',
    created_at: new Date().toISOString(),
  },
];

export default function HistoryScreen() {
  const { session, isDevMode } = useUserStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingError, setLoadingError] = useState(false);

  async function loadSessions() {
    if (isDevMode || !session?.user?.id) {
      setSessions(MOCK_SESSIONS);
      setLoadingError(false);
      return;
    }
    try {
      const data = await getSessions(session.user.id);
      setSessions(data);
      setLoadingError(false);
    } catch {
      setLoadingError(true);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [session?.user?.id, isDevMode])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, [session?.user?.id, isDevMode]);

  if (loadingError) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0A]">
        <EmptyState
          icon="⚠️"
          title="Error al cargar"
          subtitle="No se pudieron cargar tus entrenamientos. Tira hacia abajo para reintentar."
          actionLabel="Reintentar"
          onAction={onRefresh}
        />
      </SafeAreaView>
    );
  }

  if (sessions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0A]">
        <EmptyState
          icon="📊"
          title="Sin entrenamientos"
          subtitle="Tus sesiones guardadas apareceran aqui"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8C547" />}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-8 pb-4">
          <Text className="text-[#F5F5F5] text-2xl font-bold tracking-tight">Historial</Text>
          <Text className="text-[#666666] text-sm mt-1">{sessions.length} entrenamientos</Text>
        </View>

        {sessions.map((s) => (
          <Card key={s.id} className="mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-xl bg-[#1A1A1A] items-center justify-center">
                  <Ionicons
                    name={disciplineIcons[s.discipline] || 'bonfire'}
                    size={18}
                    color={disciplineColors[s.discipline] || '#E8C547'}
                  />
                </View>
                <View>
                  <Text className="text-[#F5F5F5] font-semibold text-sm">{s.date}</Text>
                  <Text className="text-[#666666] text-xs mt-0.5">
                    {s.duration_minutes} min{s.rounds_completed ? ` · ${s.rounds_completed} rondas` : ''}
                  </Text>
                </View>
              </View>
              {s.rating && (
                <View className="flex-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= s.rating! ? 'star' : 'star-outline'}
                      size={14}
                      color={star <= s.rating! ? '#E8C547' : '#333333'}
                    />
                  ))}
                </View>
              )}
            </View>
            {s.notes && (
              <View className="mt-3 pt-3 border-t border-[#1E1E1E]">
                <Text className="text-[#666666] text-xs leading-5">{s.notes}</Text>
              </View>
            )}
          </Card>
        ))}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
