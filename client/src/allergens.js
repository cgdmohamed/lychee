// The known allergen icon set — admin-selectable per item, shown as small icons next
// to the item name on the public menu. Keys are what's actually stored (items.allergens
// is a JSON array of these strings); icon/labels are display metadata only, so adding a
// 9th icon later is a client-only change, no server deploy or migration needed.
export const ALLERGENS = [
  { key: 'dairy', icon: '/assets/allergens/dairy.svg', en: 'dairy', ar: 'ألبان' },
  { key: 'egg', icon: '/assets/allergens/egg.svg', en: 'egg', ar: 'بيض' },
  { key: 'fish', icon: '/assets/allergens/fish.svg', en: 'fish', ar: 'سمك' },
  { key: 'peanut', icon: '/assets/allergens/peanut.svg', en: 'peanut', ar: 'فول سوداني' },
  { key: 'tree-nut', icon: '/assets/allergens/tree-nut.svg', en: 'tree nuts', ar: 'مكسرات' },
  { key: 'soy', icon: '/assets/allergens/soy.svg', en: 'soy', ar: 'صويا' },
  { key: 'wheat', icon: '/assets/allergens/wheat.svg', en: 'wheat / gluten', ar: 'قمح' },
  { key: 'mustard', icon: '/assets/allergens/mustard.svg', en: 'mustard', ar: 'خردل' },
];

const BY_KEY = Object.fromEntries(ALLERGENS.map(a => [a.key, a]));

export function getAllergen(key) {
  return BY_KEY[key] || null;
}
