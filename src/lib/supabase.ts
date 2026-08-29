import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sbqleiyzysrvpgiivztp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicWxlaXl6eXNydnBnaWl2enRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5ODYzNzcsImV4cCI6MjEwMzU2MjM3N30.nCjoOs7u2Yn9GuyhhR1a4i355dusD6HmZr4n0ilFtlc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
