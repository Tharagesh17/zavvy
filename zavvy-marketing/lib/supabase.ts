
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client with fallback to avoid build errors
// We still check for values before operations in our logic if needed, 
// but this prevents the 'npm run build' from crashing immediately
export const supabase = createClient(supabaseUrl, supabaseKey);
