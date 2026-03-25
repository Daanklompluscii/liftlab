import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, Timer, Dumbbell, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '../components/ui';
import { useStore } from '../store';
import { useProgram } from '../hooks/useProgram';
import { SPLIT_CONFIGS, getRecommendedSplit, EQUIPMENT_LABELS, THEMES, type ThemeId, getTheme, applyTheme } from '../data/constants';
import { generateId } from '../lib/calculations';
import type { Goal, Equipment, ExperienceLevel, TrainingDays, Split } from '../types';

const BASIC_EQUIPMENT: Equipment[] = [
  'dumbbell', 'barbell', 'bodyweight', 'bench_flat', 'bench_incline',
  'kettlebell', 'ez_bar', 'pull_up_bar', 'dip_station', 'resistance_band',
];

const MACHINE_EQUIPMENT: Equipment[] = [
  'cable', 'smith_machine',
  'lat_pulldown', 'leg_press', 'hack_squat', 'pendulum_squat',
  'pec_deck', 'reverse_pec_deck', 'leg_curl', 'leg_extension',
  'hip_thrust_machine', 'hip_abduction_machine',
  'back_extension_bench', 'preacher_curl_bench',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setProfile, setOnboardingComplete, setTheme } = useStore();
  const { generate } = useProgram();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<Goal>('hypertrophy');
  const [days, setDays] = useState<TrainingDays>(4);
  const [split, setSplit] = useState<Split>(getRecommendedSplit(4));
  const [equipment, setEquipment] = useState<Equipment[]>([
    'barbell', 'dumbbell', 'cable', 'bench_flat', 'bench_incline',
    'pull_up_bar', 'bodyweight',
  ]);
  const [experience, setExperience] = useState<ExperienceLevel>('intermediate');
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('steel');

  const handleDaysChange = (d: TrainingDays) => {
    setDays(d);
    setSplit(getRecommendedSplit(d));
  };

  const toggleEquipment = (eq: Equipment) => {
    setEquipment(prev =>
      prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
    );
  };

  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);

    const profile = {
      id: generateId(),
      name: name || 'Atleet',
      goal,
      trainingDaysPerWeek: days,
      split,
      availableEquipment: equipment,
      excludedExercises: [],
      experienceLevel: experience,
      createdAt: new Date(),
    };

    await setProfile(profile);
    setTheme(selectedTheme);
    generate(profile);

    // Fake "AI berekent" loading
    await new Promise(resolve => setTimeout(resolve, 3000));

    setOnboardingComplete(true);
    navigate('/');
  };

  const handleThemeChange = (id: ThemeId) => {
    setSelectedTheme(id);
    // Preview direct
    applyTheme(getTheme(id));
  };

  const canProceed = step === 0 || (step === 3 && equipment.length > 0) || [1, 2, 4, 5].includes(step);

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-bg px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-border" />
            <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Programma wordt gegenereerd...</h2>
            <p className="text-text-secondary text-sm">
              Oefeningen selecteren op basis van jouw doel, apparatuur en ervaring.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {[
              'Spiergroepen analyseren',
              'Optimale oefeningen selecteren',
              'Volume en rust berekenen',
            ].map((text, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.8 }}
                className="flex items-center gap-2 text-sm text-text-secondary"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.8 + 0.6 }}
                  className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0"
                >
                  <Check size={12} className="text-accent" />
                </motion.div>
                {text}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      {/* Progress bar */}
      <div className="px-4 pt-4">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? 'bg-accent' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 pt-8 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {step === 0 && <StepWelcome name={name} setName={setName} />}
            {step === 1 && <StepGoal goal={goal} setGoal={setGoal} />}
            {step === 2 && (
              <StepSchedule
                days={days}
                setDays={handleDaysChange}
                split={split}
                setSplit={setSplit}
              />
            )}
            {step === 3 && (
              <StepEquipment equipment={equipment} toggle={toggleEquipment} />
            )}
            {step === 4 && (
              <StepExperience experience={experience} setExperience={setExperience} />
            )}
            {step === 5 && (
              <StepTheme selectedTheme={selectedTheme} setTheme={handleThemeChange} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-auto pt-6">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(s => s - 1)} size="lg">
              <ChevronLeft size={20} />
            </Button>
          )}
          <Button
            fullWidth
            size="lg"
            onClick={step === 5 ? handleComplete : () => setStep(s => s + 1)}
            disabled={!canProceed}
          >
            {step === 5 ? (
              <>Programma Genereren <Check size={20} /></>
            ) : (
              <>Volgende <ChevronRight size={20} /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Step Components ───

function StepWelcome({ name, setName }: { name: string; setName: (n: string) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Welkom bij <span className="text-accent">LiftLab</span>
        </h1>
        <p className="text-text-secondary text-lg">
          Wetenschappelijk onderbouwd trainen. Geen giswerk.
        </p>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center gap-3 p-3 bg-bg-card rounded-xl border border-border">
          <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center">
            <Target size={20} className="text-accent" />
          </div>
          <p className="text-sm text-text-secondary">Programma's gebaseerd op sportwetenschap</p>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-card rounded-xl border border-border">
          <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center">
            <Zap size={20} className="text-accent" />
          </div>
          <p className="text-sm text-text-secondary">Automatische progressie en deload</p>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-card rounded-xl border border-border">
          <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center">
            <Timer size={20} className="text-accent" />
          </div>
          <p className="text-sm text-text-secondary">Rust timers en voortgang tracking</p>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm text-text-secondary font-medium mb-1 block">
          Hoe heet je? (optioneel)
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Naam"
          className="w-full h-12 px-4 bg-bg-elevated border border-border rounded-xl text-text placeholder:text-text-muted focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-colors"
        />
      </div>
    </div>
  );
}

function StepGoal({ goal, setGoal }: { goal: Goal; setGoal: (g: Goal) => void }) {
  const goals: { id: Goal; icon: typeof Dumbbell; title: string; desc: string }[] = [
    {
      id: 'strength',
      icon: Zap,
      title: 'Kracht',
      desc: '1-5 reps, zwaar gewicht, lange rust. Focus op maximale kracht.',
    },
    {
      id: 'hypertrophy',
      icon: Dumbbell,
      title: 'Spiergroei',
      desc: '6-12 reps, gematigd gewicht. Maximaal volume voor spiermassa.',
    },
    {
      id: 'endurance',
      icon: Timer,
      title: 'Uithoudingsvermogen',
      desc: '12-20+ reps, licht gewicht, korte rust. Meer capaciteit.',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Wat is je doel?</h1>
        <p className="text-text-secondary">Dit bepaalt je reps, sets, rust en progressie.</p>
      </div>

      <div className="flex flex-col gap-3">
        {goals.map(g => (
          <button
            key={g.id}
            onClick={() => setGoal(g.id)}
            className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
              goal === g.id
                ? 'bg-accent-muted border-accent'
                : 'bg-bg-card border-border hover:border-text-muted'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              goal === g.id ? 'bg-accent text-black' : 'bg-bg-elevated text-text-muted'
            }`}>
              <g.icon size={20} />
            </div>
            <div>
              <p className="font-semibold">{g.title}</p>
              <p className="text-sm text-text-secondary mt-0.5">{g.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepSchedule({
  days,
  setDays,
  split,
  setSplit,
}: {
  days: TrainingDays;
  setDays: (d: TrainingDays) => void;
  split: Split;
  setSplit: (s: Split) => void;
}) {
  const dayOptions: TrainingDays[] = [2, 3, 4, 5, 6];

  const availableSplits = SPLIT_CONFIGS.filter(s => s.daysPerWeek.includes(days));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Hoeveel dagen per week?</h1>
        <p className="text-text-secondary">We kiezen de beste split voor jou.</p>
      </div>

      {/* Dagen */}
      <div className="flex gap-2">
        {dayOptions.map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`flex-1 h-14 rounded-xl font-mono text-lg font-bold transition-all ${
              days === d
                ? 'bg-accent text-black'
                : 'bg-bg-card border border-border text-text-secondary hover:border-text-muted'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Split keuze */}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-text-secondary font-medium">Split</p>
        {availableSplits.map(s => (
          <button
            key={s.id}
            onClick={() => setSplit(s.id)}
            className={`flex flex-col p-3 rounded-xl border transition-all text-left ${
              split === s.id
                ? 'bg-accent-muted border-accent'
                : 'bg-bg-card border-border hover:border-text-muted'
            }`}
          >
            <div className="flex items-center gap-2">
              <p className="font-semibold">{s.label}</p>
              {s.recommended.includes(days) && (
                <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-md font-medium">
                  Aanbevolen
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary mt-0.5">{s.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function EquipmentButton({ eq, active, onToggle }: { eq: Equipment; active: boolean; onToggle: (eq: Equipment) => void }) {
  return (
    <button
      onClick={() => onToggle(eq)}
      className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${
        active
          ? 'bg-accent-muted border-accent text-text'
          : 'bg-bg-card border-border text-text-secondary hover:border-text-muted'
      }`}
    >
      {EQUIPMENT_LABELS[eq] ?? eq}
    </button>
  );
}

function StepEquipment({
  equipment,
  toggle,
}: {
  equipment: Equipment[];
  toggle: (eq: Equipment) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Beschikbare apparatuur</h1>
        <p className="text-text-secondary">Selecteer wat je in je gym hebt.</p>
      </div>

      <div>
        <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1.5">Basis</p>
        <div className="grid grid-cols-2 gap-2">
          {BASIC_EQUIPMENT.map(eq => (
            <EquipmentButton key={eq} eq={eq} active={equipment.includes(eq)} onToggle={toggle} />
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      <div>
        <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1.5">Machines & Apparaten</p>
        <div className="grid grid-cols-2 gap-2">
          {MACHINE_EQUIPMENT.map(eq => (
            <EquipmentButton key={eq} eq={eq} active={equipment.includes(eq)} onToggle={toggle} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepExperience({
  experience,
  setExperience,
}: {
  experience: ExperienceLevel;
  setExperience: (e: ExperienceLevel) => void;
}) {
  const levels: { id: ExperienceLevel; title: string; desc: string }[] = [
    {
      id: 'beginner',
      title: 'Beginner',
      desc: 'Minder dan 1 jaar serieus trainen. Focus op techniek leren.',
    },
    {
      id: 'intermediate',
      title: 'Gevorderd',
      desc: '1-3 jaar ervaring. Kent de basis, klaar voor meer volume.',
    },
    {
      id: 'advanced',
      title: 'Expert',
      desc: '3+ jaar. Kent periodisering, RPE, en geavanceerde technieken.',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Ervaring</h1>
        <p className="text-text-secondary">Dit bepaalt je startvolume en progressiesnelheid.</p>
      </div>

      <div className="flex flex-col gap-3">
        {levels.map(l => (
          <button
            key={l.id}
            onClick={() => setExperience(l.id)}
            className={`flex flex-col p-4 rounded-xl border transition-all text-left ${
              experience === l.id
                ? 'bg-accent-muted border-accent'
                : 'bg-bg-card border-border hover:border-text-muted'
            }`}
          >
            <p className="font-semibold">{l.title}</p>
            <p className="text-sm text-text-secondary mt-0.5">{l.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepTheme({
  selectedTheme,
  setTheme,
}: {
  selectedTheme: ThemeId;
  setTheme: (t: ThemeId) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Kies je thema</h1>
        <p className="text-text-secondary">Past direct de hele app aan. Je kunt dit later wijzigen.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {THEMES.map(theme => {
          const isSelected = selectedTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={`flex flex-col p-4 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'border-2'
                  : 'bg-bg-card border-border hover:border-text-muted'
              }`}
              style={isSelected ? { borderColor: theme.accent, backgroundColor: `${theme.accent}10` } : undefined}
            >
              <div className="w-full h-2 rounded-full mb-3" style={{ background: `linear-gradient(to right, ${theme.accent}, ${theme.accentHover})` }} />
              <p className="font-semibold text-sm">{theme.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{theme.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
