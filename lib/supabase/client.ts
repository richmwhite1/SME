import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Singleton instance to prevent Multi-GoTrueClient warning
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  // Create and cache the client instance
  supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

