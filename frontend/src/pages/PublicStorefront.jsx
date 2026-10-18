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
  MessageCircle
} from 'lucide-react';

export const PublicStorefront = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();

  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Cart state
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('CART'); // 'CART' | 'CHECKOUT' | 'SUCCESS'
  const [placedOrder, setPlacedOrder] = useState(null);

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
      { _id: 'cat_mango', name: 'Mango Pickles (Aam ka Achar)' },
      { _id: 'cat_garlic', name: 'Garlic Pickles (Lahsun ka Achar)' },
      { _id: 'cat_chilli', name: 'Chilli Pickles (Mirchi ka Achar)' },
      { _id: 'cat_mix', name: 'Mixed Veg Pickles (Mix Achar)' },
      { _id: 'cat_sweet', name: 'Sweet Chutney & Murabba' }
    ],
    products: [
      {
        _id: 'prod_mango_special',
        name: 'Rajasthani Keri Ka Achar (Traditional Mango Pickle)',
        category: 'Mango Pickles (Aam ka Achar)',
        categoryId: 'cat_mango',
        price: 320,
        comparePrice: 399,
        rating: 4.9,
        reviewsCount: 382,
        stock: 120,
        badge: 'Bestseller',
        isBestSeller: true,
        image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
        description: 'Authentic Marwadi style sun-dried raw mango pickle aged in cold-pressed mustard oil with whole fenugreek, fennel, nigella seeds and rock salt.',
        jars: [
          { name: '250g Glass Jar', weight: '250g', price: 180, enabled: true },
          { name: '500g Glass Jar', weight: '500g', price: 320, enabled: true },
          { name: '1kg Bulk Pack', weight: '1kg', price: 590, enabled: true }
        ]
      },
      {
        _id: 'prod_garlic_spicy',
        name: 'Spicy Desi Garlic Pickle (Lahsun Ka Achar)',
        category: 'Garlic Pickles (Lahsun ka Achar)',
        categoryId: 'cat_garlic',
        price: 340,
        comparePrice: 420,
        rating: 4.8,
        reviewsCount: 219,
        stock: 85,
        badge: 'Immunity Booster',
        image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=800&auto=format&fit=crop&q=80',
        description: 'Whole peeled garlic cloves infused in spicy red chilli flakes, crushed mustard seeds, and ginger extracts.',
        jars: [
          { name: '250g Glass Jar', weight: '250g', price: 195, enabled: true },
          { name: '500g Glass Jar', weight: '500g', price: 340, enabled: true },
          { name: '1kg Bulk Pack', weight: '1kg', price: 620, enabled: true }
        ]
      },
      {
        _id: 'prod_green_chilli',
        name: 'Stuffed Red & Green Chilli Pickle (Bharwa Mirch Achar)',
        category: 'Chilli Pickles (Mirchi ka Achar)',
        categoryId: 'cat_chilli',
        price: 290,
        comparePrice: 360,
        rating: 4.9,
        reviewsCount: 412,
        stock: 95,
        badge: 'Spicy Favorite',
        image: 'https://images.unsplash.com/photo-1589135233689-d56b00b0d367?w=800&auto=format&fit=crop&q=80',
        description: 'Hand-stuffed thick green chillies filled with hand-ground dry masala, amchur powder, and pure mustard oil.',
        jars: [
          { name: '250g Glass Jar', weight: '250g', price: 165, enabled: true },
          { name: '500g Glass Jar', weight: '500g', price: 290, enabled: true },
          { name: '1kg Bulk Pack', weight: '1kg', price: 540, enabled: true }
        ]
      },
      {
        _id: 'prod_mix_panchmel',
        name: 'Panchmel Mix Veggie Pickle (Crunchy Cauliflower, Carrot & Turnip)',
        category: 'Mixed Veg Pickles (Mix Achar)',
        categoryId: 'cat_mix',
        price: 310,
        comparePrice: 380,
        rating: 4.7,
        reviewsCount: 165,
        stock: 64,
        badge: 'Winter Special',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
        description: 'Wholesome blend of crunchy winter veggies seasoned with crushed mustard, black salt, and mild tangy spices.',
        jars: [
          { name: '250g Glass Jar', weight: '250g', price: 175, enabled: true },
          { name: '500g Glass Jar', weight: '500g', price: 310, enabled: true },
          { name: '1kg Bulk Pack', weight: '1kg', price: 570, enabled: true }
        ]
      },
      {
        _id: 'prod_sweet_chutney',
        name: 'Sweet & Tangy Keri Chutney (Gud Keri Launji)',
        category: 'Sweet Chutney & Murabba',
        categoryId: 'cat_sweet',
        price: 280,
        comparePrice: 350,
        rating: 4.9,
        reviewsCount: 290,
        stock: 110,
        badge: 'Jaggery Sweetened',
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
        description: 'Slow-simmered mango chunks in organic pure sugarcane jaggery (gud), raisins, cardamom, and roasted cumin.',
        jars: [
          { name: '250g Glass Jar', weight: '250g', price: 160, enabled: true },
          { name: '500g Glass Jar', weight: '500g', price: 280, enabled: true },
          { name: '1kg Bulk Pack', weight: '1kg', price: 520, enabled: true }
        ]
      }
    ]
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

  const addToCart = (product, selectedVariant = null, openDrawer = false) => {
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
          quantity: updated[existingIndex].quantity + 1,
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
            quantity: 1,
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
  const freeShippingThreshold = 499;
  const isFreeShipping = cartSubtotal >= freeShippingThreshold;
  const shippingFee = cart.length === 0 ? 0 : isFreeShipping ? 0 : 50;
  const totalAmount = cartSubtotal + shippingFee;

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

  const handleDirectBuy = (product, selectedVariant = null) => {
    const variantName = selectedVariant ? selectedVariant.name : (product.jars?.find(j => j.enabled !== false)?.name || product.variants?.[0]?.name || product.variant || '500g Jar');
    const prodId = product._id || product.id || product.name;
    const existing = cart.find(
      (item) => item.productId === prodId && item.variantName === variantName
    );
    if (!existing) {
      addToCart(product, selectedVariant, false);
    }
    setCheckoutStep('CHECKOUT');
    setIsCartOpen(true);
  };

  const handleDirectWhatsApp = (product, selectedVariant = null) => {
    const rawPrice = selectedVariant ? selectedVariant.price : product.price;
    const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 299;
    const variantName = selectedVariant ? selectedVariant.name : (product.jars?.find(j => j.enabled !== false)?.name || product.variants?.[0]?.name || product.variant || '500g Jar');
    const rawPhone = storeData?.store?.phone || storeData?.store?.contact?.phone || '9876543210';
    const tenantPhone = rawPhone.replace(/\D/g, '').slice(-10) || '9876543210';
    const storeTitle = storeData?.store?.businessName || storeData?.store?.name || 'Desi Rasoi Achar';

    const text = encodeURIComponent(
      `Hello! I would like to order *${product.name}* (${variantName}) for *₹${price}* from ${storeTitle}. Please share delivery & COD details!`
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
          productName: `${product.name} (${variantName})`,
          productPrice: price,
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
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPlacedOrder(data.data);
        setCheckoutStep('SUCCESS');
        setCart([]);
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
  const filteredProducts =
    selectedCategory === 'ALL'
      ? products
      : products.filter((p) => {
          const catId = p.categoryId?._id ? String(p.categoryId._id) : (p.categoryId ? String(p.categoryId) : '');
          const catSlug = p.categoryId?.slug || '';
          return catId === String(selectedCategory) || (catSlug && catSlug === String(selectedCategory));
        });

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white pb-24">
      {/* Top Banner / Trust Bar */}
      <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 border-b border-indigo-100 py-2.5 px-4 text-center text-xs font-medium text-slate-700 flex items-center justify-center gap-6 overflow-x-auto whitespace-nowrap">
        <span className="flex items-center gap-1.5 font-semibold text-slate-900">
          <Truck className="w-3.5 h-3.5 text-indigo-400" /> Free Express Delivery on Orders &gt; ₹499
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Secure Checkout &amp; COD
        </span>
        <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 4.9/5 Rated by 2,400+ Food Lovers
        </span>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/30">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight flex items-center gap-2">
              {store.businessName}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Verified
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Authentic Homemade Store</span>
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              <Link to="/orders/track" className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium">
                Track Order
              </Link>
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {store.phone && (
            <a
              href={`https://wa.me/91${store.phone.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(
                `Hi ${store.businessName}! I'm browsing your online store and need help.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Support
            </a>
          )}
          <button
            onClick={() => {
              setCheckoutStep('CART');
              setIsCartOpen(true);
            }}
            className="relative px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
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
                const pCatSlug = p.categoryId?.slug || '';
                return pCatId === String(c._id) || (pCatSlug && pCatSlug === String(c.slug));
              }).length;
              const catImage =
                c.image ||
                'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80';
              const isSelected = selectedCategory === c._id || selectedCategory === c.slug;
              return (
                <button
                  key={c._id}
                  onClick={() => setSelectedCategory(c._id)}
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

        {/* Physical Products Grid (if any) */}
        {filteredProducts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" /> Handcrafted Pickle Collection
              </h3>
              <span className="text-xs text-slate-500 font-medium">{filteredProducts.length} items found</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod._id}
                  product={prod}
                  cart={cart}
                  onAddToCart={addToCart}
                  onUpdateQty={updateProductQuantity}
                  onDirectBuy={handleDirectBuy}
                  onWhatsApp={handleDirectWhatsApp}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Sticky Quick Funnel Bar (When cart is empty) */}
      {cart.length === 0 && !isCartOpen && (
        <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 max-w-md mx-auto bg-white/95 backdrop-blur-md border border-slate-200/90 p-2 rounded-2xl shadow-xl flex items-center gap-2">
          <button
            onClick={() => {
              if (filteredProducts.length > 0) {
                handleDirectBuy(filteredProducts[0]);
              }
            }}
            className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Direct Order</span>
          </button>
          <button
            onClick={() => {
              if (filteredProducts.length > 0) {
                handleDirectWhatsApp(filteredProducts[0]);
              } else {
                const tenantPhone = (storeData?.store?.phone || storeData?.store?.contact?.phone || '9876543210').replace(/\D/g, '').slice(-10);
                window.open(`https://wa.me/91${tenantPhone}?text=${encodeURIComponent(`Hi! I want to inquire about products from ${store.businessName}.`)}`, '_blank');
              }
            }}
            className="flex-1 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
            <span>Order on WhatsApp</span>
          </button>
        </div>
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

      {/* Slide-over Cart & Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col justify-between overflow-y-auto p-6">
            {checkoutStep === 'CART' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-base">Your Cart</h3>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Free shipping banner */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                  {isFreeShipping ? (
                    <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Congratulations! You got FREE Delivery.
                    </div>
                  ) : (
                    <div className="text-slate-600">
                      Add <strong className="text-amber-600 font-bold">₹{freeShippingThreshold - cartSubtotal}</strong> more to unlock <span className="text-emerald-700 font-bold">FREE Delivery</span>!
                    </div>
                  )}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (cartSubtotal / freeShippingThreshold) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Cart Items */}
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Your cart is currently empty.
                  </div>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    {cart.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition">
                        <div className="flex items-center gap-3 min-w-0">
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
                            <div className="font-bold text-slate-900 text-xs truncate max-w-[170px]" title={item.name}>
                              {item.name}
                            </div>
                            {item.variantName && (
                              <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <span>🏺</span>
                                <span className="truncate">{item.variantName}</span>
                              </div>
                            )}
                            <div className="text-[11px] text-slate-500 font-medium">₹{item.price} each</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(idx, -1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer transition active:scale-90"
                              title="Decrease"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <span className="w-7 text-center font-black text-slate-900 text-xs">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(idx, 1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer transition active:scale-90"
                              title="Increase"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="font-black text-emerald-600 text-xs w-16">
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

                {/* Price breakdown */}
                {cart.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="text-slate-900 font-medium">₹{cartSubtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Fee:</span>
                      <span className={isFreeShipping ? 'text-emerald-600 font-bold' : 'text-slate-900 font-bold'}>
                        {isFreeShipping ? 'FREE' : `₹${shippingFee}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Amount:</span>
                      <span className="text-emerald-600">₹{totalAmount}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {checkoutStep === 'CHECKOUT' && (
              <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Express 1-Page Checkout</h3>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('CART')}
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    &larr; Back to Cart
                  </button>
                </div>

                {/* Order Summary Preview Card */}
                {cart.length > 0 && (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-200">
                      <span>Order Items ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                      <button
                        type="button"
                        onClick={() => setCheckoutStep('CART')}
                        className="text-indigo-600 hover:underline capitalize font-semibold cursor-pointer"
                      >
                        Edit Cart
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {cart.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="truncate max-w-[210px]">
                            <span className="font-semibold text-slate-900">{item.name}</span>
                            {item.variantName && (
                              <span className="text-[10px] text-slate-500 ml-1">({item.variantName})</span>
                            )}
                            <span className="text-slate-400 text-[10px] ml-1 font-bold">x{item.quantity}</span>
                          </div>
                          <span className="font-bold text-slate-900 shrink-0">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
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

                <div className="space-y-3">
                  <div>
                    <label className="text-slate-700 block mb-1 font-semibold">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 font-semibold">10-Digit Mobile Number *</label>
                      <span className="text-[10px] text-slate-400 font-medium">Starts with 6-9</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs flex items-center">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="9876543210"
                        maxLength={10}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:bg-white"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="pt-2">
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

                <div className="pt-3 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      'Placing Order...'
                    ) : (
                      <>
                        <span>Confirm & Place Order (₹{totalAmount})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {checkoutStep === 'SUCCESS' && placedOrder && (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Order Confirmed!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Thank you, {customerName}! Your order has been placed successfully.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
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
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="text-slate-900 font-semibold">{placedOrder.paymentMethod}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={`https://wa.me/91${customerPhone}?text=${encodeURIComponent(
                      `Hi! I have placed order ${placedOrder.orderNumber} on ${store.businessName}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat on WhatsApp for Updates
                  </a>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setCheckoutStep('CART');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}

            {/* Bottom button for CART step */}
            {checkoutStep === 'CART' && cart.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={() => setCheckoutStep('CHECKOUT')}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
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
                  onClick={() => setIsExitPopupOpen(false)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Product Card with High-Res Image, Badges, Ratings, Variant Selector & Interactive Stepper
const ProductCard = ({ product, cart = [], onAddToCart, onUpdateQty, onDirectBuy, onWhatsApp }) => {
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

        {/* Pricing and Cart / Checkout Actions */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-900">₹{price}</span>
                {compareAt > price && (
                  <span className="text-xs text-slate-400 line-through">₹{compareAt}</span>
                )}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">Inclusive of all taxes</span>
            </div>

            {/* Cart Stepper: When 0 show "+ Add to Cart", when > 0 show [-] [qty] [+] */}
            {cartQty === 0 ? (
              <button
                onClick={() => onAddToCart(product, currentVariant, false)}
                type="button"
                className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                <span>Add to Cart</span>
              </button>
            ) : (
              <div className="flex items-center bg-indigo-50 border border-indigo-300 rounded-xl p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => onUpdateQty(product, currentVariant, -1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-indigo-700 hover:bg-indigo-600 hover:text-white shadow-xs transition active:scale-90 cursor-pointer"
                  title="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <span className="w-8 text-center font-black text-xs text-indigo-950">
                  {cartQty}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQty(product, currentVariant, 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition active:scale-90 cursor-pointer"
                  title="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Option 1: Direct Order (Instant Checkout Drawer) */}
            <button
              onClick={() => onDirectBuy(product, currentVariant)}
              type="button"
              className="py-2.5 px-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Direct Order</span>
            </button>

            {/* Option 2: WhatsApp (Direct Chat with Pre-filled Product Details) */}
            <button
              onClick={() => onWhatsApp(product, currentVariant)}
              type="button"
              className="py-2.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 hover:border-emerald-400 text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
