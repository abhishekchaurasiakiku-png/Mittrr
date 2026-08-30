import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Navigate } from 'react-router-dom';
import { FiLock, FiMail } from 'react-icons/fi';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import '../../styles/auth.css'; // Reuse auth styles

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, loading: adminAuthLoading } = useAdminAuth();

  // If already logged in as admin, redirect to dashboard
  if (!adminAuthLoading && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== 'abhishekchaurasiakiku@gmail.com') {
      setError('Unauthorized email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ background: 'var(--bg-primary)' }}>
      <div className="auth-card" style={{ border: '1px solid var(--border-color)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
        <div className="auth-header">
          <div className="auth-logo" style={{ color: 'var(--red)', background: 'rgba(255, 59, 48, 0.1)' }}>
            <FiLock size={32} />
          </div>
          <h1>Admin Portal</h1>
          <p>Authorized personnel only</p>
        </div>

        {error && <div className="auth-error" style={{ background: 'rgba(255, 59, 48, 0.1)', color: 'var(--red)', border: '1px solid var(--red)' }}>{error}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Admin Email</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                style={{ borderColor: 'var(--border-color)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ borderColor: 'var(--border-color)' }}
              />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading} style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
            {loading ? <div className="btn-spinner" /> : 'Login to Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
