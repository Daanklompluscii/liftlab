import type { SetLog, WorkoutLog } from '../types';
import { calculate1RM, getWeightIncrement } from './calculations';
import { db } from './db';

/**
 * Double Progression systeem:
 * - Alle sets op max reps? → Gewicht omhoog
 * - Bron: ACSM Guidelines, Kraemer & Ratamess (2004)
 */

export interface ProgressionAdvice {
  type: 'increase_weight' | 'keep_going' | 'first_time';
  message: string; // Nederlands
  suggestedWeight?: number;
  increment?: number;
}

export function getProgressionAdvice(
  previousSets: SetLog[],
  targetMaxReps: number,
  primaryEquipment: string,
): ProgressionAdvice {
  if (previousSets.length === 0) {
    return {
      type: 'first_time',
      message: 'Eerste keer! Kies een gewicht waarmee je ~' + targetMaxReps + ' reps kunt.',
    };
  }

  const allMaxed = previousSets.every(s => s.reps >= targetMaxReps);
  const lastWeight = previousSets[0]?.weight ?? 0;

  if (allMaxed) {
    const increment = getWeightIncrement(primaryEquipment);
    return {
      type: 'increase_weight',
      message: `↑ Verhoog gewicht (+${increment}kg)`,
      suggestedWeight: lastWeight + increment,
      increment,
    };
  }

  return {
    type: 'keep_going',
    message: 'Probeer meer reps met hetzelfde gewicht.',
  };
}

/**
 * Haal de vorige workout log op voor een specifieke programma workout
 */
export async function getPreviousWorkoutLog(
  programWorkoutId: string
): Promise<WorkoutLog | undefined> {
  const logs = await db.workoutLogs
    .where('programWorkoutId')
    .equals(programWorkoutId)
    .reverse()
    .sortBy('startedAt');

  return logs[0];
}

/**
 * Haal vorige sets op voor een specifieke oefening
 */
export function getPreviousSets(
  previousLog: WorkoutLog | undefined,
  exerciseId: string
): SetLog[] {
  if (!previousLog) return [];
  const exerciseLog = previousLog.exercises.find(e => e.exerciseId === exerciseId);
  return exerciseLog?.sets ?? [];
}

/**
 * Detecteer PR (Personal Record) — hoogste geschat 1RM
 */
export interface PRRecord {
  exerciseId: string;
  estimated1RM: number;
  weight: number;
  reps: number;
  date: Date;
}

export async function checkForPR(
  exerciseId: string,
  newWeight: number,
  newReps: number
): Promise<PRRecord | null> {
  const new1RM = calculate1RM(newWeight, newReps);
  if (new1RM <= 0) return null;

  // Haal alle vorige logs op
  const allLogs = await db.workoutLogs.toArray();
  let best1RM = 0;

  for (const log of allLogs) {
    for (const exerciseLog of log.exercises) {
      if (exerciseLog.exerciseId !== exerciseId) continue;
      for (const set of exerciseLog.sets) {
        const est = calculate1RM(set.weight, set.reps);
        if (est > best1RM) best1RM = est;
      }
    }
  }

  if (new1RM > best1RM) {
    return {
      exerciseId,
      estimated1RM: new1RM,
      weight: newWeight,
      reps: newReps,
      date: new Date(),
    };
  }

  return null;
}
