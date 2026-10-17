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
  Trash2
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

  const addToCart = (product, selectedVariant = null) => {
    setCart((prev) => {
      const variantName = selectedVariant ? selectedVariant.name : (product.jars?.find(j => j.enabled !== false)?.name || product.variants?.[0]?.name || product.variant || '500g Jar');
      const variantId = selectedVariant?._id || selectedVariant?.id || variantName;
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
        updated[existingIndex].quantity += 1;
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
    setIsCartOpen(true);
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

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !street || !city || !pincode) {
      alert('Please fill all mandatory shipping address fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/public/store/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          shippingAddress: {
            street,
            city,
            state,
            pincode,
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
          const catId = p.categoryId?._id || p.categoryId;
          return catId === selectedCategory;
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
              href={`https://wa.me/91${store.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `Hi ${store.businessName}! I'm browsing your online store and need help.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/25 text-xs font-semibold transition"
            >
              <Phone className="w-3.5 h-3.5" /> WhatsApp Support
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

            {/* Individual Category Cards with High-Res Photos */}
            {categories.map((c) => {
              const catProdCount = products.filter(
                (p) => (p.categoryId?._id || p.categoryId) === c._id
              ).length;
              const catImage =
                c.image ||
                'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80';
              const isSelected = selectedCategory === c._id;
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
                <ProductCard key={prod._id} product={prod} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        )}
      </main>

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
                    <ShoppingBag className="w-5 h-5 text-indigo-400" />
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
                    <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Congratulations! You got FREE Delivery.
                    </div>
                  ) : (
                    <div className="text-slate-600">
                      Add <strong className="text-amber-400">₹{freeShippingThreshold - cartSubtotal}</strong> more to unlock <span className="text-emerald-400 font-bold">FREE Delivery</span>!
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
                              <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                <span>🏺</span>
                                <span className="truncate">{item.variantName}</span>
                              </div>
                            )}
                            <div className="text-[11px] text-slate-400 font-medium">₹{item.price} each</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(idx, -1)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer transition"
                              title="Decrease"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 font-black text-slate-900 text-xs">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(idx, 1)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer transition"
                              title="Increase"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="font-black text-emerald-400 text-xs w-16">
                              ₹{item.price * item.quantity}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(idx)}
                              className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer mt-0.5 inline-block"
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
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span className="text-slate-900 font-medium">₹{cartSubtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Delivery Fee:</span>
                      <span className={isFreeShipping ? 'text-emerald-400 font-bold' : 'text-white'}>
                        {isFreeShipping ? 'FREE' : `₹${shippingFee}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Amount:</span>
                      <span className="text-emerald-400">₹{totalAmount}</span>
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
                    className="text-indigo-400 hover:underline"
                  >
                    &larr; Back to Cart
                  </button>
                </div>

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
                    <label className="text-slate-700 block mb-1 font-semibold">10-Digit Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                    />
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
                      <label className="text-slate-700 block mb-1 font-semibold">Pincode *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 201309"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white"
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
                        className={`p-3 rounded-xl border text-left transition ${
                          paymentMethod === 'COD'
                            ? 'bg-indigo-600/10 border-indigo-500 text-white font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="text-xs">Cash on Delivery</div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">Pay upon delivery</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('ONLINE')}
                        className={`p-3 rounded-xl border text-left transition ${
                          paymentMethod === 'ONLINE'
                            ? 'bg-indigo-600/10 border-indigo-500 text-white font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="text-xs">UPI / Online Pay</div>
                        <div className="text-[10px] text-cyan-400 mt-0.5">GooglePay, PhonePe</div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
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
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Order Confirmed!</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Thank you, {customerName}! Your order has been placed successfully.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order Number:</span>
                    <span className="font-mono font-bold text-indigo-400">
                      {placedOrder.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Amount:</span>
                    <span className="font-bold text-emerald-400">₹{placedOrder.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Mode:</span>
                    <span className="text-slate-200">{placedOrder.paymentMethod}</span>
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
                    <Phone className="w-4 h-4" /> Chat on WhatsApp for Updates
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
    </div>
  );
};

// Reusable Product Card with High-Res Image, Badges, Ratings and Variant Selector
const ProductCard = ({ product, onAddToCart }) => {
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

  const price = selectedVariant
    ? (typeof selectedVariant.price === 'number' ? selectedVariant.price : parseFloat(String(selectedVariant.price).replace(/[^0-9.]/g, '')) || rawBasePrice)
    : rawBasePrice;

  const compareAt = selectedVariant
    ? selectedVariant.compareAtPrice
    : product.compareAtPrice;
  const discountPercent =
    compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : null;

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
                <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  <span>🏺</span>
                  <span>Available Jar Sizes:</span>
                </label>
                {selectedVariant && (
                  <span className="text-[10px] text-indigo-400 font-bold truncate max-w-[130px]">
                    {selectedVariant.name}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {availableVariants.map((v, i) => {
                  const isSelected = selectedVariant?.name === v.name;
                  const vPrice = typeof v.price === 'number' ? v.price : parseFloat(String(v.price).replace(/[^0-9.]/g, '')) || rawBasePrice;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(v)}
                      type="button"
                      className={`py-1.5 px-2 rounded-xl text-left border transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 ring-1 ring-indigo-300'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold truncate leading-tight">{v.name}</div>
                      <div className={`text-[10px] font-extrabold ${isSelected ? 'text-indigo-100' : 'text-emerald-400'}`}>
                        ₹{vPrice}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pricing and Add button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900">₹{price}</span>
              {compareAt > price && (
                <span className="text-xs text-slate-500 line-through">₹{compareAt}</span>
              )}
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">Inclusive of all taxes</span>
          </div>

          <button
            onClick={() => onAddToCart(product, selectedVariant)}
            type="button"
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-1.5 transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};
