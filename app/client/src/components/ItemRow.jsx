import ImageSlot from './ImageSlot.jsx';
import BuilderPanel from './BuilderPanel.jsx';

function SpicyIcon() {
  return (
    <span title="spicy" style={{ position: 'relative', width: 12, height: 14, display: 'inline-block', marginInlineStart: 2 }}>
      <span style={{ position: 'absolute', bottom: 0, left: 0, width: 10, height: 10, borderRadius: '50% 50% 50% 0', background: '#6fa088', transform: 'rotate(45deg)' }} />
      <span style={{ position: 'absolute', top: 0, right: 2, width: 2, height: 6, background: '#6fa088', borderRadius: 2, transform: 'rotate(20deg)' }} />
    </span>
  );
}

export default function ItemRow({ item, lang, strings, onOpenInfo, builderOpen, onToggleBuilderOpen, selections, amount, onToggleOption, onSetAmount }) {
  const isAr = lang === 'ar';
  const name = isAr ? item.nameAr : item.nameEn;
  const desc = isAr ? item.descAr : item.descEn;
  const collab = isAr ? item.collabAr : item.collabEn;
  const hasBuilder = !!(item.buildConfig && item.buildConfig.length);

  return (
    <>
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.12)', padding: '18px 0', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div onClick={onOpenInfo} style={{ width: 96, height: 96, flexShrink: 0, cursor: 'pointer' }}>
          <ImageSlot src={item.image} alt={name} shape="rounded" radius={18} placeholder={name} style={{ width: 96, height: 96 }} />
        </div>
        <div onClick={onOpenInfo} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: strings.bodyFont, fontWeight: 700, fontSize: 18, color: '#171a18', textTransform: 'lowercase' }}>
                {name}
              </span>
              {item.spicy ? <SpicyIcon /> : null}
              {item.isNew ? (
                <span style={{ fontFamily: strings.bodyFont, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#004438', border: '1px solid #004438', borderRadius: 999, padding: '2px 8px' }}>
                  {strings.newLabel}
                </span>
              ) : null}
              {collab ? (
                <span style={{ fontFamily: strings.bodyFont, fontStyle: 'italic', fontSize: 13, color: '#6fa088' }}>{collab}</span>
              ) : null}
            </div>
            <div style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5, fontFamily: strings.bodyFont, fontWeight: 700, fontSize: 16, color: '#171a18' }}>
              <img src="/assets/ryal.svg" alt="SAR" style={{ height: 13, width: 'auto' }} />
              {item.price}
            </div>
          </div>
          {desc ? (
            <div style={{ fontFamily: strings.bodyFont, fontSize: 14, lineHeight: 1.55, color: '#5a5f5a', marginTop: 5 }}>{desc}</div>
          ) : null}
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <button
              onClick={e => { e.stopPropagation(); onOpenInfo(); }}
              style={{ fontFamily: strings.bodyFont, fontSize: 12, fontWeight: 700, color: '#004438', background: 'none', border: '1px solid rgba(0,68,56,0.3)', borderRadius: 999, padding: '8px 14px', minHeight: 36, cursor: 'pointer' }}
            >
              {strings.nutritionCta}
            </button>
            {hasBuilder ? (
              <button
                onClick={e => { e.stopPropagation(); onToggleBuilderOpen(); }}
                style={{ fontFamily: strings.bodyFont, fontSize: 12, fontWeight: 700, color: '#fffffc', background: '#6fa088', border: 'none', borderRadius: 999, padding: '8px 14px', minHeight: 36, cursor: 'pointer' }}
              >
                {builderOpen ? strings.builderCtaClose : strings.builderCtaOpen}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {hasBuilder && builderOpen ? (
        <BuilderPanel
          item={item}
          lang={lang}
          strings={strings}
          selections={selections}
          amount={amount}
          onToggleOption={onToggleOption}
          onSetAmount={onSetAmount}
        />
      ) : null}
    </>
  );
}
