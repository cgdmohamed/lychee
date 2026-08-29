import { db } from './index.js';

const selectSteps = db.prepare('SELECT * FROM build_steps WHERE item_id = ? ORDER BY sort_order ASC');
const selectOptions = db.prepare('SELECT * FROM build_options WHERE step_id = ? ORDER BY sort_order ASC');
const selectItems = db.prepare('SELECT * FROM items WHERE category_id = ? ORDER BY sort_order ASC');
const selectCategories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC');

export function serializeItem(item) {
  const steps = selectSteps.all(item.id).map(step => ({
    id: step.id,
    key: step.step_key,
    type: step.type,
    note: !!step.note,
    labelEn: step.label_en,
    labelAr: step.label_ar,
    options: selectOptions.all(step.id).map(opt => ({
      id: opt.id,
      en: opt.label_en,
      ar: opt.label_ar,
    })),
  }));

  return {
    id: item.id,
    categoryId: item.category_id,
    nameEn: item.name_en,
    nameAr: item.name_ar,
    descEn: item.desc_en,
    descAr: item.desc_ar,
    price: item.price,
    image: item.image,
    spicy: !!item.spicy,
    isNew: !!item.is_new,
    collabEn: item.collab_en,
    collabAr: item.collab_ar,
    nutrition: {
      cal: item.cal,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    },
    buildConfig: steps.length ? steps : null,
  };
}

export function serializeCategory(cat, { withItems = true } = {}) {
  return {
    id: cat.id,
    key: cat.key,
    nameEn: cat.name_en,
    nameAr: cat.name_ar,
    iconImage: cat.icon_image,
    items: withItems ? selectItems.all(cat.id).map(serializeItem) : undefined,
  };
}

export function getFullMenu() {
  return selectCategories.all().map(cat => serializeCategory(cat));
}
