export type Discipline = 'boxing' | 'mma' | 'both';
export type Goal = 'compete' | 'fitness' | 'selfdefense' | 'beginner';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'none' | 'basic' | 'full';
export type FitnessLevel = 'low' | 'medium' | 'high';
export type Intensity = 'low' | 'medium' | 'high';
export type TimerStatus = 'idle' | 'running' | 'resting' | 'warning' | 'finished';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  discipline: Discipline;
  goal: Goal;
  level: Level;
  days_per_week: number;
  equipment: Equipment;
  fitness_level: FitnessLevel;
  injuries: string | null;
  created_at: string;
}

export type UserProfileInput = Omit<UserProfile, 'id' | 'user_id' | 'created_at'>;

export interface PendingOnboarding {
  profileData: UserProfileInput;
  plan: TrainingPlan;
}

export interface Exercise {
  name: string;
  description: string;
  duration_seconds: number;
  sets: number;
  reps: number | null;
}

export interface PlanSession {
  day: string;
  session_type: string;
  duration_minutes: number;
  rounds: number;
  round_duration_seconds: number;
  rest_seconds: number;
  exercises: Exercise[];
  focus: string;
  intensity: Intensity;
}

export interface TrainingPlan {
  plan_name: string;
  duration_weeks: number;
  sessions_per_week: number;
  weekly_structure: PlanSession[];
  recommendations: string[];
  warnings: string[];
}

export interface Session {
  id: string;
  user_id: string;
  date: string;
  discipline: string;
  duration_minutes: number;
  rounds_completed?: number;
  notes?: string;
  rating?: number;
  plan_session_day?: string;
  created_at: string;
}

export type NewSession = Omit<Session, 'id' | 'user_id' | 'created_at'>;

export interface TimerConfig {
  rounds: number;
  round_duration: number;
  rest_duration: number;
  warning_seconds: number;
}

export interface QuestionnaireData {
  name: string;
  discipline: Discipline | null;
  goal: Goal | null;
  level: Level | null;
  days_per_week: number | null;
  equipment: Equipment | null;
  fitness_level: FitnessLevel | null;
  injuries: string;
}

