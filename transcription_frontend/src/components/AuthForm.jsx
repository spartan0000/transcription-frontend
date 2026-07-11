import { useState } from 'react';
import { apiRequest } from '../api.js';

export default function AuthForm({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | register
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError(null);
    setInfo(null);
    setPassword('');
  }

  async function handleLogin(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = await apiRequest('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
      });
      onLogin(data.access_token, usernameOrEmail);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = await apiRequest('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      setUsernameOrEmail(data.username);
      setPassword('');
      setInfo('Account created. Please log in.');
      setMode('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <h2>{mode === 'login' ? 'Log In' : 'Create Account'}</h2>

      {error && (
        <div className="error-banner" role="alert">
          <strong>Error:</strong> {error}
          <button className="error-dismiss" onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {info && <p className="auth-info">{info}</p>}

      {mode === 'login' ? (
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="field-group">
            <label htmlFor="username_or_email">Username or Email</label>
            <input
              id="username_or_email"
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-record" type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log In'}
          </button>
          <button type="button" className="auth-switch" onClick={() => switchMode('register')}>
            Need an account? Register
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleRegister}>
          <div className="field-group">
            <label htmlFor="reg_username">Username</label>
            <input
              id="reg_username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="reg_email">Email</label>
            <input
              id="reg_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="reg_password">Password</label>
            <input
              id="reg_password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-record" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Register'}
          </button>
          <button type="button" className="auth-switch" onClick={() => switchMode('login')}>
            Already have an account? Log In
          </button>
        </form>
      )}
    </div>
  );
}
