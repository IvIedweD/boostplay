import { type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RoversGame } from './features/rovers-game/components/RoversGame';
import BoostplayLobbyPage from './features/boostplay/components/BoostplayLobbyPage';
import { BoostplayRoutePage } from './features/boostplay/components/BoostplayRoutePage';
import { useAuth } from './features/boostplay/auth/BoostplayAuthProvider';
import { AdminPage } from './features/boostplay/admin/AdminPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const { authenticated, loading } = useAuth();
  if (loading) return <div role="status" aria-live="polite">Проверяем сессию…</div>;
  return authenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BoostplayLobbyPage />} />
      <Route path="/play" element={<RequireAuth><RoversGame /></RequireAuth>} />
      <Route path="/games/rovers" element={<Navigate to="/play" replace />} />
      <Route path="/leaderboard" element={<BoostplayRoutePage kind="leaderboard" />} />
      <Route path="/boosters" element={<BoostplayRoutePage kind="boosters" />} />
      <Route path="/prizes" element={<BoostplayRoutePage kind="prizes" />} />
      <Route path="/login" element={<BoostplayLobbyPage initialAuthOpen />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
