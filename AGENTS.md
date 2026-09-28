# AGENTS.md — Kensei

Kensei es una app movil (React Native + Expo) de entrenamiento en artes marciales (boxeo/MMA): temporizador de rondas, planes generados por IA, historial de sesiones y cuestionario de perfil.

Este archivo es la fuente de verdad para agentes. **Actualizalo al terminar cada tarea** (un commit `docs(agents):` accompanyando al de la feature, como en el historial de git).

---

## Comandos

```bash
npm install                # node_modules NO esta en el repo (el checkout actual viene vacio)
npx expo start             # o: npm start / npm run android / npm run ios / npm run web
npx tsc --noEmit           # unica verificacion estatica disponible
npx expo export --platform web      # smoke test del bundle (es el que detecta rompimientos de Metro)
npx expo export --platform android
```

- No hay linter, ni tests, ni CI. No inventes un runner: la verificacion es `tsc --noEmit` + `expo export`. Los `assets/sounds/*.mp3` existen pero el sonido es un **stub** (ver "Gotchas").
- No hay carpetas nativas (`/ios`, `/android` estan gitignored). Cualquier cambio de config nativo exige `npx expo prebuild`; en desarrollo se usa Expo Go.

---

## Estructura y entrypoints

- `main: "expo-router/entry"`. No existe `App.tsx` ni `index.ts` en la raiz: las rutas son archivos en `app/`.
- Alias `@/` apunta a la **raiz del repo** (tsconfig `paths`), no a `src/`. Se usa en todos los imports.
- Layouts: `app/_layout.tsx` (splash + carga de sesion) → grupos `(auth)`, `(onboarding)`, `(tabs)` → `app/training/[sessionId].tsx`.
- Responsabilidades: `lib/supabase.ts` = **todo** el acceso a BD; `lib/agent.ts` = **todo** el acceso a IA; `stores/` = estado global (zustand + `persist` en AsyncStorage); `constants/` = paleta, `DEFAULT_PLAN`, config de IA, cuestionario (`survey.ts`); `types/index.ts` = tipos compartidos.
- Varios deps del `package.json` **no se usan**: `@tanstack/react-query`, `moti`, `expo-linking`, `expo-constants`, `expo-splash-screen`. No los uses como si fueran el patron del proyecto.
- `history.tsx` recarga con `useFocusEffect` (no en mount) para ver las sesiones recien guardadas; hay datos async en las tabs, no solo en el layout.

---

## Setup manual (no esta en el repo)

`.env` (gitignored) con:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_GROQ_API_KEY=...        # proveedor preferido
EXPO_PUBLIC_GEMINI_API_KEY=...      # fallback (opcional)
```

Schema de Supabase (hay que crearlo a mano, no hay migraciones en el repo — `doc/` esta gitignored):

| Tabla | Columnas clave |
|---|---|
| `user_profile` | `user_id UUID UNIQUE` (FK a `auth.users`, `ON DELETE CASCADE`), `name`, `discipline`, `goal`, `level`, `days_per_week`, `equipment`, `fitness_level`, `injuries` — cada campo con `CHECK` sobre los valores de `types/index.ts` |
| `sessions` | `user_id`, `date DATE`, `discipline`, `duration_minutes`, `rounds_completed`, `notes`, `rating` (`CHECK 1..5`), `plan_session_day` |
| `training_plans` | `user_id`, `plan_json JSONB NOT NULL`, `active BOOLEAN`, `generated_at` — indice unico parcial `(user_id) WHERE active` |

RLS: `USING (auth.uid() = user_id)` en las tres. Sin el SQL ejecutado, la app entra en modo dev (ver abajo) sin romper.

---

## Gotchas — esto rompe la app si no lo sabes

### Metro / web
- `metro.config.js` reescribe en plataforma `web` los imports de zustand a su version CommonJS (`zustand`, `zustand/middleware`, `zustand/vanilla`, `zustand/react`). Sin eso, Metro sirve `zustand/esm/middleware.mjs` que usa `import.meta` → **pantalla completamente blanca** en web dev. No borres ese `resolveRequest` ni cambies la forma de importar zustand.
- `tailwind.config.js` solo escanea `./app/**` y `./components/**`: classNames en `lib/`, `stores/`, etc. **no se generan**. `darkMode: "class"` es deliberado (evita el error "Cannot manually set color scheme" de react-native-css-interop); la app no usa variantes `dark:`.
- `global.css` se importa **solo** en `app/_layout.tsx`.
- Si Metro corre con `CI=1` no hay hot reload y sigue sirviendo el bundle viejo del puerto anterior: si un fix "no aparece" en web, matar el proceso del puerto 8081, relanzar `npx expo start --web --port 8081` y recargar sin cache. Esto ya confundo una sesion de diagnostico.

### Supabase / modo dev
- `supabase` en `lib/supabase.ts` es `SupabaseClient | null` (`null` si faltan las env vars). **Todo call site debe hacer null-check**; `null` significa "modo desarrollo".
- Nunca llames al cliente de supabase desde componentes o stores: usá los helpers de `lib/supabase.ts`. Todos reciben `userId` como primer parametro explicito.
- `saveUserProfile` debe usar `upsert(..., { onConflict: 'user_id' })`. Sin `onConflict` el upsert apunta a la PK `id` y tira `duplicate key value violates unique constraint` al re-guardar perfil.
- `isDevMode` se persiste en AsyncStorage y **gana** sobre la sesion real si queda en `true`. Hay que llamar `setDevMode(false)` en cuanto se detecte una sesion de Supabase (ya se hace en `_layout.tsx`, `login.tsx`, `register.tsx`).
- `Alert.alert` es **no-op en React Native Web**: todo error tiene que mostrarse tambien inline (texto rojo) ademas del Alert. Para confirmaciones destructivas usar `confirmAction()` de `lib/utils.ts` (usa `window.confirm` en web).
- `expo-notifications` se carga con **import dinamico** y devuelve `false` en web a proposito. `soundManager.play()` en `lib/notifications.ts` es un stub que solo loguea (Expo Go no tiene el modulo nativo de `expo-av`). No lo invoques en scope de modulo.

### Timer
- La maquina de estados (`idle | running | resting | warning | finished`) y los presets viven en `stores/timerStore.ts`; el **intervalo de 1s vive en la pantalla** `app/(tabs)/timer.tsx`.
- `AppState`: al ir a background se guarda `pausedAt`; al volver `resumeTimer()` recalcula el tiempo transcurrido y `resumeNonce` fuerza la recreacion del intervalo. Si tocás el efecto del intervalo, que dependa de `[status, resumeNonce]`.
- Presets: `userId` por preset, se persisten en `kensei-timer-storage` filtrando `__system__`. Los presets del sistema se inyectan en `getPresetsForUser()`, nunca se persisten ni se borran (`deletePreset` ignora `sys-`).
- Al guardar sesion: `discipline` = `profile.discipline`, `plan_session_day` = `sessionDay` (de `startFromSession(config, sessionName, sessionDay)`). No confundas `sessionSource` (nombre de la sesion) con `sessionDay`.

### Navegacion / onboarding
- `app/index.tsx` es la **unica** autoridad de redirect: dev+onboarded → home; sesion + plan → home; sesion sin perfil/plan → questionnaire; sin sesion → welcome. No hardcodees redirects en otras pantallas.
- `isLoading` (en `userStore`) gatea el splash del root layout: **toda carga asincrona debe garantizar que llega a `false`** (try/catch/finally), o la app queda en splash infinito. `loadUserData()` aborta si la sesion cambio durante el fetch.
- El cuestionario puede completarse **antes** del registro: se guarda `pendingOnboarding` (persistido) y `completePendingOnboarding()` (`lib/onboarding.ts`, single-flight por `userId`) lo vuelca en Supabase desde `_layout.tsx`, `login.tsx` y `register.tsx`. Si tocas ese handshake, revisa los tres call sites.
- Cuestionario adaptativo: `constants/survey.ts` define `QUESTION_LIST`; las ramas se filtran con `getVisibleQuestions(answers)` y `dependsOn` invalida respuestas dependientes al volver atras. `isProfile: true` marca los 7 campos que mapean a `UserProfile`. El paso de lesiones va aparte (`totalSteps = QUESTION_LIST.length + 1`).
- `app/training/[sessionId].tsx`: el `sessionId` de la ruta es el **indice** dentro de `plan.weekly_structure`, no un id.

### IA (`lib/agent.ts`)
- Groq tiene prioridad sobre Gemini segun que env var exista. El modelo esta pineado en `constants/index.ts` (`GROQ_MODEL = 'qwen/qwen3.8-27b'`): `llama-3.3-70b-versatile` devuelve **404** y `openai/gpt-oss-120b` devuelve el contenido en el campo `reasoning` (rompe el parser).
- La salida del LLM es **no confiable**: `parsePlanJson()` repara JSON truncado (llaves sin cerrar, trailing commas) y `sanitizeTrainingPlan()` coerciona cada campo con fallbacks y tira error si `weekly_structure` queda vacia. Si agregas un campo nuevo al plan generado por IA, saneczalo ahi.
- En error de IA **nunca** reemplaces el plan vigente por `DEFAULT_PLAN` en la UI: mostrá el error inline y conservá el plan. (`DEFAULT_PLAN` solo sirve como fallback en la creacion inicial.)

---

## Convenciones

- Textos visibles al usuario en **espanol**; identificadores y comentarios en ingles. Sin emojis en la UI (se usa `@expo/vector-icons` Ionicons en toda la app).
- Estilos con NativeWind (`className`), nunca `StyleSheet.create`. La paleta esta duplicada en `constants/index.ts` (`COLORS`) y en `tailwind.config.js`; el codigo existente usa hex inline tipo `bg-[#141414]`, segui ese estilo.
- Componentes reutilizables en `components/{ui,timer,training,onboarding}/` (`Button`, `Card`, `Badge`, `ScreenHeader`, `ProgressBar`, `EmptyState`, `Divider`); usalos antes de crear uno nuevo.
- Stores: los componentes llaman los hooks de zustand directamente; la persistencia va declarada con `partialize` en cada store.
- TypeScript estricto, sin `any` salvo Justificado.
- Git: commits directos a `master` (sin merges ni PRs en el historial), conventional commits en espanol — `fix(timer): ...`, `feat(reminders): ...`, y `docs(agents): ...` para este archivo.

---

## Pendiente conocido

- `EXPO_PUBLIC_GEMINI_API_KEY` del entorno parece un token OAuth (`AQ.Ab8...`), no una API key `AIza...`: probablemente no funcione como fallback. Regenerala en aistudio.google.com/app/apikey si se quiere usar.
- Email confirmation de Supabase activa: con `signUp` sin sesion hay que mostrar "revisa tu email" y navegar a `/(auth)/login?emailSent=1`. Para desarrollo, desactivar en Authentication > Settings.
- El `soundManager` es un stub: para sonido real hace falta un dev build con `expo-av`.
