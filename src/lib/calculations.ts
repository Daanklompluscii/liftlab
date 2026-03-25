/**
 * Bereken geschat 1RM via Epley formule
 * Bron: Epley (1985)
 * 1RM = gewicht × (1 + reps / 30)
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Bereken volume load: sets × reps × gewicht
 */
export function calculateVolumeLoad(sets: { reps: number; weight: number }[]): number {
  return sets.reduce((total, set) => total + set.reps * set.weight, 0);
}

/**
 * Formatteer seconden naar mm:ss
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formatteer gewicht met eenheid
 */
export function formatWeight(weight: number, unit: 'kg' | 'lbs' = 'kg'): string {
  if (unit === 'lbs') {
    return `${Math.round(weight * 2.20462 * 10) / 10} lbs`;
  }
  return `${weight} kg`;
}

/**
 * Converteer kg naar lbs
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

/**
 * Converteer lbs naar kg
 */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs / 2.20462 * 10) / 10;
}

/**
 * Bepaal of alle sets de max reps hebben bereikt (double progression)
 * Bron: ACSM Guidelines, Kraemer & Ratamess (2004)
 */
export function shouldIncreaseWeight(
  completedReps: number[],
  targetMaxReps: number
): boolean {
  return completedReps.length > 0 && completedReps.every(r => r >= targetMaxReps);
}

/**
 * Bereken gewichtsverhoging
 */
export function getWeightIncrement(equipment: string): number {
  switch (equipment) {
    case 'barbell':
    case 'smith_machine':
    case 'ez_bar':
      return 2.5;
    case 'dumbbell':
    case 'kettlebell':
      return 2;
    default:
      return 2.5;
  }
}

/**
 * Genereer een uniek ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Formatteer datum in Nederlands
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}
