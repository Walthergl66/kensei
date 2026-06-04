import { Platform } from 'react-native';

// Dynamically import expo-notifications to avoid crashes in Expo Go if not supported
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('expo-notifications could not be loaded');
}

export async function registerForPushNotificationsAsync() {
  if (!Notifications) return false;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Error registering for notifications:', error);
    return false;
  }
}

export async function scheduleDailyReminder(hour: number, minute: number) {
  if (!Notifications) return;

  try {
    await cancelAllReminders();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🥋 ¡Es hora de entrenar!",
        body: "Tu entrenamiento de Kensei te espera. ¡Vamos a darle!",
        sound: true,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
  } catch (error) {
    console.warn('Error scheduling notification:', error);
  }
}

export async function cancelAllReminders() {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Error cancelling notifications:', error);
  }
}
