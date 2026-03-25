// ─── Enums & Union Types ───

export type MuscleGroup =
  | 'chest' | 'front_delt' | 'side_delt' | 'rear_delt'
  | 'upper_back' | 'lats' | 'traps'
  | 'biceps' | 'triceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves'
  | 'abs' | 'obliques' | 'lower_back';

export type Equipment =
  | 'barbell' | 'dumbbell' | 'cable' | 'machine'
  | 'smith_machine' | 'ez_bar' | 'kettlebell'
  | 'pull_up_bar' | 'dip_station' | 'resistance_band'
  | 'bodyweight' | 'bench_flat' | 'bench_incline'
  | 'leg_press' | 'hack_squat' | 'pendulum_squat'
  | 'lat_pulldown' | 'pec_deck' | 'reverse_pec_deck'
  | 'leg_curl' | 'leg_extension'
  | 'hip_thrust_machine' | 'hip_abduction_machine'
  | 'back_extension_bench' | 'preacher_curl_bench';

export type MovementPattern =
  | 'horizontal_push' | 'horizontal_pull'
  | 'vertical_push' | 'vertical_pull'
  | 'hip_hinge' | 'squat' | 'lunge'
  | 'curl' | 'extension' | 'lateral_raise'
  | 'fly' | 'abduction' | 'kickback' | 'pullover';

export type Split = 'fullbody' | 'upper_lower' | 'push_pull_legs' | 'bro_split';

export type Tier = 'S+' | 'S' | 'A+' | 'A' | 'B' | 'C' | 'C-' | 'D' | 'F';

export type Goal = 'strength' | 'hypertrophy' | 'endurance';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

// ─── Core Data Models ───

export interface Exercise {
  id: string;
  name: string;                    // Engels (gym-standaard)
  tier: Tier;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  category: 'compound' | 'isolation';
  equipment: Equipment[];
  movementPattern: MovementPattern;
  isUnilateral: boolean;
  defaultRestSeconds: number;
  formCues: string[];              // Nederlands
}

export interface UserProfile {
  id: string;
  name: string;
  goal: Goal;
  trainingDaysPerWeek: 2 | 3 | 4 | 5 | 6;
  split: Split;
  availableEquipment: Equipment[];
  excludedExercises: string[];
  experienceLevel: ExperienceLevel;
  createdAt: Date;
}

export interface Program {
  id: string;
  userId: string;
  name: string;
  goal: Goal;
  split: Split;
  weeks: number;
  workouts: ProgramWorkout[];
  currentWeek: number;
  createdAt: Date;
  deloadScheduled: boolean;
}

export interface ProgramWorkout {
  id: string;
  programId: string;
  dayLabel: string;
  dayOfWeek?: number;
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
  exerciseId: string;
  order: number;
  sets: number;
  repRange: [number, number];
  rpe?: number;
  tempoSeconds?: [number, number, number, number]; // [excentrisch, pauze_onder, concentrisch, pauze_boven]
  restSeconds: number;
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  programWorkoutId: string;
  startedAt: Date;
  completedAt?: Date;
  exercises: ExerciseLog[];
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
}

export interface SetLog {
  setNumber: number;
  reps: number;
  weight: number;                // kg
  rpe?: number;
  repsLeft?: number;
  repsRight?: number;
  weightLeft?: number;
  weightRight?: number;
  completedAt: Date;
}

// ─── UI/Helper Types ───

export interface TimerState {
  isRunning: boolean;
  secondsLeft: number;
  totalSeconds: number;
}

export type TrainingDays = 2 | 3 | 4 | 5 | 6;

/** Muscle group display info (Nederlands) */
export interface MuscleGroupInfo {
  id: MuscleGroup;
  label: string;        // Nederlands
  labelShort: string;   // Korte versie
}
