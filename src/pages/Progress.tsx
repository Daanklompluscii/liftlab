import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { TrendingUp, BarChart3, Activity, Trophy, Calendar } from 'lucide-react';
import { Card, CardTitle } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { useProgress } from '../hooks/useProgress';
import { exercises as allExercises } from '../data/exercises';
import { MUSCLE_GROUPS, getMuscleLabel } from '../data/constants';
import { formatDateShort } from '../lib/calculations';

export default function Progress() {
  const { loading, get1RMProgress, getWeeklyVolume, getHeatmapData, getAllPRs, totalWorkouts } = useProgress();
  const [selectedExercise, setSelectedExercise] = useState('');

  const exerciseMap = useMemo(
    () => new Map(allExercises.map(e => [e.id, e])),
    []
  );
  const muscleMap = useMemo(
    () => new Map(allExercises.map(e => [e.id, e.primaryMuscle])),
    []
  );

  // Compounds voor 1RM chart
  const compounds = allExercises.filter(e => e.category === 'compound' && ['S+', 'S', 'A'].includes(e.tier));
  const selected = selectedExercise || compounds[0]?.id || '';
  const progressData = get1RMProgress(selected);
  const volumeData = getWeeklyVolume(muscleMap);
  const prs = getAllPRs(muscleMap);
  const heatmap = getHeatmapData();

  // Radar data
  const radarData = MUSCLE_GROUPS
    .filter(m => !['obliques', 'lower_back', 'forearms', 'traps'].includes(m.id))
    .map(m => ({
      muscle: m.labelShort,
      sets: volumeData.find(v => v.muscle === m.id)?.sets ?? 0,
    }));

  if (loading) {
    return (
      <div className="min-h-dvh pb-24">
        <PageHeader title="Voortgang" />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-24">
      <PageHeader title="Voortgang" />

      <div className="px-4 pt-2 flex flex-col gap-4">
        {/* 1RM Progress */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-accent" />
            <CardTitle>Geschat 1RM</CardTitle>
          </div>

          <select
            value={selected}
            onChange={e => setSelectedExercise(e.target.value)}
            className="w-full h-10 px-3 mb-3 bg-bg-elevated border border-border rounded-lg text-sm text-text focus:outline-none focus:border-border-focus"
          >
            {compounds.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>

          {progressData.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={progressData.data}>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#71717A', fontSize: 10 }} tickFormatter={v => formatDateShort(new Date(v))} />
                <YAxis tick={{ fill: '#71717A', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 12 }}
                  labelStyle={{ color: '#A1A1AA' }}
                  formatter={(value) => [`${value}kg`, 'e1RM']}
                />
                <Line type="monotone" dataKey="estimated1RM" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-sm text-center py-8">Nog geen data. Start met trainen!</p>
          )}
        </Card>

        {/* Weekly Volume */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-accent" />
            <CardTitle>Volume per Spiergroep (deze week)</CardTitle>
          </div>

          {volumeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeData.map(v => ({ ...v, muscle: getMuscleLabel(v.muscle as any) }))}>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
                <XAxis dataKey="muscle" tick={{ fill: '#71717A', fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#71717A', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 12 }}
                  formatter={(value) => [`${value} sets`, 'Sets']}
                />
                <Bar dataKey="sets" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-sm text-center py-8">Nog geen data.</p>
          )}
        </Card>

        {/* Muscle Balance Radar */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-accent" />
            <CardTitle>Spiergroep Balans</CardTitle>
          </div>

          {radarData.some(d => d.sets > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#27272A" />
                <PolarAngleAxis dataKey="muscle" tick={{ fill: '#71717A', fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fill: '#71717A', fontSize: 9 }} />
                <Radar dataKey="sets" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-sm text-center py-8">Nog geen data.</p>
          )}
        </Card>

        {/* PR's */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-success" />
            <CardTitle>Personal Records</CardTitle>
          </div>

          {prs.length > 0 ? (
            <div className="flex flex-col gap-2">
              {prs.map(pr => {
                const exercise = exerciseMap.get(pr.exerciseId);
                return (
                  <div key={pr.exerciseId} className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-sm">{exercise?.name ?? pr.exerciseId}</span>
                      <span className="text-xs text-text-muted ml-2">
                        {pr.weight}kg × {pr.reps}
                      </span>
                    </div>
                    <span className="font-mono text-sm text-success font-bold">
                      {pr.estimated1RM}kg
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-4">Nog geen PR's.</p>
          )}
        </Card>

        {/* Heatmap (simplified) */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-accent" />
            <CardTitle>Trainingskalender</CardTitle>
          </div>
          <div className="flex flex-wrap gap-1">
            {generateCalendarDays().map(day => {
              const count = heatmap.get(day) ?? 0;
              return (
                <div
                  key={day}
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: count === 0 ? '#27272A' : count === 1 ? '#F59E0B40' : '#F59E0B',
                  }}
                  title={`${day}: ${count} trainingen`}
                />
              );
            })}
          </div>
          <p className="text-xs text-text-muted mt-2">{totalWorkouts} trainingen totaal</p>
        </Card>
      </div>
    </div>
  );
}

function generateCalendarDays(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}
