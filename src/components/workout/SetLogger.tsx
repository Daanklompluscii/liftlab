import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trophy } from 'lucide-react';
import type { Exercise, ProgramExercise, SetLog } from '../../types';
import { TierBadge } from '../ui/Badge';

interface SetLoggerProps {
  exercise: Exercise;
  programExercise: ProgramExercise;
  completedSets: SetLog[];
  previousSets: SetLog[];
  onLogSet: (set: Omit<SetLog, 'completedAt'>) => void;
  currentSetNumber: number;
  prExerciseId?: string | null; // Als deze truthy is, toon PR animatie
}

export function SetLogger({
  exercise,
  programExercise,
  completedSets,
  previousSets,
  onLogSet,
  currentSetNumber,
  prExerciseId,
}: SetLoggerProps) {
  const isUnilateral = exercise.isUnilateral;

  // State voor huidige invoer
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [weightLeft, setWeightLeft] = useState('');
  const [weightRight, setWeightRight] = useState('');
  const [repsLeft, setRepsLeft] = useState('');
  const [repsRight, setRepsRight] = useState('');

  const previousSet = previousSets[currentSetNumber - 1];
  const allSetsDone = currentSetNumber > programExercise.sets;

  const ghostText = previousSet
    ? `Vorige: ${previousSet.weight}kg × ${previousSet.reps}`
    : undefined;

  const ghostTextLeft = previousSet?.weightLeft != null
    ? `L: ${previousSet.weightLeft}kg × ${previousSet.repsLeft}`
    : undefined;
  const ghostTextRight = previousSet?.weightRight != null
    ? `R: ${previousSet.weightRight}kg × ${previousSet.repsRight}`
    : undefined;

  const handleLog = () => {
    if (isUnilateral) {
      const wL = parseFloat(weightLeft) || 0;
      const wR = parseFloat(weightRight) || 0;
      const rL = parseInt(repsLeft) || 0;
      const rR = parseInt(repsRight) || 0;
      if ((rL <= 0 && rR <= 0) || (wL <= 0 && wR <= 0)) return;

      onLogSet({
        setNumber: currentSetNumber,
        reps: Math.max(rL, rR),
        weight: Math.max(wL, wR),
        repsLeft: rL,
        repsRight: rR,
        weightLeft: wL,
        weightRight: wR,
      });
      setWeightLeft('');
      setWeightRight('');
      setRepsLeft('');
      setRepsRight('');
    } else {
      const w = parseFloat(weight) || 0;
      const r = parseInt(reps) || 0;
      if (r <= 0 || w < 0) return;

      onLogSet({
        setNumber: currentSetNumber,
        reps: r,
        weight: w,
      });
      setWeight('');
      setReps('');
    }
  };

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4 mb-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <TierBadge tier={exercise.tier} />
        <h3 className="font-semibold text-base flex-1">{exercise.name}</h3>
        <span className="text-xs text-text-muted font-mono">
          {completedSets.length}/{programExercise.sets}
        </span>
      </div>

      {/* Form cues */}
      {exercise.formCues.length > 0 && currentSetNumber === 1 && (
        <div className="mb-3 p-2.5 bg-bg-elevated rounded-lg">
          <ul className="text-xs text-text-secondary space-y-0.5">
            {exercise.formCues.map((cue, i) => (
              <li key={i}>• {cue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Completed sets */}
      {completedSets.length > 0 && (
        <div className="flex flex-col gap-1 mb-3">
          {completedSets.map((set, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check size={14} className="text-success shrink-0" />
              <span className="text-text-muted font-mono">Set {set.setNumber}</span>
              {set.repsLeft != null ? (
                <span className="font-mono text-text-secondary">
                  L: {set.weightLeft}kg×{set.repsLeft} | R: {set.weightRight}kg×{set.repsRight}
                </span>
              ) : (
                <span className="font-mono text-text-secondary">
                  {set.weight}kg × {set.reps}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PR animation */}
      <AnimatePresence>
        {prExerciseId === exercise.id && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-2 p-3 bg-success-muted border border-success/30 rounded-xl mb-3"
          >
            <Trophy size={20} className="text-success" />
            <span className="text-success font-semibold text-sm">Nieuw PR!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input fields */}
      {!allSetsDone && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-text-muted font-medium">
            Set {currentSetNumber} van {programExercise.sets}
            {programExercise.rpe && (
              <span className="ml-2">RPE {programExercise.rpe}</span>
            )}
          </p>

          {isUnilateral ? (
            <>
              {/* Links */}
              <div className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-bold text-accent">L</span>
                <div className="flex-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weightLeft}
                    onChange={e => setWeightLeft(e.target.value)}
                    placeholder={ghostTextLeft ?? 'kg'}
                    className="w-full h-12 px-3 bg-bg-elevated border border-border rounded-xl font-mono text-center text-lg text-text placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
                  />
                </div>
                <span className="text-text-muted text-xs">×</span>
                <div className="w-20">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={repsLeft}
                    onChange={e => setRepsLeft(e.target.value)}
                    placeholder="reps"
                    className="w-full h-12 px-3 bg-bg-elevated border border-border rounded-xl font-mono text-center text-lg text-text placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
                  />
                </div>
              </div>
              {/* Rechts */}
              <div className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-bold text-accent">R</span>
                <div className="flex-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weightRight}
                    onChange={e => setWeightRight(e.target.value)}
                    placeholder={ghostTextRight ?? 'kg'}
                    className="w-full h-12 px-3 bg-bg-elevated border border-border rounded-xl font-mono text-center text-lg text-text placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
                  />
                </div>
                <span className="text-text-muted text-xs">×</span>
                <div className="w-20">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={repsRight}
                    onChange={e => setRepsRight(e.target.value)}
                    placeholder="reps"
                    className="w-full h-12 px-3 bg-bg-elevated border border-border rounded-xl font-mono text-center text-lg text-text placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder={ghostText ?? 'kg'}
                  className="w-full h-12 px-3 bg-bg-elevated border border-border rounded-xl font-mono text-center text-lg text-text placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
                />
              </div>
              <span className="text-text-muted text-xs">×</span>
              <div className="w-24">
                <input
                  type="number"
                  inputMode="numeric"
                  value={reps}
                  onChange={e => setReps(e.target.value)}
                  placeholder="reps"
                  className="w-full h-12 px-3 bg-bg-elevated border border-border rounded-xl font-mono text-center text-lg text-text placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
                />
              </div>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLog}
            className="h-12 bg-accent text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors hover:bg-accent-hover min-h-[48px] cursor-pointer"
          >
            <Check size={18} /> Log Set
          </motion.button>
        </div>
      )}

      {allSetsDone && (
        <div className="text-center py-2 text-success text-sm font-medium">
          ✓ Alle sets voltooid
        </div>
      )}
    </div>
  );
}
