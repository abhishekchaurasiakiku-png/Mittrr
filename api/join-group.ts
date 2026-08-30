import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, user_id } = req.body;

  if (!token || !user_id) {
    return res.status(400).json({ error: 'Missing token or user_id' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error: missing Supabase keys.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Find the conversation by token
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('id, type, name')
      .eq('invite_token', token)
      .single();

    if (convError || !conv) {
      return res.status(404).json({ error: 'Invalid or expired invite link.' });
    }

    if (conv.type !== 'group') {
      return res.status(400).json({ error: 'This invite link is not for a group chat.' });
    }

    // 2. Add the user to the conversation
    const { error: insertError } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: conv.id,
        user_id: user_id
      });

    if (insertError) {
      // 23505 is the Postgres error code for unique constraint violation
      if (insertError.code !== '23505') { 
        console.error('Insert error:', insertError);
        return res.status(500).json({ error: 'Failed to join the group.' });
      }
    }

    return res.status(200).json({ success: true, conversation_id: conv.id });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
}
