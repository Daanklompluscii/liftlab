import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Calendar, Trophy, TrendingUp, Flame, CheckCircle2, ChevronRight } from 'lucide-react';
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
  const { logs, loading, getAllPRs } = useProgress();

  const completedCount = logs.filter(l => l.completedAt).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const completedToday = logs.filter(l =>
    l.completedAt && new Date(l.completedAt).toISOString().split('T')[0] === todayStr
  );
  const didTrainToday = completedToday.length > 0;

  function getNextWorkout(): ProgramWorkout | null {
    if (!activeProgram?.workouts.length) return null;
    const idx = completedCount % activeProgram.workouts.length;
    return activeProgram.workouts[idx];
  }

  const nextWorkout = getNextWorkout();
  const exerciseMap = new Map(allExercises.map(e => [e.id, e]));
  const needsDeload = activeProgram && activeProgram.currentWeek > DELOAD.afterWeeks && !activeProgram.deloadScheduled;
  const prs = getAllPRs(new Map(allExercises.map(e => [e.id, e.primaryMuscle])));

  // Bereken week op basis van completed trainingen
  const daysPerWeek = activeProgram?.workouts.length ?? 1;
  const derivedWeek = Math.min(Math.floor(completedCount / daysPerWeek) + 1, 8);

  return (
    <div className="min-h-dvh pb-24 px-5 pt-8">
      {/* Greeting */}
      <div className="mb-8">
        <p className="text-text-muted text-sm">{formatDate(new Date())}</p>
        <h1 className="text-3xl font-bold mt-1">
          Hey{profile?.name ? `, ${profile.name}` : ''}
        </h1>
      </div>

      {/* Deload notice */}
      {needsDeload && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-4 bg-accent-muted border border-accent/20 rounded-2xl"
        >
          <p className="text-accent font-semibold text-sm">Deload aanbevolen</p>
          <p className="text-text-secondary text-xs mt-1">
            Week {activeProgram?.currentWeek} — een deload helpt vermoeidheid af te bouwen.
          </p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate('/program')}>
            Bekijk Programma
          </Button>
        </motion.div>
      )}

      {/* Today's Workout */}
      {loading ? (
        <div className="mb-5 h-48 bg-bg-card border border-border rounded-2xl shadow-[var(--shadow-card)] animate-pulse" />
      ) : didTrainToday ? (
        <Card className="mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
              <CheckCircle2 size={22} className="text-accent" />
            </div>
            <div>
              <p className="font-semibold">Training voltooid!</p>
              <p className="text-xs text-text-muted">
                {completedToday.length} {completedToday.length === 1 ? 'training' : 'trainingen'} vandaag
              </p>
            </div>
          </div>

          {nextWorkout && (
            <>
              <div className="border-t border-border pt-4">
                <p className="text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-1.5">
                  Volgende Training
                </p>
                <p className="font-semibold text-text-secondary">{nextWorkout.dayLabel}</p>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" fullWidth size="md" onClick={() => navigate(`/workout/${nextWorkout.id}`)}>
                  <Play size={16} /> Toch Trainen
                </Button>
                <Button variant="ghost" fullWidth size="md" onClick={() => navigate('/program')}>
                  Programma
                </Button>
              </div>
            </>
          )}
        </Card>
      ) : nextWorkout ? (
        <Card className="mb-5" padding={false}>
          <div className="p-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-text-muted text-[10px] font-semibold uppercase tracking-widest">
                  Training van Vandaag
                </p>
                <h2 className="text-xl font-bold mt-1">{nextWorkout.dayLabel}</h2>
              </div>
              {activeProgram && (
                <div className="px-3 py-1.5 bg-bg-elevated rounded-lg">
                  <span className="text-xs font-mono text-text-muted">
                    Week <span className="text-text font-bold">{derivedWeek}</span>/8
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 mb-1">
              {nextWorkout.exercises.map(ex => {
                const exercise = exerciseMap.get(ex.exerciseId);
                if (!exercise) return null;
                return (
                  <div key={ex.exerciseId} className="flex items-center gap-2.5 py-1.5">
                    <div className="w-1 h-1 rounded-full bg-accent shrink-0" />
                    <span className="text-sm text-text-secondary">{exercise.name}</span>
                    <span className="text-xs text-text-muted font-mono ml-auto">
                      {ex.sets}×{ex.repRange[0]}-{ex.repRange[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-5 pb-5">
            <Button fullWidth size="lg" onClick={() => navigate(`/workout/${nextWorkout.id}`)}>
              <Play size={18} /> Start Training
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mb-5">
          <p className="text-text-secondary text-center py-8">
            Geen programma gevonden. Ga naar instellingen om een programma te genereren.
          </p>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: Flame, value: completedCount, label: 'Trainingen' },
          { icon: Calendar, value: derivedWeek, label: 'Huidige Week' },
          { icon: Trophy, value: prs.length, label: "PR's" },
        ].map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="bg-bg-card border border-border rounded-2xl shadow-[var(--shadow-card)] p-4 flex flex-col items-center gap-2"
          >
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Icon size={16} className="text-accent" />
            </div>
            <p className="font-mono text-2xl font-bold">{value}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent PR's */}
      {prs.length > 0 && (
        <Card padding={false}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp size={14} className="text-accent" />
              </div>
              <p className="text-sm font-semibold">Recente PR's</p>
            </div>
            <button onClick={() => navigate('/progress')} className="text-xs text-text-muted flex items-center gap-0.5">
              Alles <ChevronRight size={12} />
            </button>
          </div>
          <div className="px-5 pb-5 flex flex-col">
            {prs.slice(0, 4).map((pr, i) => {
              const exercise = exerciseMap.get(pr.exerciseId);
              return (
                <div
                  key={pr.exerciseId}
                  className={`flex items-center justify-between py-3 ${i < Math.min(prs.length, 4) - 1 ? 'border-b border-border' : ''}`}
                >
                  <span className="text-sm text-text-secondary">{exercise?.name ?? pr.exerciseId}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-accent">{pr.estimated1RM}kg</span>
                    <span className="text-[10px] text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded">e1RM</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
