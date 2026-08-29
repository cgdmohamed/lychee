import ImageSlot from './ImageSlot.jsx';

export default function ItemModal({ item, lang, strings, onClose }) {
  const isAr = lang === 'ar';
  const name = isAr ? item.nameAr : item.nameEn;
  const desc = isAr ? item.descAr : item.descEn;
  const nutritionFacts = [
    { label: strings.nutritionLabels.cal, value: item.nutrition.cal ?? '—' },
    { label: strings.nutritionLabels.protein, value: item.nutrition.protein ?? '—' },
    { label: strings.nutritionLabels.carbs, value: item.nutrition.carbs ?? '—' },
    { label: strings.nutritionLabels.fat, value: item.nutrition.fat ?? '—' },
  ];

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: strings.bodyFont, fontWeight: 700, fontSize: 16, color: '#6fa088', marginTop: 4 }}>
            <img src="/assets/ryal.svg" alt="SAR" style={{ height: 14, width: 'auto' }} />
            {item.price}
          </div>
          {desc ? (
            <div style={{ fontFamily: strings.bodyFont, fontSize: 14.5, lineHeight: 1.6, color: '#5a5f5a', marginTop: 14 }}>
              {desc}
            </div>
          ) : null}
          <div style={{ marginTop: 22, borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 18 }}>
            <div style={{ fontFamily: strings.bodyFont, fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#171a18', marginBottom: 12 }}>
              {strings.nutritionTitle}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {nutritionFacts.map(fact => (
                <div key={fact.label} style={{ background: '#f3f0df', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: strings.bodyFont, fontWeight: 700, fontSize: 17, color: '#004438' }}>{fact.value}</div>
                  <div style={{ fontFamily: strings.bodyFont, fontSize: 11, color: '#5a5f5a', marginTop: 2 }}>{fact.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: strings.bodyFont, fontStyle: 'italic', fontSize: 12, color: '#8a8f8a', marginTop: 12 }}>
              {strings.nutritionNote}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
