export const COLORS = {
  background: '#0A0A0A',
  surface: '#141414',
  border: '#2A2A2A',
  primary: '#E8C547',
  primaryDark: '#C4A32E',
  text: '#F5F5F5',
  textMuted: '#888888',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  rest: '#2196F3',
};

export const DEFAULT_TIMER = {
  rounds: 3,
  round_duration: 180,
  rest_duration: 60,
  warning_seconds: 10,
};

export const OLLAMA_MODEL = 'llama3.2';
export const OLLAMA_BASE_URL = process.env.EXPO_PUBLIC_OLLAMA_BASE_URL ?? 'http://localhost:11434';

import { TrainingPlan } from '@/types';

export const DAYS_OF_WEEK = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo',
];

export const DEFAULT_PLAN: TrainingPlan = {
  plan_name: 'Plan de inicio',
  duration_weeks: 4,
  sessions_per_week: 3,
  weekly_structure: [
    {
      day: 'Lunes',
      session_type: 'Técnica de golpeo',
      duration_minutes: 30,
      rounds: 3,
      round_duration_seconds: 180,
      rest_seconds: 60,
      exercises: [
        { name: 'Jab cruzado', description: 'Combinación básical', duration_seconds: 180, sets: 3, reps: null },
        { name: 'Shadow boxing', description: 'Movimiento y técnica', duration_seconds: 180, sets: 3, reps: null },
        { name: 'Footwork', description: 'Desplazamientos', duration_seconds: 180, sets: 3, reps: null },
      ],
      focus: 'Técnica básica',
      intensity: 'low',
    },
    {
      day: 'Miércoles',
      session_type: 'Condicionamiento',
      duration_minutes: 25,
      rounds: 3,
      round_duration_seconds: 180,
      rest_seconds: 60,
      exercises: [
        { name: 'Saltar cuerda', description: 'Calentamiento', duration_seconds: 180, sets: 3, reps: null },
        { name: 'Flexiones', description: 'Parte superior', duration_seconds: 60, sets: 3, reps: 15 },
        { name: 'Sentadillas', description: 'Piernas', duration_seconds: 60, sets: 3, reps: 20 },
      ],
      focus: 'Condición física',
      intensity: 'medium',
    },
    {
      day: 'Viernes',
      session_type: 'Sparring técnico',
      duration_minutes: 30,
      rounds: 3,
      round_duration_seconds: 180,
      rest_seconds: 60,
      exercises: [
        { name: 'Sparring ligero', description: 'Práctica controlada', duration_seconds: 180, sets: 3, reps: null },
        { name: 'Combinaciones', description: 'Trabajo en pareja', duration_seconds: 180, sets: 3, reps: null },
        { name: 'Enfriamiento', description: 'Estiramientos', duration_seconds: 180, sets: 1, reps: null },
      ],
      focus: 'Aplicación táctica',
      intensity: 'medium',
    },
  ],
  recommendations: [
    'Mantente hidratado antes, durante y después del entrenamiento',
    'Duerme al menos 8 horas para una recuperación óptima',
    'Escucha a tu cuerpo y descansa si sientes dolor',
  ],
  warnings: [
    'Realiza un calentamiento adecuado antes de cada sesión',
    'Si tienes alguna lesión, consulta a un profesional antes de entrenar',
  ],
};
