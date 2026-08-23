import { describe, expect, it } from 'vitest';
import { createRuntimeConfig } from './runtimeConfig';

describe('createRuntimeConfig', () => {
  it('keeps explicit local mode for development', () => {
    expect(createRuntimeConfig({ VITE_AUTH_MODE: 'local', DEV: true })).toEqual({
      apiBaseUrl: '', authMode: 'local', supabaseUrl: '', supabasePublishableKey: '',
      demoDataEnabled: true, configurationError: null,
    });
  });

  it('reports an incomplete server configuration instead of silently using local data', () => {
    expect(createRuntimeConfig({ VITE_AUTH_MODE: 'server' })).toEqual({
      apiBaseUrl: '', authMode: 'local', supabaseUrl: '', supabasePublishableKey: '',
      demoDataEnabled: false, configurationError: 'Не задан адрес серверного API.',
    });
  });

  it('fails closed when production mode is missing', () => {
    expect(createRuntimeConfig({ PROD: true })).toEqual({
      apiBaseUrl: '', authMode: 'local', supabaseUrl: '', supabasePublishableKey: '',
      demoDataEnabled: false, configurationError: 'Production-сборка не настроена для подключения к серверу.',
    });
  });

  it('enables server auth only with an explicit API URL', () => {
    expect(createRuntimeConfig({ VITE_AUTH_MODE: 'server', VITE_API_BASE_URL: 'https://api.example.test/' })).toEqual({
      apiBaseUrl: 'https://api.example.test',
      authMode: 'server',
      supabaseUrl: '',
      supabasePublishableKey: '',
      demoDataEnabled: false,
      configurationError: null,
    });
  });

  it('enables Supabase auth only when both public values are configured', () => {
    expect(createRuntimeConfig({
      VITE_AUTH_MODE: 'supabase',
      VITE_SUPABASE_URL: 'https://project.supabase.co/',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    })).toEqual({
      apiBaseUrl: '',
      authMode: 'supabase',
      supabaseUrl: 'https://project.supabase.co',
      supabasePublishableKey: 'sb_publishable_test',
      demoDataEnabled: false,
      configurationError: null,
    });
  });

  it('reports missing Supabase values in production', () => {
    const config = createRuntimeConfig({ PROD: true, VITE_AUTH_MODE: 'supabase' });
    expect(config.configurationError).toBe('Не заданы публичные параметры подключения Supabase.');
    expect(config.demoDataEnabled).toBe(false);
  });
});
