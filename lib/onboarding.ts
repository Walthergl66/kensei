import { deactivateOtherPlans, saveTrainingPlan, saveUserProfile } from '@/lib/supabase';
import { PendingOnboarding, UserProfile } from '@/types';

const pendingCompletes: Record<string, Promise<UserProfile>> = {};

export function completePendingOnboarding(userId: string, pending: PendingOnboarding): Promise<UserProfile> {
  if (!pendingCompletes[userId]) {
    pendingCompletes[userId] = doCompletePendingOnboarding(userId, pending).finally(() => {
      delete pendingCompletes[userId];
    });
  }
  return pendingCompletes[userId];
}

async function doCompletePendingOnboarding(userId: string, pending: PendingOnboarding): Promise<UserProfile> {
  await saveUserProfile(userId, pending.profileData);
  await deactivateOtherPlans(userId);
  await saveTrainingPlan(userId, pending.plan);

  return {
    id: '',
    user_id: userId,
    ...pending.profileData,
    created_at: new Date().toISOString(),
  };
}