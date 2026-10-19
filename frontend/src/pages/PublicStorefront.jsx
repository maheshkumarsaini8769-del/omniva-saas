import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle,
  Truck,
  ShieldCheck,
  Star,
  MapPin,
  Phone,
  ArrowRight,
  ExternalLink,
  Store,
  Sparkles,
  Layers,
  ChevronRight,
  AlertCircle,
  Camera,
  Calendar,
  Clock,
  Trash2,
  Zap,
  X,
  Gift,
  MessageSquare,
  MessageCircle,
  Ticket,
  Tag,
  Percent,
  Search,
  ArrowLeft,
  Check
} from 'lucide-react';

export const PublicStorefront = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();

  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart state
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('CART'); // 'CART' | 'CHECKOUT' | 'SUCCESS'
  const [placedOrder, setPlacedOrder] = useState(null);

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Checkout form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Uttar Pradesh');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exit-Intent State
  const [isExitPopupOpen, setIsExitPopupOpen] = useState(false);
  const [exitPhone, setExitPhone] = useState('');
  const [exitName, setExitName] = useState('');
  const [hasTriggeredExit, setHasTriggeredExit] = useState(false);
  const [couponClaimed, setCouponClaimed] = useState(false);

  // Service & Travel Booking state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTimeSlot, setBookingTimeSlot] = useState('Full Day');
  const [bookingLocation, setBookingLocation] = useState('');
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [placedBooking, setPlacedBooking] = useState(null);

  const handlePlaceBooking = async (e) => {
    e.preventDefault();
    if (!bookingName || !bookingPhone || !bookingDate) {
      alert('Please fill Name, Mobile Number, and Event Date');
      return;
    }
    try {
      setIsBookingSubmitting(true);
      const res = await fetch(`/api/public/store/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPkg?._id || null,
          customerName: bookingName,
          customerPhone: bookingPhone,
          customerEmail: bookingEmail,
          eventDate: bookingDate,
          timeSlot: bookingTimeSlot,
          location: bookingLocation,
          notes: bookingNotes,
          attribution,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlacedBooking(data.data);
      } else {
        alert(data.message || 'Failed to submit booking');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // Capture attribution from URL query params
  const attribution = {
    utmSource: searchParams.get('utm_source') || '',
    utmMedium: searchParams.get('utm_medium') || '',
    utmCampaign: searchParams.get('utm_campaign') || '',
    utmContent: searchParams.get('utm_content') || '',
    fbclid: searchParams.get('fbclid') || '',
  };

  const STOREFRONT_DEFAULT_COUPONS = [
    {
      _id: 'coup_desi15',
      code: 'DESI15',
      title: '15% Off Traditional Jars',
      description: 'Get 15% discount on all orders above ₹399',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderValue: 399,
      maxDiscount: 150,
      isActive: true,
    },
    {
      _id: 'coup_save100',
      code: 'SAVE100',
      title: 'Flat ₹100 Off Festive Offer',
      description: 'Instant ₹100 discount on orders above ₹599',
      discountType: 'FLAT',
      discountValue: 100,
      minOrderValue: 599,
      maxDiscount: 100,
      isActive: true,
    },
    {
      _id: 'coup_welcome10',
      code: 'WELCOME10',
      title: '10% First Order Welcome',
      description: 'Special 10% welcome discount for new customers',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 199,
      maxDiscount: 100,
      isActive: true,
    },
  ];

  const DEFAULT_FALLBACK_STORE = {
    store: {
      businessName: slug?.includes('royal') ? 'Royal Films Studio' : 'Desi Rasoi Achar',
      slug: slug || 'desi-rasoi-achar-1',
      businessType: slug?.includes('royal') ? 'SERVICE' : 'PRODUCT',
      phone: '+91 98765 43210',
      branding: {
        logo: '',
        primaryColor: '#4f46e5',
        secondaryColor: '#06b6d4',
      },
      settings: {
        currency: 'INR',
        currencySymbol: '₹',
        enableCOD: true,
        enableOnlinePay: true,
      },
    },
    categories: [
      {
        _id: 'cat_mango',
        name: 'Mango Delights (Aam)',
        slug: 'mango-delights',
        description: 'Traditional sun-dried raw mango pickles infused with cold-pressed mustard oil and aromatic spices',
        image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80',
        orderIndex: 1,
      },
      {
        _id: 'cat_red_chilli',
        name: 'Stuffed Red Chilli (Lal Mirch)',
        slug: 'stuffed-red-chilli',
        description: 'Authentic Banarasi thick winter red chillies hand-stuffed with roasted heirloom masala',
        image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=600&auto=format&fit=crop&q=80',
        orderIndex: 2,
      },
      {
        _id: 'cat_green_chilli',
        name: 'Green Chilli & Hari Mirch',
        slug: 'green-chilli',
        description: 'Spicy Rajasthani slit green chillies, tipore, and lemon-soaked tangy bites',
        image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
        orderIndex: 3,
      },
      {
        _id: 'cat_garlic',
        name: 'Garlic & Spicy Blends',
        slug: 'garlic-spicy',
        description: 'Golden whole garlic cloves and spicy thecha tempered in pure mustard oil',
        image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
        orderIndex: 4,
      },
      {
        _id: 'cat_citrus',
        name: 'Citrus & Lemon (Nimbu)',
        slug: 'citrus-lemon',
        description: 'Zero-oil sun-matured Kagzi lemon pickles with Himalayan rock salt and digestive carom',
        image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80',
        orderIndex: 5,
      },
      {
        _id: 'cat_sweet',
        name: 'Sweet & Khatta Meetha',
        slug: 'sweet-chunda',
        description: 'Gujarati sweet mango chunda, royal fruit murabbas, and sweet-sour lime preserves',
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
        orderIndex: 6,
      },
      {
        _id: 'cat_mixed',
        name: 'Heritage Mixed & Winter Veg',
        slug: 'heritage-mixed',
        description: 'Pachranga mixed winter veggies, cauliflower, carrots, and Punjabi village specials',
        image: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&auto=format&fit=crop&q=80',
        orderIndex: 7,
      },
      {
        _id: 'cat_amla',
        name: 'Amla & Health Herbal',
        slug: 'amla-health',
        description: 'Wild forest amla, organic fresh haldi, and ginger pickles rich in natural antioxidants',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        orderIndex: 8,
      },
      {
        _id: 'cat_royal',
        name: 'Royal & Dry Fruit Delicacies',
        slug: 'royal-dryfruit',
        description: 'Rajasthani Ker Sangri, spiced cashew nuts, and royal desert delicacies',
        image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80',
        orderIndex: 9,
      },
      {
        _id: 'cat_gift',
        name: 'Festive & Luxury Gift Boxes',
        slug: 'festive-combos',
        description: 'Curated 3-in-1 and 4-in-1 handcrafted wooden tasting hampers and celebration gift sets',
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
        orderIndex: 10,
      },
    ],
    products: [
      // 1. Mango Delights
      {
        _id: 'prod_m1',
        name: 'Desi Kacchi Kairi Mango Achar',
        slug: 'desi-kacchi-kairi-mango-achar',
        categoryId: { _id: 'cat_mango', name: 'Mango Delights (Aam)', slug: 'mango-delights' },
        category: 'Mango Delights (Aam)',
        description: 'Handcrafted with unblemished Ramkela raw mangoes, roasted fenugreek, nigella seeds, and pure cold-pressed mustard oil. Sun-cured for 21 days for maximum crunch.',
        price: 299,
        compareAtPrice: 399,
        images: ['https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 189, compareAtPrice: 249, stockQuantity: 60 },
          { name: '500g Glass Jar', price: 299, compareAtPrice: 399, stockQuantity: 85 },
          { name: '1 Kg Family Pack', price: 549, compareAtPrice: 749, stockQuantity: 50 },
        ],
        stockQuantity: 85,
        isAvailable: true,
      },
      {
        _id: 'prod_m2',
        name: 'Hing & Methi Sun-Dried Raw Mango',
        slug: 'hing-methi-sun-dried-mango',
        categoryId: { _id: 'cat_mango', name: 'Mango Delights (Aam)', slug: 'mango-delights' },
        category: 'Mango Delights (Aam)',
        description: 'Infused with aromatic compounding Hathras asafoetida (hing) and hand-pounded yellow mustard. Tangy, zesty, and zero artificial preservatives.',
        price: 329,
        compareAtPrice: 429,
        images: ['https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 199, compareAtPrice: 269, stockQuantity: 40 },
          { name: '500g Glass Jar', price: 329, compareAtPrice: 429, stockQuantity: 70 },
          { name: '1 Kg Family Pack', price: 599, compareAtPrice: 799, stockQuantity: 45 },
        ],
        stockQuantity: 70,
        isAvailable: true,
      },

      // 2. Stuffed Red Chilli
      {
        _id: 'prod_rc1',
        name: 'Banarasi Hand-Stuffed Red Chilli Pickle',
        slug: 'banarasi-hand-stuffed-red-chilli',
        categoryId: { _id: 'cat_red_chilli', name: 'Stuffed Red Chilli (Lal Mirch)', slug: 'stuffed-red-chilli' },
        category: 'Stuffed Red Chilli (Lal Mirch)',
        description: 'World-renowned Banarasi thick winter red chillies cored by hand and tightly filled with roasted amchur, fennel, and spiced mustard blend.',
        price: 349,
        compareAtPrice: 449,
        images: ['https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 219, compareAtPrice: 289, stockQuantity: 50 },
          { name: '500g Glass Jar', price: 349, compareAtPrice: 449, stockQuantity: 65 },
          { name: '1 Kg Family Pack', price: 629, compareAtPrice: 849, stockQuantity: 40 },
        ],
        stockQuantity: 65,
        isAvailable: true,
      },
      {
        _id: 'prod_rc2',
        name: 'Smoked Mustard Stuffed Lal Mirch',
        slug: 'smoked-mustard-stuffed-lal-mirch',
        categoryId: { _id: 'cat_red_chilli', name: 'Stuffed Red Chilli (Lal Mirch)', slug: 'stuffed-red-chilli' },
        category: 'Stuffed Red Chilli (Lal Mirch)',
        description: 'A fiery, smoky variant of stuffed red peppers cured in wood-pressed mustard oil with a punch of crushed black cumin and ajwain.',
        price: 369,
        compareAtPrice: 469,
        images: ['https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 229, compareAtPrice: 299, stockQuantity: 40 },
          { name: '500g Glass Jar', price: 369, compareAtPrice: 469, stockQuantity: 55 },
          { name: '1 Kg Family Pack', price: 659, compareAtPrice: 899, stockQuantity: 30 },
        ],
        stockQuantity: 55,
        isAvailable: true,
      },

      // 3. Green Chilli & Hari Mirch
      {
        _id: 'prod_gc1',
        name: 'Rajasthani Hari Mirch Tipore & Slit Chilli',
        slug: 'rajasthani-hari-mirch-tipore',
        categoryId: { _id: 'cat_green_chilli', name: 'Green Chilli & Hari Mirch', slug: 'green-chilli' },
        category: 'Green Chilli & Hari Mirch',
        description: 'Fresh Rajasthani green chillies tossed with cracked coriander, turmeric, fennel, and lemon juice. The ultimate lunch companion.',
        price: 249,
        compareAtPrice: 329,
        images: ['https://images.unsplash.com/photo-1589135233689-d56b00b0d367?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 159, compareAtPrice: 219, stockQuantity: 70 },
          { name: '500g Glass Jar', price: 249, compareAtPrice: 329, stockQuantity: 90 },
          { name: '1 Kg Family Pack', price: 449, compareAtPrice: 599, stockQuantity: 45 },
        ],
        stockQuantity: 90,
        isAvailable: true,
      },
      {
        _id: 'prod_gc2',
        name: 'Lemon & Green Chilli Tangy Zing',
        slug: 'lemon-green-chilli-tangy-zing',
        categoryId: { _id: 'cat_green_chilli', name: 'Green Chilli & Hari Mirch', slug: 'green-chilli' },
        category: 'Green Chilli & Hari Mirch',
        description: 'Bite-sized whole green peppers aged alongside sour yellow Kagzi lemon wedges in mineral-rich pink Himalayan rock salt.',
        price: 269,
        compareAtPrice: 349,
        images: ['https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 169, compareAtPrice: 229, stockQuantity: 50 },
          { name: '500g Glass Jar', price: 269, compareAtPrice: 349, stockQuantity: 75 },
          { name: '1 Kg Family Pack', price: 489, compareAtPrice: 649, stockQuantity: 35 },
        ],
        stockQuantity: 75,
        isAvailable: true,
      },

      // 4. Garlic & Spicy Blends
      {
        _id: 'prod_g1',
        name: 'Desi Spicy Garlic Pickle (Lahsun Ka Achar)',
        slug: 'desi-spicy-garlic-pickle',
        categoryId: { _id: 'cat_garlic', name: 'Garlic & Spicy Blends', slug: 'garlic-spicy' },
        category: 'Garlic & Spicy Blends',
        description: 'Whole peeled golden garlic cloves simmered slowly in fiery Kashmiri red chilli paste, mustard, and roasted cumin. Great for digestion.',
        price: 319,
        compareAtPrice: 419,
        images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 199, compareAtPrice: 269, stockQuantity: 60 },
          { name: '500g Glass Jar', price: 319, compareAtPrice: 419, stockQuantity: 80 },
          { name: '1 Kg Family Pack', price: 579, compareAtPrice: 779, stockQuantity: 40 },
        ],
        stockQuantity: 80,
        isAvailable: true,
      },
      {
        _id: 'prod_g2',
        name: 'Kolhapuri Garlic Thecha & Mustard Relish',
        slug: 'kolhapuri-garlic-thecha-relish',
        categoryId: { _id: 'cat_garlic', name: 'Garlic & Spicy Blends', slug: 'garlic-spicy' },
        category: 'Garlic & Spicy Blends',
        description: 'Coarsely pounded raw garlic and roasted green chillies tempered with hot peanut oil and freshly toasted sesame seeds.',
        price: 289,
        compareAtPrice: 379,
        images: ['https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 179, compareAtPrice: 249, stockQuantity: 50 },
          { name: '500g Glass Jar', price: 289, compareAtPrice: 379, stockQuantity: 65 },
          { name: '1 Kg Family Pack', price: 529, compareAtPrice: 699, stockQuantity: 30 },
        ],
        stockQuantity: 65,
        isAvailable: true,
      },

      // 5. Citrus & Lemon (Nimbu)
      {
        _id: 'prod_c1',
        name: 'Kagzi Nimbu Tangy Pickle (Zero Oil)',
        slug: 'kagzi-nimbu-tangy-pickle',
        categoryId: { _id: 'cat_citrus', name: 'Citrus & Lemon (Nimbu)', slug: 'citrus-lemon' },
        category: 'Citrus & Lemon (Nimbu)',
        description: 'Paper-thin skin Kagzi lemons cured under the midday sun for 30 days with Himalayan rock salt, ajwain, and black pepper. Completely oil-free.',
        price: 279,
        compareAtPrice: 359,
        images: ['https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 169, compareAtPrice: 229, stockQuantity: 70 },
          { name: '500g Glass Jar', price: 279, compareAtPrice: 359, stockQuantity: 95 },
          { name: '1 Kg Family Pack', price: 499, compareAtPrice: 649, stockQuantity: 45 },
        ],
        stockQuantity: 95,
        isAvailable: true,
      },
      {
        _id: 'prod_c2',
        name: 'Sweet & Sour Khatta Meetha Lemon Pickle',
        slug: 'khatta-meetha-lemon-pickle',
        categoryId: { _id: 'cat_citrus', name: 'Citrus & Lemon (Nimbu)', slug: 'citrus-lemon' },
        category: 'Citrus & Lemon (Nimbu)',
        description: 'Juicy lemons sweetened with organic jaggery syrup and cinnamon quills. Cured until dark, syrupy, and deeply flavorful.',
        price: 299,
        compareAtPrice: 399,
        images: ['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 179, compareAtPrice: 249, stockQuantity: 60 },
          { name: '500g Glass Jar', price: 299, compareAtPrice: 399, stockQuantity: 75 },
          { name: '1 Kg Family Pack', price: 549, compareAtPrice: 729, stockQuantity: 40 },
        ],
        stockQuantity: 75,
        isAvailable: true,
      },

      // 6. Sweet & Khatta Meetha
      {
        _id: 'prod_sw1',
        name: 'Traditional Gujarati Sweet Mango Chunda',
        slug: 'traditional-gujarati-sweet-mango-chunda',
        categoryId: { _id: 'cat_sweet', name: 'Sweet & Khatta Meetha', slug: 'sweet-chunda' },
        category: 'Sweet & Khatta Meetha',
        description: 'Grated green mangoes sun-cooked in raw unrefined sugar crystals, Kashmiri saffron strands, cardamom pods, and cinnamon.',
        price: 339,
        compareAtPrice: 439,
        images: ['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 199, compareAtPrice: 269, stockQuantity: 65 },
          { name: '500g Glass Jar', price: 339, compareAtPrice: 439, stockQuantity: 85 },
          { name: '1 Kg Family Pack', price: 619, compareAtPrice: 799, stockQuantity: 40 },
        ],
        stockQuantity: 85,
        isAvailable: true,
      },
      {
        _id: 'prod_sw2',
        name: 'Organic Gur Keri Raw Mango Launji',
        slug: 'organic-gur-keri-mango-launji',
        categoryId: { _id: 'cat_sweet', name: 'Sweet & Khatta Meetha', slug: 'sweet-chunda' },
        category: 'Sweet & Khatta Meetha',
        description: 'Slow-simmered raw mango pieces in pure organic sugarcane jaggery (gur), plump golden raisins, and roasted kalonji.',
        price: 319,
        compareAtPrice: 409,
        images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 189, compareAtPrice: 249, stockQuantity: 50 },
          { name: '500g Glass Jar', price: 319, compareAtPrice: 409, stockQuantity: 70 },
          { name: '1 Kg Family Pack', price: 579, compareAtPrice: 749, stockQuantity: 35 },
        ],
        stockQuantity: 70,
        isAvailable: true,
      },

      // 7. Heritage Mixed & Winter Veg
      {
        _id: 'prod_mv1',
        name: 'Pachranga Heritage Winter Veggie Pickle',
        slug: 'pachranga-heritage-winter-veggie',
        categoryId: { _id: 'cat_mixed', name: 'Heritage Mixed & Winter Veg', slug: 'heritage-mixed' },
        category: 'Heritage Mixed & Winter Veg',
        description: 'Crisp winter cauliflower florets, crunchy red carrots, baby turnips, green peas, and lotus stem in aged mustard oil.',
        price: 299,
        compareAtPrice: 389,
        images: ['https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 179, compareAtPrice: 239, stockQuantity: 65 },
          { name: '500g Glass Jar', price: 299, compareAtPrice: 389, stockQuantity: 90 },
          { name: '1 Kg Family Pack', price: 539, compareAtPrice: 699, stockQuantity: 50 },
        ],
        stockQuantity: 90,
        isAvailable: true,
      },
      {
        _id: 'prod_mv2',
        name: 'Punjabi Gobhi Gajar Shalgam Crunchy Pickle',
        slug: 'punjabi-gobhi-gajar-shalgam',
        categoryId: { _id: 'cat_mixed', name: 'Heritage Mixed & Winter Veg', slug: 'heritage-mixed' },
        category: 'Heritage Mixed & Winter Veg',
        description: 'Grandma recipe sweet and sour winter special prepared with jaggery, malt vinegar, fresh ginger slivers, and mustard.',
        price: 319,
        compareAtPrice: 419,
        images: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 189, compareAtPrice: 259, stockQuantity: 55 },
          { name: '500g Glass Jar', price: 319, compareAtPrice: 419, stockQuantity: 80 },
          { name: '1 Kg Family Pack', price: 579, compareAtPrice: 769, stockQuantity: 40 },
        ],
        stockQuantity: 80,
        isAvailable: true,
      },

      // 8. Amla & Health Herbal
      {
        _id: 'prod_ah1',
        name: 'Wild Forest Amla & Turmeric Immunity Pickle',
        slug: 'wild-forest-amla-turmeric',
        categoryId: { _id: 'cat_amla', name: 'Amla & Health Herbal', slug: 'amla-health' },
        category: 'Amla & Health Herbal',
        description: 'Hand-picked wild Indian gooseberries (amla) steam-cured with freshly scraped raw Salem turmeric roots and crushed black pepper.',
        price: 329,
        compareAtPrice: 429,
        images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 199, compareAtPrice: 269, stockQuantity: 50 },
          { name: '500g Glass Jar', price: 329, compareAtPrice: 429, stockQuantity: 70 },
          { name: '1 Kg Family Pack', price: 599, compareAtPrice: 789, stockQuantity: 35 },
        ],
        stockQuantity: 70,
        isAvailable: true,
      },
      {
        _id: 'prod_ah2',
        name: 'Organic Fresh Kacchi Haldi & Ginger Pickle',
        slug: 'organic-fresh-kacchi-haldi-ginger',
        categoryId: { _id: 'cat_amla', name: 'Amla & Health Herbal', slug: 'amla-health' },
        category: 'Amla & Health Herbal',
        description: 'Zesty matchstick slices of organic raw yellow turmeric and tender young ginger marinated in freshly squeezed lemon juice.',
        price: 349,
        compareAtPrice: 449,
        images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 209, compareAtPrice: 279, stockQuantity: 45 },
          { name: '500g Glass Jar', price: 349, compareAtPrice: 449, stockQuantity: 65 },
          { name: '1 Kg Family Pack', price: 629, compareAtPrice: 829, stockQuantity: 30 },
        ],
        stockQuantity: 65,
        isAvailable: true,
      },

      // 9. Royal & Dry Fruit Delicacies
      {
        _id: 'prod_rf1',
        name: 'Royal Rajasthani Ker Sangri Desert Pickle',
        slug: 'royal-rajasthani-ker-sangri',
        categoryId: { _id: 'cat_royal', name: 'Royal & Dry Fruit Delicacies', slug: 'royal-dryfruit' },
        category: 'Royal & Dry Fruit Delicacies',
        description: 'Wild desert capers (Ker) and dried beans (Sangri) from the Thar desert, cooked in pure mustard oil with raisins and whole red chillies.',
        price: 499,
        compareAtPrice: 649,
        images: ['https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 289, compareAtPrice: 389, stockQuantity: 40 },
          { name: '500g Glass Jar', price: 499, compareAtPrice: 649, stockQuantity: 50 },
          { name: '1 Kg Family Pack', price: 929, compareAtPrice: 1199, stockQuantity: 25 },
        ],
        stockQuantity: 50,
        isAvailable: true,
      },
      {
        _id: 'prod_rf2',
        name: 'Shahi Spiced Cashew & Raisin Achar',
        slug: 'shahi-spiced-cashew-raisin',
        categoryId: { _id: 'cat_royal', name: 'Royal & Dry Fruit Delicacies', slug: 'royal-dryfruit' },
        category: 'Royal & Dry Fruit Delicacies',
        description: 'Whole roasted Goan cashews and jumbo Afghan raisins tossed in a sweet-tart royal mango masala gravy.',
        price: 549,
        compareAtPrice: 699,
        images: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '250g Glass Jar', price: 319, compareAtPrice: 419, stockQuantity: 35 },
          { name: '500g Glass Jar', price: 549, compareAtPrice: 699, stockQuantity: 45 },
          { name: '1 Kg Family Pack', price: 999, compareAtPrice: 1299, stockQuantity: 20 },
        ],
        stockQuantity: 45,
        isAvailable: true,
      },

      // 10. Festive & Luxury Gift Boxes
      {
        _id: 'prod_gb1',
        name: 'Grand 3-in-1 Handcrafted Wooden Heritage Crate',
        slug: 'grand-3-in-1-wooden-heritage-crate',
        categoryId: { _id: 'cat_gift', name: 'Festive & Luxury Gift Boxes', slug: 'festive-combos' },
        category: 'Festive & Luxury Gift Boxes',
        description: 'Artisanal pine wood gift box featuring three 350g signature jars: Ramkela Mango, Banarasi Stuffed Red Chilli, and Kagzi Nimbu.',
        price: 899,
        compareAtPrice: 1199,
        images: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '3 x 350g Wooden Box Gift Set', price: 899, compareAtPrice: 1199, stockQuantity: 35 },
        ],
        stockQuantity: 35,
        isAvailable: true,
      },
      {
        _id: 'prod_gb2',
        name: 'Royal 4-in-1 Festive Pickle Gift Hamper',
        slug: 'royal-4-in-1-festive-gift-hamper',
        categoryId: { _id: 'cat_gift', name: 'Festive & Luxury Gift Boxes', slug: 'festive-combos' },
        category: 'Festive & Luxury Gift Boxes',
        description: 'The ultimate royal gift hamper with 4 handcrafted jars: Desi Garlic, Sweet Mango Chunda, Ker Sangri, and Banarasi Lal Mirch.',
        price: 1199,
        compareAtPrice: 1499,
        images: ['https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80'],
        variants: [
          { name: '4 x 350g Deluxe Hamper Box', price: 1199, compareAtPrice: 1499, stockQuantity: 25 },
        ],
        stockQuantity: 25,
        isAvailable: true,
      },
    ],
    coupons: STOREFRONT_DEFAULT_COUPONS,
  };

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/store/${slug}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data.success && data.data) {
          setStoreData(data.data);
          setError(null);
        } else {
          setStoreData(DEFAULT_FALLBACK_STORE);
          setError(null);
        }
      } catch (err) {
        console.warn('Live store API fallback:', err.message);
        setStoreData(DEFAULT_FALLBACK_STORE);
        setError(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [slug]);

  const addToCart = (product, selectedVariant = null, openDrawer = false, qty = 1) => {
    setCart((prev) => {
      const variantName = selectedVariant ? selectedVariant.name : (product.jars?.find(j => j.enabled !== false)?.name || product.variants?.[0]?.name || product.variant || '500g Jar');
      const variantId = (selectedVariant?._id && typeof selectedVariant._id === 'string' && selectedVariant._id.length === 24) ? selectedVariant._id : null;
      const prodId = product._id || product.id || product.name;

      const existingIndex = prev.findIndex(
        (item) => item.productId === prodId && item.variantName === variantName
      );

      const rawPrice = selectedVariant ? selectedVariant.price : product.price;
      const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 299;

      // Robust image resolution checking img, image, images array, or authentic default
      const productImage =
        product.img ||
        product.image ||
        (Array.isArray(product.images) && product.images.length > 0 && product.images[0] ? product.images[0] : null) ||
        'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80';

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: prodId,
            variantId,
            name: product.name,
            variantName,
            price,
            quantity: qty,
            image: productImage,
          },
        ];
      }
    });

    if (openDrawer) {
      setCheckoutStep('CART');
      setIsCartOpen(true);
    }
  };

  const updateProductQuantity = (product, selectedVariant = null, delta = 1) => {
    const variantName = selectedVariant ? selectedVariant.name : (product.jars?.find(j => j.enabled !== false)?.name || product.variants?.[0]?.name || product.variant || '500g Jar');
    const prodId = product._id || product.id || product.name;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === prodId && item.variantName === variantName
      );

      if (existingIndex > -1) {
        const newQty = prev[existingIndex].quantity + delta;
        if (newQty <= 0) {
          return prev.filter((_, i) => i !== existingIndex);
        }
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      } else if (delta > 0) {
        const variantId = (selectedVariant?._id && typeof selectedVariant._id === 'string' && selectedVariant._id.length === 24) ? selectedVariant._id : null;
        const rawPrice = selectedVariant ? selectedVariant.price : product.price;
        const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 299;
        const productImage =
          product.img ||
          product.image ||
          (Array.isArray(product.images) && product.images.length > 0 && product.images[0] ? product.images[0] : null) ||
          'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80';

        return [
          ...prev,
          {
            productId: prodId,
            variantId,
            name: product.name,
            variantName,
            price,
            quantity: 1,
            image: productImage,
          },
        ];
      }
      return prev;
    });
  };

  const updateQuantity = (index, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Live Coupon Discount Calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.minOrderValue && cartSubtotal < appliedCoupon.minOrderValue) {
      discountAmount = 0;
    } else {
      if (appliedCoupon.discountType === 'PERCENTAGE') {
        const pctDiscount = Math.round((cartSubtotal * (Number(appliedCoupon.discountValue) || 0)) / 100);
        discountAmount = appliedCoupon.maxDiscount ? Math.min(pctDiscount, Number(appliedCoupon.maxDiscount)) : pctDiscount;
      } else {
        discountAmount = Math.min(cartSubtotal, Number(appliedCoupon.discountValue) || 0);
      }
    }
  }

  const discountedSubtotal = Math.max(0, cartSubtotal - discountAmount);
  const freeShippingThreshold = 499;
  const isFreeShipping = discountedSubtotal >= freeShippingThreshold;
  const shippingFee = cart.length === 0 ? 0 : isFreeShipping ? 0 : 50;
  const totalAmount = cart.length === 0 ? 0 : discountedSubtotal + shippingFee;

  const handleApplyCoupon = (codeToApply) => {
    setCouponError('');
    setCouponSuccess('');
    const code = (codeToApply || couponCodeInput || '').trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const availableCoupons = storeData?.coupons?.length > 0 ? storeData.coupons : STOREFRONT_DEFAULT_COUPONS;
    const found = availableCoupons.find(
      (c) => c.code?.toUpperCase() === code && c.isActive !== false
    );

    if (!found) {
      setCouponError(`Coupon "${code}" is invalid or expired.`);
      return;
    }

    if (found.minOrderValue && cartSubtotal < found.minOrderValue) {
      setCouponError(`Min order value for ${code} is ₹${found.minOrderValue}. Add items worth ₹${found.minOrderValue - cartSubtotal} more!`);
      return;
    }

    setAppliedCoupon(found);
    setCouponCodeInput(found.code);
    const savedAmount = found.discountType === 'PERCENTAGE'
      ? (found.maxDiscount ? Math.min(Math.round((cartSubtotal * found.discountValue) / 100), found.maxDiscount) : Math.round((cartSubtotal * found.discountValue) / 100))
      : Math.min(cartSubtotal, found.discountValue || 0);
    setCouponSuccess(`Coupon ${found.code} applied! Saved ₹${savedAmount}.`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
    setCouponSuccess('');
  };

  // Exit-Intent Listener
  useEffect(() => {
    const handleMouseLeave = (e) => {
      if (e.clientY <= 10 && !hasTriggeredExit && !couponClaimed) {
        setIsExitPopupOpen(true);
        setHasTriggeredExit(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasTriggeredExit, couponClaimed]);

  const handleDirectBuy = (product, selectedVariant = null, qty = 1) => {
    const variantName = selectedVariant ? selectedVariant.name : (product.jars?.find(j => j.enabled !== false)?.name || product.variants?.[0]?.name || product.variant || '500g Jar');
    const prodId = product._id || product.id || product.name;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === prodId && item.variantName === variantName
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.max(updated[existingIndex].quantity, qty),
        };
        return updated;
      } else {
        const variantId = (selectedVariant?._id && typeof selectedVariant._id === 'string' && selectedVariant._id.length === 24) ? selectedVariant._id : null;
        const rawPrice = selectedVariant ? selectedVariant.price : product.price;
        const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 299;
        const productImage =
          product.img ||
          product.image ||
          (Array.isArray(product.images) && product.images.length > 0 && product.images[0] ? product.images[0] : null) ||
          'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80';

        return [
          ...prev,
          {
            productId: prodId,
            variantId,
            name: product.name,
            variantName,
            price,
            quantity: qty,
            image: productImage,
          },
        ];
      }
    });

    setCheckoutStep('CHECKOUT');
    setIsCartOpen(true);
  };

  const handleDirectWhatsApp = (product, selectedVariant = null, qty = 1) => {
    const rawPrice = selectedVariant ? selectedVariant.price : product.price;
    const unitPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 299;
    const totalPrice = unitPrice * qty;
    const variantName = selectedVariant ? selectedVariant.name : (product.jars?.find(j => j.enabled !== false)?.name || product.variants?.[0]?.name || product.variant || '500g Jar');
    const rawPhone = storeData?.store?.phone || storeData?.store?.contact?.phone || '9876543210';
    const tenantPhone = rawPhone.replace(/\D/g, '').slice(-10) || '9876543210';
    const storeTitle = storeData?.store?.businessName || storeData?.store?.name || 'Desi Rasoi Achar';

    const qtyText = qty > 1 ? `${qty}x ` : '';
    const text = encodeURIComponent(
      `Hello! I would like to order *${qtyText}${product.name}* (${variantName}) for *₹${totalPrice}* from ${storeTitle}. Please share delivery & COD details!`
    );
    const waUrl = `https://wa.me/91${tenantPhone}?text=${text}`;

    // Asynchronously log lead capture without blocking user
    try {
      fetch(`/api/public/store/${slug}/inquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'WhatsApp Store Visitor',
          phone: tenantPhone,
          productName: `${qtyText}${product.name} (${variantName})`,
          productPrice: totalPrice,
          productId: product._id || product.id,
          source: 'WHATSAPP_DIRECT_CLICK',
          utmSource: searchParams.get('utm_source') || '',
          utmCampaign: searchParams.get('utm_campaign') || '',
        }),
      }).catch(() => {});
    } catch (e) {
      // ignore background error
    }

    window.open(waUrl, '_blank');
  };

  const handleTopWhatsAppOrder = () => {
    const rawPhone = storeData?.store?.phone || storeData?.store?.contact?.phone || store.phone || '9876543210';
    const tenantPhone = rawPhone.replace(/\D/g, '').slice(-10) || '9876543210';
    const storeTitle = storeData?.store?.businessName || storeData?.store?.name || store.businessName || 'Online Store';

    let text = '';
    if (cart.length > 0) {
      const itemsList = cart.map((item, idx) => `${idx + 1}. ${item.quantity}x ${item.name} (${item.variantName || 'Standard'}) - ₹${item.price * item.quantity}`).join('\n');
      const couponLine = appliedCoupon ? `\n🎟️ Coupon Applied: *${appliedCoupon.code}* (-₹${discountAmount})` : '';
      text = encodeURIComponent(
        `Hello ${storeTitle}! I would like to order the following items via WhatsApp:\n\n${itemsList}${couponLine}\n\n*Total Amount: ₹${totalAmount}*\n\nPlease confirm availability & Cash on Delivery (COD) dispatch!`
      );
    } else {
      text = encodeURIComponent(
        `Hello ${storeTitle}! I am browsing your online store and would like to order directly via WhatsApp. Please share your catalog & current offers!`
      );
    }

    const waUrl = `https://wa.me/91${tenantPhone}?text=${text}`;

    try {
      fetch(`/api/public/store/${slug}/inquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'WhatsApp Store Visitor',
          phone: tenantPhone,
          productName: cart.length > 0 ? cart.map(i => `${i.quantity}x ${i.name}`).join(', ') : 'Direct Store Inquiry',
          productPrice: totalAmount || 0,
          source: 'WHATSAPP_TOP_BUTTON',
          utmSource: searchParams.get('utm_source') || '',
          utmCampaign: searchParams.get('utm_campaign') || '',
        }),
      }).catch(() => {});
    } catch (e) {}

    window.open(waUrl, '_blank');
  };

  const handleClaimCoupon = async (e) => {
    e.preventDefault();
    const cleanPhone = (exitPhone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      alert('⚠️ Invalid Mobile Number! Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    try {
      await fetch(`/api/public/store/${slug}/inquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: exitName || 'Exit Discount Visitor',
          phone: cleanPhone,
          productName: 'Claimed ₹100 / 10% Discount Coupon',
          source: 'EXIT_POPUP',
        }),
      });
      setCouponClaimed(true);
    } catch (err) {
      setCouponClaimed(true);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cart || cart.length === 0) {
      alert('⚠️ Your cart is empty! Please add a product before placing an order.');
      return;
    }

    if (!customerName?.trim() || !customerPhone || !street?.trim() || !city?.trim() || !pincode) {
      alert('⚠️ Please fill all required fields: Full Name, Mobile Number, Complete Address, City, and Pincode.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      alert('⚠️ Invalid Mobile Number! Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
      return;
    }

    const cleanPincode = pincode.replace(/\D/g, '');
    if (cleanPincode.length !== 6 || !/^[1-9][0-9]{5}$/.test(cleanPincode)) {
      alert('⚠️ Invalid PIN Code! Please enter a valid 6-digit Indian postal PIN code (e.g. 110001, 302001).');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/public/store/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          customerEmail,
          shippingAddress: {
            street: street.trim(),
            city: city.trim(),
            state,
            pincode: cleanPincode,
          },
          items: cart,
          paymentMethod,
          notes,
          attribution,
          couponCode: appliedCoupon?.code || null,
          discount: discountAmount || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPlacedOrder(data.data);
        setCheckoutStep('SUCCESS');
        setCart([]);
        try {
          const existing = JSON.parse(localStorage.getItem('omniva_live_orders') || '[]');
          const updated = [data.data, ...existing.filter((o) => o.orderNumber !== data.data.orderNumber)];
          localStorage.setItem('omniva_live_orders', JSON.stringify(updated.slice(0, 50)));
        } catch (e) {}
      } else {
        alert(data.message || 'Failed to place order');
      }
    } catch (err) {
      alert(err.message || 'Error processing order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] text-slate-800 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-sm">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (error || !storeData) {
    return (
      <div className="min-h-screen bg-[#fafaf9] text-slate-800 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-white">Storefront Unavailable</h2>
        <p className="text-slate-400 text-sm mt-1 max-w-md">{error || 'Store not found'}</p>
        <Link to="/" className="mt-4 px-4 py-2 bg-indigo-600 rounded-xl text-xs font-semibold">
          Return to Omniva Home
        </Link>
      </div>
    );
  }

  const { store, categories, products } = storeData;
  const filteredProducts = products.filter((p) => {
    // 1. Category Filter
    const matchesCategory =
      selectedCategory === 'ALL' ||
      String(p.categoryId?._id) === String(selectedCategory) ||
      (p.categoryId?.slug && p.categoryId.slug === String(selectedCategory)) ||
      (p.categoryId?.name && p.categoryId.name === String(selectedCategory)) ||
      (p.category && p.category === String(selectedCategory));

    if (!matchesCategory) return false;

    // 2. Search Query Filter
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const descMatch = (p.description || '').toLowerCase().includes(q);
      const catMatch = (p.category || p.categoryId?.name || '').toLowerCase().includes(q);
      const variantMatch = (p.variants || p.jars || []).some(
        (v) => (v.name || '').toLowerCase().includes(q)
      );
      return nameMatch || descMatch || catMatch || variantMatch;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white pb-24">
      {/* Top Banner / Trust Bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white border-b border-emerald-600/40 py-1.5 px-3 sm:px-4 text-xs font-medium shadow-xs">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-2 text-[11px] sm:text-xs">
          <div className="flex items-center gap-3 truncate">
            <span className="flex items-center gap-1.5 font-bold text-white truncate">
              <Truck className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              <span className="truncate">Free Express Delivery &gt; ₹499</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> 100% Secure Checkout &amp; COD
            </span>
            <span className="hidden lg:flex items-center gap-1.5 text-amber-300 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> 4.9/5 Rated (2,400+ Reviews)
            </span>
          </div>

          {/* Top Bar Direct WhatsApp Link */}
          <button
            type="button"
            onClick={handleTopWhatsAppOrder}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold transition cursor-pointer backdrop-blur-xs border border-white/25 active:scale-95 text-[10px] sm:text-[11px] shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
            <MessageCircle className="w-3 h-3 text-white fill-white/20" />
            <span className="hidden sm:inline">WhatsApp:</span>
            <span>+91 {store.phone ? store.phone.replace(/[^0-9]/g, '').slice(-10) : 'Available'} ↗</span>
          </button>
        </div>
      </div>

      {/* Main Header - Clean Mobile & Desktop Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30 border border-indigo-500/30 shrink-0">
            <Store className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg tracking-tight flex items-center gap-1.5 truncate">
              <span className="truncate">{store.businessName}</span>
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 shrink-0">
                Verified
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
              <span className="hidden xs:inline">Authentic Homemade Store</span>
              <span className="hidden xs:inline w-1 h-1 rounded-full bg-slate-300"></span>
              <Link to="/orders/track" className="text-indigo-600 hover:text-indigo-700 hover:underline font-semibold flex items-center gap-1 shrink-0">
                <Truck className="w-3 h-3" />
                <span>Track Order</span>
              </Link>
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Order on WhatsApp */}
          <button
            type="button"
            onClick={handleTopWhatsAppOrder}
            className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 border border-emerald-400/40"
            title="Order directly on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-white/20 shrink-0" />
            <span className="hidden md:inline font-extrabold">Order on </span>
            <span className="font-extrabold text-xs">WhatsApp</span>
          </button>

          {/* Cart Button */}
          <button
            type="button"
            onClick={() => {
              setCheckoutStep('CART');
              setIsCartOpen(true);
            }}
            className="relative px-3 py-1.5 sm:px-3.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {cart.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white text-indigo-900 text-[10px] font-black">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Modern Live Search Bar */}
      <div className="max-w-6xl mx-auto px-4 pt-3 pb-1 w-full">
        <div className="relative flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-400 focus-within:border-indigo-600 focus-within:ring-3 focus-within:ring-indigo-100 transition-all">
          <div className="pl-3.5 pr-2 text-slate-400 pointer-events-none flex items-center">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fresh pickles, jars, spices... (e.g. Aam, Lal Mirch, Garlic)"
            className="w-full py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1.5 mr-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {searchQuery && (
            <span className="hidden sm:inline-flex mr-3 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 shrink-0">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>

        {/* Live Search Active Feedback Tag */}
        {searchQuery && (
          <div className="flex items-center justify-between mt-2 px-1 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span>Searching for</span>
              <strong className="text-slate-900 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 font-semibold">
                "{searchQuery}"
              </strong>
              <span>({filteredProducts.length} items)</span>
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-indigo-600 hover:underline font-semibold cursor-pointer text-[11px]"
            >
              Reset filter
            </button>
          </div>
        )}
      </div>

      {/* Hero Banner */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2 w-full">
        <div className="bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 border border-amber-200/80 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xs">
          <div className="relative z-10 max-w-xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Traditional Sun-Dried Recipe
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Handcrafted Pickles &amp; Pure Flavors
            </h2>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
              Made with cold-pressed mustard oil, whole aromatic spices, and sun-matured perfection. Delivered fresh to your doorstep across India.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Category Showcase Bar */}
      {categories.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-4 w-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Browse by Category
            </h2>
            <span className="text-xs text-slate-500 font-medium">{categories.length} Categories</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {/* All Items Card */}
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`flex items-center gap-3 p-2.5 pr-4 rounded-2xl border transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-600/20 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-slate-900 shadow-xs'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-300 text-xs shadow-inner">
                ALL
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">All Delights</div>
                <div className="text-[10px] text-slate-400">{products.length} Products</div>
              </div>
            </button>

            {categories.map((c) => {
              const catProdCount = products.filter((p) => {
                const pCatId = p.categoryId?._id ? String(p.categoryId._id) : (p.categoryId ? String(p.categoryId) : '');
                const pCatSlug = p.categoryId?.slug || p.categorySlug || '';
                const pCatName = p.categoryId?.name || p.category || '';
                return (
                  pCatId === String(c._id) ||
                  (pCatSlug && pCatSlug === String(c.slug)) ||
                  (pCatName && pCatName === String(c.name))
                );
              }).length;
              const catImage =
                c.image ||
                'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80';
              const isSelected = selectedCategory === c._id || selectedCategory === c.slug || selectedCategory === c.name;
              return (
                <button
                  key={c._id || c.slug}
                  onClick={() => setSelectedCategory(isSelected ? 'ALL' : (c.slug || c._id))}
                  className={`flex items-center gap-3 p-2 pr-4 rounded-2xl border transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-600/20 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-slate-900 shadow-xs'
                  }`}
                >
                  <img
                    src={catImage}
                    alt={c.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80';
                    }}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                  />
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900">{c.name}</div>
                    <div className="text-[10px] text-slate-400">{catProdCount} Products</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Product & Service Catalog Grid */}
      <main className="max-w-6xl mx-auto px-4 py-4 w-full space-y-8">
        {/* Service & Shoot Packages (if any) */}
        {storeData.packages && storeData.packages.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" /> Service &amp; Shoot Packages
              </h3>
              <p className="text-xs text-slate-400">Select a package to check dates and reserve your slot.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {storeData.packages.map((pkg) => {
                const pkgCover =
                  pkg.images?.[0] ||
                  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&auto=format&fit=crop&q=80';
                return (
                  <div
                    key={pkg._id}
                    className="bg-white border border-slate-200/90 hover:border-indigo-400 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-lg transition group"
                  >
                    <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
                      <img
                        src={pkgCover}
                        alt={pkg.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&auto=format&fit=crop&q=80';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-indigo-500/30">
                          {pkg.category}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] text-slate-200 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-400" /> {pkg.duration}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <h4 className="font-bold text-white text-base group-hover:text-indigo-300 transition">
                          {pkg.name}
                        </h4>
                        {pkg.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {pkg.description}
                          </p>
                        )}
                        {pkg.deliverables?.length > 0 && (
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[11px] space-y-1.5">
                            <div className="text-[10px] text-slate-400 font-semibold uppercase">
                              Included Deliverables:
                            </div>
                            {pkg.deliverables.map((d, i) => (
                              <div key={i} className="text-slate-600 flex items-center gap-1.5">
                                <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>{d}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-lg font-black text-slate-900">₹{pkg.price}</div>
                          <div className="text-[10px] text-emerald-400 font-medium">
                            {pkg.advanceTokenPercent}% Token (₹{Math.round((pkg.price * pkg.advanceTokenPercent) / 100)})
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPkg(pkg);
                            setPlacedBooking(null);
                            setIsBookingOpen(true);
                          }}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Book Dates
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Physical Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                <span>Handcrafted Pickle Collection</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">{filteredProducts.length} items found</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod._id}
                  product={prod}
                  cart={cart}
                  onAddToCart={addToCart}
                  onUpdateQty={updateProductQuantity}
                  onOpenCart={() => {
                    setCheckoutStep('CART');
                    setIsCartOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 sm:py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto">
              <Search className="w-7 h-7 text-indigo-600" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">No matching pickles found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {searchQuery
                ? `We couldn't find any items matching "${searchQuery}". Try searching for mango, mirch, amla or reset your search.`
                : 'No products found in this category. Try selecting "All Delights".'}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                >
                  Clear Search
                </button>
              )}
              {selectedCategory !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
                >
                  Show All Delights
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* High-Visibility Floating WhatsApp Action Button (FAB) */}
      {!isCartOpen && (
        <aside
          className={`fixed z-40 right-4 sm:right-6 transition-all duration-300 ${
            cart.length > 0 ? 'bottom-20 sm:bottom-6' : 'bottom-6'
          }`}
        >
          <button
            type="button"
            onClick={handleTopWhatsAppOrder}
            className="group flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-full shadow-2xl shadow-emerald-700/40 border-2 border-emerald-300/80 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            title="Order or Inquire Directly on WhatsApp"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <MessageCircle className="w-5 h-5 fill-white/20 text-white shrink-0 group-hover:rotate-12 transition-transform" />
            <div className="text-left flex flex-col">
              <span className="text-xs sm:text-sm font-extrabold tracking-tight leading-none whitespace-nowrap">
                {cart.length > 0
                  ? `Order on WhatsApp (${cart.reduce((s, i) => s + i.quantity, 0)})`
                  : 'Order on WhatsApp'}
              </span>
              <span className="text-[10px] text-emerald-100 font-medium leading-none mt-1">
                {cart.length > 0 ? `Total: ₹${totalAmount} • Instant Dispatch` : 'Direct Customer Support'}
              </span>
            </div>
            {cart.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-white text-emerald-800 text-[11px] font-black shadow-xs">
                ₹{totalAmount}
              </span>
            )}
          </button>
        </aside>
      )}

      {/* Floating Bottom Cart Bar (Mobile Sticky) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            onClick={() => {
              setCheckoutStep('CART');
              setIsCartOpen(true);
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3.5 rounded-2xl shadow-2xl shadow-indigo-600/40 flex items-center justify-between font-bold text-sm transition transform active:scale-95"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>{cart.reduce((s, i) => s + i.quantity, 0)} items in Cart</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>₹{totalAmount}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Slide-over Cart & Checkout Drawer - Full Width Mobile Responsive */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex justify-end">
          {/* Backdrop click to dismiss on desktop */}
          <div className="hidden sm:block absolute inset-0 -z-10" onClick={() => setIsCartOpen(false)} />

          <div className="w-full sm:max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl relative">
            {/* 1. FIXED DRAWER HEADER */}
            <header className="shrink-0 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
              {checkoutStep === 'CART' && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">Your Cart</h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {cart.reduce((s, i) => s + i.quantity, 0)} {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'items'} in order
                    </p>
                  </div>
                </div>
              )}

              {checkoutStep === 'CHECKOUT' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('CART')}
                    className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1 text-xs font-bold active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <div className="h-4 w-px bg-slate-200 mx-0.5" />
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Express Checkout</h3>
                </div>
              )}

              {checkoutStep === 'SUCCESS' && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Order Placed!</h3>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer active:scale-95 border border-slate-200"
                title="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            {/* 2. SCROLLABLE DRAWER BODY */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5 space-y-4 overscroll-contain">
              {checkoutStep === 'CART' && (
                <div className="space-y-4">
                  {/* Free shipping banner */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs shadow-2xs">
                    {isFreeShipping ? (
                      <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Congratulations! You unlocked FREE Delivery.</span>
                      </div>
                    ) : (
                      <div className="text-slate-600 text-xs">
                        Add <strong className="text-amber-600 font-bold">₹{freeShippingThreshold - cartSubtotal}</strong> more to get <span className="text-emerald-700 font-bold">FREE Delivery</span>!
                      </div>
                    )}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(100, (cartSubtotal / freeShippingThreshold) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Cart Items List */}
                  {cart.length === 0 ? (
                    <div className="py-14 text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-400 flex items-center justify-center mx-auto">
                        <ShoppingBag className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">Your cart is currently empty</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        Add pure handcrafted pickles to your cart to enjoy traditional homemade taste!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-xs">
                      {cart.map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200 flex items-center justify-between gap-2.5 hover:border-slate-300 transition shadow-2xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={item.image || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200&auto=format&fit=crop&q=80'}
                              alt={item.name}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200&auto=format&fit=crop&q=80';
                              }}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0 bg-white"
                            />
                            <div className="min-w-0 space-y-0.5">
                              <div className="font-bold text-slate-900 text-xs truncate max-w-[150px] sm:max-w-[170px]" title={item.name}>
                                {item.name}
                              </div>
                              {item.variantName && (
                                <div className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <span>🏺</span>
                                  <span className="truncate">{item.variantName}</span>
                                </div>
                              )}
                              <div className="text-[11px] text-slate-500 font-medium">₹{item.price} each</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(idx, -1)}
                                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer transition active:scale-90"
                                title={item.quantity === 1 ? 'Remove from cart' : 'Decrease'}
                              >
                                {item.quantity === 1 ? (
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                ) : (
                                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                                )}
                              </button>
                              <span className="w-6 text-center font-black text-slate-900 text-xs">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(idx, 1)}
                                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer transition active:scale-90"
                                title="Increase"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>

                            <div className="text-right min-w-[50px]">
                              <div className="font-black text-emerald-600 text-xs">
                                ₹{item.price * item.quantity}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(idx)}
                                className="text-[10px] text-rose-500 hover:text-rose-700 underline cursor-pointer mt-0.5 inline-block font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Coupons & Promo Offers in Cart */}
                  {cart.length > 0 && (
                    <div className="bg-gradient-to-br from-amber-50/70 via-indigo-50/40 to-emerald-50/40 rounded-2xl p-3.5 border border-amber-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                          <Ticket className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Coupons &amp; Offers</span>
                        </span>
                        {appliedCoupon && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            Active: {appliedCoupon.code}
                          </span>
                        )}
                      </div>

                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              %
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5 truncate">
                                <span>{appliedCoupon.code}</span>
                                <span className="text-[10px] font-medium text-emerald-700 truncate">({appliedCoupon.title})</span>
                              </div>
                              <div className="text-[11px] text-emerald-700 font-semibold">
                                You save ₹{discountAmount} on this order!
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-white px-2.5 py-1 rounded-lg border border-rose-200 hover:border-rose-300 shadow-xs cursor-pointer active:scale-95 shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={couponCodeInput}
                              onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleApplyCoupon();
                                }
                              }}
                              placeholder="Enter coupon (e.g. DESI15)"
                              className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold uppercase placeholder:normal-case placeholder:font-normal focus:border-indigo-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleApplyCoupon()}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                            >
                              Apply
                            </button>
                          </div>

                          {couponError && (
                            <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{couponError}</span>
                            </p>
                          )}
                          {couponSuccess && (
                            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 shrink-0" />
                              <span>{couponSuccess}</span>
                            </p>
                          )}

                          {/* Live Available Store Deals Chips */}
                          {((storeData?.coupons?.length > 0 ? storeData.coupons : STOREFRONT_DEFAULT_COUPONS)).length > 0 && (
                            <div className="pt-1.5 border-t border-slate-200/70">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>Tap to Apply Discount:</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {(storeData?.coupons?.length > 0 ? storeData.coupons : STOREFRONT_DEFAULT_COUPONS).filter(c => c.isActive !== false).map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => handleApplyCoupon(c.code)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-dashed border-indigo-300 text-indigo-700 text-[11px] font-bold transition cursor-pointer hover:border-indigo-500 active:scale-95 shadow-2xs"
                                    title={c.description}
                                  >
                                    <Tag className="w-3 h-3 text-indigo-500" />
                                    <span>{c.code}</span>
                                    <span className="text-[10px] text-emerald-600 font-extrabold ml-0.5">
                                      ({c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`})
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Price breakdown */}
                  {cart.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items):</span>
                        <span className="text-slate-900 font-medium">₹{cartSubtotal}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span className="flex items-center gap-1">
                            <Ticket className="w-3.5 h-3.5" />
                            <span>Coupon Discount ({appliedCoupon?.code}):</span>
                          </span>
                          <span>-₹{discountAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600">
                        <span>Delivery Fee:</span>
                        <span className={isFreeShipping ? 'text-emerald-600 font-bold' : 'text-slate-900 font-bold'}>
                          {isFreeShipping ? 'FREE' : `₹${shippingFee}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                        <span>Total Payable:</span>
                        <span className="text-emerald-600">₹{totalAmount}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {checkoutStep === 'CHECKOUT' && (
                <form id="storefront-checkout-form" onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
                  {/* Order Summary Preview Card in Checkout */}
                  {cart.length > 0 && (
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-200">
                        <span>Order Items ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                        <button
                          type="button"
                          onClick={() => setCheckoutStep('CART')}
                          className="text-indigo-600 hover:underline capitalize font-semibold cursor-pointer"
                        >
                          Edit Items
                        </button>
                      </div>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1 divide-y divide-slate-100">
                        {cart.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs pt-1.5 first:pt-0">
                            <div className="min-w-0 pr-2">
                              <div className="font-semibold text-slate-900 truncate max-w-[160px]" title={item.name}>
                                {item.name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {item.variantName && (
                                  <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-medium truncate">
                                    {item.variantName}
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-500">x{item.quantity}</span>
                              </div>
                            </div>
                            <span className="font-bold text-slate-900 shrink-0">
                              ₹{item.price * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200 text-emerald-600 font-bold">
                          <span>Discount ({appliedCoupon?.code || 'Coupon'}):</span>
                          <span>-₹{discountAmount}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
                        <span className="text-slate-500">Delivery:</span>
                        <span className={isFreeShipping ? 'text-emerald-600 font-bold' : 'text-slate-900 font-bold'}>
                          {isFreeShipping ? 'FREE' : `₹${shippingFee}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-black text-slate-900 pt-1 border-t border-slate-200">
                        <span>Total Amount:</span>
                        <span className="text-emerald-600 text-sm">₹{totalAmount}</span>
                      </div>
                    </div>
                  )}

                  {/* Customer Information Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-700 block mb-1 font-semibold">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aarav Sharma"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-semibold">10-Digit Mobile Number *</label>
                        <span className="text-[10px] text-slate-400 font-medium">Starts with 6-9</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs flex items-center shrink-0">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          placeholder="9876543210"
                          maxLength={10}
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-700 block mb-1 font-semibold">Complete Delivery Address *</label>
                      <input
                        type="text"
                        required
                        placeholder="House/Flat No, Street, Landmark"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-700 block mb-1 font-semibold">City *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Noida / Delhi"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-700 font-semibold">Pincode *</label>
                          <span className="text-[10px] text-slate-400 font-medium">6 Digits</span>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 110001"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Payment Mode Selector */}
                    <div className="pt-1">
                      <label className="text-slate-700 block mb-1.5 font-semibold">
                        Payment Mode
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('COD')}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            paymentMethod === 'COD'
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 font-bold shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-900">Cash on Delivery</div>
                          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Pay upon delivery</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('ONLINE')}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            paymentMethod === 'ONLINE'
                              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900 font-bold shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-900">UPI / Online Pay</div>
                          <div className="text-[10px] text-indigo-600 mt-0.5 font-medium">GooglePay, PhonePe</div>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {checkoutStep === 'SUCCESS' && placedOrder && (
                <div className="py-4 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">Order Confirmed!</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Thank you, {customerName}! Your order has been placed and received by {store.businessName}.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 shadow-2xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Order Number:</span>
                      <span className="font-mono font-bold text-indigo-600">
                        {placedOrder.orderNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Amount:</span>
                      <span className="font-bold text-emerald-600">₹{placedOrder.totalAmount}</span>
                    </div>
                    {placedOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span className="flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Discount ({placedOrder.couponCode || 'Promo'}):</span>
                        </span>
                        <span>-₹{placedOrder.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Mode:</span>
                      <span className="text-slate-900 font-semibold">{placedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500">Shipping To:</span>
                      <span className="text-slate-900 font-medium text-right max-w-[180px] truncate">
                        {street}, {city} - {pincode}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. FIXED STICKY ACTION FOOTER */}
            <footer className="shrink-0 p-4 border-t border-slate-200 bg-white/95 backdrop-blur-xs shadow-lg space-y-2">
              {checkoutStep === 'CART' && (
                <>
                  {cart.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-slate-500 font-medium">To Pay:</span>
                        <div className="text-right">
                          <span className="text-base font-black text-slate-900">₹{totalAmount}</span>
                          {isFreeShipping && (
                            <span className="ml-1.5 text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.2 rounded">
                              FREE Delivery
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCheckoutStep('CHECKOUT')}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                        <span>Proceed to Checkout • ₹{totalAmount}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleTopWhatsAppOrder}
                        className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
                        <span>Order Entire Cart via WhatsApp</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-95"
                    >
                      Explore Delicious Pickles
                    </button>
                  )}
                </>
              )}

              {checkoutStep === 'CHECKOUT' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-slate-500 font-medium">Final Payable:</span>
                    <span className="text-base font-black text-emerald-600">₹{totalAmount}</span>
                  </div>
                  <button
                    type="submit"
                    form="storefront-checkout-form"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Placing Order...</span>
                      </div>
                    ) : (
                      <>
                        <span>Confirm &amp; Place Order (₹{totalAmount})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {checkoutStep === 'SUCCESS' && (
                <div className="space-y-2">
                  <a
                    href={`https://wa.me/91${(storeData?.store?.phone || store.phone || '9876543210').replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                      `Hi! I have placed order ${placedOrder?.orderNumber} for ₹${placedOrder?.totalAmount} on ${store.businessName}. Please share dispatch tracking!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat on WhatsApp for Updates
                  </a>
                  <Link
                    to="/orders/track"
                    onClick={() => {
                      setIsCartOpen(false);
                      setCheckoutStep('CART');
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition flex items-center justify-center gap-2 border border-indigo-200"
                  >
                    <Truck className="w-4 h-4" /> Track Order Status
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      setCheckoutStep('CART');
                    }}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </footer>
          </div>
        </div>
      )}

      {/* Slide-over Service / Shoot Booking Drawer */}
      {isBookingOpen && selectedPkg && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col justify-between overflow-y-auto p-6">
            {!placedBooking ? (
              <form onSubmit={handlePlaceBooking} className="space-y-5 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Book Shoot / Dates</h3>
                    <p className="text-[11px] text-indigo-400 mt-0.5">{selectedPkg.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Package summary card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Package Fee:</span>
                    <span className="font-bold text-slate-900">₹{selectedPkg.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Advance Token Required ({selectedPkg.advanceTokenPercent}%):</span>
                    <span className="font-bold text-emerald-400">
                      ₹{Math.round((selectedPkg.price * selectedPkg.advanceTokenPercent) / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-100">
                    <span>Duration:</span>
                    <span className="text-slate-700 font-semibold">{selectedPkg.duration}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-slate-700 block mb-1 font-semibold">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rohit Verma"
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1 font-semibold">10-Digit Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={bookingPhone}
                      onChange={(e) => setBookingPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1 font-semibold">Email Address</label>
                    <input
                      type="email"
                      placeholder="rohit@example.com"
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-700 block mb-1 font-semibold">Event / Shoot Date *</label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1 font-semibold">Preferred Time Slot</label>
                      <select
                        value={bookingTimeSlot}
                        onChange={(e) => setBookingTimeSlot(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                      >
                        <option value="Morning (08:00 AM - 12:00 PM)">Morning (08 AM - 12 PM)</option>
                        <option value="Afternoon (12:00 PM - 04:00 PM)">Afternoon (12 PM - 04 PM)</option>
                        <option value="Sunset / Evening (04:00 PM - 08:00 PM)">Sunset (04 PM - 08 PM)</option>
                        <option value="Full Day">Full Day</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1 font-semibold">Shoot Venue / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Heritage Fort, Jaipur or Studio"
                      value={bookingLocation}
                      onChange={(e) => setBookingLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1 font-semibold">Specific Requirements / Notes</label>
                    <textarea
                      rows="2"
                      placeholder="Any specific themes, drone requirements, or questions..."
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={isBookingSubmitting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
                  >
                    {isBookingSubmitting ? (
                      'Reserving Dates...'
                    ) : (
                      <>
                        <span>Submit Booking Request</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Dates Requested!</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Thank you, {bookingName}! Your booking request for {placedBooking.packageName} has been received.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Booking Reference:</span>
                    <span className="font-mono font-bold text-indigo-400">{placedBooking.bookingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scheduled Date:</span>
                    <span className="font-semibold text-white">
                      {new Date(placedBooking.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Fee / Advance:</span>
                    <span className="font-bold text-emerald-400">
                      ₹{placedBooking.totalAmount} (Token: ₹{placedBooking.advancePaid})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-amber-400 font-semibold">{placedBooking.bookingStatus}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={`https://wa.me/91${bookingPhone}?text=${encodeURIComponent(
                      `Hi! I have requested booking ${placedBooking.bookingNumber} for ${placedBooking.packageName} on ${store.businessName}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" /> Connect with Studio on WhatsApp
                  </a>
                  <button
                    onClick={() => {
                      setIsBookingOpen(false);
                      setPlacedBooking(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Exit-Intent Discount Coupon Modal */}
      {isExitPopupOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl relative text-center">
            <button
              onClick={() => setIsExitPopupOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 bg-amber-50 rounded-2xl mx-auto flex items-center justify-center text-amber-500 shadow-inner">
              <Gift className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Special One-Time Offer
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">Wait! Get ₹100 Extra OFF</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your WhatsApp number to unlock your secret discount coupon code before you leave!
              </p>
            </div>

            {!couponClaimed ? (
              <form onSubmit={handleClaimCoupon} className="space-y-3 text-xs text-left">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Your Mobile Number</label>
                  <div className="flex gap-2">
                    <span className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold">+91</span>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      maxLength={10}
                      value={exitPhone}
                      onChange={(e) => setExitPhone(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4" /> 🎁 Unlock ₹100 Off Coupon
                </button>
              </form>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-emerald-800">🎉 Coupon Unlocked!</div>
                <div className="bg-white border border-dashed border-emerald-400 py-2 px-4 rounded-xl text-emerald-600 font-black text-base tracking-wider">
                  SAVE100
                </div>
                <p className="text-[11px] text-emerald-700">Use this coupon code at checkout or mention it in WhatsApp chat!</p>
                <button
                  type="button"
                  onClick={() => {
                    handleApplyCoupon('SAVE100');
                    setIsExitPopupOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95 transition"
                >
                  Apply SAVE100 &amp; View Cart
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Product Card with High-Res Image, Badges, Ratings, Variant Selector & Instant-Cart Stepper
const ProductCard = ({ product, cart = [], onAddToCart, onUpdateQty, onOpenCart }) => {
  const rawBasePrice = typeof product.price === 'number' ? product.price : parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 299;

  const availableVariants = (product.jars && product.jars.length > 0)
    ? product.jars.filter(j => j.enabled !== false && j.isAvailable !== false)
    : (product.variants && product.variants.length > 0)
      ? product.variants
      : [
          { name: '250g Glass Jar', price: Math.round(rawBasePrice * 0.65) },
          { name: '500g Traditional Jar', price: rawBasePrice },
          { name: '1kg Family Pack', price: Math.round(rawBasePrice * 1.7) }
        ];

  const [selectedVariant, setSelectedVariant] = useState(availableVariants[0]);
  const currentVariant = selectedVariant || availableVariants[0];

  const price = currentVariant
    ? (typeof currentVariant.price === 'number' ? currentVariant.price : parseFloat(String(currentVariant.price).replace(/[^0-9.]/g, '')) || rawBasePrice)
    : rawBasePrice;

  const compareAt = currentVariant?.compareAtPrice || product.compareAtPrice;
  const discountPercent =
    compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : null;

  const variantName = currentVariant?.name || '500g Jar';
  const prodId = product._id || product.id || product.name;

  // Real-time synchronization with customer cart
  const cartItem = cart.find(
    (item) => item.productId === prodId && item.variantName === variantName
  );
  const cartQty = cartItem ? cartItem.quantity : 0;

  const productImage =
    product.img ||
    product.image ||
    (Array.isArray(product.images) && product.images.length > 0 && product.images[0] ? product.images[0] : null) ||
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="bg-white border border-slate-200/90 hover:border-indigo-400 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-xl group">
      {/* Product Image Container with Badges */}
      <div className="relative w-full h-52 bg-slate-100 overflow-hidden">
        <img
          src={productImage}
          alt={product.name}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/10" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider bg-black/60 backdrop-blur-md border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-400" /> 100% Sun-Dried
          </span>
          {discountPercent && (
            <span className="text-[10px] font-black text-white bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-semibold text-emerald-700 bg-white/90 backdrop-blur-md border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> In Stock
          </span>
        </div>

        {/* Rating & Social Proof */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-400 border border-white/10 shadow">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>4.9</span>
          <span className="text-slate-400 font-normal text-[10px]">(180+ Reviews)</span>
        </div>
      </div>

      {/* Product Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition line-clamp-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Available Jar Variants Selector */}
          {availableVariants?.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <span>🏺</span>
                  <span>Available Jar Sizes:</span>
                </label>
                {currentVariant && (
                  <span className="text-[10px] text-indigo-600 font-bold truncate max-w-[130px]">
                    {currentVariant.name}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {availableVariants.map((v, i) => {
                  const isSelected = currentVariant?.name === v.name;
                  const vPrice = typeof v.price === 'number' ? v.price : parseFloat(String(v.price).replace(/[^0-9.]/g, '')) || rawBasePrice;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(v)}
                      type="button"
                      className={`py-1.5 px-2 rounded-xl text-left border transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm ring-1 ring-indigo-400'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold truncate leading-tight">{v.name}</div>
                      <div className={`text-[10px] font-extrabold ${isSelected ? 'text-indigo-100' : 'text-emerald-600'}`}>
                        ₹{vPrice}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pricing & Interactive Instant-Cart Actions */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          {/* Price Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-900">₹{price}</span>
                {compareAt > price && (
                  <span className="text-xs text-slate-400 line-through">₹{compareAt}</span>
                )}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span>✓</span> Inclusive of all taxes
              </span>
            </div>

            {cartQty > 0 && (
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>₹{price * cartQty} in Cart</span>
              </span>
            )}
          </div>

          {/* Action CTAs: Permanent Quantity Stepper & Add to Cart / View Cart */}
          <div className="w-full flex items-center gap-2">
            {/* Quantity Stepper: ALWAYS VISIBLE ON CARD */}
            <div
              className={`flex items-center justify-between border rounded-xl p-1 w-28 sm:w-32 transition shrink-0 ${
                cartQty > 0
                  ? 'bg-indigo-50 border-indigo-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (cartQty > 0) {
                    onUpdateQty(product, currentVariant, -1);
                  }
                }}
                disabled={cartQty === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
                  cartQty === 0
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-indigo-700 hover:bg-indigo-100 cursor-pointer active:scale-90'
                }`}
                title="Decrease Quantity"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <div className="text-center px-1">
                <span
                  className={`font-black text-sm block leading-none ${
                    cartQty > 0 ? 'text-indigo-950' : 'text-slate-700'
                  }`}
                >
                  {cartQty > 0 ? cartQty : 1}
                </span>
                <span
                  className={`text-[9px] font-bold block mt-0.5 leading-none ${
                    cartQty > 0 ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                >
                  {cartQty > 0 ? 'in Cart' : 'Qty'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (cartQty > 0) {
                    onUpdateQty(product, currentVariant, 1);
                  } else {
                    // Instantly adds to cart on quantity increase
                    onAddToCart(product, currentVariant, false, 1);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer transition active:scale-90"
                title="Increase Quantity"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Action Button: Add to Cart or View Cart */}
            {cartQty > 0 ? (
              <button
                type="button"
                onClick={onOpenCart}
                className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                title="Open Cart to Complete Direct Order"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">View Cart</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onAddToCart(product, currentVariant, false, 1)}
                className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                title="Add Item to Cart"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="truncate">Add to Cart</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
