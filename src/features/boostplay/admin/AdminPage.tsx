import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/BoostplayAuthProvider';
import {
  adjustAdminActivityPoints,
  loadAdminAudit,
  loadAdminLedger,
  loadAdminSeason,
  loadAdminUsers,
  setAdminProfileRole,
  setAdminProfileStatus,
  unlockAdminConsole,
  updateAdminSeason,
  type AdminAuditEntry,
  type AdminLedgerEntry,
  type AdminProfileRole,
  type AdminSeasonSettings,
  type AdminUserSummary,
} from './adminApi';
import './admin.css';
import './admin-enhancements.css';

const ADMIN_SESSION_MS = 30 * 60_000;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

const ROLE_TITLES: Record<AdminProfileRole, string> = {
  player: 'Игрок',
  moderator: 'Модератор',
  admin: 'Администратор',
};

const AUDIT_TITLES: Record<AdminAuditEntry['action'], string> = {
  activity_points_adjusted: 'Изменены очки активности',
  profile_status_changed: 'Изменён статус аккаунта',
  profile_role_changed: 'Изменена роль',
  season_settings_changed: 'Обновлены настройки сезона',
};

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function AdminPage() {
  const auth = useAuth();
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ledger, setLedger] = useState<AdminLedgerEntry[]>([]);
  const [audit, setAudit] = useState<AdminAuditEntry[]>([]);
  const [adjustment, setAdjustment] = useState('');
  const [pointNote, setPointNote] = useState('');
  const [roleNotes, setRoleNotes] = useState<Record<string, string>>({});
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({});
  const [roleDrafts, setRoleDrafts] = useState<Record<string, AdminProfileRole>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | AdminProfileRole>('all');
  const [season, setSeason] = useState<AdminSeasonSettings | null>(null);

  const selectedUser = useMemo(
    () => users.find((user) => user.userId === selectedId) ?? null,
    [selectedId, users],
  );
  const visibleUsers = useMemo(() => users.filter((user) =>
    (statusFilter === 'all' || user.status === statusFilter)
    && (roleFilter === 'all' || user.role === roleFilter)), [roleFilter, statusFilter, users]);
  const roleDraft = selectedUser ? roleDrafts[selectedUser.userId] ?? selectedUser.role : 'player';
  const roleNote = selectedUser ? roleNotes[selectedUser.userId] ?? '' : '';
  const statusNote = selectedUser ? statusNotes[selectedUser.userId] ?? '' : '';

  const lock = useCallback(() => {
    setUnlocked(false);
    setPassword('');
    setUsers([]);
    setSelectedId(null);
    setLedger([]);
    setAudit([]);
    setSeason(null);
    setNotice('');
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    const timer = window.setTimeout(lock, ADMIN_SESSION_MS);
    return () => window.clearTimeout(timer);
  }, [lock, unlocked]);

  const refreshUsers = useCallback(async (secret: string, search = query) => {
    const result = await loadAdminUsers(secret, search);
    setUsers(result.users);
    setSelectedId((current) => current && result.users.some((user) => user.userId === current)
      ? current
      : result.users[0]?.userId ?? null);
  }, [query]);

  useEffect(() => {
    if (!unlocked || !selectedId) return;
    let active = true;
    loadAdminLedger(password, selectedId)
      .then((result) => { if (active) setLedger(result.entries); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Не удалось загрузить историю.'); });
    return () => { active = false; };
  }, [password, selectedId, unlocked]);

  const selectUser = (userId: string) => {
    setLedger([]);
    setSelectedId(userId);
  };

  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await unlockAdminConsole(password);
      await refreshUsers(password, '');
      const [auditResult, seasonResult] = await Promise.allSettled([
        loadAdminAudit(password),
        loadAdminSeason(password),
      ]);
      if (auditResult.status === 'fulfilled') setAudit(auditResult.value.entries);
      if (seasonResult.status === 'fulfilled') setSeason(seasonResult.value.season);
      else setNotice('Панель открыта, но настройки сезона ещё не установлены в Supabase.');
      setUnlocked(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось открыть админ-панель.');
    } finally {
      setPending(false);
    }
  };

  const search = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await refreshUsers(password, query);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось выполнить поиск.');
    } finally {
      setPending(false);
    }
  };

  const applyAdjustment = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedUser) return;
    const amount = Number(adjustment);
    setPending(true);
    setError('');
    setNotice('');
    try {
      const result = await adjustAdminActivityPoints(password, selectedUser.userId, amount, pointNote);
      setUsers((current) => current.map((user) => user.userId === selectedUser.userId
        ? { ...user, activityPoints: result.activityPoints }
        : user));
      setLedger((await loadAdminLedger(password, selectedUser.userId)).entries);
      setAudit((await loadAdminAudit(password)).entries);
      setAdjustment('');
      setPointNote('');
      setNotice(`Баланс ${selectedUser.displayName} обновлён: ${result.activityPoints} очков.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось изменить баланс.');
    } finally {
      setPending(false);
    }
  };

  const changeStatus = async () => {
    if (!selectedUser || statusNote.trim().length < 3) {
      setError('Укажите причину изменения статуса (минимум 3 символа).');
      return;
    }
    const nextStatus = selectedUser.status === 'active' ? 'suspended' : 'active';
    setPending(true);
    setError('');
    setNotice('');
    try {
      const result = await setAdminProfileStatus(password, selectedUser.userId, nextStatus, statusNote);
      setUsers((current) => current.map((user) => user.userId === selectedUser.userId
        ? { ...user, status: result.status }
        : user));
      setAudit((await loadAdminAudit(password)).entries);
      setStatusNotes((current) => ({ ...current, [selectedUser.userId]: '' }));
      setNotice(result.status === 'active' ? 'Доступ пользователя восстановлен.' : 'Аккаунт пользователя приостановлен.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось изменить статус.');
    } finally {
      setPending(false);
    }
  };

  const changeRole = async () => {
    if (!selectedUser || roleNote.trim().length < 3 || selectedUser.role === roleDraft) return;
    setPending(true);
    setError('');
    setNotice('');
    try {
      const result = await setAdminProfileRole(password, selectedUser.userId, roleDraft, roleNote);
      setUsers((current) => current.map((user) => user.userId === selectedUser.userId
        ? { ...user, role: result.role }
        : user));
      setAudit((await loadAdminAudit(password)).entries);
      setRoleNotes((current) => ({ ...current, [selectedUser.userId]: '' }));
      setNotice(`Пользователю ${selectedUser.displayName} назначена роль «${ROLE_TITLES[result.role]}».`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось изменить роль.');
    } finally {
      setPending(false);
    }
  };

  const saveSeason = async (event: FormEvent) => {
    event.preventDefault();
    if (!season) return;
    setPending(true);
    setError('');
    setNotice('');
    try {
      const payload: AdminSeasonSettings = {
        ...season,
        startsAt: new Date(season.startsAt).toISOString(),
        endsAt: new Date(season.endsAt).toISOString(),
        leaderboardRefreshMinutes: Number(season.leaderboardRefreshMinutes),
      };
      await updateAdminSeason(password, payload);
      setSeason({ ...payload, startsAt: toDateTimeLocal(payload.startsAt), endsAt: toDateTimeLocal(payload.endsAt) });
      setAudit((await loadAdminAudit(password)).entries);
      setNotice('Настройки сезона сохранены и уже доступны в лобби.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось сохранить настройки сезона.');
    } finally {
      setPending(false);
    }
  };

  if (auth.loading) return <main className="admin-gate"><div><span>BOOSTPLAY CONTROL</span><h1>Проверяем сессию…</h1></div></main>;
  if (!auth.authenticated) return <main className="admin-gate"><div><span>BOOSTPLAY CONTROL</span><h1>Требуется авторизация</h1><p>Сначала войдите в аккаунт администратора.</p><Link to="/login">Перейти ко входу</Link></div></main>;
  if (auth.user?.role !== 'admin') return <main className="admin-gate"><div><span>BOOSTPLAY CONTROL</span><h1>Доступ закрыт</h1><p>У аккаунта нет роли администратора.</p><Link to="/">Вернуться на главную</Link></div></main>;

  if (!unlocked) return <main className="admin-gate"><form onSubmit={unlock}><span>Второй уровень защиты</span><h1>Админ-панель</h1><p>Введите секретный пароль. После пяти ошибок вход блокируется на 15 минут.</p><label>Секретный пароль<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus /></label>{error && <div className="admin-message is-error">{error}</div>}<button disabled={pending || !password}>{pending ? 'Проверяем…' : 'Открыть панель'}</button><Link to="/">Вернуться на главную</Link></form></main>;

  return <main className="admin-page">
    <header className="admin-header">
      <div><span>BOOSTPLAY CONTROL</span><h1>Центр управления</h1><p>Пользователи, роли, игровые результаты и экономика активности.</p></div>
      <div><small>Защищённая сессия · 30 минут</small><button type="button" onClick={lock}>Закрыть панель</button><Link to="/">На главную</Link></div>
    </header>
    {error && <div className="admin-message is-error">{error}</div>}{notice && <div className="admin-message is-success">{notice}</div>}
    <section className="admin-stats">
      <article><small>Пользователей</small><strong>{users.length}</strong><em>загружено в панель</em></article>
      <article><small>Активных</small><strong>{users.filter((user) => user.status === 'active').length}</strong><em>{users.filter((user) => user.status === 'suspended').length} приостановлено</em></article>
      <article><small>Всего игр</small><strong>{users.reduce((sum, user) => sum + user.gamesPlayed, 0)}</strong><em>подтверждённых сессий</em></article>
      <article><small>Очков в обороте</small><strong>{users.reduce((sum, user) => sum + user.activityPoints, 0).toLocaleString('ru-RU')}</strong><em>доступно игрокам</em></article>
    </section>
    {season && <form className="admin-season-card" onSubmit={saveSeason}>
      <header><div><small>Управление контентом</small><h2>Настройки сезона</h2><p>Изменения применяются в лобби без повторной сборки сайта.</p></div><span className={`is-${season.status}`}>{season.status === 'active' ? 'Активный' : season.status === 'upcoming' ? 'Предстоящий' : 'Завершён'}</span></header>
      <div className="admin-season-fields">
        <label>Название<input required minLength={3} maxLength={80} value={season.title} onChange={(event) => setSeason({ ...season, title: event.target.value })} /></label>
        <label className="is-wide">Подпись в таблице<input required minLength={3} maxLength={100} value={season.label} onChange={(event) => setSeason({ ...season, label: event.target.value })} /></label>
        <label>Начало<input required type="datetime-local" value={toDateTimeLocal(season.startsAt)} onChange={(event) => setSeason({ ...season, startsAt: event.target.value })} /></label>
        <label>Завершение<input required type="datetime-local" value={toDateTimeLocal(season.endsAt)} onChange={(event) => setSeason({ ...season, endsAt: event.target.value })} /></label>
        <label>Статус<select value={season.status} onChange={(event) => setSeason({ ...season, status: event.target.value as AdminSeasonSettings['status'] })}><option value="upcoming">Предстоящий</option><option value="active">Активный</option><option value="finished">Завершён</option></select></label>
        <label>Обновление рейтинга<input required type="number" min="5" max="1440" step="5" value={season.leaderboardRefreshMinutes} onChange={(event) => setSeason({ ...season, leaderboardRefreshMinutes: Number(event.target.value) })} /><small>минут</small></label>
      </div>
      <footer><p>Название, сроки и интервал обновления увидят все пользователи.</p><button type="submit" disabled={pending}>{pending ? 'Сохраняем…' : 'Сохранить сезон'}</button></footer>
    </form>}
    <div className="admin-workspace">
      <section className="admin-users">
        <form onSubmit={search}><input aria-label="Поиск пользователя" placeholder="Поиск по логину" value={query} onChange={(event) => setQuery(event.target.value)} /><button disabled={pending}>Найти</button></form>
        <div className="admin-user-filters">
          <select aria-label="Фильтр по статусу" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">Все статусы</option><option value="active">Активные</option><option value="suspended">Приостановленные</option></select>
          <select aria-label="Фильтр по роли" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)}><option value="all">Все роли</option><option value="player">Игроки</option><option value="moderator">Модераторы</option><option value="admin">Администраторы</option></select>
        </div>
        <div className="admin-user-list">{visibleUsers.map((user) => <button type="button" key={user.userId} className={user.userId === selectedId ? 'is-selected' : ''} onClick={() => selectUser(user.userId)}><i>{user.displayName.slice(0, 1).toUpperCase()}</i><span><strong>{user.displayName}</strong><small>{ROLE_TITLES[user.role]} · {user.status === 'active' ? 'активен' : 'приостановлен'}</small></span><b>{user.activityPoints}</b></button>)}{visibleUsers.length === 0 && <p className="admin-list-empty">По выбранным фильтрам ничего не найдено.</p>}</div>
      </section>
      <section className="admin-detail">{selectedUser ? <>
        <header><div><small>Профиль пользователя</small><h2>{selectedUser.displayName}</h2><p>ID: {selectedUser.userId}</p></div><span className={`is-${selectedUser.status}`}>{selectedUser.status === 'active' ? 'Активен' : 'Приостановлен'}</span></header>
        <div className="admin-user-stats">
          <article className="is-points"><i aria-hidden="true">×</i><small>Очки активности</small><strong>{selectedUser.activityPoints.toLocaleString('ru-RU')}</strong><em>Доступно для усилений</em></article>
          <article className="is-score"><i aria-hidden="true">◆</i><small>Лучший результат</small><strong>{selectedUser.bestScore.toLocaleString('ru-RU')}</strong><em>Рекорд в «Роверах»</em></article>
          <article className="is-games"><i aria-hidden="true">▶</i><small>Сыграно партий</small><strong>{selectedUser.gamesPlayed}</strong><em>Завершённых сессий</em></article>
          <article className="is-last-game"><i aria-hidden="true">◷</i><small>Последняя игра</small><strong>{selectedUser.lastPlayedAt ? formatDate(selectedUser.lastPlayedAt) : 'Ещё не играл'}</strong><em>Последняя активность</em></article>
          <article className="is-registration"><i aria-hidden="true">+</i><small>Регистрация</small><strong>{formatDate(selectedUser.createdAt)}</strong><em>Профиль создан</em></article>
        </div>
        <div className="admin-management-grid">
          <form className="admin-adjustment" onSubmit={applyAdjustment}>
            <h3>Очки активности</h3><p>Начисление и списание сразу попадает в историю пользователя.</p>
            <div className="admin-quick-values">{[100, 250, 500, -100].map((value) => <button type="button" key={value} onClick={() => setAdjustment(String(value))}>{value > 0 ? '+' : ''}{value}</button>)}</div>
            <label>Количество<input type="number" min="-100000" max="100000" step="1" placeholder="Например, 250 или -100" value={adjustment} onChange={(event) => setAdjustment(event.target.value)} /></label>
            <label>Причина<textarea minLength={3} maxLength={240} placeholder="Участие в активности…" value={pointNote} onChange={(event) => setPointNote(event.target.value)} /></label>
            <button className="admin-primary-action" disabled={pending || !adjustment || pointNote.trim().length < 3}>Применить изменение</button>
          </form>
          <section className="admin-access-card">
            <h3>Роль и доступ</h3><p>Два независимых действия с отдельными причинами и записью в журнал.</p>
            <div className="admin-role-control">
              <h4>Назначить роль</h4>
              <label>Роль пользователя<select value={roleDraft} disabled={pending} onChange={(event) => setRoleDrafts((current) => ({ ...current, [selectedUser.userId]: event.target.value as AdminProfileRole }))}>{Object.entries(ROLE_TITLES).map(([role, title]) => <option key={role} value={role}>{title}</option>)}</select></label>
              <label>Причина<input type="text" minLength={3} maxLength={240} placeholder="Например, назначение модератором" value={roleNote} onChange={(event) => setRoleNotes((current) => ({ ...current, [selectedUser.userId]: event.target.value }))} /></label>
              <button type="button" className="admin-role-action" disabled={pending || selectedUser.role === roleDraft || roleNote.trim().length < 3} onClick={changeRole}>Назначить роль</button>
            </div>
            <div className="admin-status-control">
              <h4>{selectedUser.status === 'active' ? 'Блокировка аккаунта' : 'Восстановление доступа'}</h4>
              <label>Причина<input type="text" minLength={3} maxLength={240} placeholder={selectedUser.status === 'active' ? 'Причина блокировки' : 'Причина восстановления'} value={statusNote} onChange={(event) => setStatusNotes((current) => ({ ...current, [selectedUser.userId]: event.target.value }))} /></label>
              <button type="button" className={selectedUser.status === 'active' ? 'is-danger' : 'is-restore'} disabled={pending || statusNote.trim().length < 3} onClick={changeStatus}>{selectedUser.status === 'active' ? 'Заблокировать аккаунт' : 'Восстановить аккаунт'}</button>
            </div>
          </section>
        </div>
        <section className="admin-ledger"><h3>История очков</h3>{ledger.length ? ledger.map((entry) => <article key={entry.id}><b className={entry.amount > 0 ? 'is-positive' : 'is-negative'}>{entry.amount > 0 ? '+' : ''}{entry.amount}</b><span><strong>{entry.note || entry.reason}</strong><small>{formatDate(entry.created_at)}</small></span></article>) : <p>Операций пока нет.</p>}</section>
      </> : <div className="admin-empty">Выберите пользователя</div>}</section>
    </div>
    <section className="admin-audit"><header><div><small>Контроль изменений</small><h2>Журнал администраторов</h2></div><span>{audit.length} последних действий</span></header><div>{audit.length ? audit.map((entry) => { const target = users.find((user) => user.userId === entry.target_user_id); const noteValue = typeof entry.details.note === 'string' ? entry.details.note : ''; return <article key={entry.id}><i>{AUDIT_TITLES[entry.action].slice(0, 1)}</i><span><strong>{AUDIT_TITLES[entry.action]}</strong><small>{target?.displayName ?? entry.target_user_id ?? 'Системная операция'}{noteValue ? ` · ${noteValue}` : ''}</small></span><time>{formatDate(entry.created_at)}</time></article>; }) : <p>Административных действий пока нет.</p>}</div></section>
  </main>;
}
