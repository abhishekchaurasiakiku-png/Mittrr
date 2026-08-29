import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FiLoader, FiAlertCircle } from 'react-icons/fi';
import '../styles/chat.css';

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function joinGroup() {
      if (!user || !token) return;

      try {
        // Find the conversation by token
        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .select('id, type, name')
          .eq('invite_token', token)
          .single();

        if (convError || !conv) {
          setError('Invalid or expired invite link.');
          return;
        }

        if (conv.type !== 'group') {
          setError('This invite link is not for a group chat.');
          return;
        }

        // Add the user to the conversation
        const { error: insertError } = await supabase
          .from('conversation_participants')
          .insert({
            conversation_id: conv.id,
            user_id: user.id
          });

        if (insertError) {
          // If the error is a unique constraint violation, it means they are already in the group
          if (insertError.code !== '23505') { 
             console.error(insertError);
             setError('Failed to join the group.');
             return;
          }
        }

        // Successfully joined or already in the group
        navigate(`/?conv=${conv.id}`, { replace: true });
      } catch (err) {
        console.error(err);
        setError('An unexpected error occurred.');
      }
    }

    joinGroup();
  }, [token, user, navigate]);

  return (
    <div className="chat-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
        {error ? (
          <>
            <FiAlertCircle size={48} color="var(--red)" style={{ margin: '0 auto 1rem', display: 'block' }} />
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Failed to Join</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
            <button className="new-chat-btn" onClick={() => navigate('/', { replace: true })}>
              Go to App
            </button>
          </>
        ) : (
          <>
            <FiLoader size={48} color="var(--accent-primary)" style={{ margin: '0 auto 1rem', display: 'block', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ color: 'var(--text-primary)' }}>Joining Group...</h2>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </>
        )}
      </div>
    </div>
  );
}
