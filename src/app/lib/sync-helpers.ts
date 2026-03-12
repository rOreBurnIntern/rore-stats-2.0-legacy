import { supabaseAdmin } from './supabase/admin';

export interface SyncLogEntry {
  endpoint: string;
  status: 'success' | 'error';
  records_ingested: number;
  error_message?: string;
  started_at: string;
  completed_at: string;
}

export async function logSync(startedAt: Date, endpoint: string, status: 'success' | 'error', records: number, error?: string): Promise<void> {
  const completedAt = new Date();
  const { error: dbError } = await supabaseAdmin
    .from('sync_log')
    .insert({
      endpoint,
      status,
      records_ingested: records,
      error_message: error ?? null,
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
    });

  if (dbError) {
    console.error('Failed to write sync_log:', dbError);
  }
}

export function checkCronSecret(req: Request): boolean {
  const secret = req.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;
  return !!expectedSecret && secret === expectedSecret;
}
