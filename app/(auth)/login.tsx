import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import Button from '@/components/ui/Button';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setDevMode } = useUserStore();

  async function handleLogin() {
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
      <Text className="text-[#E8C547] text-4xl font-bold text-center mb-2">Kensei</Text>
      <Text className="text-[#888888] text-center mb-8">Inicia sesión para continuar</Text>

      <Text className="text-[#F5F5F5] text-sm mb-2 ml-1">Email</Text>
      <TextInput
        className="bg-[#141414] text-[#F5F5F5] rounded-xl p-4 mb-4 border border-[#2A2A2A]"
        placeholder="tu@email.com"
        placeholderTextColor="#888888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text className="text-[#F5F5F5] text-sm mb-2 ml-1">Contraseña</Text>
      <View className="relative mb-6">
        <TextInput
          className="bg-[#141414] text-[#F5F5F5] rounded-xl p-4 border border-[#2A2A2A] pr-12"
          placeholder="••••••••"
          placeholderTextColor="#888888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-4"
        >
          <Text className="text-[#888888]">{showPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <Button title="Iniciar sesión" onPress={handleLogin} loading={loading} disabled={loading} />
      <TouchableOpacity onPress={() => router.push('/(auth)/register')} className="mt-4 items-center">
        <Text className="text-[#888888]">¿No tienes cuenta? <Text className="text-[#E8C547]">Regístrate</Text></Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleDevMode} className="mt-8 items-center">
        <Text className="text-[#888888] text-sm">Modo desarrollo (sin conexión)</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
