import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, CheckCircle2, Clock } from 'lucide-react';
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
  const { activeWorkout, startWorkout, logSet, completeWorkout } = useWorkout();
  const timer = useTimer();

  const [previousLog, setPreviousLog] = useState<WorkoutLog | undefined>();
  const [prExerciseId, setPrExerciseId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Vind de programma workout
  const programWorkout = activeProgram?.workouts.find(w => w.id === workoutId);

  // Start workout als die nog niet actief is
  useEffect(() => {
    if (programWorkout && !activeWorkout) {
      startWorkout(programWorkout);
    }
  }, [programWorkout, activeWorkout, startWorkout]);

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

  if (!programWorkout) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <p className="text-text-secondary">Workout niet gevonden.</p>
      </div>
    );
  }

  const exerciseMap = new Map(allExercises.map(e => [e.id, e]));
  const allDone = activeWorkout?.exercises.every((ex, i) => {
    const target = programWorkout.exercises[i]?.sets ?? 0;
    return ex.sets.length >= target;
  }) ?? false;

  return (
    <div className="min-h-dvh pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-bg-card transition-colors"
            aria-label="Stoppen"
          >
            <X size={20} />
          </button>
          <div className="text-center">
            <p className="font-semibold text-sm">{programWorkout.dayLabel}</p>
            <p className="text-xs text-text-muted font-mono flex items-center gap-1">
              <Clock size={10} /> {formatTime(elapsed)}
            </p>
          </div>
          <div className="w-10" /> {/* Spacer */}
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
                currentSetNumber={currentSetNumber}
                prExerciseId={prExerciseId}
              />
            </div>
          );
        })}

        {/* Complete Button */}
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Button fullWidth size="lg" onClick={handleComplete}>
              <CheckCircle2 size={20} /> Training Voltooien
            </Button>
          </motion.div>
        )}
      </div>

      {/* Rest Timer Overlay */}
      <RestTimer />
    </div>
  );
}
