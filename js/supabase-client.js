import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ===== Fill these in from your Supabase project (Settings → API) =====
const SUPABASE_URL = 'https://dggtwvxlbtsjbgktkxfp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZ3R3dnhsYnRzamJna3RreGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MjAzMjYsImV4cCI6MjA5ODE5NjMyNn0.c0VrGlMGwz7v9f26s8zapwYFChiltiDn_-rCqRRLl6Y';
// =======================================================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);