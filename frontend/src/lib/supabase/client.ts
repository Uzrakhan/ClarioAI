import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | undefined;

export function createClient() {
  if (browserClient) return browserClient;

  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error("Supabase is not configured. Set the two NEXT_PUBLIC_SUPABASE variables in frontend/.env.local.");
  }

  browserClient = createBrowserClient(config.url, config.publishableKey);
  return browserClient;
}
