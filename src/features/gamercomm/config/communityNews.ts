import type { CommunityNewsItem } from '../types';

export const communityNews: CommunityNewsItem[] = [
  {
    id: 'welcome-gamercomm', slug: 'dobro-pozhalovat', title: 'Добро пожаловать в GamerComm',
    summary: 'Центральный информационный центр города открыт.',
    content: [
      { type: 'paragraph', text: 'GamerComm объединяет новости проекта, события, задания и ваш игровой прогресс.' },
      { type: 'heading', text: 'Что уже доступно' },
      { type: 'list', items: ['Интерактивный город', 'Мини-игра «Роверы»', 'Профиль, рейтинг и задания'] },
    ],
    category: 'important', publishedAt: '2026-07-30T09:00:00.000Z', featured: true, pinned: true,
    status: 'published', author: 'Команда GamerComm', tags: ['GamerComm', 'город'], relatedRoute: '/gamercomm',
  },
  {
    id: 'rovers-available', slug: 'rovers-dostupny', title: 'Мини-игра «Роверы» доступна',
    summary: 'Создавайте новые модели роверов и улучшайте локальный рекорд.',
    content: [{ type: 'paragraph', text: 'Соединяйте одинаковых роверов, следите за опасной зоной и открывайте восемь уровней моделей.' }, { type: 'quote', text: 'Спокойная стратегия важнее скорости.' }],
    category: 'games', publishedAt: '2026-07-29T10:00:00.000Z', featured: true, pinned: false,
    status: 'published', tags: ['Роверы', 'игры'], relatedRoute: '/games/rovers',
  },
  {
    id: 'profile-achievements', slug: 'profil-i-dostizheniya', title: 'Профиль игрока и достижения',
    summary: 'Весь локальный прогресс теперь собран в одном месте.',
    content: [{ type: 'paragraph', text: 'Профиль показывает уровень, опыт, достижения, награды и историю активности.' }],
    category: 'project', publishedAt: '2026-07-28T12:00:00.000Z', featured: false, pinned: false,
    status: 'published', tags: ['профиль', 'прогресс'], relatedRoute: '/profile',
  },
  {
    id: 'leaderboard-open', slug: 'lokalnyy-reyting', title: 'Локальный рейтинг открыт',
    summary: 'Сравните результат с демонстрационными соперниками.',
    content: [{ type: 'paragraph', text: 'Рейтинг остаётся локальной демонстрацией. Онлайн-таблица появится после подключения серверной части.' }],
    category: 'community', publishedAt: '2026-07-27T14:00:00.000Z', featured: false, pinned: false,
    status: 'published', tags: ['рейтинг'], relatedRoute: '/leaderboard',
  },
  {
    id: 'tasks-live', slug: 'zadaniya', title: 'Ежедневные и недельные задания',
    summary: 'Новые цели помогают получать XP и очки сообщества.',
    content: [{ type: 'paragraph', text: 'Три ежедневных и четыре недельных задания обновляются по локальному времени устройства.' }, { type: 'list', items: ['Выполняйте цели', 'Получайте награды вручную', 'Следите за временем обновления'] }],
    category: 'events', publishedAt: '2026-07-26T11:00:00.000Z', featured: false, pinned: false,
    status: 'published', tags: ['задания', 'награды'], relatedRoute: '/tasks',
  },
  {
    id: 'official-community', slug: 'oficialnoe-soobshchestvo', title: 'Официальное сообщество GamerComm',
    summary: 'Здесь появится безопасный переход в официальную группу.',
    content: [{ type: 'paragraph', text: 'Ссылка на группу Яндекс Мессенджера будет добавлена после официальной настройки.' }],
    category: 'community', publishedAt: '2026-07-25T16:00:00.000Z', featured: false, pinned: false,
    status: 'published', tags: ['сообщество'],
  },
  {
    id: 'next-up', slug: 'chto-dalshe', title: 'Что появится дальше',
    summary: 'Проект готовится к новым игровым направлениям и серверным функциям.',
    content: [{ type: 'paragraph', text: 'Будущие обновления будут объявлены здесь после утверждения. Эта публикация не обещает конкретных сроков.' }],
    category: 'project', publishedAt: '2026-07-24T09:30:00.000Z', featured: false, pinned: false,
    status: 'published', tags: ['планы'],
  },
  {
    id: 'rovers-tips', slug: 'sovety-rovers', title: 'Советы по игре в «Роверы»',
    summary: 'Несколько спокойных приёмов для устойчивой игровой зоны.',
    content: [{ type: 'list', items: ['Оставляйте пространство для новых объектов', 'Соединяйте нижние уровни заранее', 'Не накапливайте роверы у опасной зоны'] }],
    category: 'games', publishedAt: '2026-07-23T13:00:00.000Z', featured: false, pinned: false,
    status: 'published', tags: ['Роверы', 'советы'], relatedRoute: '/games/rovers',
  },
  {
    id: 'archived-draft', slug: 'arhiv', title: 'Архивная публикация', summary: 'Не отображается.',
    content: [], category: 'project', publishedAt: '2026-07-01T00:00:00.000Z', featured: false, pinned: false,
    status: 'archived', tags: [],
  },
];
