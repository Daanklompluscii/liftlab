import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BottomNav } from './components/layout/BottomNav';
import { useStore } from './store';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import ActiveWorkout from './pages/ActiveWorkout';
import ProgramView from './pages/ProgramView';
import Progress from './pages/Progress';
import ExerciseLibrary from './pages/ExerciseLibrary';
import Education from './pages/Education';
import Settings from './pages/Settings';

export default function App() {
  const { onboardingComplete, loadProfile, loadActiveProgram } = useStore();

  useEffect(() => {
    loadProfile();
    loadActiveProgram();
  }, [loadProfile, loadActiveProgram]);

  return (
    <BrowserRouter>
      <div className="min-h-dvh bg-bg">
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          {!onboardingComplete ? (
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          ) : (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workout/:workoutId" element={<ActiveWorkout />} />
              <Route path="/program" element={<ProgramView />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/exercises" element={<ExerciseLibrary />} />
              <Route path="/learn" element={<Education />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
        {onboardingComplete && <BottomNav />}
      </div>
    </BrowserRouter>
  );
}
