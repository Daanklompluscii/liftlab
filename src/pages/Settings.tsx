import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, Trash2, Scale, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, CardTitle } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { useStore } from '../store';
import { useProgram } from '../hooks/useProgram';
import { db } from '../lib/db';

export default function Settings() {
  const navigate = useNavigate();
  const { profile, unit, setUnit, timerSoundEnabled, setTimerSoundEnabled, setOnboardingComplete } = useStore();
  const { generate } = useProgram();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

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

  const handleRegenerate = () => {
    if (profile) {
      generate(profile);
    }
  };

  return (
    <div className="min-h-dvh pb-24">
      <PageHeader title="Instellingen" />

      <div className="px-4 pt-2 flex flex-col gap-4">
        {/* Profiel */}
        <Card>
          <CardTitle>Profiel</CardTitle>
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
          <div className="flex gap-2 mt-3">
            <Button variant="secondary" size="sm" onClick={() => navigate('/onboarding')}>
              Profiel Bewerken
            </Button>
            <Button variant="secondary" size="sm" onClick={handleRegenerate}>
              <RefreshCw size={14} /> Programma Hergenereren
            </Button>
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
