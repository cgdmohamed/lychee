import { TEXT_FIELDS, settingKeyFor } from './textFields.js';

function resolveText(settings, lang) {
  const out = {};
  for (const f of TEXT_FIELDS) {
    const override = settings[settingKeyFor(f.key, lang)];
    out[f.key] = override || (lang === 'ar' ? f.defaultAr : f.defaultEn);
  }
  return out;
}

const DEFAULT_WHATSAPP_MESSAGE_EN = "Hi! I'd like to order: {item} ({price} {currency}) — from the {brand} menu";
const DEFAULT_WHATSAPP_MESSAGE_AR = 'مرحباً! أرغب بطلب: {item} ({price} {currency}) — من قائمة {brand}';

function fillTemplate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? vars[key] : match));
}

export function getStrings(lang, settings = {}) {
  const isAr = lang === 'ar';
  const text = resolveText(settings, lang);
  const brandName = isAr
    ? (settings.brand_name_ar || 'لايتشي')
    : (settings.brand_name_en || "lychee's");
  // Unset (the default) keeps showing the official Saudi Riyal glyph (see the ryal.svg
  // icon next to prices); a custom value here replaces that icon with plain text.
  const currencyLabel = (settings.currency_symbol || '').trim();
  const currencyText = currencyLabel || (isAr ? 'ريال' : 'SAR');
  // Sitewide kill switch, ANDed with each item's own nutritionEnabled flag at the
  // point nutrition facts are rendered — see ItemRow.jsx / ItemModal.jsx.
  const nutritionGloballyEnabled = settings.nutrition_global_enabled !== '0';
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
    whatsappCta: isAr ? 'اطلب عبر واتساب' : 'order on whatsapp',
    whatsappMessage: (name, price) => fillTemplate(
      isAr
        ? (settings.whatsapp_message_ar || DEFAULT_WHATSAPP_MESSAGE_AR)
        : (settings.whatsapp_message_en || DEFAULT_WHATSAPP_MESSAGE_EN),
      { item: name, price, currency: currencyText, brand: brandName }
    ),
    // Empty when unset: the price UI then falls back to the Riyal icon (ryal.svg)
    // instead of this text, same as before currency became configurable.
    currencyLabel,
    nutritionGloballyEnabled,
  };
}
