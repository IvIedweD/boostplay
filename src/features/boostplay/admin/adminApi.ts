import { requireBoostplaySupabaseClient } from '../supabase/boostplaySupabaseClient';

export type AdminProfileStatus = 'active' | 'suspended';
export type AdminProfileRole = 'player' | 'moderator' | 'admin';

export interface AdminUserSummary {
  userId: string;
  displayName: string;
  avatarId: string;
  frameId: string;
  role: 'player' | 'moderator' | 'admin';
  status: 'active' | 'suspended' | 'deleted';
  activityPoints: number;
  createdAt: string;
  bestScore: number;
  gamesPlayed: number;
  lastPlayedAt: string | null;
}

export interface AdminLedgerEntry {
  id: number;
  amount: number;
  reason: string;
  note: string | null;
  actor_user_id: string | null;
  created_at: string;
}

export interface AdminAuditEntry {
  id: number;
  actor_user_id: string;
  target_user_id: string | null;
  action: 'activity_points_adjusted' | 'profile_status_changed' | 'profile_role_changed' | 'season_settings_changed';
  details: Record<string, unknown>;
  created_at: string;
}

export interface AdminSeasonSettings {
  title: string;
  label: string;
  startsAt: string;
  endsAt: string;
  status: 'upcoming' | 'active' | 'finished';
  leaderboardRefreshMinutes: number;
  updatedAt?: string;
}

type AdminAction =
  | { action: 'unlock' }
  | { action: 'list_users'; query?: string }
  | { action: 'adjust_points'; targetUserId: string; adjustment: number; note: string }
  | { action: 'set_status'; targetUserId: string; status: AdminProfileStatus; note: string }
  | { action: 'set_role'; targetUserId: string; role: AdminProfileRole; note: string }
  | { action: 'ledger'; targetUserId: string }
  | { action: 'audit' }
  | { action: 'season' }
  | { action: 'update_season'; season: AdminSeasonSettings };

const ERROR_MESSAGES: Record<string, string> = {
  admin_console_not_configured: 'Админ-панель ещё не настроена на сервере.',
  authentication_required: 'Сессия истекла. Войдите в аккаунт снова.',
  invalid_session: 'Сессия истекла. Войдите в аккаунт снова.',
  admin_role_required: 'Для этого аккаунта не назначена роль администратора.',
  admin_profile_missing: 'Сессия принадлежит аккаунту, для которого в этом проекте не найден профиль.',
  admin_profile_lookup_failed: 'Edge Function не смогла прочитать таблицу profiles. Проверьте проект функции и серверный ключ.',
  invalid_admin_password: 'Неверный секретный пароль администратора.',
  admin_access_temporarily_blocked: 'Слишком много попыток. Доступ временно заблокирован на 15 минут.',
  users_load_failed: 'Не удалось загрузить пользователей.',
  target_profile_not_found: 'Профиль пользователя не найден.',
  invalid_activity_point_adjustment: 'Введите корректное количество очков.',
  admin_note_required: 'Укажите причину изменения (от 3 до 240 символов).',
  negative_activity_point_balance: 'Баланс пользователя не может стать отрицательным.',
  cannot_suspend_current_admin: 'Нельзя заблокировать текущего администратора.',
  invalid_profile_role: 'Выберите корректную роль пользователя.',
  cannot_demote_current_admin: 'Нельзя снять роль администратора с текущего аккаунта.',
  audit_load_failed: 'Не удалось загрузить журнал действий администраторов.',
  season_load_failed: 'Не удалось загрузить настройки сезона.',
  invalid_season_settings: 'Проверьте заполнение настроек сезона.',
  invalid_season_text: 'Название и подпись сезона заполнены некорректно.',
  invalid_season_status: 'Выберите корректный статус сезона.',
  invalid_season_dates: 'Дата завершения сезона должна быть позже даты начала.',
  invalid_refresh_interval: 'Интервал обновления должен быть от 5 до 1440 минут.',
};

async function invokeAdmin<T>(password: string, payload: AdminAction): Promise<T> {
  const client = requireBoostplaySupabaseClient();
  const { data, error } = await client.functions.invoke('admin-console', {
    body: { ...payload, password },
  });
  if (error) {
    let code = error.message;
    let diagnostic = '';
    const context = 'context' in error ? error.context as Response | undefined : undefined;
    if (context) {
      try {
        const body = await context.clone().json() as { error?: string; diagnostic?: string };
        if (body.error) code = body.error;
        diagnostic = body.diagnostic ?? '';
      } catch {
        // Fall back to the SDK error when the function returned no JSON body.
      }
    }
    const message = ERROR_MESSAGES[code] ?? `Ошибка админ-панели: ${code}`;
    throw new Error(diagnostic ? `${message} ${diagnostic}` : message);
  }
  return data as T;
}

export const unlockAdminConsole = (password: string) =>
  invokeAdmin<{ admin: { id: string; displayName: string } }>(password, { action: 'unlock' });

export const loadAdminUsers = (password: string, query = '') =>
  invokeAdmin<{ users: AdminUserSummary[] }>(password, { action: 'list_users', query });

export const adjustAdminActivityPoints = (password: string, targetUserId: string, adjustment: number, note: string) =>
  invokeAdmin<{ activityPoints: number }>(password, { action: 'adjust_points', targetUserId, adjustment, note });

export const setAdminProfileStatus = (password: string, targetUserId: string, status: AdminProfileStatus, note: string) =>
  invokeAdmin<{ status: AdminProfileStatus }>(password, { action: 'set_status', targetUserId, status, note });

export const setAdminProfileRole = (password: string, targetUserId: string, role: AdminProfileRole, note: string) =>
  invokeAdmin<{ role: AdminProfileRole }>(password, { action: 'set_role', targetUserId, role, note });

export const loadAdminLedger = (password: string, targetUserId: string) =>
  invokeAdmin<{ entries: AdminLedgerEntry[] }>(password, { action: 'ledger', targetUserId });

export const loadAdminAudit = (password: string) =>
  invokeAdmin<{ entries: AdminAuditEntry[] }>(password, { action: 'audit' });

export const loadAdminSeason = (password: string) =>
  invokeAdmin<{ season: AdminSeasonSettings }>(password, { action: 'season' });

export const updateAdminSeason = (password: string, season: AdminSeasonSettings) =>
  invokeAdmin<{ saved: true }>(password, { action: 'update_season', season });
