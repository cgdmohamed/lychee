import { TEXT_FIELDS, settingKeyFor } from './textFields.js';

function resolveText(settings, lang) {
  const out = {};
  for (const f of TEXT_FIELDS) {
    const override = settings[settingKeyFor(f.key, lang)];
    out[f.key] = override || (lang === 'ar' ? f.defaultAr : f.defaultEn);
  }
  return out;
}

// Per cart-line format (not a whole message) — the cart can hold several different
// items, so the full message is assembled from one of these per line plus a fixed
// intro/total/brand wrapper (see cartMessage below), rather than one single-item
// sentence like before carts existed.
const DEFAULT_WHATSAPP_LINE_EN = '{qty}x {item} — {price} {currency}';
const DEFAULT_WHATSAPP_LINE_AR = '{item} × {qty} — {price} {currency}';

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
    whatsappCta: isAr ? 'إرسال الطلب عبر واتساب' : 'send order on whatsapp',
    addToOrderCta: isAr ? 'أضف للطلب' : 'add to order',
    addedToOrderCta: isAr ? 'أُضيف ✓' : 'added ✓',
    buildYourOwnAddNote: isAr
      ? 'اختر مكوناتك أعلاه ثم اضغط "أضف للطلب"'
      : 'pick your options above, then tap "add to order"',
    cartTitle: isAr ? 'طلبك' : 'your order',
    cartEmpty: isAr ? 'طلبك فارغ حتى الآن' : 'nothing added yet',
    cartTotalLabel: isAr ? 'الإجمالي' : 'total',
    cartRemoveCta: isAr ? 'حذف' : 'remove',
    cartCloseCta: isAr ? 'إغلاق' : 'close',
    // Assembles the full WhatsApp message from the cart's lines — each line filled from
    // the (admin-editable) per-line format, joined under a fixed intro/total/brand
    // wrapper. `lines` is [{ name, qty, lineTotal }]; `total` is the cart's grand total.
    cartMessage: (lines, total) => {
      const lineTemplate = isAr
        ? (settings.whatsapp_message_ar || DEFAULT_WHATSAPP_LINE_AR)
        : (settings.whatsapp_message_en || DEFAULT_WHATSAPP_LINE_EN);
      const intro = isAr ? 'مرحباً! أرغب بطلب:' : "Hi! I'd like to order:";
      const linesText = lines
        .map(l => fillTemplate(lineTemplate, { item: l.name, qty: l.qty, price: l.lineTotal, currency: currencyText }))
        .join('\n');
      const totalLine = isAr ? `الإجمالي: ${total} ${currencyText}` : `Total: ${total} ${currencyText}`;
      const outro = isAr ? `— من قائمة ${brandName}` : `— from the ${brandName} menu`;
      return `${intro}\n${linesText}\n\n${totalLine}\n${outro}`;
    },
    // Empty when unset: the price UI then falls back to the Riyal icon (ryal.svg)
    // instead of this text, same as before currency became configurable.
    currencyLabel,
    nutritionGloballyEnabled,
  };
}
