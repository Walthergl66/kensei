// SoundManager - Silent Mode for Expo Go compatibility
// This file is protected against crashes when 'expo-av' native modules are missing.
// To enable real sounds, a Development Build with 'expo-av' is required.
import { Platform } from 'react-native';

class SoundManager {
  private sounds: Record<string, any> = {};

  async play(name: 'beep' | 'finish' | 'halfway') {
    // We only log the event to avoid trying to load any native modules
    console.log(`[Timer Event] Sound: ${name}`);
  }

  async unload() {
    this.sounds = {};
  }
}

export const soundManager = new SoundManager();

let NotificationsModule: typeof import('expo-notifications') | null = null;

async function getNotificationsModule(): Promise<typeof import('expo-notifications') | null> {
  if (Platform.OS === 'web') return null;
  if (!NotificationsModule) {
    NotificationsModule = await import('expo-notifications');
  }
  return NotificationsModule;
}

export async function registerForPushNotificationsAsync(): Promise<boolean> {
  const mod = await getNotificationsModule();
  if (!mod) return false;
  try {
    const { status } = await mod.getPermissionsAsync();
    if (status === 'granted') return true;
    const { status: requested } = await mod.requestPermissionsAsync();
    return requested === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<boolean> {
  const mod = await getNotificationsModule();
  if (!mod) return false;
  try {
    await mod.cancelAllScheduledNotificationsAsync();
    await mod.scheduleNotificationAsync({
      content: {
        title: 'Kensei',
        body: 'Es hora de tu entrenamiento. Disciplina hoy, maestro manana.',
      },
      trigger: {
        type: mod.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelAllReminders(): Promise<void> {
  const mod = await getNotificationsModule();
  if (!mod) return;
  try {
    await mod.cancelAllScheduledNotificationsAsync();
  } catch {
    // silencioso
  }
}