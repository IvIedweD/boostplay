import { boostplayPlayer } from '../data/mockBoostplayData';
import { createRegistrationIdentity, normalizeReferralCode } from './registrationPolicy';

export interface AuthUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  rank: number;
  bestScore: number;
  prizeEligible: boolean;
  avatarId?: string;
  frameId?: string;
  activityPoints?: number;
  role?: 'player' | 'moderator' | 'admin';
}

export interface RegistrationRequest {
  email: string;
  password: string;
  referralCode?: string | null;
}

export interface PendingEmailVerification {
  email: string;
  displayName: string;
  referralCode: string | null;
  simulated: boolean;
}

export interface PasswordLoginRequest {
  email: string;
  password: string;
}

export interface AuthAdapter {
  readonly restoresSession?: boolean;
  getInitialUser(): AuthUser | null;
  register(request: RegistrationRequest): Promise<PendingEmailVerification>;
  signIn(request: PasswordLoginRequest): Promise<AuthUser>;
  signInForDevelopment(): Promise<AuthUser>;
  signOut(): Promise<void>;
  refreshSession?(): Promise<AuthUser | null>;
}

export interface FutureServerAuthAdapter extends AuthAdapter {
  refreshSession(): Promise<AuthUser | null>;
}

export class LocalDevelopmentAuthAdapter implements AuthAdapter {
  getInitialUser(): AuthUser | null {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('auth') === 'demo') return boostplayPlayer;
    return null;
  }

  async register(request: RegistrationRequest): Promise<PendingEmailVerification> {
    const identity = createRegistrationIdentity(request.email);
    if (!identity) throw new Error('Используйте корпоративную почту @yandex-team.ru.');
    return {
      ...identity,
      referralCode: normalizeReferralCode(request.referralCode),
      simulated: true,
    };
  }

  async signIn(request: PasswordLoginRequest) {
    const identity = createRegistrationIdentity(request.email);
    if (!identity) throw new Error('Используйте корпоративную почту @yandex-team.ru.');
    if (!request.password) throw new Error('Введите пароль.');
    return { ...boostplayPlayer, displayName: identity.displayName };
  }

  async signInForDevelopment() { return boostplayPlayer; }
  async signOut() { return Promise.resolve(); }
}
