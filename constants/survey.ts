import { Discipline, Goal } from '@/types';

export type SurveyAnswers = Record<string, string | number | null>;

export interface SurveyOption {
  label: string;
  description?: string;
  value: string | number;
}

export interface SurveyQuestion {
  key: string;
  question: string;
  type: 'text' | 'choice';
  placeholder?: string;
  isProfile: boolean;
  options?: (answers: SurveyAnswers) => SurveyOption[];
  dependsOn?: string[];
}

const focusOptions = (discipline: Discipline | null): SurveyOption[] => {
  switch (discipline) {
    case 'boxing':
      return [
        { label: 'Pegada y potencia', description: 'Fortalecer golpes, buscar el knock out', value: 'power' },
        { label: 'Defensa y contragolpe', description: 'Esquivas, bloqueos, slips', value: 'defense' },
        { label: 'Movimiento de piernas', description: 'Footwork, salidas y angulos', value: 'footwork' },
        { label: 'Todo un poco', description: 'Entrenamiento equilibrado', value: 'all' },
      ];
    case 'mma':
      return [
        { label: 'Striking', description: 'Pies y punos (boxeo o Muay Thai)', value: 'striking' },
        { label: 'Suelo y sumisiones', description: 'Grappling y control en el piso', value: 'grappling' },
        { label: 'Clinch y derribos', description: 'Trabajo de clinch y takedowns', value: 'clinch' },
        { label: 'Balanceado', description: 'Mitad striking, mitad suelo', value: 'balanced' },
      ];
    default:
      return [
        { label: 'Equilibrado 50/50', description: 'Striking y grappling a partes iguales', value: 'balanced' },
        { label: 'Mas striking', description: 'Prioridad a golpear (70/30)', value: 'striking' },
        { label: 'Mas suelo', description: 'Prioridad a grappling (30/70)', value: 'grappling' },
        { label: 'Corregir mi base', description: 'Reforzar fundamentos de ambos', value: 'base' },
      ];
  }
};

const goalContextOptions = (goal: Goal | null): SurveyOption[] => {
  switch (goal) {
    case 'compete':
      return [
        { label: 'Competir en menos de 3 meses', value: 'compete-fast' },
        { label: 'Competir en 3-6 meses', value: 'compete-mid' },
        { label: 'Ya compito regularmente', value: 'compete-active' },
        { label: 'Aun no, preparar la base primero', value: 'compete-prep' },
      ];
    case 'fitness':
      return [
        { label: 'Que duela: HIIT y definicion', description: 'Sudar, quemar grasa', value: 'fitness-hiit' },
        { label: 'Tecnica + condicion suave', description: 'Mejorar sin destruirme', value: 'fitness-tech' },
        { label: 'Mixto', description: 'Un poco de todo', value: 'fitness-mix' },
      ];
    case 'selfdefense':
      return [
        { label: 'Defensa en situacion real', description: 'Salir de situaciones de riesgo', value: 'sd-real' },
        { label: 'Confianza y postura', description: 'Seguridad al caminar y relacionarme', value: 'sd-confidence' },
        { label: 'Ambas', value: 'sd-both' },
      ];
    default:
      return [
        { label: 'Base tecnica primero', description: 'Aprender bien lo esencial', value: 'beginner-base' },
        { label: 'Rapido y practico', description: 'Ver progreso desde el dia uno', value: 'beginner-fast' },
        { label: 'Tecnica + acondicionamiento', description: 'Fundamentos y algo de cardio', value: 'beginner-mix' },
      ];
  }
};

export const QUESTION_LIST: SurveyQuestion[] = [
  { key: 'name', question: 'Como te llamas?', type: 'text', placeholder: 'Tu nombre', isProfile: true },
  {
    key: 'discipline',
    question: 'Que disciplina quieres entrenar?',
    type: 'choice',
    isProfile: true,
    options: () => [
      { label: 'Boxeo', value: 'boxing' },
      { label: 'MMA', value: 'mma' },
      { label: 'Ambas', value: 'both' },
    ],
  },
  {
    key: 'focus',
    question: 'Dentro de eso, en que quieres enfocarte?',
    type: 'choice',
    isProfile: false,
    dependsOn: ['discipline'],
    options: (answers) => focusOptions((answers.discipline as Discipline | null) ?? null),
  },
  {
    key: 'goal',
    question: 'Cual es tu objetivo principal?',
    type: 'choice',
    isProfile: true,
    options: () => [
      { label: 'Competir', value: 'compete' },
      { label: 'Ponerme en forma', value: 'fitness' },
      { label: 'Defensa personal', value: 'selfdefense' },
      { label: 'Aprender desde cero', value: 'beginner' },
    ],
  },
  {
    key: 'goalContext',
    question: 'Cuentame un poco mas de tu objetivo',
    type: 'choice',
    isProfile: false,
    dependsOn: ['goal'],
    options: (answers) => goalContextOptions((answers.goal as Goal | null) ?? null),
  },
  {
    key: 'level',
    question: 'Cual es tu nivel actual?',
    type: 'choice',
    isProfile: true,
    options: () => [
      { label: 'Principiante', description: 'Nunca he entrenado formalmente', value: 'beginner' },
      { label: 'Intermedio', description: 'Entreno ocasionalmente', value: 'intermediate' },
      { label: 'Avanzado', description: 'Entreno regularmente', value: 'advanced' },
    ],
  },
  {
    key: 'days_per_week',
    question: 'Cuantos dias por semana puedes entrenar?',
    type: 'choice',
    isProfile: true,
    options: () => [
      { label: '2 dias', value: 2 },
      { label: '3 dias', value: 3 },
      { label: '4-5 dias', value: 5 },
      { label: 'Todos los dias', value: 7 },
    ],
  },
  {
    key: 'equipment',
    question: 'Que equipamiento tienes disponible?',
    type: 'choice',
    isProfile: true,
    options: () => [
      { label: 'Sin equipamiento', description: 'Solo mi cuerpo', value: 'none' },
      { label: 'Guantes y costal', value: 'basic' },
      { label: 'Gimnasio completo', description: 'Maquinas, pesas y ring', value: 'full' },
    ],
  },
  {
    key: 'fitness_level',
    question: 'Como describes tu condicion fisica actual?',
    type: 'choice',
    isProfile: true,
    options: () => [
      { label: 'Baja', description: 'Me canso rapido', value: 'low' },
      { label: 'Media', value: 'medium' },
      { label: 'Alta', description: 'Buena base cardio', value: 'high' },
    ],
  },
];

export const PROFILE_KEYS: string[] = ['name', 'discipline', 'goal', 'level', 'days_per_week', 'equipment', 'fitness_level'];

export function getVisibleQuestions(answers: SurveyAnswers): SurveyQuestion[] {
  return QUESTION_LIST.filter((q) => !q.dependsOn || q.dependsOn.every((d) => answers[d] != null));
}

export function getOptionLabel(question: SurveyQuestion, value: string | number | null, answers: SurveyAnswers): string | null {
  if (value == null) return null;
  const options = question.options?.(answers) ?? [];
  return options.find((o) => String(o.value) === String(value))?.label ?? String(value);
}

export function buildPreferenceSummary(answers: SurveyAnswers): string {
  const parts: string[] = [];
  const list = getVisibleQuestions(answers);
  const focusQ = list.find((q) => q.key === 'focus');
  const goalQ = list.find((q) => q.key === 'goalContext');
  if (focusQ) {
    const label = getOptionLabel(focusQ, answers.focus ?? null, answers);
    if (label) parts.push(`Enfoque preferido: ${label}`);
  }
  if (goalQ) {
    const label = getOptionLabel(goalQ, answers.goalContext ?? null, answers);
    if (label) parts.push(`Objetivo detallado: ${label}`);
  }
  return parts.join('. ');
}