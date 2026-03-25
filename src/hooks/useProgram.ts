import { useCallback, useMemo } from 'react';
import { useStore } from '../store';
import { generateProgram, getDeloadWorkouts, reloadProgram } from '../lib/programming';
import { exercises } from '../data/exercises';
import type { UserProfile, ProgramWorkout } from '../types';
import { DELOAD } from '../data/constants';

/**
 * Hook voor programma management: genereren, deload, herladen.
 *
 * Deload logica: originele workouts blijven in program.workouts.
 * Wanneer deloadScheduled === true, retourneert deze hook
 * deload-versies (50% minder sets) via `activeWorkouts`.
 */
export function useProgram() {
  const { activeProgram, setActiveProgram, updateProgram, profile } = useStore();

  const generate = useCallback((userProfile: UserProfile) => {
    const program = generateProgram(userProfile, exercises);
    setActiveProgram(program);
    return program;
  }, [setActiveProgram]);

  const advanceWeek = useCallback(() => {
    if (!activeProgram) return;
    const nextWeek = activeProgram.currentWeek + 1;

    if (nextWeek > DELOAD.afterWeeks && !activeProgram.deloadScheduled) {
      return { needsDeload: true, currentWeek: nextWeek };
    }

    updateProgram({ currentWeek: nextWeek });
    return { needsDeload: false, currentWeek: nextWeek };
  }, [activeProgram, updateProgram]);

  // Toggle deload — workouts blijven intact
  const startDeload = useCallback(() => {
    if (!activeProgram) return;
    updateProgram({ deloadScheduled: true });
  }, [activeProgram, updateProgram]);

  const endDeload = useCallback(() => {
    if (!activeProgram) return;
    updateProgram({ deloadScheduled: false });
  }, [activeProgram, updateProgram]);

  const reload = useCallback(() => {
    if (!activeProgram || !profile) return;
    const reloaded = reloadProgram(activeProgram, exercises, profile);
    setActiveProgram(reloaded);
    return reloaded;
  }, [activeProgram, profile, setActiveProgram]);

  // Deload workouts: 50% minder sets, RPE 5-6 — zonder origineel te wijzigen
  const activeWorkouts: ProgramWorkout[] = useMemo(() => {
    if (!activeProgram) return [];
    if (activeProgram.deloadScheduled) {
      return getDeloadWorkouts(activeProgram);
    }
    return activeProgram.workouts;
  }, [activeProgram]);

  return {
    program: activeProgram,
    /** Workouts aangepast voor deload als die actief is */
    activeWorkouts,
    generate,
    advanceWeek,
    startDeload,
    endDeload,
    reload,
    isDeloadWeek: activeProgram?.deloadScheduled ?? false,
    currentWeek: activeProgram?.currentWeek ?? 0,
    totalWeeks: activeProgram?.weeks ?? 0,
  };
}
