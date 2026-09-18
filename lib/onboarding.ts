import { deactivateOtherPlans, saveTrainingPlan, saveUserProfile } from '@/lib/supabase';
import { PendingOnboarding, UserProfile } from '@/types';

let pendingComplete: Promise<UserProfile> | null = null;

export function completePendingOnboarding(userId: string, pending: PendingOnboarding): Promise<UserProfile> {
  if (!pendingComplete) {
    pendingComplete = doCompletePendingOnboarding(userId, pending).finally(() => {
      pendingComplete = null;
    });
  }
  return pendingComplete;
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