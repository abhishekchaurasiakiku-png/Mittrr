import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { FiLock, FiMail, FiShield, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import '../../styles/auth.css'; // Reuse auth styles

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="auth-container">
      <div className="auth-bg-effects">
        <div className="auth-bg-orb auth-bg-orb-1" style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.6), transparent)' }} />
        <div className="auth-bg-orb auth-bg-orb-2" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.4), transparent)' }} />
        <div className="auth-bg-orb auth-bg-orb-3" style={{ background: 'radial-gradient(circle, rgba(185,28,28,0.5), transparent)' }} />
      </div>

      <div className="auth-card" style={{ borderColor: 'rgba(239,68,68,0.2)', boxShadow: '0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,68,68,0.1) inset' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', boxShadow: '0 8px 24px rgba(239,68,68,0.4)' }}>
            <FiShield size={32} />
          </div>
          <h1 style={{ background: 'linear-gradient(135deg, #fff, #fca5a5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Admin Portal
          </h1>
          <p className="auth-subtitle">Authorized personnel only</p>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-field">
            <div className="auth-field-icon"><FiMail /></div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email"
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-icon"><FiLock /></div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="has-toggle"
            />
            <button 
              type="button" 
              className="auth-field-toggle" 
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button 
            type="submit" 
            className="auth-btn" 
            disabled={loading}
            style={{ 
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              boxShadow: '0 4px 16px rgba(220,38,38,0.3)'
            }}
          >
            {loading ? <div className="auth-spinner" /> : (
              <>
                <FiShield /> Login to Admin
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>Return</span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/auth" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
            <FiArrowLeft /> Back to User Login
          </Link>
        </div>
      </div>
    </div>
  );
}
