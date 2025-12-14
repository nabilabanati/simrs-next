import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side, aman untuk browser
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON);
