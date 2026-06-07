// SoundManager - Silent Mode for Expo Go compatibility
// This file is protected against crashes when 'expo-av' native modules are missing.
// To enable real sounds, a Development Build with 'expo-av' is required.

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

// Notification stubs
export async function registerForPushNotificationsAsync() { return false; }
export async function scheduleDailyReminder(_hour: number, _minute: number) { }
export async function cancelAllReminders() { }
