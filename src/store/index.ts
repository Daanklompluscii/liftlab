import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile, Program, WorkoutLog } from '../types';
import { db } from '../lib/db';
import { type ThemeId, getTheme, applyTheme } from '../data/constants';

interface AppState {
  // ─── User Profile ───
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;

  // ─── Active Program ───
  activeProgram: Program | null;
  setActiveProgram: (program: Program) => void;
  updateProgram: (updates: Partial<Program>) => void;

  // ─── Active Workout ───
  activeWorkout: WorkoutLog | null;
  setActiveWorkout: (workout: WorkoutLog | null) => void;
  updateActiveWorkout: (workout: WorkoutLog) => void;

  // ─── Onboarding ───
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;

  // ─── Timer ───
  timerSeconds: number;
  timerRunning: boolean;
  timerTotal: number;
  startTimer: (seconds: number) => void;
  tickTimer: () => void;
  stopTimer: () => void;
  adjustTimer: (delta: number) => void;

  // ─── Settings ───
  unit: 'kg' | 'lbs';
  setUnit: (unit: 'kg' | 'lbs') => void;
  timerSoundEnabled: boolean;
  setTimerSoundEnabled: (enabled: boolean) => void;
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;

  // ─── Data Loading ───
  loadProfile: () => Promise<void>;
  loadActiveProgram: () => Promise<void>;
  loadWorkoutLogs: () => Promise<WorkoutLog[]>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ─── User Profile ───
      profile: null,
      setProfile: async (profile) => {
        await db.userProfiles.put(profile);
        set({ profile });
      },
      updateProfile: async (updates) => {
        const current = get().profile;
        if (!current) return;
        const updated = { ...current, ...updates };
        await db.userProfiles.put(updated);
        set({ profile: updated });
      },

      // ─── Active Program ───
      activeProgram: null,
      setActiveProgram: async (program) => {
        await db.programs.put(program);
        set({ activeProgram: program });
      },
      updateProgram: async (updates) => {
        const current = get().activeProgram;
        if (!current) return;
        const updated = { ...current, ...updates };
        await db.programs.put(updated);
        set({ activeProgram: updated });
      },

      // ─── Active Workout ───
      activeWorkout: null,
      setActiveWorkout: (workout) => set({ activeWorkout: workout }),
      updateActiveWorkout: async (workout) => {
        await db.workoutLogs.put(workout);
        set({ activeWorkout: workout });
      },

      // ─── Onboarding ───
      onboardingComplete: false,
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),

      // ─── Timer ───
      timerSeconds: 0,
      timerRunning: false,
      timerTotal: 0,
      startTimer: (seconds) => set({ timerSeconds: seconds, timerTotal: seconds, timerRunning: true }),
      tickTimer: () => {
        const { timerSeconds, timerRunning } = get();
        if (!timerRunning || timerSeconds <= 0) {
          set({ timerRunning: false });
          return;
        }
        set({ timerSeconds: timerSeconds - 1 });
      },
      stopTimer: () => set({ timerRunning: false, timerSeconds: 0 }),
      adjustTimer: (delta) => {
        const { timerSeconds } = get();
        const newSeconds = Math.max(0, timerSeconds + delta);
        set({ timerSeconds: newSeconds, timerTotal: Math.max(get().timerTotal, newSeconds) });
      },

      // ─── Settings ───
      unit: 'kg',
      setUnit: (unit) => set({ unit }),
      timerSoundEnabled: true,
      setTimerSoundEnabled: (enabled) => set({ timerSoundEnabled: enabled }),
      theme: 'steel' as ThemeId,
      setTheme: (theme) => {
        applyTheme(getTheme(theme));
        set({ theme });
      },

      // ─── Data Loading ───
      loadProfile: async () => {
        const profiles = await db.userProfiles.toArray();
        if (profiles.length > 0) {
          set({ profile: profiles[0], onboardingComplete: true });
        }
      },
      loadActiveProgram: async () => {
        const programs = await db.programs.orderBy('createdAt').reverse().toArray();
        if (programs.length > 0) {
          set({ activeProgram: programs[0] });
        }
      },
      loadWorkoutLogs: async () => {
        return db.workoutLogs.orderBy('startedAt').reverse().toArray();
      },
    }),
    {
      name: 'liftlab-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        unit: state.unit,
        timerSoundEnabled: state.timerSoundEnabled,
        theme: state.theme,
      }),
    }
  )
);
