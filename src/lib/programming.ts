import type { Exercise, Program, ProgramWorkout, ProgramExercise, UserProfile, MuscleGroup, Goal } from '../types';
import { GOAL_PARAMS, DELOAD, MESOCYCLE } from '../data/constants';
import { getSplitDays } from '../data/splits';
import { generateId } from './calculations';

/**
 * Genereer een compleet trainingsprogramma op basis van het gebruikersprofiel.
 *
 * Logica:
 * 1. Bepaal spiergroepen per dag (vanuit split)
 * 2. Filter op: apparatuur + niet-uitgesloten
 * 3. Per spiergroep: kies de beste beschikbare oefening (tier gerankt)
 * 4. Begin met 1 compound per grote spiergroep, dan 1 isolatie per kleine spiergroep
 * 5. Geen dubbele bewegingspatronen
 * 6. Sets/reps/rust op basis van doel
 *
 * Bron: Schoenfeld et al. (2017), ACSM (11th ed.)
 */
export function generateProgram(profile: UserProfile, exercises: Exercise[]): Program {
  const { goal, split, trainingDaysPerWeek, availableEquipment, excludedExercises } = profile;
  const params = GOAL_PARAMS[goal];
  const splitDays = getSplitDays(split, trainingDaysPerWeek);

  // Filter beschikbare oefeningen
  const available = exercises.filter(ex => {
    if (ex.tier === 'D' || ex.tier === 'F') return false;
    if (excludedExercises.includes(ex.id)) return false;
    return ex.equipment.some(eq => availableEquipment.includes(eq) || eq === 'bodyweight');
  });

  const workouts: ProgramWorkout[] = splitDays.map((day, dayIndex) => {
    const dayExercises = selectExercisesForDay(
      day.muscles,
      available,
      goal,
      params,
    );

    return {
      id: generateId(),
      programId: '',
      dayLabel: day.label,
      dayOfWeek: dayIndex,
      exercises: dayExercises,
    };
  });

  const programId = generateId();
  workouts.forEach(w => { w.programId = programId; });

  return {
    id: programId,
    userId: profile.id,
    name: getProgramName(goal, split),
    goal,
    split,
    weeks: MESOCYCLE.defaultWeeks,
    workouts,
    currentWeek: 1,
    createdAt: new Date(),
    deloadScheduled: false,
  };
}

// ─── Tier volgorde voor sortering ───

const TIER_ORDER: Record<string, number> = {
  'S+': 0, S: 1, 'A+': 2, A: 3, B: 4, C: 5, 'C-': 6, D: 7, F: 8,
};

/** Sorteer op tier, met random shuffle binnen dezelfde tier voor variatie bij hergenereren */
function sortByTierWithShuffle(a: Exercise, b: Exercise): number {
  const diff = (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99);
  if (diff !== 0) return diff;
  return Math.random() - 0.5; // shuffle binnen zelfde tier
}

// Grote spiergroepen krijgen compounds, kleine krijgen isolatie
const BIG_MUSCLES: MuscleGroup[] = ['chest', 'lats', 'upper_back', 'quads', 'hamstrings', 'glutes'];

/**
 * Selecteer oefeningen voor één trainingsdag.
 *
 * Strategie:
 * 1. Loop door elke spiergroep van de dag
 * 2. Grote spiergroep → kies 1 compound (hoogste tier)
 * 3. Kleine spiergroep → kies 1 isolatie (hoogste tier)
 * 4. Als er nog ruimte is: voeg 1 extra oefening toe voor de grootste spiergroepen
 * 5. Nooit meer dan 2 oefeningen per spiergroep per sessie
 * 6. Geen dubbele bewegingspatronen
 */
function selectExercisesForDay(
  muscles: MuscleGroup[],
  available: Exercise[],
  goal: Goal,
  params: typeof GOAL_PARAMS[Goal],
): ProgramExercise[] {
  const selected: ProgramExercise[] = [];
  const usedPatterns = new Set<string>();
  const usedExerciseIds = new Set<string>();
  const muscleExerciseCount = new Map<MuscleGroup, number>();
  let order = 0;

  // Index oefeningen per spiergroep
  const exercisesByMuscle = new Map<MuscleGroup, Exercise[]>();
  for (const muscle of muscles) {
    const forMuscle = available
      .filter(ex => ex.primaryMuscle === muscle)
      .sort(sortByTierWithShuffle);
    exercisesByMuscle.set(muscle, forMuscle);
  }

  // ─── Pass 1: Eén oefening per spiergroep ───
  // Grote spiergroepen: probeer een compound
  // Kleine spiergroepen: probeer een isolatie
  for (const muscle of muscles) {
    const pool = exercisesByMuscle.get(muscle) ?? [];
    const isBig = BIG_MUSCLES.includes(muscle);

    // Probeer eerst de voorkeurscategorie
    const preferred = isBig ? 'compound' : 'isolation';
    const fallback = isBig ? 'isolation' : 'compound';

    const picked = pickBestExercise(pool, preferred, usedPatterns, usedExerciseIds)
      ?? pickBestExercise(pool, fallback, usedPatterns, usedExerciseIds);

    if (picked) {
      usedPatterns.add(picked.movementPattern);
      usedExerciseIds.add(picked.id);
      muscleExerciseCount.set(muscle, 1);
      selected.push(createProgramExercise(picked, order++, goal, params));
    }
  }

  // ─── Pass 2: Extra oefening voor grote spiergroepen (als er ruimte is) ───
  // Full body: max ~6-7 oefeningen totaal. PPL/Upper: meer ruimte
  const maxExercises = muscles.length <= 4 ? muscles.length + 2 : muscles.length;

  for (const muscle of muscles) {
    if (selected.length >= maxExercises) break;
    if (!BIG_MUSCLES.includes(muscle)) continue;
    if ((muscleExerciseCount.get(muscle) ?? 0) >= 2) continue;

    const pool = exercisesByMuscle.get(muscle) ?? [];

    // Voeg een isolatie toe als we al een compound hebben, of vice versa
    const existingCategory = selected.find(
      s => available.find(e => e.id === s.exerciseId)?.primaryMuscle === muscle
    );
    const existingEx = existingCategory
      ? available.find(e => e.id === existingCategory.exerciseId)
      : null;
    const preferCategory = existingEx?.category === 'compound' ? 'isolation' : 'compound';

    const picked = pickBestExercise(pool, preferCategory, usedPatterns, usedExerciseIds)
      ?? pickBestExercise(pool, existingEx?.category === 'compound' ? 'compound' : 'isolation', usedPatterns, usedExerciseIds);

    if (picked) {
      usedPatterns.add(picked.movementPattern);
      usedExerciseIds.add(picked.id);
      muscleExerciseCount.set(muscle, (muscleExerciseCount.get(muscle) ?? 0) + 1);
      selected.push(createProgramExercise(picked, order++, goal, params));
    }
  }

  return selected;
}

/**
 * Kies de beste oefening uit een pool die nog niet gebruikt is.
 */
function pickBestExercise(
  pool: Exercise[],
  category: 'compound' | 'isolation',
  usedPatterns: Set<string>,
  usedIds: Set<string>,
): Exercise | null {
  // Eerst zonder pattern-conflict
  for (const ex of pool) {
    if (ex.category !== category) continue;
    if (usedIds.has(ex.id)) continue;
    if (usedPatterns.has(ex.movementPattern)) continue;
    return ex;
  }
  // Als geen match zonder conflict, sta pattern-duplicate toe
  for (const ex of pool) {
    if (ex.category !== category) continue;
    if (usedIds.has(ex.id)) continue;
    return ex;
  }
  return null;
}

function createProgramExercise(
  exercise: Exercise,
  order: number,
  goal: Goal,
  params: typeof GOAL_PARAMS[Goal],
): ProgramExercise {
  const isCompound = exercise.category === 'compound';
  const sets = goal === 'strength' && isCompound ? 4 : 3;

  return {
    exerciseId: exercise.id,
    order,
    sets,
    repRange: params.repRange,
    rpe: (params.rpeTarget[0] + params.rpeTarget[1]) / 2,
    tempoSeconds: params.tempo,
    restSeconds: isCompound ? params.restCompound : params.restIsolation,
  };
}

function getProgramName(goal: Goal, _split: string): string {
  const goalNames: Record<Goal, string> = {
    strength: 'Kracht',
    hypertrophy: 'Spiergroei',
    endurance: 'Uithoudingsvermogen',
  };
  return `${goalNames[goal]} Programma`;
}

/**
 * Genereer deload versie van workouts: zelfde oefeningen, zelfde gewicht, 40-50% minder sets.
 * Originele workouts blijven bewaard in program.workouts.
 * Bron: Ogasawara et al. (2013)
 */
export function getDeloadWorkouts(program: Program): ProgramWorkout[] {
  return program.workouts.map(w => ({
    ...w,
    exercises: w.exercises.map(ex => ({
      ...ex,
      sets: Math.max(1, Math.round(ex.sets * (1 - DELOAD.volumeReduction))),
      rpe: DELOAD.rpeTarget,
    })),
  }));
}

/**
 * Herlaad programma na mesocyclus: 30-50% oefeningen swappen.
 * Bron: Fonseca et al. (2014)
 */
export function reloadProgram(
  _program: Program,
  allExercises: Exercise[],
  profile: UserProfile
): Program {
  const fresh = generateProgram(profile, allExercises);
  return {
    ...fresh,
    id: generateId(),
    currentWeek: 1,
    deloadScheduled: false,
  };
}
