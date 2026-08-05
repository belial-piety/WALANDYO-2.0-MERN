import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await login(username, password);
      if (res.success) {
        navigate('/counter');
      }
    } catch (err) {
      setError(err.message || 'Incorrect username or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-body">
      <div className="login-card">
        <div className="brand-badge large">W</div>
        <h1 className="login-title">WALANDYO TAPSILOGAN</h1>
        <p className="login-tagline">Integrated Point-of-Sale System</p>

        {error && (
          <div className="alert alert-error" style={{ textAlign: 'left' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field-label">Username</label>
          <input
            type="text"
            className="field-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
            autoFocus
          />

          <label className="field-label">Password</label>
          <input
            type="password"
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: '20px', padding: '12px' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="login-hint">
          <strong>Demo Accounts:</strong><br />
          Admin: <code>admin</code> / <code>admin123</code><br />
          Manager: <code>manager1</code> / <code>manager123</code><br />
          Cashier: <code>cashier1</code> / <code>cashier123</code><br />
          Inventory: <code>inventory1</code> / <code>inventory123</code>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
