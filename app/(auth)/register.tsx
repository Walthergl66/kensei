import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister() {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Registro exitoso', 'Revisa tu email para confirmar tu cuenta.');
      router.replace('/(auth)/login');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#0A0A0A] justify-center px-6"
    >
      <Text className="text-[#E8C547] text-4xl font-bold text-center mb-2">Kensei</Text>
      <Text className="text-[#888888] text-center mb-8">Crea tu cuenta</Text>

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
      <TextInput
        className="bg-[#141414] text-[#F5F5F5] rounded-xl p-4 mb-4 border border-[#2A2A2A]"
        placeholder="Mínimo 6 caracteres"
        placeholderTextColor="#888888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
      />

      <Text className="text-[#F5F5F5] text-sm mb-2 ml-1">Confirmar contraseña</Text>
      <TextInput
        className="bg-[#141414] text-[#F5F5F5] rounded-xl p-4 mb-6 border border-[#2A2A2A]"
        placeholder="Repite la contraseña"
        placeholderTextColor="#888888"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showPassword}
      />

      <Button title="Crear cuenta" onPress={handleRegister} loading={loading} disabled={loading} />
      <TouchableOpacity onPress={() => router.back()} className="mt-4 items-center">
        <Text className="text-[#888888]">¿Ya tienes cuenta? <Text className="text-[#E8C547]">Inicia sesión</Text></Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
