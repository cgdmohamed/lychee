import { useState } from 'react';
import { colors, field, label, fieldGroup, button, sectionTitle } from '../../admin/theme';

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
    <div style={{ border: `1px dashed ${colors.borderStrong}`, borderRadius: 14, padding: 14, marginTop: 14 }}>
      <div style={sectionTitle()}>build-your-own steps</div>
      {steps.map((step, idx) => (
        <div key={idx} style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: 12, marginBottom: 10, background: '#fafaf7' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={fieldGroup({ width: 110 })}>
              <label style={label()}>key</label>
              <input className="admin-field" placeholder="e.g. base" value={step.key} onChange={e => updateStep(idx, { key: e.target.value })} style={field()} />
            </div>
            <div style={fieldGroup({ width: 100 })}>
              <label style={label()}>type</label>
              <select className="admin-field" value={step.type} onChange={e => updateStep(idx, { type: e.target.value })} style={field()}>
                <option value="single">single</option>
                <option value="multi">multi</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: colors.muted, paddingBottom: 9 }}>
              <input type="checkbox" checked={step.note} onChange={e => updateStep(idx, { note: e.target.checked })} />
              extra charge note
            </label>
            <button type="button" onClick={() => removeStep(idx)} className="admin-btn" style={button('danger', { marginInlineStart: 'auto' })}>remove step</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={fieldGroup({ flex: 1 })}>
              <label style={label()}>label (EN)</label>
              <input className="admin-field" value={step.labelEn} onChange={e => updateStep(idx, { labelEn: e.target.value })} style={field()} />
            </div>
            <div style={fieldGroup({ flex: 1 })}>
              <label style={label()}>label (AR)</label>
              <input className="admin-field" value={step.labelAr} onChange={e => updateStep(idx, { labelAr: e.target.value })} style={{ ...field(), direction: 'rtl' }} />
            </div>
          </div>
          <div style={{ marginInlineStart: 4 }}>
            <label style={label()}>options</label>
            {step.options.map((opt, optIdx) => (
              <div key={optIdx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input className="admin-field" placeholder="option (EN)" value={opt.en} onChange={e => updateOption(idx, optIdx, { en: e.target.value })} style={field(150)} />
                <input className="admin-field" placeholder="option (AR)" value={opt.ar} onChange={e => updateOption(idx, optIdx, { ar: e.target.value })} style={{ ...field(150), direction: 'rtl' }} />
                <button type="button" onClick={() => removeOption(idx, optIdx)} className="admin-btn" style={button('icon')}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => addOption(idx)} className="admin-btn" style={button('secondary', { padding: '6px 12px', fontSize: 11.5 })}>+ option</button>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={addStep} className="admin-btn" style={button('secondary')}>+ step</button>
        <button type="button" disabled={saving} onClick={() => onSave(steps)} className="admin-btn" style={button('primary')}>
          {saving ? 'saving…' : 'save build config'}
        </button>
        {initialSteps && initialSteps.length ? (
          <button type="button" onClick={onRemove} className="admin-btn" style={button('danger')}>remove builder</button>
        ) : null}
      </div>
    </div>
  );
}
