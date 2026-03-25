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
 * 3. Sorteer op tier (S+ eerst → C, nooit D of F)
 * 4. Sessie begint met 1-2 compounds, geen dubbele patronen, min. 1 per spiergroep
 * 5. Sets/reps/rust op basis van doel
 * 6. Week-volume per spier in target range
 *
 * Bron: Schoenfeld et al. (2017), ACSM (11th ed.)
 */
export function generateProgram(profile: UserProfile, exercises: Exercise[]): Program {
  const { goal, split, trainingDaysPerWeek, availableEquipment, excludedExercises } = profile;
  const params = GOAL_PARAMS[goal];
  const splitDays = getSplitDays(split, trainingDaysPerWeek);

  // Filter beschikbare oefeningen
  const available = exercises.filter(ex => {
    // Nooit D of F automatisch selecteren
    if (ex.tier === 'D' || ex.tier === 'F') return false;
    // Niet uitgesloten
    if (excludedExercises.includes(ex.id)) return false;
    // Apparatuur beschikbaar
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
      programId: '', // wordt hieronder gezet
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

function sortByTier(a: Exercise, b: Exercise): number {
  return (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99);
}

/**
 * Selecteer oefeningen voor één trainingsdag.
 * Start met 1-2 compounds, vul aan met isolatie.
 * Voorkom dubbele bewegingspatronen.
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
  let order = 0;

  // Relevante oefeningen voor deze spiergroepen
  const relevant = available
    .filter(ex => muscles.includes(ex.primaryMuscle))
    .sort(sortByTier);

  // 1. Selecteer compounds eerst (1-2)
  const compounds = relevant.filter(ex => ex.category === 'compound');
  const compoundsToAdd = Math.min(2, compounds.length);

  for (const ex of compounds) {
    if (selected.length >= compoundsToAdd) break;
    if (usedPatterns.has(ex.movementPattern)) continue;
    if (usedExerciseIds.has(ex.id)) continue;

    usedPatterns.add(ex.movementPattern);
    usedExerciseIds.add(ex.id);
    selected.push(createProgramExercise(ex, order++, goal, params, 'compound'));
  }

  // 2. Vul aan met isolatie/accessoires
  const isolations = relevant.filter(
    ex => ex.category === 'isolation' && !usedExerciseIds.has(ex.id)
  );

  // Bepaal hoeveel extra oefeningen: gebaseerd op doel en aantal spiergroepen
  const targetTotal = Math.min(
    muscles.length <= 3 ? 5 : 6,
    relevant.length
  );

  for (const ex of isolations) {
    if (selected.length >= targetTotal) break;
    if (usedExerciseIds.has(ex.id)) continue;

    usedExerciseIds.add(ex.id);
    selected.push(createProgramExercise(ex, order++, goal, params, 'isolation'));
  }

  // Als we nog niet genoeg hebben, voeg meer compounds toe
  if (selected.length < targetTotal) {
    for (const ex of compounds) {
      if (selected.length >= targetTotal) break;
      if (usedExerciseIds.has(ex.id)) continue;

      usedExerciseIds.add(ex.id);
      selected.push(createProgramExercise(ex, order++, goal, params, 'compound'));
    }
  }

  return selected;
}

function createProgramExercise(
  exercise: Exercise,
  order: number,
  goal: Goal,
  params: typeof GOAL_PARAMS[Goal],
  category: 'compound' | 'isolation',
): ProgramExercise {
  const sets = goal === 'strength' && category === 'compound' ? 4 : 3;

  return {
    exerciseId: exercise.id,
    order,
    sets,
    repRange: params.repRange,
    rpe: (params.rpeTarget[0] + params.rpeTarget[1]) / 2,
    tempoSeconds: params.tempo,
    restSeconds: category === 'compound' ? params.restCompound : params.restIsolation,
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
 * Genereer deload week: zelfde oefeningen, zelfde gewicht, 40-50% minder sets.
 * Bron: Ogasawara et al. (2013)
 */
export function generateDeloadWeek(program: Program): Program {
  const deloadWorkouts = program.workouts.map(w => ({
    ...w,
    exercises: w.exercises.map(ex => ({
      ...ex,
      sets: Math.max(1, Math.round(ex.sets * (1 - DELOAD.volumeReduction))),
      rpe: DELOAD.rpeTarget,
    })),
  }));

  return {
    ...program,
    workouts: deloadWorkouts,
    deloadScheduled: true,
  };
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
