import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import getDefaultRoute from '../../utils/roleRoutes';

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
        navigate(getDefaultRoute(res.data.user.role));
      }
    } catch (err) {
      setError(err.message || 'Incorrect username or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-body">
      <div className="login-shell">
        <div className="login-brand">
          <img
            className="login-logo"
            src="/images/Walandyo%20Tapsilogan.jpg"
            alt="Walandyo Tapsilogan"
          />
          <h1 className="login-title">WALANDYO TAPSILOGAN</h1>
          <p className="login-tagline">Integrated Point-of-Sale System</p>
        </div>

        <div className="login-card">
          {error && (
            <div className="alert alert-error" style={{ textAlign: 'left' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
          <label className="field-label">Username</label>
          <input
            type="text"
            className="field-input login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
            autoFocus
          />

          <label className="field-label">Password</label>
          <input
            type="password"
            className="field-input login-input"
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

        </div>

        <div className="login-hint" style={{ textAlign: 'left' }}>
          <strong>Demo Accounts</strong>
          <div style={{ marginTop: '6px', fontSize: '12px', lineHeight: '1.7' }}>
            <div>
              <strong style={{ color: '#cf1f21' }}>Admin</strong> (all branches):{' '}
              <code>admin</code> / <code>admin123</code>
            </div>
            <div style={{ marginTop: '6px' }}>
              <strong>Passwords by role:</strong> Manager = <code>manager123</code> · Cashier ={' '}
              <code>cashier123</code> · Inventory = <code>inventory123</code>
            </div>
            <div style={{ marginTop: '6px' }}>
              <strong>Branch usernames:</strong>
              <div style={{ marginTop: '2px' }}>
                Marikina (Main): <code>manager_marikina</code>, <code>cashier_marikina</code>,{' '}
                <code>inventory_marikina</code>
                <br />
                Angono: <code>manager_angono</code>, <code>cashier_angono</code>,{' '}
                <code>inventory_angono</code>
                <br />
                Mayamot, Antipolo: <code>manager_mayamot</code>, <code>cashier_mayamot</code>,{' '}
                <code>inventory_mayamot</code>
                <br />
                Penafrancia, Antipolo: <code>manager_penafrancia</code>,{' '}
                <code>cashier_penafrancia</code>, <code>inventory_penafrancia</code>
                <br />
                Angono Food Truck: <code>manager_angono_food_truck</code>,{' '}
                <code>cashier_angono_food_truck</code>, <code>inventory_angono_food_truck</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

