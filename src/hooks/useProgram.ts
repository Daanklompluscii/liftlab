import { useCallback } from 'react';
import { useStore } from '../store';
import { generateProgram, generateDeloadWeek, reloadProgram } from '../lib/programming';
import { exercises } from '../data/exercises';
import type { UserProfile } from '../types';
import { DELOAD } from '../data/constants';

/**
 * Hook voor programma management: genereren, deload, herladen
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

    // Check voor deload
    if (nextWeek > DELOAD.afterWeeks && !activeProgram.deloadScheduled) {
      return { needsDeload: true, currentWeek: nextWeek };
    }

    updateProgram({ currentWeek: nextWeek });
    return { needsDeload: false, currentWeek: nextWeek };
  }, [activeProgram, updateProgram]);

  const startDeload = useCallback(() => {
    if (!activeProgram) return;
    const deload = generateDeloadWeek(activeProgram);
    setActiveProgram(deload);
  }, [activeProgram, setActiveProgram]);

  const reload = useCallback(() => {
    if (!activeProgram || !profile) return;
    const reloaded = reloadProgram(activeProgram, exercises, profile);
    setActiveProgram(reloaded);
    return reloaded;
  }, [activeProgram, profile, setActiveProgram]);

  return {
    program: activeProgram,
    generate,
    advanceWeek,
    startDeload,
    reload,
    isDeloadWeek: activeProgram?.deloadScheduled ?? false,
    currentWeek: activeProgram?.currentWeek ?? 0,
    totalWeeks: activeProgram?.weeks ?? 0,
  };
}
