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
| IA / Agente | Groq o Gemini (API gratuitas, intercambiables via `.env`) |
| SDK Supabase | `@supabase/supabase-js` |

### Reglas del stack

- Usar TypeScript en todos los archivos. No usar `any` salvo casos excepcionales documentados.
- No instalar librerias fuera del stack definido sin justificacion explicita en un comentario.
- Todos los estilos van con NativeWind. No usar `StyleSheet.create` salvo animaciones nativas.
- Toda interaccion con la base de datos va a traves del cliente de Supabase, nunca con queries directas.
- El agente de IA usa Groq o Gemini (APIs gratuitas, elegidas segun `.env`). No integrar ninguna API de pago sin confirmacion explicita.

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
│   ├── agent.ts                     # Logica de llamada a Groq/Gemini
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

## Agente de recomendaciones (lib/agent.ts) — Groq o Gemini

Kensei soporta dos proveedores de IA gratuitos e intercambiables. Se elige en tiempo de ejecucion segun las variables de entorno (`.env`):

- Si existe `EXPO_PUBLIC_GROQ_API_KEY`, usa **Groq** (`llama-3.3-70b-versatile`, endpoint compatible con OpenAI, lista en [console.groq.com](https://console.groq.com/)).
- Si no hay Groq pero existe `EXPO_PUBLIC_GEMINI_API_KEY`, usa **Gemini 2.0 Flash** (`generateContent`, key en [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)).
- Si ninguna esta configurada, `getActiveProvider()` lanza un error claro y la app cae al `DEFAULT_PLAN` sin congelarse.

Ambos llamados comparten timeout de 20 segundos y reintentos con backoff ante rate limit (429/503).

### Configuracion

```typescript
// constants/index.ts
export const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
export const GEMINI_MODEL = 'gemini-2.0-flash';
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
```

```bash
# .env.local
EXPO_PUBLIC_GROQ_API_KEY=tu-api-key-aqui
```

La API key se obtiene gratis en https://console.groq.com/keys

### Implementacion (lib/agent.ts)

`callLLMWithRetry()` elige el proveedor activo con `getActiveProvider()` y delega en `callGroq()` (endpoint compatible con OpenAI, autenticacion Bearer) o `callGemini()` (endpoint `generateContent`). Ambos con `fetch` directo, sin SDK extra.

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

El timeout de las peticiones es de 20 segundos con reintentos automaticos (429/503 con backoff). Si el proveedor no responde (API key invalida, sin internet, etc), la app cae al plan por defecto sin congelarse.

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
5. Las llamadas al agente de IA van exclusivamente en `lib/agent.ts`. No importar constantes de API en componentes o stores directamente.

7. No integrar ninguna API de IA de pago. El agente usa Groq o Gemini.
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

### 29. Correccion de tab "Mis timers" (Junio 2026)
- [x] `TimerConfig.tsx`: el selector `Nuevo timer / Mis timers` ahora recibe estado y callbacks desde `timer.tsx`.
- [x] `timer.tsx`: nueva vista real de `Mis timers` con tarjetas verticales para cargar presets guardados.
- [x] `timer.tsx`: al guardar un preset se cambia automaticamente a `Mis timers`.
- [x] `timerStore.ts`: `getPresetsForUser()` inyecta presets del sistema aunque AsyncStorage tenga una version persistida antigua.
- [x] `timerStore.ts`: presets del sistema no se persisten ni se eliminan desde `deletePreset()`.

### 30. Soporto dual de IA: Groq o Gemini (Septiembre 2026)
- [x] `lib/agent.ts`: soporta dos proveedores de IA intercambiables segun las variables de entorno.
- [x] `getActiveProvider()`: si `EXPO_PUBLIC_GROQ_API_KEY` esta presente usa Groq; si no y esta `EXPO_PUBLIC_GEMINI_API_KEY`, usa Gemini; si ninguna, tira error claro y la app cae a DEFAULT_PLAN.
- [x] `callGemini()`: llamada a `generateContent` de Gemini 2.0 Flash con el mismo timeout/retry de Groq.
- [x] Reintentos con backoff compartidos: el chequeo `isRetryableStatus()` detecta 429/503 de ambos proveedores.
- [x] Validacion minima de la respuesta del LLM en `generateTrainingPlan()`: si falta `weekly_structure` o viene vacia, se rechaza y se usa el plan por defecto (antes se confiaba a ciegas en el JSON).
- [x] `constants/index.ts`: anade `GEMINI_API_KEY`, `GEMINI_MODEL` y `GEMINI_API_URL`.
- [x] `.env`: variables `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GROQ_API_KEY`, `EXPO_PUBLIC_GEMINI_API_KEY`.
- [x] `.gitignore`: ahora ignora el archivo plano `.env` (antes solo `.env*.local`), evitando filtrar claves.

### 31. Downgrade a Expo SDK 54 (Septiembre 2026)
- [x] `package.json`: `expo` de `~55.0.26` a `~54.0.37`.
- [x] Dependencias alineadas al SDK 54 via `npx expo install --fix`: `react@19.1.0`, `react-dom@19.1.0`, `react-native@0.81.5`, `expo-router@~6.0.24`, `babel-preset-expo@~54.0.10`, `expo-linking@~8.0.12`, `react-native-reanimated@~4.1.1`, `react-native-gesture-handler@~2.28.0`, `react-native-screens@~4.16.0`.
- [x] Instalacion limpia (`rm -rf node_modules package-lock.json`) para resolver conflicto de peer deps con `react-server-dom-webpack` de SDK 55.
- [x] Peer deps faltantes instaladas: `expo-font`, `expo-constants`, `react-native-worklets` (detectadas por `expo-doctor`).
- [x] `expo-doctor`: 18/18 checks pasados. `expo router` instalado tambien con su config plugin (`expo-font`).
- [x] Verificado: `tsc --noEmit` sin errores y bundle Android de produccion compila (4.8MB).

### 32. Fix pantalla blanca en web (import.meta + color scheme)
- [x] **BUG CRITICO**: Web dev mostraba pantalla completamente blanca. Causa raiz: `zustand/esm/middleware.mjs` usa `import.meta.env` (middleware devtools), y Metro dev sirve el bundle web como script clasico (`defer`, sin `type=module`) → `Uncaught SyntaxError: Cannot use 'import.meta' outside a module`. Solo afectaba a web dev (produccion lo minifica correctamente y Android resuelve el .mjs igualmente pero Metro en native usa la version CJS via la condicion `react-native`).
- [x] `metro.config.js`: `config.resolver.resolveRequest` redirige en web (`platform === "web"`) los imports de zustand a las versiones CommonJS de la raiz: `zustand` → `index.js`, `zustand/middleware` → `middleware.js`, `zustand/vanilla` → `vanilla.js`, `zustand/react` → `react.js`. Estas son las que NO usan `import.meta`. Verificado: el bundle dev web ya no contiene `import.meta.env`.
- [x] *Ojo*: no existen los submodulos `.mjs` individuales de `zustand/middleware` (solo `.d.mts`), por eso no se pudo evitar el bundle completo con un import por subpath; `persist`/`createJSONStorage` viven en el mismo `middleware.mjs` que `devtools`.
- [x] **BUG menor**: consola web lanzaba `Cannot manually set color scheme, as dark mode is type 'media'` (de `react-native-css-interop`/NativeWind cargando la stylesheet con flag `darkMode: media`). `tailwind.config.js` ahora declara `darkMode: "class"` (la app no usa variantes `dark:`, el diseno no cambia) y el error desaparece.
- [x] Verificado con Edge headless (`--dump-dom`): sin errores en consola y el DOM renderiza la pantalla de bienvenida (Kensei / "Comenzar encuesta").
- [x] Para desarrollo web local: lanzar `npx expo start --web` (quitar `CI=1` para hot reload). F5 limpio (Ctrl+Shift+R) si Metro no detecta cambios.

### 33. Fix modo desarrollo persistiendo tras iniciar sesion real (Septiembre 2026)
- [x] **BUG**: el boton "Modo desarrollo (sin conexion)" aparecia siempre al final del login. `isDevMode` se persiste en AsyncStorage y tenia prioridad sobre la sesion, asi que si se activaba una vez, la app seguia en modo desarrollo aunque el usuario entrara con su cuenta real (store en `stores/userStore.ts`).
- [x] `login.tsx`: al iniciar sesion con exito (`data.session?.user`) se llama `setDevMode(false)`. El enlace de modo desarrollo ahora solo se muestra si `__DEV__` (builds de desarrollo) y con icono de bug para que se vea como boton (texto: "Entrar en modo desarrollo (sin conexion)").
- [x] `register.tsx`: al obtener sesion tras el registro tambien se llama `setDevMode(false)`.
- [x] `app/_layout.tsx`: `loadUserData()` resetea `setDevMode(false)` siempre que haya usuario autenticado, cubriendo cualquier estado persistido anterior.
- [x] **BUG**: login exitoso sin `pendingOnboarding` no navegaba a ningun lado — el usuario se quedaba en la pantalla de login ("no me deja iniciar sesion"). `login.tsx` ahora, tras `signInWithPassword` exitoso: consulta `getUserProfile()`/`getActiveTrainingPlan()`, navega a `(tabs)/home` si hay perfil, o a `(onboarding)/welcome` si no (incluye el caso de SQL de Supabase sin ejecutar, que lanza error y se trata como sin perfil).
- [x] **BUG WEB**: `Alert.alert` es un no-op en React Native Web (`static alert() {}` en `react-native-web/dist/exports/Alert/index.js`), asi que los errores de login se tragaban en silencio en el navegador. `login.tsx` ahora muestra el error inline en rojo en la pantalla (ademas del Alert para native) y lo limpia al escribir.
- [x] **BUG**: `saveUserProfile()` usaba `upsert` sin `onConflict`, por defecto apuntaba a la PK `id`; como la unicidad real es `user_id` (constraint `user_profile_user_id_key`), al guardar el perfil de un usuario que ya tenia fila rompia con `duplicate key value violates unique constraint`. Ahora usa `upsert({...}, { onConflict: 'user_id' })`.
- [x] **BUG WEB**: `register.tsx` tambien dependia de `Alert.alert` (no-op en web); ahora muestra el error inline en rojo igual que el login.

### 34. Auditoria completa y correccion de bugs (Septiembre 2026)
- [x] **Google Gemini key**: formato `AQ.Ab8...` (parece token OAuth, no API key `AIza...`) — probablemente no funcione como fallback. La app usa Groq (`qwen/qwen3.8-27b`); si se quiere fallback a Gemini, regenerar una key real en aistudio.google.com/app/apikey.

**Modelo de Groq**: `llama-3.3-70b-versatile` YA NO EXISTE en la API de Groq (404). Probados via API real: `openai/gpt-oss-120b` devuelve el contenido en el campo `reasoning` (rompe el parser), `qwen/qwen3.8-27b` devuelve `content` normal → modelo activo en `constants/index.ts` (`GROQ_MODEL`).

**Commits de esta sesion (9):** `e524e57` (Groq qwen + pointerEvents + single-flight onboarding), `844a72e`, `beb2a79`, `ce3840d`, `7004766`, `64d8c26`, `1a9c273`, `23fecdb`.

- [x] **CRITICO** `app/(tabs)/timer.tsx`: el timer se congelaba al volver de background. El intervalo se limpiaba en background pero nunca se recreaba (el efecto dependia solo de `status`). Ahora hay `resumeNonce` que fuerza la recreacion del intervalo al reanudar.
- [x] **CRITICO** `components/timer/SessionSaveSheet.tsx`: el estado "saved" no tenia boton de salida — el usuario quedaba atrapado en la pantalla final. Se anade boton "Listo" que llama `onDiscard` (reinicia el timer y cierra el panel).
- [x] **ALTO** `app/(tabs)/training.tsx`: si la IA fallaba, `setPlan(DEFAULT_PLAN)` destruia el plan activo del usuario. Ahora el plan vigente se conserva y el error se muestra inline (visibles en web tambien).
- [x] **ALTO** `stores/userStore.ts` + `stores/trainingStore.ts`: el modo desarrollo perdia perfil y plan al reiniciar la app porque no se persistian. Ahora `profile` y `plan` se guardan en AsyncStorage (en modo real se sobreescriben al cargar desde Supabase).
- [x] **ALTO** `app/_layout.tsx`: `getSession()` sin try/catch podia dejar el splash infinito. `onAuthStateChange` ahora salta el evento `INITIAL_SESSION` (getSession ya carga los datos → se evitaban peticiones duplicadas). `loadUserData()` aborta si la sesion cambio durante las peticiones (race con signOut) y limpia un perfil persistido obsoleto cuando el servidor no devuelve perfil.
- [x] **ALTO** datos de sesion guardada: `discipline` guardaba `sessionSource` (nombre del tipo de sesion) y `plan_session_day` el tipo, corrompiendo el historial. `timerStore` ahora guarda `sessionDay` (via `startFromSession(config, sessionName, sessionDay)`); el timer usa `profile?.discipline || 'boxing'` para `discipline` y `sessionDay` para `plan_session_day`.
- [x] **ALTO** `lib/agent.ts`: validacion profunda del JSON del LLM (`sanitizeTrainingPlan`). Antes solo se comprobaba `weekly_structure` no vacio. Ahora se sanitizan todos los campos (nombres, numeros, intensidad, ejercicios) con fallbacks seguros; si no queda ninguna sesion valida se lanza error claro. Parser mas robusto ante campos `number | null`, tipos erroneos, sesiones/ejercicios malformados.
- [x] **MEDIO** `lib/notifications.ts` + `app/(tabs)/profile.tsx`: los recordatorios eran un stub que siempre devolvia `false` → el switch nunca podia activarse. Ahora `expo-notifications` programa una notificacion diaria real via **import dinamico** (en web devuelve `false` para no romper el bundle web). El toggle muestra error inline (web) o Alert (native) si no hay permiso.
- [x] **MEDIO** `lib/utils.ts` (`confirmAction`): `Alert.alert` es no-op en web, asi que "Reiniciar onboarding" (profile) y "Eliminar timer" (timer) no hacian nada en el navegador. `confirmAction()` usa `window.confirm` en web y `Alert.alert` en native.
- [x] **BAJO** `app/(auth)/register.tsx`: el rate limit 429 de Supabase en signup muestra ahora un mensaje claro ("espera unos minutos") en lugar del texto tecnico.
- [x] **BAJO** `lib/onboarding.ts`: single-flight de `completePendingOnboarding` indexado por `userId` (antes una promesa global compartida).
- [x] **BAJO** `app/(onboarding)/questionnaire.tsx`: ramas redundantes en `handleAnswer`/`handleNext` (los dos lados hacian lo mismo).
- [x] **BAJO** `app/(tabs)/history.tsx`: `MOCK_SESSIONS` con fechas relativas (antes fechas fijas de junio que quedaban antiguas).
- [x] **BAJO** `app/(tabs)/home.tsx`: estados vacios con emojis reemplazados por Ionicons (`fitness-outline`, `clipboard-outline`).

**Verificacion**: `npx tsc --noEmit` sin errores; `expo export --platform web` compila (bundle sin `import.meta`; el fix de zustand CJS sigue vigente); `expo export --platform android` compila (bundle 4.99MB).

**Pendiente en Supabase**: el usuario `diag.kensei.1789693270@proton.me` fue creado durante el diagnostico del login — borrarlo desde Authentication > Users. La confirmacion de email sigue activa (`mailer_autoconfirm: false`); para desarrollo se puede desactivar en Authentication > Settings > Disable email confirmation.

### 35. Fix registro con confirmacion de email y aviso de bundle viejo (Septiembre 2026)
- [x] **BUG** `app/(auth)/register.tsx`: con la confirmacion de email activa, `signUp` no devuelve sesion y el `else` no hacia nada — el boton "Crear cuenta" quedaba congelado en `loading`. Ahora si no hay sesion: muestra "revisa tu email" (inline, visible en web) y navega a `/(auth)/login?emailSent=1`.
- [x] **UX** `app/(auth)/login.tsx`: si viene de registrar con `emailSent=1` muestra un aviso dorado "cuenta creada, confirma tu correo" (usando `useLocalSearchParams`). Se limpia al escribir o al intentar login.
- [x] **NOTA** El usuario reportó errores que ya estaban corregidos (404 de Groq con `llama-3.3-70b-versatile`, 409 repetidos en `user_profile`, warning de `pointerEvents`). Causa: **Metro en modo CI no tiene hot reload** y seguia sirviendo el bundle viejo del puerto 8081. Solucion: `taskkill //PID <pid>` del proceso en 8081 y relanzar `npx expo start --web --port 8081`. Verificado con Edge headless: la web arranca, renderiza la pantalla de bienvenida y sin `Cannot use 'import.meta'` (los `import.meta` restantes en el bundle son solo comentarios de Expo y la guarda `typeof`).

---

*Ultima actualizacion: Septiembre 2026*
*Proyecto: Kensei — App de artes marciales*
