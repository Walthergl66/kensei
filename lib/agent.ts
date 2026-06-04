import { OLLAMA_BASE_URL, OLLAMA_MODEL } from '@/constants';
import { UserProfile, TrainingPlan } from '@/types';

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
5. RESPUESTA: UNICAMENTE el JSON. Sin preámbulos.
`;

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

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [
        { role: 'system', content: getSystemPrompt(profile) },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama no esta disponible. Verifica que el servidor este corriendo en ${OLLAMA_BASE_URL}`);
  }

  const data = await response.json();
  const raw: string = data?.message?.content ?? '';

  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as TrainingPlan;
  } catch {
    throw new Error('El agente devolvio una respuesta invalida. Intenta de nuevo.');
  }
}
