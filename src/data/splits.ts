import type { MuscleGroup, Split } from '../types';

/**
 * Defines which muscle groups are trained on each day for each split type.
 * Bron: standaard sportwetenschap split-opbouw
 */

export interface SplitDay {
  label: string;
  muscles: MuscleGroup[];
}

export type SplitTemplate = Record<string, SplitDay[]>;

// ─── Full Body (2-4 dagen/week) ───
// Per sessie: 1 compound push + 1 compound pull + 1 compound benen + 2-3 isolatie
// Variaties roteren per sessie

const fullbodyA: SplitDay = {
  label: 'Full Body A',
  muscles: ['chest', 'lats', 'quads', 'side_delt', 'biceps', 'calves'],
};
const fullbodyB: SplitDay = {
  label: 'Full Body B',
  muscles: ['upper_back', 'front_delt', 'hamstrings', 'glutes', 'triceps', 'abs'],
};
const fullbodyC: SplitDay = {
  label: 'Full Body C',
  muscles: ['chest', 'lats', 'quads', 'rear_delt', 'biceps', 'calves'],
};
const fullbodyD: SplitDay = {
  label: 'Full Body D',
  muscles: ['upper_back', 'side_delt', 'glutes', 'hamstrings', 'triceps', 'abs'],
};

// ─── Upper/Lower (4 dagen/week) ───
// Boven: horizontale push + verticale push + horizontale pull + verticale pull + armen
// Onder: squat + hip hinge + single-leg + kuiten + core

const upperA: SplitDay = {
  label: 'Boven A',
  muscles: ['chest', 'upper_back', 'lats', 'front_delt', 'side_delt', 'biceps', 'triceps'],
};
const upperB: SplitDay = {
  label: 'Boven B',
  muscles: ['chest', 'upper_back', 'lats', 'rear_delt', 'side_delt', 'biceps', 'triceps'],
};
const lowerA: SplitDay = {
  label: 'Onder A',
  muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'],
};
const lowerB: SplitDay = {
  label: 'Onder B',
  muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'],
};

// ─── Push/Pull/Legs (3 of 6 dagen/week) ───
// Push: borst + voorste/zijdeltoïden + triceps
// Pull: rug + achterste deltoïden + biceps
// Legs: quads + hamstrings + billen + kuiten

const push: SplitDay = {
  label: 'Push',
  muscles: ['chest', 'front_delt', 'side_delt', 'triceps'],
};
const pull: SplitDay = {
  label: 'Pull',
  muscles: ['upper_back', 'lats', 'rear_delt', 'biceps'],
};
const legs: SplitDay = {
  label: 'Legs',
  muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'],
};

// ─── Bro Split (5-6 dagen/week) ───

const broChest: SplitDay = { label: 'Borst', muscles: ['chest'] };
const broBack: SplitDay = { label: 'Rug', muscles: ['upper_back', 'lats', 'rear_delt'] };
const broShoulders: SplitDay = { label: 'Schouders', muscles: ['front_delt', 'side_delt', 'rear_delt'] };
const broLegs: SplitDay = { label: 'Benen', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] };
const broArms: SplitDay = { label: 'Armen', muscles: ['biceps', 'triceps', 'forearms'] };
const broAbs: SplitDay = { label: 'Armen & Core', muscles: ['biceps', 'triceps', 'forearms', 'abs'] };

// ─── Split Templates per dagen/week ───

export function getSplitDays(split: Split, daysPerWeek: number): SplitDay[] {
  switch (split) {
    case 'fullbody':
      if (daysPerWeek === 2) return [fullbodyA, fullbodyB];
      if (daysPerWeek === 3) return [fullbodyA, fullbodyB, fullbodyC];
      return [fullbodyA, fullbodyB, fullbodyC, fullbodyD];

    case 'upper_lower':
      return [upperA, lowerA, upperB, lowerB];

    case 'push_pull_legs':
      if (daysPerWeek === 3) return [push, pull, legs];
      // 6 dagen = 2x per week
      return [push, pull, legs, push, pull, legs];

    case 'bro_split':
      if (daysPerWeek === 5) return [broChest, broBack, broShoulders, broLegs, broArms];
      return [broChest, broBack, broShoulders, broLegs, broArms, broAbs];

    default:
      return [fullbodyA, fullbodyB, fullbodyC];
  }
}
