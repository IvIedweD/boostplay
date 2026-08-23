import BoostplayLobbyPage from './BoostplayLobbyPage';

type RouteKind = 'boosters' | 'leaderboard' | 'prizes';

const dialogByRoute: Record<RouteKind, 'booster' | 'leaderboard' | 'rewards'> = {
  boosters: 'booster',
  leaderboard: 'leaderboard',
  prizes: 'rewards',
};

export function BoostplayRoutePage({ kind }: { kind: RouteKind }) {
  return <BoostplayLobbyPage initialDialog={dialogByRoute[kind]} />;
}
