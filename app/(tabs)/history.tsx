import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, SafeAreaView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getSessions } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { Session } from '@/types';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

const disciplineIcons: Record<string, string> = {
  boxing: '🥊',
  mma: '🦵',
  both: '🥊',
};

export default function HistoryScreen() {
  const { session, isDevMode } = useUserStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadSessions() {
    if (isDevMode || !session?.user?.id) {
      setSessions([]);
      return;
    }
    const data = await getSessions(session.user.id);
    setSessions(data);
  }

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [session])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, [session]);

  if (sessions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0A]">
        <EmptyState
          icon="📊"
          title="Sin entrenamientos"
          subtitle="Tus sesiones guardadas aparecerán aquí"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8C547" />}
      >
        <View className="py-4">
          <Text className="text-[#F5F5F5] text-2xl font-bold">Historial</Text>
          <Text className="text-[#888888] text-sm mt-1">{sessions.length} entrenamientos</Text>
        </View>

        {sessions.map((s) => (
          <Card key={s.id} className="mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">{disciplineIcons[s.discipline] || '🥊'}</Text>
                <View>
                  <Text className="text-[#F5F5F5] font-semibold">{s.date}</Text>
                  <Text className="text-[#888888] text-xs">{s.duration_minutes} min{s.rounds_completed ? ` · ${s.rounds_completed} rondas` : ''}</Text>
                </View>
              </View>
              {s.rating && (
                <Text className="text-[#E8C547] text-lg">{'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}</Text>
              )}
            </View>
            {s.notes && <Text className="text-[#888888] text-xs mt-2">{s.notes}</Text>}
          </Card>
        ))}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
