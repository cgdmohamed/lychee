import { WhatsAppIcon } from './SocialIcons.jsx';

export default function CartButton({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="order"
      style={{
        position: 'fixed', bottom: 20, insetInlineEnd: 20, zIndex: 40,
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#25D366', color: '#fff', border: 'none', borderRadius: 999,
        padding: '14px 20px', minHeight: 52, cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0,0,0,0.28)', fontWeight: 700, fontSize: 15,
      }}
    >
      <WhatsAppIcon size={22} />
      <span>({count})</span>
    </button>
  );
}
