import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { NO_IMAGE_PLACEHOLDER } from '../utils/imagePlaceholder';
import {
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle,
  Truck,
  ShieldCheck,
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

// Intelligent Search Synonyms & Multi-lingual Token Dictionary (Hindi + English)
const SEARCH_SYNONYMS = {
  mirch: ['chilli', 'chili', 'mirch', 'mirchi', 'pepper', 'lal mirch', 'hari mirch', 'banarasi'],
  chilli: ['chilli', 'chili', 'mirch', 'mirchi', 'pepper'],
  lal: ['red', 'lal', 'laal', 'mirch', 'banarasi'],
  hari: ['green', 'hari', 'mirch'],
  nimbu: ['lemon', 'lime', 'nimbu', 'neembu', 'khatta'],
  lemon: ['lemon', 'lime', 'nimbu', 'neembu'],
  lahsun: ['garlic', 'lahsun', 'lasun'],
  garlic: ['garlic', 'lahsun', 'lasun'],
  haldi: ['turmeric', 'haldi'],
  adrak: ['ginger', 'adrak'],
  teekha: ['spicy', 'teekha', 'tikha', 'masaledar', 'chatpata', 'hot'],
  spicy: ['spicy', 'teekha', 'tikha', 'masaledar', 'chatpata', 'hot'],
  sweet: ['sweet', 'meetha', 'mitha', 'gud', 'jaggery', 'chutney'],
  meetha: ['sweet', 'meetha', 'mitha', 'gud', 'jaggery'],
  jar: ['jar', 'bottle', 'pack', 'dabba', 'kg', 'gm', '500g', '1kg', '250g'],
  shoot: ['shoot', 'photo', 'photography', 'portrait', 'session', 'studio', 'video', 'film', 'cinematic'],
  photo: ['photo', 'photography', 'shoot', 'portrait', 'camera', 'pic'],
  wedding: ['wedding', 'pre-wedding', 'shaadi', 'shadi', 'marriage', 'engagement', 'bridal', 'cinematic'],
  baby: ['baby', 'maternity', 'newborn', 'kids', 'toddler', 'milestone'],
  cinematic: ['cinematic', 'video', 'film', 'teaser', 'drone', '4k', 'multicam'],
  safari: ['safari', 'desert', 'tour', 'ride', 'camping', 'camel', 'dune', 'expedition', 'jeep'],
  tour: ['tour', 'safari', 'trip', 'travel', 'holiday', 'package', 'guide'],
  camel: ['camel', 'ride', 'safari', 'dune', 'sunset'],
  camp: ['camp', 'camping', 'tent', 'night stay', 'stargazing', 'luxury']
};

const matchesSearchQuery = (searchableText, query) => {
  if (!query || !query.trim()) return true;
  const cleanQuery = query.toLowerCase().trim();
  const tokens = cleanQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const targetText = (searchableText || '').toLowerCase();

  // If exact substring matches, pass immediately
  if (targetText.includes(cleanQuery)) return true;

  // All tokens must match either directly or via synonym
  return tokens.every((token) => {
    if (targetText.includes(token)) return true;
    const syns = SEARCH_SYNONYMS[token];
    if (syns && syns.some((s) => targetText.includes(s))) return true;
    return false;
  });
};

const parseMoney = (value) => {
  const parsed =
    typeof value === 'number'
      ? value
      : parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const resolveVariantName = (product, selectedVariant = null) =>
  selectedVariant?.name ||
  product.jars?.find((j) => j.enabled !== false)?.name ||
  product.variants?.[0]?.name ||
  product.variant ||
  '';


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
  const checkoutIdempotencyKey = useRef(null);

  const getCheckoutIdempotencyKey = () => {
    if (!checkoutIdempotencyKey.current) {
      checkoutIdempotencyKey.current =
        (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${slug}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    }
    return checkoutIdempotencyKey.current;
  };

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
  const [state, setState] = useState('');
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
  const [bookingTimeSlot, setBookingTimeSlot] = useState('');
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

  // Reset per-tenant UI state when navigating between storefronts.
  useEffect(() => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
    setCouponSuccess('');
    setSearchQuery('');
    setSelectedCategory('ALL');
    setIsCartOpen(false);
    setCheckoutStep('CART');
    setPlacedOrder(null);
  }, [slug]);

;

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        setStoreData(null);
        setError(null);
        const res = await fetch(`/api/public/store/${slug}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success || !data.data) {
          throw new Error(
            data.message ||
              (res.status === 404
                ? 'This storefront does not exist or is not active.'
                : 'Unable to load this storefront right now.')
          );
        }
        setStoreData(data.data);
        const storeSettings = data.data?.store?.settings || {};
        setPaymentMethod(
          storeSettings.enableCOD !== false
            ? 'COD'
            : storeSettings.enableOnlinePay !== false
            ? 'ONLINE'
            : 'COD'
        );
      } catch (err) {
        setStoreData(null);
        setError(err.message || 'Unable to load this storefront right now.');
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [slug]);

  const addToCart = (product, selectedVariant = null, openDrawer = false, qty = 1) => {
    const rawPrice = selectedVariant ? selectedVariant.price : product.price;
    const price = parseMoney(rawPrice);
    if (!price) {
      alert('This item does not have a valid price configured. Please contact the store.');
      return;
    }
    const variantName = resolveVariantName(product, selectedVariant);
    const variantId = (selectedVariant?._id && typeof selectedVariant._id === 'string' && selectedVariant._id.length === 24) ? selectedVariant._id : null;
    const prodId = product._id || product.id || product.name;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === prodId && item.variantName === variantName
      );

      // Robust image resolution checking img, image, images array, or authentic default
      const productImage =
        product.img ||
        product.image ||
        (Array.isArray(product.images) && product.images.length > 0 && product.images[0] ? product.images[0] : null) ||
        NO_IMAGE_PLACEHOLDER;

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
    const rawPrice = selectedVariant ? selectedVariant.price : product.price;
    const price = parseMoney(rawPrice);
    if (delta > 0 && !price) {
      alert('This item does not have a valid price configured. Please contact the store.');
      return;
    }
    const variantName = resolveVariantName(product, selectedVariant);
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
        const productImage =
          product.img ||
          product.image ||
          (Array.isArray(product.images) && product.images.length > 0 && product.images[0] ? product.images[0] : null) ||
          NO_IMAGE_PLACEHOLDER;

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
  // Delivery rules come from the tenant's storefront record. Fallbacks mirror the
  // server-side Tenant defaults so the client total matches checkout validation.
  const freeShippingThreshold = Number(storeData?.store?.settings?.freeShippingThreshold ?? 499);
  const configuredShippingFee = Number(storeData?.store?.settings?.shippingFee ?? 50);
  const isFreeShipping =
    freeShippingThreshold > 0 && discountedSubtotal >= freeShippingThreshold;
  const shippingFee = cart.length === 0 ? 0 : isFreeShipping ? 0 : configuredShippingFee;
  const totalAmount = cart.length === 0 ? 0 : discountedSubtotal + shippingFee;
  const codEnabled = storeData?.store?.settings?.enableCOD !== false;
  const onlinePaymentEnabled = storeData?.store?.settings?.enableOnlinePay !== false;
  const hasPaymentMethod = codEnabled || onlinePaymentEnabled;

  const handleApplyCoupon = (codeToApply) => {
    setCouponError('');
    setCouponSuccess('');
    const code = (codeToApply || couponCodeInput || '').trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const availableCoupons = storeData?.coupons || [];
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

  // Only offer a real, active coupon supplied by the storefront API.
  const exitCoupon = (storeData?.coupons || [])[0] || null;
  const exitCouponLabel = exitCoupon
    ? exitCoupon.discountType === 'PERCENTAGE'
      ? `${exitCoupon.discountValue}% OFF`
      : `₹${exitCoupon.discountValue} OFF`
    : '';

  // Exit-Intent Listener
  useEffect(() => {
    const handleMouseLeave = (e) => {
      if (
        e.clientY <= 10 &&
        !hasTriggeredExit &&
        !couponClaimed &&
        exitCoupon
      ) {
        setIsExitPopupOpen(true);
        setHasTriggeredExit(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasTriggeredExit, couponClaimed, exitCoupon]);

  const handleDirectBuy = (product, selectedVariant = null, qty = 1) => {
    const rawPrice = selectedVariant ? selectedVariant.price : product.price;
    const price = parseMoney(rawPrice);
    if (!price) {
      alert('This item does not have a valid price configured. Please contact the store.');
      return;
    }
    const variantName = resolveVariantName(product, selectedVariant);
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
        const productImage =
          product.img ||
          product.image ||
          (Array.isArray(product.images) && product.images.length > 0 && product.images[0] ? product.images[0] : null) ||
          NO_IMAGE_PLACEHOLDER;

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
    const unitPrice = parseMoney(rawPrice);
    if (!unitPrice) {
      alert('This item does not have a valid price configured. Please contact the store.');
      return;
    }
    const totalPrice = unitPrice * qty;
    const variantName = resolveVariantName(product, selectedVariant);
    const rawPhone = storeData?.store?.contact?.phone || storeData?.store?.phone || '';
    const tenantPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
    if (!tenantPhone) {
      alert('This store has not configured a WhatsApp number yet. Please use checkout or the contact options on this page.');
      return;
    }
    const storeTitle = storeData?.store?.businessName || storeData?.store?.name || 'this store';

    const qtyText = qty > 1 ? `${qty}x ` : '';
    const text = encodeURIComponent(
      `Hello! I would like to order *${qtyText}${product.name}*${variantName ? ` (${variantName})` : ''} for *₹${totalPrice}* from ${storeTitle}. Please share delivery & COD details!`
    );
    const waUrl = `https://wa.me/91${tenantPhone}?text=${text}`;

    // Opening WhatsApp is an outbound click, not a captured CRM lead. Only
    // record a lead when the visitor actually submits their own phone number.
    window.open(waUrl, '_blank');
  };

  const handleTopWhatsAppOrder = () => {
    const rawPhone = storeData?.store?.contact?.phone || storeData?.store?.phone || store.phone || '';
    const tenantPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
    if (!tenantPhone) {
      alert('This store has not configured a WhatsApp number yet. Please use checkout or the contact options on this page.');
      return;
    }
    const storeTitle = storeData?.store?.businessName || storeData?.store?.name || store.businessName || 'this store';

    let text = '';
    if (cart.length > 0) {
      const itemsList = cart.map((item, idx) => `${idx + 1}. ${item.quantity}x ${item.name} (${item.variantName || 'No variant'}) - ₹${item.price * item.quantity}`).join('\n');
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

    // Outbound WhatsApp click; do not create a fake CRM lead using the store's
    // own phone number as if it belonged to a customer.
    window.open(waUrl, '_blank');
  };

  const handleClaimCoupon = async (e) => {
    e.preventDefault();
    if (!exitCoupon) {
      alert('No active offer is available for this store.');
      setIsExitPopupOpen(false);
      return;
    }
    const cleanPhone = (exitPhone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      alert('⚠️ Invalid Mobile Number! Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    try {
      const res = await fetch(`/api/public/store/${slug}/inquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: exitName || 'Storefront Visitor',
          phone: cleanPhone,
          productName: `Offer enquiry: ${exitCoupon.code}`,
          source: 'EXIT_POPUP',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not record your enquiry. Please try again.');
      }
      setCouponClaimed(true);
    } catch (err) {
      alert(err.message || 'Could not record your enquiry. Please try again.');
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
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': getCheckoutIdempotencyKey(),
        },
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
        checkoutIdempotencyKey.current = null;
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
        <h2 className="text-xl font-bold text-slate-900">Storefront Unavailable</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-md">{error || 'Store not found'}</p>
        <Link to="/" className="mt-4 px-4 py-2 bg-indigo-600 rounded-xl text-xs font-semibold">
          Return to Omniva Home
        </Link>
      </div>
    );
  }

  const { store, categories, products } = storeData;
  const storeWhatsAppPhone = String(store?.contact?.phone || store?.phone || '')
    .replace(/\D/g, '')
    .slice(-10);
  const isSearching = Boolean(searchQuery && searchQuery.trim());

  const filteredProducts = products.filter((p) => {
    // 1. If actively searching, search across all items in catalog regardless of active category
    if (isSearching) {
      const name = p.name || '';
      const desc = p.description || '';
      const cat = p.categoryId?.name || p.category || '';
      const variants = (p.variants || p.jars || []).map((v) => v.name || '').join(' ');
      const tags = Array.isArray(p.tags) ? p.tags.join(' ') : '';
      const price = String(p.price || '');
      const searchable = `${name} ${desc} ${cat} ${variants} ${tags} ${price}`;
      return matchesSearchQuery(searchable, searchQuery);
    }

    // 2. Category Filter (Active when NOT searching)
    const matchesCategory =
      selectedCategory === 'ALL' ||
      String(p.categoryId?._id) === String(selectedCategory) ||
      (p.categoryId?.slug && p.categoryId.slug === String(selectedCategory)) ||
      (p.categoryId?.name && p.categoryId.name === String(selectedCategory)) ||
      (p.category && p.category === String(selectedCategory));

    return matchesCategory;
  });

  const isTravelStore =
    (storeData?.store?.businessType === 'TRAVEL') ||
    (store?.businessType === 'TRAVEL') ||
    (store?.templateCode === 'TRAVEL');

  const isServiceStore =
    !isTravelStore && (
      (storeData?.store?.businessType === 'SERVICE') ||
      (store?.businessType === 'SERVICE') ||
      (store?.templateCode === 'SERVICE') ||
      (Boolean(storeData?.packages && storeData.packages.length > 0 && products.length === 0))
    );

  const filteredPackages = (storeData?.packages || []).filter((pkg) => {
    if (isSearching) {
      const name = pkg.name || '';
      const desc = pkg.description || '';
      const cat = pkg.category || '';
      const delivMatch = Array.isArray(pkg.deliverables) ? pkg.deliverables.join(' ') : '';
      const price = String(pkg.price || '');
      const searchable = `${name} ${desc} ${cat} ${delivMatch} ${price}`;
      return matchesSearchQuery(searchable, searchQuery);
    }
    return true;
  });

  const totalMatches = products.length > 0 ? filteredProducts.length : filteredPackages.length;
  const popularSearchTags = Array.from(
    new Set(
      (products.length > 0
        ? products.flatMap((product) => [
            ...(Array.isArray(product.tags) ? product.tags : []),
            product.categoryId?.name || product.category,
          ])
        : (storeData?.packages || []).flatMap((pkg) => [pkg.category, pkg.name])
      ).filter(Boolean)
    )
  ).slice(0, 6);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white pb-24">
      {/* Top Banner / Trust Bar */}
      <div className={`text-white border-b py-1.5 px-3 sm:px-4 text-xs font-medium shadow-xs transition-colors ${
        isServiceStore
          ? 'bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 border-indigo-700/40'
          : isTravelStore
          ? 'bg-gradient-to-r from-cyan-950 via-blue-900 to-indigo-950 border-cyan-700/40'
          : 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 border-emerald-600/40'
      }`}>
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-2 text-[11px] sm:text-xs">
          <div className="flex items-center gap-3 truncate">
            <span className="flex items-center gap-1.5 font-bold text-white truncate">
              {isServiceStore ? (
                <>
                  <Camera className="w-3.5 h-3.5 text-purple-200 shrink-0" />
                  <span className="truncate">{store.branding?.tagline || 'Service bookings available'}</span>
                </>
              ) : isTravelStore ? (
                <>
                  <MapPin className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                  <span className="truncate">{store.branding?.tagline || 'Travel bookings available'}</span>
                </>
              ) : (
                <>
                  <Truck className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                  <span className="truncate">
                    {freeShippingThreshold > 0
                      ? `Free Delivery over ₹${freeShippingThreshold.toLocaleString('en-IN')}`
                      : configuredShippingFee > 0
                      ? `Delivery fee ₹${configuredShippingFee.toLocaleString('en-IN')}`
                      : 'Free Delivery'}
                  </span>
                </>
              )}
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              {isServiceStore || isTravelStore
                ? 'Booking requests confirmed by the business'
                : store.settings?.enableCOD
                ? 'Cash on Delivery available'
                : 'Online payment available'}
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
            <span>{store.phone ? `+91 ${store.phone.replace(/[^0-9]/g, '').slice(-10)}` : 'Not configured'} ↗</span>
          </button>
        </div>
      </div>

      {/* Main Header - Clean Mobile & Desktop Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30 border border-indigo-500/30 shrink-0">
            {isServiceStore ? (
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : isTravelStore ? (
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg tracking-tight flex items-center gap-1.5 truncate">
              <span className="truncate">{store.businessName}</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
              <span className="hidden xs:inline">
                {store.branding?.tagline ||
                  (isServiceStore
                    ? 'Service Business'
                    : isTravelStore
                    ? 'Travel & Experiences'
                    : 'Online Store')}
              </span>
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
            <span className="hidden md:inline font-extrabold">{isServiceStore ? 'Enquire on ' : 'Order on '}</span>
            <span className="font-extrabold text-xs">WhatsApp</span>
          </button>

          {/* Cart Button (shown when products exist) */}
          {products.length > 0 && (
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
          )}
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
            placeholder={
              isServiceStore
                ? 'Search services and packages...'
                : isTravelStore
                ? 'Search tours and packages...'
                : 'Search products, categories and variants...'
            }
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
              {totalMatches} {totalMatches === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>

        {/* Quick Search Chips from real catalog categories/tags */}
        {popularSearchTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-2.5 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> From this catalog:
          </span>
          {popularSearchTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSearchQuery(tag)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer shrink-0 ${
                searchQuery.toLowerCase() === tag.toLowerCase()
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition shrink-0 cursor-pointer"
            >
              Clear ✕
            </button>
          )}
        </div>
        )}

        {/* Live Search Active Feedback Tag */}
        {searchQuery && (
          <div className="flex items-center justify-between mt-2 px-1 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 flex-wrap">
              <span>Searching for</span>
              <strong className="text-slate-900 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 font-semibold">
                "{searchQuery}"
              </strong>
              <span>({totalMatches} {isServiceStore ? 'packages' : 'items'} found across catalog)</span>
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-indigo-600 hover:underline font-semibold cursor-pointer text-[11px] shrink-0"
            >
              Reset search
            </button>
          </div>
        )}
      </div>

      {/* Hero Banner */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2 w-full">
        {isServiceStore ? (
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50/40 to-slate-50 border border-indigo-200/80 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xs">
            <div className="relative z-10 max-w-xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 border border-purple-300 text-purple-800 text-xs font-semibold">
                <Camera className="w-3.5 h-3.5" /> Service Bookings
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {store.branding?.tagline || `Book a service with ${store.businessName}`}
              </h2>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                Browse the services published by this business. See each package for its real pricing and availability.
              </p>
            </div>
          </div>
        ) : isTravelStore ? (
          <div className="bg-gradient-to-br from-cyan-50 via-blue-50/40 to-cyan-50 border border-cyan-200/80 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xs">
            <div className="relative z-10 max-w-xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100 border border-cyan-300 text-cyan-800 text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5" /> Travel &amp; Experiences
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {store.branding?.tagline || `Travel with ${store.businessName}`}
              </h2>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                Browse the tours and packages published by this business. See each package for its real itinerary, pricing and availability.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 border border-amber-200/80 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xs">
            <div className="relative z-10 max-w-xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Products
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {store.branding?.tagline || `Shop from ${store.businessName}`}
              </h2>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                Browse the products published by this business. Prices, variants and stock are shown from the live catalog.
              </p>
            </div>
          </div>
        )}
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
                <div className="text-xs font-bold text-slate-900">All Items</div>
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
                NO_IMAGE_PLACEHOLDER;
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
                        NO_IMAGE_PLACEHOLDER;
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
        {filteredPackages && filteredPackages.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {isTravelStore ? (
                  <>
                    <MapPin className="w-5 h-5 text-cyan-600" /> Tours &amp; Packages
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-indigo-600" /> Service Packages
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {isTravelStore
                  ? 'Select an expedition package to view departures and reserve seats.'
                  : 'Select a package to check dates and reserve your slot.'}
              </p>
            </div>

            {filteredPackages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPackages.map((pkg) => {
                  const pkgCover =
                    pkg.images?.[0] ||
                    NO_IMAGE_PLACEHOLDER;
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
                              NO_IMAGE_PLACEHOLDER;
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
                          <h4 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition">
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
            ) : (
              <div className="py-12 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto">
                  <Search className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    No packages found matching "{searchQuery}"
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1">
                    Try searching for another keyword or clear the search to view all available experiences.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                >
                  Clear Search &amp; View All
                </button>
              </div>
            )}
          </div>
        )}

        {/* Physical Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                <span>Product Catalog</span>
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
          <div className="py-12 sm:py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto">
              <Search className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base">
                {searchQuery ? `No items found matching "${searchQuery}"` : 'No products found'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1">
                {searchQuery
                  ? "We couldn't find an exact match across our catalog. Try one of our popular categories below or reset search."
                  : 'No products in this category. Try selecting All.'}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                >
                  Clear Search &amp; View All
                </button>
              )}
              {selectedCategory !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
                >
                  Show All Items
                </button>
              )}
            </div>

            {/* Quick Suggestions in Empty State */}
            {searchQuery && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 block mb-2 font-medium">Or try searching for:</span>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {popularSearchTags.slice(0, 5).map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setSearchQuery(sugg)}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition border border-indigo-200/60 cursor-pointer"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                  {freeShippingThreshold > 0 && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs shadow-2xs">
                    {isFreeShipping ? (
                      <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>You qualify for FREE Delivery.</span>
                      </div>
                    ) : (
                      <div className="text-slate-600 text-xs">
                        Add <strong className="text-amber-600 font-bold">₹{Math.max(0, freeShippingThreshold - discountedSubtotal)}</strong> more to get <span className="text-emerald-700 font-bold">FREE Delivery</span>.
                      </div>
                    )}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(100, (discountedSubtotal / freeShippingThreshold) * 100)}%` }}
                      />
                    </div>
                  </div>
                  )}

                  {/* Cart Items List */}
                  {cart.length === 0 ? (
                    <div className="py-14 text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-400 flex items-center justify-center mx-auto">
                        <ShoppingBag className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">Your cart is currently empty</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        Add products to your cart to continue checkout.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-xs">
                      {cart.map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200 flex items-center justify-between gap-2.5 hover:border-slate-300 transition shadow-2xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={item.image || NO_IMAGE_PLACEHOLDER}
                              alt={item.name}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = NO_IMAGE_PLACEHOLDER;
                              }}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0 bg-white"
                            />
                            <div className="min-w-0 space-y-0.5">
                              <div className="font-bold text-slate-900 text-xs truncate max-w-[150px] sm:max-w-[170px]" title={item.name}>
                                {item.name}
                              </div>
                              {item.variantName && (
                                <div className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <Tag className="w-3 h-3" />
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
                          {((storeData?.coupons || [])).length > 0 && (
                            <div className="pt-1.5 border-t border-slate-200/70">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>Tap to Apply Discount:</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {(storeData?.coupons || []).filter(c => c.isActive !== false).map((c) => (
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
                      {hasPaymentMethod ? (
                        <div className={`grid ${codEnabled && onlinePaymentEnabled ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                          {codEnabled && (
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
                          )}
                          {onlinePaymentEnabled && (
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
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
                          This store has not enabled Cash on Delivery or online payment. Checkout is unavailable.
                        </div>
                      )}
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
                      Continue Shopping
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
                    disabled={isSubmitting || !hasPaymentMethod}
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
                  {storeWhatsAppPhone && (
                    <a
                      href={`https://wa.me/91${storeWhatsAppPhone}?text=${encodeURIComponent(
                        `Hi! I have placed order ${placedOrder?.orderNumber} for ₹${placedOrder?.totalAmount} on ${store.businessName}. Please share dispatch tracking!`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" /> Chat on WhatsApp for Updates
                    </a>
                  )}
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
                    <h3 className="font-bold text-slate-900 text-base">
                      {isTravelStore ? 'Book Tour Dates' : 'Book Service Dates'}
                    </h3>
                    <p className="text-[11px] text-indigo-500 font-semibold mt-0.5">{selectedPkg.name}</p>
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
                    <span className="text-slate-500 font-medium">{isTravelStore ? 'Total Tour Fee:' : 'Total Package Fee:'}</span>
                    <span className="font-bold text-slate-900">₹{selectedPkg.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Advance Token Required ({selectedPkg.advanceTokenPercent}%):</span>
                    <span className="font-bold text-emerald-600">
                      ₹{Math.round((selectedPkg.price * selectedPkg.advanceTokenPercent) / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>{isTravelStore ? 'Trip Duration:' : 'Duration:'}</span>
                    <span className="text-slate-800 font-bold">{selectedPkg.duration}</span>
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
                      <label className="text-slate-700 block mb-1 font-semibold">
                        {isTravelStore ? 'Departure Date *' : 'Event / Service Date *'}
                      </label>
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
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                      >
                        <option value="" disabled>Select a time slot</option>
                        <option value="Morning (08:00 AM - 12:00 PM)">Morning (08 AM - 12 PM)</option>
                        <option value="Afternoon (12:00 PM - 04:00 PM)">Afternoon (12 PM - 04 PM)</option>
                        <option value="Sunset / Evening (04:00 PM - 08:00 PM)">Sunset (04 PM - 08 PM)</option>
                        <option value="Full Day">Full Day</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1 font-semibold">
                      {isTravelStore ? 'Pickup City / Starting Point' : 'Service Location'}
                    </label>
                    <input
                      type="text"
                      placeholder={isTravelStore ? 'e.g. Pickup point or meeting location' : 'e.g. Venue or service location'}
                      value={bookingLocation}
                      onChange={(e) => setBookingLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1 font-semibold">
                      {isTravelStore ? 'Passenger Count & Special Requests' : 'Specific Requirements / Notes'}
                    </label>
                    <textarea
                      rows="2"
                      placeholder={isTravelStore ? "e.g. 2 Adults, 1 Child. Need vegetarian campfire dinner, extra tent" : "Any specific themes, drone requirements, or questions..."}
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
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isBookingSubmitting ? (
                      'Reserving Dates...'
                    ) : (
                      <>
                        <span>{isTravelStore ? 'Reserve Tour Departure & Seats' : 'Submit Booking Request'}</span>
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
                    <span className="font-semibold text-slate-900">
                      {new Date(placedBooking.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Fee:</span>
                    <span className="font-bold text-slate-900">₹{placedBooking.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Token Due:</span>
                    <span className="font-bold text-emerald-700">
                      ₹{placedBooking.expectedAdvance ?? Math.round((placedBooking.totalAmount * (placedBooking.advanceTokenPercent || 20)) / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment:</span>
                    <span className="font-semibold text-amber-700">
                      Not collected — pay the token after the studio confirms availability
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="text-amber-700 font-semibold">{placedBooking.bookingStatus}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {storeWhatsAppPhone && (
                    <a
                      href={`https://wa.me/91${storeWhatsAppPhone}?text=${encodeURIComponent(
                        `Hi! I have requested booking ${placedBooking.bookingNumber} for ${placedBooking.packageName} on ${store.businessName}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" /> Connect with Studio on WhatsApp
                    </a>
                  )}
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
      {isExitPopupOpen && exitCoupon && (
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
                Store Offer
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                {exitCouponLabel} with {exitCoupon.code}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {exitCoupon.title || 'This offer is available on eligible orders.'} Enter your
                WhatsApp number to save this offer and continue.
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
                  <Sparkles className="w-4 h-4" /> Show My Offer
                </button>
              </form>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-emerald-800">Offer ready</div>
                <div className="bg-white border border-dashed border-emerald-400 py-2 px-4 rounded-xl text-emerald-600 font-black text-base tracking-wider">
                  {exitCoupon.code}
                </div>
                <p className="text-[11px] text-emerald-700">Use this coupon code at checkout or mention it in the WhatsApp chat.</p>
                <button
                  type="button"
                  onClick={() => {
                    handleApplyCoupon(exitCoupon.code);
                    setIsExitPopupOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95 transition"
                >
                  Apply {exitCoupon.code} &amp; View Cart
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Product Card with Image, Badges, Variant Selector & Instant-Cart Stepper
const ProductCard = ({ product, cart = [], onAddToCart, onUpdateQty, onOpenCart }) => {
  const rawBasePrice = parseMoney(product.price);
  const configuredVariants = (product.jars && product.jars.length > 0)
    ? product.jars
    : (product.variants || []);
  const hasConfiguredVariants = configuredVariants.length > 0;
  const availableVariants = configuredVariants.filter(
    (variant) => variant.enabled !== false && variant.isAvailable !== false
  );

  const [selectedVariant, setSelectedVariant] = useState(availableVariants[0] || null);
  const currentVariant = selectedVariant || availableVariants[0] || null;

  const variantPrice = parseMoney(currentVariant?.price);
  const price = variantPrice ?? rawBasePrice;

  const parsedCompareAt = parseMoney(currentVariant?.compareAtPrice || product.compareAtPrice);
  const compareAt = parsedCompareAt && price && parsedCompareAt > price ? parsedCompareAt : null;
  const discountPercent =
    compareAt && price ? Math.round(((compareAt - price) / compareAt) * 100) : null;

  const variantName = currentVariant?.name || product.variant || '';
  const prodId = product._id || product.id || product.name;

  const trackedStock = Number(product.stockQuantity);
  const variantStock = availableVariants.reduce(
    (sum, variant) => sum + (Number(variant.stockQuantity) || 0),
    0
  );
  const inStock =
    product.isAvailable !== false &&
    (!hasConfiguredVariants || availableVariants.length > 0) &&
    (!product.trackQuantity ||
      (hasConfiguredVariants
        ? variantStock > 0
        : Number.isFinite(trackedStock) && trackedStock > 0));

  // Keep the cart view synchronized with stored cart state
  const cartItem = cart.find(
    (item) => item.productId === prodId && item.variantName === variantName
  );
  const cartQty = cartItem ? cartItem.quantity : 0;

  const productImage =
    product.img ||
    product.image ||
    (Array.isArray(product.images) && product.images.length > 0 && product.images[0] ? product.images[0] : null) ||
    NO_IMAGE_PLACEHOLDER;

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
              NO_IMAGE_PLACEHOLDER;
          }}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/10" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider bg-black/60 backdrop-blur-md border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-400" /> {product.tags[0]}
            </span>
          )}
          {discountPercent && (
            <span className="text-[10px] font-black text-white bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`text-[10px] font-semibold backdrop-blur-md border px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs ${
              inStock
                ? 'text-emerald-700 bg-white/90 border-emerald-300'
                : 'text-rose-700 bg-white/90 border-rose-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                inStock ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            ></span>{' '}
            {inStock ? 'In Stock' : 'Out of Stock'}
          </span>
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

          {/* Available Variant Selector */}
          {availableVariants?.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Available Options:</span>
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
                  const vPrice = parseMoney(v.price) ?? rawBasePrice;
                  return (
                    <button
                      key={v._id || `${v.name}-${i}`}
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
                        {vPrice ? `₹${vPrice}` : 'Price unavailable'}
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
                <span className="text-xl font-black text-slate-900">
                  {price ? `₹${price}` : 'Price unavailable'}
                </span>
                {compareAt && price && (
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
                  } else if (inStock && price) {
                    // Instantly adds to cart on quantity increase
                    onAddToCart(product, currentVariant, false, 1);
                  }
                }}
                disabled={!inStock || !price}
                className={`w-8 h-8 flex items-center justify-center text-white rounded-lg shadow-xs transition active:scale-90 ${
                  inStock && price
                    ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
                title={inStock ? 'Increase Quantity' : 'Out of Stock'}
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
                onClick={() => {
                  if (inStock && price) onAddToCart(product, currentVariant, false, 1);
                }}
                disabled={!inStock || !price}
                className={`flex-1 py-2.5 px-3 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 ${
                  inStock && price
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25 cursor-pointer'
                    : 'bg-slate-300 shadow-transparent cursor-not-allowed'
                }`}
                title={inStock ? 'Add Item to Cart' : 'Out of Stock'}
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="truncate">{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
