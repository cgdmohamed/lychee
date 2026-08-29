import { useState } from 'react';

function emptyStep() {
  return { key: '', type: 'single', note: false, labelEn: '', labelAr: '', options: [] };
}

export default function BuildConfigEditor({ initialSteps, onSave, onRemove, saving }) {
  const [steps, setSteps] = useState(() =>
    (initialSteps || []).map(s => ({
      key: s.key, type: s.type, note: s.note, labelEn: s.labelEn, labelAr: s.labelAr,
      options: s.options.map(o => ({ en: o.en, ar: o.ar })),
    }))
  );

  function updateStep(idx, patch) {
    setSteps(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function updateOption(stepIdx, optIdx, patch) {
    setSteps(prev => prev.map((s, i) => {
      if (i !== stepIdx) return s;
      return { ...s, options: s.options.map((o, j) => (j === optIdx ? { ...o, ...patch } : o)) };
    }));
  }
  function addStep() {
    setSteps(prev => [...prev, emptyStep()]);
  }
  function removeStep(idx) {
    setSteps(prev => prev.filter((_, i) => i !== idx));
  }
  function addOption(stepIdx) {
    setSteps(prev => prev.map((s, i) => (i === stepIdx ? { ...s, options: [...s.options, { en: '', ar: '' }] } : s)));
  }
  function removeOption(stepIdx, optIdx) {
    setSteps(prev => prev.map((s, i) => (i === stepIdx ? { ...s, options: s.options.filter((_, j) => j !== optIdx) } : s)));
  }

  return (
    <div style={{ border: '1px dashed rgba(0,0,0,0.2)', borderRadius: 12, padding: 14, marginTop: 10 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>build-your-own steps</div>
      {steps.map((step, idx) => (
        <div key={idx} style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <input placeholder="key (e.g. base)" value={step.key} onChange={e => updateStep(idx, { key: e.target.value })} style={inputStyle(100)} />
            <select value={step.type} onChange={e => updateStep(idx, { type: e.target.value })} style={inputStyle(90)}>
              <option value="single">single</option>
              <option value="multi">multi</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <input type="checkbox" checked={step.note} onChange={e => updateStep(idx, { note: e.target.checked })} />
              extra charge note
            </label>
            <button type="button" onClick={() => removeStep(idx)} style={dangerBtn}>remove step</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input placeholder="label (EN)" value={step.labelEn} onChange={e => updateStep(idx, { labelEn: e.target.value })} style={inputStyle(160)} />
            <input placeholder="label (AR)" value={step.labelAr} onChange={e => updateStep(idx, { labelAr: e.target.value })} style={{ ...inputStyle(160), direction: 'rtl' }} />
          </div>
          <div style={{ marginInlineStart: 8 }}>
            {step.options.map((opt, optIdx) => (
              <div key={optIdx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input placeholder="option (EN)" value={opt.en} onChange={e => updateOption(idx, optIdx, { en: e.target.value })} style={inputStyle(150)} />
                <input placeholder="option (AR)" value={opt.ar} onChange={e => updateOption(idx, optIdx, { ar: e.target.value })} style={{ ...inputStyle(150), direction: 'rtl' }} />
                <button type="button" onClick={() => removeOption(idx, optIdx)} style={dangerBtn}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => addOption(idx)} style={secondaryBtn}>+ option</button>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={addStep} style={secondaryBtn}>+ step</button>
        <button type="button" disabled={saving} onClick={() => onSave(steps)} style={primaryBtn}>
          {saving ? 'saving…' : 'save build config'}
        </button>
        {initialSteps && initialSteps.length ? (
          <button type="button" onClick={onRemove} style={dangerBtn}>remove builder</button>
        ) : null}
      </div>
    </div>
  );
}

function inputStyle(width) {
  return { width, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', fontSize: 12 };
}
const primaryBtn = { background: '#004438', color: '#fff', border: 'none', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const secondaryBtn = { background: '#f3f0df', color: '#171a18', border: 'none', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const dangerBtn = { background: 'none', color: '#b23b3b', border: '1px solid #b23b3b', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' };
