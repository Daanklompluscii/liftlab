import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, Trash2, Scale, RefreshCw, Check, User, Wrench, AlertTriangle, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, CardTitle } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { useStore } from '../store';
import { useProgram } from '../hooks/useProgram';
import { db } from '../lib/db';
import { EQUIPMENT_LABELS, THEMES } from '../data/constants';
import { exercises as allExercises } from '../data/exercises';
import type { Equipment } from '../types';

// Basis apparatuur (altijd bovenaan)
const BASIC_EQUIPMENT: Equipment[] = [
  'dumbbell', 'barbell', 'bodyweight', 'bench_flat', 'bench_incline',
  'kettlebell', 'ez_bar', 'pull_up_bar', 'dip_station', 'resistance_band',
];

// Machines & specifiek apparatuur (onder de streep)
const MACHINE_EQUIPMENT: Equipment[] = [
  'cable', 'smith_machine',
  'lat_pulldown', 'leg_press', 'hack_squat', 'pendulum_squat',
  'pec_deck', 'reverse_pec_deck', 'leg_curl', 'leg_extension',
  'hip_thrust_machine', 'hip_abduction_machine',
  'back_extension_bench', 'preacher_curl_bench',
];

export default function Settings() {
  const navigate = useNavigate();
  const { profile, updateProfile, unit, setUnit, timerSoundEnabled, setTimerSoundEnabled, theme, setTheme, setOnboardingComplete } = useStore();
  const { generate } = useProgram();
  const { activeProgram } = useStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEquipmentEdit, setShowEquipmentEdit] = useState(false);
  const [editName, setEditName] = useState(profile?.name ?? '');
  const [exportStatus, setExportStatus] = useState('');
  const [regenStatus, setRegenStatus] = useState('');
  const [equipmentWarning, setEquipmentWarning] = useState('');

  // Check welke equipment het actieve programma nodig heeft
  const programEquipment = new Set<Equipment>();
  if (activeProgram) {
    for (const workout of activeProgram.workouts) {
      for (const ex of workout.exercises) {
        const exercise = allExercises.find(e => e.id === ex.exerciseId);
        if (exercise) {
          for (const eq of exercise.equipment) {
            programEquipment.add(eq);
          }
        }
      }
    }
  }

  const toggleEquipment = (eq: Equipment) => {
    if (!profile) return;
    const current = profile.availableEquipment;
    const isRemoving = current.includes(eq);
    const updated = isRemoving
      ? current.filter(e => e !== eq)
      : [...current, eq];
    updateProfile({ availableEquipment: updated });

    // Warn als verwijderd equipment door programma wordt gebruikt
    if (isRemoving && programEquipment.has(eq)) {
      setEquipmentWarning(`"${EQUIPMENT_LABELS[eq] ?? eq}" wordt gebruikt in je huidige programma. Genereer je programma opnieuw.`);
    } else {
      setEquipmentWarning('');
    }
  };

  const handleExport = async () => {
    try {
      const data = {
        profiles: await db.userProfiles.toArray(),
        programs: await db.programs.toArray(),
        workoutLogs: await db.workoutLogs.toArray(),
        exportedAt: new Date().toISOString(),
        version: 1,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `liftlab-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus('Geëxporteerd!');
      setTimeout(() => setExportStatus(''), 2000);
    } catch {
      setExportStatus('Export mislukt');
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (data.profiles) await db.userProfiles.bulkPut(data.profiles);
        if (data.programs) await db.programs.bulkPut(data.programs);
        if (data.workoutLogs) await db.workoutLogs.bulkPut(data.workoutLogs);

        setExportStatus('Geïmporteerd! Herlaad de app.');
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        setExportStatus('Import mislukt — ongeldig bestand');
      }
    };
    input.click();
  };

  const handleDeleteAll = async () => {
    await db.userProfiles.clear();
    await db.programs.clear();
    await db.workoutLogs.clear();
    localStorage.clear();
    setOnboardingComplete(false);
    navigate('/onboarding');
  };

  const handleRegenerate = async () => {
    if (!profile) return;
    setRegenStatus('Genereren...');
    // Small delay for UX feedback
    await new Promise(r => setTimeout(r, 500));
    generate(profile);
    setRegenStatus('Nieuw programma gegenereerd!');
    setTimeout(() => setRegenStatus(''), 2500);
  };

  const handleSaveName = () => {
    updateProfile({ name: editName || 'Atleet' });
    setShowProfileEdit(false);
  };

  return (
    <div className="min-h-dvh pb-28">
      <PageHeader title="Instellingen" />

      <div className="px-4 pt-2 flex flex-col gap-4">
        {/* Profiel */}
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Profiel</CardTitle>
            <button
              onClick={() => setShowProfileMenu(m => !m)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                showProfileMenu ? 'bg-accent/15 text-accent' : 'hover:bg-bg-elevated text-text-muted'
              }`}
              aria-label="Profiel instellingen"
            >
              <Settings2 size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-2 mt-3">
            {profile ? (
              <>
                <InfoRow label="Naam" value={profile.name || 'Atleet'} />
                <InfoRow label="Doel" value={
                  profile.goal === 'strength' ? 'Kracht' :
                  profile.goal === 'hypertrophy' ? 'Spiergroei' : 'Uithoudingsvermogen'
                } />
                <InfoRow label="Dagen/week" value={`${profile.trainingDaysPerWeek}`} />
                <InfoRow label="Split" value={profile.split.replace('_', '/').toUpperCase()} />
                <InfoRow label="Ervaring" value={
                  profile.experienceLevel === 'beginner' ? 'Beginner' :
                  profile.experienceLevel === 'intermediate' ? 'Gevorderd' : 'Expert'
                } />
              </>
            ) : (
              <p className="text-text-muted text-sm">Geen profiel gevonden.</p>
            )}
          </div>
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border">
                  <Button variant="secondary" size="sm" fullWidth onClick={() => { setEditName(profile?.name ?? ''); setShowProfileEdit(true); setShowProfileMenu(false); }}>
                    <User size={14} /> Profiel Bewerken
                  </Button>
                  <Button variant="secondary" size="sm" fullWidth onClick={() => { setShowRegenConfirm(true); setShowProfileMenu(false); }}>
                    <RefreshCw size={14} /> Programma Hergenereren
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {regenStatus && (
            <p className="text-xs text-accent mt-2 flex items-center gap-1">
              {regenStatus.includes('!') && <Check size={12} />} {regenStatus}
            </p>
          )}
        </Card>

        {/* Apparatuur */}
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Apparatuur</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowEquipmentEdit(!showEquipmentEdit)}>
              <Wrench size={14} /> {showEquipmentEdit ? 'Sluiten' : 'Bewerken'}
            </Button>
          </div>
          {!showEquipmentEdit ? (
            <p className="text-sm text-text-secondary mt-2">
              {profile?.availableEquipment.map(eq => EQUIPMENT_LABELS[eq] ?? eq).join(', ') || 'Geen apparatuur geselecteerd'}
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {/* Warning */}
              <AnimatePresence>
                {equipmentWarning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-accent-muted border border-accent/30 rounded-xl flex items-start gap-2"
                  >
                    <AlertTriangle size={14} className="text-accent shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-accent font-medium">{equipmentWarning}</p>
                      <Button size="sm" className="mt-2" onClick={() => { handleRegenerate(); setEquipmentWarning(''); }}>
                        <RefreshCw size={12} /> Hergenereren
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Basis */}
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1.5">Basis</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {BASIC_EQUIPMENT.map(eq => (
                    <EquipmentToggle key={eq} eq={eq} active={profile?.availableEquipment.includes(eq) ?? false} onToggle={toggleEquipment} />
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Machines */}
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1.5">Machines & Apparaten</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {MACHINE_EQUIPMENT.map(eq => (
                    <EquipmentToggle key={eq} eq={eq} active={profile?.availableEquipment.includes(eq) ?? false} onToggle={toggleEquipment} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Thema */}
        <Card>
          <CardTitle>Thema</CardTitle>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {THEMES.map(t => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                    isActive ? 'border-2' : 'bg-bg-elevated border-border hover:border-text-muted'
                  }`}
                  style={isActive ? { borderColor: t.accent, backgroundColor: `${t.accent}10` } : undefined}
                >
                  <div className="w-7 h-7 rounded-full" style={{ backgroundColor: t.accent }} />
                  <span className={`text-[10px] font-medium ${isActive ? 'text-text' : 'text-text-muted'}`}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Eenheden */}
        <Card>
          <CardTitle>Eenheid</CardTitle>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setUnit('kg')}
              className={`flex-1 h-11 rounded-xl font-medium text-sm transition-colors ${
                unit === 'kg' ? 'bg-accent text-black' : 'bg-bg-elevated border border-border text-text-secondary'
              }`}
            >
              <Scale size={14} className="inline mr-1" /> Kilogram
            </button>
            <button
              onClick={() => setUnit('lbs')}
              className={`flex-1 h-11 rounded-xl font-medium text-sm transition-colors ${
                unit === 'lbs' ? 'bg-accent text-black' : 'bg-bg-elevated border border-border text-text-secondary'
              }`}
            >
              <Scale size={14} className="inline mr-1" /> Pounds
            </button>
          </div>
        </Card>

        {/* Timer geluid */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rust Timer Geluid</CardTitle>
              <p className="text-xs text-text-muted mt-0.5">Trillen als rust voorbij is</p>
            </div>
            <button
              onClick={() => setTimerSoundEnabled(!timerSoundEnabled)}
              className={`w-14 h-8 rounded-full transition-colors ${
                timerSoundEnabled ? 'bg-accent' : 'bg-bg-elevated border border-border'
              }`}
            >
              <motion.div
                className="w-6 h-6 bg-white rounded-full shadow-md"
                animate={{ x: timerSoundEnabled ? 28 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </Card>

        {/* Data */}
        <Card>
          <CardTitle>Data</CardTitle>
          <div className="flex flex-col gap-2 mt-3">
            <Button variant="secondary" size="sm" fullWidth onClick={handleExport}>
              <Download size={14} /> Data Exporteren (JSON)
            </Button>
            <Button variant="secondary" size="sm" fullWidth onClick={handleImport}>
              <Upload size={14} /> Data Importeren
            </Button>
            {exportStatus && (
              <p className="text-xs text-accent text-center">{exportStatus}</p>
            )}
          </div>
        </Card>

        {/* Danger zone */}
        <Card>
          <CardTitle>Gevarenzone</CardTitle>
          <Button
            variant="danger"
            size="sm"
            fullWidth
            className="mt-3"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={14} /> Alle Data Wissen
          </Button>
        </Card>
      </div>

      {/* Profile Edit Popup */}
      <AnimatePresence>
        {showProfileEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-bg-card border border-border rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-bold mb-4">Profiel Bewerken</h3>
              <label className="text-sm text-text-secondary font-medium mb-1.5 block">Naam</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Naam"
                autoFocus
                className="w-full h-12 px-4 bg-bg-elevated border border-border rounded-xl text-text placeholder:text-text-muted focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-colors mb-4"
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              />
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setShowProfileEdit(false)}>
                  Annuleren
                </Button>
                <Button fullWidth onClick={handleSaveName}>
                  Opslaan
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Regen Confirm */}
      <AnimatePresence>
        {showRegenConfirm && (
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
              <h3 className="text-lg font-bold mb-2">Programma hergenereren?</h3>
              <p className="text-sm text-text-secondary mb-6">
                Je huidige programma wordt vervangen door een nieuw programma. Je trainingsgeschiedenis blijft bewaard.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setShowRegenConfirm(false)}>
                  Annuleren
                </Button>
                <Button fullWidth onClick={() => { handleRegenerate(); setShowRegenConfirm(false); }}>
                  Hergenereren
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
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
              <h3 className="text-lg font-bold mb-2">Alle data wissen?</h3>
              <p className="text-sm text-text-secondary mb-6">
                Dit verwijdert al je trainingsdata, programma's en instellingen. Dit kan niet ongedaan worden.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setShowDeleteConfirm(false)}>
                  Annuleren
                </Button>
                <Button variant="danger" fullWidth onClick={handleDeleteAll}>
                  Wissen
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function EquipmentToggle({ eq, active, onToggle }: { eq: Equipment; active: boolean; onToggle: (eq: Equipment) => void }) {
  return (
    <button
      onClick={() => onToggle(eq)}
      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
        active
          ? 'bg-accent-muted border-accent text-text'
          : 'bg-bg-elevated border-border text-text-secondary hover:border-text-muted'
      }`}
    >
      {EQUIPMENT_LABELS[eq] ?? eq}
    </button>
  );
}
