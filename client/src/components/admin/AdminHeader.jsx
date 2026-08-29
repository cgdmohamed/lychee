import { NavLink, useNavigate } from 'react-router-dom';
import { setToken } from '../../api';
import { colors, button } from '../../admin/theme';

const TABS = [
  { to: '/admin', label: 'menu', end: true },
  { to: '/admin/text', label: 'site text' },
];

export default function AdminHeader() {
  const navigate = useNavigate();

  function logout() {
    setToken(null);
    navigate('/admin/login', { replace: true });
  }

  return (
    <div style={{
      position: 'sticky', top: 0, background: 'rgba(255,255,252,0.92)', backdropFilter: 'blur(6px)',
      borderBottom: `1px solid ${colors.border}`, zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/assets/logo.svg" alt="lychee's" style={{ height: 18 }} />
          <span style={{
            fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: colors.accent, background: 'rgba(111,160,136,0.12)', padding: '3px 9px', borderRadius: 999,
          }}>
            admin
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <a href="/" target="_blank" rel="noopener" style={{ fontSize: 12.5, color: colors.muted, textDecoration: 'none', fontWeight: 600 }}>
            view menu ↗
          </a>
          <button onClick={logout} className="admin-btn" style={button('ghost')}>log out</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '0 28px' }}>
        {TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            style={({ isActive }) => ({
              padding: '8px 14px',
              fontSize: 12.5,
              fontWeight: 700,
              textDecoration: 'none',
              color: isActive ? colors.primary : colors.muted,
              borderBottom: isActive ? `2px solid ${colors.primary}` : '2px solid transparent',
            })}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
