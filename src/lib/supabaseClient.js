// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("AI Search Mastery: Supabase URL or Anon Key is missing. Please ensure your .env.local file is correctly configured with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. This is critical for connecting to our advanced framework backend.");
  throw new Error("Supabase environment variables are not set correctly.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Brand-aligned log for confirmation (optional, but good for debugging)
console.log("AI Search Mastery: Supabase client initialized. Connecting to the powerful MASTERY-AI Framework backend.");