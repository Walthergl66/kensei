# AGENT.md — Kensei

Este archivo es la fuente de verdad del proyecto. Todo agente de desarrollo que trabaje en este repositorio debe leerlo completo antes de escribir cualquier línea de código y luego del cambio actualizarlo para que mis agentes tengan el contexto completo de mi aplicacion y de lo que se ha realizado y que se puede realizar


---

## Descripcion del proyecto

Kensei es una aplicacion movil de entrenamiento en artes marciales desarrollada con React Native y Expo. Su enfoque inicial es boxeo y MMA. La app incluye temporizadores de ronda configurables, planes de entrenamiento personalizados generados por un agente de IA local, historial de sesiones y un sistema de recomendaciones que adapta el plan segun el perfil del usuario obtenido en un cuestionario inicial.

El nombre "Kensei" proviene del japones y significa guerrero experto o maestro de combate.

---

## Stack tecnico

| Capa | Tecnologia |
|---|---|
| Framework | React Native con Expo (SDK 52+) |
| Lenguaje | TypeScript estricto |
| Navegacion | Expo Router (file-based routing) |
| Estado global | Zustand |
| Datos asincronos | TanStack Query v5 |
| Base de datos | Supabase (PostgreSQL) |
| Backend | Supabase (Auth + Database + Storage) |
| Estilos | NativeWind (Tailwind para React Native) |
| IA / Agente | Groq (API gratuita, modelos Llama 3 / Mixtral) |
| SDK Supabase | `@supabase/supabase-js` |

### Reglas del stack

- Usar TypeScript en todos los archivos. No usar `any` salvo casos excepcionales documentados.
- No instalar librerias fuera del stack definido sin justificacion explicita en un comentario.
- Todos los estilos van con NativeWind. No usar `StyleSheet.create` salvo animaciones nativas.
- Toda interaccion con la base de datos va a traves del cliente de Supabase, nunca con queries directas.
- El agente de IA usa Groq (API gratuita). No integrar ninguna API de pago sin confirmacion explicita.

---

## Estructura de carpetas

```
kensei/
├── app/
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx              # Pantalla de bienvenida inicial
│   │   └── questionnaire.tsx        # Cuestionario de perfil (7 preguntas)
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── home.tsx                 # Dashboard: plan del dia y racha
│   │   ├── timer.tsx                # Temporizador libre configurable
│   │   ├── training.tsx             # Plan de entrenamiento activo
│   │   ├── history.tsx              # Historial de sesiones
│   │   └── profile.tsx              # Perfil y configuracion
│   ├── training/
│   │   └── [sessionId].tsx          # Vista de sesion activa paso a paso
│   └── _layout.tsx
├── components/
│   ├── ui/                          # Componentes reutilizables (Button, Card, Badge, etc.)
│   ├── timer/                       # Componentes del temporizador
│   ├── training/                    # Componentes de sesion y ejercicios
│   └── onboarding/                  # Componentes del cuestionario
├── lib/
│   ├── agent.ts                     # Logica de llamada a Groq
│   ├── supabase.ts                  # Cliente y helpers de Supabase
│   └── utils.ts                     # Funciones utilitarias generales
├── stores/
│   ├── userStore.ts                 # Estado global del perfil de usuario
│   ├── timerStore.ts                # Estado del temporizador
│   └── trainingStore.ts             # Estado del plan activo
├── types/
│   └── index.ts                     # Todos los tipos e interfaces TypeScript
├── constants/
│   └── index.ts                     # Colores, tiempos por defecto, textos fijos
└── AGENT.md                         # Este archivo
```

---

## Supabase — Base de datos y backend

### Configuracion del cliente (lib/supabase.ts)

```typescript
// lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Variables de entorno (.env)

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
EXPO_PUBLIC_GROQ_API_KEY=tu-api-key   # API key de Groq (console.groq.com/keys)
```

### Esquema de base de datos (SQL para ejecutar en Supabase)

```sql
-- Perfil del usuario (uno por usuario autenticado)
CREATE TABLE user_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  discipline TEXT NOT NULL CHECK (discipline IN ('boxing', 'mma', 'both')),
  goal TEXT NOT NULL CHECK (goal IN ('compete', 'fitness', 'selfdefense', 'beginner')),
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  days_per_week INTEGER NOT NULL CHECK (days_per_week BETWEEN 1 AND 7),
  equipment TEXT NOT NULL CHECK (equipment IN ('none', 'basic', 'full')),
  fitness_level TEXT NOT NULL CHECK (fitness_level IN ('low', 'medium', 'high')),
  injuries TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sesiones de entrenamiento completadas
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  discipline TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  rounds_completed INTEGER,
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  plan_session_day TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Planes generados por el agente
CREATE TABLE training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  plan_json JSONB NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- Indice: solo un plan activo por usuario
CREATE UNIQUE INDEX one_active_plan_per_user
  ON training_plans (user_id)
  WHERE active = TRUE;

-- Row Level Security: cada usuario solo ve sus propios datos
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario ve su perfil" ON user_profile
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "usuario ve sus sesiones" ON sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "usuario ve sus planes" ON training_plans
  FOR ALL USING (auth.uid() = user_id);
```

### Helpers de base de datos

Todas las operaciones de base de datos van en `lib/supabase.ts`. No hacer llamadas a `supabase` directamente desde componentes o stores.

```typescript
// Ejemplos de helpers a implementar en lib/supabase.ts

export async function getUserProfile(): Promise<UserProfile | null>
export async function saveUserProfile(profile: Omit<UserProfile, 'id' | 'user_id' | 'created_at'>): Promise<void>
export async function saveSession(session: NewSession): Promise<void>
export async function getSessions(limit?: number): Promise<Session[]>
export async function saveTrainingPlan(plan: TrainingPlan): Promise<void>
export async function getActiveTrainingPlan(): Promise<TrainingPlan | null>
```

---

## Agente de recomendaciones con Groq (lib/agent.ts)

Groq es una API gratuita que corre modelos open-source como Llama 3 y Mixtral a alta velocidad. No requiere servidor local, solo una API key de [console.groq.com](https://console.groq.com/). El plan gratuito permite 30 solicitudes por minuto y 6000 por dia.

### Configuracion

```typescript
// constants/index.ts
export const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
```

```bash
# .env.local
EXPO_PUBLIC_GROQ_API_KEY=tu-api-key-aqui
```

La API key se obtiene gratis en https://console.groq.com/keys

### Implementacion (lib/agent.ts)

El agente usa el endpoint de chat de Groq, compatible con OpenAI. No se necesita SDK adicional, solo `fetch` con autenticacion Bearer.

```typescript
const callGroq = async (systemPrompt: string, userMessage: string): Promise<string> => {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content.trim();
};
```

El timeout de las peticiones es de 20 segundos con reintentos automaticos. Si Groq no responde (API key invalida, sin internet, etc), la app cae al plan por defecto sin congelarse.

---

## Tipos TypeScript principales

```typescript
// types/index.ts

export type Discipline = 'boxing' | 'mma' | 'both';
export type Goal = 'compete' | 'fitness' | 'selfdefense' | 'beginner';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'none' | 'basic' | 'full';
export type FitnessLevel = 'low' | 'medium' | 'high';
export type Intensity = 'low' | 'medium' | 'high';

export interface UserProfile {
  id: string;                  // UUID de Supabase
  user_id: string;             // UUID del usuario autenticado
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
  round_duration: number;   // segundos
  rest_duration: number;    // segundos
  warning_seconds: number;  // aviso antes del fin de ronda
}
```

---

## Cuestionario inicial (7 preguntas)

El cuestionario se presenta en la pantalla `(onboarding)/questionnaire.tsx`. Cada pregunta es un paso dentro de un stepper. Al terminar, se guarda el perfil en Supabase y se llama al agente para generar el plan.

| # | Pregunta | Opciones |
|---|---|---|
| 1 | Como te llamas? | Campo de texto libre |
| 2 | Que disciplina quieres entrenar? | Boxeo / MMA / Ambas |
| 3 | Cual es tu objetivo principal? | Competir / Ponerme en forma / Defensa personal / Aprender desde cero |
| 4 | Cual es tu nivel actual? | Principiante (nunca he entrenado) / Intermedio (entreno ocasionalmente) / Avanzado (entreno regularmente) |
| 5 | Cuantos dias por semana puedes entrenar? | 2 dias / 3 dias / 4-5 dias / Todos los dias |
| 6 | Que equipamiento tienes disponible? | Sin equipamiento / Guantes y costal / Gimnasio completo |
| 7 | Como describes tu condicion fisica actual? | Baja (me canso rapido) / Media / Alta (buena base cardio) |
| + | Tienes alguna lesion o limitacion fisica? | Campo de texto opcional |

---

## Temporizador (stores/timerStore.ts)

El timer es independiente del plan. El usuario puede usarlo libremente desde la tab de timer o iniciarlo desde una sesion del plan activo.

```typescript
// Valores por defecto del temporizador
const DEFAULT_TIMER: TimerConfig = {
  rounds: 3,
  round_duration: 180,    // 3 minutos
  rest_duration: 60,      // 1 minuto
  warning_seconds: 10,    // aviso 10 segundos antes del fin de ronda
};
```

Estados del timer: `idle` | `running` | `resting` | `warning` | `finished`

Al terminar una sesion con el timer, la app ofrece guardar la sesion en el historial de Supabase.

---

## Flujo de navegacion

```
Primera vez
    └── (onboarding)/welcome
            └── (onboarding)/questionnaire
                    └── Agente genera plan → guarda en Supabase
                            └── (tabs)/home

Desde home
    ├── Ver sesion del dia → training/[sessionId]
    │       └── Timer activo → Guardar en historial (Supabase) → home
    ├── Timer libre → (tabs)/timer
    ├── Historial → (tabs)/history
    └── Perfil y regenerar plan → (tabs)/profile
```

---

## Paleta de colores (constants/index.ts)

```typescript
export const COLORS = {
  background: '#0A0A0A',      // Negro profundo
  surface: '#141414',          // Superficie de cards
  border: '#2A2A2A',           // Bordes sutiles
  primary: '#E8C547',          // Amarillo dorado (accion principal)
  primaryDark: '#C4A32E',      // Amarillo oscuro (hover/pressed)
  text: '#F5F5F5',             // Texto principal
  textMuted: '#888888',        // Texto secundario
  success: '#4CAF50',          // Verde (sesion completada)
  warning: '#FF9800',          // Naranja (aviso de tiempo)
  danger: '#F44336',           // Rojo (error o tiempo agotado)
  rest: '#2196F3',             // Azul (periodo de descanso)
};
```

---

## Reglas generales para el agente de desarrollo

1. Leer este archivo completo antes de empezar cualquier tarea.
2. No crear archivos fuera de la estructura de carpetas definida sin justificacion.
3. Cada componente debe tener sus tipos definidos en `types/index.ts` o localmente si son exclusivos del componente.
4. Toda interaccion con Supabase va en `lib/supabase.ts`. No importar el cliente de supabase en componentes o stores directamente.
5. Las llamadas a Groq van exclusivamente en `lib/agent.ts`.

7. No integrar ninguna API de IA de pago. El agente usa Groq.
8. Todos los textos visibles al usuario van en espanol.
9. Al terminar una tarea, indicar que archivos fueron creados o modificados.

---

## Estado actual del proyecto (checklists por tarea)

### 1. Estructura base del proyecto
- [x] Inicializar Expo con blank-typescript template
- [x] Configurar TypeScript estricto con path alias `@/`
- [x] Instalar NativeWind v4 + Tailwind v4 + react-native-css-interop
- [x] Configurar `global.css`, `metro.config.js`, `nativewind-env.d.ts`
- [x] Configurar `app.json` (dark theme, scheme, bundle IDs)
- [x] Crear estructura de carpetas completa

### 2. Expo Router (file-based routing)
- [x] Instalar expo-router y dependencias asociadas
- [x] Configurar `package.json` con `main: "expo-router/entry"`
- [x] Crear root layout `app/_layout.tsx`
- [x] Crear layouts anidados: `(auth)`, `(onboarding)`, `(tabs)`
- [x] Crear `app/index.tsx` como punto de entrada con redirect logic

### 3. Tipos e interfaces (types/index.ts)
- [x] Tipos: Discipline, Goal, Level, Equipment, FitnessLevel, Intensity, TimerStatus
- [x] Interfaces: UserProfile, Exercise, PlanSession, TrainingPlan, Session, NewSession, TimerConfig, QuestionnaireData
- [x] ~~Declaracion para `*.css` modules~~ (no necesaria con NativeWind v4)

### 4. Constantes (constants/index.ts)
- [x] Paleta de colores completa (fondo oscuro, primary dorado)
- [x] Configuracion por defecto del temporizador
- [x] Configuracion de Groq (modelo, API URL)

### 5. Cliente Supabase + helpers (lib/supabase.ts)
- [x] Crear cliente Supabase con AsyncStorage para sesion
- [x] Helper: `getUserProfile()`
- [x] Helper: `saveUserProfile()`
- [x] Helper: `saveSession()`
- [x] Helper: `getSessions()`
- [x] Helper: `saveTrainingPlan()`
- [x] Helper: `getActiveTrainingPlan()`
- [x] Fallback para dev mode (placeholders si no hay .env)

### 6. Stores Zustand
- [x] `userStore`: profile, session, isLoading, isOnboarded, isDevMode, signOut
- [x] `timerStore`: config, status, currentRound, timeLeft, totalTimeLeft
- [x] `trainingStore`: plan, currentSessionIndex, getCurrentSession

### 7. Sistema de Autenticacion
- [x] Pantalla de login con email/password
- [x] Pantalla de registro con email/password
- [x] Modo desarrollo (skip auth) para desarrollo local
- [x] Manejo de sesion via `onAuthStateChange`
- [x] Root layout verifica sesion al inicio (splash screen)
- [x] `app/index.tsx` redirige segun auth + onboarding state
- [x] Cierre de sesion desde pantalla de perfil

### 8. Pantallas de onboarding
- [x] `welcome.tsx`: Pantalla de bienvenida con texto descriptivo
- [x] `questionnaire.tsx`: Stepper de 7 preguntas
- [x] Soporte para modo dev (datos mock) y modo real (Supabase + Groq)
- [x] Plan por defecto si Groq falla
- [x] Campo opcional de lesiones/limitaciones

### 9. Integracion con agente Groq (lib/agent.ts)
- [x] System prompt con instrucciones para generar plan JSON
- [x] Funcion `generateTrainingPlan()` con llamada a `{base_url}/api/chat`
- [x] Limpieza de bloques markdown en respuesta
- [x] Manejo de errores (servidor caido, JSON invalido)

### 10. Tab Home
- [x] Saludo personalizado con nombre del usuario
- [x] Tarjeta de sesion del dia (seleccionada segun dia de la semana)
- [x] Estado vacio si no hay sesion
- [x] Resumen del plan activo
- [x] Recomendaciones del plan
- [x] Pull-to-refresh

### 11. Temporizador
- [x] Pantalla con display de tiempo grande
- [x] Estados: idle, running, resting, warning, finished
- [x] Configuracion de rondas, duracion y descanso (+/-)
- [x] Boton de inicio/detener
- [x] Pantalla de completado con icono
- [x] Iconos Ionicons en configuracion

### 12. Plan de entrenamiento (tabs/training)
- [x] Vista de plan semanal con todas las sesiones
- [x] Badge de intensidad (alta/media/baja)
- [x] Navegacion a detalle de sesion
- [x] Boton para regenerar plan via Groq
- [x] Advertencias del plan

### 13. Vista de sesion activa (training/[sessionId])
- [x] Header con tipo, dia, enfoque
- [x] Info chips (duracion, rondas, intensidad)
- [x] Lista de ejercicios con series, repeticiones, duracion

### 14. Historial de sesiones
- [x] Lista plana de sesiones desde Supabase
- [x] Icono por disciplina
- [x] Rating con estrellas
- [x] Estado vacio con icono
- [x] Pull-to-refresh

### 15. Pantalla de perfil
- [x] Avatar placeholder con iniciales
- [x] Datos del perfil con iconos
- [x] Plan activo (o estado vacio)
- [x] Regenerar plan via Groq
- [x] Reiniciar onboarding con confirmacion
- [x] Cerrar sesion (solo en modo real)

### 16. Mejoras de UI/UX
- [x] Iconos Ionicons en tabs y todas las pantallas
- [x] Pull-to-refresh en home e historial
- [x] Alert de confirmacion para reiniciar onboarding
- [x] Loading states con ActivityIndicator
- [x] Modo desarrollo sin conexion a Supabase

---

### 17. Guardar sesion al terminar timer
- [x] Pantalla post-entrenamiento con rating (1-5 estrellas)
- [x] Campo de notas opcional
- [x] Guardar en Supabase via `saveSession()`
- [x] Estado de guardado exitoso con icono
- [x] Opcion de descartar
- [x] Soporte para modo dev (no llama a Supabase)

### 18. Iniciar timer desde sesion de entrenamiento
- [x] Boton "Iniciar entrenamiento" en `[sessionId].tsx`
- [x] Configura timer con rondas, duracion y descanso de la sesion
- [x] Badge en timer mostrando nombre de la sesion activa
- [x] `startFromSession()` action en timerStore
- [x] Navegacion automatica a la tab de timer

### 19. Cargar plan activo desde Supabase al iniciar
- [x] `getActiveTrainingPlan()` se ejecuta en el root layout
- [x] Plan cargado en trainingStore antes de mostrar la UI

---

### 20. Sistema de diseno y componentes reutilizables
- [x] `components/ui/Button.tsx`: Boton con variantes (primary, secondary, outline, danger, ghost) y tamanos
- [x] `components/ui/Card.tsx`: Tarjeta reutilizable con acento de color opcional
- [x] `components/ui/Badge.tsx`: Badge de estado (intensidad alta/media/baja, info, success, warning)
- [x] `components/ui/ScreenHeader.tsx`: Header consistente para pantallas
- [x] `components/ui/ProgressBar.tsx`: Barra de progreso y StepDots
- [x] `components/ui/EmptyState.tsx`: Estado vacio con icono, texto y accion
- [x] `components/ui/Divider.tsx`: Divisor visual
- [x] `components/timer/TimerDisplay.tsx`: Display grande del temporizador con estados
- [x] `components/timer/TimerConfig.tsx`: Configuracion de rondas/duracion/descanso
- [x] `components/timer/SessionSaveSheet.tsx`: Pantalla de guardado post-entrenamiento
- [x] `components/training/SessionCard.tsx`: Tarjeta de sesion de entrenamiento
- [x] `components/training/ExerciseItem.tsx`: Item de ejercicio con contador
- [x] `components/onboarding/StepIndicator.tsx`: Indicador de progreso del cuestionario
- [x] `components/onboarding/QuestionOption.tsx`: Opcion seleccionable del cuestionario
- [x] `components/onboarding/InjuriesStep.tsx`: Paso de lesiones/limitaciones
- [x] Refactorizar todas las pantallas para usar el sistema de componentes
- [x] Mejorar diseno visual: headers con iconos, cards con acentos, espaciado consistente
- [x] Tipografia numerica monoespaciada en temporizador
- [x] Labels de formularios, iconos de visibilidad de contrasena
- [x] KeyboardAvoidingView en pantallas de auth

---

## Pendiente (requiere accion manual)
- [ ] **Variables de entorno**: Crear archivo `.env` con `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GROQ_API_KEY`
- [ ] **Ejecutar SQL en Supabase**: Crear las tablas `user_profile`, `sessions`, `training_plans` y las políticas RLS
- [ ] **Obtener API key de Groq**: Ir a https://console.groq.com/keys y generar una API key gratuita
- [ ] **Probar en dispositivo**: Ejecutar `npx expo start` y probar en Expo Go
- [ ] **Confirmacion de email**: En Supabase, los usuarios nuevos deben confirmar su email. Se puede desactivar en Authentication > Settings > Disable email confirmation para desarrollo.

---

## Resumen de cambios (sesion inicial)

Se construyó la aplicación completa desde cero. Archivos creados:

**Configuración:** `metro.config.js`, `global.css`, `nativewind-env.d.ts`, `app.json` (actualizado), `tsconfig.json` (actualizado), `package.json` (actualizado)

**Tipos y constantes:** `types/index.ts`, `constants/index.ts`

**Librerías:** `lib/utils.ts`, `lib/supabase.ts`, `lib/agent.ts`

**Stores:** `stores/userStore.ts`, `stores/timerStore.ts`, `stores/trainingStore.ts`

**Componentes UI:** `Button`, `Card`, `Badge`, `ScreenHeader`, `ProgressBar` (+ StepDots), `EmptyState`, `Divider`

**Componentes temporizador:** `TimerDisplay`, `TimerConfig`, `SessionSaveSheet`

**Componentes entrenamiento:** `SessionCard`, `ExerciseItem`

**Componentes onboarding:** `StepIndicator`, `QuestionOption`, `InjuriesStep`

**Pantallas y layouts (Expo Router):**
- Root: `app/_layout.tsx`, `app/index.tsx`
- Auth: `app/(auth)/_layout.tsx`, `login.tsx`, `register.tsx`
- Onboarding: `app/(onboarding)/_layout.tsx`, `welcome.tsx`, `questionnaire.tsx`
- Tabs: `app/(tabs)/_layout.tsx`, `home.tsx`, `timer.tsx`, `training.tsx`, `history.tsx`, `profile.tsx`
- Training: `app/training/[sessionId].tsx`

**Eliminados:** `App.tsx`, `index.ts` (plantillas legacy)

---

---

### 21. Auditoría y corrección de bugs (Junio 2026)
- [x] **BUG CRÍTICO**: `home.tsx` navegación siempre a sesión 0 — `indexOf` con objeto diferente al buscado. Reemplazado por `findIndex` que retorna índice correcto.
- [x] **BUG CRÍTICO**: `app/_layout.tsx` infinite loading — `loadUserData()` sin try/catch. Si `getUserProfile()` lanzaba error, `isLoading` nunca pasaba a `false`.
- [x] **BUG**: `lib/supabase.ts` errores silenciosos — todas las funciones ahora capturan y lanzan `error.message` de Supabase.
- [x] **BUG**: `history.tsx` dependencias faltantes — `useFocusEffect` y `onRefresh` ahora dependen de `session?.user?.id` y `isDevMode`.
- [x] **BUG**: `timer.tsx` faltaba import de `Alert` para manejo de error en guardado.
- [x] **UX**: `SessionSaveSheet` guardaba con `setSaved(true)` inmediato sin esperar respuesta. Ahora espera el `await onSave()`.
- [x] **UX**: `timer.tsx` no mostraba feedback en modo dev. `handleSave` ahora retorna `true` inmediatamente en dev mode.
- [x] **UX**: Tabs migrados de emoji a Ionicons (`home`, `timer`, `fitness`, `bar-chart`, `person`).
- [x] **UX**: `TimerConfig` botones +/- migrados a Ionicons (`remove`, `add`).
- [x] **UX**: Duración del timer ahora usa incrementos de 1 minuto (antes 30s) para evitar decimales.
- [x] **UX**: `home.tsx` eliminado emoji condicional del saludo.
- [x] **UX**: `questionnaire.tsx` eliminado código redundante en `handleAnswer`/`handleNext`.
- [x] **UX**: Tipado fuerte — eliminados `any` en `home.tsx` (getTodaySession) y `questionnaire.tsx` (options map).
- [x] **UX**: `TimerConfig` botones +/- ahora con Ionicons en lugar de texto plano.
- [x] **UX**: `_layout.tsx` cleanup de interval al pausar app (AppState).
- [x] **UX**: `history.tsx` estado de error con opción de reintentar.

### 22. Refactor estético y funcional completo (Junio 2026)
- [x] **FUNCIONAL**: Timer reanuda correctamente al volver de background — store guarda timestamp `pausedAt` y `resumeTimer()` recalcula tiempo transcurrido.
- [x] **FUNCIONAL**: Home pull-to-refresh carga plan desde Supabase realmente.
- [x] **FUNCIONAL**: Questionnaire navegación hacia atrás con botón back + Ionicons.
- [x] **FUNCIONAL**: Session detail botón de volver con `router.back()`.
- [x] **FUNCIONAL**: Auth formularios con validación (email, password length).
- [x] **ESTÉTICO**: Splash animado con logo flame + ActivityIndicator.
- [x] **ESTÉTICO**: Tarjetas con `shadowColor`/`elevation` para profundidad.
- [x] **ESTÉTICO**: Bordes redondeados `rounded-2xl` consistentes en toda la app.
- [x] **ESTÉTICO**: Iconos Ionicons en toda la app (profile, history, welcome, session detail, etc.).
- [x] **ESTÉTICO**: Tipografía con `tracking-tight`, `tracking-wide` para legibilidad.
- [x] **ESTÉTICO**: Estados empty/error con background icon container.
- [x] **ESTÉTICO**: TimerDisplay rediseñado con background tint, barra de progreso, espaciado.
- [x] **ESTÉTICO**: Login/Register con icono flame, labels uppercase.
- [x] **ESTÉTICO**: Colores consistentes (#1E1E1E borders, #666666 muted text, #555555 placeholders).
- [x] **ESTÉTICO**: Barra de progreso horizontal en el StepIndicator (antes dots).
- [x] **ESTÉTICO**: Transition `fade` entre pantallas en root Stack.
- [x] **ESTÉTICO**: Todos los ScrollView con `showsVerticalScrollIndicator={false}`.

### 23. Agente como Asistente Virtual (Junio 2026)
- [x] **FUNCIONAL**: El agente ahora genera planes incluso en modo desarrollo si la API de Gemini está disponible.
- [x] **FUNCIONAL**: Nuevo sistema de "Consejo del Coach" en la pantalla Home que proporciona tips dinámicos en cada refresh.
- [x] **FUNCIONAL**: Helper `getCoachAdvice()` en `lib/agent.ts` para interacciones rápidas con la IA.
- [x] **UX**: Botón de regenerar plan en `training.tsx` ahora muestra errores detallados de conexión con Groq.
- [x] **CONFIG**: Instrucciones añadidas en `constants/index.ts` para configurar la API key de Groq.

### 24. Migracion de Ollama a Gemini API (Junio 2026)
- [x] Reemplazar Ollama por Google Gemini 2.0 Flash como proveedor de IA
- [x] Actualizar `lib/agent.ts` para usar `fetch` directo al endpoint `generateContent` de Gemini
- [x] Actualizar `constants/index.ts` con configuracion de Gemini (modelo, URL)
- [x] Actualizar `.env.local` con `EXPO_PUBLIC_GEMINI_API_KEY`
- [x] Timeout de 15 segundos en peticiones a Gemini
- [x] Fallback a plan por defecto si Gemini falla (sin congelar la app)

### 25. Migracion de Gemini a Groq API (Junio 2026)
- [x] Reemplazar Gemini por Groq como proveedor de IA
- [x] Actualizar `lib/agent.ts` para usar endpoint compatible con OpenAI de Groq
- [x] Actualizar `constants/index.ts` con configuracion de Groq (modelo, URL)
- [x] Actualizar `.env.local` con `EXPO_PUBLIC_GROQ_API_KEY`
- [x] Reintentos con backoff para rate limiting (429)
- [x] Timeout de 20 segundos en peticiones a Groq

### 26. Timer personalizable con minutos+segundos y presets por usuario (Junio 2026)
- [x] `TimerConfig.tsx`: DualConfigItem con minutos y segundos separados para duracion y descanso
- [x] Control fino: minutos en pasos de 1, segundos en pasos de 5
- [x] Configuracion de aviso (warning_seconds) visible en UI
- [x] `timerStore.ts`: TimerPreset ahora incluye `userId` para aislamiento por usuario
- [x] `getPresetsForUser()`: filtra presets del usuario actual + presets del sistema
- [x] Presets del sistema (Boxeo Pro, MMA, Tabata) visibles para todos
- [x] `timer.tsx`: boton "+ GUARDAR ACTUAL" asocia preset al usuario logueado

### 27. Timer tipo intervalos con selector de rueda (Junio 2026)
- [x] `TimerConfig.tsx`: configuracion migrada de botones +/- a filas pulsables estilo interval timer.
- [x] Selector full-screen tipo rueda para trabajo, descanso, rondas y aviso final.
- [x] `timer.tsx`: pantalla idle reorganizada con header, presets, filas de configuracion y tarjeta grande de inicio con total configurado.
- [x] `timer.tsx`: boton de guardado rapido de preset desde header y desde tarjeta de inicio.
- [x] `lib/notifications.ts`: stub `scheduleDailyReminder()` tipado con hora/minuto para mantener TypeScript limpio.

### 28. Onboarding previo a registro y datos por usuario (Junio 2026)
- [x] Flujo inicial actualizado: usuarios sin sesion llegan a bienvenida/encuesta, no directo a login.
- [x] `userStore.ts`: nuevo `pendingOnboarding` persistido con perfil de encuesta y plan generado.
- [x] `questionnaire.tsx`: al finalizar sin sesion real genera rutina, guarda onboarding pendiente y envia a registro.
- [x] `register.tsx`: si Supabase entrega sesion tras registro, guarda perfil y plan inmediatamente bajo el `user_id`.
- [x] `login.tsx`: si hay onboarding pendiente tras confirmar email, lo guarda al iniciar sesion.
- [x] `app/_layout.tsx`: completa onboarding pendiente automaticamente cuando detecta una sesion activa.
- [x] `lib/onboarding.ts`: helper central `completePendingOnboarding()` para guardar perfil, desactivar planes previos y guardar el plan activo.
- [x] Timers guardados siguen aislados por usuario mediante `TimerPreset.userId` y `getPresetsForUser()`.

---

*Ultima actualizacion: Junio 2026*
*Proyecto: Kensei — App de artes marciales*
