// Shared by MenuPage (public) and RequireAuth (admin) so both surfaces pick up the
// same admin-set brand colors and favicon the same way, from one place.

export function applyBrandColors(settings) {
  if (!settings) return;
  const root = document.documentElement;
  if (settings.theme_primary) root.style.setProperty('--brand-primary', settings.theme_primary);
  if (settings.theme_accent) root.style.setProperty('--brand-accent', settings.theme_accent);
}

export function applyFavicon(settings) {
  if (!settings || !settings.faviconImage) return;
  let link = document.getElementById('favicon-link');
  if (!link) {
    link = document.createElement('link');
    link.id = 'favicon-link';
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = settings.faviconImage;
}
