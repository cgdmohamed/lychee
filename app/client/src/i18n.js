export function getStrings(lang) {
  const isAr = lang === 'ar';
  return {
    isAr,
    dir: isAr ? 'rtl' : 'ltr',
    headingFont: isAr ? "'Cairo', sans-serif" : "'Domine', serif",
    bodyFont: isAr ? "'Cairo', sans-serif" : "'Nunito Sans', sans-serif",
    toggleLabel: isAr ? 'English' : 'عربي',
    heroTag: isAr ? 'اجعل الصحة أسلوب حياة منذ 2012' : 'making healthy a lifestyle since 2012',
    heroTitle: isAr ? 'القائمة' : 'the menu',
    newLabel: isAr ? 'جديد' : 'new',
    vatNote: isAr ? '*جميع الأسعار شاملة ضريبة القيمة المضافة' : '*all prices include VAT',
    nutritionCta: isAr ? 'الحقائق الغذائية' : 'nutrition facts',
    nutritionTitle: isAr ? 'حقائق غذائية تقريبية' : 'approximate nutrition facts',
    nutritionNote: isAr
      ? 'القيم تقديرية ويمكن أن تختلف — اسأل فريقنا للتفاصيل الدقيقة.'
      : 'values are estimates and may vary — ask our team for exact details.',
    nutritionLabels: isAr
      ? { cal: 'سعرة', protein: 'بروتين', carbs: 'كارب', fat: 'دهون' }
      : { cal: 'cal', protein: 'protein', carbs: 'carbs', fat: 'fat' },
    amountTitle: isAr ? 'كمية الصوص' : 'dressing amount',
    amountNames: isAr ? ['خفيف', 'عادي', 'إضافي'] : ['light', 'regular', 'extra'],
    builderIntro: isAr ? 'اصنع طبقك بنفسك — اختر من كل خطوة:' : "build it your way — pick from each step:",
    builderSummaryLabel: isAr ? 'اختياراتك:' : 'your picks:',
    builderNothingSelected: isAr ? 'لم يتم الاختيار بعد' : 'nothing selected yet',
    builderCtaOpen: isAr ? 'خصص طبقك' : 'customize your bowl',
    builderCtaClose: isAr ? 'إخفاء الخيارات' : 'hide options',
    additionalCharge: isAr ? 'رسوم إضافية' : 'additional charge',
    listSeparator: isAr ? '، ' : ', ',
  };
}
