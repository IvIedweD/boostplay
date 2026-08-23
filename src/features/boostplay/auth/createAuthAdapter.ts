import { runtimeConfig, type RuntimeConfig } from '../../../config/runtimeConfig';
import { ApiClient } from '../../../shared/api/apiClient';
import { LocalDevelopmentAuthAdapter, type AuthAdapter } from './authAdapter';
import { ServerAuthAdapter } from './serverAuthAdapter';
import { SupabaseAuthAdapter } from './supabaseAuthAdapter';

export function createAuthAdapter(config: RuntimeConfig = runtimeConfig): AuthAdapter {
  if (config.authMode === 'server') return new ServerAuthAdapter(new ApiClient(config.apiBaseUrl));
  if (config.authMode === 'supabase') return new SupabaseAuthAdapter(config.supabaseUrl, config.supabasePublishableKey);
  return new LocalDevelopmentAuthAdapter();
}
