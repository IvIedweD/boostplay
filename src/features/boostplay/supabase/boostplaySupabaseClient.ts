import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { runtimeConfig } from '../../../config/runtimeConfig';

let client: SupabaseClient | null = null;

export function getBoostplaySupabaseClient() {
  if (runtimeConfig.authMode !== 'supabase') return null;
  client ??= createClient(
    runtimeConfig.supabaseUrl,
    runtimeConfig.supabasePublishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
  return client;
}

export function requireBoostplaySupabaseClient() {
  const configuredClient = getBoostplaySupabaseClient();
  if (!configuredClient) throw new Error('Supabase не настроен.');
  return configuredClient;
}
