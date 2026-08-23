import { ApiClient } from '../../../shared/api/apiClient';
import type {
  AuthAdapter,
  AuthUser,
  PasswordLoginRequest,
  PendingEmailVerification,
  RegistrationRequest,
} from './authAdapter';

interface AuthUserResponse {
  user: AuthUser;
}

export class ServerAuthAdapter implements AuthAdapter {
  readonly restoresSession = true;

  constructor(private readonly api: ApiClient) {}

  getInitialUser() { return null; }

  register(request: RegistrationRequest) {
    return this.api.request<PendingEmailVerification>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async signIn(request: PasswordLoginRequest) {
    const response = await this.api.request<AuthUserResponse>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.user;
  }

  async refreshSession() {
    try {
      const response = await this.api.request<AuthUserResponse>('/v1/me');
      return response.user;
    } catch (error) {
      if (error instanceof Error && 'status' in error && error.status === 401) return null;
      throw error;
    }
  }

  signInForDevelopment(): Promise<AuthUser> {
    return Promise.reject(new Error('Тестовый вход отключён в серверном режиме.'));
  }

  signOut() {
    return this.api.request<void>('/v1/auth/logout', { method: 'POST' });
  }
}
