import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { completePendingOnboarding } from '@/lib/onboarding';
import { useUserStore } from '@/stores/userStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { validateEmail } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { pendingOnboarding, setDevMode, setProfile, setIsOnboarded, clearPendingOnboarding } = useUserStore();
  const { setPlan } = useTrainingStore();

  async function handleLogin() {
    if (!supabase) return;
    if (!email.trim()) { Alert.alert('Error', 'Ingresa tu email'); return; }
    if (!validateEmail(email.trim())) { Alert.alert('Error', 'Email invalido'); return; }
    if (!password) { Alert.alert('Error', 'Ingresa tu contrasena'); return; }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (!error && data.session?.user && pendingOnboarding) {
      try {
        const completedProfile = await completePendingOnboarding(data.session.user.id, pendingOnboarding);
        setProfile(completedProfile);
        setPlan(pendingOnboarding.plan);
        setIsOnboarded(true);
        clearPendingOnboarding();
        setLoading(false);
        router.replace('/(tabs)/home');
        return;
      } catch (saveError) {
        setLoading(false);
        Alert.alert('Error', saveError instanceof Error ? saveError.message : 'No se pudo guardar tu rutina');
        return;
      }
    }

    setLoading(false);
    if (error) Alert.alert('Error', error.message);
  }

  function handleDevMode() {
    setDevMode(true);
    router.replace('/(onboarding)/welcome');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#0A0A0A] justify-center px-6"
    >
      <View className="items-center mb-10">
        <View className="w-16 h-16 rounded-2xl bg-[#E8C547]/10 items-center justify-center mb-4">
          <Ionicons name="flame" size={32} color="#E8C547" />
        </View>
        <Text className="text-[#E8C547] text-3xl font-bold tracking-tight">Kensei</Text>
        <Text className="text-[#666666] text-sm mt-2 text-center">
          {pendingOnboarding ? 'Inicia sesion para guardar tu rutina' : 'Inicia sesion para continuar'}
        </Text>
      </View>

      <Text className="text-[#666666] text-xs font-semibold uppercase tracking-wider mb-2 ml-1">Email</Text>
      <TextInput
        className="bg-[#141414] text-[#F5F5F5] rounded-2xl p-4 mb-4 border border-[#1E1E1E]"
        placeholder="tu@email.com"
        placeholderTextColor="#555555"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text className="text-[#666666] text-xs font-semibold uppercase tracking-wider mb-2 ml-1">Contrasena</Text>
      <View className="relative mb-6">
        <TextInput
          className="bg-[#141414] text-[#F5F5F5] rounded-2xl p-4 border border-[#1E1E1E] pr-12"
          placeholder="Ingresa tu contrasena"
          placeholderTextColor="#555555"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-4"
        >
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666666" />
        </TouchableOpacity>
      </View>

      <Button title="Iniciar sesion" onPress={handleLogin} loading={loading} disabled={loading} size="lg" />
      <TouchableOpacity onPress={() => router.push(pendingOnboarding ? '/(auth)/register?from=onboarding' : '/(auth)/register')} className="mt-5 items-center">
        <Text className="text-[#666666] text-sm">
          No tienes cuenta? <Text className="text-[#E8C547] font-semibold">Registrate</Text>
        </Text>
      </TouchableOpacity>

      {!pendingOnboarding && (
        <TouchableOpacity onPress={() => router.replace('/(onboarding)/welcome')} className="mt-4 items-center">
          <Text className="text-[#666666] text-sm">
            Nuevo en Kensei? <Text className="text-[#E8C547] font-semibold">Haz tu encuesta inicial</Text>
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={handleDevMode} className="mt-8 items-center py-2">
        <Text className="text-[#555555] text-xs">Modo desarrollo (sin conexion)</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
