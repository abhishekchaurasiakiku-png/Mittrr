import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiUserPlus, FiLogIn, FiMessageCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import '../styles/auth.css';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const result = await signIn(email, password);
        if (result.error) setError(result.error);
      } else {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }

        // Validate username allows only letters, numbers, and _ ? #
        const usernameRegex = /^[a-zA-Z0-9_?#]+$/;
        if (!usernameRegex.test(username.trim())) {
          setError('Username can only contain letters, numbers, and special characters _ ? #');
          setLoading(false);
          return;
        }

        const result = await signUp(email, password, username.trim(), fullName.trim());
        if (result.error) {
          setError(result.error);
        } else {
          setSignupSuccess(true);
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSignupSuccess(false);
  };

  if (signupSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-bg-effects">
          <div className="auth-bg-orb auth-bg-orb-1" />
          <div className="auth-bg-orb auth-bg-orb-2" />
          <div className="auth-bg-orb auth-bg-orb-3" />
        </div>
        <div className="auth-card">
          <div className="auth-success">
            <div className="auth-success-icon">✓</div>
            <h2>Account Created!</h2>
            <p>Check your email to verify your account, then sign in.</p>
            <button className="auth-btn" onClick={() => { setIsLogin(true); setSignupSuccess(false); }}>
              <FiLogIn /> Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-bg-effects">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-orb auth-bg-orb-3" />
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <FiMessageCircle size={32} />
          </div>
          <h1>KIKU</h1>
          <p className="auth-subtitle">{isLogin ? 'Welcome back!' : 'Create your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="auth-field">
                <div className="auth-field-icon"><FiUser /></div>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="auth-field">
                <div className="auth-field-icon"><FiUserPlus /></div>
                <input
                  id="username"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </>
          )}

          <div className="auth-field">
            <div className="auth-field-icon"><FiMail /></div>
            <input
              id="email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-icon"><FiLock /></div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
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

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <div className="auth-spinner" />
            ) : isLogin ? (
              <><FiLogIn /> Sign In</>
            ) : (
              <><FiUserPlus /> Create Account</>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button className="auth-toggle" onClick={toggleMode}>
          {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
        </button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/admin/login" style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}>
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
