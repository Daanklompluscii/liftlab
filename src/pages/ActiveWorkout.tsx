import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui';
import { SetLogger } from '../components/workout/SetLogger';
import { RestTimer } from '../components/workout/RestTimer';
import { useStore } from '../store';
import { useWorkout } from '../hooks/useWorkout';
import { useTimer } from '../hooks/useTimer';
import { getPreviousWorkoutLog, getPreviousSets, getProgressionAdvice } from '../lib/progression';
import { exercises as allExercises } from '../data/exercises';
import { formatTime } from '../lib/calculations';
import type { SetLog, WorkoutLog } from '../types';

export default function ActiveWorkout() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const { activeProgram } = useStore();
  const { activeWorkout, startWorkout, logSet, editSet, deleteSet, completeWorkout } = useWorkout();
  const timer = useTimer();

  const [previousLog, setPreviousLog] = useState<WorkoutLog | undefined>();
  const [prExerciseId, setPrExerciseId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // Vind de programma workout
  const programWorkout = activeProgram?.workouts.find(w => w.id === workoutId);

  // Start altijd een nieuwe workout als er geen actieve is of als het een andere workout betreft
  useEffect(() => {
    if (!programWorkout) return;

    // Geen actieve workout → start nieuwe
    if (!activeWorkout) {
      startWorkout(programWorkout);
      return;
    }

    // Actieve workout is voor een andere workout slot → start nieuwe
    if (activeWorkout.programWorkoutId !== programWorkout.id) {
      startWorkout(programWorkout);
      return;
    }

    // Actieve workout is al afgerond (completedAt is gezet) → start nieuwe
    if (activeWorkout.completedAt) {
      startWorkout(programWorkout);
    }
  }, [programWorkout?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Laad vorige workout
  useEffect(() => {
    if (workoutId) {
      getPreviousWorkoutLog(workoutId).then(setPreviousLog);
    }
  }, [workoutId]);

  // Elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeWorkout?.startedAt) {
        const start = new Date(activeWorkout.startedAt).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout?.startedAt]);

  // Clear PR animation na 3 seconden
  useEffect(() => {
    if (prExerciseId) {
      const t = setTimeout(() => setPrExerciseId(null), 3000);
      return () => clearTimeout(t);
    }
  }, [prExerciseId]);

  // Warn before browser close/refresh if workout in progress
  useEffect(() => {
    const hasLoggedSets = activeWorkout?.exercises.some(ex => ex.sets.length > 0);
    if (!hasLoggedSets) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [activeWorkout]);

  const handleLogSet = useCallback(async (exerciseId: string, set: Omit<SetLog, 'completedAt'>) => {
    const pr = await logSet(exerciseId, set);
    if (pr) {
      setPrExerciseId(exerciseId);
    }

    // Start rust timer automatisch
    const programEx = programWorkout?.exercises.find(e => e.exerciseId === exerciseId);
    if (programEx) {
      timer.start(programEx.restSeconds);
    }
  }, [logSet, programWorkout, timer]);

  const handleComplete = async () => {
    await completeWorkout();
    navigate('/');
  };

  const handleExit = () => {
    const hasLoggedSets = activeWorkout?.exercises.some(ex => ex.sets.length > 0);
    if (hasLoggedSets) {
      setShowExitConfirm(true);
    } else {
      navigate('/');
    }
  };

  const handleConfirmExit = async () => {
    // Save what we have as incomplete
    await completeWorkout();
    navigate('/');
  };

  if (!programWorkout) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <p className="text-text-secondary">Workout niet gevonden.</p>
      </div>
    );
  }

  const exerciseMap = new Map(allExercises.map(e => [e.id, e]));
  const totalSetsTarget = programWorkout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const totalSetsDone = activeWorkout?.exercises.reduce((sum, ex) => sum + ex.sets.length, 0) ?? 0;
  const allDone = activeWorkout?.exercises.every((ex, i) => {
    const target = programWorkout.exercises[i]?.sets ?? 0;
    return ex.sets.length >= target;
  }) ?? false;
  const progressPercent = totalSetsTarget > 0 ? Math.round((totalSetsDone / totalSetsTarget) * 100) : 0;

  return (
    <div className="min-h-dvh pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={handleExit}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-bg-card transition-colors"
            aria-label="Stoppen"
          >
            <X size={20} />
          </button>
          <div className="text-center">
            <p className="font-semibold text-sm">{programWorkout.dayLabel}</p>
            <p className="text-xs text-text-muted font-mono flex items-center gap-1">
              <Clock size={10} /> {formatTime(elapsed)}
              <span className="mx-1">•</span>
              {progressPercent}%
            </p>
          </div>
          {/* Complete button in header when almost done */}
          <div className="w-10">
            {totalSetsDone > 0 && (
              <button
                onClick={() => setShowCompleteConfirm(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-bg-card transition-colors text-accent"
                aria-label="Voltooien"
              >
                <CheckCircle2 size={20} />
              </button>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-border">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Exercises */}
      <div className="px-4 pt-4">
        {programWorkout.exercises.map((progEx, index) => {
          const exercise = exerciseMap.get(progEx.exerciseId);
          if (!exercise) return null;

          const completedSets = activeWorkout?.exercises[index]?.sets ?? [];
          const prevSets = getPreviousSets(previousLog, progEx.exerciseId);
          const currentSetNumber = completedSets.length + 1;

          // Progressie advies
          const advice = getProgressionAdvice(
            prevSets,
            progEx.repRange[1],
            exercise.equipment[0] ?? 'barbell',
          );

          return (
            <div key={progEx.exerciseId}>
              {/* Progressie melding */}
              {advice.type === 'increase_weight' && currentSetNumber === 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-2 p-2.5 bg-success-muted border border-success/30 rounded-xl"
                >
                  <p className="text-success text-xs font-medium">{advice.message}</p>
                </motion.div>
              )}

              <SetLogger
                exercise={exercise}
                programExercise={progEx}
                completedSets={completedSets}
                previousSets={prevSets}
                onLogSet={(set) => handleLogSet(progEx.exerciseId, set)}
                onEditSet={(setIndex, set) => editSet(progEx.exerciseId, setIndex, set)}
                onDeleteSet={(setIndex) => deleteSet(progEx.exerciseId, setIndex)}
                currentSetNumber={currentSetNumber}
                prExerciseId={prExerciseId}
              />
            </div>
          );
        })}

        {/* Complete Button — always visible when at least 1 set done */}
        {totalSetsDone > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 mb-4"
          >
            <Button
              fullWidth
              size="lg"
              variant={allDone ? 'primary' : 'secondary'}
              onClick={() => allDone ? handleComplete() : setShowCompleteConfirm(true)}
            >
              <CheckCircle2 size={18} />
              {allDone ? 'Training Voltooien' : `Training Afsluiten (${progressPercent}%)`}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Rest Timer Overlay */}
      <RestTimer />

      {/* Exit Confirm Dialog */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-bg-card border border-border rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-accent" />
                <h3 className="text-lg font-bold">Training stoppen?</h3>
              </div>
              <p className="text-sm text-text-secondary mb-6">
                Je hebt {totalSetsDone} sets gelogd. Je voortgang wordt opgeslagen.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setShowExitConfirm(false)}>
                  Doorgaan
                </Button>
                <Button variant="danger" fullWidth onClick={handleConfirmExit}>
                  Stoppen & Opslaan
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete Confirm Dialog (when not all sets done) */}
      <AnimatePresence>
        {showCompleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-bg-card border border-border rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-bold mb-2">Training afsluiten?</h3>
              <p className="text-sm text-text-secondary mb-6">
                {allDone
                  ? 'Alle sets zijn voltooid. Goed gedaan!'
                  : `Je hebt ${totalSetsDone} van ${totalSetsTarget} sets gedaan (${progressPercent}%). Weet je zeker dat je wilt stoppen?`
                }
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setShowCompleteConfirm(false)}>
                  Doorgaan
                </Button>
                <Button fullWidth onClick={handleComplete}>
                  Voltooien
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
