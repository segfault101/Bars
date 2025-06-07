import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlcnrimluhjyxqlbeebx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsY25yaW1sdWhqeXhxbGJlZWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyOTIxNjMsImV4cCI6MjA2NDg2ODE2M30.RVZql7Nxmk9VooSLW6-JTXig92QQdMixLJU4TLJb8D4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);