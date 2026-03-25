import { useState, useEffect } from 'react';
import type { WorkoutLog } from '../types';
import { db } from '../lib/db';
import { calculate1RM } from '../lib/calculations';

export interface ExerciseProgress {
  exerciseId: string;
  data: { date: string; estimated1RM: number; weight: number; reps: number }[];
}

export interface MuscleVolumeData {
  muscle: string;
  sets: number;
}

/**
 * Hook voor voortgangsdata en grafieken
 */
export function useProgress() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const allLogs = await db.workoutLogs
        .orderBy('startedAt')
        .toArray();
      setLogs(allLogs);
      setLoading(false);
    }
    load();
  }, []);

  /** 1RM progressie per oefening */
  function get1RMProgress(exerciseId: string): ExerciseProgress {
    const data: ExerciseProgress['data'] = [];

    for (const log of logs) {
      for (const exLog of log.exercises) {
        if (exLog.exerciseId !== exerciseId) continue;
        let bestSet = { weight: 0, reps: 0, e1rm: 0 };
        for (const set of exLog.sets) {
          const e1rm = calculate1RM(set.weight, set.reps);
          if (e1rm > bestSet.e1rm) {
            bestSet = { weight: set.weight, reps: set.reps, e1rm };
          }
        }
        if (bestSet.e1rm > 0) {
          data.push({
            date: new Date(log.startedAt).toISOString().split('T')[0],
            estimated1RM: bestSet.e1rm,
            weight: bestSet.weight,
            reps: bestSet.reps,
          });
        }
      }
    }

    return { exerciseId, data };
  }

  /** Totale sets per spiergroep (deze week) */
  function getWeeklyVolume(exerciseMap: Map<string, string>): MuscleVolumeData[] {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const volumeMap = new Map<string, number>();

    for (const log of logs) {
      if (new Date(log.startedAt) < weekAgo) continue;
      for (const exLog of log.exercises) {
        const muscle = exerciseMap.get(exLog.exerciseId);
        if (!muscle) continue;
        const current = volumeMap.get(muscle) ?? 0;
        volumeMap.set(muscle, current + exLog.sets.length);
      }
    }

    return Array.from(volumeMap.entries()).map(([muscle, sets]) => ({ muscle, sets }));
  }

  /** Heatmap data: trainingen per dag */
  function getHeatmapData(): Map<string, number> {
    const heatmap = new Map<string, number>();
    for (const log of logs) {
      const dateKey = new Date(log.startedAt).toISOString().split('T')[0];
      heatmap.set(dateKey, (heatmap.get(dateKey) ?? 0) + 1);
    }
    return heatmap;
  }

  /** Alle PR's */
  function getAllPRs(_exerciseMap: Map<string, string>): {
    exerciseId: string;
    estimated1RM: number;
    weight: number;
    reps: number;
    date: Date;
  }[] {
    const bestByExercise = new Map<string, { estimated1RM: number; weight: number; reps: number; date: Date }>();

    for (const log of logs) {
      for (const exLog of log.exercises) {
        for (const set of exLog.sets) {
          const e1rm = calculate1RM(set.weight, set.reps);
          const current = bestByExercise.get(exLog.exerciseId);
          if (!current || e1rm > current.estimated1RM) {
            bestByExercise.set(exLog.exerciseId, {
              estimated1RM: e1rm,
              weight: set.weight,
              reps: set.reps,
              date: new Date(log.startedAt),
            });
          }
        }
      }
    }

    return Array.from(bestByExercise.entries()).map(([exerciseId, data]) => ({
      exerciseId,
      ...data,
    }));
  }

  return {
    logs,
    loading,
    get1RMProgress,
    getWeeklyVolume,
    getHeatmapData,
    getAllPRs,
    totalWorkouts: logs.filter(l => l.completedAt).length,
  };
}
