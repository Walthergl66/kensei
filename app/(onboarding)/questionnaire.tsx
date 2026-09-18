import { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/stores/userStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { supabase, saveUserProfile, saveTrainingPlan, deactivateOtherPlans } from '@/lib/supabase';
import { generateTrainingPlan } from '@/lib/agent';
import { DEFAULT_PLAN } from '@/constants';
import { Discipline, Goal, Level, Equipment, FitnessLevel, UserProfile, UserProfileInput } from '@/types';
import {
  QUESTION_LIST,
  getVisibleQuestions,
  buildPreferenceSummary,
  SurveyAnswers,
  SurveyQuestion,
  SurveyOption,
} from '@/constants/survey';
import Button from '@/components/ui/Button';
import StepIndicator from '@/components/onboarding/StepIndicator';
import QuestionOption from '@/components/onboarding/QuestionOption';
import InjuriesStep from '@/components/onboarding/InjuriesStep';

export default function QuestionnaireScreen() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [injuries, setInjuries] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { session, isDevMode, setProfile, setIsOnboarded, setPendingOnboarding, setProfileContext } = useUserStore();
  const { setPlan } = useTrainingStore();

  const visibleQuestions = getVisibleQuestions(answers);
  const currentQuestion = visibleQuestions[step];
  const isInjuriesStep = step >= visibleQuestions.length;
  const totalSteps = QUESTION_LIST.length + 1;

  function answerQuestion(value: string | number) {
    if (!currentQuestion || currentQuestion.type !== 'choice') return;
    setAnswers(prev => {
      const next = { ...prev, [currentQuestion.key]: value };
      for (const other of QUESTION_LIST) {
        if (other.dependsOn?.includes(currentQuestion.key)) delete next[other.key];
      }
      return next;
    });
    setStep(step + 1);
  }

  function handleNextName() {
    if (currentQuestion?.key === 'name' && String(answers.name ?? '').trim()) {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  async function handleSubmit() {
    const name = String(answers.name ?? '').trim();
    if (!name || answers.discipline == null || answers.goal == null || answers.level == null ||
        answers.days_per_week == null || answers.equipment == null || answers.fitness_level == null) {
      setSubmitError('Completa la encuesta para crear una rutina personalizada.');
      return;
    }

    setLoading(true);
    setSubmitError(null);

    const profileData: UserProfileInput = {
      name,
      discipline: answers.discipline as Discipline,
      goal: answers.goal as Goal,
      level: answers.level as Level,
      days_per_week: Number(answers.days_per_week),
      equipment: answers.equipment as Equipment,
      fitness_level: answers.fitness_level as FitnessLevel,
      injuries: injuries.trim() || null,
    };

    const preferences = buildPreferenceSummary(answers);
    const fullProfile = {
      id: isDevMode ? 'dev' : '',
      user_id: isDevMode ? 'dev' : (session?.user?.id || 'guest'),
      ...profileData,
      created_at: new Date().toISOString(),
    } as UserProfile;

    setProfileContext(preferences || null);

    let generatedPlan = DEFAULT_PLAN;
    try {
      generatedPlan = await generateTrainingPlan(fullProfile, preferences || undefined);
    } catch (e) {
      console.warn('Agent failed, using default plan:', e);
    }

    if (isDevMode || !supabase || !session?.user?.id) {
      if (!isDevMode && supabase && !session?.user?.id) {
        setPendingOnboarding({ profileData, plan: generatedPlan });
        setLoading(false);
        router.replace('/(auth)/register?from=onboarding');
        return;
      }

      setProfile(fullProfile);
      setPlan(generatedPlan);
      setIsOnboarded(true);
      setLoading(false);
      router.replace('/(tabs)/home');
      return;
    }

    try {
      await saveUserProfile(session.user.id, profileData);
      setProfile(fullProfile);
      await deactivateOtherPlans(session.user.id);
      await saveTrainingPlan(session.user.id, generatedPlan);
      setPlan(generatedPlan);
      setIsOnboarded(true);
      router.replace('/(tabs)/home');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Ocurrio un error al guardar tu perfil');
    } finally {
      setLoading(false);
    }
  }

  if (isInjuriesStep) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0A]">
        <View className="flex-1 px-6 pt-4">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={handleBack} className="mr-4">
              <Ionicons name="chevron-back" size={24} color="#E8C547" />
            </TouchableOpacity>
            <StepIndicator current={step} total={totalSteps} />
          </View>
          <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <InjuriesStep value={injuries} onChange={setInjuries} />
            {submitError && (
              <View className="bg-[#F44336]/10 border border-[#F44336]/40 rounded-2xl p-3 mt-4">
                <Text className="text-[#F44336] text-xs">{submitError}</Text>
              </View>
            )}
          </ScrollView>
          <View className="pb-8 gap-2">
            <Button title="Finalizar" onPress={handleSubmit} loading={loading} disabled={loading} size="lg" />
            <Button title="Omitir" onPress={handleSubmit} variant="ghost" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const question = currentQuestion as SurveyQuestion;
  const options: SurveyOption[] = question?.options?.(answers) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center mb-4">
          {step > 0 && (
            <TouchableOpacity onPress={handleBack} className="mr-4">
              <Ionicons name="chevron-back" size={24} color="#E8C547" />
            </TouchableOpacity>
          )}
          <StepIndicator current={step} total={totalSteps} />
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-[#F5F5F5] text-2xl font-bold mb-8 tracking-tight">{question.question}</Text>

          {question.type === 'text' ? (
            <TextInput
              className="bg-[#141414] text-[#F5F5F5] rounded-2xl p-5 border border-[#1E1E1E] text-lg"
              placeholder={question.placeholder ?? 'Escribe aqui'}
              placeholderTextColor="#666666"
              value={String(answers.name ?? '')}
              onChangeText={(text) => setAnswers(prev => ({ ...prev, name: text }))}
              autoFocus
            />
          ) : (
            options.map((opt) => (
              <QuestionOption
                key={String(opt.value)}
                label={opt.label}
                description={opt.description}
                selected={answers[question.key] == null ? false : String(answers[question.key]) === String(opt.value)}
                onSelect={() => answerQuestion(opt.value)}
              />
            ))
          )}
        </View>

        {question.type === 'text' && (
          <View className="pb-8">
            <Button
              title="Siguiente"
              onPress={handleNextName}
              disabled={!String(answers.name ?? '').trim()}
              size="lg"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}