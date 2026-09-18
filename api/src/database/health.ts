/** Database connection health check used by the team to verify local setup. */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export interface DatabaseHealth {
  connected: boolean;
  message: string;
}

// Health Check - Confirm the env vars work against the real project
export async function checkDatabaseConnection(): Promise<DatabaseHealth> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return {
      connected: false,
      message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.',
    };
  }

  try {
    const client = createClient(url, key);
    const { error } = await client.from('_health_probe').select('*').limit(1);

    // Table Missing - Still proves we reached the database
    if (error && error.code !== 'PGRST205') {
      return { connected: false, message: error.message };
    }

    return { connected: true, message: 'Connected to Supabase.' };
  } catch (error) {
    return {
      connected: false,
      message: error instanceof Error ? error.message : 'Unknown connection error',
    };
  }
}
