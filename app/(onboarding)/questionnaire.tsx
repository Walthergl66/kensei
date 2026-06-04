import { useState } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { supabase, saveUserProfile, saveTrainingPlan, deactivateOtherPlans } from '@/lib/supabase';
import { generateTrainingPlan } from '@/lib/agent';
import { DEFAULT_PLAN } from '@/constants';
import { Discipline, Goal, Level, Equipment, FitnessLevel, UserProfile } from '@/types';
import Button from '@/components/ui/Button';
import StepIndicator from '@/components/onboarding/StepIndicator';
import QuestionOption from '@/components/onboarding/QuestionOption';
import InjuriesStep from '@/components/onboarding/InjuriesStep';

const STEPS = [
  { question: '¿Cómo te llamas?', type: 'text' as const, key: 'name' as const },
  { question: '¿Qué disciplina quieres entrenar?', type: 'choice' as const, key: 'discipline' as const,
    options: [
      { label: 'Boxeo', value: 'boxing' as Discipline },
      { label: 'MMA', value: 'mma' as Discipline },
      { label: 'Ambas', value: 'both' as Discipline },
    ]},
  { question: '¿Cuál es tu objetivo principal?', type: 'choice' as const, key: 'goal' as const,
    options: [
      { label: 'Competir', value: 'compete' as Goal },
      { label: 'Ponerme en forma', value: 'fitness' as Goal },
      { label: 'Defensa personal', value: 'selfdefense' as Goal },
      { label: 'Aprender desde cero', value: 'beginner' as Goal },
    ]},
  { question: '¿Cuál es tu nivel actual?', type: 'choice' as const, key: 'level' as const,
    options: [
      { label: 'Principiante', description: 'Nunca he entrenado', value: 'beginner' as Level },
      { label: 'Intermedio', description: 'Entreno ocasionalmente', value: 'intermediate' as Level },
      { label: 'Avanzado', description: 'Entreno regularmente', value: 'advanced' as Level },
    ]},
  { question: '¿Cuántos días por semana puedes entrenar?', type: 'choice' as const, key: 'days_per_week' as const,
    options: [
      { label: '2 días', value: 2 },
      { label: '3 días', value: 3 },
      { label: '4-5 días', value: 5 },
      { label: 'Todos los días', value: 7 },
    ]},
  { question: '¿Qué equipamiento tienes disponible?', type: 'choice' as const, key: 'equipment' as const,
    options: [
      { label: 'Sin equipamiento', value: 'none' as Equipment },
      { label: 'Guantes y costal', value: 'basic' as Equipment },
      { label: 'Gimnasio completo', value: 'full' as Equipment },
    ]},
  { question: '¿Cómo describes tu condición física actual?', type: 'choice' as const, key: 'fitness_level' as const,
    options: [
      { label: 'Baja', description: 'Me canso rápido', value: 'low' as FitnessLevel },
      { label: 'Media', value: 'medium' as FitnessLevel },
      { label: 'Alta', description: 'Buena base cardio', value: 'high' as FitnessLevel },
    ]},
];

export default function QuestionnaireScreen() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [injuries, setInjuries] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, isDevMode, setProfile, setIsOnboarded } = useUserStore();
  const { setPlan } = useTrainingStore();

  const currentStep = STEPS[step];
  const isLastQuestion = step === STEPS.length - 1;
  const totalSteps = STEPS.length + 1;

  function handleAnswer(value: any) {
    setAnswers(prev => ({ ...prev, [currentStep.key]: value }));
    if (!isLastQuestion) {
      setStep(step + 1);
    } else {
      setStep(step + 1);
    }
  }

  function handleNext() {
    if (isLastQuestion) {
      setStep(step + 1);
    } else {
      setStep(step + 1);
    }
  }

  async function handleSubmit() {
    setLoading(true);

    const profileData = {
      name: answers.name,
      discipline: answers.discipline as Discipline,
      goal: answers.goal as Goal,
      level: answers.level as Level,
      days_per_week: answers.days_per_week as number,
      equipment: answers.equipment as Equipment,
      fitness_level: answers.fitness_level as FitnessLevel,
      injuries: injuries || null,
    };

    if (isDevMode || !supabase) {
      setProfile({ id: 'dev', user_id: 'dev', ...profileData, created_at: new Date().toISOString() } as UserProfile);
      setIsOnboarded(true);
      setPlan(DEFAULT_PLAN);
      setLoading(false);
      router.replace('/(tabs)/home');
      return;
    }

    if (!session?.user?.id) {
      Alert.alert('Error', 'Debes iniciar sesión primero');
      setLoading(false);
      return;
    }

    try {
      await saveUserProfile(session.user.id, profileData);
      setProfile({ id: '', user_id: session.user.id, ...profileData, created_at: new Date().toISOString() } as UserProfile);

      let plan = DEFAULT_PLAN;
      try {
        const fullProfile = { id: '', user_id: session.user.id, ...profileData, created_at: new Date().toISOString() } as UserProfile;
        plan = await generateTrainingPlan(fullProfile);
      } catch {
        plan = DEFAULT_PLAN;
      }

      await deactivateOtherPlans(session.user.id);
      await saveTrainingPlan(session.user.id, plan);
      setPlan(plan);
      setIsOnboarded(true);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Ocurrió un error al guardar tu perfil');
    } finally {
      setLoading(false);
    }
  }

  if (step > STEPS.length - 1) {
    return (
      <View className="flex-1 bg-[#0A0A0A] px-6 pt-12">
        <StepIndicator current={step} total={totalSteps} />
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <InjuriesStep value={injuries} onChange={setInjuries} />
        </ScrollView>
        <View className="pb-8">
          <Button title="Finalizar" onPress={handleSubmit} loading={loading} disabled={loading} size="lg" />
          <Button title="Omitir" onPress={handleSubmit} variant="ghost" className="mt-2" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A0A0A] px-6 pt-12">
      <StepIndicator current={step} total={totalSteps} />
      <View className="flex-1 justify-center">
        <Text className="text-[#F5F5F5] text-xl font-bold mb-6">{currentStep.question}</Text>

        {currentStep.type === 'text' ? (
          <TextInput
            className="bg-[#141414] text-[#F5F5F5] rounded-xl p-4 border border-[#2A2A2A] text-lg"
            placeholder="Tu nombre"
            placeholderTextColor="#888888"
            value={answers.name || ''}
            onChangeText={(text) => setAnswers(prev => ({ ...prev, name: text }))}
            autoFocus
          />
        ) : (
          currentStep.options?.map((opt: any) => (
            <QuestionOption
              key={opt.value}
              label={opt.label}
              description={opt.description}
              selected={answers[currentStep.key] === opt.value}
              onSelect={() => handleAnswer(opt.value)}
            />
          ))
        )}
      </View>

      {currentStep.type === 'text' && (
        <View className="pb-8">
          <Button
            title="Siguiente"
            onPress={handleNext}
            disabled={!answers.name?.trim()}
            size="lg"
          />
        </View>
      )}
    </View>
  );
}
