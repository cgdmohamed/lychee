import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { getStrings } from '../i18n';
import ImageSlot from '../components/ImageSlot.jsx';
import ItemRow from '../components/ItemRow.jsx';
import ItemModal from '../components/ItemModal.jsx';

const SOCIAL_LINKS = [
  { label: 'IG', name: 'Instagram', href: 'https://www.instagram.com/lycheesaudi' },
  { label: 'TT', name: 'TikTok', href: 'https://www.tiktok.com/@lycheesaudi' },
  { label: 'SC', name: 'Snapchat', href: 'https://www.snapchat.com/add/lycheesaudi' },
];

export default function MenuPage() {
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [lang, setLang] = useState('en');
  const [activeCat, setActiveCat] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  const [builderOpen, setBuilderOpen] = useState({});
  const [builderSelections, setBuilderSelections] = useState({});
  const [builderAmount, setBuilderAmount] = useState({});

  useEffect(() => {
    api.getMenu()
      .then(data => {
        setMenu(data);
        if (data.categories.length) setActiveCat(data.categories[0].key);
      })
      .catch(err => setError(err.message));
  }, []);

  const strings = useMemo(() => getStrings(lang, menu?.settings), [lang, menu?.settings]);

  if (error) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#b23b3b' }}>Failed to load menu: {error}</div>;
  }
  if (!menu) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#5a5f5a' }}>Loading menu…</div>;
  }

  const activeCategory = menu.categories.find(c => c.key === activeCat) || menu.categories[0];
  const activeItem = activeCategory?.items.find(i => i.id === activeItemId) || null;

  function toggleOption(itemId, stepId, optionId, type) {
    setBuilderSelections(prev => {
      const itemSel = { ...(prev[itemId] || {}) };
      let sel = itemSel[stepId] || [];
      sel = type === 'single'
        ? (sel.includes(optionId) ? [] : [optionId])
        : (sel.includes(optionId) ? sel.filter(id => id !== optionId) : [...sel, optionId]);
      itemSel[stepId] = sel;
      return { ...prev, [itemId]: itemSel };
    });
  }

  return (
    <div style={{ direction: strings.dir, fontFamily: strings.bodyFont, background: '#fffffc', color: '#171a18', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,252,0.92)', backdropFilter: 'blur(6px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, flexWrap: 'wrap', padding: '14px clamp(16px,4vw,28px)', minHeight: 54,
      }}>
        <img src="/assets/logo.svg" alt="lychee's" style={{ height: 20, width: 'auto', display: 'block' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setLang(l => (l === 'en' ? 'ar' : 'en'))}
            style={{
              fontFamily: strings.bodyFont, fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase',
              background: '#004438', color: '#fffffc', border: 'none', borderRadius: 999, padding: '10px 18px', minHeight: 40, cursor: 'pointer',
            }}
          >
            {strings.toggleLabel}
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', height: 400, width: '100%', overflow: 'hidden' }}>
        <ImageSlot
          src={menu.settings.heroImage}
          shape="rect"
          placeholder="hero photo"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.62) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '48px 32px', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontFamily: strings.bodyFont, color: '#f2c6a7', fontWeight: 700, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
            {strings.heroTag}
          </div>
          <div style={{ fontFamily: strings.headingFont, color: '#fffffc', fontWeight: 700, fontSize: 'clamp(40px,7vw,72px)', lineHeight: 1, marginBottom: 20 }}>
            {strings.heroTitle}
          </div>
        </div>
      </div>

      {/* Category nav */}
      <div style={{
        position: 'sticky', top: 69, zIndex: 19, background: '#fffffc', borderBottom: '1px solid rgba(0,0,0,0.08)',
        overflowX: 'auto', whiteSpace: 'nowrap', padding: '20px 16px 22px',
      }}>
        {menu.categories.map(cat => {
          const active = cat.key === activeCategory.key;
          const label = strings.isAr ? cat.nameAr : cat.nameEn;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCat(cat.key)}
              style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 72,
                fontFamily: strings.bodyFont, border: 'none', background: 'none', padding: 0, marginInlineEnd: 14, cursor: 'pointer', verticalAlign: 'top',
              }}
            >
              <span style={{
                width: 60, height: 60, borderRadius: '50%', display: 'block', overflow: 'hidden', padding: 3,
                border: active ? '2.5px solid #004438' : '2.5px solid transparent', boxSizing: 'border-box',
              }}>
                <ImageSlot src={cat.iconImage} shape="circle" placeholder={label} style={{ width: '100%', height: '100%' }} />
              </span>
              <span style={{ fontSize: 11.5, fontWeight: active ? 700 : 600, lineHeight: 1.25, color: active ? '#004438' : '#171a18', whiteSpace: 'normal', textAlign: 'center' }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ marginTop: 40 }}>
          <div style={{ fontFamily: strings.headingFont, fontWeight: 700, fontSize: 'clamp(30px,5vw,44px)', color: '#171a18', textAlign: 'center', marginBottom: 8 }}>
            {strings.isAr ? activeCategory.nameAr : activeCategory.nameEn}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 9, marginBottom: 20 }}>
            {Array.from({ length: 13 }).map((_, i) => (
              <span key={i} style={{ width: 6, height: 6, background: '#6fa088', transform: 'rotate(45deg)', display: 'inline-block' }} />
            ))}
          </div>

          {activeCategory.items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              lang={lang}
              strings={strings}
              onOpenInfo={() => setActiveItemId(item.id)}
              builderOpen={!!builderOpen[item.id]}
              onToggleBuilderOpen={() => setBuilderOpen(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
              selections={builderSelections[item.id] || {}}
              amount={builderAmount[item.id] || 2}
              onToggleOption={(stepId, optionId, type) => toggleOption(item.id, stepId, optionId, type)}
              onSetAmount={val => setBuilderAmount(prev => ({ ...prev, [item.id]: val }))}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {SOCIAL_LINKS.map(s => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener"
                aria-label={s.name}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: '50%',
                  background: '#004438', color: '#fffffc', fontFamily: strings.bodyFont, fontSize: 11, fontWeight: 700, textDecoration: 'none',
                }}
              >
                {s.label}
              </a>
            ))}
          </div>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontFamily: strings.bodyFont, fontSize: 13, color: '#5a5f5a' }}>{strings.vatNote}</div>
            <img src="/assets/logo.svg" alt="lychee's" style={{ height: 16, width: 'auto', opacity: 0.6 }} />
          </div>
        </div>
      </div>

      {activeItem ? (
        <ItemModal item={activeItem} lang={lang} strings={strings} onClose={() => setActiveItemId(null)} />
      ) : null}
    </div>
  );
}
