import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api';
import { colors, font, headingFont, field, label, fieldGroup, button } from '../admin/theme';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await api.login(email, password);
      setToken(token);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(circle at 50% 0%, ${colors.cream} 0%, ${colors.bg} 55%)`, fontFamily: font, padding: 20,
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: 360, padding: '36px 32px', background: '#fff', border: `1px solid ${colors.border}`,
          borderRadius: 24, boxShadow: '0 12px 40px rgba(0,68,56,0.08)',
        }}
      >
        <img src="/assets/logo.svg" alt="lychee's" style={{ height: 22, marginBottom: 28, display: 'block' }} />
        <h1 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 24, margin: '0 0 4px', color: colors.ink }}>
          admin login
        </h1>
        <p style={{ fontSize: 12.5, color: colors.faint, margin: '0 0 24px' }}>
          sign in to manage the menu
        </p>

        <div style={fieldGroup({ marginBottom: 16 })}>
          <label htmlFor="admin-email" style={label()}>email</label>
          <input
            id="admin-email"
            className="admin-field"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="username"
            style={field()}
          />
        </div>

        <div style={fieldGroup({ marginBottom: error ? 12 : 24 })}>
          <label htmlFor="admin-password" style={label()}>password</label>
          <input
            id="admin-password"
            className="admin-field"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={field()}
          />
        </div>

        {error ? (
          <div className="admin-fade-in" style={{
            color: colors.danger, fontSize: 12.5, marginBottom: 20, background: 'rgba(178,59,59,0.08)',
            border: '1px solid rgba(178,59,59,0.25)', borderRadius: 8, padding: '8px 12px',
          }}>
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={busy} className="admin-btn" style={button('primary', { width: '100%', padding: '12px 0', fontSize: 13.5 })}>
          {busy ? 'signing in…' : 'sign in'}
        </button>
      </form>
    </div>
  );
}
