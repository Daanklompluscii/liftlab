import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Check, CheckCircle2, ArrowRightLeft, Lightbulb } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { TierBadge } from '../components/ui/Badge';
import { PageHeader } from '../components/layout/PageHeader';
import { useStore } from '../store';
import { useProgram } from '../hooks/useProgram';
import { useProgress } from '../hooks/useProgress';
import { exercises as allExercises } from '../data/exercises';
import { getDeloadWorkouts } from '../lib/programming';
import { DELOAD, getMuscleLabel } from '../data/constants';

// Wekelijkse learning tips — educationCardId linkt naar Leren
const WEEKLY_TIPS = [
  { week: 1, title: 'Progressieve Overload', tip: 'Probeer elke sessie iets meer reps of gewicht.', educationCardId: 6 },
  { week: 2, title: 'RPE — Reps in Reserve', tip: 'Train op RPE 7-9. Tot falen is niet nodig voor groei.', educationCardId: 5 },
  { week: 3, title: 'Tempo Controle', tip: '3 sec excentrisch geeft meer spanning per rep.', educationCardId: 8 },
  { week: 4, title: 'Deload Week', tip: 'Zelfde gewicht, 50% minder sets. Focus op herstel.', educationCardId: 7 },
  { week: 5, title: 'Volume is Koning', tip: '12-20 harde sets per spiergroep per week is optimaal.', educationCardId: 3 },
  { week: 6, title: 'Compounds Eerst', tip: 'Begin met zware compounds als je fris bent.', educationCardId: 10 },
  { week: 7, title: 'Spierschade vs Spanning', tip: 'DOMS ≠ betere groei. Excentrische controle is effectiever.', educationCardId: 1 },
  { week: 8, title: 'Tijd voor Variatie', tip: '30-50% oefeningen swappen voor nieuwe stimulus.', educationCardId: 9 },
];

const TOTAL_WEEKS = 8;

export default function ProgramView() {
  const navigate = useNavigate();
  const { activeProgram, setActiveProgram } = useStore();
  const { program, activeWorkouts, currentWeek, isDeloadWeek, startDeload, endDeload, reload } = useProgram();
  const { logs } = useProgress();
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [showTip, setShowTip] = useState(true);
  const [skipDeload, setSkipDeload] = useState(false);
  const [showDeloadConfirm, setShowDeloadConfirm] = useState(false);
  const [showReloadConfirm, setShowReloadConfirm] = useState(false);
  const [swapExercise, setSwapExercise] = useState<{ dayIndex: number; exIndex: number } | null>(null);

  const exerciseMap = useMemo(() => new Map(allExercises.map(e => [e.id, e])), []);

  // ─── Per-week completion tracking ───
  // Elke week heeft daysPerWeek workouts. Week 1 = log 0..N-1, Week 2 = log N..2N-1, etc.
  const daysPerWeek = program?.workouts.length ?? 1;
  const completedLogs = useMemo(() => logs.filter(l => l.completedAt), [logs]);

  // Bereken welke trainingen per week voltooid zijn
  const getWeekCompletions = (weekNum: number): Set<number> => {
    const startIdx = (weekNum - 1) * daysPerWeek;
    const endIdx = startIdx + daysPerWeek;
    const weekLogs = completedLogs.slice(startIdx, endIdx);
    // Map log index within the week to workout index
    const completed = new Set<number>();
    weekLogs.forEach((_, i) => completed.add(i));
    return completed;
  };

  const derivedWeek = Math.min(Math.floor(completedLogs.length / daysPerWeek) + 1, TOTAL_WEEKS);
  const viewWeek = selectedWeek ?? derivedWeek;
  const weekTip = WEEKLY_TIPS[(viewWeek - 1) % WEEKLY_TIPS.length];
  const viewCompletions = getWeekCompletions(viewWeek);
  const allWeekDone = viewCompletions.size >= daysPerWeek;

  const isDeloadView = viewWeek === 4 && !skipDeload;
  const displayWorkouts = useMemo(() => {
    if (!program) return [];
    if (isDeloadView) return getDeloadWorkouts(program);
    if (isDeloadWeek && !skipDeload) return getDeloadWorkouts(program);
    return activeWorkouts;
  }, [program, isDeloadView, isDeloadWeek, skipDeload, activeWorkouts]);

  if (!program) {
    return (
      <div className="min-h-dvh pb-24">
        <PageHeader title="Programma" />
        <div className="px-4 pt-8 text-center">
          <p className="text-text-secondary">Geen actief programma.</p>
        </div>
      </div>
    );
  }

  const handleReload = () => {
    reload();
    setShowReloadConfirm(false);
    setSelectedWeek(null);
  };

  const handleSwap = (dayIndex: number, exIndex: number, newExerciseId: string) => {
    const updatedWorkouts = [...program.workouts];
    const workout = { ...updatedWorkouts[dayIndex] };
    const exercises = [...workout.exercises];
    exercises[exIndex] = { ...exercises[exIndex], exerciseId: newExerciseId };
    workout.exercises = exercises;
    updatedWorkouts[dayIndex] = workout;
    setActiveProgram({ ...program, workouts: updatedWorkouts });
    setSwapExercise(null);
  };

  return (
    <div className="min-h-dvh pb-24">
      <PageHeader
        title="Programma"
        right={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowTip(t => !t)}>
              <Lightbulb size={16} className={showTip ? 'text-accent' : ''} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowReloadConfirm(true)}>
              <RefreshCw size={16} />
            </Button>
          </div>
        }
      />

      <div className="px-4 pt-2">
        {/* Program header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">{program.name}</h2>
            <p className="text-sm text-text-secondary">
              {program.split.replace('_', '/').toUpperCase()} • {daysPerWeek} dagen/week
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-lg font-bold text-accent">{derivedWeek}/{TOTAL_WEEKS}</span>
            <p className="text-xs text-text-muted">week</p>
          </div>
        </div>

        {/* ─── Timeline ─── */}
        <div className="flex gap-1.5 mb-4">
          {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
            const wk = i + 1;
            const isCurrent = wk === derivedWeek;
            const isPast = wk < derivedWeek;
            const isView = wk === viewWeek;
            const isDeload = wk === 4;
            const isReset = wk === 8;
            const weekDone = getWeekCompletions(wk).size >= daysPerWeek;
            return (
              <button
                key={wk}
                onClick={() => setSelectedWeek(isView && selectedWeek !== null ? null : wk)}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className={`w-full h-2.5 rounded-full transition-all ${
                  isCurrent ? 'ring-2 ring-accent ring-offset-1 ring-offset-bg' :
                  isView ? 'ring-2 ring-text-muted ring-offset-1 ring-offset-bg' : ''
                } ${
                  isPast || weekDone ? 'bg-accent' :
                  isCurrent ? 'bg-accent' :
                  isReset ? 'bg-purple-500/40' :
                  isDeload ? 'bg-accent/40' :
                  'bg-border'
                }`} />
                <span className={`text-[9px] font-mono ${
                  isCurrent ? 'text-accent font-bold' :
                  isView ? 'text-text font-bold' :
                  isReset && !isPast ? 'text-purple-400' :
                  isDeload && !isPast ? 'text-accent' :
                  isPast ? 'text-text-secondary' : 'text-text-muted'
                }`}>
                  {isDeload ? 'DL' : isReset ? '↻' : wk}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── Week Card (unified) ─── */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-4">
          {/* Week header */}
          <div className={`px-4 py-3 border-b border-border flex items-center justify-between ${
            viewWeek === 4 ? 'bg-accent/5' : viewWeek === 8 ? 'bg-purple-500/5' : ''
          }`}>
            <div>
              <p className="font-bold text-base">
                Week {viewWeek}
                {viewWeek === 4 && <span className="text-accent ml-1.5 text-sm font-medium">Deload</span>}
                {viewWeek === 8 && <span className="text-purple-400 ml-1.5 text-sm font-medium">Reset</span>}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {viewWeek < derivedWeek && (allWeekDone ? 'Afgerond' : `${viewCompletions.size}/${daysPerWeek} voltooid`)}
                {viewWeek === derivedWeek && (allWeekDone ? 'Afgerond' : `${viewCompletions.size}/${daysPerWeek} voltooid — huidige week`)}
                {viewWeek > derivedWeek && `Nog ${viewWeek - derivedWeek} ${viewWeek - derivedWeek === 1 ? 'week' : 'weken'}`}
              </p>
            </div>
            {allWeekDone && <CheckCircle2 size={20} className="text-accent" />}
          </div>

          {/* Tip — inline in card */}
          <AnimatePresence>
            {showTip && weekTip && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3 bg-bg-elevated border-b border-border flex items-start gap-2.5">
                  <Lightbulb size={14} className="text-accent shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text mb-0.5">{weekTip.title}</p>
                    <p className="text-xs text-text-secondary leading-relaxed">{weekTip.tip}</p>
                    <button
                      onClick={() => navigate(`/learn?card=${weekTip.educationCardId}`)}
                      className="text-xs text-accent font-medium mt-1.5 inline-block"
                    >
                      Lees meer →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* Workouts */}
          <div>
            {displayWorkouts.map((workout, dayIndex) => {
              const isExpanded = expandedDay === workout.id;
              const isCompleted = viewCompletions.has(dayIndex);
              const isLast = dayIndex === displayWorkouts.length - 1;
              const canStart = viewWeek === derivedWeek && !isCompleted;
              return (
                <div key={workout.id} className={!isLast ? 'border-b border-border' : ''}>
                  <button
                    onClick={() => setExpandedDay(isExpanded ? null : workout.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle2 size={16} className="text-accent shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                      )}
                      <div>
                        <p className={`text-sm font-semibold ${isCompleted ? 'text-text-secondary' : ''}`}>
                          {workout.dayLabel}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {workout.exercises.length} oefeningen
                          {viewWeek === 4 && <span className="text-accent"> • deload</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {canStart && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/workout/${workout.id}`); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent/15 text-accent"
                        >
                          <Play size={13} />
                        </button>
                      )}
                      {isExpanded
                        ? <ChevronUp size={14} className="text-text-muted" />
                        : <ChevronDown size={14} className="text-text-muted" />
                      }
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 flex flex-col gap-1.5">
                          {workout.exercises.map((ex, exIndex) => {
                            const exercise = exerciseMap.get(ex.exerciseId);
                            if (!exercise) return null;
                            return (
                              <div key={ex.exerciseId} className="flex items-center gap-2">
                                <TierBadge tier={exercise.tier} />
                                <span className="text-xs flex-1">{exercise.name}</span>
                                <span className="text-[10px] text-text-muted font-mono">
                                  {ex.sets}×{ex.repRange[0]}-{ex.repRange[1]}
                                </span>
                                <button
                                  onClick={() => setSwapExercise({ dayIndex, exIndex })}
                                  className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-accent transition-colors"
                                >
                                  <ArrowRightLeft size={10} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Week 4 deload — onder de workouts */}
          {viewWeek === 4 && (
            <div className="px-4 py-3 border-t border-border bg-accent/5">
              <div className="flex items-center gap-3">
                <AlertTriangle size={14} className="text-accent shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-text-secondary">
                    {isDeloadView
                      ? `Deload actief — ${DELOAD.volumeReduction * 100}% minder sets, RPE 5-6.`
                      : 'Deload overgeslagen — normaal volume.'}
                  </p>
                </div>
                {isDeloadView ? (
                  <Button size="sm" variant="secondary" onClick={() => setSkipDeload(true)}>Overslaan</Button>
                ) : (
                  <Button size="sm" onClick={() => setSkipDeload(false)}>Deload Aan</Button>
                )}
              </div>
            </div>
          )}

          {/* Week 8 reset — onder de workouts */}
          {viewWeek === 8 && (
            <div className="px-4 py-3 border-t border-border bg-purple-500/5">
              <div className="flex items-center gap-3">
                <RefreshCw size={14} className="text-purple-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-text-secondary">Einde mesocyclus — frisse oefeningen voor nieuwe stimulus.</p>
                </div>
                <Button size="sm" onClick={() => setShowReloadConfirm(true)}>Genereer</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Swap Exercise Dialog */}
      <AnimatePresence>
        {swapExercise && (
          <SwapDialog
            currentExerciseId={program.workouts[swapExercise.dayIndex].exercises[swapExercise.exIndex].exerciseId}
            exerciseMap={exerciseMap}
            onSwap={(newId) => handleSwap(swapExercise.dayIndex, swapExercise.exIndex, newId)}
            onCancel={() => setSwapExercise(null)}
          />
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <AnimatePresence>
        {showDeloadConfirm && (
          <ConfirmDialog
            title="Deload Week Starten?"
            message="Zelfde oefeningen en gewichten, 50% minder sets, RPE 5-6."
            confirmLabel="Start Deload"
            onConfirm={() => { startDeload(); setShowDeloadConfirm(false); }}
            onCancel={() => setShowDeloadConfirm(false)}
          />
        )}
        {showReloadConfirm && (
          <ConfirmDialog
            title="Nieuw Programma Genereren?"
            message="30-50% van de oefeningen wordt verwisseld voor variatie. Week teller reset naar 1."
            confirmLabel="Genereren"
            onConfirm={handleReload}
            onCancel={() => setShowReloadConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Swap Exercise Dialog ───

function SwapDialog({
  currentExerciseId,
  exerciseMap,
  onSwap,
  onCancel,
}: {
  currentExerciseId: string;
  exerciseMap: Map<string, typeof allExercises[0]>;
  onSwap: (newId: string) => void;
  onCancel: () => void;
}) {
  const current = exerciseMap.get(currentExerciseId);
  if (!current) return null;

  const TIER_ORDER: Record<string, number> = { 'S+': 0, S: 1, 'A+': 2, A: 3, B: 4, C: 5, 'C-': 6, D: 7, F: 8 };
  const alternatives = allExercises
    .filter(e => e.primaryMuscle === current.primaryMuscle && e.id !== currentExerciseId)
    .sort((a, b) => (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-bg-card border-t border-border rounded-t-2xl w-full max-w-lg max-h-[70vh] flex flex-col"
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Oefening Wisselen</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Huidig: {current.name} • {getMuscleLabel(current.primaryMuscle)}
              </p>
            </div>
            <button onClick={onCancel} className="text-text-muted text-sm">Annuleer</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-1.5">
            {alternatives.map(ex => {
              const isDangerous = ex.tier === 'D' || ex.tier === 'F';
              return (
                <button
                  key={ex.id}
                  onClick={() => onSwap(ex.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl text-left transition-colors ${
                    isDangerous
                      ? 'bg-danger-muted/30 border border-danger/20 hover:bg-danger-muted/50'
                      : 'bg-bg-elevated hover:bg-border/30'
                  }`}
                >
                  <TierBadge tier={ex.tier} />
                  <span className="text-sm flex-1">{ex.name}</span>
                  {ex.isUnilateral && <span className="text-[10px] text-accent">L/R</span>}
                  {isDangerous && <span className="text-[10px] text-danger">Niet aanbevolen</span>}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Confirm Dialog ───

function ConfirmDialog({
  title, message, confirmLabel, onConfirm, onCancel,
}: {
  title: string; message: string; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
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
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onCancel}>Annuleren</Button>
          <Button fullWidth onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
