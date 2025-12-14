import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Debug: Check if env vars are loaded
console.log("🔧 Supabase Server Config:", {
  url: SUPABASE_URL,
  hasServiceKey: !!SUPABASE_SERVICE_ROLE,
  serviceKeyPreview: SUPABASE_SERVICE_ROLE?.substring(0, 20) + "..."
});

// Server-side client → full access (insert, update, delete)
export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});
