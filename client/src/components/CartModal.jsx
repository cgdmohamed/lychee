import { logEvent } from '../api';
import { WhatsAppIcon } from './SocialIcons.jsx';

function qtyButtonStyle() {
  return {
    width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.15)',
    background: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#171a18',
  };
}

function Price({ amount, strings }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {strings.currencyLabel ? (
        <span>{strings.currencyLabel}</span>
      ) : (
        <img src="/assets/ryal.svg" alt="SAR" style={{ height: 12, width: 'auto' }} />
      )}
      {amount}
    </span>
  );
}

export default function CartModal({ cart, lang, strings, whatsappNumber, onClose, onUpdateQuantity, onRemove, onSent }) {
  const isAr = lang === 'ar';
  const total = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);

  function handleSend() {
    const lines = cart.map(l => ({
      name: isAr ? l.nameAr : l.nameEn,
      qty: l.quantity,
      lineTotal: l.price * l.quantity,
    }));
    const message = strings.cartMessage(lines, total);
    const digits = whatsappNumber.replace(/[^\d]/g, '');
    // One event per cart line (not one per cart) so each item's own click count in
    // analytics stays meaningful, same as the old single-item flow logged.
    cart.forEach(l => logEvent('whatsapp_click', { itemId: l.itemId }));
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    onSent?.();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="cart-slide-up"
        style={{
          background: '#fffffc', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480,
          maxHeight: '82vh', display: 'flex', flexDirection: 'column', direction: isAr ? 'rtl' : 'ltr',
        }}
      >
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ fontFamily: strings.headingFont, fontWeight: 700, fontSize: 19 }}>{strings.cartTitle}</div>
          <button
            onClick={onClose}
            aria-label={strings.cartCloseCta}
            style={{ border: 'none', background: '#f3f0df', color: '#171a18', width: 30, height: 30, borderRadius: '50%', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#8a8f8a', fontFamily: strings.bodyFont, fontSize: 14 }}>
              {strings.cartEmpty}
            </div>
          ) : (
            cart.map(line => (
              <div key={line.key} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: strings.bodyFont, fontWeight: 700, fontSize: 14, textTransform: 'lowercase' }}>
                    {isAr ? line.nameAr : line.nameEn}
                  </div>
                  {(isAr ? line.buildSummaryAr : line.buildSummaryEn) ? (
                    <div style={{ fontFamily: strings.bodyFont, fontSize: 11.5, color: '#8a8f8a', marginTop: 2 }}>
                      {isAr ? line.buildSummaryAr : line.buildSummaryEn}
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <button onClick={() => onUpdateQuantity(line.key, line.quantity - 1)} style={qtyButtonStyle()}>−</button>
                    <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 700, fontFamily: strings.bodyFont, fontSize: 14 }}>
                      {line.quantity}
                    </span>
                    <button onClick={() => onUpdateQuantity(line.key, line.quantity + 1)} style={qtyButtonStyle()}>+</button>
                    <button
                      onClick={() => onRemove(line.key)}
                      style={{
                        marginInlineStart: 'auto', border: 'none', background: 'none', color: '#b23b3b',
                        fontSize: 12, fontWeight: 700, fontFamily: strings.bodyFont, cursor: 'pointer', padding: '4px 0',
                      }}
                    >
                      {strings.cartRemoveCta}
                    </button>
                  </div>
                </div>
                <div style={{ fontFamily: strings.bodyFont, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
                  <Price amount={line.price * line.quantity} strings={strings} />
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 ? (
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, fontFamily: strings.bodyFont }}>
              <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{strings.cartTotalLabel}</span>
              <span style={{ fontWeight: 700, fontSize: 18 }}><Price amount={total} strings={strings} /></span>
            </div>
            <button
              onClick={handleSend}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
                background: '#25D366', color: '#fff', border: 'none', borderRadius: 999,
                fontFamily: strings.bodyFont, fontWeight: 700, fontSize: 14.5, padding: '14px 18px', minHeight: 50, cursor: 'pointer',
              }}
            >
              <WhatsAppIcon size={20} />
              {strings.whatsappCta}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
