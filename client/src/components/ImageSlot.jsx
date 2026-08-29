import { useRef, useState } from 'react';
import { uploadImage } from '../api';

const RADIUS_BY_SHAPE = { rect: '0', rounded: '18px', circle: '50%', pill: '9999px' };

export default function ImageSlot({
  src,
  alt = '',
  shape = 'rounded',
  radius,
  placeholder = '',
  editable = false,
  onUploaded,
  style,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hover, setHover] = useState(false);
  const borderRadius = shape === 'rounded' && radius ? `${radius}px` : RADIUS_BY_SHAPE[shape] || '18px';

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const url = await uploadImage(file);
      onUploaded && onUploaded(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius,
        background: src ? 'transparent' : 'rgba(127,127,127,0.08)',
        border: src ? 'none' : '1.5px dashed rgba(127,127,127,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: editable ? 'pointer' : 'default',
        ...style,
      }}
      onClick={() => editable && !busy && inputRef.current && inputRef.current.click()}
      onMouseEnter={() => editable && setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {src ? (
        <>
          <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          {editable && hover && !busy && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
            }}>
              change
            </div>
          )}
        </>
      ) : (
        <span
          style={{
            fontSize: 11,
            color: '#8a8f8a',
            textAlign: 'center',
            padding: '0 8px',
            textTransform: 'lowercase',
          }}
        >
          {busy ? '…' : placeholder || (editable ? 'click to upload' : '')}
        </span>
      )}
      {editable && (
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFile} style={{ display: 'none' }} />
      )}
      {error && (
        <div style={{ position: 'absolute', bottom: 2, left: 2, right: 2, fontSize: 9, color: '#b23b3b', background: '#fff', padding: '2px 4px', borderRadius: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}
