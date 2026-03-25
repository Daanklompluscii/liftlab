import { useCallback } from 'react';
import type { WorkoutLog, SetLog, ProgramWorkout } from '../types';
import { useStore } from '../store';
import { db } from '../lib/db';
import { generateId } from '../lib/calculations';
import { checkForPR, type PRRecord } from '../lib/progression';

/**
 * Hook voor actieve workout tracking.
 * Elke set direct opslaan — geen dataverlies bij crash.
 */
export function useWorkout() {
  const { activeWorkout, setActiveWorkout } = useStore();

  const startWorkout = useCallback(async (programWorkout: ProgramWorkout) => {
    const workout: WorkoutLog = {
      id: generateId(),
      programWorkoutId: programWorkout.id,
      startedAt: new Date(),
      exercises: programWorkout.exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        sets: [],
      })),
    };
    await db.workoutLogs.put(workout);
    setActiveWorkout(workout);
    return workout;
  }, [setActiveWorkout]);

  const logSet = useCallback(async (
    exerciseId: string,
    set: Omit<SetLog, 'completedAt'>
  ): Promise<PRRecord | null> => {
    if (!activeWorkout) return null;

    const completedSet: SetLog = {
      ...set,
      completedAt: new Date(),
    };

    const updatedExercises = activeWorkout.exercises.map(ex => {
      if (ex.exerciseId !== exerciseId) return ex;
      return {
        ...ex,
        sets: [...ex.sets, completedSet],
      };
    });

    const updated: WorkoutLog = {
      ...activeWorkout,
      exercises: updatedExercises,
    };

    // Direct opslaan in IndexedDB
    await db.workoutLogs.put(updated);
    setActiveWorkout(updated);

    // Check voor PR
    const pr = await checkForPR(exerciseId, set.weight, set.reps);
    return pr;
  }, [activeWorkout, setActiveWorkout]);

  const completeWorkout = useCallback(async () => {
    if (!activeWorkout) return;

    const completed: WorkoutLog = {
      ...activeWorkout,
      completedAt: new Date(),
    };

    await db.workoutLogs.put(completed);
    setActiveWorkout(null);
    return completed;
  }, [activeWorkout, setActiveWorkout]);

  const cancelWorkout = useCallback(() => {
    setActiveWorkout(null);
  }, [setActiveWorkout]);

  return {
    activeWorkout,
    startWorkout,
    logSet,
    completeWorkout,
    cancelWorkout,
    isActive: activeWorkout !== null,
  };
}
