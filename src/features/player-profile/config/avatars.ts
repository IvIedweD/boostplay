export const playerAvatars = [
  { id: 'gamepad', title: 'Игровой джойстик', symbol: '🎮' },
  { id: 'rover', title: 'Маленький ровер', symbol: '🤖' },
  { id: 'city', title: 'Городской символ', symbol: '◆' },
  { id: 'lightning', title: 'Молния', symbol: '⚡' },
  { id: 'star', title: 'Звезда', symbol: '★' },
  { id: 'robot', title: 'Робот', symbol: '◉' },
] as const;

export type PlayerAvatarId = (typeof playerAvatars)[number]['id'];
export const DEFAULT_PLAYER_AVATAR_ID: PlayerAvatarId = 'gamepad';

export function getPlayerAvatar(id: string) {
  return playerAvatars.find((avatar) => avatar.id === id) ?? playerAvatars[0];
}
