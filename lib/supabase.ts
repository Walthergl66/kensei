import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, NewSession, Session, TrainingPlan } from '@/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveUserProfile(
  userId: string,
  profile: Omit<UserProfile, 'id' | 'user_id' | 'created_at'>
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('user_profile').upsert({
    user_id: userId,
    ...profile,
  });
  if (error) throw new Error(error.message);
}

export async function saveSession(
  userId: string,
  session: NewSession
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('sessions').insert({
    user_id: userId,
    ...session,
  });
  if (error) throw new Error(error.message);
}

export async function getSessions(
  userId: string,
  limit = 50
): Promise<Session[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function saveTrainingPlan(
  userId: string,
  plan: TrainingPlan
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('training_plans').insert({
    user_id: userId,
    plan_json: JSON.parse(JSON.stringify(plan)),
    active: true,
  });
  if (error) throw new Error(error.message);
}

export async function deactivateOtherPlans(userId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('training_plans')
    .update({ active: false })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function getActiveTrainingPlan(
  userId: string
): Promise<TrainingPlan | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('training_plans')
    .select('plan_json')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.plan_json as TrainingPlan | null;
}
