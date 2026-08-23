import { boostplayAssets } from '../../../assets/boostplay/assets';
import gamerCommCommunityImage from '../../../assets/boostplay/communities/gamercomm.png';
import hubbyHubCommunityImage from '../../../assets/boostplay/communities/hubbyhub.png';
import type {
  BoostplayBooster,
  BoostplayCommunityActivity,
  BoostplayFeaturedGame,
  BoostplayLeaderboardEntry,
  BoostplayPlayer,
  BoostplayPrize,
  BoostplaySeason,
  BoostplayViewState,
} from '../types';

export const boostplayPlayer: BoostplayPlayer = {
  id: 'local-boostplay-player',
  displayName: 'Александр_Механик',
  avatarUrl: null,
  rank: 8,
  bestScore: 42_300,
  authenticated: true,
  prizeEligible: true,
};

export const boostplaySeason: BoostplaySeason = {
  id: 'community-season-01',
  title: 'Сезон сообщества',
  startsAt: '2026-07-29T00:00:00+03:00',
  endsAt: '2026-08-10T00:00:00+03:00',
  status: 'active',
};

export const boostplayFeaturedGame: BoostplayFeaturedGame = {
  id: 'rovers',
  title: 'РОВЕРЫ',
  description: 'Собирай, объединяй и улучшай милых роботов-роверов. Соревнуйся с сообществом и поднимайся в рейтинге!',
  artworkUrl: boostplayAssets.artwork.scanner,
  route: '/play',
  available: true,
};

export const boostplayBooster: BoostplayBooster = {
  id: 'hubbyhub-turbo-x3',
  name: 'Турбо HubbyHub',
  source: 'HubbyHub',
  effectType: 'multiplier',
  multiplier: 3,
  remainingUses: 1,
  expiresAt: '2026-08-10T00:00:00+03:00',
  active: true,
};

export const boostplayGamerCommBooster: BoostplayBooster = {
  id: 'gamercomm-charge-x2',
  name: 'Заряд GamerComm',
  source: 'GamerComm',
  effectType: 'multiplier',
  multiplier: 2,
  remainingUses: 2,
  expiresAt: '2026-08-10T00:00:00+03:00',
  active: true,
};

export const boostplayActivities: readonly BoostplayCommunityActivity[] = [
  {
    id: 'gamercomm-weekly-poll',
    source: 'GamerComm',
    imageUrl: gamerCommCommunityImage,
    cardSubtitle: 'Опрос о новинках',
    categoryLabel: 'Стратегия сезона',
    title: 'Пройди недельный опрос',
    description: 'Поделись мнением о новых игровых активностях GamerComm.',
    rewardLabel: '×2 на следующую игру',
    status: 'available',
    externalUrl: 'https://example.com/gamercomm-weekly-poll',
    expiresAt: '2026-08-10T00:00:00+03:00',
  },
  {
    id: 'hubbyhub-pinned-task',
    source: 'HubbyHub',
    imageUrl: hubbyHubCommunityImage,
    cardSubtitle: 'Задание сообщества',
    categoryLabel: 'Механики и тесты',
    title: 'Выполни задание из закреплённой публикации сообщества',
    description: 'Открой закреплённую публикацию и ознакомься с условиями кампании.',
    rewardLabel: '×3 на следующую игру',
    status: 'available',
    externalUrl: 'https://example.com/hubbyhub-pinned-task',
    expiresAt: '2026-08-10T00:00:00+03:00',
  },
];

export const boostplayLeaderboard: readonly BoostplayLeaderboardEntry[] = [
  { rank: 1, playerId: 'cyber-driver', displayName: 'Кибер_Драйвер', avatarUrl: null, score: 58_900, isCurrentPlayer: false },
  { rank: 2, playerId: 'mars-rover', displayName: 'Марсоход', avatarUrl: null, score: 53_100, isCurrentPlayer: false },
  { rank: 3, playerId: 'neon', displayName: 'Неон', avatarUrl: null, score: 49_750, isCurrentPlayer: false },
  { rank: 4, playerId: 'pixel-runner', displayName: 'Пиксель_Раннер', avatarUrl: null, score: 48_200, isCurrentPlayer: false },
  { rank: 5, playerId: 'techno-fighter', displayName: 'Техно_Бой', avatarUrl: null, score: 47_900, isCurrentPlayer: false },
  { rank: 6, playerId: 'roberto', displayName: 'Роберто', avatarUrl: null, score: 45_400, isCurrentPlayer: false },
  { rank: 7, playerId: 'skywalker', displayName: 'Скайуокер', avatarUrl: null, score: 44_100, isCurrentPlayer: false },
  { rank: 8, playerId: boostplayPlayer.id, displayName: boostplayPlayer.displayName, avatarUrl: null, score: boostplayPlayer.bestScore, isCurrentPlayer: true },
  { rank: 9, playerId: 'night-skater', displayName: 'Ночной_Скейтер', avatarUrl: null, score: 41_900, isCurrentPlayer: false },
  { rank: 10, playerId: 'star-dog', displayName: 'Звёздный_Пёс', avatarUrl: null, score: 40_500, isCurrentPlayer: false },
  { rank: 11, playerId: 'cosmo-mix', displayName: 'Космо_Микс', avatarUrl: null, score: 39_200, isCurrentPlayer: false },
  { rank: 12, playerId: 'turbo-fan', displayName: 'Турбо_Фан', avatarUrl: null, score: 38_800, isCurrentPlayer: false },
  { rank: 13, playerId: 'moon-rover-one', displayName: 'Луноход_Один', avatarUrl: null, score: 37_500, isCurrentPlayer: false },
  { rank: 14, playerId: 'blitz', displayName: 'Блиц_Криг', avatarUrl: null, score: 36_100, isCurrentPlayer: false },
  { rank: 15, playerId: 'game-master', displayName: 'Мастер_Игр', avatarUrl: null, score: 35_400, isCurrentPlayer: false },
  { rank: 16, playerId: 'atomic-rover', displayName: 'Атомный_Ровер', avatarUrl: null, score: 34_900, isCurrentPlayer: false },
  { rank: 17, playerId: 'thunder', displayName: 'Громобой', avatarUrl: null, score: 33_200, isCurrentPlayer: false },
  { rank: 18, playerId: 'photon', displayName: 'Фотон', avatarUrl: null, score: 32_800, isCurrentPlayer: false },
  { rank: 19, playerId: 'electric-shock', displayName: 'Электро_Шок', avatarUrl: null, score: 31_500, isCurrentPlayer: false },
  { rank: 20, playerId: 'volcano', displayName: 'Вулкан', avatarUrl: null, score: 30_200, isCurrentPlayer: false },
  { rank: 21, playerId: 'rocket-100', displayName: 'Ракета_100', avatarUrl: null, score: 29_100, isCurrentPlayer: false },
  { rank: 22, playerId: 'supersonic', displayName: 'Сверхзвук', avatarUrl: null, score: 28_400, isCurrentPlayer: false },
  { rank: 23, playerId: 'mars-hero', displayName: 'Герой_Марса', avatarUrl: null, score: 27_900, isCurrentPlayer: false },
  { rank: 24, playerId: 'zero-gravity', displayName: 'Невесомость', avatarUrl: null, score: 26_500, isCurrentPlayer: false },
  { rank: 25, playerId: 'zenith', displayName: 'Зенит', avatarUrl: null, score: 25_800, isCurrentPlayer: false },
];

export const boostplayPrizes: readonly BoostplayPrize[] = [
  { place: 1, title: 'Главный приз сезона', description: 'Прототипная награда', imageUrl: boostplayAssets.icons.goldPrize, eligibilityNote: 'Требуется авторизация и проверка результата.' },
  { place: 2, title: 'Второй приз сезона', description: 'Прототипная награда', imageUrl: boostplayAssets.icons.silverPrize, eligibilityNote: 'Требуется авторизация и проверка результата.' },
  { place: 3, title: 'Третий приз сезона', description: 'Прототипная награда', imageUrl: boostplayAssets.icons.bronzePrize, eligibilityNote: 'Требуется авторизация и проверка результата.' },
];

export function getBoostplayViewState(search: string): BoostplayViewState {
  const params = new URLSearchParams(search);
  const globalState = params.get('state');
  return {
    guest: params.get('auth') === 'guest',
    booster: params.get('booster') === 'none' ? 'none' : params.get('booster') === 'gamercomm' ? 'gamercomm' : 'active',
    player: globalState === 'loading' || params.get('player') === 'loading' ? 'loading' : 'ready',
    season: globalState === 'loading' || params.get('season') === 'loading' ? 'loading' : params.get('season') === 'none' ? 'none' : 'ready',
    activities: globalState === 'loading' || params.get('activities') === 'loading' ? 'loading' : params.get('activities') === 'none' ? 'none' : 'ready',
    leaderboard: globalState === 'loading' || params.get('leaderboard') === 'loading' ? 'loading' : params.get('leaderboard') === 'unavailable' ? 'unavailable' : 'ready',
    prizes: params.get('prizes') === 'unavailable' ? 'unavailable' : 'ready',
    artwork: params.get('artwork') === 'missing' ? 'missing' : 'ready',
    stress: params.get('stress') === '1',
  };
}

export const formatBoostplayScore = (value: number) => value.toLocaleString('ru-RU');
