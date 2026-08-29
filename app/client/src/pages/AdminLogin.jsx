import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api';

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffffc', fontFamily: "'Nunito Sans', sans-serif" }}>
      <form onSubmit={handleSubmit} style={{ width: 320, padding: 32, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 20 }}>
        <img src="/assets/logo.svg" alt="lychee's" style={{ height: 22, marginBottom: 24, display: 'block' }} />
        <h1 style={{ fontFamily: "'Domine', serif", fontSize: 22, margin: '0 0 20px', color: '#171a18' }}>admin login</h1>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#171a18' }}>email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.2)', marginBottom: 16, fontSize: 14 }}
        />
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#171a18' }}>password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.2)', marginBottom: 20, fontSize: 14 }}
        />
        {error ? <div style={{ color: '#b23b3b', fontSize: 13, marginBottom: 16 }}>{error}</div> : null}
        <button
          type="submit"
          disabled={busy}
          style={{ width: '100%', background: '#004438', color: '#fffffc', border: 'none', borderRadius: 999, padding: '12px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          {busy ? 'signing in…' : 'sign in'}
        </button>
      </form>
    </div>
  );
}
