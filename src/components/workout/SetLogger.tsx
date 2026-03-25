import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trophy, Pencil, Trash2, X } from 'lucide-react';
import type { Exercise, ProgramExercise, SetLog } from '../../types';
import { TierBadge } from '../ui/Badge';

interface SetLoggerProps {
  exercise: Exercise;
  programExercise: ProgramExercise;
  completedSets: SetLog[];
  previousSets: SetLog[];
  onLogSet: (set: Omit<SetLog, 'completedAt'>) => void;
  onEditSet?: (setIndex: number, set: Omit<SetLog, 'completedAt'>) => void;
  onDeleteSet?: (setIndex: number) => void;
  currentSetNumber: number;
  prExerciseId?: string | null;
}

export function SetLogger({
  exercise,
  programExercise,
  completedSets,
  previousSets,
  onLogSet,
  onEditSet,
  onDeleteSet,
  currentSetNumber,
  prExerciseId,
}: SetLoggerProps) {
  const isUnilateral = exercise.isUnilateral;

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [weightLeft, setWeightLeft] = useState('');
  const [weightRight, setWeightRight] = useState('');
  const [repsLeft, setRepsLeft] = useState('');
  const [repsRight, setRepsRight] = useState('');

  // Edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editWeightLeft, setEditWeightLeft] = useState('');
  const [editWeightRight, setEditWeightRight] = useState('');
  const [editRepsLeft, setEditRepsLeft] = useState('');
  const [editRepsRight, setEditRepsRight] = useState('');

  const previousSet = previousSets[currentSetNumber - 1];
  const allSetsDone = currentSetNumber > programExercise.sets;

  const ghostText = previousSet
    ? `Vorige: ${previousSet.weight}kg × ${previousSet.reps}`
    : undefined;

  const ghostTextLeft = previousSet?.weightLeft != null
    ? `L: ${previousSet.weightLeft}×${previousSet.repsLeft}`
    : undefined;
  const ghostTextRight = previousSet?.weightRight != null
    ? `R: ${previousSet.weightRight}×${previousSet.repsRight}`
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
        repsLeft: rL, repsRight: rR,
        weightLeft: wL, weightRight: wR,
      });
      setWeightLeft(''); setWeightRight('');
      setRepsLeft(''); setRepsRight('');
    } else {
      const w = parseFloat(weight) || 0;
      const r = parseInt(reps) || 0;
      if (r <= 0 || w < 0) return;

      onLogSet({ setNumber: currentSetNumber, reps: r, weight: w });
      setWeight(''); setReps('');
    }
  };

  const startEdit = (index: number) => {
    const set = completedSets[index];
    if (isUnilateral) {
      setEditWeightLeft(String(set.weightLeft ?? ''));
      setEditWeightRight(String(set.weightRight ?? ''));
      setEditRepsLeft(String(set.repsLeft ?? ''));
      setEditRepsRight(String(set.repsRight ?? ''));
    } else {
      setEditWeight(String(set.weight));
      setEditReps(String(set.reps));
    }
    setEditingIndex(index);
  };

  const saveEdit = () => {
    if (editingIndex === null || !onEditSet) return;
    const set = completedSets[editingIndex];

    if (isUnilateral) {
      const wL = parseFloat(editWeightLeft) || 0;
      const wR = parseFloat(editWeightRight) || 0;
      const rL = parseInt(editRepsLeft) || 0;
      const rR = parseInt(editRepsRight) || 0;
      onEditSet(editingIndex, {
        setNumber: set.setNumber, reps: Math.max(rL, rR), weight: Math.max(wL, wR),
        repsLeft: rL, repsRight: rR, weightLeft: wL, weightRight: wR,
      });
    } else {
      const w = parseFloat(editWeight) || 0;
      const r = parseInt(editReps) || 0;
      onEditSet(editingIndex, { setNumber: set.setNumber, reps: r, weight: w });
    }
    setEditingIndex(null);
  };

  const inputClass = "w-full h-11 px-3 bg-bg-elevated border border-border rounded-lg font-mono text-center text-base text-text placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors";

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4 mb-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <TierBadge tier={exercise.tier} />
        <h3 className="font-semibold text-sm flex-1">{exercise.name}</h3>
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
            <div key={i}>
              {editingIndex === i ? (
                // ─── Inline edit ───
                <div className="p-2 bg-bg-elevated rounded-lg border border-accent/30">
                  {isUnilateral ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 text-center text-[10px] font-bold text-accent">L</span>
                        <input type="number" inputMode="decimal" value={editWeightLeft} onChange={e => setEditWeightLeft(e.target.value)} className={inputClass} placeholder="kg" />
                        <span className="text-text-muted text-xs">×</span>
                        <input type="number" inputMode="numeric" value={editRepsLeft} onChange={e => setEditRepsLeft(e.target.value)} className={`${inputClass} w-16`} placeholder="reps" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 text-center text-[10px] font-bold text-accent">R</span>
                        <input type="number" inputMode="decimal" value={editWeightRight} onChange={e => setEditWeightRight(e.target.value)} className={inputClass} placeholder="kg" />
                        <span className="text-text-muted text-xs">×</span>
                        <input type="number" inputMode="numeric" value={editRepsRight} onChange={e => setEditRepsRight(e.target.value)} className={`${inputClass} w-16`} placeholder="reps" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input type="number" inputMode="decimal" value={editWeight} onChange={e => setEditWeight(e.target.value)} className={inputClass} placeholder="kg" />
                      <span className="text-text-muted text-xs">×</span>
                      <input type="number" inputMode="numeric" value={editReps} onChange={e => setEditReps(e.target.value)} className={`${inputClass} w-20`} placeholder="reps" />
                    </div>
                  )}
                  <div className="flex gap-1.5 mt-1.5">
                    <button onClick={saveEdit} className="flex-1 h-8 bg-accent/15 text-accent text-xs font-medium rounded-lg flex items-center justify-center gap-1 border border-accent/30">
                      <Check size={12} /> Opslaan
                    </button>
                    <button onClick={() => setEditingIndex(null)} className="h-8 px-3 bg-bg-card text-text-muted text-xs rounded-lg flex items-center justify-center border border-border">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                // ─── Display set ───
                <div className="flex items-center gap-2 text-sm group">
                  <Check size={14} className="text-accent shrink-0" />
                  <span className="text-text-muted font-mono text-xs">S{set.setNumber}</span>
                  {set.repsLeft != null ? (
                    <span className="font-mono text-text-secondary text-xs">
                      L:{set.weightLeft}×{set.repsLeft} R:{set.weightRight}×{set.repsRight}
                    </span>
                  ) : (
                    <span className="font-mono text-text-secondary text-xs">
                      {set.weight}kg × {set.reps}
                    </span>
                  )}
                  <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(i)} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-accent transition-colors">
                      <Pencil size={11} />
                    </button>
                    {onDeleteSet && (
                      <button onClick={() => onDeleteSet(i)} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-danger transition-colors">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
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
              <div className="flex items-center gap-1.5">
                <span className="w-5 text-center text-[10px] font-bold text-accent">L</span>
                <input type="number" inputMode="decimal" value={weightLeft} onChange={e => setWeightLeft(e.target.value)} placeholder={ghostTextLeft ?? 'kg'} className={inputClass} />
                <span className="text-text-muted text-xs">×</span>
                <input type="number" inputMode="numeric" value={repsLeft} onChange={e => setRepsLeft(e.target.value)} placeholder="reps" className={`${inputClass} w-20`} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 text-center text-[10px] font-bold text-accent">R</span>
                <input type="number" inputMode="decimal" value={weightRight} onChange={e => setWeightRight(e.target.value)} placeholder={ghostTextRight ?? 'kg'} className={inputClass} />
                <span className="text-text-muted text-xs">×</span>
                <input type="number" inputMode="numeric" value={repsRight} onChange={e => setRepsRight(e.target.value)} placeholder="reps" className={`${inputClass} w-20`} />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <input type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder={ghostText ?? 'kg'} className={inputClass} />
              <span className="text-text-muted text-xs">×</span>
              <input type="number" inputMode="numeric" value={reps} onChange={e => setReps(e.target.value)} placeholder="reps" className={`${inputClass} w-24`} />
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLog}
            className="h-10 bg-accent/15 text-accent font-medium text-sm rounded-lg flex items-center justify-center gap-1.5 transition-colors hover:bg-accent/25 cursor-pointer border border-accent/30"
          >
            <Check size={14} /> Log Set {currentSetNumber}
          </motion.button>
        </div>
      )}

      {allSetsDone && (
        <div className="text-center py-2 text-accent text-sm font-medium">
          Alle sets voltooid
        </div>
      )}
    </div>
  );
}
