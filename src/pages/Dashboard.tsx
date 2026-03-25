import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Calendar, Trophy, TrendingUp, Flame } from 'lucide-react';
import { Button, Card, CardTitle } from '../components/ui';
import { useStore } from '../store';
import { useProgress } from '../hooks/useProgress';
import { exercises as allExercises } from '../data/exercises';
import { formatDate } from '../lib/calculations';
import { DELOAD } from '../data/constants';
import type { ProgramWorkout } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, activeProgram } = useStore();
  const { totalWorkouts, getAllPRs } = useProgress();

  const todayWorkout = getTodayWorkout();

  function getTodayWorkout(): ProgramWorkout | null {
    if (!activeProgram?.workouts.length) return null;
    // Roteer door workouts op basis van week en dag
    const totalDone = totalWorkouts;
    const idx = totalDone % activeProgram.workouts.length;
    return activeProgram.workouts[idx];
  }

  const exerciseMap = new Map(allExercises.map(e => [e.id, e]));
  const needsDeload = activeProgram && activeProgram.currentWeek > DELOAD.afterWeeks && !activeProgram.deloadScheduled;
  const prs = getAllPRs(new Map(allExercises.map(e => [e.id, e.primaryMuscle])));

  return (
    <div className="min-h-dvh pb-24 px-4 pt-6">
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-text-secondary text-sm">{formatDate(new Date())}</p>
        <h1 className="text-2xl font-bold mt-1">
          Hey{profile?.name ? `, ${profile.name}` : ''}
        </h1>
      </div>

      {/* Deload notice */}
      {needsDeload && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-accent-muted border border-accent/30 rounded-xl"
        >
          <p className="text-accent font-semibold text-sm">Deload aanbevolen</p>
          <p className="text-text-secondary text-xs mt-1">
            Je bent in week {activeProgram?.currentWeek}. Een deload helpt vermoeidheid af te bouwen.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => navigate('/program')}
          >
            Bekijk Programma
          </Button>
        </motion.div>
      )}

      {/* Today's Workout */}
      {todayWorkout ? (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-text-secondary text-xs font-medium uppercase tracking-wide">
                Training van Vandaag
              </p>
              <CardTitle>{todayWorkout.dayLabel}</CardTitle>
            </div>
            {activeProgram && (
              <span className="text-xs font-mono text-text-muted bg-bg-elevated px-2 py-1 rounded-lg">
                Week {activeProgram.currentWeek}/{activeProgram.weeks}
              </span>
            )}
          </div>

          {/* Exercise list */}
          <div className="flex flex-col gap-1.5 mb-4">
            {todayWorkout.exercises.map(ex => {
              const exercise = exerciseMap.get(ex.exerciseId);
              if (!exercise) return null;
              return (
                <div key={ex.exerciseId} className="flex items-center gap-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span className="text-sm">{exercise.name}</span>
                  <span className="text-xs text-text-muted font-mono ml-auto">
                    {ex.sets}×{ex.repRange[0]}-{ex.repRange[1]}
                  </span>
                </div>
              );
            })}
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={() => navigate(`/workout/${todayWorkout.id}`)}
          >
            <Play size={20} /> Start Training
          </Button>
        </Card>
      ) : (
        <Card className="mb-4">
          <p className="text-text-secondary text-center py-8">
            Geen programma gevonden. Ga naar instellingen om een programma te genereren.
          </p>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="text-center">
          <Flame size={18} className="text-accent mx-auto mb-1" />
          <p className="font-mono text-xl font-bold">{totalWorkouts}</p>
          <p className="text-[10px] text-text-muted uppercase">Trainingen</p>
        </Card>
        <Card className="text-center">
          <Calendar size={18} className="text-accent mx-auto mb-1" />
          <p className="font-mono text-xl font-bold">
            {activeProgram?.currentWeek ?? 0}
          </p>
          <p className="text-[10px] text-text-muted uppercase">Huidige Week</p>
        </Card>
        <Card className="text-center">
          <Trophy size={18} className="text-accent mx-auto mb-1" />
          <p className="font-mono text-xl font-bold">{prs.length}</p>
          <p className="text-[10px] text-text-muted uppercase">PR's</p>
        </Card>
      </div>

      {/* Recent PR's */}
      {prs.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-success" />
            <p className="text-sm font-semibold">Recente PR's</p>
          </div>
          <div className="flex flex-col gap-2">
            {prs.slice(0, 3).map(pr => {
              const exercise = exerciseMap.get(pr.exerciseId);
              return (
                <div key={pr.exerciseId} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{exercise?.name ?? pr.exerciseId}</span>
                  <span className="font-mono text-sm text-success">
                    {pr.estimated1RM}kg <span className="text-text-muted text-xs">e1RM</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
