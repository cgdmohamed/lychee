import bcrypt from 'bcryptjs';
import { db } from './index.js';
import { resolveAdminCredentials } from './adminCredentials.js';

const MENU = [
  { key: 'salads', nameEn: 'signature salads', nameAr: 'السلطات المميزة', items: [
    { nameEn: 'avocado mexicana salad', nameAr: 'أفوكادو مكسيكانا سلاد', price: 41,
      descEn: "lychee's mixed greens, pico de gallo, sweet corn, jalapeño, red beans, avocado, cheddar cheese, crunchy tortilla, light ranch dressing",
      descAr: 'ميكسد جرينس، بيكو دي جالو، ذرة حلوة، هالبينو، فاصوليا حمراء، أفوكادو، جبنة شيدر، تورتيلا مقرمشة، وصوص رانش لايت' },
    { nameEn: 'tuna pasta salad', nameAr: 'تونا باستا سلاد', price: 33,
      descEn: "lychee's pasta, tuna salad mix, sweet corn, black olives, dried raisins, colored bell pepper, pickled onion, parsley dressing",
      descAr: 'مكرونة، خليط سلطة التونة، ذرة حلوة، زيتون أسود، زبيب مجفف، فلفل ملون، بصل مخلل، وصوص البقدونس' },
    { nameEn: 'chicken royal salad', nameAr: 'تشيكن رويال سلاد', price: 39,
      descEn: "lychee's mixed greens, grilled chicken, cheddar cheese, croutons, cherry tomato, caesar parmesan dressing",
      descAr: 'ميكسد جرينس دجاج مشوي، جبنة شيدر، خبز محمص، طماطم كرزية، وصوص سيزر بارميزان' },
    { nameEn: 'country chicken salad', nameAr: 'كنتري تشيكن سلاد', price: 39,
      descEn: "lychee's mixed greens, hot honey chicken, tangy coleslaw, pico de gallo, pickled onion, croutons, light ranch dressing",
      descAr: 'ميكسد جرينس، دجاج هوت هوني، كول سلو، بيكو دي جالو، بصل مخلل، خبز محمص، وصوص رانش لايت' },
  ]},
  { key: 'bowls', nameEn: 'warm bowls', nameAr: 'أطباق ورم بول المميزة', items: [
    { nameEn: 'og hot honey chicken', nameAr: 'أو جي هوت هوني تشيكن', price: 40,
      descEn: 'brown rice, hot honey chicken, pico de gallo, avocado, jalapeno, sweet corn, cheddar cheese, light ranch dressing',
      descAr: 'أرز بني، دجاج هوت هوني، بيكو دي جالو، أفوكادو، ذرة حلوة، جبنة شيدر، وصوص رانش لايت' },
    { nameEn: 'crunchy italian', nameAr: 'كرنشي إيتاليان', price: 44, isNew: true, collabEn: 'by @kitchen_keys', collabAr: 'بواسطة @kitchen_keys',
      descEn: 'brown rice, hot honey chicken, roasted red pepper, sweet corn, pickled onion, broccoli, cheddar cheese, pepper jack cheese, crunchy tortilla, caesar parmesan dressing',
      descAr: 'أرز بني، دجاج هوت هوني، فلفل أحمر مشوي، ذرة حلوة، بصل مخلل، بروكلي، جبنة شيدر، جبنة بيبر جاك، تورتيلا مقرمشة، وصوص سيزر بارميزان' },
    { nameEn: 'build your own warm bowl', nameAr: 'اصنع ورم بول بنفسك', price: 30,
      buildConfig: [
        { key: 'base', type: 'single', labelEn: 'base', labelAr: 'الأساس', options: [ { en: 'brown rice', ar: 'أرز بني' } ] },
        { key: 'essentials', type: 'multi', labelEn: 'essentials', labelAr: 'المكونات الأساسية', options: [
          { en: 'pico de gallo', ar: 'بيكو دي جالو' }, { en: 'sweet corn', ar: 'ذرة حلوة' }, { en: 'roasted red pepper', ar: 'فلفل أحمر مشوي' },
          { en: 'pickled onion', ar: 'بصل مخلل' }, { en: 'broccoli', ar: 'بروكلي' } ] },
        { key: 'premium', type: 'multi', labelEn: 'premium', labelAr: 'المكونات المميزة', options: [
          { en: 'avocado', ar: 'أفوكادو' }, { en: 'cheddar cheese', ar: 'جبنة شيدر' }, { en: 'pepper jack cheese', ar: 'جبنة بيبر جاك' }, { en: 'crunchy tortilla', ar: 'تورتيلا مقرمشة' } ] },
        { key: 'protein', type: 'single', note: true, labelEn: 'protein', labelAr: 'البروتين', options: [
          { en: 'hot honey chicken', ar: 'دجاج هوت هوني' }, { en: 'grilled chicken', ar: 'دجاج مشوي' } ] },
        { key: 'dressing', type: 'single', labelEn: 'dressing', labelAr: 'الصوص', options: [
          { en: 'light ranch', ar: 'رانش لايت' }, { en: 'caesar parmesan', ar: 'سيزر بارميزان' } ] },
        { key: 'toppings', type: 'multi', note: true, labelEn: 'toppings', labelAr: 'الإضافات', options: [ { en: 'jalapeño', ar: 'هالبينو' } ] },
      ] },
  ]},
  { key: 'wraps', nameEn: 'signature wraps', nameAr: 'الرابس المميزة', items: [
    { nameEn: 'chicken melt wrap', nameAr: 'تشيكن ميلت راب', price: 37, spicy: true,
      descEn: "lychee's tortilla wrap, grilled chicken, avocado, shredded cheddar cheese, black olives, pico de gallo, jalapenos, colored bell pepper, light ranch dressing",
      descAr: 'تورتيلا، دجاج مشوي، أفوكادو، جبنة شيدر، زيتون أسود، بيكو دي جالو، هالبينو، فلفل ملون، وصوص رانش لايت' },
    { nameEn: 'classic tuna wrap', nameAr: 'كلاسيك تونا راب', price: 29,
      descEn: "lychee's tortilla wrap, tuna salad mix, sweet corn, mushroom, black olives, colored bell pepper, caesar parmesan dressing",
      descAr: 'تورتيلا، خليط سلطة التونة، ذرة حلوة، مشروم، زيتون أسود، فلفل ملون، وصوص سيزر بارميزان' },
    { nameEn: 'peri peri chicken wrap', nameAr: 'بيري بيري تشيكن راب', price: 37, spicy: true,
      descEn: "lychee's tortilla wrap, chicken, pepper jack cheese, sweet corn, pico de gallo, peri peri sauce",
      descAr: 'تورتيلا، دجاج، جبنة بيبر جاك، ذرة حلوة، بيكو دي جالو، صوص بيري بيري' },
    { nameEn: 'morning wrap', nameAr: 'مورنينج راب', price: 25,
      descEn: "lychee's tortilla wrap, eggs, pepper jack cheese, pico de gallo, avocado, light ranch dressing",
      descAr: 'تورتيلا، بيض، جبنة بيبر جاك، بيكو دي جالو، أفوكادو، وصوص رانش لايت' },
    { nameEn: 'spicy tuna wrap', nameAr: 'سبايسي تونا راب', price: 29, spicy: true,
      descEn: "lychee's tortilla wrap, tuna salad mix, cheddar cheese, pico de gallo, jalapeno, pesto sauce, hot sauce",
      descAr: 'تورتيلا، خليط سلطة التونة، جبنة شيدر، بيكو دي جالو، هالبينو، صوص بيستو، وصوص حار' },
    { nameEn: 'hot honey chicken wrap', nameAr: 'هوت هوني تشيكن راب', price: 29,
      descEn: "lychee's tortilla wrap, hot honey chicken, black olives, pickled onion, roasted red pepper, roasted sweet potatoes, honey mustard",
      descAr: 'تورتيلا، دجاج هوت هوني، زيتون أسود، بصل مخلل، فلفل أحمر مشوي، بطاطا حلوة مشوية، وصوص هوني مسترد' },
    { nameEn: 'build your own wrap', nameAr: 'اصنع راب بنفسك', price: 29,
      buildConfig: [
        { key: 'base', type: 'single', labelEn: 'base', labelAr: 'الأساس', options: [ { en: 'tortilla wrap', ar: 'تورتيلا' } ] },
        { key: 'essentials', type: 'multi', labelEn: 'essentials', labelAr: 'المكونات الأساسية', options: [
          { en: 'pico de gallo', ar: 'بيكو دي جالو' }, { en: 'sweet corn', ar: 'ذرة حلوة' }, { en: 'black olives', ar: 'زيتون أسود' },
          { en: 'colored bell pepper', ar: 'فلفل ملون' }, { en: 'pickled onion', ar: 'بصل مخلل' } ] },
        { key: 'premium', type: 'multi', labelEn: 'premium', labelAr: 'المكونات المميزة', options: [
          { en: 'avocado', ar: 'أفوكادو' }, { en: 'cheddar cheese', ar: 'جبنة شيدر' }, { en: 'pepper jack cheese', ar: 'جبنة بيبر جاك' } ] },
        { key: 'protein', type: 'single', note: true, labelEn: 'protein', labelAr: 'البروتين', options: [
          { en: 'grilled chicken', ar: 'دجاج مشوي' }, { en: 'hot honey chicken', ar: 'دجاج هوت هوني' }, { en: 'tuna salad mix', ar: 'خليط سلطة التونة' }, { en: 'eggs', ar: 'بيض' } ] },
        { key: 'dressing', type: 'single', labelEn: 'dressing', labelAr: 'الصوص', options: [
          { en: 'light ranch', ar: 'رانش لايت' }, { en: 'caesar parmesan', ar: 'سيزر بارميزان' }, { en: 'honey mustard', ar: 'صوص هوني مسترد' }, { en: 'pesto sauce', ar: 'صوص بيستو' } ] },
        { key: 'toppings', type: 'multi', note: true, labelEn: 'toppings', labelAr: 'الإضافات', options: [ { en: 'jalapeño', ar: 'هالبينو' }, { en: 'roasted red pepper', ar: 'فلفل أحمر مشوي' } ] },
      ] },
  ]},
  { key: 'shakes', nameEn: 'protein shakes', nameAr: 'بروتين شيكس', items: [
    { nameEn: 'post workout', nameAr: 'بوست ووركاوت', price: 37 },
    { nameEn: 'ripped berry shake', nameAr: 'ريبد بيري شيك', price: 37 },
    { nameEn: 'original protein shake', nameAr: 'أوريجنال بروتين شيك', price: 35 },
  ]},
  { key: 'dessert', nameEn: 'healthy dessert', nameAr: 'هيلثي ديزرت', items: [
    { nameEn: 'energy bar', nameAr: 'إنرجي بار', price: 18 },
    { nameEn: 'protein fudge brownie', nameAr: 'بروتين فدج براوني', price: 14 },
    { nameEn: 'energy bomb', nameAr: 'إنرجي بومب', price: 10 },
    { nameEn: 'oat bar', nameAr: 'أوت بار', price: 7 },
  ]},
  { key: 'granola', nameEn: 'homemade granola', nameAr: 'هوم ميد جرانولا', items: [
    { nameEn: 'original granola 300gm', nameAr: 'أوريجنال جرانولا 300 جم', price: 22 },
  ]},
  { key: 'shots', nameEn: 'juice shots', nameAr: 'جوس شوتس', items: [
    { nameEn: 'immunity shot 65ml', nameAr: 'إميونيتي شوت 65 مل', price: 10 },
    { nameEn: 'wellness shot 65ml', nameAr: 'ويلنس شوت 65 مل', price: 10 },
  ]},
  { key: 'fruits', nameEn: 'fresh fruits & vegetables', nameAr: 'الفواكه والخضروات الطازجة', items: [
    { nameEn: 'pre-cut watermelon 12oz', nameAr: 'بطيخ مقطع 12 أونصة', price: 10 },
    { nameEn: 'pre-cut cucumber & carrot 12oz', nameAr: 'خيار وجزر مقطع 12 أونصة', price: 10 },
    { nameEn: 'pre-cut pineapple 12oz', nameAr: 'أناناس مقطع 12 أونصة', price: 10 },
    { nameEn: 'pre-cut kiwi 12oz', nameAr: 'كيوي مقطع 12 أونصة', price: 10 },
  ]},
  { key: 'beverages', nameEn: 'other beverages', nameAr: 'مشروبات', items: [
    { nameEn: 'regular water 550ml', nameAr: 'مياه 550 مل', price: 2 },
    { nameEn: 'sparkling water 250ml', nameAr: 'مياه غازية 250 مل', price: 5 },
    { nameEn: 'flavoured sparkling water 250ml', nameAr: 'مياه غازية بالنكهة 250 مل', price: 5 },
    { nameEn: 'flavoured iced tea 320ml', nameAr: 'ايسد تي بالنكهة 320 مل', price: 8 },
  ]},
];

function seed() {
  const existingCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
  if (existingCount > 0) {
    console.log('Database already seeded, skipping menu seed.');
  } else {
    const insertCategory = db.prepare(
      `INSERT INTO categories (key, name_en, name_ar, sort_order) VALUES (?, ?, ?, ?)`
    );
    const insertItem = db.prepare(
      `INSERT INTO items (category_id, name_en, name_ar, desc_en, desc_ar, price, spicy, is_new, collab_en, collab_ar, sort_order)
       VALUES (@categoryId, @nameEn, @nameAr, @descEn, @descAr, @price, @spicy, @isNew, @collabEn, @collabAr, @sortOrder)`
    );
    const insertStep = db.prepare(
      `INSERT INTO build_steps (item_id, step_key, type, note, label_en, label_ar, sort_order)
       VALUES (@itemId, @stepKey, @type, @note, @labelEn, @labelAr, @sortOrder)`
    );
    const insertOption = db.prepare(
      `INSERT INTO build_options (step_id, label_en, label_ar, sort_order) VALUES (@stepId, @labelEn, @labelAr, @sortOrder)`
    );

    const tx = db.transaction(() => {
      MENU.forEach((cat, catIdx) => {
        const catResult = insertCategory.run(cat.key, cat.nameEn, cat.nameAr, catIdx);
        const categoryId = catResult.lastInsertRowid;

        cat.items.forEach((it, itemIdx) => {
          const itemResult = insertItem.run({
            categoryId,
            nameEn: it.nameEn,
            nameAr: it.nameAr,
            descEn: it.descEn || null,
            descAr: it.descAr || null,
            price: it.price,
            spicy: it.spicy ? 1 : 0,
            isNew: it.isNew ? 1 : 0,
            collabEn: it.collabEn || null,
            collabAr: it.collabAr || null,
            sortOrder: itemIdx,
          });
          const itemId = itemResult.lastInsertRowid;

          if (it.buildConfig) {
            it.buildConfig.forEach((step, stepIdx) => {
              const stepResult = insertStep.run({
                itemId,
                stepKey: step.key,
                type: step.type,
                note: step.note ? 1 : 0,
                labelEn: step.labelEn,
                labelAr: step.labelAr,
                sortOrder: stepIdx,
              });
              const stepId = stepResult.lastInsertRowid;
              step.options.forEach((opt, optIdx) => {
                insertOption.run({ stepId, labelEn: opt.en, labelAr: opt.ar, sortOrder: optIdx });
              });
            });
          }
        });
      });
    });
    tx();
    console.log(`Seeded ${MENU.length} categories.`);
  }

  const { email: adminEmail, password: adminPassword } = resolveAdminCredentials();
  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    db.prepare('INSERT INTO admin_users (email, password_hash) VALUES (?, ?)').run(adminEmail, hash);
    console.log(`Created admin user ${adminEmail} (change the password after first login).`);
  } else {
    console.log('Admin user already exists, skipping.');
  }
}

seed();
