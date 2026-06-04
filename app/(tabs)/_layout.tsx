import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;

const tabIcons: Record<string, { focused: IoniconName; unfocused: IoniconName }> = {
  home: { focused: 'home', unfocused: 'home-outline' },
  timer: { focused: 'timer', unfocused: 'timer-outline' },
  training: { focused: 'fitness', unfocused: 'fitness-outline' },
  history: { focused: 'bar-chart', unfocused: 'bar-chart-outline' },
  profile: { focused: 'person', unfocused: 'person-outline' },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#141414',
          borderTopColor: '#2A2A2A',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#E8C547',
        tabBarInactiveTintColor: '#888888',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? tabIcons.home.focused : tabIcons.home.unfocused} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: 'Timer',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? tabIcons.timer.focused : tabIcons.timer.unfocused} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? tabIcons.training.focused : tabIcons.training.unfocused} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? tabIcons.history.focused : tabIcons.history.unfocused} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? tabIcons.profile.focused : tabIcons.profile.unfocused} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
