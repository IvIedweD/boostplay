import type { SupabaseClient, User } from '@supabase/supabase-js';
import { findAvatarCosmetic } from '../../../assets/boostplay/cosmetics/catalog';
import type {
  AuthAdapter,
  AuthUser,
  PasswordLoginRequest,
  PendingEmailVerification,
  RegistrationRequest,
} from './authAdapter';
import { createRegistrationIdentity, normalizeReferralCode } from './registrationPolicy';
import { requireBoostplaySupabaseClient } from '../supabase/boostplaySupabaseClient';
import { loadRoversPlayerStanding } from '../data/supabaseGameData';
import { loadActivityPoints } from '../services/activityPointsStorage';

interface ProfileRow {
  display_name: string;
  avatar_id: string;
  frame_id: string;
  activity_points: number;
  status: string;
  role: 'player' | 'moderator' | 'admin';
}

function cosmeticId(databaseId: string) {
  return databaseId.replace('-', '_');
}

function friendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'Неверная почта или пароль.';
  if (normalized.includes('email not confirmed')) return 'Сначала подтвердите почту по ссылке из письма.';
  if (normalized.includes('user already registered')) return 'Аккаунт с этой почтой уже существует.';
  if (normalized.includes('password should be')) return 'Пароль не соответствует требованиям безопасности.';
  if (normalized.includes('rate limit')) return 'Слишком много попыток. Подождите немного и попробуйте снова.';
  if (normalized.includes('registration_email_domain_not_allowed')) return 'Разрешена только корпоративная почта @yandex-team.ru.';
  return `Не удалось выполнить запрос: ${message}`;
}

const LOCAL_TEST_SESSION_KEY = 'boostplay.devTestSession.v1';

function localTestCredentials() {
  if (!import.meta.env.DEV) return null;
  const email = import.meta.env.VITE_DEV_TEST_EMAIL?.trim().toLowerCase();
  const password = import.meta.env.VITE_DEV_TEST_PASSWORD;
  return email && password ? { email, password } : null;
}

function localTestUser(): AuthUser {
  const avatarId = 'avatar_05';
  return {
    id: 'local-test-account',
    displayName: 'test',
    avatarId,
    frameId: 'frame_01',
    avatarUrl: findAvatarCosmetic(avatarId)?.imageUrl ?? null,
    rank: 0,
    bestScore: 0,
    prizeEligible: false,
    activityPoints: loadActivityPoints(),
    role: 'player',
  };
}

export class SupabaseAuthAdapter implements AuthAdapter {
  readonly restoresSession = true;
  private readonly client: SupabaseClient;

  constructor(url: string, publishableKey: string) {
    void url;
    void publishableKey;
    this.client = requireBoostplaySupabaseClient();
  }

  getInitialUser() { return null; }

  async register(request: RegistrationRequest): Promise<PendingEmailVerification> {
    const identity = createRegistrationIdentity(request.email);
    if (!identity) throw new Error('Используйте корпоративную почту @yandex-team.ru.');
    const referralCode = normalizeReferralCode(request.referralCode);
    const { error } = await this.client.auth.signUp({
      email: identity.email,
      password: request.password,
      options: { data: referralCode ? { referral_code: referralCode } : undefined },
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    return { ...identity, referralCode, simulated: false };
  }

  async signIn(request: PasswordLoginRequest) {
    const identity = createRegistrationIdentity(request.email);
    if (!identity) throw new Error('Используйте корпоративную почту @yandex-team.ru.');
    const testCredentials = localTestCredentials();
    if (testCredentials && identity.email === testCredentials.email && request.password === testCredentials.password) {
      window.localStorage.setItem(LOCAL_TEST_SESSION_KEY, 'active');
      return localTestUser();
    }
    const { data, error } = await this.client.auth.signInWithPassword({ email: identity.email, password: request.password });
    if (error) throw new Error(friendlyAuthError(error.message));
    return this.loadAuthUser(data.user);
  }

  async refreshSession() {
    if (localTestCredentials() && window.localStorage.getItem(LOCAL_TEST_SESSION_KEY) === 'active') return localTestUser();
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) return null;
    return this.loadAuthUser(data.user);
  }

  signInForDevelopment(): Promise<AuthUser> {
    return Promise.reject(new Error('Тестовый вход отключён при подключении Supabase.'));
  }

  async signOut() {
    if (import.meta.env.DEV && window.localStorage.getItem(LOCAL_TEST_SESSION_KEY) === 'active') {
      window.localStorage.removeItem(LOCAL_TEST_SESSION_KEY);
      return;
    }
    const { error } = await this.client.auth.signOut();
    if (error) throw new Error(friendlyAuthError(error.message));
  }

  private async loadAuthUser(user: User): Promise<AuthUser> {
    const { data, error } = await this.client
      .from('profiles')
      .select('display_name, avatar_id, frame_id, activity_points, status, role')
      .eq('user_id', user.id)
      .single<ProfileRow>();
    if (error) throw new Error('Профиль не найден. Попробуйте войти ещё раз через несколько секунд.');
    if (data.status !== 'active') throw new Error('Доступ к профилю временно ограничен.');
    const avatarId = cosmeticId(data.avatar_id);
    let standing = null;
    try {
      standing = await loadRoversPlayerStanding(user.id);
    } catch {
      // Authentication must remain available when leaderboard loading is degraded.
    }
    return {
      id: user.id,
      displayName: data.display_name,
      avatarId,
      frameId: cosmeticId(data.frame_id),
      avatarUrl: findAvatarCosmetic(avatarId)?.imageUrl ?? null,
      activityPoints: data.activity_points,
      role: data.role,
      rank: standing?.rank ?? 0,
      bestScore: standing?.bestScore ?? 0,
      prizeEligible: false,
    };
  }
}
