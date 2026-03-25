import type { Goal, MuscleGroupInfo, MuscleGroup, Split, TrainingDays } from '../types';

// ─── Thema's ───

export type ThemeId = 'steel' | 'neon' | 'fire' | 'nature';

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  description: string;
  accent: string;
  accentHover: string;
  accentMuted: string;
  success: string;
  successMuted: string;
  borderFocus: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'steel',
    label: 'Staal',
    description: 'Industrieel, warm, gym-apparaat',
    accent: '#F59E0B',
    accentHover: '#D97706',
    accentMuted: 'rgba(245, 158, 11, 0.1)',
    success: '#22C55E',
    successMuted: 'rgba(34, 197, 94, 0.15)',
    borderFocus: '#F59E0B',
  },
  {
    id: 'neon',
    label: 'Neon',
    description: 'Tech, data-dashboard, koel',
    accent: '#3B82F6',
    accentHover: '#2563EB',
    accentMuted: 'rgba(59, 130, 246, 0.1)',
    success: '#22C55E',
    successMuted: 'rgba(34, 197, 94, 0.15)',
    borderFocus: '#3B82F6',
  },
  {
    id: 'fire',
    label: 'Vuur',
    description: 'Agressief, intensiteit, powerlifting',
    accent: '#EF4444',
    accentHover: '#DC2626',
    accentMuted: 'rgba(239, 68, 68, 0.1)',
    success: '#22C55E',
    successMuted: 'rgba(34, 197, 94, 0.15)',
    borderFocus: '#EF4444',
  },
  {
    id: 'nature',
    label: 'Natuur',
    description: 'Rustig, outdoor, calisthenics',
    accent: '#10B981',
    accentHover: '#059669',
    accentMuted: 'rgba(16, 185, 129, 0.1)',
    success: '#F59E0B',
    successMuted: 'rgba(245, 158, 11, 0.15)',
    borderFocus: '#10B981',
  },
];

export function getTheme(id: ThemeId): ThemeConfig {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}

/** Apply theme CSS variables to :root */
export function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--color-accent-hover', theme.accentHover);
  root.style.setProperty('--color-accent-muted', theme.accentMuted);
  root.style.setProperty('--color-success', theme.success);
  root.style.setProperty('--color-success-muted', theme.successMuted);
  root.style.setProperty('--color-border-focus', theme.borderFocus);
}

// ─── Spiergr. display (Nederlands) ───

export const MUSCLE_GROUPS: MuscleGroupInfo[] = [
  { id: 'chest', label: 'Borst', labelShort: 'Borst' },
  { id: 'front_delt', label: 'Voorste Deltoïden', labelShort: 'Voorste Delt' },
  { id: 'side_delt', label: 'Zijdeltoïden', labelShort: 'Zijdelt' },
  { id: 'rear_delt', label: 'Achterste Deltoïden', labelShort: 'Achterste Delt' },
  { id: 'upper_back', label: 'Bovenrug', labelShort: 'Bovenrug' },
  { id: 'lats', label: 'Lats', labelShort: 'Lats' },
  { id: 'traps', label: 'Trapezius', labelShort: 'Traps' },
  { id: 'biceps', label: 'Biceps', labelShort: 'Biceps' },
  { id: 'triceps', label: 'Triceps', labelShort: 'Triceps' },
  { id: 'forearms', label: 'Onderarmen', labelShort: 'Onderarmen' },
  { id: 'quads', label: 'Quadriceps', labelShort: 'Quads' },
  { id: 'hamstrings', label: 'Hamstrings', labelShort: 'Hamstrings' },
  { id: 'glutes', label: 'Billen', labelShort: 'Billen' },
  { id: 'calves', label: 'Kuiten', labelShort: 'Kuiten' },
  { id: 'abs', label: 'Buikspieren', labelShort: 'Buik' },
  { id: 'obliques', label: 'Schuine Buikspieren', labelShort: 'Obliques' },
  { id: 'lower_back', label: 'Onderrug', labelShort: 'Onderrug' },
];

export function getMuscleLabel(id: MuscleGroup): string {
  return MUSCLE_GROUPS.find(m => m.id === id)?.label ?? id;
}

// ─── Doel parameters (Bron: Schoenfeld 2017, ACSM 11th ed., Helms 2014) ───

export interface GoalParams {
  repRange: [number, number];
  setsPerMusclePerWeek: [number, number];
  rpeTarget: [number, number];
  restCompound: number;   // seconden
  restIsolation: number;
  tempo: [number, number, number, number];
  label: string;          // Nederlands
  description: string;    // Nederlands
}

export const GOAL_PARAMS: Record<Goal, GoalParams> = {
  strength: {
    repRange: [1, 5],
    setsPerMusclePerWeek: [10, 15],
    rpeTarget: [8, 9.5],
    restCompound: 240,
    restIsolation: 150,
    tempo: [2, 0, 1, 1],
    label: 'Kracht',
    description: 'Maximale kracht opbouwen',
  },
  hypertrophy: {
    repRange: [6, 12],
    setsPerMusclePerWeek: [12, 20],
    rpeTarget: [7, 9],
    restCompound: 150,
    restIsolation: 90,
    tempo: [3, 1, 1, 0],
    label: 'Spiergroei',
    description: 'Maximale spiermassa opbouwen',
  },
  endurance: {
    repRange: [12, 20],
    setsPerMusclePerWeek: [10, 15],
    rpeTarget: [6, 8],
    restCompound: 75,
    restIsolation: 45,
    tempo: [2, 0, 1, 0],
    label: 'Uithoudingsvermogen',
    description: 'Langer volhouden met meer herhalingen',
  },
};

// ─── Split configuratie ───

export interface SplitConfig {
  id: Split;
  label: string;
  description: string;
  daysPerWeek: TrainingDays[];
  recommended: TrainingDays[];
}

export const SPLIT_CONFIGS: SplitConfig[] = [
  {
    id: 'fullbody',
    label: 'Full Body',
    description: 'Alle spiergroepen elke sessie. Ideaal voor beginners of 2-3 dagen/week.',
    daysPerWeek: [2, 3, 4],
    recommended: [2, 3],
  },
  {
    id: 'upper_lower',
    label: 'Boven / Onder',
    description: 'Bovenlichaam en onderlichaam apart. Goede balans van volume en herstel.',
    daysPerWeek: [4],
    recommended: [4],
  },
  {
    id: 'push_pull_legs',
    label: 'Push / Pull / Legs',
    description: 'Push (borst/schouders/triceps), Pull (rug/biceps), Benen. Meest populair.',
    daysPerWeek: [3, 6],
    recommended: [6],
  },
  {
    id: 'bro_split',
    label: 'Bro Split',
    description: 'Eén spiergroep per dag. Onderzoek toont dat 2x/week effectiever is (Schoenfeld 2016).',
    daysPerWeek: [5, 6],
    recommended: [],
  },
];

export function getRecommendedSplit(days: TrainingDays): Split {
  if (days <= 3) return 'fullbody';
  if (days === 4) return 'upper_lower';
  return 'push_pull_legs';
}

// ─── Tier kleuren ───

export const TIER_COLORS: Record<string, string> = {
  'S+': '#F59E0B',
  S: '#EAB308',
  'A+': '#22C55E',
  A: '#22C55E',
  B: '#3B82F6',
  C: '#71717A',
  'C-': '#71717A',
  D: '#EF4444',
  F: '#EF4444',
};

// ─── Progressie stappen (kg) ───
// Bron: praktische norm in krachttraining

export const PROGRESSION_INCREMENTS = {
  barbell: 2.5,
  dumbbell: 2,
  cable: 2.5,
  machine: 2.5,
  bodyweight: 0,
} as const;

// ─── Deload parameters (Bron: Ogasawara 2013) ───

export const DELOAD = {
  afterWeeks: 4,          // stel voor na 4 weken
  maxWeeks: 6,            // max 6 weken zonder deload
  volumeReduction: 0.5,   // 50% minder sets
  rpeTarget: 5.5,
} as const;

// ─── Mesocyclus ───

export const MESOCYCLE = {
  defaultWeeks: 4,
  swapPercentage: 0.35,   // 30-50% oefeningen swappen (Fonseca 2014)
} as const;

// ─── Equipment display (Nederlands) ───

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbells',
  cable: 'Kabelmachine',
  machine: 'Machine',
  smith_machine: 'Smith Machine',
  ez_bar: 'EZ-bar',
  kettlebell: 'Kettlebell',
  pull_up_bar: 'Optrekstang',
  dip_station: 'Dip Station',
  resistance_band: 'Weerstandsband',
  bodyweight: 'Lichaamsgewicht',
  bench_flat: 'Vlakke Bank',
  bench_incline: 'Incline Bank',
  leg_press: 'Leg Press',
  hack_squat: 'Hack Squat Machine',
  pendulum_squat: 'Pendulum Squat Machine',
  lat_pulldown: 'Lat Pulldown Machine',
  pec_deck: 'Pec Deck',
  reverse_pec_deck: 'Reverse Pec Deck',
  leg_curl: 'Leg Curl Machine',
  leg_extension: 'Leg Extension Machine',
  hip_thrust_machine: 'Hip Thrust Machine',
  hip_abduction_machine: 'Hip Abduction Machine',
  back_extension_bench: 'Back Extension Bank',
  preacher_curl_bench: 'Preacher Curl Bank',
};
