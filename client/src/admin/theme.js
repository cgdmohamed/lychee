export const colors = {
  bg: '#fffffc',
  ink: '#171a18',
  muted: '#5a5f5a',
  faint: '#8a8f8a',
  cream: '#f3f0df',
  primary: '#004438',
  accent: '#6fa088',
  danger: '#b23b3b',
  border: 'rgba(0,0,0,0.10)',
  borderStrong: 'rgba(0,0,0,0.16)',
};

export const font = "'Nunito Sans', sans-serif";
export const headingFont = "'Domine', serif";

export function field(width = '100%') {
  return {
    width,
    padding: '9px 11px',
    borderRadius: 8,
    border: `1px solid ${colors.borderStrong}`,
    fontSize: 13,
    fontFamily: font,
    color: colors.ink,
    background: '#fff',
    minHeight: 38,
  };
}

export function label(extra) {
  return {
    display: 'block',
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: colors.faint,
    marginBottom: 4,
    ...extra,
  };
}

export function fieldGroup(extra) {
  return { display: 'flex', flexDirection: 'column', gap: 4, ...extra };
}

const buttonBase = {
  fontFamily: font,
  fontSize: 12.5,
  fontWeight: 700,
  borderRadius: 999,
  padding: '9px 16px',
  cursor: 'pointer',
  border: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  whiteSpace: 'nowrap',
};

export function button(variant = 'primary', extra) {
  switch (variant) {
    case 'primary':
      return { ...buttonBase, background: colors.primary, color: '#fff', ...extra };
    case 'accent':
      return { ...buttonBase, background: colors.accent, color: '#fff', ...extra };
    case 'secondary':
      return { ...buttonBase, background: colors.cream, color: colors.ink, ...extra };
    case 'ghost':
      return { ...buttonBase, background: 'transparent', color: colors.muted, border: `1px solid ${colors.borderStrong}`, ...extra };
    case 'danger':
      return { ...buttonBase, background: 'transparent', color: colors.danger, border: `1px solid ${colors.danger}`, ...extra };
    case 'icon':
      return {
        ...buttonBase, background: '#fff', color: colors.ink, border: `1px solid ${colors.borderStrong}`,
        padding: 0, width: 28, height: 28, borderRadius: 8, ...extra,
      };
    default:
      return { ...buttonBase, ...extra };
  }
}

export function card(extra) {
  return {
    background: '#fff',
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: 16,
    ...extra,
  };
}

export function sectionTitle(extra) {
  return {
    fontFamily: font,
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: colors.ink,
    marginBottom: 10,
    ...extra,
  };
}
