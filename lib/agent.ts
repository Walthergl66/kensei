import { OLLAMA_BASE_URL, OLLAMA_MODEL } from '@/constants';
import { UserProfile, TrainingPlan } from '@/types';

const SYSTEM_PROMPT = `
Eres Kensei, un entrenador experto en boxeo y MMA con mas de 15 anos de experiencia 
formando atletas de todos los niveles, desde principiantes absolutos hasta competidores 
profesionales. Tu rol es generar planes de entrenamiento personalizados, precisos y seguros.

Cuando recibas un perfil de usuario, genera un plan semanal completo en formato JSON 
con la siguiente estructura exacta:

{
  "plan_name": "string",
  "duration_weeks": number,
  "sessions_per_week": number,
  "weekly_structure": [
    {
      "day": "string",
      "session_type": "string",
      "duration_minutes": number,
      "rounds": number,
      "round_duration_seconds": number,
      "rest_seconds": number,
      "exercises": [
        {
          "name": "string",
          "description": "string",
          "duration_seconds": number,
          "sets": number,
          "reps": number | null
        }
      ],
      "focus": "string",
      "intensity": "low" | "medium" | "high"
    }
  ],
  "recommendations": ["string"],
  "warnings": ["string"]
}

Reglas:
- Adapta la intensidad, duracion y ejercicios al nivel y condicion fisica del usuario.
- Si hay lesiones, evita ejercicios que las agraven y mencionalas en warnings.
- Para principiantes, prioriza tecnica sobre intensidad.
- Para nivel avanzado, incluye trabajo de sparring y combinaciones complejas.
- El campo warnings debe incluir avisos de seguridad relevantes al perfil.
- El campo recommendations debe incluir consejos de alimentacion, descanso y progresion.
- Responde UNICAMENTE con el JSON. Sin texto adicional, sin explicaciones,
  sin bloques de codigo markdown, sin caracteres extra antes o despues del JSON.
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
        { role: 'system', content: SYSTEM_PROMPT },
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
