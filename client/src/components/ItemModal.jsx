import { useState } from 'react';
import ImageSlot from './ImageSlot.jsx';

export default function ItemModal({ item, lang, strings, whatsappEnabled, onAddToCart, onClose }) {
  const isAr = lang === 'ar';
  const name = isAr ? item.nameAr : item.nameEn;
  const desc = isAr ? item.descAr : item.descEn;
  const hasBuilder = !!(item.buildConfig && item.buildConfig.length);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const nutritionFacts = [
    { label: strings.nutritionLabels.cal, value: item.nutrition.cal ?? '—' },
    { label: strings.nutritionLabels.protein, value: item.nutrition.protein ?? '—' },
    { label: strings.nutritionLabels.carbs, value: item.nutrition.carbs ?? '—' },
    { label: strings.nutritionLabels.fat, value: item.nutrition.fat ?? '—' },
  ];

  function handleAddToOrder() {
    onAddToCart({ itemId: item.id, nameEn: item.nameEn, nameAr: item.nameAr, price: item.price, quantity: qty });
    setJustAdded(true);
    setQty(1);
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fffffc', borderRadius: 20, maxWidth: 440, width: '100%', maxHeight: '86vh', overflow: 'auto' }}
      >
        <ImageSlot
          src={item.image}
          alt={name}
          shape="rect"
          placeholder={name}
          style={{ width: '100%', height: 220, borderRadius: '20px 20px 0 0' }}
        />
        <div style={{ padding: 'clamp(20px,6vw,32px)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ fontFamily: strings.headingFont, fontWeight: 700, fontSize: 28, textTransform: 'lowercase' }}>
              {name}
            </div>
            <button
              onClick={onClose}
              aria-label="close"
              style={{ border: 'none', background: '#f3f0df', color: '#171a18', width: 30, height: 30, borderRadius: '50%', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: strings.bodyFont, fontWeight: 700, fontSize: 16, color: 'var(--brand-accent)', marginTop: 4 }}>
            {strings.currencyLabel ? (
              <span>{strings.currencyLabel}</span>
            ) : (
              <img src="/assets/ryal.svg" alt="SAR" style={{ height: 14, width: 'auto' }} />
            )}
            {item.price}
          </div>
          {whatsappEnabled && hasBuilder ? (
            <div style={{ fontFamily: strings.bodyFont, fontSize: 13, color: '#5a5f5a', marginTop: 16, fontStyle: 'italic' }}>
              {strings.buildYourOwnAddNote}
            </div>
          ) : null}
          {whatsappEnabled && !hasBuilder ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.15)', background: '#fff', cursor: 'pointer', fontSize: 17, fontWeight: 700, lineHeight: 1 }}
                >
                  −
                </button>
                <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700, fontFamily: strings.bodyFont, fontSize: 15 }}>{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.15)', background: '#fff', cursor: 'pointer', fontSize: 17, fontWeight: 700, lineHeight: 1 }}
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToOrder}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: justAdded ? 'var(--brand-primary)' : '#25D366', color: '#fff', border: 'none',
                  fontFamily: strings.bodyFont, fontWeight: 700, fontSize: 14, borderRadius: 999,
                  padding: '12px 18px', minHeight: 44, cursor: 'pointer',
                }}
              >
                {justAdded ? strings.addedToOrderCta : strings.addToOrderCta}
              </button>
            </div>
          ) : null}
          {desc ? (
            <div style={{ fontFamily: strings.bodyFont, fontSize: 14.5, lineHeight: 1.6, color: '#5a5f5a', marginTop: 14 }}>
              {desc}
            </div>
          ) : null}
          {strings.nutritionGloballyEnabled && item.nutritionEnabled ? (
            <div style={{ marginTop: 22, borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 18 }}>
              <div style={{ fontFamily: strings.bodyFont, fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#171a18', marginBottom: 12 }}>
                {strings.nutritionTitle}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {nutritionFacts.map(fact => (
                  <div key={fact.label} style={{ background: '#f3f0df', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: strings.bodyFont, fontWeight: 700, fontSize: 17, color: 'var(--brand-primary)' }}>{fact.value}</div>
                    <div style={{ fontFamily: strings.bodyFont, fontSize: 11, color: '#5a5f5a', marginTop: 2 }}>{fact.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: strings.bodyFont, fontStyle: 'italic', fontSize: 12, color: '#8a8f8a', marginTop: 12 }}>
                {strings.nutritionNote}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
