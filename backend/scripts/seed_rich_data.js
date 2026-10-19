const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Tenant = require('../src/models/Tenant');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const ServicePackage = require('../src/models/ServicePackage');
const Lead = require('../src/models/Lead');
const Order = require('../src/models/Order');

const richCategories = [
  {
    name: 'Mango Delights (Aam)',
    slug: 'mango-delights',
    description: 'Traditional sun-dried raw mango pickles infused with cold-pressed mustard oil and aromatic spices',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80',
    orderIndex: 1,
  },
  {
    name: 'Stuffed Red Chilli (Lal Mirch)',
    slug: 'stuffed-red-chilli',
    description: 'Authentic Banarasi thick winter red chillies hand-stuffed with roasted heirloom masala',
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=600&auto=format&fit=crop&q=80',
    orderIndex: 2,
  },
  {
    name: 'Green Chilli & Hari Mirch',
    slug: 'green-chilli',
    description: 'Spicy Rajasthani slit green chillies, tipore, and lemon-soaked tangy bites',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
    orderIndex: 3,
  },
  {
    name: 'Garlic & Spicy Blends',
    slug: 'garlic-spicy',
    description: 'Golden whole garlic cloves and spicy thecha tempered in pure mustard oil',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
    orderIndex: 4,
  },
  {
    name: 'Citrus & Lemon (Nimbu)',
    slug: 'citrus-lemon',
    description: 'Zero-oil sun-matured Kagzi lemon pickles with Himalayan rock salt and digestive carom',
    image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80',
    orderIndex: 5,
  },
  {
    name: 'Sweet & Khatta Meetha',
    slug: 'sweet-chunda',
    description: 'Gujarati sweet mango chunda, royal fruit murabbas, and sweet-sour lime preserves',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
    orderIndex: 6,
  },
  {
    name: 'Heritage Mixed & Winter Veg',
    slug: 'heritage-mixed',
    description: 'Pachranga mixed winter veggies, cauliflower, carrots, and Punjabi village specials',
    image: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&auto=format&fit=crop&q=80',
    orderIndex: 7,
  },
  {
    name: 'Amla & Health Herbal',
    slug: 'amla-health',
    description: 'Wild forest amla, organic fresh haldi, and ginger pickles rich in natural antioxidants',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    orderIndex: 8,
  },
  {
    name: 'Royal & Dry Fruit Delicacies',
    slug: 'royal-dryfruit',
    description: 'Rajasthani Ker Sangri, spiced cashew nuts, and royal desert delicacies',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80',
    orderIndex: 9,
  },
  {
    name: 'Festive & Luxury Gift Boxes',
    slug: 'festive-combos',
    description: 'Curated 3-in-1 and 4-in-1 handcrafted wooden tasting hampers and celebration gift sets',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    orderIndex: 10,
  },
];

const richProducts = [
  // 1. Mango Delights
  {
    name: 'Desi Kacchi Kairi Mango Achar',
    slug: 'desi-kacchi-kairi-mango-achar',
    categorySlug: 'mango-delights',
    description: 'Handcrafted with unblemished Ramkela mangoes, roasted fenugreek, nigella seeds, and pure cold-pressed mustard oil. Sun-cured for 21 days for maximum crunch.',
    price: 299,
    compareAtPrice: 399,
    images: ['https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '500g Traditional Glass Jar', sku: 'DKM-500G', price: 299, compareAtPrice: 399, stockQuantity: 85 },
      { name: '1 Kg Family Value Pack', sku: 'DKM-1KG', price: 549, compareAtPrice: 749, stockQuantity: 50 },
    ],
  },
  {
    name: 'Methi & Hing Cut Mango Pickle',
    slug: 'methi-hing-cut-mango-pickle',
    categorySlug: 'mango-delights',
    description: 'Diced green mangoes steeped with potent roasted asafoetida (hing) and split fenugreek seeds in mustard oil.',
    price: 320,
    compareAtPrice: 420,
    images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '500g Jar', sku: 'MHM-500G', price: 320, compareAtPrice: 420, stockQuantity: 70 },
      { name: '1 Kg Jar', sku: 'MHM-1KG', price: 580, compareAtPrice: 760, stockQuantity: 40 },
    ],
  },

  // 2. Stuffed Red Chilli
  {
    name: 'Banarasi Bharwa Lal Mirch Achar',
    slug: 'banarasi-bharwa-lal-mirch-achar',
    categorySlug: 'stuffed-red-chilli',
    description: 'Famed thick Banarasi winter red chillies hand-stuffed with a fragrant blend of roasted amchur, fennel, coriander, and mountain rock salt.',
    price: 349,
    compareAtPrice: 449,
    images: ['https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '400g Signature Jar', sku: 'BLM-400G', price: 349, compareAtPrice: 449, stockQuantity: 60 },
      { name: '800g Jumbo Pack', sku: 'BLM-800G', price: 649, compareAtPrice: 849, stockQuantity: 35 },
    ],
  },
  {
    name: 'Smoked Mustard Stuffed Red Chilli',
    slug: 'smoked-mustard-stuffed-red-chilli',
    categorySlug: 'stuffed-red-chilli',
    description: 'Slow-cured Banarasi red peppers filled with coarse yellow mustard seeds and smoked pungent rai oil for an intense aroma.',
    price: 369,
    compareAtPrice: 469,
    images: ['https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '450g Jar', sku: 'SMR-450G', price: 369, compareAtPrice: 469, stockQuantity: 45 },
    ],
  },

  // 3. Green Chilli & Hari Mirch
  {
    name: 'Rajasthani Desi Hari Mirch Ke Tipore',
    slug: 'rajasthani-hari-mirch-ke-tipore',
    categorySlug: 'green-chilli',
    description: 'Traditional Marwari stir-fried thick green chillies seasoned with cumin, saunf, coriander, and raw dry mango powder.',
    price: 249,
    compareAtPrice: 349,
    images: ['https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '350g Jar', sku: 'RMT-350G', price: 249, compareAtPrice: 349, stockQuantity: 80 },
    ],
  },
  {
    name: 'Lemon & Salt Cured Green Chillies',
    slug: 'lemon-salt-cured-green-chillies',
    categorySlug: 'green-chilli',
    description: 'Slit sharp green chillies soaked in fresh Kagzi lemon juice, turmeric, and Himalayan pink salt. Zero oil and high zest.',
    price: 269,
    compareAtPrice: 369,
    images: ['https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '400g Jar', sku: 'LSC-400G', price: 269, compareAtPrice: 369, stockQuantity: 55 },
    ],
  },

  // 4. Garlic & Spicy Blends
  {
    name: 'Rajasthani Desi Lahsun Ka Achar',
    slug: 'rajasthani-desi-lahsun-achar',
    categorySlug: 'garlic-spicy',
    description: 'Peeled whole plump garlic cloves simmered in roasted cumin, hing, and spicy yellow mustard gravy.',
    price: 320,
    compareAtPrice: 420,
    images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '350g Jar', sku: 'RDL-350G', price: 320, compareAtPrice: 420, stockQuantity: 65 },
      { name: '700g Double Pack', sku: 'RDL-700G', price: 580, compareAtPrice: 780, stockQuantity: 30 },
    ],
  },
  {
    name: 'Crushed Garlic & Hari Mirch Thecha',
    slug: 'crushed-garlic-hari-mirch-thecha',
    categorySlug: 'garlic-spicy',
    description: 'Coarsely stone-ground garlic pods, green chillies, roasted peanuts, and cold-pressed oil. An explosive Maharashtrian classic.',
    price: 299,
    compareAtPrice: 399,
    images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '300g Jar', sku: 'CGT-300G', price: 299, compareAtPrice: 399, stockQuantity: 50 },
    ],
  },

  // 5. Citrus & Lemon
  {
    name: 'Khatta Meetha Sun-Dried Nimbu Pickle (Zero Oil)',
    slug: 'khatta-meetha-nimbu-pickle',
    categorySlug: 'citrus-lemon',
    description: '100% oil-free Ayurvedic recipe. Thin-skinned Kagzi lemons naturally cured in rock salt and organic sugarcane jaggery.',
    price: 280,
    compareAtPrice: 360,
    images: ['https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '500g Jar', sku: 'KMN-500G', price: 280, compareAtPrice: 360, stockQuantity: 70 },
      { name: '1 Kg Bulk Jar', sku: 'KMN-1KG', price: 499, compareAtPrice: 650, stockQuantity: 40 },
    ],
  },
  {
    name: 'Spicy Cumin & Ajwain Salted Lemon Pickle',
    slug: 'spicy-cumin-ajwain-lemon-pickle',
    categorySlug: 'citrus-lemon',
    description: 'Whole salted lemons sun-aged for 40 days with roasted carom seeds (ajwain), black pepper, and digestive kala namak.',
    price: 290,
    compareAtPrice: 380,
    images: ['https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '500g Jar', sku: 'SCA-500G', price: 290, compareAtPrice: 380, stockQuantity: 60 },
    ],
  },

  // 6. Sweet & Khatta Meetha
  {
    name: 'Gujarati Sweet Mango Chunda (Methia Masala)',
    slug: 'gujarati-sweet-mango-chunda',
    categorySlug: 'sweet-chunda',
    description: 'Finely shredded Rajapuri mangoes gently cooked with roasted cumin, cinnamon, Kashmiri chili, and natural sugar.',
    price: 310,
    compareAtPrice: 399,
    images: ['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '450g Glass Jar', sku: 'GMC-450G', price: 310, compareAtPrice: 399, stockQuantity: 75 },
      { name: '900g Family Pack', sku: 'GMC-900G', price: 560, compareAtPrice: 720, stockQuantity: 40 },
    ],
  },
  {
    name: 'Authentic Kashmiri Aam Ka Murabba',
    slug: 'authentic-kashmiri-aam-murabba',
    categorySlug: 'sweet-chunda',
    description: 'Thick succulent green mango chunks simmered in aromatic saffron-infused sugar syrup with crushed green cardamom pods.',
    price: 340,
    compareAtPrice: 440,
    images: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '500g Jar', sku: 'AKM-500G', price: 340, compareAtPrice: 440, stockQuantity: 45 },
    ],
  },

  // 7. Heritage Mixed & Winter Veg
  {
    name: 'Royal Winter Pachranga Mix Veg Achar',
    slug: 'royal-winter-pachranga-mix-veg',
    categorySlug: 'heritage-mixed',
    description: 'Heirloom village recipe combining crispy cauliflower florets, red carrots, knol-khol, turnip, and raw mango slivers.',
    price: 270,
    compareAtPrice: 350,
    images: ['https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '500g Jar', sku: 'RWP-500G', price: 270, compareAtPrice: 350, stockQuantity: 90 },
      { name: '1 Kg Jar', sku: 'RWP-1KG', price: 480, compareAtPrice: 650, stockQuantity: 55 },
    ],
  },
  {
    name: 'Gobi Shalgam Gajar Seasonal Pickle',
    slug: 'gobi-shalgam-gajar-seasonal-pickle',
    categorySlug: 'heritage-mixed',
    description: 'Traditional Punjabi winter sunshine pickle steeped in dark jaggery, ginger-garlic paste, and crushed spices.',
    price: 290,
    compareAtPrice: 380,
    images: ['https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '500g Jar', sku: 'GSG-500G', price: 290, compareAtPrice: 380, stockQuantity: 50 },
    ],
  },

  // 8. Amla & Health Herbal
  {
    name: 'Wild Forest Amla Vitamin-C Immunity Pickle',
    slug: 'wild-forest-amla-immunity-pickle',
    categorySlug: 'amla-health',
    description: 'Nutrient-rich wild gooseberries gently steamed and infused with cold-pressed mustard oil, turmeric, and fenugreek.',
    price: 310,
    compareAtPrice: 410,
    images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '500g Jar', sku: 'WFA-500G', price: 310, compareAtPrice: 410, stockQuantity: 65 },
    ],
  },
  {
    name: 'Fresh Raw Haldi & Adrak Digestive Pickle',
    slug: 'fresh-raw-haldi-adrak-digestive-pickle',
    categorySlug: 'amla-health',
    description: 'Fresh organic orange-yellow raw turmeric root and mountain ginger batons cured in fresh lemon juice and sea salt.',
    price: 330,
    compareAtPrice: 430,
    images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '400g Jar', sku: 'RHA-400G', price: 330, compareAtPrice: 430, stockQuantity: 40 },
    ],
  },

  // 9. Royal & Dry Fruit Delicacies
  {
    name: 'Royal Rajasthani Ker Sangri Heritage Pickle',
    slug: 'royal-rajasthani-ker-sangri-pickle',
    categorySlug: 'royal-dryfruit',
    description: 'Legendary desert caper berries (ker) and wild green beans (sangri) slow-cooked in cold-pressed mustard oil and aromatic spices.',
    price: 599,
    compareAtPrice: 799,
    images: ['https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '400g Heritage Jar', sku: 'RKS-400G', price: 599, compareAtPrice: 799, stockQuantity: 30 },
    ],
  },
  {
    name: 'Gourmet Spiced Cashew Nut (Kaju) Pickle',
    slug: 'gourmet-spiced-cashew-nut-pickle',
    categorySlug: 'royal-dryfruit',
    description: 'Whole roasted Goan cashews tenderly soaked in roasted cumin, hing, red chilli, and tart amchur gravy.',
    price: 649,
    compareAtPrice: 849,
    images: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '350g Luxury Jar', sku: 'GCK-350G', price: 649, compareAtPrice: 849, stockQuantity: 25 },
    ],
  },

  // 10. Festive & Luxury Gift Boxes
  {
    name: 'Grand Festive 3-Pickle Wooden Gift Pack',
    slug: 'grand-festive-3-pickle-wooden-pack',
    categorySlug: 'festive-combos',
    description: 'Curated wooden pine crate containing 500g glass jars of Mango, Banarasi Stuffed Chilli, and Sweet Lemon pickles.',
    price: 899,
    compareAtPrice: 1199,
    images: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '3 x 500g Wooden Crate Set', sku: 'GFP-3PACK', price: 899, compareAtPrice: 1199, stockQuantity: 35 },
    ],
  },
  {
    name: 'Royal 4-Jar Celebration Banquet Hamper',
    slug: 'royal-4-jar-celebration-banquet-hamper',
    categorySlug: 'festive-combos',
    description: 'Ultimate gift set featuring Mango, Banarasi Chilli, Garlic, and Mango Chunda in a luxury embossed box with hand-carved brass spoons.',
    price: 1299,
    compareAtPrice: 1699,
    images: ['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80'],
    variants: [
      { name: '4-Jar Royal Gift Hamper', sku: 'RBH-4PACK', price: 1299, compareAtPrice: 1699, stockQuantity: 20 },
    ],
  },
];

const richStudioPackages = [
  {
    name: 'Pre-Wedding Cinematic Film & Photoshoot',
    slug: 'pre-wedding-cinematic-film',
    category: 'PHOTOGRAPHY',
    duration: '1 Full Day (10 Hours)',
    price: 25000,
    advanceTokenPercent: 25,
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80'],
    description: 'Full-day cinematic shoot at scenic heritage or outdoor locations. Includes 4K cinematic video teaser, 50 master-edited portraits, and aerial drone coverage.',
    deliverables: [
      '3-4 Minute 4K Cinematic Teaser Film',
      '50 Retouched High-Resolution Photographs',
      'Full RAW Footage Archive on SSD',
      'DJI 4K Drone Aerial Shots Included',
      '2 Custom Outfit & Location Changes',
    ],
  },
  {
    name: 'Royal Destination Wedding 3-Day Coverage',
    slug: 'royal-destination-wedding',
    category: 'WEDDING',
    duration: '3 Days (Mehendi, Sangeet & Reception)',
    price: 85000,
    advanceTokenPercent: 30,
    images: ['https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80'],
    description: 'Complete luxury wedding documentation by a 5-member master crew. Includes traditional photography, candid portraiture, live streaming setup, and luxury coffee table albums.',
    deliverables: [
      'Full 45-60 Min Feature Wedding Film',
      '150 Premium Hand-Edited Album Portraits',
      '2 Deluxe Hardcover Flush-Mount Albums (30 Sheets)',
      'Instagram Reels & Same-Day Edit Highlights',
      'Complete Candid & Traditional Crew (5 Photographers)',
    ],
  },
  {
    name: 'Baby & Maternity Fine-Art Studio Portfolio',
    slug: 'baby-maternity-portfolio',
    category: 'STUDIO',
    duration: '3 Hours Studio Session',
    price: 8500,
    advanceTokenPercent: 20,
    images: ['https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&auto=format&fit=crop&q=80'],
    description: 'Gentle, temperature-controlled studio environment with curated designer props, floral backgrounds, and maternity gowns. Stress-free pacing for mother and baby.',
    deliverables: [
      '20 Fine-Art Retouched Digital Portraits',
      '4 Themed Studio Setup Backgrounds',
      'Complimentary Maternity Gown & Baby Wraps',
      'Framed 12×18 Canvas Wall Print',
    ],
  },
  {
    name: 'Manali & Kasol 4D/3N Adventure Group Tour',
    slug: 'manali-kasol-adventure-tour',
    category: 'TRAVEL',
    duration: '4 Days / 3 Nights',
    price: 12999,
    advanceTokenPercent: 25,
    images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'],
    description: 'Guided mountain tour covering Solang Valley, Rohtang Pass, Kasol Manikaran Sahib, and riverside luxury camps. Includes transfers, meals, and certified trek guides.',
    deliverables: [
      'Volvo Bus Transfers from Delhi / Chandigarh',
      '3 Nights Hotel & Riverside Swiss Tents',
      'Daily Buffet Breakfast and Dinner Included',
      'Campfire & Live Music Evening',
      'Solang Valley & Manikaran Sightseeing',
    ],
  },
  {
    name: 'Kerala Backwaters & Munnar Tea Hills Tour',
    slug: 'kerala-backwaters-munnar-tour',
    category: 'TRAVEL',
    duration: '5 Days / 4 Nights',
    price: 24500,
    advanceTokenPercent: 30,
    images: ['https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop&q=80'],
    description: 'Romantic Kerala escapade featuring a private luxury houseboat cruise in Alleppey backwaters and scenic hillside resort stay among Munnar rolling tea plantations.',
    deliverables: [
      'Private AC Cab for Complete 5 Days',
      '1 Night AC Deluxe Houseboat Cruise (All Meals)',
      '3 Nights Luxury Tea Estate View Resort',
      'Eravikulam National Park & Tea Museum Visits',
      'Complimentary Ayurvedic Herbal Massage Session',
    ],
  },
];

const seedRichData = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas';
  console.log('[Seed Engine] Connecting to:', mongoUri);
  await mongoose.connect(mongoUri);

  // 1. Desi Rasoi Achar (Product Business)
  const productTenant = await Tenant.findOne({ slug: 'desi-rasoi-achar-1' });
  if (!productTenant) {
    console.error('Tenant desi-rasoi-achar-1 not found!');
    process.exit(1);
  }
  console.log('Seeding rich catalog for:', productTenant.businessName);

  // Clear previous sample categories and products
  await Category.deleteMany({ businessId: productTenant._id });
  await Product.deleteMany({ businessId: productTenant._id });

  // Insert rich categories
  const categoryMap = {};
  for (const catData of richCategories) {
    const createdCat = await Category.create({
      businessId: productTenant._id,
      name: catData.name,
      slug: catData.slug,
      description: catData.description,
      image: catData.image,
      orderIndex: catData.orderIndex,
      isActive: true,
    });
    categoryMap[catData.slug] = createdCat._id;
  }
  console.log(`✓ Inserted ${Object.keys(categoryMap).length} categories with high-res photos`);

  // Insert rich products
  for (const prodData of richProducts) {
    const catId = categoryMap[prodData.categorySlug] || null;
    await Product.create({
      businessId: productTenant._id,
      categoryId: catId,
      name: prodData.name,
      slug: prodData.slug,
      description: prodData.description,
      price: prodData.price,
      compareAtPrice: prodData.compareAtPrice,
      images: prodData.images,
      variants: prodData.variants,
      isAvailable: true,
      trackQuantity: true,
      stockQuantity: prodData.variants.reduce((sum, v) => sum + v.stockQuantity, 0),
    });
  }
  console.log(`✓ Inserted ${richProducts.length} premium pickle products with variants & photos`);

  // 2. Royal Films Studio (Service & Travel Business)
  const serviceTenant = await Tenant.findOne({ slug: 'royal-films-studio-1' });
  if (serviceTenant) {
    console.log('Seeding rich service packages for:', serviceTenant.businessName);
    await ServicePackage.deleteMany({ businessId: serviceTenant._id });

    for (const pkgData of richStudioPackages) {
      await ServicePackage.create({
        businessId: serviceTenant._id,
        name: pkgData.name,
        slug: pkgData.slug,
        category: pkgData.category,
        duration: pkgData.duration,
        price: pkgData.price,
        advanceTokenPercent: pkgData.advanceTokenPercent,
        description: pkgData.description,
        deliverables: pkgData.deliverables,
        images: pkgData.images,
        isActive: true,
      });
    }
    console.log(`✓ Inserted ${richStudioPackages.length} rich shoot and travel packages`);
  }

  // 3. Ensure Realistic Orders exist for Desi Rasoi Achar
  const existingOrders = await Order.countDocuments({ businessId: productTenant._id });
  if (existingOrders === 0) {
    console.log('Generating realistic sample orders with live status...');
    const createdProds = await Product.find({ businessId: productTenant._id });
    const sampleOrders = [
      {
        businessId: productTenant._id,
        orderNumber: 'ORD-894120-101',
        customerName: 'Aarav Sharma',
        customerPhone: '+919811223344',
        customerEmail: 'aarav.sharma@gmail.com',
        shippingAddress: { street: 'B-14, Model Town', city: 'Delhi', state: 'Delhi', pincode: '110009' },
        items: [
          {
            productId: createdProds[0]._id,
            variantId: createdProds[0].variants[0]._id,
            name: createdProds[0].name,
            variantName: createdProds[0].variants[0].name,
            price: createdProds[0].variants[0].price,
            quantity: 2,
            subtotal: createdProds[0].variants[0].price * 2,
            image: createdProds[0].images[0],
          },
        ],
        subtotal: 598,
        shippingFee: 0,
        totalAmount: 598,
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        orderStatus: 'CONFIRMED',
        attribution: { utmSource: 'Instagram Ad', utmCampaign: 'Diwali Homemade Achar Promo' },
        timeline: [
          { status: 'NEW', note: 'Order placed via Instagram Reel Ad', updatedBy: 'Customer', timestamp: new Date(Date.now() - 3600000) },
          { status: 'CONFIRMED', note: 'Order confirmed with customer over WhatsApp', updatedBy: 'Rahul Sharma', timestamp: new Date(Date.now() - 1800000) },
        ],
      },
      {
        businessId: productTenant._id,
        orderNumber: 'ORD-894120-102',
        customerName: 'Priya Mehra',
        customerPhone: '+919876501234',
        customerEmail: 'priya.mehra@yahoo.com',
        shippingAddress: { street: '74, Indiranagar 100ft Rd', city: 'Bengaluru', state: 'Karnataka', pincode: '560038' },
        items: [
          {
            productId: createdProds[1]._id,
            variantId: createdProds[1].variants[0]._id,
            name: createdProds[1].name,
            variantName: createdProds[1].variants[0].name,
            price: createdProds[1].variants[0].price,
            quantity: 1,
            subtotal: createdProds[1].variants[0].price,
            image: createdProds[1].images[0],
          },
          {
            productId: createdProds[2]._id,
            variantId: createdProds[2].variants[0]._id,
            name: createdProds[2].name,
            variantName: createdProds[2].variants[0].name,
            price: createdProds[2].variants[0].price,
            quantity: 1,
            subtotal: createdProds[2].variants[0].price,
            image: createdProds[2].images[0],
          },
        ],
        subtotal: 629,
        shippingFee: 0,
        totalAmount: 629,
        paymentMethod: 'ONLINE',
        paymentStatus: 'PAID',
        orderStatus: 'SHIPPED',
        courierDetails: {
          courierPartner: 'BlueDart Air',
          trackingNumber: 'BLUEDART-88992211',
          shippedAt: new Date(),
        },
        attribution: { utmSource: 'Facebook Ad', utmCampaign: 'Banarasi Mirch Foodies Special' },
        timeline: [
          { status: 'NEW', note: 'Online payment received via Razorpay (pay_291028)', updatedBy: 'Razorpay Webhook', timestamp: new Date(Date.now() - 7200000) },
          { status: 'CONFIRMED', note: 'Payment verified', updatedBy: 'System', timestamp: new Date(Date.now() - 7000000) },
          { status: 'SHIPPED', note: 'Dispatched via BlueDart Air. Tracking: BLUEDART-88992211', updatedBy: 'Rahul Sharma', timestamp: new Date(Date.now() - 1000000) },
        ],
      },
    ];

    await Order.insertMany(sampleOrders);
    console.log(`✓ Inserted ${sampleOrders.length} realistic orders with courier tracking`);
  }

  console.log('\n[Seed Engine] Rich Data Seeding Completed Successfully!\n');
  await mongoose.disconnect();
};

seedRichData().catch((err) => {
  console.error('[Seed Engine Fatal Error]:', err);
  process.exit(1);
});
