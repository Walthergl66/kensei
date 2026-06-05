import { GROQ_API_KEY, GROQ_MODEL, GROQ_API_URL } from '@/constants';
import { UserProfile, TrainingPlan } from '@/types';

const TIMEOUT_MS = 20000;
const MAX_RETRIES = 3;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithTimeout = (url: string, options: RequestInit, timeout: number = TIMEOUT_MS) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

const callGroq = async (systemPrompt: string, userMessage: string): Promise<string> => {
  if (!GROQ_API_KEY) {
    throw new Error('API key de Groq no configurada. Agrega EXPO_PUBLIC_GROQ_API_KEY en .env.local');
  }

  const response = await fetchWithTimeout(GROQ_API_URL, {
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

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Groq devolvio una respuesta vacia');
  }

  return text.trim();
};

const callGroqWithRetry = async (systemPrompt: string, userMessage: string): Promise<string> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callGroq(systemPrompt, userMessage);
    } catch (error: any) {
      lastError = error;

      if (error.message?.includes('(429') || error.message?.includes('(503')) {
        if (attempt < MAX_RETRIES) {
          const delay = 1000 * Math.pow(2, attempt);
          console.warn(`Groq rate limited, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`);
          await sleep(delay);
          continue;
        }
      }

      break;
    }
  }

  throw lastError || new Error('Groq call failed after retries');
};

const getSystemPrompt = (profile: UserProfile) => `
Eres Kensei, un Head Coach de élite en deportes de contacto (Boxeo y MMA). Tu misión es diseñar periodizaciones tácticas y físicas ultra-personalizadas. No generes planes genéricos. Cada bit del JSON debe responder al perfil del atleta.

CONTEXTO DEL ATLETA:
- Disciplina: ${profile.discipline} (Enfócate 100% en las mecánicas de esta disciplina).
- Nivel: ${profile.level} (Ajusta complejidad de combinaciones y volumen).
- Objetivo: ${profile.goal}.
- Disponibilidad: ${profile.days_per_week} días/semana.
- Condición Física: ${profile.fitness_level}.
- Lesiones: ${profile.injuries || 'Ninguna'}.

ESTRUCTURA DE RESPUESTA (JSON):
{
  "plan_name": "Nombre creativo y motivador",
  "duration_weeks": 4,
  "sessions_per_week": ${profile.days_per_week},
  "weekly_structure": [
    {
      "day": "Día de la semana",
      "session_type": "Enfoque técnico (ej: Power Striking, Grappling Defense)",
      "duration_minutes": number,
      "rounds": number,
      "round_duration_seconds": number,
      "rest_seconds": number,
      "exercises": [
        {
          "name": "Nombre técnico",
          "description": "Explicación breve de la ejecución",
          "duration_seconds": number,
          "sets": number,
          "reps": number | null
        }
      ],
      "focus": "Objetivo técnico de la sesión",
      "intensity": "low" | "medium" | "high"
    }
  ],
  "recommendations": ["Consejos pro de nutrición/recuperación"],
  "warnings": ["Alertas de seguridad basadas en lesiones o nivel"]
}

REGLAS DE ORO:
1. PERSONALIZACIÓN RADICAL: Si el nivel es 'beginner', los rounds deben ser de menor intensidad y mayor enfoque en base. Si es 'advanced', incluye combinaciones de 4-5 golpes y trabajo de contraataque.
2. ADAPTACIÓN A LESIONES: Si hay lesiones (ej: 'hombro'), PROHIBE ejercicios de impacto en esa zona y sustituye por movilidad.
3. DISTRIBUCIÓN: Reparte los ${profile.days_per_week} días de forma lógica (ej: Lunes, Miércoles, Viernes para 3 días).
4. RIGOR TÉCNICO: Usa terminología real (Jab, Cross, Sprawl, Clinch, etc).
5. RESPUESTA: UNICAMENTE el JSON. Sin preámbulos.`;

export async function getCoachAdvice(profile: UserProfile): Promise<string> {
  const systemPrompt = `Eres Kensei, Head Coach de boxeo y MMA. Da un consejo corto (máximo 2 frases) y motivador basado en el perfil del usuario. Sé directo y usa terminología de combate.`;
  const userMessage = `Perfil: ${profile.discipline}, nivel ${profile.level}, objetivo ${profile.goal}.`;

  try {
    return await callGroqWithRetry(systemPrompt, userMessage);
  } catch (error) {
    console.warn('Advice failed:', error);
    return 'Domina lo básico antes de buscar lo complejo. ¡A entrenar!';
  }
}

export async function generateTrainingPlan(profile: UserProfile): Promise<TrainingPlan> {
  const userMessage = `
    Genera un plan de entrenamiento para este usuario:
    - Nombre: ${profile.name}
    - Disciplina: ${profile.discipline}
    - Objetivo: ${profile.goal}
    - Nivel: ${profile.level}
    - Dias disponibles por semana: ${profile.days_per_week}
    - Equipamiento disponible: ${profile.equipment}
    - Condicion fisica actual: ${profile.fitness_level}
    - Lesiones o limitaciones: ${profile.injuries ?? 'Ninguna'}
  `;

  const raw = await callGroqWithRetry(getSystemPrompt(profile), userMessage);

  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as TrainingPlan;
  } catch {
    throw new Error('Groq devolvio una respuesta invalida. Intenta de nuevo.');
  }
}
