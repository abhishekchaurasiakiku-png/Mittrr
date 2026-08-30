import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://sbqleiyzysrvpgiivztp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicWxlaXl6eXNydnBnaWl2enRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5ODYzNzcsImV4cCI6MjEwMzU2MjM3N30.nCjoOs7u2Yn9GuyhhR1a4i355dusD6HmZr4n0ilFtlc';

const supabase = createClient(supabaseUrl as string, supabaseServiceKey as string);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, username, full_name } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required.' });
  }

  try {
    // If service role key is configured, use admin API for unlimited instant signups without email verification
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: user, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          full_name: full_name || username,
        },
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ success: true, user: user.user });
    }

    // Fallback standard signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: full_name || username,
        },
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
