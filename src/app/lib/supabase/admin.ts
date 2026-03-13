import { createClient } from '@supabase/supabase-js';

let cachedClient: ReturnType<typeof createClient> | null = null;

function getSupabaseAdminClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or service role key in environment');
  }

  cachedClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
}

export const supabaseAdmin: any = new Proxy({}, {
  get(_target, property) {
    return Reflect.get(getSupabaseAdminClient(), property);
  },
});
