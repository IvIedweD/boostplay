import type { OfficialCommunityConfig } from '../types';

export const officialCommunity: OfficialCommunityConfig = {
  enabled: true,
  platform: 'yandex-messenger',
  title: 'Официальное сообщество GamerComm',
  description: 'Новости, обсуждения и важные объявления команды.',
  // Вставьте сюда утверждённый HTTPS URL официальной группы, когда он будет предоставлен.
  externalUrl: null,
  instructions: [
    'Нажмите «Открыть в Яндекс Мессенджере».',
    'Авторизуйтесь в рабочей учётной записи, если это потребуется.',
    'Запросите доступ у администратора сообщества, если группа закрыта.',
  ],
  openInNewTab: true,
};
