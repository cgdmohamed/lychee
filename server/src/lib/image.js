import sharp from 'sharp';

// Every upload is re-encoded to WebP and capped at this size (longest side) —
// phone photos routinely come in at 4000px+ / several MB, far more than a hero
// banner or a 96px thumbnail ever needs, and it's the biggest win for page load
// speed.
export const MAX_DIMENSION = 1920;
export const WEBP_QUALITY = 82;

export async function compressToWebp(buffer, sourceFormat) {
  const animated = sourceFormat === 'gif';
  return sharp(buffer, { animated })
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}
