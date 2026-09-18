import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { completePendingOnboarding } from '@/lib/onboarding';
import { useUserStore } from '@/stores/userStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { validateEmail } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { pendingOnboarding, setDevMode, setProfile, setIsOnboarded, clearPendingOnboarding } = useUserStore();
  const { setPlan } = useTrainingStore();
  const hasPendingOnboarding = from === 'onboarding' && !!pendingOnboarding;

  function showError(message: string) {
    setErrorMsg(message);
    Alert.alert('Error', message);
  }

  async function handleRegister() {
    if (!email.trim()) { showError('Ingresa tu email'); return; }
    if (!validateEmail(email.trim())) { showError('Email invalido'); return; }
    if (!password) { showError('Ingresa una contrasena'); return; }
    if (password.length < 6) { showError('La contrasena debe tener al menos 6 caracteres'); return; }
    if (password !== confirmPassword) {
      showError('Las contrasenas no coinciden');
      return;
    }
    if (!supabase) return;

    setErrorMsg(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      showError(error.message);
    } else {
      if (data.session?.user) {
        setDevMode(false);
        if (pendingOnboarding) {
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
            showError(saveError instanceof Error ? saveError.message : 'No se pudo guardar tu rutina');
            return;
          }
        }

        setLoading(false);
        showError('Revisa tu email: debes confirmar tu cuenta');
        router.replace('/(auth)/login');
      }
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#0A0A0A] justify-center px-6"
    >
      <View className="items-center mb-8">
        <View className="w-16 h-16 rounded-2xl bg-[#E8C547]/10 items-center justify-center mb-4">
          <Ionicons name="flame" size={32} color="#E8C547" />
        </View>
        <Text className="text-[#E8C547] text-3xl font-bold tracking-tight">Kensei</Text>
        <Text className="text-[#666666] text-sm mt-2 text-center">
          {hasPendingOnboarding ? 'Crea tu cuenta para guardar tu rutina' : 'Crea tu cuenta'}
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
      <TextInput
        className="bg-[#141414] text-[#F5F5F5] rounded-2xl p-4 mb-4 border border-[#1E1E1E]"
        placeholder="Minimo 6 caracteres"
        placeholderTextColor="#555555"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
      />

      <Text className="text-[#666666] text-xs font-semibold uppercase tracking-wider mb-2 ml-1">Confirmar contrasena</Text>
      <View className="relative mb-6">
        <TextInput
          className="bg-[#141414] text-[#F5F5F5] rounded-2xl p-4 border border-[#1E1E1E] pr-12"
          placeholder="Repite la contrasena"
          placeholderTextColor="#555555"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-4"
        >
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666666" />
        </TouchableOpacity>
      </View>

      <Button title="Crear cuenta" onPress={handleRegister} loading={loading} disabled={loading} size="lg" />
      <TouchableOpacity onPress={() => router.back()} className="mt-5 items-center">
        <Text className="text-[#666666] text-sm">
          Ya tienes cuenta? <Text className="text-[#E8C547] font-semibold">Inicia sesion</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
