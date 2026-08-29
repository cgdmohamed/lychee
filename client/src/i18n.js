import { TEXT_FIELDS, settingKeyFor } from './textFields.js';

function resolveText(settings, lang) {
  const out = {};
  for (const f of TEXT_FIELDS) {
    const override = settings[settingKeyFor(f.key, lang)];
    out[f.key] = override || (lang === 'ar' ? f.defaultAr : f.defaultEn);
  }
  return out;
}

export function getStrings(lang, settings = {}) {
  const isAr = lang === 'ar';
  const text = resolveText(settings, lang);
  return {
    isAr,
    dir: isAr ? 'rtl' : 'ltr',
    headingFont: isAr ? "'Cairo', sans-serif" : "'Domine', serif",
    bodyFont: isAr ? "'Cairo', sans-serif" : "'Nunito Sans', sans-serif",
    toggleLabel: isAr ? 'English' : 'عربي',
    heroTag: text.heroTag,
    heroTitle: text.heroTitle,
    newLabel: text.newLabel,
    vatNote: text.vatNote,
    nutritionCta: text.nutritionCta,
    nutritionTitle: text.nutritionTitle,
    nutritionNote: text.nutritionNote,
    nutritionLabels: {
      cal: text.nutritionLabelCal,
      protein: text.nutritionLabelProtein,
      carbs: text.nutritionLabelCarbs,
      fat: text.nutritionLabelFat,
    },
    amountTitle: text.amountTitle,
    amountNames: [text.amountLight, text.amountRegular, text.amountExtra],
    builderIntro: text.builderIntro,
    builderSummaryLabel: text.builderSummaryLabel,
    builderNothingSelected: text.builderNothingSelected,
    builderCtaOpen: text.builderCtaOpen,
    builderCtaClose: text.builderCtaClose,
    additionalCharge: text.additionalCharge,
    listSeparator: isAr ? '، ' : ', ',
  };
}
