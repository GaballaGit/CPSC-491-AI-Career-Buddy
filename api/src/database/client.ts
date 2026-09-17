/**
 * Shared Supabase database client.
 *
 * The client is created lazily so local development can start
 * even when Supabase credentials have not been configured yet.
 */

import 'dotenv/config';

import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js';

let databaseClient: SupabaseClient | null = null;

/**
 * Return the shared Supabase client.
 *
 * Throws only when database functionality is actually requested
 * without the required environment variables.
 */
export function getDatabaseClient(): SupabaseClient {
  if (databaseClient) {
    return databaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  databaseClient = createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return databaseClient;
}