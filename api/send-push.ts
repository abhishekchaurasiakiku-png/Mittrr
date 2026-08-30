import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://sbqleiyzysrvpgiivztp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicWxlaXl6eXNydnBnaWl2enRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5ODYzNzcsImV4cCI6MjEwMzU2MjM3N30.nCjoOs7u2Yn9GuyhhR1a4i355dusD6HmZr4n0ilFtlc';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase credentials in API');
}

const supabase = createClient(supabaseUrl as string, supabaseServiceKey as string);

webpush.setVapidDetails(
  'mailto:support@mittrr.vercel.app',
  process.env.VAPID_PUBLIC_KEY || 'BFJBI2uIDwP3tFMLfHC2bmjAKz8mdB7eGYBG-FqRKfjtUftumqmLsCxaufvknhZGRg7OansdfgaVydM48-Rooxc',
  process.env.VAPID_PRIVATE_KEY || '7MFdOSQ-IpQ4TKEeL45dXQ8s2k6TjznmXSm0FhiaCUs'
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { receiver_id, sender_name, sender_avatar, message_content } = req.body;

  if (!receiver_id) {
    return res.status(400).json({ error: 'receiver_id is required' });
  }

  try {
    // 1. Fetch all push subscriptions for the receiver
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', receiver_id);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'No subscriptions found for user' });
    }

    // 2. Prepare the payload
    const payload = JSON.stringify({
      title: `✨ A sweet message for you from ${sender_name || 'Someone'} ✨`,
      body: message_content ? `"${message_content}"` : 'They sent you something nice! 💌',
      icon: sender_avatar || '/favicon.ico',
      badge: '/favicon.ico',
      url: '/', // When clicked, open the app
    });

    // 3. Send push to all registered devices
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription has expired or is no longer valid, delete it
          console.log('Deleting expired subscription:', sub.id);
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Error sending push to subscription', sub.id, err);
        }
      }
    });

    await Promise.all(sendPromises);

    res.status(200).json({ success: true, count: subscriptions.length });
  } catch (error: any) {
    console.error('Unexpected API error:', error);
    res.status(500).json({ error: error.message });
  }
}
