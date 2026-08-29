// Single source of truth for the site copy an admin can override. Each field maps to
// two settings-table rows (text_<key>_en / text_<key>_ar) via settingKeyFor — an empty
// override falls back to the shipped default, so "clearing" a field resets it.
export const TEXT_GROUPS = [
  {
    title: 'hero',
    fields: [
      { key: 'heroTag', label: 'tagline (under logo)', defaultEn: 'making healthy a lifestyle since 2012', defaultAr: 'اجعل الصحة أسلوب حياة منذ 2012' },
      { key: 'heroTitle', label: 'hero heading', defaultEn: 'the menu', defaultAr: 'القائمة' },
    ],
  },
  {
    title: 'badges & buttons',
    fields: [
      { key: 'newLabel', label: '"new" badge', defaultEn: 'new', defaultAr: 'جديد' },
      { key: 'nutritionCta', label: '"nutrition facts" button', defaultEn: 'nutrition facts', defaultAr: 'الحقائق الغذائية' },
    ],
  },
  {
    title: 'nutrition facts panel',
    fields: [
      { key: 'nutritionTitle', label: 'panel heading', defaultEn: 'approximate nutrition facts', defaultAr: 'حقائق غذائية تقريبية' },
      { key: 'nutritionNote', label: 'disclaimer note', defaultEn: 'values are estimates and may vary — ask our team for exact details.', defaultAr: 'القيم تقديرية ويمكن أن تختلف — اسأل فريقنا للتفاصيل الدقيقة.' },
      { key: 'nutritionLabelCal', label: '"cal" label', defaultEn: 'cal', defaultAr: 'سعرة' },
      { key: 'nutritionLabelProtein', label: '"protein" label', defaultEn: 'protein', defaultAr: 'بروتين' },
      { key: 'nutritionLabelCarbs', label: '"carbs" label', defaultEn: 'carbs', defaultAr: 'كارب' },
      { key: 'nutritionLabelFat', label: '"fat" label', defaultEn: 'fat', defaultAr: 'دهون' },
    ],
  },
  {
    title: 'build-your-own',
    fields: [
      { key: 'builderIntro', label: 'intro line', defaultEn: 'build it your way — pick from each step:', defaultAr: 'اصنع طبقك بنفسك — اختر من كل خطوة:' },
      { key: 'builderSummaryLabel', label: '"your picks" label', defaultEn: 'your picks:', defaultAr: 'اختياراتك:' },
      { key: 'builderNothingSelected', label: 'empty-selection text', defaultEn: 'nothing selected yet', defaultAr: 'لم يتم الاختيار بعد' },
      { key: 'builderCtaOpen', label: '"customize" button', defaultEn: 'customize your bowl', defaultAr: 'خصص طبقك' },
      { key: 'builderCtaClose', label: '"hide options" button', defaultEn: 'hide options', defaultAr: 'إخفاء الخيارات' },
      { key: 'additionalCharge', label: 'extra-charge note', defaultEn: 'additional charge', defaultAr: 'رسوم إضافية' },
      { key: 'amountTitle', label: 'dressing-amount label', defaultEn: 'dressing amount', defaultAr: 'كمية الصوص' },
      { key: 'amountLight', label: 'amount: light', defaultEn: 'light', defaultAr: 'خفيف' },
      { key: 'amountRegular', label: 'amount: regular', defaultEn: 'regular', defaultAr: 'عادي' },
      { key: 'amountExtra', label: 'amount: extra', defaultEn: 'extra', defaultAr: 'إضافي' },
    ],
  },
  {
    title: 'footer',
    fields: [
      { key: 'vatNote', label: 'pricing / VAT note', defaultEn: '*all prices include VAT', defaultAr: '*جميع الأسعار شاملة ضريبة القيمة المضافة' },
    ],
  },
];

export const TEXT_FIELDS = TEXT_GROUPS.flatMap(g => g.fields);

export function settingKeyFor(fieldKey, lang) {
  return `text_${fieldKey}_${lang}`;
}
