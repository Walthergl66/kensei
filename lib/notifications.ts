import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  let token;

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
}

export async function scheduleDailyReminder(hour: number, minute: number) {
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
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
