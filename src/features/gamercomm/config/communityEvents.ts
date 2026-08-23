import type { CommunityEvent } from '../types';

export const communityEvents: CommunityEvent[] = [
  { id: 'technology-week', title: 'Неделя высоких технологий', description: 'Информационная неделя о развитии игровых систем GamerComm.', status: 'active', startsAt: '2026-07-28T00:00:00.000Z', endsAt: '2026-08-03T23:59:59.000Z', category: 'project', relatedRoute: '/gamercomm', featured: true },
  { id: 'engineer-trial', title: 'Испытание инженеров', description: 'Попробуйте улучшить собственный рекорд в «Роверах». Дополнительных наград событие не добавляет.', status: 'upcoming', startsAt: '2026-08-04T00:00:00.000Z', endsAt: '2026-08-10T23:59:59.000Z', category: 'game', relatedRoute: '/games/rovers', featured: true },
  { id: 'city-update', title: 'Обновление города', description: 'Информационная публикация о будущих улучшениях интерфейса.', status: 'upcoming', startsAt: '2026-08-12T00:00:00.000Z', category: 'project', relatedRoute: '/gamercomm', featured: false },
  { id: 'hub-opening', title: 'Открытие информационного центра', description: 'Центральное здание стало полноценным информационным разделом.', status: 'completed', startsAt: '2026-07-20T00:00:00.000Z', endsAt: '2026-07-27T00:00:00.000Z', category: 'community', featured: false },
];
