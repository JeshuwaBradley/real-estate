
const SUPABASE_URL = "https://rfwxuqyarodopgwotksk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd3h1cXlhcm9kb3Bnd290a3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MjkxNzQsImV4cCI6MjA4NTEwNTE3NH0.VNXob6ed0xvAO6sGvIqg14C0VwAaUGF83ba0djD6XuA";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export { supabaseClient };