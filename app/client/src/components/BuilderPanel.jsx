export default function BuilderPanel({ item, lang, strings, selections, amount, onToggleOption, onSetAmount }) {
  const isAr = lang === 'ar';
  const summaryParts = [];

  const steps = item.buildConfig.map(step => {
    const stepSel = selections[step.id] || [];
    const options = step.options.map(opt => {
      const selected = stepSel.includes(opt.id);
      if (selected) summaryParts.push(isAr ? opt.ar : opt.en);
      return {
        ...opt,
        selected,
        label: isAr ? opt.ar : opt.en,
      };
    });
    return { ...step, label: isAr ? step.labelAr : step.labelEn, options };
  });

  const amountIdx = amount || 2;

  return (
    <div style={{ border: '1.5px solid #6fa088', borderRadius: 20, padding: '20px 20px 22px', margin: '4px 0 18px' }}>
      <div style={{ fontFamily: strings.bodyFont, fontWeight: 700, fontSize: 13, color: '#004438', marginBottom: 14 }}>
        {strings.builderIntro}
      </div>
      {steps.map(step => (
        <div key={step.id} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: strings.bodyFont, color: '#171a18' }}>
              {step.label}
            </span>
            {step.note ? (
              <span style={{ fontSize: 11, color: '#8a8f8a', fontFamily: strings.bodyFont }}>{strings.additionalCharge}</span>
            ) : null}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {step.options.map(opt => (
              <button
                key={opt.id}
                onClick={() => onToggleOption(step.id, opt.id, step.type)}
                style={{
                  fontFamily: strings.bodyFont,
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1px solid #6fa088',
                  borderRadius: 999,
                  padding: '9px 14px',
                  cursor: 'pointer',
                  background: opt.selected ? '#004438' : '#f3f0df',
                  color: opt.selected ? '#fffffc' : '#171a18',
                  minHeight: 40,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: strings.bodyFont, color: '#171a18' }}>
            {strings.amountTitle}
          </span>
          <span style={{ fontFamily: strings.bodyFont, fontSize: 12, fontWeight: 600, color: '#6fa088' }}>
            {strings.amountNames[amountIdx - 1]}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="3"
          step="1"
          value={amountIdx}
          onChange={e => onSetAmount(Number(e.target.value))}
          style={{ width: '100%', height: 36 }}
        />
      </div>
      <div style={{ fontFamily: strings.bodyFont, fontSize: 13, color: '#5a5f5a', marginTop: 6, paddingTop: 14, borderTop: '1px dashed rgba(0,0,0,0.15)' }}>
        <span style={{ fontWeight: 700, color: '#171a18' }}>{strings.builderSummaryLabel}</span>{' '}
        {summaryParts.length ? summaryParts.join(strings.listSeparator) : strings.builderNothingSelected}
      </div>
    </div>
  );
}
