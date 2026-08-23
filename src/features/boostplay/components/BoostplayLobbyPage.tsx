import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { boostplayAssets } from '../../../assets/boostplay/assets';
import { boosterVisualCatalog } from '../../../assets/boostplay/cosmetics/catalog';
import { PlayerAvatar } from '../../profile/components/PlayerAvatar';
import { usePlayerProfile } from '../../player-profile/hooks/usePlayerProfile';
import { boostplayActivities, formatBoostplayScore } from '../data/mockBoostplayData';
import { getBoostplayLobbyData } from '../data/lobbyDataAdapter';
import { loadActivityPointHistory, loadBoostplaySeason, loadRoversLeaderboard, purchaseRoversBoosters, type ActivityPointHistoryEntry, type PublicSeasonSettings } from '../data/supabaseGameData';
import type { BoostplayLeaderboardEntry } from '../types';
import { loadActivityPoints, saveActivityPoints } from '../services/activityPointsStorage';
import {
  EMPTY_ROVERS_BOOSTER_LOADOUT,
  getRoversBoosterCost,
  saveRoversBoosterLoadout,
  type RoversBoosterLoadout,
} from '../../rovers-game/services/roversBoosterSession';
import { BoosterSelectionDialog } from './BoosterSelectionDialog';
import { BoostplayAuthDialog } from './BoostplayAuthDialog';
import { BoostplayDialog } from './BoostplayDialog';
import { useAuth } from '../auth/BoostplayAuthProvider';
import './boostplay.css';

type DialogKind = 'auth' | 'logout' | 'season' | 'booster' | 'booster-selection' | 'activity-history' | 'rules' | 'activities' | 'leaderboard' | 'rewards' | 'notifications' | 'settings' | null;

type IconName = 'clock' | 'bell' | 'settings' | 'user' | 'logout' | 'trophy' | 'award' | 'chevron' | 'play' | 'external' | 'gift' | 'zap' | 'activity' | 'eye' | 'check' | 'star' | 'crown' | 'info';

function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.55 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.18 15a1.7 1.7 0 0 0-.6-1A1.7 1.7 0 0 0 2.5 13.6H2v-4h.5A1.7 1.7 0 0 0 4.18 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.55 3.6a1.7 1.7 0 0 0 1-.6A1.7 1.7 0 0 0 9.95 2H14a1.7 1.7 0 0 0 .4 1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.8 8a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.5v4h-.5a1.7 1.7 0 0 0-1.1.4 1.7 1.7 0 0 0-1 1.2Z" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4" /></>,
    award: <><circle cx="12" cy="8" r="5" /><path d="m8.5 12-1 9 4.5-3 4.5 3-1-9" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    play: <path d="m8 5 11 7-11 7V5Z" />,
    external: <><path d="M15 3h6v6M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
    gift: <><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13M3 12h18M7.5 8C5 8 4 6.8 4 5.5S5 3 6.5 3C9 3 12 8 12 8s3-5 5.5-5C19 3 20 4.2 20 5.5S19 8 16.5 8" /></>,
    zap: <path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z" />,
    activity: <path d="M3 12h4l2.5-7 5 14 2.5-7h4" />,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    star: <path d="m12 2.7 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.3l6.2-.9L12 2.7Z" />,
    crown: <path d="m3 7 4 4 5-7 5 7 4-4-2 11H5L3 7Zm3 14h12" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
  };
  return <svg className={`bp-lucide ${className}`} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const ACTIVITY_REASON_LABELS: Record<string, string> = {
  activity_reward: 'Награда за активность',
  booster_purchase: 'Покупка бустера',
  admin_grant: 'Начисление администратора',
  admin_adjustment: 'Корректировка баланса',
  refund: 'Возврат очков',
};

function formatActivityHistoryDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

const PARTICLE_COLORS = [
  ['#7c6cff', '#55d9f4', '#ffffff'],
  ['#55d9f4', '#7c6cff', '#ffbf47'],
  ['#ffbf47', '#7c6cff', '#ffffff'],
] as const;

function ParticleLayer({ count, palette = 0 }: { count: number; palette?: number }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, index) => {
    const seed = (index + 1) * (palette + 7) * 19;
    return {
      left: 5 + (seed * 17) % 90,
      top: 12 + (seed * 29) % 82,
      size: 1.5 + ((seed * 7) % 25) / 10,
      duration: 11 + (seed % 90) / 10,
      delay: -((seed * 13) % 160) / 10,
      drift: -14 + (seed * 11) % 28,
      color: PARTICLE_COLORS[palette % PARTICLE_COLORS.length][index % 3],
    };
  }), [count, palette]);

  return <div className="bp-particles" aria-hidden="true">{particles.map((particle, index) => (
    <i key={index} style={{
      '--particle-color': particle.color,
      '--particle-duration': `${particle.duration}s`,
      '--particle-delay': `${particle.delay}s`,
      '--particle-drift': `${particle.drift}px`,
      left: `${particle.left}%`,
      top: `${particle.top}%`,
      width: particle.size,
      height: particle.size,
    } as CSSProperties} />
  ))}</div>;
}

function BentoCard({ children, className = '', palette = 0, hero = false, onClick }: { children: ReactNode; className?: string; palette?: number; hero?: boolean; onClick?: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const onMove = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const maxTilt = hero ? 1 : .6;
    const tiltX = ((y - centerY) / centerY) * maxTilt;
    const tiltY = ((centerX - x) / centerX) * maxTilt;
    const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
    card.style.setProperty('--glow-angle', `${angle + 90}deg`);
    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-1.5px)`;
    const layer = card.querySelector<HTMLElement>('.bp-parallax');
    if (layer) {
      const travel = hero ? 2.5 : 1.5;
      layer.style.transform = `translate(${((x - centerX) / centerX) * travel}px, ${((y - centerY) / centerY) * travel}px)`;
    }
  }, [hero]);
  const onLeave = useCallback(() => {
    const card = ref.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    const layer = card.querySelector<HTMLElement>('.bp-parallax');
    if (layer) layer.style.transform = 'translate(0, 0)';
  }, []);

  return <section ref={ref} className={`bp-bento-card${hero ? ' is-hero' : ''} ${className}`} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick}>
    <div className="bp-card-glow" aria-hidden="true" />
    {hero && <div className="bp-hero-aura" aria-hidden="true" />}
    <div className="bp-card-spotlight" aria-hidden="true" />
    <ParticleLayer count={hero ? 20 : 11} palette={palette} />
    <div className="bp-card-content">{children}</div>
  </section>;
}

export default function BoostplayLobbyPage({
  initialAuthOpen = false,
  initialDialog = null,
}: {
  initialAuthOpen?: boolean;
  initialDialog?: 'booster' | 'leaderboard' | 'rewards' | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const profile = usePlayerProfile();
  const [serverLeaderboard, setServerLeaderboard] = useState<readonly BoostplayLeaderboardEntry[] | null>(null);
  const [serverSeason, setServerSeason] = useState<PublicSeasonSettings | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState('');
  const [leaderboardRequest, setLeaderboardRequest] = useState(0);
  const [seasonLoading, setSeasonLoading] = useState(true);
  const [seasonError, setSeasonError] = useState('');
  const [seasonRequest, setSeasonRequest] = useState(0);
  const [seasonClock, setSeasonClock] = useState(() => Date.now());
  const data = useMemo(
    () => getBoostplayLobbyData(profile, auth.user, serverLeaderboard, serverSeason, seasonClock),
    [auth.user, profile, seasonClock, serverLeaderboard, serverSeason],
  );
  const [dialog, setDialog] = useState<DialogKind>(initialAuthOpen ? 'auth' : initialDialog);
  const [boosterLoadout, setBoosterLoadout] = useState<RoversBoosterLoadout>(EMPTY_ROVERS_BOOSTER_LOADOUT);
  const [activityPoints, setActivityPoints] = useState(() => auth.user?.activityPoints ?? loadActivityPoints());
  const [boosterPurchasePending, setBoosterPurchasePending] = useState(false);
  const [boosterPurchaseError, setBoosterPurchaseError] = useState('');
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [activityHistory, setActivityHistory] = useState<ActivityPointHistoryEntry[]>([]);
  const [activityHistoryPending, setActivityHistoryPending] = useState(false);
  const [activityHistoryError, setActivityHistoryError] = useState('');
  const availableActivityPoints = Math.max(0, auth.user?.activityPoints ?? activityPoints);
  const leaderboardListRef = useRef<HTMLDivElement>(null);
  const currentPlayerRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLeaderboardLoading(true);
      setLeaderboardError('');
    });
    loadRoversLeaderboard(auth.user?.id ?? null)
      .then((entries) => { if (active) setServerLeaderboard(entries); })
      .catch((reason: unknown) => {
        if (!active) return;
        setServerLeaderboard(null);
        setLeaderboardError(reason instanceof Error ? reason.message : 'Не удалось загрузить таблицу.');
      })
      .finally(() => { if (active) setLeaderboardLoading(false); });
    return () => { active = false; };
  }, [auth.user?.id, leaderboardRequest]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setSeasonLoading(true);
      setSeasonError('');
    });
    loadBoostplaySeason()
      .then((season) => { if (active) setServerSeason(season); })
      .catch((reason: unknown) => {
        if (!active) return;
        setServerSeason(null);
        setSeasonError(reason instanceof Error ? reason.message : 'Не удалось загрузить сезон.');
      })
      .finally(() => { if (active) setSeasonLoading(false); });
    return () => { active = false; };
  }, [seasonRequest]);

  useEffect(() => {
    const timer = window.setInterval(() => setSeasonClock(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'BOOSTPLAY — игровое сообщество';
    const pauseAnimations = () => document.getAnimations().forEach((animation) => document.hidden ? animation.pause() : animation.play());
    document.addEventListener('visibilitychange', pauseAnimations);
    return () => {
      document.title = previousTitle;
      document.removeEventListener('visibilitychange', pauseAnimations);
    };
  }, []);

  useEffect(() => {
    if (dialog !== 'leaderboard') return;
    const frame = window.requestAnimationFrame(() => {
      const list = leaderboardListRef.current;
      if (!auth.authenticated) {
        if (list) list.scrollTop = 0;
        return;
      }
      const row = currentPlayerRowRef.current;
      if (!list || !row) return;
      const rows = Array.from(list.children) as HTMLElement[];
      const rowIndex = rows.indexOf(row);
      const firstVisibleRow = rows[Math.max(0, rowIndex - 2)] ?? row;
      const rowTop = firstVisibleRow.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
      list.scrollTop = rowTop;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [auth.authenticated, dialog]);

  const boosterImage = boosterVisualCatalog.find((item) => item.id === 'booster_hh')?.imageUrl;
  const referralCode = useMemo(() => new URLSearchParams(location.search).get('ref'), [location.search]);
  const leaderboard = data.leaderboard.slice(0, 3);
  const startRovers = async (loadout: RoversBoosterLoadout) => {
    if (!auth.authenticated) {
      setDialog('auth');
      return;
    }
    const cost = getRoversBoosterCost(loadout);
    if (cost > availableActivityPoints) return;
    setBoosterPurchasePending(true);
    setBoosterPurchaseError('');
    try {
      const purchase = await purchaseRoversBoosters(loadout, auth.user!.id);
      if (purchase) {
        setActivityPoints(purchase.activityPoints);
        auth.updateActivityPoints(purchase.activityPoints);
        saveRoversBoosterLoadout(purchase.loadout);
      } else {
        const localBalance = saveActivityPoints(availableActivityPoints - cost);
        setActivityPoints(localBalance);
        auth.updateActivityPoints(localBalance);
        saveRoversBoosterLoadout({ ...loadout, activationId: null });
      }
      navigate('/play');
    } catch (reason) {
      setBoosterPurchaseError(reason instanceof Error ? reason.message : 'Не удалось подготовить бустеры.');
    } finally {
      setBoosterPurchasePending(false);
    }
  };

  const requestGameStart = () => setDialog(auth.authenticated ? 'booster-selection' : 'auth');
  const openActivityHistory = async () => {
    if (!auth.user) return;
    setDialog('activity-history');
    setActivityHistoryPending(true);
    setActivityHistoryError('');
    try {
      setActivityHistory(await loadActivityPointHistory(auth.user.id));
    } catch (reason) {
      setActivityHistoryError(reason instanceof Error ? reason.message : 'Не удалось загрузить историю очков.');
    } finally {
      setActivityHistoryPending(false);
    }
  };
  const logout = async () => {
    setLogoutPending(true);
    setLogoutError('');
    try {
      await auth.continueAsGuest();
      setDialog(null);
    } catch (reason) {
      setLogoutError(reason instanceof Error ? reason.message : 'Не удалось выйти. Попробуйте ещё раз.');
    } finally {
      setLogoutPending(false);
    }
  };

  return <div className="bp-page">
    <div className="bp-gradient-bg" aria-hidden="true"><i /><i /></div>
    <div className="bp-page-vignette" aria-hidden="true" />

    <div className="bp-shell">
      <header className="bp-club-header">
        <Link to="/" className="bp-club-brand"><strong>BOOSTPLAY</strong><span><i /> Lobby Clubhouse</span></Link>
        <button type="button" className={`bp-season-chip${seasonLoading ? ' is-loading' : ''}${seasonError ? ' is-error' : ''}`} disabled={seasonLoading} aria-busy={seasonLoading} onClick={() => setDialog('season')}>
          <Icon name="clock" /><span><small>Завершение сезона</small><strong>{seasonLoading ? 'Загружаем…' : seasonError ? 'Данные недоступны' : data.seasonEndsIn}</strong></span>
        </button>
        <div className="bp-header-actions">
          <button type="button" aria-label="Уведомления" onClick={() => setDialog('notifications')}><Icon name="bell" /></button>
          <button type="button" aria-label="Настройки" onClick={() => setDialog('settings')}><Icon name="settings" /></button>
        </div>
      </header>

      <main className="bp-bento" aria-label="Главная страница BOOSTPLAY">
        <div className="bp-bento-left">
          <BentoCard className="bp-profile-card" palette={0}>
            {auth.loading ? <div className="bp-profile-loading" role="status" aria-live="polite" aria-label="Загрузка профиля">
              <span className="bp-profile-loading__avatar" aria-hidden="true" />
              <span className="bp-profile-loading__name" aria-hidden="true" />
              <div className="bp-profile-loading__stats" aria-hidden="true"><i /><i /></div>
              <span className="bp-profile-loading__balance" aria-hidden="true" />
              <small>Загружаем профиль…</small>
            </div> : auth.authenticated ? <>
              <PlayerAvatar avatarId={data.player.avatarId} frameId={data.player.frameId} size={172} playerName={data.player.displayName} />
              <h2>{data.player.displayName}</h2>
              <button type="button" className="bp-profile-logout" aria-label="Выйти из аккаунта" title="Выйти из аккаунта" onClick={() => setDialog('logout')}><Icon name="logout" /></button>
              <div className="bp-profile-stats">
                <div className="is-rank"><small>Место в таблице</small><strong><Icon name="trophy" /> {data.player.rank > 0 ? `#${data.player.rank}` : '—'}</strong></div>
                <div><small>Лучший результат</small><strong className="is-score"><Icon name="award" /> {formatBoostplayScore(data.player.bestScore)}</strong></div>
              </div>
              <button type="button" className="bp-activity-balance" onClick={openActivityHistory} aria-label={`Открыть историю очков активности. Текущий баланс: ${availableActivityPoints}`}>
                <Icon name="zap" />
                <span><small>Очки активности</small><em>Нажмите, чтобы открыть историю</em></span>
                <strong>{availableActivityPoints}</strong>
              </button>
            </> : <div className="bp-guest-profile">
              <div className="bp-guest-profile__icon"><i /><Icon name="user" /></div>
              <small>Личный кабинет</small>
              <h2>Войдите в BOOSTPLAY</h2>
              <p>Сохраняйте результаты, участвуйте в рейтинге и используйте очки активности.</p>
              <button type="button" onClick={() => setDialog('auth')}><Icon name="user" />Войти или зарегистрироваться</button>
              <div><span><Icon name="trophy" />Рейтинг</span><span><Icon name="zap" />Бустеры</span></div>
            </div>}
          </BentoCard>

          <BentoCard className="bp-booster-card" palette={1}>
            <div className="bp-booster-orb">{boosterImage && <img src={boosterImage} alt="Усиление наград" />}</div>
            <div className="bp-booster-copy">
              <small>Бустеры</small><h3>Усиление наград</h3>
              <p>Временно увеличивают очки за игру.</p>
              <em>Можно получить за активности сообщества.</em>
              <button type="button" onClick={() => setDialog('booster')}>Как это работает? <Icon name="chevron" /></button>
            </div>
          </BentoCard>
        </div>

        <BentoCard className="bp-hero-card" palette={1} hero>
          <div className="bp-hero-copy">
            <small>Playable Now</small>
            <h1>РОВЕРЫ</h1>
            <p>Собирай, объединяй и улучшай милых роботов-роверов. Соревнуйся и побеждай!</p>
            <div className="bp-hero-actions">
              <button type="button" className="bp-play-cta" onClick={requestGameStart}><span>ИГРАТЬ</span><Icon name="play" /></button>
              <button type="button" onClick={() => setDialog('rules')}>Правила</button>
            </div>
          </div>
          <div className="bp-hero-art bp-parallax"><i /><img src={boostplayAssets.artwork.scanner} alt="Ровер-сканер" /></div>
        </BentoCard>

        <BentoCard className="bp-activities-card" palette={0}>
          <header><h2>Активности</h2><button type="button" className="bp-activities-info-button" aria-label="Информация об активностях" onClick={() => setDialog('activities')}><Icon name="info" /></button></header>
          <div className="bp-activity-stack">
            {[boostplayActivities[1], boostplayActivities[0]].map((activity) => <button key={activity.id} type="button" onClick={() => setDialog('activities')}>
              <img className="bp-community-avatar" src={activity.imageUrl} alt="" />
              <span><strong>{activity.source}</strong><small>{activity.cardSubtitle}</small></span>
              <b>×2</b>
            </button>)}
          </div>
        </BentoCard>

        <BentoCard className="bp-leader-card" palette={1}>
          <header><h2>Турнирная таблица</h2><button type="button" onClick={() => setDialog('leaderboard')}>Смотреть все</button></header>
          {leaderboardLoading ? <div className="bp-data-state is-loading" role="status">Загружаем результаты…</div>
            : leaderboardError ? <div className="bp-data-state is-error" role="alert"><span>Рейтинг временно недоступен</span><button type="button" onClick={() => setLeaderboardRequest((value) => value + 1)}>Повторить</button></div>
              : leaderboard.length === 0 ? <div className="bp-data-state"><span>Результатов пока нет</span><small>Станьте первым участником сезона.</small></div>
                : <ol>{leaderboard.map((entry) => <li key={entry.playerId} className={`place-${entry.rank}`}>
            <b>{entry.rank}</b><span>{entry.avatarUrl ? <img src={entry.avatarUrl} alt="" /> : entry.displayName.slice(0, 1)}</span><strong>{entry.displayName}</strong><em>{formatBoostplayScore(entry.score)}</em>
          </li>)}</ol>}
        </BentoCard>

        <BentoCard className="bp-rewards-card" palette={2}>
          <header><h2><Icon name="gift" /> Награды</h2><button type="button" onClick={() => setDialog('rewards')}>Инфо</button></header>
          <div className="bp-reward-list">
            {['Доставочный ровер', 'Футболка Яндекса', 'Набор носков'].map((title, index) => <div key={title} className={`place-${index + 1}`}><b><Icon name="award" /></b><span><strong>{index + 1} место</strong><small>{title}</small></span></div>)}
          </div>
          <footer>Только за ваш скилл</footer>
        </BentoCard>
      </main>
    </div>

    {dialog === 'season' && <BoostplayDialog title={seasonError ? 'Сезон недоступен' : data.seasonTitle} eyebrow="Завершение сезона" onClose={() => setDialog(null)}>
      {seasonError
        ? <div className="bp-dialog-data-state is-error" role="alert"><p>Не удалось получить актуальные сроки сезона.</p><button type="button" onClick={() => setSeasonRequest((value) => value + 1)}>Повторить</button></div>
        : <p>До завершения сезона осталось <b>{data.seasonEndsIn}</b>. Итоговое место определяется лучшим подтверждённым результатом.</p>}
    </BoostplayDialog>}
    {dialog === 'logout' && <BoostplayDialog title="Выйти из аккаунта?" eyebrow="Завершение сессии" className="bp-logout-dialog" onClose={() => { if (!logoutPending) setDialog(null); }} dismissible={!logoutPending} actions={<><button className="bp-dialog-primary" disabled={logoutPending} onClick={logout}>{logoutPending ? 'Выходим…' : 'Выйти'}</button><button className="bp-dialog-secondary" disabled={logoutPending} onClick={() => setDialog(null)}>Остаться</button></>}><div className="bp-logout-dialog__icon"><Icon name="logout" /></div><p>Игровые результаты и профиль сохранятся. Для возвращения потребуется снова войти с корпоративной почтой.</p>{logoutError && <p className="bp-auth-error" role="alert">{logoutError}</p>}</BoostplayDialog>}
    {dialog === 'auth' && <BoostplayAuthDialog initialMode="login" referralCode={referralCode} onClose={() => { setDialog(null); if (location.pathname === '/login') navigate('/', { replace: true }); }} />}
    {dialog === 'booster' && <BoostplayDialog title="Бустеры" eyebrow="Информация" className="bp-info-dialog bp-booster-dialog" bodyClassName="bp-booster-dialog__body" onClose={() => setDialog(null)}>
      <div className="bp-info-list">
        <article><span className="is-violet"><Icon name="zap" /></span><div><h3>Что это</h3><p>Временные усиления наград, которые помогают быстрее прогрессировать в сезонном рейтинге.</p></div></article>
        <article><span className="is-cyan"><Icon name="activity" /></span><div><h3>Как работает</h3><p>Пока бустер активен, он автоматически увеличивает очки за игровые сессии и выполненные задания. Таймер запускается при получении.</p></div></article>
        <article><span className="is-gold"><Icon name="award" /></span><div><h3>Как получить</h3><p>Участвуйте в активностях сообщества GamerComm, выполняйте специальные задачи и следите за событиями в лобби.</p></div></article>
      </div>
    </BoostplayDialog>}
    {dialog === 'activity-history' && <BoostplayDialog title="История очков" eyebrow="Очки активности" className="bp-activity-history-dialog" bodyClassName="bp-activity-history-dialog__body" onClose={() => setDialog(null)}>
      <div className="bp-activity-history-summary"><span><Icon name="zap" /></span><div><small>Текущий баланс</small><strong>{availableActivityPoints}</strong></div><p>Очки начисляются за активности и расходуются на игровые усиления.</p></div>
      {activityHistoryPending ? <div className="bp-activity-history-state" role="status">Загружаем операции…</div>
        : activityHistoryError ? <div className="bp-activity-history-state is-error" role="alert">{activityHistoryError}</div>
          : activityHistory.length ? <div className="bp-activity-history-list" tabIndex={0} aria-label="История начислений и списаний">
            {activityHistory.map((entry) => <article key={entry.id} className={entry.amount > 0 ? 'is-income' : 'is-expense'}>
              <span><Icon name={entry.amount > 0 ? 'activity' : 'zap'} /></span>
              <div><strong>{entry.note || ACTIVITY_REASON_LABELS[entry.reason] || 'Операция с балансом'}</strong><small>{ACTIVITY_REASON_LABELS[entry.reason] || entry.reason} · {formatActivityHistoryDate(entry.createdAt)}</small></div>
              <b>{entry.amount > 0 ? '+' : ''}{entry.amount}</b>
            </article>)}
          </div> : <div className="bp-activity-history-state">Операций пока нет. Здесь появятся начисления за активности и покупки бустеров.</div>}
    </BoostplayDialog>}
    {dialog === 'booster-selection' && <BoosterSelectionDialog
      loadout={boosterLoadout}
      onChange={setBoosterLoadout}
      onClose={() => setDialog(null)}
      onStart={() => startRovers(boosterLoadout)}
      onStartWithoutBoosters={() => startRovers(EMPTY_ROVERS_BOOSTER_LOADOUT)}
      activityPoints={availableActivityPoints}
      pending={boosterPurchasePending}
      error={boosterPurchaseError}
    />}
    {dialog === 'rules' && <BoostplayDialog title="Правила игры «Роверы»" eyebrow="Коротко о главном" onClose={() => setDialog(null)} actions={<><button className="bp-dialog-primary" onClick={requestGameStart}>Играть</button><button className="bp-dialog-secondary" onClick={() => setDialog(null)}>Закрыть</button></>}><p>Сбрасывайте роверов на поле и объединяйте одинаковых. Чем выше уровень созданного ровера, тем больше очков вы получите.</p></BoostplayDialog>}
    {dialog === 'activities' && <BoostplayDialog title="Активности" eyebrow="Информация" className="bp-info-dialog bp-activities-dialog" bodyClassName="bp-activities-dialog__body" onClose={() => setDialog(null)}>
      <p className="bp-dialog-lead">Опросы и задания сообщества позволяют игрокам влиять на развитие проекта и получать награды.</p>
      <div className="bp-activity-sources">
        {[boostplayActivities[1], boostplayActivities[0]].map((activity) => <article key={activity.id} className={activity.source === 'GamerComm' ? 'is-gc' : 'is-hh'}><header><img src={activity.imageUrl} alt="" /><span>{activity.categoryLabel}</span></header><h3>{activity.source}</h3><p>{activity.description}</p><a href={activity.externalUrl ?? '#'} target="_blank" rel="noreferrer">Открыть сообщество <Icon name="chevron" /></a></article>)}
      </div>
      <div className="bp-activity-route">
        <header><strong>×2</strong><span><b>Мультипликатор наград</b><small>Удвоенные очки рейтинга для подсвеченных активностей.</small></span></header>
        <div className="bp-route-steps">
          <div><i><Icon name="eye" /></i><span>1. Найти в лобби</span></div>
          <div className="is-active"><i><Icon name="check" /></i><span>2. Выполнить</span></div>
          <div><i><Icon name="star" /></i><span>3. Забрать бонус</span></div>
        </div>
        <footer><i />Новые активности появляются регулярно в сообществах<i /></footer>
      </div>
    </BoostplayDialog>}
    {dialog === 'leaderboard' && <BoostplayDialog title="Турнирная таблица" eyebrow="Информация" className="bp-leaderboard-dialog" bodyClassName="bp-leaderboard-dialog__body" titleAlign="center" onClose={() => setDialog(null)}>
      {leaderboardLoading
        ? <div className="bp-dialog-data-state is-loading" role="status"><span>Загружаем турнирную таблицу…</span></div>
        : leaderboardError
          ? <div className="bp-dialog-data-state is-error" role="alert"><p>Не удалось получить актуальные результаты.</p><button type="button" onClick={() => setLeaderboardRequest((value) => value + 1)}>Повторить</button></div>
          : data.leaderboard.length === 0
            ? <div className="bp-dialog-data-state"><p>В этом сезоне ещё нет подтверждённых результатов.</p><small>Сыграйте первую партию и откройте сезонный рейтинг.</small></div>
            : <>
              <div className="bp-leaderboard-season">{data.seasonLabel}</div>
              <div className="bp-leaderboard-podium" aria-label="Три призовых места">
                {[data.leaderboard[1], data.leaderboard[0], data.leaderboard[2]].filter((entry): entry is BoostplayLeaderboardEntry => Boolean(entry)).map((entry) => <article key={entry.playerId} className={`place-${entry.rank}`}>
                  <div className="bp-podium-avatar">{entry.rank === 1 && <Icon name="crown" />}<span>{entry.avatarUrl ? <img src={entry.avatarUrl} alt="" /> : entry.displayName.slice(0, 1)}</span><b>{entry.rank}</b></div>
                  <strong>{entry.displayName}</strong><em>{formatBoostplayScore(entry.score)}</em><i aria-hidden="true" />
                </article>)}
              </div>
              <div ref={leaderboardListRef} className="bp-leaderboard-scroll" tabIndex={0} aria-label="Остальные места турнирной таблицы">
                {data.leaderboard.slice(3).map((entry) => {
                  const isCurrentPlayer = auth.authenticated && entry.isCurrentPlayer;
                  return <div key={entry.playerId} ref={isCurrentPlayer ? currentPlayerRowRef : undefined} className={`bp-leaderboard-row${isCurrentPlayer ? ' is-current' : ''}`}>
                    <b>{entry.rank}</b><span>{entry.avatarUrl ? <img src={entry.avatarUrl} alt="" /> : entry.displayName.slice(0, 1)}</span><strong>{entry.displayName}{isCurrentPlayer && <small>Вы</small>}</strong>
                    <em>{formatBoostplayScore(entry.score)}</em>
                  </div>;
                })}
              </div>
              {!auth.authenticated && <button type="button" className="bp-leaderboard-guest-note" onClick={() => setDialog('auth')}><Icon name="user" /><span><b>Хотите увидеть своё место?</b><small>Войдите в аккаунт — таблица сразу откроется на вашей позиции.</small></span><Icon name="chevron" /></button>}
              <footer className="bp-leaderboard-footer"><strong><Icon name="clock" /> Таблица обновляется раз в {data.leaderboardRefreshMinutes} минут</strong><span>Места в таблице определяются по лучшему подтверждённому результату в игре «Роверы».</span></footer>
            </>}
    </BoostplayDialog>}
    {dialog === 'rewards' && <BoostplayDialog title="Награды сезона" eyebrow="Информация" className="bp-rewards-dialog" bodyClassName="bp-rewards-dialog__body" titleAlign="center" onClose={() => setDialog(null)}>
      <p className="bp-rewards-subtitle">Будут начислены по итогам сезона</p>
      <div className="bp-rewards-showcase">
        <article className="place-2"><div className="bp-place-badge"><b>2</b><span>Место</span></div><div className="bp-prize-stage"><img src={boostplayAssets.prizes.shirt} alt="Футболка Яндекса" /></div><h3>Футболка<br />Яндекса</h3><small>Silver Edition</small></article>
        <article className="place-1"><div className="bp-place-badge"><b>1</b><span>Место</span></div><div className="bp-prize-stage"><img src={boostplayAssets.prizes.deliveryRover} alt="Доставочный ровер" /></div><h3>Доставочный<br />ровер</h3><small>Legendary Status</small></article>
        <article className="place-3"><div className="bp-place-badge"><b>3</b><span>Место</span></div><div className="bp-prize-stage"><img src={boostplayAssets.prizes.socks} alt="Набор носков" /></div><h3>Набор<br />носков</h3><small>Bronze Pack</small></article>
      </div>
      <p className="bp-rewards-note">Призы выдаются игрокам, занявшим соответствующие места в итоговой таблице лидеров на момент завершения сезона.</p>
    </BoostplayDialog>}
    {dialog === 'notifications' && <BoostplayDialog title="Уведомления" onClose={() => setDialog(null)} actions={<button className="bp-dialog-primary" onClick={() => setDialog(null)}>Закрыть</button>}><p>Новых уведомлений пока нет.</p></BoostplayDialog>}
    {dialog === 'settings' && <BoostplayDialog title="Настройки" onClose={() => setDialog(null)} actions={<button className="bp-dialog-primary" onClick={() => setDialog(null)}>Закрыть</button>}><p>Анимации автоматически отключаются, если в системе включено уменьшение движения. Пользовательские инструменты разработки и выбор косметики на этой странице отсутствуют.</p></BoostplayDialog>}
  </div>;
}
