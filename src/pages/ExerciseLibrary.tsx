import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TierBadge } from '../components/ui/Badge';
import { PageHeader } from '../components/layout/PageHeader';
import { exercises as allExercises } from '../data/exercises';
import { MUSCLE_GROUPS, getMuscleLabel } from '../data/constants';
import type { MuscleGroup, Exercise } from '../types';

export default function ExerciseLibrary() {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | ''>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = allExercises;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        getMuscleLabel(e.primaryMuscle).toLowerCase().includes(q)
      );
    }

    if (muscleFilter) {
      result = result.filter(e =>
        e.primaryMuscle === muscleFilter || e.secondaryMuscles.includes(muscleFilter)
      );
    }

    return result;
  }, [search, muscleFilter]);

  // Groepeer per spiergroep
  const grouped = useMemo(() => {
    const groups = new Map<MuscleGroup, Exercise[]>();
    for (const ex of filtered) {
      const arr = groups.get(ex.primaryMuscle) ?? [];
      arr.push(ex);
      groups.set(ex.primaryMuscle, arr);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="min-h-dvh pb-24">
      <PageHeader title="Oefeningen" />

      <div className="px-4 pt-2">
        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek oefening..."
            className="w-full h-11 pl-10 pr-4 bg-bg-card border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
          />
        </div>

        {/* Muscle filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 no-scrollbar">
          <button
            onClick={() => setMuscleFilter('')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !muscleFilter ? 'bg-accent text-black' : 'bg-bg-card border border-border text-text-secondary'
            }`}
          >
            Alle
          </button>
          {MUSCLE_GROUPS.map(m => (
            <button
              key={m.id}
              onClick={() => setMuscleFilter(m.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                muscleFilter === m.id ? 'bg-accent text-black' : 'bg-bg-card border border-border text-text-secondary'
              }`}
            >
              {m.labelShort}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div className="flex flex-col gap-4">
          {Array.from(grouped.entries()).map(([muscle, exercises]) => (
            <div key={muscle}>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                {getMuscleLabel(muscle)} ({exercises.length})
              </p>
              <div className="flex flex-col gap-1.5">
                {exercises.map(ex => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    isExpanded={expandedId === ex.id}
                    onToggle={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          {filtered.length} oefeningen
        </p>
      </div>
    </div>
  );
}

function ExerciseCard({
  exercise,
  isExpanded,
  onToggle,
}: {
  exercise: Exercise;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isDangerous = exercise.tier === 'D' || exercise.tier === 'F';

  return (
    <div className={`bg-bg-card border rounded-xl overflow-hidden ${isDangerous ? 'border-danger/30' : 'border-border'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 p-3 text-left"
      >
        <TierBadge tier={exercise.tier} />
        <span className="text-sm font-medium flex-1">{exercise.name}</span>
        <span className="text-[10px] text-text-muted">
          {exercise.category === 'compound' ? 'C' : 'I'}
        </span>
        {isExpanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
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
            <div className="px-3 pb-3 border-t border-border pt-2 flex flex-col gap-2">
              {isDangerous && (
                <div className="p-2 bg-danger-muted rounded-lg">
                  <p className="text-xs text-danger font-medium">
                    Niet aanbevolen. Er zijn betere alternatieven.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>
                  <span className="text-text-muted">Spiergroep:</span>{' '}
                  <span className="text-text-secondary">{getMuscleLabel(exercise.primaryMuscle)}</span>
                </div>
                <div>
                  <span className="text-text-muted">Type:</span>{' '}
                  <span className="text-text-secondary">{exercise.category === 'compound' ? 'Compound' : 'Isolatie'}</span>
                </div>
                {exercise.secondaryMuscles.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-text-muted">Secundair:</span>{' '}
                    <span className="text-text-secondary">
                      {exercise.secondaryMuscles.map(getMuscleLabel).join(', ')}
                    </span>
                  </div>
                )}
                {exercise.isUnilateral && (
                  <div className="col-span-2">
                    <span className="text-accent text-xs font-medium">↔ Unilateraal (L/R apart)</span>
                  </div>
                )}
              </div>

              {exercise.formCues.length > 0 && (
                <div className="mt-1">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Techniek tips</p>
                  <ul className="text-xs text-text-secondary space-y-0.5">
                    {exercise.formCues.map((cue, i) => (
                      <li key={i}>• {cue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
