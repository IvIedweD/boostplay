export type AuthMode = 'local' | 'server' | 'supabase';

export interface RuntimeConfig {
  apiBaseUrl: string;
  authMode: AuthMode;
  supabaseUrl: string;
  supabasePublishableKey: string;
  demoDataEnabled: boolean;
  configurationError: string | null;
}

function normalizeBaseUrl(value: string | undefined) {
  return (value ?? '').trim().replace(/\/+$/, '');
}

export function createRuntimeConfig(environment: Record<string, string | boolean | undefined>): RuntimeConfig {
  const production = environment.PROD === true || environment.MODE === 'production';
  const apiBaseUrl = normalizeBaseUrl(typeof environment.VITE_API_BASE_URL === 'string' ? environment.VITE_API_BASE_URL : undefined);
  const supabaseUrl = normalizeBaseUrl(typeof environment.VITE_SUPABASE_URL === 'string' ? environment.VITE_SUPABASE_URL : undefined);
  const supabasePublishableKey = typeof environment.VITE_SUPABASE_PUBLISHABLE_KEY === 'string'
    ? environment.VITE_SUPABASE_PUBLISHABLE_KEY.trim()
    : typeof environment.VITE_SUPABASE_ANON_KEY === 'string'
      ? environment.VITE_SUPABASE_ANON_KEY.trim()
      : '';
  const requestedMode = environment.VITE_AUTH_MODE;
  let authMode: AuthMode = 'local';
  let configurationError: string | null = null;

  if (requestedMode === 'supabase') {
    if (supabaseUrl && supabasePublishableKey) authMode = 'supabase';
    else configurationError = 'Не заданы публичные параметры подключения Supabase.';
  } else if (requestedMode === 'server') {
    if (apiBaseUrl) authMode = 'server';
    else configurationError = 'Не задан адрес серверного API.';
  } else if (requestedMode === 'local' || requestedMode === undefined) {
    if (production) configurationError = 'Production-сборка не настроена для подключения к серверу.';
  } else {
    configurationError = 'Указан неизвестный режим авторизации.';
  }

  return {
    apiBaseUrl,
    authMode,
    supabaseUrl,
    supabasePublishableKey,
    demoDataEnabled: !production && authMode === 'local' && configurationError === null,
    configurationError,
  };
}

export const runtimeConfig = createRuntimeConfig(import.meta.env);
