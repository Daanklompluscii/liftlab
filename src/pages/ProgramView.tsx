import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RefreshCw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { TierBadge } from '../components/ui/Badge';
import { PageHeader } from '../components/layout/PageHeader';
import { useProgram } from '../hooks/useProgram';
import { exercises as allExercises } from '../data/exercises';
import { DELOAD } from '../data/constants';

export default function ProgramView() {
  const navigate = useNavigate();
  const { program, currentWeek, totalWeeks, isDeloadWeek, startDeload, reload } = useProgram();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [showDeloadConfirm, setShowDeloadConfirm] = useState(false);
  const [showReloadConfirm, setShowReloadConfirm] = useState(false);

  const exerciseMap = new Map(allExercises.map(e => [e.id, e]));

  if (!program) {
    return (
      <div className="min-h-dvh pb-24">
        <PageHeader title="Programma" />
        <div className="px-4 pt-8 text-center">
          <p className="text-text-secondary">Geen actief programma.</p>
          <p className="text-text-muted text-sm mt-2">
            Ga naar instellingen om een programma te genereren.
          </p>
        </div>
      </div>
    );
  }

  const needsDeload = currentWeek > DELOAD.afterWeeks && !isDeloadWeek;

  return (
    <div className="min-h-dvh pb-24">
      <PageHeader
        title="Programma"
        right={
          <Button variant="ghost" size="sm" onClick={() => setShowReloadConfirm(true)}>
            <RefreshCw size={16} />
          </Button>
        }
      />

      <div className="px-4 pt-2">
        {/* Program info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">{program.name}</h2>
            <p className="text-sm text-text-secondary">
              {program.split.replace('_', '/').toUpperCase()} • {program.workouts.length} dagen
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-lg font-bold text-accent">
              {currentWeek}/{totalWeeks}
            </span>
            <p className="text-xs text-text-muted">week</p>
          </div>
        </div>

        {/* Deload banner */}
        {needsDeload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-4 bg-accent-muted border border-accent/30 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-accent shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Deload aanbevolen</p>
                <p className="text-xs text-text-secondary mt-1">
                  Na {DELOAD.afterWeeks} weken training is een deload week belangrijk voor herstel.
                  Zelfde oefeningen, zelfde gewicht, {DELOAD.volumeReduction * 100}% minder sets.
                </p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowDeloadConfirm(true)}
                >
                  Start Deload Week
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {isDeloadWeek && (
          <div className="mb-4 p-3 bg-success-muted border border-success/30 rounded-xl">
            <p className="text-success text-sm font-semibold">Deload Week</p>
            <p className="text-xs text-text-secondary mt-1">
              Verminderd volume. Focus op herstel. RPE 5-6.
            </p>
          </div>
        )}

        {/* Workout days */}
        <div className="flex flex-col gap-3">
          {program.workouts.map((workout) => {
            const isExpanded = expandedDay === workout.id;
            return (
              <Card key={workout.id} padding={false}>
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : workout.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div>
                    <p className="font-semibold">{workout.dayLabel}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {workout.exercises.length} oefeningen
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/workout/${workout.id}`);
                      }}
                    >
                      <Play size={14} />
                    </Button>
                    {isExpanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 flex flex-col gap-2 border-t border-border pt-3">
                        {workout.exercises.map((ex) => {
                          const exercise = exerciseMap.get(ex.exerciseId);
                          if (!exercise) return null;
                          return (
                            <div key={ex.exerciseId} className="flex items-center gap-2">
                              <TierBadge tier={exercise.tier} />
                              <span className="text-sm flex-1">{exercise.name}</span>
                              <span className="text-xs text-text-muted font-mono">
                                {ex.sets}×{ex.repRange[0]}-{ex.repRange[1]}
                              </span>
                              <span className="text-xs text-text-muted font-mono">
                                {Math.floor(ex.restSeconds / 60)}:{(ex.restSeconds % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Deload Confirm Dialog */}
      <AnimatePresence>
        {showDeloadConfirm && (
          <ConfirmDialog
            title="Deload Week Starten?"
            message="Zelfde oefeningen en gewichten, 50% minder sets, RPE 5-6. Dit kan niet ongedaan worden."
            confirmLabel="Start Deload"
            onConfirm={() => { startDeload(); setShowDeloadConfirm(false); }}
            onCancel={() => setShowDeloadConfirm(false)}
          />
        )}
        {showReloadConfirm && (
          <ConfirmDialog
            title="Programma Herladen?"
            message="30-50% van de oefeningen wordt verwisseld voor variatie. Week teller reset naar 1."
            confirmLabel="Herladen"
            onConfirm={() => { reload(); setShowReloadConfirm(false); }}
            onCancel={() => setShowReloadConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
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
