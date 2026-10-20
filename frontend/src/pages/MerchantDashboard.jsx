import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import {
  LayoutDashboard,
  Users2,
  Users,
  Package,
  ShoppingBag,
  Boxes,
  Camera,
  Compass,
  Megaphone,
  Zap,
  ShieldCheck,
  Share2,
  BarChart3,
  Settings,
  Search,
  SlidersHorizontal,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  X,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  Truck,
  Check,
  Phone,
  Mail,
  ExternalLink,
  LogOut,
  Sparkles,
  TrendingUp,
  CreditCard,
  Building2,
  Filter,
  DollarSign,
  FileText,
  RefreshCw,
  Eye,
  Printer,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  MessageCircle,
  LayoutGrid,
  List,
  UserPlus,
  Play,
  Trash2,
  History,
  Lock,
  Unlock,
  UserCheck,
  Bot,
  Send,
  Copy,
  Cpu,
  MessageSquare,
  CircleDot,
  PieChart,
  Activity,
  Target,
  Store,
  QrCode,
  Smartphone,
  Monitor,
  Ticket,
  Tag,
  Percent,
  BadgePercent,
  Gift,
} from 'lucide-react';
import axios from 'axios';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { MarketingAdsHub } from '../components/marketing/MarketingAdsHub';
import { MetaTrackingSettings } from '../components/marketing/MetaTrackingSettings';
import { MetaAdsIntegration } from '../components/marketing/MetaAdsIntegration';
import { BillingSettings } from '../components/subscription/BillingSettings';
import { AutomationManager } from '../components/automation/AutomationManager';
import { IntegrationsManager } from '../components/integrations/IntegrationsManager';
import { NO_IMAGE_PLACEHOLDER } from '../utils/imagePlaceholder';


const formatDateInput = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) return new Date(NaN);
  return new Date(year, month - 1, day);
};

export const MerchantDashboard = () => {
  const { user, tenant, logout } = useAuth();
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Tab alias normalizer to ensure shortcuts like /services or /tours map cleanly to full modules
  const normalizeTab = (raw) => {
    if (!raw) return 'overview';
    const lower = String(raw).toLowerCase().trim();
    if (['services', 'service', 'service-booking', 'service-bookings', 'shoots', 'shoot', 'appointments', 'appointment'].includes(lower)) {
      return 'service-bookings';
    }
    if (['travel', 'travels', 'travel-booking', 'travel-bookings', 'tours', 'tour', 'safari', 'safaris', 'rides', 'riding', 'trip', 'trips'].includes(lower)) {
      return 'travel-bookings';
    }
    return lower;
  };

  // Active module page driven by URL route /merchant/:pageId
  const [activeTab, setActiveTabState] = useState(normalizeTab(pageId || searchParams.get('tab')));
  const [settingsSubTab, setSettingsSubTab] = useState(searchParams.get('sub') || 'profile');

  // Synchronize activeTab with URL route changes
  useEffect(() => {
    const currentRoutePage = normalizeTab(pageId || searchParams.get('tab'));
    if (currentRoutePage && currentRoutePage !== activeTab) {
      setActiveTabState(currentRoutePage);
    }
  }, [pageId, searchParams]);

  // Navigate to dedicated page URL when changing page/module
  const setActiveTab = (tab) => {
    const target = normalizeTab(tab);
    setActiveTabState(target);
    navigate(`/merchant/${target}`);
  };

  // Update browser window title dynamically for true separate page feeling
  useEffect(() => {
    const pageTitles = {
      overview: 'Overview & Analytics',
      orders: 'Orders & Fulfillment',
      products: 'Products Catalog',
      categories: 'Categories Showcase',
      coupons: 'Coupons & Promo Offers',
      'customer-view': 'Customer View (Storefront)',
      leads: 'Leads & CRM Pipeline',
      customers: 'Customers Directory',
      'ai-insights': 'Business Insights',
      marketing: 'Marketing & Meta Ads',
      automations: 'Automations Engine',
      staff: 'Staff & Roles',
      integrations: 'Integrations Hub',
      reports: 'Reports & Audits',
      'service-bookings': 'Service Bookings & Studio Shoots',
      'travel-bookings': 'Travel Tours & Safari Expeditions',
      billing: 'Subscription & Billing',
      settings: 'Store Settings'
    };
    const currentTitle = pageTitles[activeTab] || 'Merchant Dashboard';
    document.title = `${currentTitle} | Omniva Merchant`;
  }, [activeTab]);
  const mainContentRef = useRef(null);
  const [storePreviewDevice, setStorePreviewDevice] = useState('desktop');

  // Business Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadNotifsCount = notifications.filter(n => n.unread).length;

  // Auto-scroll main content container to top whenever active tab changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [activeTab, settingsSubTab]); // overview, leads, customers, products, orders, inventory, service-bookings, travel-bookings, marketing, automations, staff, integrations, reports, settings, billing
  const [searchTerm, setSearchTerm] = useState('');

  // Merchant Details
  const businessName = tenant?.businessName || '';
  const businessSlug = tenant?.slug || '';
  const planName = tenant?.planTier
    ? `${tenant.planTier.charAt(0)}${tenant.planTier.slice(1).toLowerCase()} plan`
    : 'No plan loaded';

  // Dynamic Date Range Filter State (Pure Calendar Controlled)
  const today = new Date();
  const todayStr = formatDateInput(today);
  const monthStartStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const [datePreset, setDatePreset] = useState('ALL');
  const [startDate, setStartDate] = useState(monthStartStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Interactive Visual Calendar Range Picker State
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calPickerYear, setCalPickerYear] = useState(new Date().getFullYear());
  const [calPickerMonth, setCalPickerMonth] = useState(new Date().getMonth());
  const [selectedRangeStart, setSelectedRangeStart] = useState(monthStartStr);
  const [selectedRangeEnd, setSelectedRangeEnd] = useState(todayStr);

  // Interactive Order Processing State
  const [orderPipelineTab, setOrderPipelineTab] = useState('ALL'); // ALL, NEW, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  const [orderSourceFilter, setOrderSourceFilter] = useState('ALL'); // ALL, INSTAGRAM, FACEBOOK, WHATSAPP, WEBSITE
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [autoNotifyWhatsApp, setAutoNotifyWhatsApp] = useState(true);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Customer requested address change / cancellation');
  const [actionSuccessToast, setActionSuccessToast] = useState('');
  const [actionErrorToast, setActionErrorToast] = useState('');

  const showActionError = (message) => {
    setActionErrorToast(message);
    setTimeout(() => setActionErrorToast(''), 6000);
  };

  // Staff Accounts & Granular Permissions State
  const INITIAL_STAFF_LIST = [];

  const [staffList, setStaffList] = useState(INITIAL_STAFF_LIST);
  const [teamMembers, setTeamMembers] = useState(INITIAL_STAFF_LIST);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState(null);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [simulatedStaffId, setSimulatedStaffId] = useState(null); // null = Merchant Admin (Owner view)
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Packing & Kitchen Staff',
    orderScope: 'CONFIRMED_ONLY',
    allowedOrderStatuses: ['CONFIRMED', 'PROCESSING'],
    modules: ['orders'],
    canAcceptOrders: false,
    canPackOrders: true,
    canDispatchOrders: true,
    canCancelOrders: false,
    canViewRevenue: false
  });

  const getOrderSourceMeta = (source) => {
    switch (source) {
      case 'INSTAGRAM':
        return {
          label: 'Instagram Ad',
          badge: 'bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 border-pink-200',
          icon: '📸',
          textColor: 'text-pink-700',
          dotColor: 'bg-pink-500'
        };
      case 'FACEBOOK':
        return {
          label: 'Facebook Ad',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: '🔵',
          textColor: 'text-blue-700',
          dotColor: 'bg-blue-600'
        };
      case 'WHATSAPP':
        return {
          label: 'WhatsApp Direct',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: '💬',
          textColor: 'text-emerald-700',
          dotColor: 'bg-emerald-500'
        };
      case 'WEBSITE':
        return {
          label: 'Storefront Website',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: '🌐',
          textColor: 'text-indigo-700',
          dotColor: 'bg-indigo-600'
        };
      default:
        return {
          label: 'Direct Order',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: '📦',
          textColor: 'text-slate-700',
          dotColor: 'bg-slate-500'
        };
    }
  };

  // Category and Product Image Showcase State
  const [productsActiveSubTab, setProductsActiveSubTab] = useState('catalog'); // 'catalog' | 'categories'
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryPhotoUrl, setCategoryPhotoUrl] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Advanced AI Copilot & Business Engine State
  const [aiActiveSubTab, setAiActiveSubTab] = useState('copilot'); // 'copilot' | 'forecast' | 'copywriter' | 'rto-radar'
  const [aiUserPrompt, setAiUserPrompt] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiRiskScanCompleted, setAiRiskScanCompleted] = useState(false);
  const [selectedCopyCategory, setSelectedCopyCategory] = useState('festival'); // 'festival' | 'cod-confirm' | 'review' | 'meta-reel'
  const [editableCopyText, setEditableCopyText] = useState('');
  const [aiActionNotice, setAiActionNotice] = useState('');
  const [overviewChartMode, setOverviewChartMode] = useState('bar'); // 'bar' | 'circular'

  const AI_COPY_TEMPLATES = {
    festival: {
      title: '🎁 Festive Flash Sale Broadcast (Festive Offer)',
      audience: 'All WhatsApp Contacts & Storefront Customers',
      text: `✨ A festive offer from ${businessName || 'our store'} ✨\n\nHello, we have a special offer for you.\n\n👉 Order online: ${businessSlug ? `${window.location.origin}/store/${businessSlug}` : 'Use your storefront link'}\nAdd an active coupon code before sending this message.`
    },
    'cod-confirm': {
      title: '💬 COD Order Verification & Address Check (RTO Prevention)',
      audience: 'New Cash on Delivery Buyers',
      text: `Hello {CustomerName}! 🙏\n\nWe received your order #{OrderId} (₹{OrderTotal}) at ${businessName || 'our store'}.\n\n📍 Delivery Address: {Address}\n\nPlease reply *YES* to verify your delivery address before dispatch. Thank you!`
    },
    review: {
      title: '⭐️ 5-Star Review & Repeat Order Code (Post-Delivery Feedback)',
      audience: 'Delivered Order Customers (3 Days Post-Delivery)',
      text: `Hello {CustomerName}!\n\nThank you for ordering from ${businessName || 'our store'}. If you enjoyed your purchase, please reply with your feedback.\n\nAdd an active repeat-purchase coupon before sending this message.`
    },
    'meta-reel': {
      title: '📸 Instagram Reel Caption & Hashtag Starter',
      audience: 'Instagram Reel & Facebook Post Ad Creative',
      text: `Discover the latest products from ${businessName || 'our store'}. 🛍️\n\nBrowse current prices, variants and availability on our storefront:\n${businessSlug ? `${window.location.origin}/store/${businessSlug}` : 'Add your storefront link before posting.'}\n\nAdd the real product details and any active coupon before publishing. Avoid unverified claims about ingredients, certifications or discounts.\n\n#${(businessName || 'Shop').replace(/[^a-zA-Z0-9]/g, '')} #ShopSmall #NewArrivals`
    }
  };

  const [aiChatMessages, setAiChatMessages] = useState([
    {
      id: 'msg_welcome',
      sender: 'ai',
      time: 'Just now',
      text: `Hello ${user?.name || 'there'}! I can answer questions using the orders, products and CRM data currently loaded in this dashboard for ${businessName || 'your store'}. I will say when information is not available instead of inventing campaign or profit numbers.\n\nTry asking:\n• "How many COD orders need an address check?"\n• "What is my current order revenue?"\n• "Which products are low on stock?"\n• "Is Meta connected?"`
    }
  ]);

  const handleSendAiMessage = (queryText) => {
    const q = (queryText || aiUserPrompt).trim();
    if (!q) return;

    const userMsg = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      time: 'Just now',
      text: q
    };

    setAiChatMessages(prev => [...prev, userMsg]);
    setAiUserPrompt('');
    setIsAiThinking(true);

    setTimeout(() => {
      const qLower = q.toLowerCase();
      const parseAmount = (value) => Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;
      const activeOrders = ordersList.filter(o => o.status !== 'CANCELLED');
      const codOrders = activeOrders.filter(o => /cod|cash/i.test(String(o.pay || o.paymentMethod || '')));
      const flaggedCod = codOrders.filter(o => {
        const address = String(o.address || '').trim();
        return parseAmount(o.total) >= 1000 || address.length < 12;
      });
      let aiResponseText = '';

      if (qLower.includes('margin') || qLower.includes('profit') || qLower.includes('bika') || qLower.includes('selling')) {
        aiResponseText = `**Profit and margin**\n\nCost prices and line-item sales history are not exposed in this dashboard, so I cannot calculate a real gross margin. I will not estimate one.\n\nTo enable margin reporting, store a cost price on each product and variant and keep order line items populated. The live order list currently has **${activeOrders.length}** non-cancelled order(s).`;
      } else if (qLower.includes('meta') || qLower.includes('ad') || qLower.includes('insta') || qLower.includes('facebook') || qLower.includes('spend') || qLower.includes('roas')) {
        const metaEnabled = Boolean(tenant?.integrations?.meta?.enabled || tenant?.settings?.metaPixelId);
        aiResponseText = metaEnabled
          ? `**Meta integration**\n\nMeta is marked as configured for this store, but Omniva does not currently load campaign-level spend or ROAS into this dashboard. I cannot compare Instagram and Facebook without a synced campaign report.\n\nCurrent Meta status: **${tenant?.integrations?.meta?.status || 'CONFIGURED'}**.`
          : `**Meta integration**\n\nMeta is not connected for this store. No Pixel, CAPI or campaign-spend data is available, so there is no real ROAS to report. Open Marketing → Integrations to connect it.`;
      } else if (qLower.includes('rto') || qLower.includes('cod') || qLower.includes('return') || qLower.includes('fraud') || qLower.includes('cancel')) {
        const codPercent = activeOrders.length ? Math.round((codOrders.length / activeOrders.length) * 100) : 0;
        aiResponseText = `**COD and address review**\n\n• Active non-cancelled orders: **${activeOrders.length}**\n• COD orders: **${codOrders.length}** (${codPercent}%)\n• COD orders needing an address check: **${flaggedCod.length}**\n\nThe address check flags COD orders over ₹1,000 or with fewer than 12 address characters. It is a rule-based review, not a fraud probability. Open the RTO Radar tab to contact the real customers.`;
      } else if (qLower.includes('stock') || qLower.includes('inventory') || qLower.includes('forecast') || qLower.includes('tyohar') || qLower.includes('diwali')) {
        const lowStock = productsList.filter(p => {
          const stock = Number(p.stock ?? p.stockQuantity ?? 0);
          return Number.isFinite(stock) && stock < 10;
        });
        aiResponseText = lowStock.length
          ? `**Live inventory**\n\n${lowStock.length} product(s) are below 10 units:\n${lowStock.slice(0, 8).map(p => `• ${p.name}: ${p.stock ?? p.stockQuantity}`).join('\n')}\n\nDemand forecasting is not available because Omniva does not store enough historical line-item demand here. This is a current stock count, not a projection.`
          : `**Live inventory**\n\nNo loaded product is below 10 units. I cannot project festive demand without historical line-item sales data, so no stockout forecast is claimed.`;
      } else {
        const revenue = activeOrders.reduce((sum, o) => sum + parseAmount(o.total), 0);
        const pending = activeOrders.filter(o => ['NEW', 'CONFIRMED', 'PROCESSING'].includes(String(o.status || '').toUpperCase())).length;
        aiResponseText = `**Loaded store summary**\n\n• Non-cancelled orders: **${activeOrders.length}**\n• Order value: **₹${revenue.toLocaleString('en-IN')}**\n• Orders still open: **${pending}**\n• CRM leads loaded: **${crmLeads.length}**\n\nI only use data currently loaded from your tenant. I will not fabricate ad spend, margins, health scores or demand forecasts.`;
      }

      setAiChatMessages(prev => [
        ...prev,
        {
          id: 'msg_' + Date.now(),
          sender: 'ai',
          time: 'Just now',
          text: aiResponseText
        }
      ]);
      setIsAiThinking(false);
    }, 450);
  };

  // Rich Orders State with Full Lifecycle & Customer Details
  const [ordersList, setOrdersList] = useState([]);

  // Categories Showcase State with Authentic Photos
  const [categoriesList, setCategoriesList] = useState([]);

  // Dynamic Date Filter & Range Calculations
  const dateFilteredOrders = ordersList.filter(o => {
    if (datePreset !== 'ALL') {
      if (startDate && o.date < startDate) return false;
      if (endDate && o.date > endDate) return false;
    }
    if (searchTerm.trim()) {
      const tokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
      const searchable = `${o.customer || ''} ${o.id || ''} ${o.orderNumber || ''} ${o.phone || ''} ${o.itemSummary || ''} ${o.email || ''} ${o.city || ''} ${o.status || ''} ${o.paymentMethod || ''}`.toLowerCase();
      const match = tokens.every(t => searchable.includes(t));
      if (!match) return false;
    }
    return true;
  });

  const activeSimulatedStaff = staffList.find(s => s.id === simulatedStaffId);

  // Duplicate / Double Order Detection Helper
  // Detects if the same customer placed another active/recent order
  const getDuplicateOrdersForOrder = (targetOrder, allOrders) => {
    if (!targetOrder || !allOrders) return [];
    if (targetOrder.duplicateResolved) return [];
    if (targetOrder.status === 'CANCELLED') return [];

    const cleanPhone = (p) => (p || '').replace(/[^0-9]/g, '').slice(-10);
    const targetPhone = cleanPhone(targetOrder.phone);
    const targetEmail = (targetOrder.email || '').trim().toLowerCase();
    const targetCustomer = (targetOrder.customer || '').trim().toLowerCase();

    const parseTime = (order) => {
      if (order.createdAt) {
        const t = new Date(order.createdAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (order.date) {
        const t = new Date(order.date).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      return 0;
    };

    const targetTime = parseTime(targetOrder);

    return allOrders.filter(o => {
      if (o.id === targetOrder.id) return false;
      if (o._id && targetOrder._id && String(o._id) === String(targetOrder._id)) return false;
      if (o.status === 'CANCELLED') return false;
      if (o.duplicateResolved) return false;

      // Time proximity check: Duplicate orders occur within 48 hours of each other
      const oTime = parseTime(o);
      if (targetTime > 0 && oTime > 0) {
        const diffHours = Math.abs(targetTime - oTime) / (1000 * 60 * 60);
        if (diffHours > 48) return false;
      } else if (targetOrder.date && o.date && targetOrder.date !== o.date) {
        return false;
      }

      const oPhone = cleanPhone(o.phone);
      let phoneMatch = false;
      if (targetPhone && oPhone && targetPhone.length >= 10 && targetPhone === oPhone) {
        const nameA = targetCustomer;
        const nameB = (o.customer || '').trim().toLowerCase();
        const sameName = Boolean(nameA && nameB && (nameA === nameB || nameA.includes(nameB) || nameB.includes(nameA)));
        
        const pinA = (targetOrder.address || '').match(/\b\d{6}\b/)?.[0] || '';
        const pinB = (o.address || '').match(/\b\d{6}\b/)?.[0] || '';
        const samePin = Boolean(pinA && pinB && pinA === pinB);

        const itemA = (targetOrder.itemSummary || '').toLowerCase();
        const itemB = (o.itemSummary || '').toLowerCase();
        const sameItem = Boolean(itemA && itemB && itemA === itemB);

        // Genuine duplicate orders share customer name, delivery pincode, or cart items
        if (sameName || samePin || sameItem || (!nameA && !nameB)) {
          phoneMatch = true;
        }
      }
      
      const oEmail = (o.email || '').trim().toLowerCase();
      const emailMatch = Boolean(targetEmail && oEmail && !targetEmail.includes('@example.com') && targetEmail === oEmail);

      const oCustomer = (o.customer || '').trim().toLowerCase();
      const customerMatch = Boolean(targetCustomer && oCustomer && targetCustomer === oCustomer && targetOrder.date === o.date);

      return phoneMatch || emailMatch || customerMatch;
    });
  };

  // Helper to generate the courier tracking link
  const getCourierTrackingUrl = (courier, tracking, orderNumber, phone) => {
    const trk = (tracking || '').trim();
    const c = (courier || '').toLowerCase();
    if (c.includes('delhivery')) {
      return `https://www.delhivery.com/track/package/${trk}`;
    }
    if (c.includes('bluedart')) {
      return `https://www.bluedart.com/tracking?trackFor=0&trackNo=${trk}`;
    }
    if (c.includes('xpressbees')) {
      return `https://www.xpressbees.com/shipment/tracking?awbNo=${trk}`;
    }
    if (c.includes('speed post') || c.includes('india post')) {
      return `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx`;
    }
    if (c.includes('dtdc')) {
      return `https://www.dtdc.in/tracking/tracking_results.asp?Tno=${trk}`;
    }
    return `/track?orderNumber=${encodeURIComponent(orderNumber || '')}&phone=${encodeURIComponent((phone || '').replace(/[^0-9]/g, '').slice(-10))}`;
  };

  // Helper to generate automated tracking message for WhatsApp/SMS
  const generateTrackingMessage = (order, courier, tracking) => {
    if (!order) return '';
    const cleanPhone = (order.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const trackingUrl = getCourierTrackingUrl(courier, tracking, order.orderNumber || order.id, cleanPhone);
    const fullTrackingUrl = trackingUrl.startsWith('http') ? trackingUrl : `${window.location.origin}${trackingUrl}`;

    return `Hello ${order.customer || 'customer'}! 🙏\n\nYour order ${order.orderNumber || order.id} from ${businessName || 'our store'} has been marked shipped.\n\n🚚 Courier Partner: ${courier}\n🔢 Tracking No (AWB): ${tracking}\n🔗 Tracking link: ${fullTrackingUrl}\n\nThank you for shopping with us.`;
  };

  // Scope orders by simulated staff role permissions (e.g. Confirmed Only, Pending Only, All)
  const staffScopedOrders = dateFilteredOrders.filter(o => {
    if (activeSimulatedStaff && activeSimulatedStaff.allowedOrderStatuses && activeSimulatedStaff.allowedOrderStatuses.length > 0) {
      return activeSimulatedStaff.allowedOrderStatuses.includes(o.status);
    }
    return true;
  });

  // Calculate duplicate orders count
  const duplicateOrdersList = staffScopedOrders.filter(o => {
    if (o.status === 'CANCELLED' || o.duplicateResolved) return false;
    const dupes = getDuplicateOrdersForOrder(o, ordersList);
    return dupes.length > 0;
  });
  const duplicateOrdersCount = duplicateOrdersList.length;

  const displayOrders = staffScopedOrders.filter(o => {
    if (orderPipelineTab === 'DUPLICATES') {
      if (o.status === 'CANCELLED' || o.duplicateResolved) return false;
      const dupes = getDuplicateOrdersForOrder(o, ordersList);
      if (dupes.length === 0) return false;
    } else if (orderPipelineTab !== 'ALL' && o.status !== orderPipelineTab) {
      return false;
    }
    if (orderSourceFilter !== 'ALL' && (o.source || 'UNATTRIBUTED') !== orderSourceFilter) return false;
    return true;
  });

  const rangeTotalOrders = staffScopedOrders.length;
  const rangeRevenue = staffScopedOrders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  const rangePendingCount = staffScopedOrders.filter(o => o.status === 'NEW' || o.status === 'CONFIRMED').length;
  const rangeProcessingCount = staffScopedOrders.filter(o => o.status === 'PROCESSING').length;
  const rangeShippedCount = staffScopedOrders.filter(o => o.status === 'SHIPPED').length;
  const rangeDeliveredCount = staffScopedOrders.filter(o => o.status === 'DELIVERED').length;
  const rangeCancelledCount = staffScopedOrders.filter(o => o.status === 'CANCELLED').length;
  const rangeCodOrders = staffScopedOrders.filter(o => /cod|cash/i.test(String(o.pay || o.paymentMethod || '')));
  const rangePrepaidOrders = staffScopedOrders.filter(o =>
    /online|upi|prepaid|razorpay|card/i.test(String(o.pay || o.paymentMethod || ''))
  );
  const rangePaidOrdersCount = rangeCodOrders.length + rangePrepaidOrders.length;
  const rangeCodPct = rangePaidOrdersCount
    ? Math.round((rangeCodOrders.length / rangePaidOrdersCount) * 100)
    : 0;
  const rangePrepaidPct = rangePaidOrdersCount ? 100 - rangeCodPct : 0;
  const rangeNonCancelledOrders = staffScopedOrders.filter(o => o.status !== 'CANCELLED');
  const rangeAverageOrderValue = rangeNonCancelledOrders.length
    ? Math.round(rangeRevenue / rangeNonCancelledOrders.length)
    : 0;
  const lowStockProducts = productsList.filter((product) => {
    if (product.trackQuantity === false) return false;
    const stock = Number(product.stock ?? product.stockQuantity);
    return Number.isFinite(stock) && stock < 10;
  });
  const outOfStockProducts = productsList.filter((product) => {
    if (product.trackQuantity === false) return false;
    const stock = Number(product.stock ?? product.stockQuantity);
    return Number.isFinite(stock) && stock <= 0;
  });
  const trackedProducts = productsList.filter((product) => product.trackQuantity !== false);
  const stockTableProducts = [...trackedProducts]
    .sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0))
    .slice(0, 8);

  // Auto-arrange daily chart data based on selected date window
  const dailyChartData = (() => {
    if (!startDate || !endDate) return [];
    const list = [];
    const [sY, sM, sD] = startDate.split('-').map(Number);
    const [eY, eM, eD] = endDate.split('-').map(Number);
    let curr = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);
    let count = 0;
    while (curr <= end && count < 60) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayLabel = curr.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

      const dayOrders = ordersList.filter(o => o.date === dateStr && o.status !== 'CANCELLED');
      const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const dayOrderCount = dayOrders.length;

      list.push({ dateStr, dayLabel, revenue: dayRevenue, count: dayOrderCount });
      curr.setDate(curr.getDate() + 1);
      count++;
    }
    return list;
  })();

  const maxDailyRevenue = Math.max(...dailyChartData.map(d => d.revenue), 1000);

  // Dynamic baseline for prior period of same duration
  const startD = parseDateInput(startDate);
  const endD = parseDateInput(endDate);
  const durationMs = endD.getTime() - startD.getTime();
  const priorStartD = new Date(startD.getTime() - durationMs - (24 * 60 * 60 * 1000));
  const priorEndD = new Date(startD.getTime() - (24 * 60 * 60 * 1000));
  const priorStartStr = formatDateInput(priorStartD);
  const priorEndStr = formatDateInput(priorEndD);

  const priorPeriodOrders = ordersList.filter(o => o.date >= priorStartStr && o.date <= priorEndStr && o.status !== 'CANCELLED');
  const priorPeriodRevenue = priorPeriodOrders.reduce((sum, o) => sum + o.total, 0);

  const growthRate = priorPeriodRevenue > 0
    ? Number((((rangeRevenue - priorPeriodRevenue) / priorPeriodRevenue) * 100).toFixed(1))
    : null;
  const growthRateLabel = growthRate === null
    ? 'Not comparable'
    : `${growthRate >= 0 ? '+' : ''}${growthRate}%`;
  const growthTone = growthRate === null
    ? 'text-slate-500'
    : growthRate >= 0
    ? 'text-emerald-600'
    : 'text-rose-600';

  // Interactive Calendar Grid Generator
  const getCalendarDays = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    const prevMonthTotal = new Date(year, month, 0).getDate();
    for (let i = offset - 1; i >= 0; i--) {
      days.push({ day: prevMonthTotal - i, isCurrentMonth: false, dateStr: '' });
    }
    for (let d = 1; d <= totalDays; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      days.push({ day: d, isCurrentMonth: true, dateStr });
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, isCurrentMonth: false, dateStr: '' });
    }
    return days;
  };

  const handleCalendarDayClick = (dayStr) => {
    if (!dayStr) return;
    if (!selectedRangeStart || (selectedRangeStart && selectedRangeEnd && selectedRangeStart !== selectedRangeEnd)) {
      setSelectedRangeStart(dayStr);
      setSelectedRangeEnd(dayStr);
    } else {
      if (dayStr < selectedRangeStart) {
        setSelectedRangeStart(dayStr);
        setSelectedRangeEnd(selectedRangeStart);
      } else {
        setSelectedRangeEnd(dayStr);
      }
    }
  };

  const handleConfirmCalendarRange = () => {
    setStartDate(selectedRangeStart);
    setEndDate(selectedRangeEnd);
    setDatePreset('CUSTOM');
    setShowCalendarModal(false);
    setActionSuccessToast(`Date range adjusted: ${selectedRangeStart} to ${selectedRangeEnd}. Auto-arranged all metrics!`);
    setTimeout(() => setActionSuccessToast(''), 4500);
  };

  const requireServerOrder = (order) => {
    const identifier = order?._id || order?.orderNumber;
    if (!identifier) {
      throw new Error('This order has no server identifier. Refresh the order list and try again.');
    }
    return identifier;
  };

  const patchOrderOnServer = async (order, payload) => {
    const identifier = requireServerOrder(order);
    const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
    const res = await axios.patch(
      `/api/orders/${identifier}/status`,
      payload,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Order update was rejected by the server.');
    }
    return res.data.data || res.data;
  };

  // Order Lifecycle Handlers
  const handleAcceptOrder = async (orderId) => {
    const target = ordersList.find(o => 
      o.id === orderId || 
      o.orderNumber === orderId || 
      o._id === orderId || 
      o.id === `#${orderId}` || 
      orderId === `#${o.orderNumber}`
    );
    if (!target) {
      showActionError('Order not found. Refresh the order list and try again.');
      return;
    }
    try {
      await patchOrderOnServer(target, { orderStatus: 'CONFIRMED' });
    } catch (err) {
      showActionError(err.response?.data?.message || err.message || 'Could not accept the order.');
      return;
    }
    setOrdersList(prev => prev.map(o => {
      if (o.id === orderId || o.orderNumber === orderId || o._id === target._id) {
        return {
          ...o,
          status: 'CONFIRMED',
          statusLabel: 'Accepted / Confirmed',
          statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
          timeline: Array.isArray(o.timeline) ? o.timeline.map((t, idx) => idx === 1 ? { ...t, time: 'Accepted just now by merchant', done: true } : t) : []
        };
      }
      return o;
    }));
    setActionSuccessToast(`Order ${orderId} accepted and confirmed.`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  const handleMarkReadyToPack = async (orderId) => {
    const target = ordersList.find(o => 
      o.id === orderId || 
      o.orderNumber === orderId || 
      o._id === orderId || 
      o.id === `#${orderId}` || 
      orderId === `#${o.orderNumber}`
    );
    if (!target) {
      showActionError('Order not found. Refresh the order list and try again.');
      return;
    }
    try {
      await patchOrderOnServer(target, { orderStatus: 'PROCESSING' });
    } catch (err) {
      showActionError(err.response?.data?.message || err.message || 'Could not mark the order as packed.');
      return;
    }
    setOrdersList(prev => prev.map(o => {
      if (o.id === orderId || o.orderNumber === orderId || o._id === target._id) {
        return {
          ...o,
          status: 'PROCESSING',
          statusLabel: 'Packed / Ready to Ship',
          statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
          timeline: Array.isArray(o.timeline) ? o.timeline.map((t, idx) => idx === 2 ? { ...t, time: 'Packed and boxed just now', done: true } : t) : []
        };
      }
      return o;
    }));
    setActionSuccessToast(`Order ${orderId} marked packed and ready to ship.`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  const handleConfirmBothOrders = async (orderId1, orderId2) => {
    const findOrder = (val) => {
      if (!val) return null;
      return ordersList.find(o =>
        o.id === val ||
        o.orderNumber === val ||
        o._id === val ||
        o.id === `#${val}` ||
        val === `#${o.orderNumber}`
      );
    };

    const o1 = findOrder(orderId1);
    const o2 = findOrder(orderId2);
    if (!o1 || !o2) {
      showActionError('One or both orders are no longer available. Refresh the order list and try again.');
      return;
    }

    const results = await Promise.allSettled([
      patchOrderOnServer(o1, {
        orderStatus: 'CONFIRMED',
        duplicateResolved: true,
        note: 'Customer confirmed both orders are valid'
      }),
      patchOrderOnServer(o2, {
        orderStatus: 'CONFIRMED',
        duplicateResolved: true,
        note: 'Customer confirmed both orders are valid'
      })
    ]);
    const failed = results.filter((result) => result.status === 'rejected');
    if (failed.length > 0) {
      await fetchOrders();
      showActionError(
        failed[0].reason?.response?.data?.message ||
          failed[0].reason?.message ||
          'The server did not confirm both orders. The list was refreshed.'
      );
      return;
    }

    setOrdersList(prev => prev.map(o => {
      const match1 = o1 && (o.id === o1.id || o._id === o1._id);
      const match2 = o2 && (o.id === o2.id || o._id === o2._id);
      if (match1 || match2) {
        return {
          ...o,
          status: 'CONFIRMED',
          statusLabel: 'Accepted / Confirmed',
          statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
          duplicateResolved: true,
          timeline: o.timeline ? o.timeline.map((t, idx) => idx === 1 ? { ...t, time: 'Customer Confirmed Both Orders', done: true } : t) : o.timeline
        };
      }
      return o;
    }));

    setActionSuccessToast(`Both orders (${orderId1} & ${orderId2}) confirmed by the server.`);
    setTimeout(() => setActionSuccessToast(''), 4500);
    setSelectedOrderForDetail(null);
  };

  const handleCancelDuplicateOrder = async (duplicateOrderId, originalOrderId) => {
    if (!window.confirm(`Are you sure you want to cancel duplicate order "${duplicateOrderId}"? The original order "${originalOrderId}" will remain active.`)) return;

    const findOrder = (val) => {
      if (!val) return null;
      return ordersList.find(o =>
        o.id === val ||
        o.orderNumber === val ||
        o._id === val ||
        o.id === `#${val}` ||
        val === `#${o.orderNumber}`
      );
    };

    const dup = findOrder(duplicateOrderId);
    const orig = findOrder(originalOrderId);
    if (!dup) {
      showActionError('The duplicate order is no longer available. Refresh the order list and try again.');
      return;
    }

    const results = await Promise.allSettled([
      patchOrderOnServer(dup, {
        orderStatus: 'CANCELLED',
        duplicateResolved: true,
        note: `Duplicate order cancelled. Customer confirmed only ${originalOrderId} is needed.`
      }),
      ...(orig
        ? [patchOrderOnServer(orig, {
            duplicateResolved: true,
            note: 'Duplicate order resolved. Original order kept.'
          })]
        : [])
    ]);
    const failed = results.filter((result) => result.status === 'rejected');
    if (failed.length > 0) {
      await fetchOrders();
      showActionError(
        failed[0].reason?.response?.data?.message ||
          failed[0].reason?.message ||
          'The server did not confirm the duplicate cancellation. The list was refreshed.'
      );
      return;
    }

    setOrdersList(prev => prev.map(o => {
      if (dup && (o.id === dup.id || o._id === dup._id)) {
        return {
          ...o,
          status: 'CANCELLED',
          statusLabel: 'Cancelled (Duplicate)',
          statusColor: 'bg-rose-50 text-rose-700 border-rose-200',
          duplicateResolved: true,
          cancelReason: `Duplicate of ${originalOrderId}. Customer confirmed only 1 order needed.`
        };
      }
      if (orig && (o.id === orig.id || o._id === orig._id)) {
        return { ...o, duplicateResolved: true };
      }
      return o;
    }));

    setActionSuccessToast(`Duplicate order ${duplicateOrderId} cancelled. Original order ${originalOrderId} remains active.`);
    setTimeout(() => setActionSuccessToast(''), 4500);
    setSelectedOrderForDetail(null);
  };

  const handleMarkAsNotDuplicate = async (orderId1, orderId2) => {
    const findOrder = (val) => {
      if (!val) return null;
      return ordersList.find(o =>
        o.id === val ||
        o.orderNumber === val ||
        o._id === val ||
        o.id === `#${val}` ||
        val === `#${o.orderNumber}`
      );
    };

    const o1 = findOrder(orderId1);
    const o2 = findOrder(orderId2);
    if (!o1 || !o2) {
      showActionError('One or both orders are no longer available. Refresh the order list and try again.');
      return;
    }

    const results = await Promise.allSettled([
      patchOrderOnServer(o1, { duplicateResolved: true, note: 'Verified by merchant - separate valid order' }),
      patchOrderOnServer(o2, { duplicateResolved: true, note: 'Verified by merchant - separate valid order' })
    ]);
    const failed = results.filter((result) => result.status === 'rejected');
    if (failed.length > 0) {
      await fetchOrders();
      showActionError(
        failed[0].reason?.response?.data?.message ||
          failed[0].reason?.message ||
          'The server did not confirm the duplicate review. The list was refreshed.'
      );
      return;
    }

    setOrdersList(prev => prev.map(o => {
      const match1 = o1 && (o.id === o1.id || o._id === o1._id);
      const match2 = o2 && (o.id === o2.id || o._id === o2._id);
      if (match1 || match2) {
        return { ...o, duplicateResolved: true };
      }
      return o;
    }));

    setActionSuccessToast('Orders marked as separate valid orders.');
    setTimeout(() => setActionSuccessToast(''), 4500);
    setSelectedOrderForDetail(null);
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchModalOrder) return;
    const orderId = dispatchModalOrder.id || dispatchModalOrder.orderNumber;
    const finalTracking = String(trackingNumber || '').trim();
    if (!courierName || !courierName.trim()) {
      showActionError('Select the courier partner before dispatching this order.');
      return;
    }
    if (!finalTracking) {
      showActionError('Enter the real courier tracking number before dispatching this order.');
      return;
    }
    const cleanPhone = (dispatchModalOrder.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const trackingUrl = getCourierTrackingUrl(courierName, finalTracking, dispatchModalOrder.orderNumber || dispatchModalOrder.id, cleanPhone);
    const trackingMsg = generateTrackingMessage(dispatchModalOrder, courierName, finalTracking);

    try {
      await patchOrderOnServer(dispatchModalOrder, {
        orderStatus: 'SHIPPED',
        courierPartner: courierName,
        trackingNumber: finalTracking
      });
    } catch (err) {
      showActionError(err.response?.data?.message || err.message || 'Could not mark this order as shipped.');
      return;
    }

    setOrdersList(prev => prev.map(o => {
      if (
        o.id === orderId ||
        o._id === dispatchModalOrder._id ||
        o.orderNumber === dispatchModalOrder.orderNumber
      ) {
        return {
          ...o,
          status: 'SHIPPED',
          statusLabel: 'Shipped / Out for Delivery',
          statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
          courier: courierName,
          tracking: finalTracking,
          trackingUrl,
          trackingMessage: trackingMsg,
          timeline: Array.isArray(o.timeline) ? o.timeline.map((t, idx) => idx === 3 ? { ...t, time: `Dispatched via ${courierName} (${finalTracking})`, done: true } : t) : []
        };
      }
      return o;
    }));

    let whatsappOpened = false;
    if (autoNotifyWhatsApp && cleanPhone) {
      whatsappOpened = Boolean(window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(trackingMsg)}`, '_blank'));
    }

    setDispatchModalOrder(null);
    setTrackingNumber('');
    setActionSuccessToast(
      `Order ${orderId} marked shipped with tracking ${finalTracking}.` +
        (whatsappOpened ? ' WhatsApp message opened for the customer.' : '') +
        (autoNotifyWhatsApp && cleanPhone && !whatsappOpened ? ' The browser blocked the WhatsApp window.' : '')
    );
    setTimeout(() => setActionSuccessToast(''), 5000);
  };

  const handleSendTrackingNotification = (ord) => {
    if (!ord) return;
    if (!ord.tracking) {
      showActionError('This order has no tracking number yet. Dispatch it with a real tracking number first.');
      return;
    }
    const cleanPhone = (ord.phone || '').replace(/[^0-9]/g, '').slice(-10);
    if (!cleanPhone) {
      showActionError('This order has no customer phone number, so WhatsApp cannot be opened.');
      return;
    }
    const trackingMsg = ord.trackingMessage || generateTrackingMessage(ord, ord.courier || courierName, ord.tracking);
    const waWindow = window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(trackingMsg)}`, '_blank');
    if (!waWindow) {
      showActionError('The browser blocked the WhatsApp window. Allow popups and try again.');
      return;
    }
    setActionSuccessToast(`WhatsApp tracking message opened for ${ord.customer || 'the customer'}.`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  const handleBulkSendTracking = () => {
    const shippedOrders = ordersList.filter(o => o.status === 'SHIPPED');
    if (shippedOrders.length === 0) {
      showActionError('No shipped orders are available to notify.');
      return;
    }
    const withTracking = shippedOrders.filter(o => o.tracking);
    if (withTracking.length === 0) {
      showActionError('No shipped order has a tracking number yet. Dispatch orders with real tracking numbers first.');
      return;
    }

    const orderKey = (o) => o.id || o._id || o.orderNumber;
    const openedKeys = new Set();
    let opened = 0;
    let blocked = 0;
    let missingPhone = 0;

    withTracking.forEach(o => {
      const cleanPhone = (o.phone || '').replace(/[^0-9]/g, '').slice(-10);
      if (!cleanPhone) {
        missingPhone += 1;
        return;
      }
      const msg = o.trackingMessage || generateTrackingMessage(o, o.courier || courierName, o.tracking);
      const waWindow = window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
      if (waWindow) {
        opened += 1;
        openedKeys.add(orderKey(o));
      } else {
        blocked += 1;
      }
    });

    const missingTracking = shippedOrders.length - withTracking.length;
    const details = [
      missingTracking > 0 ? `${missingTracking} shipped order(s) have no tracking number` : '',
      missingPhone > 0 ? `${missingPhone} order(s) have no customer phone` : '',
      blocked > 0 ? `${blocked} browser popup(s) were blocked` : '',
    ].filter(Boolean);

    if (opened === 0) {
      showActionError(`No WhatsApp window was opened. ${details.join('. ') || 'Check the order data and browser popup settings.'}`);
    } else if (details.length > 0) {
      showActionError(`Opened ${opened} WhatsApp window(s). ${details.join('. ')}.`);
    } else {
      setActionSuccessToast(`Opened ${opened} WhatsApp tracking window(s).`);
    }
    setTimeout(() => setActionSuccessToast(''), 5000);
  };

  const handleMarkDelivered = async (orderId) => {
    const target = ordersList.find(o => 
      o.id === orderId || 
      o.orderNumber === orderId || 
      o._id === orderId || 
      o.id === `#${orderId}` || 
      orderId === `#${o.orderNumber}`
    );
    if (!target) {
      showActionError('Order not found. Refresh the order list and try again.');
      return;
    }
    if (!window.confirm('Mark this order delivered and record payment as PAID? Continue only if payment has been collected.')) {
      return;
    }
    try {
      await patchOrderOnServer(target, {
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID'
      });
    } catch (err) {
      showActionError(err.response?.data?.message || err.message || 'Could not mark the order as delivered.');
      return;
    }
    setOrdersList(prev => prev.map(o => {
      if (o.id === orderId || o.orderNumber === orderId || o._id === target._id) {
        return {
          ...o,
          status: 'DELIVERED',
          statusLabel: 'Delivered Successfully',
          statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          pay: 'Paid',
          payColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          timeline: Array.isArray(o.timeline) ? o.timeline.map((t, idx) => idx === 4 ? { ...t, time: 'Delivered just now', done: true } : t) : []
        };
      }
      return o;
    }));
    setActionSuccessToast(`Order ${orderId} marked delivered. Payment status was set to PAID.`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    const orderId = cancelModalOrder.id || cancelModalOrder.orderNumber;
    try {
      await patchOrderOnServer(cancelModalOrder, {
        orderStatus: 'CANCELLED',
        note: cancelReason
      });
    } catch (err) {
      showActionError(err.response?.data?.message || err.message || 'Could not cancel the order.');
      return;
    }
    setOrdersList(prev => prev.map(o => {
      if (o.id === orderId || o.orderNumber === orderId || o._id === cancelModalOrder._id) {
        return {
          ...o,
          status: 'CANCELLED',
          statusLabel: 'Cancelled',
          statusColor: 'bg-rose-50 text-rose-700 border-rose-200',
          timeline: Array.isArray(o.timeline) ? [...o.timeline, { title: `Cancelled: ${cancelReason}`, time: 'Just now', done: true }] : []
        };
      }
      return o;
    }));
    setCancelModalOrder(null);
    setActionSuccessToast(`Order ${orderId} cancelled.`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  const handleSaveCategoryPhoto = async () => {
    if (!editingCategory) return;
    const catId = editingCategory._id || editingCategory.id;
    if (!editingCategory._id) {
      showActionError('This category is not linked to a saved server record. Refresh and try again.');
      return;
    }
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.put(
        `/api/categories/${editingCategory._id}`,
        { image: categoryPhotoUrl },
        { headers: authHeaders }
      );
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'The server did not confirm the category update.');
      }
    } catch (err) {
      showActionError(
        err.response?.data?.message || err.message || 'Could not update the category image.'
      );
      return;
    }
    setCategoriesList(prev => prev.map(c => ((c._id && c._id === catId) || c.id === catId) ? { ...c, image: categoryPhotoUrl } : c));
    setEditingCategory(null);
    setActionSuccessToast('Category image updated.');
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  // Interactive Settings Form State
  const [bizProfileName, setBizProfileName] = useState(businessName);
  const [bizType, setBizType] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [enableCod, setEnableCod] = useState(true);

  // Marketing & Settings Sub-tabs State
  const [marketingSubTab, setMarketingSubTab] = useState('meta-orders'); // 'meta-orders' | 'campaigns' | 'meta-setup'
  const [metaOrdersPlatformFilter, setMetaOrdersPlatformFilter] = useState('ALL_META'); // 'ALL_META' | 'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP'

  // Additional settings state
  const [gstinNumber, setGstinNumber] = useState('');
  const [brandTagline, setBrandTagline] = useState('');
  const [brandColor, setBrandColor] = useState('#4f46e5');
  const [minOrderValue, setMinOrderValue] = useState('0');
  const [shippingFee, setShippingFee] = useState('0');
  const [merchantUpiId, setMerchantUpiId] = useState('');

  // Hydrate settings strictly from the authenticated tenant. Never pre-fill a
  // real merchant's dashboard with another business's contact or tax details.
  useEffect(() => {
    if (!tenant) return;
    const settings = tenant.settings || {};
    setBizProfileName(tenant.businessName || '');
    setBizType(
      tenant.businessType === 'SERVICE'
        ? 'Service selling'
        : tenant.businessType === 'TRAVEL'
        ? 'Travel & experiences'
        : 'Product selling'
    );
    setContactEmail(tenant.contact?.email || '');
    setContactPhone(tenant.contact?.phone || '');
    setBizAddress(tenant.contact?.address || '');
    setGstinNumber(settings.gstinNumber || '');
    setBrandTagline(tenant.branding?.tagline || '');
    setBrandColor(tenant.branding?.primaryColor || '#4f46e5');
    setMinOrderValue(settings.minOrderValue != null ? String(settings.minOrderValue) : '0');
    setShippingFee(settings.shippingFee != null ? String(settings.shippingFee) : '0');
    setMerchantUpiId(settings.merchantUpiId || '');
    setEnableCod(settings.enableCOD !== false);
  }, [tenant]);

  // CRM Pipeline Stages Definition
  const CRM_STAGES = [
    { key: 'NEW', label: 'New Lead', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', dotColor: 'bg-blue-500' },
    { key: 'CONTACTED', label: 'Contacted', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200', dotColor: 'bg-amber-500' },
    { key: 'FOLLOW_UP', label: 'Follow-up', badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200', dotColor: 'bg-cyan-500' },
    { key: 'QUALIFIED', label: 'Qualified', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200', dotColor: 'bg-purple-500' },
    { key: 'QUOTATION_SENT', label: 'Quote Sent', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200', dotColor: 'bg-indigo-500' },
    { key: 'WON', label: 'Order Won', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
    { key: 'LOST', label: 'Lost / Closed', badgeColor: 'bg-slate-100 text-slate-600 border-slate-200', dotColor: 'bg-slate-400' }
  ];

  const defaultCrmLeads = [];

  // CRM Leads State
  const [crmLeads, setCrmLeads] = useState(defaultCrmLeads);
  const [crmLoading, setCrmLoading] = useState(false);
  const [crmSearch, setCrmSearch] = useState('');
  const [crmStageFilter, setCrmStageFilter] = useState('ALL');
  const [crmSourceFilter, setCrmSourceFilter] = useState('ALL');
  const [crmViewMode, setCrmViewMode] = useState('table'); // 'table' | 'kanban'
  const [selectedLead, setSelectedLead] = useState(null); // Drawer / details modal
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'MANUAL',
    campaignName: '',
    budget: '',
    note: ''
  });
  const [newLeadNote, setNewLeadNote] = useState('');

  // Calendar month state
  const [calendarMonthDate, setCalendarMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const calendarMonth = calendarMonthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const currentMonthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const shiftCalendarMonth = (delta) => {
    const next = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + delta, 1);
    setCalendarMonthDate(next);
    setActionSuccessToast(`Viewing ${next.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} calendar`);
    setTimeout(() => setActionSuccessToast(''), 3000);
  };

  // Meta Ads Real-Time Syncing State
  const [syncingMeta, setSyncingMeta] = useState(false);

  // Products State (so Add Product updates catalog immediately)
  const [productsList, setProductsList] = useState([]);
  const products = productsList;


  // Inventory State (so Adjust Stock updates stock immediately)

  // Travel Bookings State
  const [travelList, setTravelList] = useState([]);

  // Customers Directory State (Dynamically Aggregated from live Orders & CRM Leads)

  const customersList = useMemo(() => {
    const customerMap = new Map();

    // 1. Ingest all orders to build verified customer profiles
    ordersList.forEach((ord, idx) => {
      const rawPhone = (ord.phone || ord.customerPhone || '').trim();
      const rawName = (ord.customer || ord.customerName || 'Customer').trim();
      const phoneDigits = rawPhone.replace(/\D/g, '');
      const uniqueKey = phoneDigits.length >= 6 ? phoneDigits.slice(-10) : (rawName.toLowerCase() || `order_${idx}`);

      if (!customerMap.has(uniqueKey)) {
        customerMap.set(uniqueKey, {
          id: `CUST-${phoneDigits.slice(-4) || String(100 + customerMap.size)}`,
          name: rawName,
          last: `Last order · ${ord.displayDate || ord.date || 'Date not recorded'}`,
          mobile: rawPhone || 'N/A',
          email: ord.email || '',
          orders: 0,
          ltv: 0,
          displayLtv: '₹0',
          comm: 'Not tracked',
          commColor: 'bg-slate-50 text-slate-600'
        });
      }

      const record = customerMap.get(uniqueKey);
      record.orders += 1;
      const orderAmount = Number(ord.total) || 0;
      if (ord.status !== 'CANCELLED') {
        record.ltv += orderAmount;
      }
      record.displayLtv = `₹${record.ltv.toLocaleString('en-IN')}`;
    });

    // 2. Ingest CRM leads who haven't ordered yet
    crmLeads.forEach((lead, idx) => {
      const rawPhone = (lead.phone || '').trim();
      const rawName = (lead.name || 'Unnamed lead').trim();
      const phoneDigits = rawPhone.replace(/\D/g, '');
      const uniqueKey = phoneDigits.length >= 6 ? phoneDigits.slice(-10) : (rawName.toLowerCase() || `lead_${idx}`);

      if (!customerMap.has(uniqueKey)) {
        customerMap.set(uniqueKey, {
          id: `LEAD-${phoneDigits.slice(-4) || String(200 + customerMap.size)}`,
          name: rawName,
          last: `Lead · ${lead.platform || 'Platform not recorded'} (${lead.status || 'NEW'})`,
          mobile: rawPhone || 'N/A',
          email: lead.email || '',
          orders: 0,
          ltv: 0,
          displayLtv: '₹0',
          comm: 'Not tracked',
          commColor: 'bg-slate-50 text-slate-600'
        });
      }
    });

    const aggregated = Array.from(customerMap.values());
    return aggregated;
  }, [ordersList, crmLeads]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', mobile: '', email: '', address: '' });

  // ==================== AUTOMATIONS ENGINE STATE ====================
  const [automationRules, setAutomationRules] = useState([]);

  const [automationLogs, setAutomationLogs] = useState([]);

  const [automationRulesFilter, setAutomationRulesFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'PAUSED' | 'ORDER' | 'LEAD'
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [showRunHistoryModal, setShowRunHistoryModal] = useState(false);
  const [showTestTriggerModal, setShowTestTriggerModal] = useState(false);
  const [testTriggerResult, setTestTriggerResult] = useState(null);
  const [testingAutomation, setTestingAutomation] = useState(false);

  // New Rule Form State
  const [newRuleForm, setNewRuleForm] = useState({
    name: '',
    trigger: 'ORDER_CREATED',
    conditionType: 'ALWAYS',
    conditionField: 'totalAmount',
    conditionOperator: 'GREATER_THAN',
    conditionValue: '500',
    actionType: 'SEND_WHATSAPP',
    target: '',
    template: 'Hello {{customerName}}, your order {{orderNumber}} is confirmed!'
  });

  // Test Trigger Form State
  const [testEventForm, setTestEventForm] = useState({
    trigger: 'ORDER_CREATED',
    entityType: 'ORDER',
    entityId: '',
    customerName: '',
    customerPhone: '',
    totalAmount: '',
    campaignName: '',
    courier: '',
    trackingNumber: '',
    productName: ''
  });

  // Optional packaging variants; empty until the merchant defines them.
  const DEFAULT_JAR_PRESETS = [];

  // Modals State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);
  const [newJarName, setNewJarName] = useState('');
  const [newJarPrice, setNewJarPrice] = useState('');
  const [newJarStock, setNewJarStock] = useState('');
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    sku: '',
    cat: '',
    newCatInput: '',
    price: '',
    stock: '',
    img: '', // Starts empty - choose a real product image before publishing
    jars: DEFAULT_JAR_PRESETS.map(j => ({ ...j }))
  });

  // Edit Product Modal State
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditCustomCatInput, setShowEditCustomCatInput] = useState(false);
  const [editNewJarName, setEditNewJarName] = useState('');
  const [editNewJarPrice, setEditNewJarPrice] = useState('');
  const [editNewJarStock, setEditNewJarStock] = useState('');
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    sku: '',
    cat: '',
    newCatInput: '',
    price: '',
    stock: '',
    img: '',
    status: 'In stock',
    vis: 'Published',
    jars: DEFAULT_JAR_PRESETS.map(j => ({ ...j }))
  });

  // Coupons & Promo Offers State
  const [couponsList, setCouponsList] = useState([]);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    isActive: true,
  });

  const [showBulkDiscountModal, setShowBulkDiscountModal] = useState(false);
  const [bulkDiscountForm, setBulkDiscountForm] = useState({
    discountPercent: 15,
    scope: 'ALL',
    categoryName: 'ALL',
  });

  const handleEditProductImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditProductForm(prev => ({ ...prev, img: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '' // Starts empty as requested
  });

  // Device Gallery File Upload Handlers
  const handleProductImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProductForm(prev => ({ ...prev, img: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCategoryImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewCategoryForm(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };



  const [showAddTourModal, setShowAddTourModal] = useState(false);
  const [addTourForm, setAddTourForm] = useState({ customer: '', pkg: '', pass: '1 passenger', date: '', loc: '' });

  // Business Type Mode (Super Admin controlled / Switchable: PRODUCT, SERVICE, TRAVEL, ALL)
  const [businessTypeMode, setBusinessTypeMode] = useState(() => tenant?.businessType || 'PRODUCT');

  // Service Bookings State & Modals
  const [serviceViewMode, setServiceViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [showAddServiceBookingModal, setShowAddServiceBookingModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedServiceBooking, setSelectedServiceBooking] = useState(null);
  const [availabilityConfig, setAvailabilityConfig] = useState({
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    startTime: '10:00 AM',
    endTime: '07:00 PM',
    slotDuration: '1 Hour',
    bufferTime: '15 Mins',
    autoAccept: true
  });

  const [newServiceForm, setNewServiceForm] = useState({
    client: '',
    service: '',
    phone: '',
    date: '',
    dayNumber: null,
    time: '',
    price: '',
    advancePaid: '',
    status: 'PENDING'
  });

  const [serviceBookingsList, setServiceBookingsList] = useState([]);

  const handleSaveServiceBooking = (e) => {
    e.preventDefault();
    showActionError(
      'Dashboard booking creation is not connected to the server. No booking was created. Customers create bookings through the public booking flow.'
    );
  };

  const handleUpdateServiceBookingStatus = async (bookingId, newStatus) => {
    const statusMap = {
      'Confirmed': 'CONFIRMED',
      'In Progress': 'IN_PROGRESS',
      'Completed': 'COMPLETED',
      'Cancelled': 'CANCELLED'
    };
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.patch(`/api/bookings/${bookingId}/status`, {
        bookingStatus: statusMap[newStatus] || newStatus.toUpperCase()
      }, { headers: authHeaders });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Booking status update was rejected.');
      }
    } catch (err) {
      showActionError(err.response?.data?.message || err.message || 'Could not update the booking status.');
      return;
    }

    const statusColor =
      newStatus === 'Confirmed'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : newStatus === 'Completed' || newStatus === 'In Progress'
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : 'bg-rose-50 text-rose-700 border-rose-200';
    setServiceBookingsList(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus, statusColor } : b));
    if (selectedServiceBooking && selectedServiceBooking.id === bookingId) {
      setSelectedServiceBooking(prev => ({ ...prev, status: newStatus, statusColor }));
    }
    setActionSuccessToast(`Booking status updated to "${newStatus}".`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  // Action Handlers
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.mobile.trim()) {
      showActionError('Enter the customer name and mobile number.');
      return;
    }
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post('/api/crm/leads', {
        name: newCustomerForm.name.trim(),
        phone: newCustomerForm.mobile.trim(),
        email: newCustomerForm.email?.trim() || '',
        source: 'MANUAL',
        budget: 0,
        notes: newCustomerForm.address?.trim()
          ? [{ note: `Address: ${newCustomerForm.address.trim()}`, authorName: 'Merchant' }]
          : [],
      }, { headers: authHeaders });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'The customer could not be saved.');
      }
      await fetchCrmLeads();
      setShowAddCustomerModal(false);
      setNewCustomerForm({ name: '', mobile: '', email: '', address: '' });
      setActionSuccessToast(`Customer "${newCustomerForm.name.trim()}" saved as a CRM lead.`);
      setTimeout(() => setActionSuccessToast(''), 4500);
    } catch (err) {
      showActionError(err.response?.data?.message || err.message || 'Could not save the customer.');
    }
  };

  const handleExportCustomersCsv = () => {
    const headers = "Customer ID,Name,Mobile,Email,Orders,Lifetime Value,Communication\\n";
    const rows = customersList.map(c => `"${c.id}","${c.name}","${c.mobile}","${c.email}","${c.orders}","${c.displayLtv}","${c.comm}"`).join("\\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_directory.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setActionSuccessToast('Customers CSV directory exported successfully!');
    setTimeout(() => setActionSuccessToast(''), 4000);
  };
  const fetchCrmLeads = async () => {
    setCrmLoading(true);
    try {
      const token = localStorage.getItem('omniva_token');
      const res = await axios.get('/api/crm/leads', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { limit: 100 }
      });
      setCrmLeads(Array.isArray(res.data?.leads) ? res.data.leads : []);
    } catch (err) {
      console.warn('Could not load CRM leads:', err);
    } finally {
      setCrmLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('/api/bookings', { headers: authHeaders, params: { limit: 100 } });
      if (Array.isArray(res.data?.data)) {
        const serviceItems = [];
        const travelItems = [];

        res.data.data.forEach(b => {
          const dateStr = b.eventDate ? new Date(b.eventDate).toISOString().split('T')[0] : '';
          const dayNum = b.eventDate ? new Date(b.eventDate).getDate() : null;
          let color = 'bg-purple-100 text-purple-700 border-purple-200';
          let statusColor = 'bg-slate-100 text-slate-700 border-slate-200';
          if (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'COMPLETED') {
            statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          } else if (b.bookingStatus === 'IN_PROGRESS') {
            statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
          } else if (b.bookingStatus === 'PENDING') {
            statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
          }

          if (b.bookingType === 'TRAVEL') {
            travelItems.push({
              id: b._id,
              bookingNumber: b.bookingNumber,
              customer: b.customerName,
              phone: b.customerPhone,
              pkg: b.packageName || '',
              pass: b.passengers?.length ? `${b.passengers.length} Pax` : '',
              date: dateStr,
              loc: b.location || '',
              status: b.bookingStatus === 'CONFIRMED' ? 'Confirmed' : b.bookingStatus === 'PENDING' ? 'Pending' : b.bookingStatus,
              statusColor,
              pay: b.paymentStatus === 'PAID'
                ? `Paid ₹${Number(b.totalAmount || 0).toLocaleString('en-IN')}`
                : b.advancePaid > 0
                ? `Advance ₹${Number(b.advancePaid).toLocaleString('en-IN')}`
                : `Unpaid · Total ₹${Number(b.totalAmount || 0).toLocaleString('en-IN')}`,
              totalAmount: b.totalAmount,
              advancePaid: b.advancePaid,
              balanceDue: b.balanceDue
            });
          } else {
            serviceItems.push({
              id: b._id,
              bookingNumber: b.bookingNumber,
              client: b.customerName,
              service: b.packageName || '',
              phone: b.customerPhone,
              email: b.customerEmail,
              date: dateStr,
              dayNumber: dayNum,
              time: b.timeSlot || '',
              price: b.totalAmount,
              advancePaid: b.advancePaid,
              balanceDue: b.balanceDue,
              status: b.bookingStatus === 'CONFIRMED' ? 'Confirmed' : b.bookingStatus === 'IN_PROGRESS' ? 'In Progress' : b.bookingStatus === 'PENDING' ? 'Pending' : b.bookingStatus,
              statusColor,
              color,
              payStatus: b.advancePaid > 0
                ? `Advance Paid (₹${Number(b.advancePaid).toLocaleString('en-IN')}) · Balance ₹${Number(b.balanceDue || 0).toLocaleString('en-IN')}`
                : `Unpaid · Balance ₹${Number(b.balanceDue ?? b.totalAmount ?? 0).toLocaleString('en-IN')}`
            });
          }
        });

        setServiceBookingsList(serviceItems);
        setTravelList(travelItems);
      }
    } catch (err) {
      console.warn('Error loading bookings from API:', err);
    }
  };

  const fetchProductsAndCategories = async () => {
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      const [catsRes, prodsRes] = await Promise.all([
        axios.get('/api/categories', { headers: authHeaders }),
        axios.get('/api/products', { headers: authHeaders })
      ]);

      const apiCats = catsRes.data?.data || [];
      const apiProds = prodsRes.data?.data || [];

      {
        const formattedCats = apiCats.map(c => {
          const count = apiProds.filter(p => {
            const pCatId = p.categoryId?._id ? String(p.categoryId._id) : (p.categoryId ? String(p.categoryId) : '');
            return pCatId === String(c._id);
          }).length;
          return {
            id: c._id,
            _id: c._id,
            name: c.name,
            slug: c.slug,
            description: c.description || '',
            image: c.image || '',
            productsCount: count,
            status: c.isActive !== false ? 'Active' : 'Inactive'
          };
        });
        setCategoriesList(formattedCats);
      }

      {
        const formattedProds = apiProds.map(p => {
          const catObj = p.categoryId;
          const catName = catObj?.name || (typeof p.categoryId === 'string' ? p.categoryId : '');
          const rawPrice = Number(p.price) || 0;
          const rawStock = Number(p.stockQuantity) || 0;
          const imgUrl = (Array.isArray(p.images) && p.images[0]) || p.image || '';

          const jars = (p.variants && p.variants.length > 0)
            ? p.variants.map((v, idx) => ({
                id: v._id || `v-${idx}`,
                name: v.name,
                price: Number(v.price) || rawPrice,
                stock: Number(v.stockQuantity) || 0,
                enabled: true
              }))
            : [];

          return {
            id: p._id,
            _id: p._id,
            name: p.name,
            sku: p.variants?.[0]?.sku || p.slug || '',
            cat: catName,
            categoryId: catObj?._id || p.categoryId,
            price: `₹${rawPrice}`,
            compareAtPrice: p.compareAtPrice || null,
            discountPercent: (p.compareAtPrice && p.compareAtPrice > rawPrice)
              ? Math.round(((p.compareAtPrice - rawPrice) / p.compareAtPrice) * 100)
              : 0,
            stock: rawStock,
            trackQuantity: p.trackQuantity !== false,
            status: p.trackQuantity === false || rawStock > 10 ? 'In stock' : (rawStock > 0 ? 'Low stock' : 'Out of stock'),
            statusColor: p.trackQuantity === false || rawStock > 10 ? 'bg-emerald-50 text-emerald-700' : (rawStock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'),
            vis: p.isAvailable ? 'Published' : 'Hidden',
            img: imgUrl,
            jars: jars
          };
        });
        setProductsList(formattedProds);
      }
    } catch (err) {
      console.warn('Error fetching products/categories from backend:', err);
      showActionError(
        err.response?.data?.message ||
          'Could not load products and categories from the server. Existing data was not replaced.'
      );
    }
  };

  const formatRawOrder = (o) => {
    const created = o.createdAt ? new Date(o.createdAt) : null;
    const hasCreatedDate = Boolean(created && !Number.isNaN(created.getTime()));
    const dateStr = hasCreatedDate ? formatDateInput(created) : '';
    const displayDate = hasCreatedDate
      ? created.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Date not provided';

    const items = (o.items && o.items.length > 0)
      ? o.items.map(it => ({
          name: it.name,
          variant: it.variantName || 'No variant',
          qty: it.quantity || 1,
          price: it.price || 0,
          image: it.image || ''
        }))
      : [];

    const itemSummary = items.length > 0
      ? `${items.reduce((acc, it) => acc + (it.qty || 1), 0)} items (${items.map(it => it.name).join(', ')})`
      : 'No line items returned';

    const addr = o.shippingAddress
      ? (typeof o.shippingAddress === 'string'
          ? o.shippingAddress
          : `${o.shippingAddress.street || ''}, ${o.shippingAddress.city || ''}, ${o.shippingAddress.state || ''} - ${o.shippingAddress.pincode || ''}`)
      : '';

    const utm = (o.attribution?.utmSource || '').toUpperCase();
    const source = utm.includes('INSTA') ? 'INSTAGRAM' : (utm.includes('FACE') ? 'FACEBOOK' : (utm.includes('WHATS') ? 'WHATSAPP' : 'UNATTRIBUTED'));
    const channelName = o.attribution?.utmSource || 'No UTM source recorded';
    const campaign = o.attribution?.utmCampaign || 'No campaign data';

    const pay = o.paymentMethod || o.pay || o.payMethod || 'Not recorded';
    const status = o.orderStatus || o.status || 'NEW';
    const statusLabel = status === 'NEW' ? 'New / Awaiting Acceptance'
      : status === 'CONFIRMED' ? 'Accepted / Confirmed'
      : status === 'PROCESSING' ? 'Packed / Ready to Ship'
      : status === 'SHIPPED' ? 'Shipped / Out for Delivery'
      : status === 'DELIVERED' ? 'Delivered'
      : status === 'CANCELLED' ? 'Cancelled'
      : status;

    const statusColor = status === 'NEW' ? 'bg-purple-50 text-purple-700 border-purple-200'
      : status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-200'
      : status === 'PROCESSING' ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : status === 'SHIPPED' ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
      : status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

    const payColor = pay === 'ONLINE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';

    const timeline = (o.timeline && o.timeline.length > 0)
      ? o.timeline.map(t => ({
          title: t.note || t.status,
          time: t.timestamp ? new Date(t.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Not recorded',
          done: true
        }))
      : [
          { title: `Order Placed (${pay})`, time: displayDate, done: true },
          { title: 'Merchant Acceptance', time: status === 'NEW' ? 'Awaiting Action' : 'Done', done: status !== 'NEW' },
          { title: 'Packed & Boxed', time: (status === 'PROCESSING' || status === 'SHIPPED' || status === 'DELIVERED') ? 'Done' : 'Pending', done: (status === 'PROCESSING' || status === 'SHIPPED' || status === 'DELIVERED') },
          { title: 'Courier Dispatch', time: (status === 'SHIPPED' || status === 'DELIVERED') ? 'Done' : 'Pending', done: (status === 'SHIPPED' || status === 'DELIVERED') },
          { title: 'Delivered', time: status === 'DELIVERED' ? 'Done' : 'Pending', done: status === 'DELIVERED' }
        ];

    const custName = o.customerName || o.customer || 'Customer';
    const custPhone = o.customerPhone || o.phone || '';
    const custEmail = o.customerEmail || o.email || '';
    const totAmount = o.totalAmount !== undefined ? o.totalAmount : (o.total !== undefined ? o.total : 0);

    return {
      id: `#${o.orderNumber || o._id}`,
      _id: o._id,
      orderNumber: o.orderNumber,
      date: dateStr,
      displayDate,
      customer: custName,
      phone: custPhone,
      email: custEmail,
      address: addr,
      source,
      channelName,
      campaign,
      items,
      itemSummary,
      total: totAmount,
      displayTotal: `₹${totAmount}`,
      pay,
      payMethod: pay,
      paymentStatus: o.paymentStatus || 'UNKNOWN',
      payColor,
      status,
      statusLabel,
      statusColor,
      courier: o.courierPartner || '',
      tracking: o.trackingNumber || '',
      duplicateResolved: Boolean(o.duplicateResolved),
      createdAt: o.createdAt,
      timeline
    };
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      if (!token) {
        // ProtectedRoute handles unauthenticated users. Never auto-login with demo credentials.
        return false;
      }

      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get('/api/orders', {
        headers: authHeaders,
        params: { limit: 100 }
      });

      let rawOrders = [];
      if (res.data?.data && Array.isArray(res.data.data)) {
        rawOrders = res.data.data;
      }

      const formattedOrders = rawOrders.map(formatRawOrder);
      setOrdersList(formattedOrders);
      return true;
    } catch (err) {
      console.warn('Error fetching orders from backend:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
    fetchOrders();
    fetchCoupons();
    fetchStaff();
    fetchCrmLeads();
    fetchBookings();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const subParam = searchParams.get('sub');
    if (tabParam) {
      if (tabParam === 'billing') {
        setActiveTab('billing');
      } else {
        setActiveTab(tabParam);
      }
    }
    if (subParam) {
      setSettingsSubTab(subParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'overview') {
      fetchOrders();
      fetchCrmLeads();
    }
    if (activeTab === 'products' || activeTab === 'categories') {
      fetchProductsAndCategories();
    }
    if (activeTab === 'coupons') {
      fetchCoupons();
    }
    if (activeTab === 'leads') {
      fetchCrmLeads();
    }
    if (activeTab === 'automations') {
      fetchAutomationRules();
      fetchAutomationLogs();
    }
    if (activeTab === 'staff') {
      fetchStaff();
    }
    if (activeTab === 'service-bookings' || activeTab === 'travel-bookings') {
      fetchBookings();
    }
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'orders' || activeTab === 'overview') {
        fetchOrders();
        fetchCrmLeads();
      }
      if (activeTab === 'leads') {
        fetchCrmLeads();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('/api/auth/staff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data?.staff)) {
        const fetched = res.data.staff.map(s => {
          let scope = 'ALL';
          let statuses = ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
          if (s.role === 'ORDER_MANAGER') {
            scope = 'CONFIRMED_ONLY';
            statuses = ['CONFIRMED', 'PROCESSING'];
          } else if (s.role === 'INVENTORY_STAFF') {
            scope = 'DISPATCH_ONLY';
            statuses = ['SHIPPED', 'DELIVERED'];
          } else if (s.role === 'SUPPORT_STAFF') {
            scope = 'PENDING_ONLY';
            statuses = ['NEW'];
          }

          const savedPermissions = Array.isArray(s.customPermissions) ? s.customPermissions : [];
          const savedScope = savedPermissions.find(p => p.startsWith('scope:'))?.slice('scope:'.length);
          const scopeStatusMap = {
            ALL: ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
            CONFIRMED_ONLY: ['CONFIRMED', 'PROCESSING'],
            PENDING_ONLY: ['NEW'],
            DISPATCH_ONLY: ['SHIPPED', 'DELIVERED'],
          };
          if (savedScope && scopeStatusMap[savedScope]) {
            scope = savedScope;
            statuses = scopeStatusMap[savedScope];
          }
          const hasSavedPermissions = savedPermissions.length > 0;

          return {
            id: s._id || s.id,
            apiRole: s.role,
            name: s.name,
            email: s.email,
            phone: s.phone || '',
            role: String(s.role || '').replace(/_/g, ' '),
            status: s.isActive !== false ? 'Active' : 'Inactive',
            orderScope: scope,
            allowedOrderStatuses: statuses,
            modules: ['orders', 'leads'],
            canAcceptOrders: hasSavedPermissions ? savedPermissions.includes('orders:accept') : true,
            canPackOrders: hasSavedPermissions ? savedPermissions.includes('orders:pack') : true,
            canDispatchOrders: hasSavedPermissions ? savedPermissions.includes('orders:dispatch') : true,
            canCancelOrders: hasSavedPermissions ? savedPermissions.includes('orders:cancel') : false,
            canViewRevenue: hasSavedPermissions ? savedPermissions.includes('revenue:view') : false,
            lastActive: 'Not tracked'
          };
        });
        setStaffList(fetched);
        setTeamMembers(fetched);
      }
    } catch (e) {
      console.warn('Staff fetch notice:', e.message);
    }
  };

  const handleSaveStaffPermissions = async (staff, { testView = false } = {}) => {
    if (!staff?.id) {
      showActionError('This staff record has no server id. Refresh the staff list and try again.');
      return;
    }
    const permissions = [
      `scope:${staff.orderScope || 'ALL'}`,
      ...(staff.canAcceptOrders ? ['orders:accept'] : []),
      ...(staff.canPackOrders ? ['orders:pack'] : []),
      ...(staff.canDispatchOrders ? ['orders:dispatch'] : []),
      ...(staff.canCancelOrders ? ['orders:cancel'] : []),
      ...(staff.canViewRevenue ? ['revenue:view'] : []),
    ];
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const res = await axios.put(
        `/api/auth/staff/${staff.id}`,
        { customPermissions: permissions },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.data?.success || !res.data?.staff) {
        throw new Error(res.data?.message || 'The server did not confirm the staff permission update.');
      }
      const updatedStaff = { ...staff, customPermissions: permissions };
      setStaffList(prev => prev.map(member => member.id === staff.id ? updatedStaff : member));
      setTeamMembers(prev => prev.map(member => member.id === staff.id ? updatedStaff : member));
      setShowEditStaffModal(false);
      if (testView) {
        setSimulatedStaffId(staff.id);
        setActiveTab('orders');
      }
      setActionSuccessToast(
        testView
          ? `Permissions saved. Viewing Orders as ${staff.name}.`
          : `Permissions saved for ${staff.name}.`
      );
      setTimeout(() => setActionSuccessToast(''), 4000);
    } catch (err) {
      showActionError(
        err.response?.data?.message || err.message || 'Could not save staff permissions.'
      );
    }
  };

  const handleToggleStaffStatus = async (staff) => {
    if (!staff?.id) {
      showActionError('This staff record has no server id. Refresh the staff list and try again.');
      return;
    }
    const nextActive = staff.status !== 'Active';
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const res = await axios.put(
        `/api/auth/staff/${staff.id}`,
        { isActive: nextActive },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'The server did not confirm the staff status change.');
      }
      const nextStatus = nextActive ? 'Active' : 'Inactive';
      setStaffList(prev => prev.map(member => member.id === staff.id ? { ...member, status: nextStatus } : member));
      setTeamMembers(prev => prev.map(member => member.id === staff.id ? { ...member, status: nextStatus } : member));
      setActionSuccessToast(`${staff.name} is now ${nextStatus.toLowerCase()}.`);
      setTimeout(() => setActionSuccessToast(''), 3000);
    } catch (err) {
      showActionError(err.response?.data?.message || err.message || 'Could not change staff status.');
    }
  };

  const handleRemoveStaff = async (staff) => {
    if (!staff?.id) {
      showActionError('This staff record has no server id. Refresh the staff list and try again.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove staff account for ${staff.name}?`)) return;
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const res = await axios.delete(`/api/auth/staff/${staff.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'The server did not confirm staff removal.');
      }
      setStaffList(prev => prev.filter(member => member.id !== staff.id));
      setTeamMembers(prev => prev.filter(member => member.id !== staff.id));
      if (simulatedStaffId === staff.id) setSimulatedStaffId(null);
      setActionSuccessToast(`Staff member ${staff.name} removed.`);
      setTimeout(() => setActionSuccessToast(''), 3000);
    } catch (err) {
      showActionError(err.response?.data?.message || err.message || 'Could not remove the staff member.');
    }
  };

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      const businessTypeValue =
        bizType === 'Service selling'
          ? 'SERVICE'
          : bizType === 'Travel & experiences'
          ? 'TRAVEL'
          : 'PRODUCT';

      const res = await axios.put('/api/auth/business-profile', {
        businessName: bizProfileName,
        businessType: businessTypeValue,
        contactEmail,
        contactPhone,
        contactAddress: bizAddress,
        brandTagline,
        brandColor,
        settings: {
          gstinNumber,
          bizAddress,
          minOrderValue: Number(minOrderValue) || 0,
          shippingFee: Number(shippingFee) || 0,
          enableCOD: Boolean(enableCod),
          merchantUpiId
        }
      }, { headers: authHeaders });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'The server did not confirm the settings update.');
      }

      setActionSuccessToast('Settings saved to the server.');
    } catch (err) {
      console.error('Error saving settings to backend:', err);
      showActionError(
        err.response?.data?.message ||
          'Could not save settings. Nothing was changed on the server.'
      );
    } finally {
      setTimeout(() => setActionSuccessToast(''), 4000);
    }
  };

  const handleSyncMetaLeads = async () => {
    setSyncingMeta(true);
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post('/api/meta/integration/sync', {}, { headers: authHeaders });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Meta lead sync did not complete.');
      }
      setActionSuccessToast(res.data.message || 'Meta Lead Ads synced.');
    } catch (e) {
      showActionError(
        e.response?.data?.message || e.message || 'Could not sync Meta leads. Nothing was changed.'
      );
    } finally {
      await fetchCrmLeads();
      setSyncingMeta(false);
      setTimeout(() => setActionSuccessToast(''), 4000);
    }
  };

  const handleUpdateLeadStage = async (leadId, newStage) => {
    try {
      const token = localStorage.getItem('omniva_token');
      const res = await axios.patch(`/api/crm/leads/${leadId}/status`, { status: newStage }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.data?.success || !res.data?.lead) {
        throw new Error(res.data?.message || 'The server did not confirm the lead update.');
      }
      const updatedLead = res.data.lead;
      setCrmLeads(prev => prev.map(l => l._id === leadId ? updatedLead : l));
      if (selectedLead && selectedLead._id === leadId) {
        setSelectedLead(updatedLead);
      }
      const stageObj = CRM_STAGES.find(s => s.key === newStage);
      setActionSuccessToast(`Lead stage updated to ${stageObj?.label || newStage}.`);
      setTimeout(() => setActionSuccessToast(''), 3500);
    } catch (err) {
      showActionError(
        err.response?.data?.message || err.message || 'Could not update the lead stage.'
      );
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.phone) {
      alert('Lead Name and Phone number are required');
      return;
    }
    const token = localStorage.getItem('omniva_token');
    try {
      const res = await axios.post('/api/crm/leads', {
        name: newLeadForm.name,
        phone: newLeadForm.phone,
        email: newLeadForm.email,
        source: newLeadForm.source,
        campaignName: newLeadForm.campaignName,
        budget: Number(newLeadForm.budget) || 0,
        initialNote: newLeadForm.note || 'Manually captured in CRM'
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.data?.success || !res.data?.lead) {
        throw new Error(res.data?.message || 'The server did not confirm lead creation.');
      }
      setCrmLeads(prev => [res.data.lead, ...prev]);
      setShowAddLeadModal(false);
      setNewLeadForm({ name: '', phone: '', email: '', source: 'MANUAL', campaignName: '', budget: '', note: '' });
      setActionSuccessToast(`New enquiry for ${res.data.lead.name || newLeadForm.name} added to CRM.`);
      setTimeout(() => setActionSuccessToast(''), 4000);
    } catch (err) {
      showActionError(
        err.response?.data?.message || err.message || 'Could not create the lead.'
      );
    }
  };

  const handleAddLeadNote = async (leadId) => {
    if (!newLeadNote.trim()) return;
    const noteText = newLeadNote.trim();
    const token = localStorage.getItem('omniva_token');
    try {
      const res = await axios.post(`/api/crm/leads/${leadId}/notes`, { note: noteText }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.data?.success || !res.data?.note) {
        throw new Error(res.data?.message || 'The server did not confirm the note.');
      }
      const newNoteObj = res.data.note;
      setCrmLeads(prev => prev.map(l => l._id === leadId ? {
        ...l,
        notes: [...(l.notes || []), newNoteObj]
      } : l));
      if (selectedLead && selectedLead._id === leadId) {
        setSelectedLead(prev => ({
          ...prev,
          notes: [...(prev.notes || []), newNoteObj]
        }));
      }
      setNewLeadNote('');
      setActionSuccessToast('Follow-up note saved to lead timeline.');
      setTimeout(() => setActionSuccessToast(''), 3000);
    } catch (err) {
      showActionError(
        err.response?.data?.message || err.message || 'Could not save the lead note.'
      );
    }
  };

  const getStageMeta = (status) => {
    return CRM_STAGES.find(s => s.key === status) || CRM_STAGES[0];
  };

  const getSourceBadge = (source, platform = '') => {
    switch (source) {
      case 'META_ADS':
        return {
          label: platform === 'ig' ? '📸 Instagram Ad' : platform === 'fb' ? '🔵 Facebook Ad' : '🔵 Meta Ad',
          color: platform === 'ig' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'WHATSAPP':
        return { label: '💬 WhatsApp Chat', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'WEBSITE':
        return { label: '🌐 Online Store', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'REFERRAL':
        return { label: '🤝 Referral', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'MANUAL':
        return { label: '✍️ Manual entry', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { label: '❔ Other / unknown source', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const handleExportOrdersCsv = () => {
    const headers = "Order ID,Customer,Phone,Date,Total,Payment,Status\n";
    const rows = ordersList.map(o => `"${o.id}","${o.customer}","${o.phone}","${o.displayDate}","${o.total}","${o.pay}","${o.status}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${startDate}_to_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setActionSuccessToast('Orders CSV exported successfully!');
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  // ==================== AUTOMATION ENGINE HANDLERS ====================
  const fetchAutomationRules = async () => {
    try {
      const token = localStorage.getItem('omniva_token');
      const res = await axios.get('/api/automations/rules', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setAutomationRules(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.warn('Could not load automation rules:', err.message);
      setAutomationRules([]);
    }
  };

  const fetchAutomationLogs = async () => {
    try {
      const token = localStorage.getItem('omniva_token');
      const res = await axios.get('/api/automations/logs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setAutomationLogs(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.warn('Could not load automation logs:', err.message);
      setAutomationLogs([]);
    }
  };

  const handleToggleRule = async (ruleId, currentStatus) => {
    const updatedStatus = !currentStatus;
    // Optimistic UI update
    setAutomationRules(prev =>
      prev.map(r => (r._id === ruleId || r.id === ruleId ? { ...r, isActive: updatedStatus } : r))
    );
    try {
      const token = localStorage.getItem('omniva_token');
      await axios.put(`/api/automations/rules/${ruleId}`, { isActive: updatedStatus }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setActionSuccessToast(`Automation Rule ${updatedStatus ? 'Activated 🟢' : 'Paused ⏸️'} successfully!`);
      setTimeout(() => setActionSuccessToast(''), 3000);
    } catch (err) {
      setAutomationRules(prev =>
        prev.map(r => (r._id === ruleId || r.id === ruleId ? { ...r, isActive: currentStatus } : r))
      );
      showActionError(err.response?.data?.message || 'Could not update the automation rule.');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      const token = localStorage.getItem('omniva_token');
      await axios.delete(`/api/automations/rules/${ruleId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setAutomationRules(prev => prev.filter(r => r._id !== ruleId && r.id !== ruleId));
      setActionSuccessToast('Automation rule deleted successfully.');
      setTimeout(() => setActionSuccessToast(''), 3000);
    } catch (err) {
      showActionError(err.response?.data?.message || 'Could not delete the automation rule.');
    }
  };

  const handleCreateRuleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newRuleForm.name.trim()) {
      alert('Please enter a name for the automation rule');
      return;
    }

    const payload = {
      name: newRuleForm.name.trim(),
      trigger: newRuleForm.trigger,
      condition: newRuleForm.conditionType === 'ALWAYS'
        ? { field: 'always', operator: 'ALWAYS', value: '' }
        : {
            field: newRuleForm.conditionField,
            operator: newRuleForm.conditionOperator,
            value: newRuleForm.conditionValue
          },
      action: {
        type: newRuleForm.actionType,
        target: newRuleForm.target || '{{customerPhone}}',
        template: newRuleForm.template
      }
    };

    try {
      const token = localStorage.getItem('omniva_token');
      const res = await axios.post('/api/automations/rules', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.data?.data) {
        throw new Error('The server did not return the created rule.');
      }
      setAutomationRules(prev => [res.data.data, ...prev]);
      setShowCreateRuleModal(false);
      setNewRuleForm({
        name: '',
        trigger: 'ORDER_CREATED',
        conditionType: 'ALWAYS',
        conditionField: 'totalAmount',
        conditionOperator: 'GREATER_THAN',
        conditionValue: '500',
        actionType: 'SEND_WHATSAPP',
        target: '',
        template: 'Hello {{customerName}}, your order {{orderNumber}} is confirmed!'
      });
      setActionSuccessToast(`New Automation Rule "${payload.name}" created successfully! ⚡`);
      setTimeout(() => setActionSuccessToast(''), 4000);
    } catch (err) {
      showActionError(err.response?.data?.message || 'Could not create the automation rule.');
    }
  };

  const handleExecuteTestTrigger = async (e) => {
    if (e) e.preventDefault();
    setTestingAutomation(true);
    setTestTriggerResult(null);

    const testPayload = {
      trigger: testEventForm.trigger,
      entityType: testEventForm.entityType,
      entityId: testEventForm.entityId,
      testData: {
        customerName: testEventForm.customerName,
        customerPhone: testEventForm.customerPhone,
        totalAmount: Number(testEventForm.totalAmount) || 0,
        campaignName: testEventForm.campaignName,
        courier: testEventForm.courier,
        trackingNumber: testEventForm.trackingNumber,
        orderNumber: testEventForm.entityId,
        productName: testEventForm.productName
      }
    };

    try {
      const token = localStorage.getItem('omniva_token');
      const res = await axios.post('/api/automations/test', testPayload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const resultData = res.data;
      setTestTriggerResult(resultData);

      // The backend owns audit logs and execution counters, including
      // SKIPPED/FAILED outcomes. Refresh instead of inventing a SUCCESS log.
      await Promise.all([fetchAutomationLogs(), fetchAutomationRules()]);

      const matchedCount = Number(resultData.matchedRulesCount) || 0;
      const failedCount = (resultData.results || []).filter(r => r.status === 'FAILED').length;
      const skippedCount = (resultData.results || []).filter(r => r.status === 'SKIPPED').length;
      if (matchedCount === 0) {
        setActionSuccessToast('Test completed. No active automation rules matched.');
      } else if (resultData.dryRun) {
        setActionSuccessToast(
          `Test validated ${matchedCount} rule(s). No external messages or webhooks were sent.`
        );
      } else if (failedCount || skippedCount) {
        showActionError(
          `Test completed with ${failedCount} failed and ${skippedCount} skipped action(s). Review run history for details.`
        );
      } else {
        setActionSuccessToast(`Test completed: ${matchedCount} rule(s) executed.`);
      }
      setTimeout(() => setActionSuccessToast(''), 5000);
    } finally {
      setTestingAutomation(false);
    }
  };

  const handleQuickAddStock = async (product) => {
    const productId = product?._id || product?.id;
    if (!productId) {
      showActionError('This product has no server id. Refresh the catalog and try again.');
      return;
    }
    const currentStock = Number(product.stock ?? product.stockQuantity ?? 0);
    const newStock = Math.max(0, currentStock + 10);
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const res = await axios.put(
        `/api/products/${productId}`,
        { stockQuantity: newStock },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'The server did not confirm the stock update.');
      }
      await fetchProductsAndCategories();
      setActionSuccessToast(
        `Stock for ${product.name || 'the product'} updated to ${res.data.data?.stockQuantity ?? newStock}.`
      );
      setTimeout(() => setActionSuccessToast(''), 3000);
    } catch (err) {
      showActionError(err.response?.data?.message || err.message || 'Could not update product stock.');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.name.trim()) {
      alert('Please enter a product name');
      return;
    }
    const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    let enteredCat = newProductForm.newCatInput?.trim() || newProductForm.cat || categoriesList[0]?.name || '';
    let targetCatId = null;

    // 1. If merchant typed a new category, save to MongoDB first
    if (newProductForm.newCatInput?.trim()) {
      const catName = newProductForm.newCatInput.trim();
      const existing = categoriesList.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (existing) {
        targetCatId = existing._id || existing.id;
        enteredCat = existing.name;
      } else {
        try {
          const catRes = await axios.post('/api/categories', {
            name: catName,
            slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            description: '',
            image: newProductForm.img || ''
          }, { headers: authHeaders });
          if (!catRes.data?.success || !catRes.data?.data?._id) {
            throw new Error(catRes.data?.message || 'The server did not return the saved category.');
          }
          {
            const createdCat = catRes.data.data;
            targetCatId = createdCat._id;
            const newCatObj = {
              id: createdCat._id,
              _id: createdCat._id,
              name: createdCat.name,
              slug: createdCat.slug,
              description: createdCat.description,
              image: createdCat.image || '',
              productsCount: 1,
              status: 'Active'
            };
            setCategoriesList(prev => [newCatObj, ...prev]);
          }
        } catch (catErr) {
          showActionError(catErr.response?.data?.message || catErr.message || 'Could not create the category. Nothing was saved.');
          return;
        }
      }
    } else {
      const matched = categoriesList.find(c => c.name === enteredCat || c.slug === enteredCat);
      if (matched) {
        targetCatId = matched._id || matched.id;
      }
    }

    const finalImg = newProductForm.img && newProductForm.img.trim() ? newProductForm.img.trim() : '';
    const activeJars = newProductForm.jars || [];
    const enabledJars = activeJars.filter(j => j.enabled);
    const baseJar = enabledJars[0];
    const enteredPrice = parseFloat(String(newProductForm.price).replace(/[^0-9.]/g, ''));
    const numericPrice = enteredPrice > 0
      ? enteredPrice
      : (baseJar && Number(baseJar.price) > 0 ? Number(baseJar.price) : NaN);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      showActionError('Enter a real selling price greater than zero before saving the product.');
      return;
    }
    const enabledJarsStock = enabledJars.reduce((acc, j) => acc + (Number(j.stock) || 0), 0);
    const enteredStock = Number.parseInt(newProductForm.stock, 10);
    const numericStock = enabledJarsStock > 0
      ? enabledJarsStock
      : (Number.isFinite(enteredStock) && enteredStock >= 0 ? enteredStock : NaN);
    if (!Number.isFinite(numericStock) || numericStock < 0) {
      showActionError('Enter the real stock quantity before saving the product.');
      return;
    }

    const variantsPayload = enabledJars.map(j => ({
      name: j.name,
      sku: newProductForm.sku ? `${newProductForm.sku}-${j.name.split(' ')[0]}` : '',
      price: Number(j.price) > 0 ? Number(j.price) : numericPrice,
      stockQuantity: Math.max(0, Number(j.stock) || 0)
    }));

    let savedProductData = null;
    try {
      const prodRes = await axios.post('/api/products', {
        name: newProductForm.name.trim(),
        sku: newProductForm.sku?.trim(),
        categoryId: targetCatId,
        categoryName: enteredCat,
        price: numericPrice,
        stockQuantity: numericStock,
        images: [finalImg],
        variants: variantsPayload,
        isAvailable: true,
        tags: [enteredCat.toLowerCase()]
      }, { headers: authHeaders });

      if (!prodRes.data?.success || !prodRes.data?.data?._id) {
        throw new Error(prodRes.data?.message || 'The server did not return the saved product.');
      }
      savedProductData = prodRes.data.data;
    } catch (prodErr) {
      console.error('Failed to save product to backend:', prodErr);
      alert('Could not save product to database: ' + (prodErr.response?.data?.message || prodErr.message));
      return;
    }

    const newProd = {
      id: savedProductData._id,
      _id: savedProductData?._id,
      name: savedProductData?.name || newProductForm.name.trim(),
      sku: newProductForm.sku?.trim() || savedProductData?.slug || '—',
      cat: enteredCat,
      categoryId: targetCatId,
      price: `₹${numericPrice}`,
      stock: numericStock,
      status: numericStock > 10 ? 'In stock' : (numericStock > 0 ? 'Low stock' : 'Out of stock'),
      statusColor: numericStock > 10 ? 'bg-emerald-50 text-emerald-700' : (numericStock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'),
      vis: savedProductData.isAvailable === false ? 'Unpublished' : 'Published',
      img: finalImg,
      jars: activeJars
    };

    setProductsList(prev => [newProd, ...prev]);
    // Increment category product count
    setCategoriesList(prev => prev.map(c => (c.name === enteredCat || c.slug === enteredCat || c._id === targetCatId) ? { ...c, productsCount: (c.productsCount || 0) + 1 } : c));

    // Reset and close
    setShowAddProductModal(false);
    setShowCustomCatInput(false);
    setNewProductForm({
      name: '',
      sku: '',
      cat: categoriesList[0]?.name || '',
      newCatInput: '',
      price: '',
      stock: '',
      img: '',
      jars: DEFAULT_JAR_PRESETS.map(j => ({ ...j }))
    });
    setNewJarName('');
    setNewJarPrice('');
    setNewJarStock('');
    setProductsActiveSubTab('catalog');
    setActionSuccessToast(`Product "${newProd.name}" saved to the database and added to the catalog.`);
    setTimeout(() => setActionSuccessToast(''), 4500);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryForm.name || !newCategoryForm.name.trim()) {
      alert('Please enter category name');
      return;
    }
    const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const catName = newCategoryForm.name.trim();
    const slug = newCategoryForm.slug?.trim() || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const finalImg = newCategoryForm.image && newCategoryForm.image.trim() ? newCategoryForm.image.trim() : '';

    let savedCatData = null;
    try {
      const res = await axios.post('/api/categories', {
        name: catName,
        slug: slug,
        description: newCategoryForm.description?.trim() || '',
        image: finalImg
      }, { headers: authHeaders });

      if (!res.data?.success || !res.data?.data?._id) {
        throw new Error(res.data?.message || 'The server did not return the saved category.');
      }
      savedCatData = res.data.data;
    } catch (catErr) {
      console.error('Failed to save category to backend:', catErr);
      alert('Could not save category to database: ' + (catErr.response?.data?.message || catErr.message));
      return;
    }

    const newCat = {
      id: savedCatData._id,
      _id: savedCatData._id,
      name: savedCatData.name,
      slug: savedCatData.slug,
      description: savedCatData.description || '',
      image: savedCatData.image || '',
      productsCount: 0,
      status: savedCatData.isActive === false ? 'Inactive' : 'Active'
    };

    setCategoriesList(prev => [newCat, ...prev]);
    setShowAddCategoryModal(false);
    setNewCategoryForm({
      name: '',
      slug: '',
      description: '',
      image: ''
    });
    setActionSuccessToast(`Category "${newCat.name}" created in the catalog.`);
    setTimeout(() => setActionSuccessToast(''), 4500);
  };

  const handleOpenEditProduct = (prod, index) => {
    setEditingProduct({ ...prod, originalIndex: index });
    const numPrice = prod.price ? String(prod.price).replace(/[^0-9.]/g, '') : '';
    const baseP = parseFloat(numPrice) || 0;
    const baseStock = typeof prod.stock === 'number' ? prod.stock : (parseInt(prod.stock, 10) || 0);

    let prodJars = [];
    if (prod.jars && Array.isArray(prod.jars) && prod.jars.length > 0) {
      prodJars = prod.jars.map(j => ({ ...j }));
    }

    setEditProductForm({
      name: prod.name || '',
      sku: prod.sku || '',
      cat: prod.cat || categoriesList[0]?.name || '',
      newCatInput: '',
      price: numPrice,
      compareAtPrice: prod.compareAtPrice ? String(prod.compareAtPrice).replace(/[^0-9.]/g, '') : '',
      stock: baseStock,
      img: prod.img || '',
      status: prod.status || 'In stock',
      vis: prod.vis || 'Published',
      jars: prodJars
    });
    setShowEditCustomCatInput(false);
    setEditNewJarName('');
    setEditNewJarPrice('');
    setEditNewJarStock('');
    setShowEditProductModal(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editProductForm.name || !editProductForm.name.trim()) {
      alert('Please enter a product name');
      return;
    }
    const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const enteredCat = editProductForm.newCatInput?.trim() || editProductForm.cat || (categoriesList[0]?.name || '');
    let targetCatId = null;

    // Auto-create category in categoriesList if a new one was typed
    if (editProductForm.newCatInput?.trim()) {
      const catName = editProductForm.newCatInput.trim();
      const existing = categoriesList.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (existing) {
        targetCatId = existing._id || existing.id;
      } else {
        try {
          const catRes = await axios.post('/api/categories', {
            name: catName,
            slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            description: '',
            image: editProductForm.img || ''
          }, { headers: authHeaders });
          if (!catRes.data?.success || !catRes.data?.data?._id) {
            throw new Error(catRes.data?.message || 'The server did not return the saved category.');
          }
          {
            targetCatId = catRes.data.data._id;
            const newCatObj = {
              id: catRes.data.data._id,
              _id: catRes.data.data._id,
              name: catRes.data.data.name,
              slug: catRes.data.data.slug,
              description: catRes.data.data.description,
              image: catRes.data.data.image || '',
              productsCount: 1,
              status: 'Active'
            };
            setCategoriesList(prev => [...prev, newCatObj]);
          }
        } catch (catErr) {
          showActionError(catErr.response?.data?.message || catErr.message || 'Could not create the category. Nothing was changed.');
          return;
        }
      }
    } else {
      const matched = categoriesList.find(c => c.name === enteredCat || c.slug === enteredCat);
      if (matched) {
        targetCatId = matched._id || matched.id;
      }
    }

    const finalImg = editProductForm.img && editProductForm.img.trim() ? editProductForm.img.trim() : '';
    const activeJars = editProductForm.jars || [];
    const enabledJars = activeJars.filter(j => j.enabled);
    const baseJar = enabledJars[0];
    const enteredPrice = parseFloat(String(editProductForm.price).replace(/[^0-9.]/g, ''));
    const numericPrice = enteredPrice > 0
      ? enteredPrice
      : (baseJar && Number(baseJar.price) > 0 ? Number(baseJar.price) : NaN);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      showActionError('Enter a real selling price greater than zero before saving the product.');
      return;
    }
    const enteredCompare = parseFloat(String(editProductForm.compareAtPrice).replace(/[^0-9.]/g, ''));
    const numericCompare = Number.isFinite(enteredCompare) && enteredCompare > numericPrice ? enteredCompare : null;
    const enabledJarsStock = enabledJars.reduce((acc, j) => acc + (Number(j.stock) || 0), 0);
    const enteredStock = Number.parseInt(editProductForm.stock, 10);
    const numericStock = enabledJarsStock > 0
      ? enabledJarsStock
      : (Number.isFinite(enteredStock) && enteredStock >= 0 ? enteredStock : NaN);
    if (!Number.isFinite(numericStock) || numericStock < 0) {
      showActionError('Enter the real stock quantity before saving the product.');
      return;
    }

    const variantsPayload = enabledJars.map(j => ({
      name: j.name,
      sku: editProductForm.sku ? `${editProductForm.sku}-${j.name.split(' ')[0]}` : '',
      price: Number(j.price) > 0 ? Number(j.price) : numericPrice,
      compareAtPrice: Number(j.compareAtPrice) > Number(j.price) ? Number(j.compareAtPrice) : null,
      stockQuantity: Math.max(0, Number(j.stock) || 0)
    }));

    const prodDbId = editingProduct?._id || (editingProduct?.id && String(editingProduct.id).length === 24 ? editingProduct.id : null);
    if (!prodDbId) {
      showActionError('This product is not linked to a saved server record. Refresh the catalog and try again.');
      return;
    }

    let savedProduct = null;
    try {
      const res = await axios.put(`/api/products/${prodDbId}`, {
        name: editProductForm.name.trim(),
        sku: editProductForm.sku?.trim(),
        categoryId: targetCatId,
        categoryName: enteredCat,
        price: numericPrice,
        compareAtPrice: numericCompare,
        stockQuantity: numericStock,
        images: [finalImg],
        variants: variantsPayload,
        isAvailable: editProductForm.vis !== 'Hidden'
      }, { headers: authHeaders });
      if (!res.data?.success || !res.data?.data) {
        throw new Error(res.data?.message || 'The server did not confirm the product update.');
      }
      savedProduct = res.data.data;
    } catch (err) {
      showActionError(
        err.response?.data?.message || err.message || 'Could not update the product. Nothing was changed.'
      );
      return;
    }

    const updatedProd = {
      id: savedProduct._id || editingProduct?.id || editingProduct?._id,
      _id: savedProduct._id || editingProduct?._id,
      name: savedProduct.name || editProductForm.name.trim(),
      sku: savedProduct.slug || editingProduct?.sku || editProductForm.sku?.trim() || '',
      cat: enteredCat,
      categoryId: targetCatId,
      price: `₹${numericPrice}`,
      compareAtPrice: numericCompare,
      discountPercent: numericCompare > numericPrice
        ? Math.round(((numericCompare - numericPrice) / numericCompare) * 100)
        : 0,
      stock: numericStock,
      trackQuantity: savedProduct.trackQuantity !== false,
      status: savedProduct.trackQuantity === false || numericStock > 10 ? 'In stock' : (numericStock > 0 ? 'Low stock' : 'Out of stock'),
      statusColor: savedProduct.trackQuantity === false || numericStock > 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : (numericStock > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'),
      vis: savedProduct.isAvailable === false ? 'Unpublished' : 'Published',
      img: finalImg,
      jars: activeJars
    };

    setProductsList(prev => {
      const nextList = [...prev];
      const targetIdx = editingProduct?.originalIndex !== undefined && editingProduct.originalIndex >= 0 && editingProduct.originalIndex < nextList.length
        ? editingProduct.originalIndex
        : nextList.findIndex(p => (p._id && p._id === editingProduct?._id) || p.sku === editingProduct?.sku || p.name === editingProduct?.name);
      
      if (targetIdx >= 0) {
        nextList[targetIdx] = updatedProd;
      } else {
        nextList.unshift(updatedProd);
      }
      return nextList;
    });

    setShowEditProductModal(false);
    setActionSuccessToast(`Product "${updatedProd.name}" updated. Price: ${updatedProd.price}, Stock: ${updatedProd.stock}`);
    setTimeout(() => setActionSuccessToast(''), 4500);
  };

  const handleDeleteProduct = async (prodToDelete) => {
    if (!prodToDelete) return;
    if (!window.confirm(`Are you sure you want to delete "${prodToDelete.name}" from your catalog?`)) return;

    const prodDbId = prodToDelete._id || (prodToDelete.id && String(prodToDelete.id).length === 24 ? prodToDelete.id : null);
    if (!prodDbId) {
      showActionError('This product is not linked to a saved server record. Refresh the catalog and try again.');
      return;
    }

    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.delete(`/api/products/${prodDbId}`, { headers: authHeaders });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'The server did not confirm product deletion.');
      }
    } catch (err) {
      showActionError(
        err.response?.data?.message || err.message || 'Could not delete the product. Nothing was changed.'
      );
      return;
    }

    setProductsList(prev => prev.filter(p => (p._id && prodToDelete._id ? p._id !== prodToDelete._id : (p.sku ? p.sku !== prodToDelete.sku : p.name !== prodToDelete.name))));
    setShowEditProductModal(false);
    setActionSuccessToast(`Product "${prodToDelete.name}" removed from catalog.`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  // ==================== COUPON & STOREWIDE DISCOUNT HANDLERS ====================
  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('/api/coupons', { headers: authHeaders });
      setCouponsList(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.warn('Could not fetch coupons:', err.message);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponForm.code || !newCouponForm.code.trim()) {
      showActionError('Please enter a coupon code.');
      return;
    }
    const numericDiscount = Number(newCouponForm.discountValue);
    if (!Number.isFinite(numericDiscount) || numericDiscount <= 0) {
      showActionError('Enter a discount value greater than zero.');
      return;
    }
    const cleanCode = newCouponForm.code.trim().toUpperCase();
    const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const couponPayload = {
      code: cleanCode,
      title: newCouponForm.title || '',
      description: newCouponForm.description || '',
      discountType: newCouponForm.discountType || 'PERCENTAGE',
      discountValue: numericDiscount,
      minOrderValue: Number(newCouponForm.minOrderValue) || 0,
      maxDiscount: Number(newCouponForm.maxDiscount) || 0,
      isActive: Boolean(newCouponForm.isActive),
    };

    try {
      const res = await axios.post('/api/coupons', couponPayload, { headers: authHeaders });
      if (!res.data?.success || !res.data?.data) {
        throw new Error(res.data?.message || 'The server did not confirm coupon creation.');
      }
      setCouponsList(prev => [res.data.data, ...prev.filter(c => c.code !== cleanCode)]);
      setShowAddCouponModal(false);
      setNewCouponForm({
        code: '',
        title: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minOrderValue: '',
        maxDiscount: '',
        isActive: true,
      });
      setActionSuccessToast(`Coupon "${cleanCode}" created and active.`);
      setTimeout(() => setActionSuccessToast(''), 4500);
    } catch (err) {
      showActionError(
        err.response?.data?.message || err.message || 'Could not create the coupon.'
      );
    }
  };

  const handleToggleCouponStatus = async (coupon) => {
    if (!coupon._id) {
      showActionError('This coupon is not linked to a saved server record. Refresh and try again.');
      return;
    }
    const nextStatus = !coupon.isActive;
    const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await axios.put(`/api/coupons/${coupon._id}`, { isActive: nextStatus }, { headers: authHeaders });
      if (!res.data?.success || !res.data?.data) {
        throw new Error(res.data?.message || 'The server did not confirm the coupon update.');
      }
      setCouponsList(prev => prev.map(c => (c._id === coupon._id || c.code === coupon.code) ? res.data.data : c));
      setActionSuccessToast(`Coupon "${coupon.code}" is now ${nextStatus ? 'active' : 'paused'}.`);
      setTimeout(() => setActionSuccessToast(''), 3000);
    } catch (err) {
      showActionError(
        err.response?.data?.message || err.message || 'Could not update the coupon.'
      );
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return;
    if (!coupon._id) {
      showActionError('This coupon is not linked to a saved server record. Refresh and try again.');
      return;
    }
    const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await axios.delete(`/api/coupons/${coupon._id}`, { headers: authHeaders });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'The server did not confirm coupon deletion.');
      }
      setCouponsList(prev => prev.filter(c => c._id !== coupon._id && c.code !== coupon.code));
      setActionSuccessToast(`Coupon "${coupon.code}" deleted.`);
      setTimeout(() => setActionSuccessToast(''), 3000);
    } catch (err) {
      showActionError(
        err.response?.data?.message || err.message || 'Could not delete the coupon.'
      );
    }
  };

  const handleApplyBulkDiscount = async (e, overrides = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const form = overrides || bulkDiscountForm;
    const pct = Number(form.discountPercent);
    if (!Number.isFinite(pct) || pct < 1 || pct > 90) {
      showActionError('Enter a discount percentage between 1 and 90 before applying it.');
      return;
    }
    const isAll = form.scope === 'ALL' || form.categoryName === 'ALL';
    const targetCat = form.categoryName;
    if (!window.confirm(`This will overwrite selling prices for ${isAll ? 'all products' : 'the selected category'} by ${pct}%. It is not a reversible coupon. Continue?`)) {
      return;
    }
    const targetCategory = categoriesList.find(
      c => c._id === targetCat || c.id === targetCat || c.name === targetCat || c.slug === targetCat
    );

    if (!isAll && !targetCategory) {
      showActionError('Select a valid category before applying a category-scoped discount.');
      return;
    }

    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post('/api/products/bulk-discount', {
        discountPercent: pct,
        applyToAll: isAll,
        categoryId: isAll ? null : (targetCategory._id || targetCategory.id),
        categoryName: isAll ? null : targetCategory.name,
      }, { headers: authHeaders });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'The discount could not be applied.');
      }

      await fetchProductsAndCategories();
      setShowBulkDiscountModal(false);
      setActionSuccessToast(
        `${pct}% discount applied to ${res.data.data?.affectedCount ?? 0} product(s) in the database.`
      );
      setTimeout(() => setActionSuccessToast(''), 5000);
    } catch (err) {
      showActionError(err.response?.data?.message || err.message || 'The discount could not be applied.');
    }
  };

  const handleSaveTourBooking = (e) => {
    e.preventDefault();
    showActionError(
      'Bookings are created by customers through the storefront booking flow. This dashboard can update booking status, but cannot create a booking yet.'
    );
  };

  // Navigation Items Renderer
  const navItem = (id, label, icon) => {
    const isActive = activeTab === id;
    const Icon = icon;

    return (
      <button
        key={id}
        onClick={() => {
          setActiveTab(id);
          setMobileSidebarOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium cursor-pointer text-left transition-all duration-150 ${
          isActive
            ? 'bg-indigo-50/90 text-indigo-700 font-semibold border border-indigo-100/80 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-3 truncate">
          <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className="truncate">{label}</span>
        </div>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
        )}
      </button>
    );
  };

  const isTabAllowedForBusinessType = (tab, mode) => {
    if (tab === 'inventory') return false; // Inventory removed as requested
    if (tab === 'settings' || tab === 'billing' || tab === 'customer-view' || tab === 'overview') return true;

    // Check dynamic module assignment assigned by Super Admin
    if (tenant?.enabledModules) {
      const em = tenant.enabledModules;
      if (['orders', 'products', 'categories', 'coupons'].includes(tab)) {
        return Boolean(em.products);
      }
      if (tab === 'service-bookings') {
        return Boolean(em.serviceBookings);
      }
      if (tab === 'travel-bookings') {
        return Boolean(em.travelBookings);
      }
      if (tab === 'leads' || tab === 'customers') {
        return em.crmLeads !== false;
      }
      if (tab === 'marketing' || tab === 'ai-insights') {
        return em.marketingAds !== false;
      }
      if (tab === 'automations') {
        return em.automations !== false;
      }
      if (tab === 'staff' || tab === 'integrations' || tab === 'reports') {
        return true;
      }
    }

    if (mode === 'ALL') return true;
    if (mode === 'PRODUCT') {
      return tab !== 'service-bookings' && tab !== 'travel-bookings';
    }
    if (mode === 'SERVICE') {
      return tab !== 'orders' && tab !== 'products' && tab !== 'categories' && tab !== 'travel-bookings';
    }
    if (mode === 'TRAVEL') {
      return tab !== 'orders' && tab !== 'products' && tab !== 'categories' && tab !== 'service-bookings';
    }
    return true;
  };

  useEffect(() => {
    if (activeTab === 'inventory') {
      setActiveTab('products');
    }
  }, [activeTab]);

  return (
    <div className="h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans antialiased overflow-hidden">


      <div className="flex-1 flex min-w-0 overflow-hidden relative">
        {/* Mobile Sidebar Backdrop */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
          />
        )}

        {/* 1. Left Light Sidebar (Omniva MERCHANT WORKSPACE) */}
        <aside className={`${mobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50 flex shadow-2xl' : 'hidden md:flex'} w-64 bg-white flex-col shrink-0 select-none border-r border-slate-200 z-30 h-full overflow-hidden transition-all`}>
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-500/20">
            O
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-base tracking-tight leading-tight">Omniva</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">MERCHANT WORKSPACE</div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          <span>YOUR MODULES</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-bold border border-slate-200">
            {businessTypeMode}
          </span>
        </div>

        {/* Navigation Items (Dynamic by Business Type / Super Admin setting) */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          {navItem('overview', 'Overview', LayoutDashboard)}
          {navItem('customer-view', 'Customer View (Storefront)', Store)}

          {/* E-Commerce / Retail Modules */}
          {isTabAllowedForBusinessType('products', businessTypeMode) && (
            <>
              {businessTypeMode === 'ALL' && (
                <div className="pt-2 pb-1 px-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  E-Commerce &amp; Products
                </div>
              )}
              {navItem('orders', 'Orders & Fulfillment', ShoppingBag)}
              {navItem('products', 'Products (Catalog)', Package)}
              {navItem('categories', 'Categories', LayoutGrid)}
              {navItem('coupons', 'Coupons & Offers', Ticket)}
            </>
          )}

          {/* Service / Studio / Appointment Modules */}
          {isTabAllowedForBusinessType('service-bookings', businessTypeMode) && (
            <>
              {businessTypeMode === 'ALL' && (
                <div className="pt-2 pb-1 px-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Services &amp; Appointments
                </div>
              )}
              {navItem('service-bookings', 'Service Bookings', Camera)}
            </>
          )}

          {/* Travel & Tourism Modules */}
          {isTabAllowedForBusinessType('travel-bookings', businessTypeMode) && (
            <>
              {businessTypeMode === 'ALL' && (
                <div className="pt-2 pb-1 px-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Travel &amp; Tours
                </div>
              )}
              {navItem('travel-bookings', 'Travel Bookings', Compass)}
            </>
          )}

          {/* Core Growth, CRM & Operations */}
          {businessTypeMode === 'ALL' && (
            <div className="pt-2 pb-1 px-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              CRM &amp; Growth
            </div>
          )}
          {isTabAllowedForBusinessType('leads', businessTypeMode) && (
            <>
              {navItem('leads', 'Leads / CRM', Users2)}
              {navItem('customers', 'Customers', Users)}
            </>
          )}
          {isTabAllowedForBusinessType('marketing', businessTypeMode) && (
            <>
              {navItem('ai-insights', 'Business Insights', Sparkles)}
              {navItem('marketing', 'Marketing & Ads', Megaphone)}
            </>
          )}
          {isTabAllowedForBusinessType('automations', businessTypeMode) && (
            navItem('automations', 'Automations', Zap)
          )}
          {navItem('staff', 'Staff & Roles', ShieldCheck)}
          {navItem('integrations', 'Integrations', Share2)}
          {navItem('reports', 'Reports', BarChart3)}
          {navItem('billing', 'Subscription & Billing', CreditCard)}
          {navItem('settings', 'Store Settings', Settings)}
        </nav>

        {/* Bottom Profile Bar */}
        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className="flex items-center gap-2.5 overflow-hidden text-left cursor-pointer group"
            title="Manage Subscription & Billing"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:ring-2 ring-indigo-400 transition">
              DA
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition">{businessName}</div>
              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                <span className="text-emerald-600 font-semibold">{planName}</span> · {businessTypeMode} <span className="text-[9px] text-indigo-600 font-bold">⚡ Upgrade</span>
              </div>
            </div>
          </button>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. Main Light Content Area */}
      <div ref={mainContentRef} className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              title="Toggle Navigation Menu"
            >
              <List className="w-5 h-5" />
            </button>
            <div>
              <div className="text-[11px] font-medium text-slate-400 capitalize">
                {businessName} / {activeTab.replace('-', ' ')}
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 capitalize tracking-tight">
                {activeTab.replace('-', ' ')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${activeTab.replace('-', ' ')}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 w-44 sm:w-60 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Storefront Direct Action Button */}
            <button
              type="button"
              onClick={() => setActiveTab('customer-view')}
              title="View Customer Storefront"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl bg-white transition cursor-pointer text-xs font-bold shadow-xs"
            >
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>Customer View</span>
            </button>

            {/* Quick Actions */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              title="Store Settings"
              className="p-2 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl bg-white hover:bg-slate-50 transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              title="Subscription & Billing"
              className="p-2 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl bg-white hover:bg-slate-50 transition cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
            </button>

            {/* Interactive Real Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
                className="relative p-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl bg-white hover:bg-slate-50 transition cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white animate-pulse">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">Notifications</span>
                      {unreadNotifsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                          {unreadNotifsCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadNotifsCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNotifications(notifications.map(n => ({ ...n, unread: false })));
                          }}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {notifications.length === 0 && (
                      <div className="p-5 text-center space-y-1">
                        <p className="font-bold text-slate-700">No notifications loaded</p>
                        <p className="text-[11px] text-slate-500">
                          This dashboard does not currently receive a server notification feed. Check the order, stock and integration tabs directly.
                        </p>
                      </div>
                    )}
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          setNotifications(notifications.map(n => n.id === notif.id ? { ...n, unread: false } : n));
                          if (notif.actionTab) {
                            setActiveTab(notif.actionTab);
                            setShowNotifications(false);
                          }
                        }}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition flex items-start gap-3 ${
                          notif.unread ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                          notif.type === 'order' ? 'bg-emerald-100 text-emerald-700' :
                          notif.type === 'meta' ? 'bg-blue-100 text-blue-700' :
                          notif.type === 'whatsapp' ? 'bg-green-100 text-green-700' :
                          notif.type === 'courier' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {notif.type === 'order' && '📦'}
                          {notif.type === 'meta' && '🎯'}
                          {notif.type === 'whatsapp' && '💬'}
                          {notif.type === 'courier' && '🚚'}
                          {notif.type === 'stock' && '⚠️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-semibold text-xs truncate ${notif.unread ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{notif.description}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{notif.detail}</p>
                        </div>
                        {notif.unread && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5"></span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                    <span className="text-[10px] text-slate-500 font-medium">
                      Notifications are only shown when the server supplies them. No CAPI or WhatsApp delivery is claimed here.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('settings');
                setSettingsSubTab('profile');
              }}
              title="Business Profile & Settings"
              className="flex items-center gap-2 pl-2 border-l border-slate-200 text-left cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center group-hover:ring-2 ring-indigo-400 transition">
                {(user?.name || businessName || 'U').trim().charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition">{user?.name || 'Merchant owner'}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{user?.role === 'MERCHANT_OWNER' ? 'Business Admin' : (user?.role || 'Team member')}</div>
              </div>
            </button>
          </div>
        </header>

        {/* 3. Screen Views Switcher */}
        <div className="p-6 space-y-6">
          {/* Global Action Success Toast Banner */}
          {actionErrorToast && (
            <div className="bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionErrorToast}</span>
              </div>
              <button onClick={() => setActionErrorToast('')} className="text-white/80 hover:text-white cursor-pointer">✕</button>
            </div>
          )}

          {actionSuccessToast && (
            <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccessToast}</span>
              </div>
              <button onClick={() => setActionSuccessToast('')} className="text-white/80 hover:text-white cursor-pointer">✕</button>
            </div>
          )}

          {/* Module Inactive Guard: Renders if activeTab is not permitted for current business type */}
          {!isTabAllowedForBusinessType(activeTab, businessTypeMode) && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-sm my-8 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto text-2xl font-bold">
                🔒
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg capitalize">
                  {activeTab.replace('-', ' ')} Module Not Enabled
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  The Super Admin has designated <strong>{businessName}</strong> under the <strong>{businessTypeMode}</strong> business system.
                  This module is inactive to keep your business workspace isolated and streamlined.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer shadow-sm"
                >
                  Return to Active Modules
                </button>
                <button
                  onClick={() => {
                    setBusinessTypeMode('ALL');
                    setActionSuccessToast('Unlocked all modules in Super Admin Unified Mode');
                    setTimeout(() => setActionSuccessToast(''), 4000);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
                >
                  Switch Business Mode
                </button>
              </div>
            </div>
          )}

{/* ==================== 1. OVERVIEW SCREEN ==================== */}
          {activeTab === 'overview' && isTabAllowedForBusinessType('overview', businessTypeMode) && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Date Filter & Range Controller Bar - Pure Calendar Filter */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4 text-indigo-600" /> Date Calendar Filter
                    </h3>
                    <p className="text-[11px] text-slate-400">Select any custom date range via calendar to filter orders and analytics</p>
                  </div>

                  {/* Clean Calendar Button & Date Range Pickers */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setShowCalendarModal(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      <span>📅 Open Calendar ({startDate} &rarr; {endDate})</span>
                    </button>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                      <span className="text-xs font-bold text-slate-500">From:</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setSelectedRangeStart(e.target.value);
                          setDatePreset('CUSTOM');
                        }}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-500">To:</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setSelectedRangeEnd(e.target.value);
                          setDatePreset('CUSTOM');
                        }}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Total leads</span>
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">L</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900">{crmLeads.length}</div>
                    <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5" /> Loaded CRM leads
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Orders in range</span>
                    <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 font-bold text-xs flex items-center justify-center">O</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900">{rangeTotalOrders}</div>
                    <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                      <Package className="w-3.5 h-3.5" /> {rangeDeliveredCount} delivered in range
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Sales revenue</span>
                    <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center">₹</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900">₹{rangeRevenue.toLocaleString('en-IN')}</div>
                    <div className={`text-[11px] font-semibold flex items-center gap-1 mt-0.5 ${growthTone}`}>
                      {growthRate !== null && (growthRate >= 0
                        ? <ArrowUpRight className="w-3.5 h-3.5" />
                        : <ArrowDownRight className="w-3.5 h-3.5" />)}
                      {growthRate === null ? 'No prior-period revenue to compare' : `${growthRateLabel} vs prior cycle`}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Pending follow-ups</span>
                    <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 font-bold text-xs flex items-center justify-center">!</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900">{rangePendingCount}</div>
                    <div className="text-[11px] font-semibold text-amber-600 mt-0.5">NEW or CONFIRMED</div>
                  </div>
                </div>
              </div>

              {/* Row 2: Sales Overview Chart & Lead Pipeline */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Overview Line/Bar Chart (2 Cols) */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase">Sales overview</div>
                      <div className="text-2xl font-black text-slate-900">₹{rangeRevenue.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-slate-400">Paid and COD orders · {startDate} to {endDate}</div>
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setOverviewChartMode('bar')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                          overviewChartMode === 'bar' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Bar View
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverviewChartMode('circular')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                          overviewChartMode === 'circular' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Donut Split
                      </button>
                    </div>
                  </div>

                  {overviewChartMode === 'bar' ? (
                    <div className="h-48 w-full flex items-end gap-1.5 sm:gap-2.5 pt-6 pb-2 px-1 border-b border-slate-100 overflow-x-auto scrollbar-thin">
                      {dailyChartData.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          No orders or sales recorded for the selected date range.
                        </div>
                      ) : (
                        dailyChartData.map((d, idx) => {
                          const pct = maxDailyRevenue > 0 ? Math.round((d.revenue / maxDailyRevenue) * 100) : 0;
                          const barHeight = d.revenue > 0 ? Math.max(pct, 14) : 5;

                          return (
                            <div
                              key={d.dateStr || idx}
                              className="flex-1 min-w-[32px] max-w-[52px] h-full flex flex-col justify-end items-center gap-2 group cursor-pointer"
                            >
                              {/* Explicit Height Bar Column */}
                              <div className="w-full h-32 flex items-end justify-center relative">
                                <div
                                  style={{ height: `${barHeight}%` }}
                                  className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 relative ${
                                    d.revenue > 0
                                      ? 'bg-gradient-to-t from-indigo-600 via-indigo-500 to-indigo-400 group-hover:from-indigo-700 group-hover:to-indigo-500 shadow-xs'
                                      : 'bg-slate-200/90 group-hover:bg-slate-300'
                                  }`}
                                >
                                  {/* Tooltip on hover */}
                                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap shadow-xl z-30 flex flex-col items-center">
                                    <span className="font-extrabold text-emerald-400">₹{d.revenue.toLocaleString('en-IN')}</span>
                                    <span className="text-[9px] text-slate-300 font-medium">
                                      {d.count} {d.count === 1 ? 'order' : 'orders'} · {d.dayLabel}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Day Label */}
                              <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap text-center select-none">
                                {d.dayLabel}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <div className="h-48 w-full flex items-center justify-around py-3">
                      {(() => {
                        const codOrders = staffScopedOrders.filter(o => (o.pay || o.payMethod) === 'COD');
                        const onlineOrders = staffScopedOrders.filter(o => (o.pay || o.payMethod) === 'ONLINE' || (o.pay || o.payMethod) === 'UPI');
                        const codRev = codOrders.reduce((sum, o) => sum + (o.total || 0), 0);
                        const onlineRev = onlineOrders.reduce((sum, o) => sum + (o.total || 0), 0);
                        const totalRev = codRev + onlineRev || rangeRevenue || 1;
                        const onlinePct = Math.round((onlineRev / totalRev) * 100);
                        const codPct = 100 - onlinePct;

                        return (
                          <div className="flex flex-wrap items-center justify-center gap-8">
                            <div className="w-32 h-32 rounded-full border-8 border-indigo-500 border-t-emerald-500 flex items-center justify-center flex-col shadow-inner">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
                              <span className="font-black text-slate-900 text-sm">₹{rangeRevenue.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="space-y-3 text-xs">
                              <div className="flex items-center gap-2.5">
                                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
                                <div>
                                  <div className="text-slate-800 font-bold">Prepaid Online: {onlinePct}%</div>
                                  <div className="text-[11px] text-slate-400 font-medium">₹{onlineRev.toLocaleString('en-IN')} ({onlineOrders.length} orders)</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block shadow-xs"></span>
                                <div>
                                  <div className="text-slate-800 font-bold">Cash on Delivery: {codPct}%</div>
                                  <div className="text-[11px] text-slate-400 font-medium">₹{codRev.toLocaleString('en-IN')} ({codOrders.length} orders)</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Lead Pipeline Funnel (1 Col) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Lead pipeline</h3>
                      <p className="text-[11px] text-slate-400">Current open leads</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('leads')}
                      className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
                    >
                      View CRM &rarr;
                    </button>
                  </div>

                  {(() => {
                    const totalLeads = crmLeads.length || 1;
                    const newCount = crmLeads.filter(l => (l.status || '').toUpperCase() === 'NEW').length;
                    const contactedCount = crmLeads.filter(l => ['CONTACTED', 'DISCUSSION', 'QUOTATION_SENT'].includes((l.status || '').toUpperCase())).length;
                    const qualifiedCount = crmLeads.filter(l => (l.status || '').toUpperCase() === 'QUALIFIED').length;
                    const wonCount = crmLeads.filter(l => (l.status || '').toUpperCase() === 'WON').length;

                    const newPct = crmLeads.length > 0 ? Math.round((newCount / totalLeads) * 100) : 0;
                    const contactedPct = crmLeads.length > 0 ? Math.round((contactedCount / totalLeads) * 100) : 0;
                    const qualifiedPct = crmLeads.length > 0 ? Math.round((qualifiedCount / totalLeads) * 100) : 0;
                    const wonPct = crmLeads.length > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

                    return (
                      <div className="space-y-3.5 text-xs">
                        <div>
                          <div className="flex justify-between text-slate-600 font-semibold mb-1">
                            <span>New</span>
                            <span className="font-bold text-slate-900">{newCount}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${newPct}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-600 font-semibold mb-1">
                            <span>Contacted</span>
                            <span className="font-bold text-slate-900">{contactedCount}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${contactedPct}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-600 font-semibold mb-1">
                            <span>Qualified</span>
                            <span className="font-bold text-slate-900">{qualifiedCount}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${qualifiedPct}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-600 font-semibold mb-1">
                            <span>Won / Converted</span>
                            <span className="font-bold text-slate-900">{wonCount}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${wonPct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Row 3: Recent Orders & Today's Tasks */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders (2 Cols) */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 px-5 border-b border-slate-200/80 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Recent orders</h3>
                      <p className="text-[11px] text-slate-400">Latest customer orders</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
                    >
                      View all &rarr;
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-2.5 px-5">ORDER</th>
                          <th className="py-2.5 px-4">CUSTOMER</th>
                          <th className="py-2.5 px-4">AMOUNT</th>
                          <th className="py-2.5 px-4">PAYMENT</th>
                          <th className="py-2.5 px-5">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ordersList.slice(0, 5).map((ord, i) => (
                          <tr
                            key={ord.id || i}
                            onClick={() => setSelectedOrderForDetail(ord)}
                            className="hover:bg-slate-50 transition cursor-pointer"
                          >
                            <td className="py-3 px-5 font-mono font-bold text-indigo-700">{ord.id || ord.orderNumber}</td>
                            <td className="py-3 px-4 font-bold text-slate-800">{ord.customer || ord.customerName}</td>
                            <td className="py-3 px-4 font-black text-slate-900">₹{(ord.total || ord.totalAmount || 0).toLocaleString('en-IN')}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  (ord.pay || ord.paymentMethod) === 'PAID' || (ord.pay || ord.paymentMethod) === 'ONLINE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {ord.pay || ord.paymentMethod || 'Not recorded'}
                              </span>
                            </td>
                            <td className="py-3 px-5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ord.statusColor || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                {ord.status || ord.orderStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Today's Tasks (1 Col) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Today's tasks</h3>
                    <p className="text-[11px] text-slate-400">Follow-ups and operations</p>
                  </div>

                  {(() => {
                    const dynamicTasks = [];

                    // 1. Pending COD verification or confirmation
                    const pendingOrd = (ordersList || []).find(o => (o.orderStatus === 'PLACED' || o.orderStatus === 'PENDING' || o.status === 'PENDING'));
                    if (pendingOrd) {
                      dynamicTasks.push({
                        id: `task-ord-${pendingOrd.id || pendingOrd.orderNumber}`,
                        letter: 'C',
                        letterColor: 'bg-blue-50 text-blue-700',
                        title: `Call ${pendingOrd.customer || pendingOrd.customerName || 'Unnamed customer'}`,
                        subtitle: `${pendingOrd.pay || pendingOrd.paymentMethod || 'Payment method not recorded'} verification · Order #${pendingOrd.orderNumber || pendingOrd.id}`,
                        action: () => {
                          setSelectedOrderForDetail(pendingOrd);
                          setActiveTab('orders');
                        }
                      });
                    }

                    // 2. Low stock alert
                    const lowStock = (productsList || []).find(p => typeof p.inventoryCount === 'number' && p.inventoryCount <= 5);
                    if (lowStock) {
                      dynamicTasks.push({
                        id: `task-stock-${lowStock._id || lowStock.id}`,
                        letter: 'I',
                        letterColor: 'bg-amber-50 text-amber-700',
                        title: `Restock ${lowStock.title || lowStock.name}`,
                        subtitle: `Low inventory (${lowStock.inventoryCount} units remaining)`,
                        action: () => setActiveTab('products')
                      });
                    }

                    // 3. New CRM Lead
                    const freshLead = (crmLeads || []).find(l => (l.status || '').toUpperCase() === 'NEW');
                    if (freshLead) {
                      dynamicTasks.push({
                        id: `task-lead-${freshLead._id || freshLead.id}`,
                        letter: 'L',
                        letterColor: 'bg-purple-50 text-purple-700',
                        title: `Follow-up with ${freshLead.name}`,
                        subtitle: `New ${freshLead.source || 'unknown source'} lead · ${freshLead.phone || freshLead.email || 'Awaiting contact'}`,
                        action: () => {
                          setSelectedLead(freshLead);
                          setActiveTab('leads');
                        }
                      });
                    }

                    // 4. Dispatch/Processing order
                    const dispatchOrd = (ordersList || []).find(o => (o.orderStatus === 'PROCESSING' || o.status === 'PROCESSING'));
                    if (dispatchOrd) {
                      dynamicTasks.push({
                        id: `task-disp-${dispatchOrd.id || dispatchOrd.orderNumber}`,
                        letter: 'D',
                        letterColor: 'bg-emerald-50 text-emerald-700',
                        title: `Courier Pickup ready`,
                        subtitle: `Order #${dispatchOrd.orderNumber || dispatchOrd.id} packed for ${dispatchOrd.customer || 'delivery'}`,
                        action: () => {
                          setSelectedOrderForDetail(dispatchOrd);
                          setActiveTab('orders');
                        }
                      });
                    }

                    return (
                      <div className="space-y-3 text-xs">
                        {dynamicTasks.length > 0 ? (
                          dynamicTasks.map(t => (
                            <div
                              key={t.id}
                              onClick={t.action}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3 hover:bg-slate-100/70 transition cursor-pointer"
                            >
                              <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center shrink-0 ${t.letterColor}`}>
                                {t.letter}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{t.title}</div>
                                <div className="text-[11px] text-slate-500">{t.subtitle}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center text-emerald-700 space-y-1">
                            <div className="font-bold text-xs">All tasks up to date!</div>
                            <div className="text-[11px] text-emerald-600">No urgent follow-ups, low stock or pending verifications.</div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

                    {/* ==================== 2. LEADS / CRM ==================== */}
          {activeTab === 'leads' && (() => {
            const filteredCrmLeads = crmLeads.filter((l) => {
              const effectiveSearch = (crmSearch || searchTerm || '').trim().toLowerCase();
              const tokens = effectiveSearch.split(/\s+/).filter(Boolean);
              const searchable = `${l.name || ''} ${l.phone || ''} ${l.email || ''} ${l.campaignName || ''} ${l.source || ''} ${l.status || ''} ${(l.notes || []).map(n => n.note).join(' ')}`.toLowerCase();
              const matchesSearch = tokens.length === 0 || tokens.every(t => searchable.includes(t));
              const matchesStage = crmStageFilter === 'ALL' || l.status === crmStageFilter;
              const matchesSource = crmSourceFilter === 'ALL' || l.source === crmSourceFilter;
              return matchesSearch && matchesStage && matchesSource;
            });

            const newCount = crmLeads.filter(l => l.status === 'NEW').length;
            const inDiscussionCount = crmLeads.filter(l => ['CONTACTED', 'QUALIFIED', 'QUOTATION_SENT'].includes(l.status)).length;
            const wonLeads = crmLeads.filter(l => l.status === 'WON');
            const wonCount = wonLeads.length;
            const wonValue = wonLeads.reduce((acc, l) => acc + (Number(l.budget) || 0), 0);

            return (
              <div className="space-y-5">
                {/* Header with Title & Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Lead CRM & Enquiry Pipeline</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {crmLeads.length} Enquiries
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Facebook & Instagram Lead Ads, website enquiries, direct WhatsApp chats, and phone calls.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Meta Lead Ads Live Sync</span>
                    </div>

                    {/* View Switcher (Table vs Kanban) */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setCrmViewMode('table')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          crmViewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" /> List
                      </button>
                      <button
                        type="button"
                        onClick={() => setCrmViewMode('kanban')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          crmViewMode === 'kanban' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" /> Pipeline Board
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSyncMetaLeads}
                      disabled={syncingMeta || crmLoading}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${syncingMeta || crmLoading ? 'animate-spin' : ''}`} />
                      <span>{syncingMeta || crmLoading ? 'Syncing...' : 'Sync Meta Leads'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAddLeadModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Add New Lead
                    </button>
                  </div>
                </div>

                {/* 4 Stat Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <div className="text-xs text-slate-500 font-medium">Total Enquiries (Total Leads)</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">{crmLeads.length}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Across all advertising channels</div>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>New Enquiries</span>
                    </div>
                    <div className="text-2xl font-black text-blue-700 mt-2">{newCount}</div>
                    <div className="text-[11px] text-blue-600 font-medium mt-0.5">Needs immediate follow-up</div>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>In Discussion (Follow-up)</span>
                    </div>
                    <div className="text-2xl font-black text-amber-700 mt-2">{inDiscussionCount}</div>
                    <div className="text-[11px] text-amber-600 font-medium mt-0.5">Contacted & Qualified</div>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Orders Won (Khareed Liya)</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-700 mt-2">{wonCount}</div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-0.5">₹{wonValue.toLocaleString('en-IN')} Converted Revenue</div>
                  </div>
                </div>

                {/* Search & Filters Strip */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={crmSearch}
                        onChange={(e) => setCrmSearch(e.target.value)}
                        placeholder="Search lead by name, phone or campaign..."
                        className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Stage:</span>
                      <select
                        value={crmStageFilter}
                        onChange={(e) => setCrmStageFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="ALL">All Stages ({crmLeads.length})</option>
                        {CRM_STAGES.map(s => (
                          <option key={s.key} value={s.key}>
                            {s.label} ({crmLeads.filter(l => l.status === s.key).length})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Source:</span>
                      <select
                        value={crmSourceFilter}
                        onChange={(e) => setCrmSourceFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="ALL">All Channels</option>
                        <option value="META_ADS">Meta (Facebook & Instagram) Ads</option>
                        <option value="WHATSAPP">WhatsApp Direct</option>
                        <option value="WEBSITE">Online Storefront</option>
                        <option value="REFERRAL">Referral / Word of Mouth</option>
                        <option value="MANUAL">Direct Call / Walk-in</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-500">
                    Showing <strong className="text-slate-900">{filteredCrmLeads.length}</strong> of {crmLeads.length} enquiries
                  </div>
                </div>

                {/* VIEW 1: TABLE VIEW */}
                {crmViewMode === 'table' && (
                  <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-3.5 px-5">CUSTOMER & SOURCE</th>
                            <th className="py-3.5 px-4">PHONE NUMBER (CALL / WHATSAPP)</th>
                            <th className="py-3.5 px-4">CAMPAIGN & VALUE</th>
                            <th className="py-3.5 px-4">STAGE (STATUS)</th>
                            <th className="py-3.5 px-4">LATEST NOTE / REMARK</th>
                            <th className="py-3.5 px-5 text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredCrmLeads.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-400">
                                No enquiries found. Reset search or filters.
                              </td>
                            </tr>
                          ) : (
                            filteredCrmLeads.map((lead) => {
                              const stage = getStageMeta(lead.status);
                              const src = getSourceBadge(lead.source, lead.platform);
                              const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '').slice(-10);
                              const waMessage = encodeURIComponent(
                                `Hello ${lead.name}, regarding your enquiry at ${businessName || 'our store'}. How can we help you with your order?`
                              );
                              const latestNote = lead.notes && lead.notes.length > 0 ? lead.notes[lead.notes.length - 1] : null;

                              return (
                                <tr key={lead._id} className="hover:bg-slate-50/80 transition">
                                  {/* 1. Customer & Source */}
                                  <td className="py-3.5 px-5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                        {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
                                      </div>
                                      <div>
                                        <div
                                          onClick={() => setSelectedLead(lead)}
                                          className="font-bold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer"
                                        >
                                          {lead.name}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${src.color}`}>
                                            {src.label}
                                          </span>
                                          {lead.metaFormName && (
                                            <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[120px]" title={lead.metaFormName}>
                                              {lead.metaFormName}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* 2. Visible Phone & Instant Action Badges */}
                                  <td className="py-3.5 px-4">
                                    <div className="space-y-1.5">
                                      <div className="font-mono font-bold text-slate-900 text-xs">
                                        +91 {cleanPhone || lead.phone}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <a
                                          href={`tel:${cleanPhone || lead.phone}`}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition"
                                          title="Call customer directly"
                                        >
                                          <Phone className="w-3 h-3 text-emerald-600" />
                                          <span>Call</span>
                                        </a>

                                        <a
                                          href={`https://wa.me/91${cleanPhone}?text=${waMessage}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-xs"
                                          title="Open WhatsApp chat with pre-filled message"
                                        >
                                          <MessageCircle className="w-3 h-3" />
                                          <span>WhatsApp</span>
                                        </a>
                                      </div>
                                    </div>
                                  </td>

                                  {/* 3. Campaign & Value */}
                                  <td className="py-3.5 px-4">
                                    <div>
                                      <div className="font-semibold text-slate-800 text-xs truncate max-w-xs" title={lead.campaignName || lead.adName}>
                                        {lead.campaignName || lead.adName || 'Direct Store Inquiry'}
                                      </div>
                                      <div className="text-[11px] font-bold text-indigo-700 mt-0.5">
                                        Est. Value: ₹{Number(lead.budget) || 500}
                                      </div>
                                    </div>
                                  </td>

                                  {/* 4. Interactive Stage Selector */}
                                  <td className="py-3.5 px-4">
                                    <select
                                      value={lead.status}
                                      onChange={(e) => handleUpdateLeadStage(lead._id, e.target.value)}
                                      className={`px-2.5 py-1 rounded-xl text-xs font-bold border cursor-pointer focus:outline-none ${stage.badgeColor}`}
                                    >
                                      {CRM_STAGES.map(s => (
                                        <option key={s.key} value={s.key}>
                                          {s.label}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  {/* 5. Latest Note */}
                                  <td className="py-3.5 px-4 max-w-xs">
                                    {latestNote ? (
                                      <div>
                                        <p className="text-[11px] text-slate-700 line-clamp-2 italic">
                                          "{latestNote.note}"
                                        </p>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                          by {latestNote.authorName || 'Staff'}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 italic">No notes yet</span>
                                    )}
                                  </td>

                                  {/* 6. Action */}
                                  <td className="py-3.5 px-5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedLead(lead)}
                                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 font-bold text-xs cursor-pointer transition shadow-xs"
                                    >
                                      Notes & Details
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* VIEW 2: KANBAN PIPELINE BOARD */}
                {crmViewMode === 'kanban' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                      { key: 'NEW', title: 'New Leads', color: 'border-t-blue-500' },
                      { key: 'CONTACTED', title: 'Contacted', color: 'border-t-amber-500' },
                      { key: 'QUALIFIED', title: 'Qualified', color: 'border-t-purple-500' },
                      { key: 'QUOTATION_SENT', title: 'Quote Sent', color: 'border-t-indigo-500' },
                      { key: 'WON', title: 'Order Won', color: 'border-t-emerald-500' }
                    ].map((col) => {
                      const colLeads = filteredCrmLeads.filter(l => l.status === col.key);
                      const colTotal = colLeads.reduce((acc, l) => acc + (Number(l.budget) || 0), 0);

                      return (
                        <div key={col.key} className={`bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 flex flex-col gap-3 border-t-4 ${col.color}`}>
                          {/* Column Header */}
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs">{col.title}</h4>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                ₹{colTotal.toLocaleString('en-IN')} total
                              </span>
                            </div>
                            <span className="w-5 h-5 rounded-full bg-white text-slate-700 font-bold text-[11px] flex items-center justify-center border border-slate-200 shadow-xs">
                              {colLeads.length}
                            </span>
                          </div>

                          {/* Column Cards */}
                          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-0.5">
                            {colLeads.length === 0 ? (
                              <div className="p-4 text-center text-[11px] text-slate-400 bg-white/60 rounded-xl border border-dashed border-slate-200">
                                No leads in this stage
                              </div>
                            ) : (
                              colLeads.map((lead) => {
                                const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '').slice(-10);
                                const waMessage = encodeURIComponent(
                                  `Hello ${lead.name}, regarding your enquiry at ${businessName || 'our store'}. How can we assist you?`
                                );

                                return (
                                  <div
                                    key={lead._id}
                                    className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-xs hover:shadow-md transition"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="font-bold text-slate-900 text-xs">{lead.name}</div>
                                        <div className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]" title={lead.campaignName}>
                                          {lead.campaignName || lead.source}
                                        </div>
                                      </div>
                                      <span className="font-bold text-indigo-700 text-xs">
                                        ₹{lead.budget || 500}
                                      </span>
                                    </div>

                                    {/* Phone & Instant Actions */}
                                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
                                      <div className="font-mono font-bold text-slate-800 text-xs">
                                        +91 {cleanPhone || lead.phone}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <a
                                          href={`tel:${cleanPhone || lead.phone}`}
                                          className="flex-1 py-1 px-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center justify-center gap-1"
                                        >
                                          <Phone className="w-2.5 h-2.5" /> Call
                                        </a>
                                        <a
                                          href={`https://wa.me/91${cleanPhone}?text=${waMessage}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex-1 py-1 px-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-xs"
                                        >
                                          <MessageCircle className="w-2.5 h-2.5" /> WhatsApp
                                        </a>
                                      </div>
                                    </div>

                                    {/* Stage Progression & Detail */}
                                    <div className="flex items-center justify-between pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedLead(lead)}
                                        className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                                      >
                                        Notes ({lead.notes?.length || 0})
                                      </button>

                                      <select
                                        value={lead.status}
                                        onChange={(e) => handleUpdateLeadStage(lead._id, e.target.value)}
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer"
                                      >
                                        {CRM_STAGES.map(s => (
                                          <option key={s.key} value={s.key}>{s.label.split(' ')[0]}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* MODAL 1: ADD NEW LEAD POPUP */}
                {showAddLeadModal && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-indigo-600" />
                            <span>Add New Lead / Enquiry</span>
                          </h3>
                          <p className="text-xs text-slate-400">Direct phone, Instagram, WhatsApp ya walk-in customer enquiry</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddLeadModal(false)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer text-sm font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-slate-700 font-bold block mb-1">Customer Full Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Rahul Sharma"
                              value={newLeadForm.name}
                              onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                            />
                          </div>

                          <div>
                            <label className="text-slate-700 font-bold block mb-1">Customer Phone Number *</label>
                            <input
                              type="tel"
                              required
                              placeholder="e.g. 9876543210"
                              value={newLeadForm.phone}
                              onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 font-mono font-medium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-slate-700 font-bold block mb-1">Email Address (Optional)</label>
                            <input
                              type="email"
                              placeholder="customer@example.com"
                              value={newLeadForm.email}
                              onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-slate-700 font-bold block mb-1">Lead Acquisition Channel</label>
                            <select
                              value={newLeadForm.source}
                              onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                            >
                              <option value="META_ADS">Meta (Facebook / Instagram) Ad</option>
                              <option value="WHATSAPP">WhatsApp Direct Message</option>
                              <option value="WEBSITE">Online Storefront Inquiry</option>
                              <option value="REFERRAL">Referral / Friends</option>
                              <option value="MANUAL">Direct Phone Call / Walk-in</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-slate-700 font-bold block mb-1">Campaign / Inquired Product</label>
                            <input
                              type="text"
                              placeholder="e.g. Product name and pack size"
                              value={newLeadForm.campaignName}
                              onChange={(e) => setNewLeadForm({ ...newLeadForm, campaignName: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-slate-700 font-bold block mb-1">Estimated Value / Budget (₹)</label>
                            <input
                              type="number"
                              placeholder="750"
                              value={newLeadForm.budget}
                              onChange={(e) => setNewLeadForm({ ...newLeadForm, budget: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Initial Discussion Note / Requirement</label>
                          <textarea
                            rows={2}
                            placeholder="Customer requirement details (e.g., Requested product sample, inquired about 5kg bulk catering pricing)"
                            value={newLeadForm.note}
                            onChange={(e) => setNewLeadForm({ ...newLeadForm, note: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddLeadModal(false)}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer shadow-sm"
                          >
                            Save & Add Lead
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* MODAL 2: LEAD DETAILS & NOTES TIMELINE DRAWER */}
                {selectedLead && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                            {selectedLead.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{selectedLead.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStageMeta(selectedLead.status).badgeColor}`}>
                                {getStageMeta(selectedLead.status).label}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {selectedLead.campaignName || selectedLead.source}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedLead(null)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer text-sm font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Contact Bar */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone Number</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            +91 {selectedLead.phone}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${selectedLead.phone}`}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1.5 transition"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Call</span>
                          </a>

                          <a
                            href={`https://wa.me/91${(selectedLead.phone || '').replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${selectedLead.name}, this is ${businessName || 'our store'} following up on your enquiry.`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>

                      {/* Change Stage & Budget */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Update Sales Stage</label>
                          <select
                            value={selectedLead.status}
                            onChange={(e) => handleUpdateLeadStage(selectedLead._id, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold cursor-pointer"
                          >
                            {CRM_STAGES.map(s => (
                              <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Estimated Value</label>
                          <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold">
                            ₹{selectedLead.budget || 500}
                          </div>
                        </div>
                      </div>

                      {/* Meta Ads Campaign & Form Answers Card */}
                      {(selectedLead.source === 'META_ADS' || selectedLead.metaLeadId || (selectedLead.formAnswers && selectedLead.formAnswers.length > 0)) && (
                        <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80 space-y-3 text-xs">
                          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                            <div className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                              <span>📸 Meta Lead Ad Details</span>
                              {selectedLead.platform && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-700">
                                  {selectedLead.platform === 'ig' ? 'Instagram' : selectedLead.platform === 'fb' ? 'Facebook' : 'Meta'}
                                </span>
                              )}
                            </div>
                            {selectedLead.createdAt && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                Received {new Date(selectedLead.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px]">Facebook Page</span>
                              <span className="font-bold text-slate-800">{selectedLead.metaPageName || 'Connected Page'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px]">Instant Form Name</span>
                              <span className="font-bold text-slate-800">{selectedLead.metaFormName || 'Instant Lead Form'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px]">Campaign Name</span>
                              <span className="font-bold text-slate-800">{selectedLead.campaignName || 'Meta Campaign'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px]">Ad Creative</span>
                              <span className="font-bold text-slate-800">{selectedLead.adName || 'Ad Creative'}</span>
                            </div>
                          </div>

                          {/* Customer Form Question Answers */}
                          {selectedLead.formAnswers && selectedLead.formAnswers.length > 0 && (
                            <div className="pt-2 border-t border-indigo-100 space-y-1.5">
                              <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider block">
                                Customer Form Submission Answers
                              </span>
                              <div className="space-y-1 bg-white p-2.5 rounded-lg border border-indigo-100">
                                {selectedLead.formAnswers.map((fa, i) => (
                                  <div key={i} className="flex flex-col text-[11px] py-1 border-b border-slate-50 last:border-b-0">
                                    <span className="text-slate-500 font-semibold">{fa.question || fa.fieldKey}:</span>
                                    <span className="font-bold text-slate-900">{fa.answer}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes Timeline */}
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <h4 className="font-bold text-slate-900 text-xs">Customer Discussion History & Notes</h4>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {selectedLead.notes && selectedLead.notes.length > 0 ? (
                            selectedLead.notes.map((note, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                                <p className="text-slate-800 font-medium">{note.note}</p>
                                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                                  <span>{note.authorName || 'Staff'}</span>
                                  <span>{new Date(note.createdAt || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                              No discussion notes added yet.
                            </div>
                          )}
                        </div>

                        {/* Add New Note Box */}
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            placeholder="Type new follow-up note (e.g. Customer requested parcel dispatch on Friday)..."
                            value={newLeadNote}
                            onChange={(e) => setNewLeadNote(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddLeadNote(selectedLead._id);
                              }
                            }}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddLeadNote(selectedLead._id)}
                            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer shadow-sm shrink-0"
                          >
                            Add Note
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ==================== 3. CUSTOMERS DIRECTORY ==================== */}
          {activeTab === 'customers' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Registered Customer Directory</h2>
                  <p className="text-xs text-slate-500">Track purchase history, lifetime value (LTV), and WhatsApp re-engagement</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCustomersCsv}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-medium text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Customers CSV
                  </button>
                  <button
                    onClick={() => setShowAddCustomerModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add customer
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Customer records</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{customersList.length}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Verified buyers in directory</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Repeat customers</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {customersList.filter(c => c.orders > 1).length}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                    {Math.round((customersList.filter(c => c.orders > 1).length / (customersList.length || 1)) * 100)}% repeat rate
                  </div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">High-value customers</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {customersList.filter(c => c.ltv >= 2000).length}
                  </div>
                  <div className="text-[11px] text-indigo-600 font-medium mt-0.5">LTV &gt; ₹2,000 spenders</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Total Customer LTV</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    ₹{customersList.reduce((sum, c) => sum + c.ltv, 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Cumulative lifetime sales</div>
                </div>
              </div>

              {/* Customers Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-5">CUSTOMER</th>
                        <th className="py-3 px-4">MOBILE</th>
                        <th className="py-3 px-4">EMAIL</th>
                        <th className="py-3 px-4">ORDERS</th>
                        <th className="py-3 px-4">LIFETIME VALUE</th>
                        <th className="py-3 px-4">CONSENT</th>
                        <th className="py-3 px-5 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customersList
                        .filter(c => !searchTerm.trim() || c.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) || c.mobile.includes(searchTerm.trim()) || c.email.toLowerCase().includes(searchTerm.toLowerCase().trim()))
                        .map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                                {c.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{c.name}</div>
                                <div className="text-[10px] text-slate-400">{c.last}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{c.mobile}</td>
                          <td className="py-3 px-4 text-slate-600">{c.email}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{c.orders} orders</td>
                          <td className="py-3 px-4 font-black text-slate-900">{c.displayLtv}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.commColor}`}>
                              {c.comm}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-right">
                            <a
                              href={`https://wa.me/${c.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${c.name}! Greetings from ${businessName || 'our store'}. How can we help you today?`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition border border-emerald-200"
                            >
                              <Phone className="w-3 h-3" /> WhatsApp
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 4. PRODUCTS CATALOG (PAGE 1) ==================== */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" />
                    Products Catalog
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Storefront SKUs
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage pricing, SKU, photo and stock for each product here.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkDiscountModal(true)}
                    className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition"
                    title="Apply discount percentage across every product"
                  >
                    <Percent className="w-3.5 h-3.5 text-amber-600" /> ⚡ Storewide Discount
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('coupons')}
                    className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition"
                    title="Manage storefront coupons and promo codes"
                  >
                    <Ticket className="w-3.5 h-3.5 text-emerald-600" /> 🎟️ Coupon Offers ({couponsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('categories')}
                    className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> 📂 Categories ({categoriesList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add New Product
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Active Products</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{productsList.length} SKUs</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Across {categoriesList.length} categories</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Total Units Stocked</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {productsList.reduce((acc, p) => acc + (typeof p.stock === 'number' ? p.stock : parseInt(p.stock) || 0), 0)} Units
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Warehouse ready</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Low Stock Warning</div>
                  <div className="text-2xl font-black text-amber-600 mt-2">
                    {productsList.filter(p => (parseInt(p.stock) || 0) < 20).length} Items
                  </div>
                  <div className="text-[11px] text-amber-600 font-medium mt-0.5">Restock recommended</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Customer Storefront</div>
                  <div className="text-xs font-mono font-bold text-indigo-600 truncate mt-2">/store/{businessSlug}</div>
                  <a
                    href={`/store/${businessSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 mt-0.5"
                  >
                    View Live Storefront <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Filter Pills Bar: Categories Filter & Search */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                      Filter Category:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap text-xs ${
                        selectedCategoryFilter === 'ALL'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All ({productsList.length})
                    </button>
                    {categoriesList.map(cat => {
                      const count = productsList.filter(p => p.cat === cat.name).length;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategoryFilter(cat.name)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap text-xs ${
                            selectedCategoryFilter === cat.name
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat.name} ({count})
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium">
                    Showing <strong>{
                      productsList.filter(p => {
                        if (searchTerm.trim()) {
                          const tokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
                          const searchable = `${p.name || ''} ${p.cat || ''} ${p.sku || ''} ${p.price || ''}`.toLowerCase();
                          return tokens.every(t => searchable.includes(t));
                        }
                        if (selectedCategoryFilter !== 'ALL' && p.cat !== selectedCategoryFilter) return false;
                        return true;
                      }).length
                    }</strong> products
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-5">PRODUCT / PHOTO</th>
                        <th className="py-3 px-4">CATEGORY</th>
                        <th className="py-3 px-4">PRICE</th>
                        <th className="py-3 px-4">STOCK</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-4">VISIBILITY</th>
                        <th className="py-3 px-5 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productsList
                        .filter(p => {
                          if (searchTerm.trim()) {
                            const tokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
                            const searchable = `${p.name || ''} ${p.cat || ''} ${p.sku || ''} ${p.price || ''}`.toLowerCase();
                            return tokens.every(t => searchable.includes(t));
                          }
                          if (selectedCategoryFilter !== 'ALL' && p.cat !== selectedCategoryFilter) return false;
                          return true;
                        })
                        .map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.img || NO_IMAGE_PLACEHOLDER}
                                alt={p.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm"
                              />
                              <div>
                                <div className="font-bold text-slate-900">{p.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</div>
                                {p.jars && p.jars.filter(j => j.enabled !== false).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {p.jars.filter(j => j.enabled !== false).map((j, jI) => (
                                      <span key={j.id || jI} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                                        <Tag className="w-3 h-3" /> {j.name}: <strong className="font-bold">₹{j.price}</strong>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                              {p.cat}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-black text-slate-900 text-xs">{p.price}</span>
                                {p.compareAtPrice && (
                                  <span className="text-[10px] text-slate-400 line-through">
                                    ₹{typeof p.compareAtPrice === 'number' ? p.compareAtPrice : String(p.compareAtPrice).replace(/[^0-9.]/g, '')}
                                  </span>
                                )}
                              </div>
                              {(() => {
                                const currentPriceNum = parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0;
                                const compareAtNum = p.compareAtPrice ? (parseFloat(String(p.compareAtPrice).replace(/[^0-9.]/g, '')) || 0) : 0;
                                const discount = (compareAtNum > currentPriceNum && compareAtNum > 0)
                                  ? Math.round(((compareAtNum - currentPriceNum) / compareAtNum) * 100)
                                  : (p.discountPercent || 23);
                                return (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md mt-0.5 w-fit">
                                    <span>🔥</span> {discount}% OFF
                                  </span>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            <div className="flex items-center gap-2">
                              <span>{p.stock}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAddStock(p);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-[10px] font-bold text-slate-600 cursor-pointer transition border border-slate-200"
                                  title="Quick +10 Units"
                                >
                                  +10
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.statusColor}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">{p.vis}</td>
                          <td className="py-3 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditProduct(p, idx)}
                                className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-600 hover:text-white font-bold text-xs cursor-pointer transition flex items-center gap-1 shadow-2xs"
                              >
                                <span>✏️ Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p)}
                                className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 cursor-pointer transition"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 4B. PRODUCT CATEGORIES SHOWCASE (PAGE 2) ==================== */}
          {activeTab === 'categories' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-indigo-600" />
                    Product Categories &amp; Varieties
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      Storefront Showcase
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage high-resolution photos and details of each product variety displayed on the storefront.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Package className="w-3.5 h-3.5" /> 📦 Products Catalog ({productsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryModal(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add New Category
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Product Categories</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{categoriesList.length} Varieties</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Categories currently in the catalog</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Products in Categories</div>
                  <div className="text-2xl font-black text-purple-600 mt-2">{productsList.length} SKUs</div>
                  <div className="text-[11px] text-purple-600 font-medium mt-0.5">Categorized in collections</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Storefront Imagery</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{productsList.filter(p => p.img || p.images?.length).length}/{productsList.length}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">Products with an uploaded image</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Customer View</div>
                  <div className="text-xs font-mono font-bold text-indigo-600 truncate mt-2">/store/{businessSlug}</div>
                  <a
                    href={`/store/${businessSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 mt-0.5"
                  >
                    Open Live Storefront <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Showcase Banner */}
              <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    📸
                  </div>
                  <div>
                    <div className="font-extrabold text-indigo-950">Storefront Category Image Slider Active</div>
                    <div className="text-indigo-700 text-[11px]">
                      These high-resolution photos are displayed on your customer storefront hero slider and synced with Meta ad campaigns.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + New Category
                  </button>
                  <a
                    href={`/store/${businessSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    View on Storefront <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Grid of Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {categoriesList.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-indigo-300 transition group"
                  >
                    <div className="relative h-44 bg-slate-900 overflow-hidden">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = 'none';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-black/60 px-2.5 py-0.5 rounded-full border border-white/20">
                          {cat.productsCount} Products
                        </span>
                        <div className="font-black text-sm mt-1">{cat.name}</div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {cat.description}
                      </p>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategoryFilter(cat.name);
                            setActiveTab('products');
                            setActionSuccessToast(`Filtered Products by category: ${cat.name}`);
                            setTimeout(() => setActionSuccessToast(''), 3000);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>👉 View Products ({cat.productsCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryPhotoUrl(cat.image);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>Change Photo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 4C. COUPONS & PROMOTIONAL OFFERS (PAGE 3) ==================== */}
          {activeTab === 'coupons' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-indigo-600" />
                    Coupons &amp; Promotional Offers
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Storefront Deals
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Create discount voucher codes, festive deals, and storewide product discounts for your storefront.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkDiscountModal(true)}
                    className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Percent className="w-3.5 h-3.5 text-amber-600" /> ⚡ Storewide Product Discount
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCouponModal(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Create New Coupon
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Active Coupons</div>
                  <div className="text-2xl font-black text-indigo-600 mt-2">
                    {couponsList.filter(c => c.isActive).length} Codes
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {couponsList.filter(c => !c.isActive).length} paused / draft
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Coupon Redemptions</div>
                  <div className="text-2xl font-black text-emerald-600 mt-2">
                    {couponsList.reduce((acc, c) => acc + (c.usageCount || 0), 0)} Orders
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Recorded usage count</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Recorded Savings (Flat Coupons)</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    ₹{couponsList.reduce((acc, c) => acc + (c.discountType === 'FLAT' ? (c.usageCount || 0) * (c.discountValue || 0) : 0), 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-indigo-600 font-medium mt-0.5">Percentage-coupon savings are not tracked</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Storewide Pricing Tool</div>
                  <div className="text-sm font-bold text-amber-700 truncate mt-2 flex items-center gap-1">
                    <span>🔥</span> Overwrite catalog selling prices
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBulkDiscountModal(true)}
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 mt-0.5 font-bold cursor-pointer"
                  >
                    Adjust Storewide Discount &rarr;
                  </button>
                </div>
              </div>

              {/* Storewide Product Discount Quick Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                    %
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Storewide Discount (Every Product)
                    </h3>
                    <p className="text-xs text-slate-600">
                      Review a storewide or category discount before applying it. This overwrites selling prices and is not a reversible coupon.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkDiscountForm({ discountPercent: 10, scope: 'ALL', categoryName: 'ALL' });
                      setShowBulkDiscountModal(true);
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer shadow-xs transition"
                  >
                    10% OFF All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkDiscountForm({ discountPercent: 15, scope: 'ALL', categoryName: 'ALL' });
                      setShowBulkDiscountModal(true);
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer shadow-xs transition"
                  >
                    15% OFF All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkDiscountForm({ discountPercent: 20, scope: 'ALL', categoryName: 'ALL' });
                      setShowBulkDiscountModal(true);
                    }}
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition"
                  >
                    20% OFF All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkDiscountModal(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition"
                  >
                    Custom %
                  </button>
                </div>
              </div>

              {/* Coupons List Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {couponsList.map((coupon, cIdx) => (
                  <div
                    key={coupon._id || coupon.id || cIdx}
                    className={`bg-white border rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                      coupon.isActive ? 'border-slate-200 hover:border-indigo-400' : 'border-slate-200/60 opacity-75 bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          coupon.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {coupon.isActive ? '● ACTIVE LIVE' : '⏸️ PAUSED'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Redeemed {coupon.usageCount || 0} times
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 bg-slate-50 border border-dashed border-indigo-300 p-2.5 rounded-xl">
                        <div className="flex items-center gap-1.5">
                          <Ticket className="w-4 h-4 text-indigo-600" />
                          <span className="font-mono font-black text-indigo-950 text-base tracking-wider">
                            {coupon.code}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            setActionSuccessToast(`Copied code "${coupon.code}" to clipboard!`);
                            setTimeout(() => setActionSuccessToast(''), 2500);
                          }}
                          className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer shadow-2xs"
                        >
                          Copy Code
                        </button>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {coupon.title || `${coupon.code} Offer`}
                        </h4>
                        {coupon.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {coupon.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1 text-xs pt-1 border-t border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Discount Benefit:</span>
                          <span className="font-black text-emerald-600">
                            {coupon.discountType === 'PERCENTAGE'
                              ? `${coupon.discountValue}% OFF`
                              : `Flat ₹${coupon.discountValue} OFF`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Minimum Cart Order:</span>
                          <span className="font-semibold text-slate-800">
                            {coupon.minOrderValue > 0 ? `₹${coupon.minOrderValue}` : 'No minimum'}
                          </span>
                        </div>
                        {coupon.maxDiscount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Max Discount Limit:</span>
                            <span className="font-semibold text-slate-800">₹{coupon.maxDiscount}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCouponStatus(coupon)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                          coupon.isActive
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {coupon.isActive ? 'Pause Code' : 'Activate Code'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const shareUrl = `${window.location.origin}/store/${businessSlug}?coupon=${coupon.code}`;
                          navigator.clipboard.writeText(shareUrl);
                          setActionSuccessToast(`Copied promotional store link with coupon "${coupon.code}"!`);
                          setTimeout(() => setActionSuccessToast(''), 3000);
                        }}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl cursor-pointer"
                        title="Copy Customer Promo Link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(coupon)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 5. ORDERS & FULFILLMENT HUB ==================== */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              {/* Action Success Toast Banner */}
              {actionSuccessToast && (
                <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{actionSuccessToast}</span>
                  </div>
                  <button onClick={() => setActionSuccessToast('')} className="text-white/80 hover:text-white">✕</button>
                </div>
              )}

              {/* Header Title & Date Range Presets Bar */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                {/* Staff Filter Perspective Notice */}
                {activeSimulatedStaff && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-700 font-extrabold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Staff View Active:
                      </span>
                      <span className="font-bold text-slate-900">{activeSimulatedStaff.name}</span>
                      <span className="text-slate-400">({activeSimulatedStaff.role})</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                        {activeSimulatedStaff.orderScope === 'CONFIRMED_ONLY' && '🎯 Confirmed & Processing Orders Only (Pending orders hidden)'}
                        {activeSimulatedStaff.orderScope === 'PENDING_ONLY' && '⏳ New & Pending Orders Only (Verification desk)'}
                        {activeSimulatedStaff.orderScope === 'DISPATCH_ONLY' && '🚚 Dispatched & Shipped Orders Only (Courier desk)'}
                        {activeSimulatedStaff.orderScope === 'ALL' && '📦 All Orders (Full Access)'}
                        {activeSimulatedStaff.orderScope === 'CUSTOM' && `Custom Statuses: ${activeSimulatedStaff.allowedOrderStatuses.join(', ')}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSimulatedStaffId(null)}
                      className="text-amber-700 hover:text-amber-900 font-bold text-xs underline cursor-pointer"
                    >
                      Reset to Admin View (Show All)
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      Order Processing &amp; Fulfillment Pipeline
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Order Tracking
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Step-by-step order lifecycle: Accept &rarr; Pack &rarr; Dispatch with Courier &rarr; Deliver
                    </p>
                  </div>

                  {/* Calendar Window Button & Date Range Pickers */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <button
                      type="button"
                      onClick={async () => {
                        const refreshed = await fetchOrders();
                        if (!refreshed) {
                          showActionError('Could not refresh orders from the server. The existing list was not replaced.');
                          return;
                        }
                        setActionSuccessToast('Orders refreshed from the server.');
                        setTimeout(() => setActionSuccessToast(''), 3000);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition"
                      title="Reload latest orders from database"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCalendarModal(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      <span>📅 Open Calendar ({startDate} &rarr; {endDate})</span>
                    </button>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                      <span className="text-xs font-bold text-slate-500">From:</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setSelectedRangeStart(e.target.value);
                          setDatePreset('CUSTOM');
                        }}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-500">To:</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setSelectedRangeEnd(e.target.value);
                          setDatePreset('CUSTOM');
                        }}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Orders filtered by Calendar: <strong>{startDate} to {endDate}</strong></span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleExportOrdersCsv}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" /> Export CSV
                    </button>
                    <button
                      onClick={() => setActiveTab('ai-insights')}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Business Insights &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Dynamic Metric Badges Linked to Selected Date Range */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Orders in Selected Range</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{rangeTotalOrders} Orders</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{startDate.slice(5)} to {endDate.slice(5)} window</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Revenue in Selected Range</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {activeSimulatedStaff && activeSimulatedStaff.canViewRevenue === false ? (
                      <span className="text-slate-400 font-mono text-xl bg-slate-100 px-2 py-0.5 rounded">•••• (Hidden)</span>
                    ) : (
                      `₹${rangeRevenue.toLocaleString('en-IN')}`
                    )}
                  </div>
                  <div className={`text-[11px] font-semibold mt-0.5 ${growthTone}`}>
                    {growthRate === null ? 'No prior-period revenue to compare' : `${growthRateLabel} growth vs prior period`}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Awaiting Action (New + Confirmed)</div>
                  <div className="text-2xl font-black text-amber-600 mt-2">{rangePendingCount} Pending</div>
                  <div className="text-[11px] text-amber-600 font-medium mt-0.5">Accept / Pack now</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Delivered Orders</div>
                  <div className="text-2xl font-black text-emerald-600 mt-2">{rangeDeliveredCount} Delivered</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">{rangeShippedCount} currently shipped</div>
                </div>
              </div>

              {/* Duplicate Orders Alert Banner */}
              {duplicateOrdersCount > 0 && (
                <div className="bg-gradient-to-r from-amber-50 via-amber-50/70 to-orange-50/40 border-2 border-amber-300 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-900 border border-amber-300 flex items-center justify-center text-xl shrink-0">
                      ⚠️
                    </div>
                    <div>
                      <div className="font-extrabold text-amber-950 text-xs flex items-center gap-2">
                        <span>Duplicate / Double Order Alert ({duplicateOrdersCount} Orders Placed by Same Customer)</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                          Confirm with Customer
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Multiple orders share the same customer identity and are still open. Review them in the duplicate list before dispatching to prevent accidental double shipment.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrderPipelineTab(orderPipelineTab === 'DUPLICATES' ? 'ALL' : 'DUPLICATES')}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <span>{orderPipelineTab === 'DUPLICATES' ? 'Show All Orders' : 'View Duplicate Orders →'}</span>
                  </button>
                </div>
              )}

              {/* Pipeline Stage Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
                  {[
                    { key: 'ALL', label: `All Status (${rangeTotalOrders})` },
                    { key: 'NEW', label: `1. New / Pending (${ordersList.filter(o => o.status === 'NEW').length})` },
                    { key: 'CONFIRMED', label: `2. Accepted / Confirmed (${ordersList.filter(o => o.status === 'CONFIRMED').length})` },
                    { key: 'PROCESSING', label: `3. Packed / Ready to Ship (${ordersList.filter(o => o.status === 'PROCESSING').length})` },
                    { key: 'SHIPPED', label: `4. Shipped / In Transit (${ordersList.filter(o => o.status === 'SHIPPED').length})` },
                    { key: 'DELIVERED', label: `5. Delivered (${ordersList.filter(o => o.status === 'DELIVERED').length})` },
                    { key: 'CANCELLED', label: `Cancelled (${ordersList.filter(o => o.status === 'CANCELLED').length})` },
                    { key: 'DUPLICATES', label: `⚠️ Duplicate Alerts (${duplicateOrdersCount})`, isAlert: true }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setOrderPipelineTab(tab.key)}
                      className={`px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap font-bold flex items-center gap-1.5 ${
                        orderPipelineTab === tab.key
                          ? tab.isAlert
                            ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                            : 'bg-indigo-600 text-white shadow-sm'
                          : tab.isAlert
                            ? 'bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Bulk Auto-Send Tracking Button */}
                {ordersList.filter(o => o.status === 'SHIPPED').length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkSendTracking}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer shrink-0"
                    title="Send automated tracking links to all customers with shipped orders"
                  >
                    <span>⚡ Auto-Send WhatsApp Tracking to All Shipped ({ordersList.filter(o => o.status === 'SHIPPED').length})</span>
                  </button>
                )}
              </div>

              {/* Order Source / Marketing Channel Filter Tabs */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">Filter by Source:</span>
                  {[
                    { key: 'ALL', label: `All Sources (${dateFilteredOrders.length})`, icon: '🛒' },
                    { key: 'INSTAGRAM', label: `Instagram (${dateFilteredOrders.filter(o => o.source === 'INSTAGRAM').length})`, icon: '📸' },
                    { key: 'FACEBOOK', label: `Facebook (${dateFilteredOrders.filter(o => o.source === 'FACEBOOK').length})`, icon: '🔵' },
                    { key: 'WHATSAPP', label: `WhatsApp (${dateFilteredOrders.filter(o => o.source === 'WHATSAPP').length})`, icon: '💬' },
                    { key: 'WEBSITE', label: `Storefront Web (${dateFilteredOrders.filter(o => o.source === 'WEBSITE').length})`, icon: '🌐' },
                    { key: 'UNATTRIBUTED', label: `Unattributed (${dateFilteredOrders.filter(o => !o.source || o.source === 'UNATTRIBUTED').length})`, icon: '❔' },
                  ].map((srcTab) => (
                    <button
                      key={srcTab.key}
                      onClick={() => setOrderSourceFilter(srcTab.key)}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap text-xs font-bold border flex items-center gap-1.5 ${
                        orderSourceFilter === srcTab.key
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{srcTab.icon}</span>
                      <span>{srcTab.label}</span>
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Showing <strong>{displayOrders.length}</strong> matching orders
                </div>
              </div>

              {/* Orders Table with Step Progression Buttons */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-5">ORDER / CUSTOMER</th>
                        <th className="py-3 px-4">SOURCE / ADS ATTRIBUTION</th>
                        <th className="py-3 px-4">ITEMS</th>
                        <th className="py-3 px-4">TOTAL</th>
                        <th className="py-3 px-4">PAYMENT</th>
                        <th className="py-3 px-4">ORDER STATUS</th>
                        <th className="py-3 px-5 text-right">PROCESS ORDER ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No orders found for source "{orderSourceFilter}" and pipeline stage "{orderPipelineTab}".
                          </td>
                        </tr>
                      ) : (
                        displayOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-5">
                              <div>
                                <div
                                  onClick={() => setSelectedOrderForDetail(ord)}
                                  className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer flex items-center gap-1.5 text-sm"
                                >
                                  <span>{ord.customer}</span>
                                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                                </div>

                                {/* Direct Customer Mobile Phone Displayed Outside */}
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                  <a
                                    href={`tel:${ord.phone || ''}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold hover:bg-emerald-100 transition shadow-2xs"
                                    title="Direct Call Customer"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>{ord.phone || 'No phone'}</span>
                                  </a>
                                  {ord.phone && (
                                    <a
                                      href={`https://wa.me/${ord.phone.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition shadow-2xs"
                                      title="Open WhatsApp Chat"
                                    >
                                      <span>WhatsApp ↗</span>
                                    </a>
                                  )}
                                </div>

                                <div className="text-[10px] text-slate-400 font-mono mt-1">
                                  {ord.id} · {ord.displayDate}
                                </div>

                                {/* Duplicate / Double Order Badge */}
                                {(() => {
                                  const dupes = getDuplicateOrdersForOrder(ord, ordersList);
                                  if (dupes.length === 0) return null;
                                  return (
                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-950 border border-amber-300">
                                        <span>⚠️</span>
                                        <span>Double Order Alert ({dupes.map(d => d.id).join(', ')})</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedOrderForDetail(ord);
                                        }}
                                        className="text-[10px] text-indigo-700 font-bold hover:underline cursor-pointer"
                                      >
                                        Verify ↗
                                      </button>
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {(() => {
                                const meta = getOrderSourceMeta(ord.source);
                                return (
                                  <div className="space-y-1">
                                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.badge}`}>
                                      <span>{meta.icon}</span>
                                      <span>{meta.label}</span>
                                    </span>
                                    {ord.campaign && (
                                      <div className="text-[10px] text-slate-500 font-medium truncate max-w-[170px]" title={ord.campaign}>
                                        {ord.campaign}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>

                            <td className="py-3.5 px-4 text-slate-600 font-medium">
                              {ord.itemSummary}
                            </td>

                            <td className="py-3.5 px-4 font-black text-slate-900">
                              {activeSimulatedStaff && activeSimulatedStaff.canViewRevenue === false ? (
                                <span className="text-slate-400 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded" title="Restricted for this staff role">••••</span>
                              ) : (
                                ord.displayTotal
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ord.payColor}`}>
                                {ord.pay}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${ord.statusColor}`}>
                                {ord.statusLabel}
                              </span>
                              {ord.courier && ord.tracking && (
                                <div className="space-y-0.5 mt-1">
                                  <div className="text-[10px] text-slate-700 font-bold flex items-center gap-1 font-mono">
                                    <span>🚚 {ord.courier}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                                    <span className="text-slate-500">AWB: {ord.tracking}</span>
                                    <a
                                      href={ord.trackingUrl || getCourierTrackingUrl(ord.courier, ord.tracking, ord.orderNumber || ord.id, ord.phone)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-indigo-600 font-bold hover:underline"
                                      title="Courier tracking page"
                                    >
                                      Track ↗
                                    </a>
                                  </div>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Context-Aware Progression Buttons */}
                                {ord.status === 'NEW' && (
                                  <>
                                    {(!activeSimulatedStaff || activeSimulatedStaff.canAcceptOrders !== false) && (
                                      <button
                                        onClick={() => handleAcceptOrder(ord.id)}
                                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1 cursor-pointer"
                                      >
                                        <Check className="w-3.5 h-3.5" /> Accept Order
                                      </button>
                                    )}
                                    {(!activeSimulatedStaff || activeSimulatedStaff.canCancelOrders !== false) && (
                                      <button
                                        onClick={() => setCancelModalOrder(ord)}
                                        className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    {activeSimulatedStaff && activeSimulatedStaff.canAcceptOrders === false && activeSimulatedStaff.canCancelOrders === false && (
                                      <span className="text-[11px] text-slate-400 italic">View Only</span>
                                    )}
                                  </>
                                )}

                                {ord.status === 'CONFIRMED' && (
                                  <>
                                    {(!activeSimulatedStaff || activeSimulatedStaff.canPackOrders !== false) && (
                                      <button
                                        onClick={() => handleMarkReadyToPack(ord.id)}
                                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1 cursor-pointer"
                                      >
                                        <Package className="w-3.5 h-3.5" /> Pack &amp; Box
                                      </button>
                                    )}
                                    {(!activeSimulatedStaff || activeSimulatedStaff.canCancelOrders !== false) && (
                                      <button
                                        onClick={() => setCancelModalOrder(ord)}
                                        className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    {activeSimulatedStaff && activeSimulatedStaff.canPackOrders === false && activeSimulatedStaff.canCancelOrders === false && (
                                      <span className="text-[11px] text-slate-400 italic">View Only</span>
                                    )}
                                  </>
                                )}

                                {ord.status === 'PROCESSING' && (
                                  <>
                                    {(!activeSimulatedStaff || activeSimulatedStaff.canDispatchOrders !== false) && (
                                      <button
                                        onClick={() => {
                                          setDispatchModalOrder(ord);
                                          setTrackingNumber('');
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1 cursor-pointer"
                                      >
                                        <Truck className="w-3.5 h-3.5" /> Dispatch / Ship
                                      </button>
                                    )}
                                    {(!activeSimulatedStaff || activeSimulatedStaff.canCancelOrders !== false) && (
                                      <button
                                        onClick={() => setCancelModalOrder(ord)}
                                        className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    {activeSimulatedStaff && activeSimulatedStaff.canDispatchOrders === false && activeSimulatedStaff.canCancelOrders === false && (
                                      <span className="text-[11px] text-slate-400 italic">View Only</span>
                                    )}
                                  </>
                                )}

                                {ord.status === 'SHIPPED' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleMarkDelivered(ord.id)}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSendTrackingNotification(ord)}
                                      className="px-2.5 py-1.5 rounded-xl border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                                      title="Open a WhatsApp tracking message for the customer"
                                    >
                                      <span>💬 Send Track</span>
                                    </button>
                                  </>
                                )}

                                {ord.status === 'DELIVERED' && (
                                  <button
                                    onClick={() => setSelectedOrderForDetail(ord)}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition flex items-center gap-1"
                                  >
                                    <FileText className="w-3.5 h-3.5" /> Invoice / View
                                  </button>
                                )}

                                {ord.status === 'CANCELLED' && (
                                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">
                                    Restocked
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== AI BUSINESS ANALYZER & GROWTH ENGINE ==================== */}
          {activeTab === 'ai-insights' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4 border border-indigo-900/50">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner">
                      <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black tracking-tight text-white">Omniva Business Copilot</h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Using loaded data
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Answers are generated from the orders, products and CRM records currently loaded for this tenant. No ad spend, margin or demand forecast is invented.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-mono border border-white/10">
                    Window: {startDate} &rarr; {endDate}
                  </span>
                  <button
                    onClick={() => setShowCalendarModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>📅 Calendar</span>
                  </button>
                </div>
              </div>

              {/* Temporary Action Toast */}
              {aiActionNotice && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl shadow-md flex items-center justify-between text-xs font-semibold animate-in fade-in duration-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{aiActionNotice}</span>
                  </div>
                  <button
                    onClick={() => setAiActionNotice('')}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer underline ml-4"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* 4 Major Analytical Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Revenue Velocity & Comparison */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Revenue Velocity</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    ₹{rangeRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className={`text-xs font-semibold flex items-center gap-1 ${growthTone}`}>
                    {growthRate !== null && (growthRate >= 0
                      ? <ArrowUpRight className="w-3.5 h-3.5" />
                      : <ArrowDownRight className="w-3.5 h-3.5" />)}
                    {growthRate === null ? 'No prior-period revenue to compare' : `${growthRateLabel} vs prior cycle`}
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-100">
                    Prior cycle: ₹{priorPeriodRevenue.toLocaleString('en-IN')}. Daily average: ₹{rangeNonCancelledOrders.length ? Math.round(rangeRevenue / Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / 86400000) + 1)).toLocaleString('en-IN') : '0'}/day.
                  </p>
                </div>

                {/* Metric 2: Average Order Value */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Average Order Value</span>
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-indigo-600">
                    ₹{rangeAverageOrderValue.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {rangeTotalOrders} orders in window
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-100">
                    Calculated from non-cancelled order revenue in the selected date range.
                  </p>
                </div>

                {/* Metric 3: Payment Split */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>COD vs Prepaid Split</span>
                    <CreditCard className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {rangeCodPct}% <span className="text-xs font-normal text-slate-400">COD</span> / {rangePrepaidPct}% <span className="text-xs font-normal text-slate-400">Prepaid</span>
                  </div>
                  <div className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {rangePaidOrdersCount} payment-classified orders
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-100">
                    Based on the payment method recorded on each order in this window.
                  </p>
                </div>

                {/* Metric 4: Stock Alerts */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Low Stock Alerts</span>
                    <Boxes className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-amber-600">
                    {lowStockProducts.length} <span className="text-xs font-bold text-slate-400">products</span>
                  </div>
                  <div className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {outOfStockProducts.length} out of stock
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-100">
                    Current tracked stock below 10 units. No demand forecast is claimed.
                  </p>
                </div>
              </div>

              {/* Sub-Tabs Switcher */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
                <button
                  onClick={() => setAiActiveSubTab('copilot')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-sm ${
                    aiActiveSubTab === 'copilot'
                      ? 'bg-indigo-600 text-white shadow-indigo-200'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  <span>🤖 Business Copilot (Loaded Data)</span>
                </button>

                <button
                  onClick={() => setAiActiveSubTab('forecast')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-sm ${
                    aiActiveSubTab === 'forecast'
                      ? 'bg-indigo-600 text-white shadow-indigo-200'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>📊 Stock Watchlist (No Forecast)</span>
                </button>

                <button
                  onClick={() => {
                    setAiActiveSubTab('copywriter');
                    if (!editableCopyText) {
                      setEditableCopyText(AI_COPY_TEMPLATES[selectedCopyCategory]?.text || '');
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-sm ${
                    aiActiveSubTab === 'copywriter'
                      ? 'bg-indigo-600 text-white shadow-indigo-200'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>✍️ WhatsApp &amp; Ad Copywriter (Templates)</span>
                </button>

                <button
                  onClick={() => setAiActiveSubTab('rto-radar')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-sm ${
                    aiActiveSubTab === 'rto-radar'
                      ? 'bg-indigo-600 text-white shadow-indigo-200'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>🛡️ COD Address Review &amp; RTO Radar</span>
                </button>
              </div>

              {/* ================= SUB-TAB 1: AI BUSINESS COPILOT ================= */}
              {aiActiveSubTab === 'copilot' && (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                        <Bot className="w-5 h-5 text-indigo-600" />
                        Omniva Store Copilot (Loaded-Data Advisor)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Ask about the orders, inventory and CRM records currently loaded for this tenant
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        ⚡ Instant Answers
                      </span>
                    </div>
                  </div>

                  {/* Suggested Query Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      💡 Click to Ask Quick Questions:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Which products are below 10 units?',
                        'Do we have Meta ad spend or ROAS data?',
                        'How many COD orders need an address check?',
                        'How much stock should we prepare for festive demand?'
                      ].map((promptText, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendAiMessage(promptText)}
                          className="px-3 py-1.5 rounded-full bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-slate-700 hover:text-indigo-700 text-xs font-medium cursor-pointer transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          <span>{promptText}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Message Thread */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 max-h-[460px] min-h-[320px] overflow-y-auto space-y-4">
                    {aiChatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.sender === 'ai' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}

                        <div
                          className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-1 shadow-xs ${
                            msg.sender === 'user'
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] font-bold opacity-70 mb-1 border-b border-black/5 pb-1">
                            <span>{msg.sender === 'user' ? 'You (Merchant)' : 'Omniva Copilot 2.0'}</span>
                            <span>{msg.time}</span>
                          </div>
                          <div className="whitespace-pre-line font-normal">
                            {msg.text}
                          </div>
                        </div>

                        {msg.sender === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            ME
                          </div>
                        )}
                      </div>
                    ))}

                    {isAiThinking && (
                      <div className="flex gap-3 justify-start items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 animate-spin">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-indigo-700 font-semibold shadow-xs flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                          Reading the currently loaded orders, products and CRM data...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendAiMessage();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={aiUserPrompt}
                      onChange={(e) => setAiUserPrompt(e.target.value)}
                      placeholder="Ask about loaded orders, products or CRM data (e.g. which COD orders need an address check?)..."
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <button
                      type="submit"
                      disabled={isAiThinking || !aiUserPrompt.trim()}
                      className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              )}

              {/* ================= SUB-TAB 2: CURRENT STOCK RADAR ================= */}
              {aiActiveSubTab === 'forecast' && (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        Current Stock Radar
                      </h3>
                      <p className="text-xs text-slate-500">
                        Tracked inventory currently loaded from your product catalog. Demand forecasting is not
                        available because historical line-item demand is not stored.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('products')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Open Product Catalog</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tracked Products</div>
                      <div className="text-lg font-black text-slate-950">{trackedProducts.length}</div>
                      <p className="text-xs text-slate-500">Products with inventory tracking enabled.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                      <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Low Stock</div>
                      <div className="text-lg font-black text-amber-950">{lowStockProducts.length} products</div>
                      <p className="text-xs text-amber-700">Tracked stock below 10 units.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1">
                      <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Out of Stock</div>
                      <div className="text-lg font-black text-rose-950">{outOfStockProducts.length} products</div>
                      <p className="text-xs text-rose-700">Tracked stock is zero or below.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5">Product</th>
                          <th className="p-3.5">SKU</th>
                          <th className="p-3.5">Tracked Stock</th>
                          <th className="p-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {stockTableProducts.map((product) => {
                          const stock = Number(product.stock ?? 0);
                          return (
                            <tr key={product._id || product.id || product.sku || product.name} className="hover:bg-slate-50/80">
                              <td className="p-3.5">
                                <div className="font-bold text-slate-900">{product.name}</div>
                                <div className="text-[10px] text-slate-400">{product.cat || 'Uncategorized'}</div>
                              </td>
                              <td className="p-3.5 font-mono text-[11px]">{product.sku || '—'}</td>
                              <td className={`p-3.5 font-bold ${stock <= 0 ? 'text-rose-600' : stock < 10 ? 'text-amber-600' : 'text-slate-900'}`}>
                                {stock}
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  stock <= 0
                                    ? 'bg-rose-100 text-rose-800'
                                    : stock < 10
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {stock <= 0 ? 'Out of stock' : stock < 10 ? 'Low stock' : 'Healthy stock'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {stockTableProducts.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-500">
                              No tracked products loaded. Enable inventory tracking on a product to see stock here.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setActiveTab('products')}
                      className="text-xs text-indigo-700 font-bold hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>Open Products Catalog to Update Quantities &rarr;</span>
                    </button>
                    <span className="text-[11px] text-slate-400">
                      Sorted by current tracked stock. No demand forecast is calculated.
                    </span>
                  </div>
                </div>
              )}

              {/* ================= SUB-TAB 3: WHATSAPP & AD COPYWRITER TEMPLATES ================= */}
              {aiActiveSubTab === 'copywriter' && (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        WhatsApp &amp; Meta Ad Copywriter
                      </h3>
                      <p className="text-xs text-slate-500">
                        Ready-to-use promotional copy for festive offers, COD order verification, and Instagram Reels
                      </p>
                    </div>

                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      🎯 Store-specific templates
                    </span>
                  </div>

                  {/* Template Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { key: 'festival', icon: '🎁', label: 'Festive Flash Sale', sub: 'Festive Offer Broadcast' },
                      { key: 'cod-confirm', icon: '💬', label: 'COD Verification', sub: 'RTO Prevention Message' },
                      { key: 'review', icon: '⭐️', label: 'Review Request', sub: 'Post-Delivery Feedback' },
                      { key: 'meta-reel', icon: '📸', label: 'Reel Caption', sub: 'Storefront link & caption' }
                    ].map((tmpl) => (
                      <button
                        key={tmpl.key}
                        onClick={() => {
                          setSelectedCopyCategory(tmpl.key);
                          setEditableCopyText(AI_COPY_TEMPLATES[tmpl.key].text);
                        }}
                        className={`p-3.5 rounded-2xl border text-left cursor-pointer transition ${
                          selectedCopyCategory === tmpl.key
                            ? 'bg-indigo-50/70 border-indigo-500 text-indigo-950 ring-2 ring-indigo-200 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="text-lg mb-1">{tmpl.icon}</div>
                        <div className="font-extrabold text-xs">{tmpl.label}</div>
                        <div className="text-[11px] text-slate-500">{tmpl.sub}</div>
                      </button>
                    ))}
                  </div>

                  {/* Active Template Editor & Live Preview */}
                  <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {AI_COPY_TEMPLATES[selectedCopyCategory]?.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Target Audience: <span className="font-semibold text-slate-700">{AI_COPY_TEMPLATES[selectedCopyCategory]?.audience}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const variationAddon = "\n\n[Add a verified offer here after checking your active coupons and delivery settings.]";
                            setEditableCopyText(prev => (prev || AI_COPY_TEMPLATES[selectedCopyCategory].text) + variationAddon);
                            setAiActionNotice('Added an offer placeholder. Fill in verified details before sending.');
                            setTimeout(() => setAiActionNotice(''), 3000);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Add Offer Placeholder</span>
                        </button>
                      </div>
                    </div>

                    {/* Textarea */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Editable Message Preview (Customizable template with dynamic tags):
                      </label>
                      <textarea
                        rows={9}
                        value={editableCopyText || AI_COPY_TEMPLATES[selectedCopyCategory]?.text}
                        onChange={(e) => setEditableCopyText(e.target.value)}
                        className="w-full p-4 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Dynamic Tags Supported: {"{CustomerName}"}, {"{OrderId}"}, {"{OrderTotal}"}, {"{Address}"}</span>
                        <span>Length: {(editableCopyText || AI_COPY_TEMPLATES[selectedCopyCategory]?.text).length} chars</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          const textToCopy = editableCopyText || AI_COPY_TEMPLATES[selectedCopyCategory]?.text;
                          navigator.clipboard.writeText(textToCopy);
                          setAiActionNotice('✅ Copied to clipboard! Ready to paste into WhatsApp Web or Business App.');
                          setTimeout(() => setAiActionNotice(''), 3500);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 transition"
                      >
                        <Copy className="w-4 h-4" />
                        <span>📋 Copy to Clipboard</span>
                      </button>

                      <button
                        onClick={() => {
                          const textToShare = editableCopyText || AI_COPY_TEMPLATES[selectedCopyCategory]?.text;
                          window.open(`https://wa.me/?text=${encodeURIComponent(textToShare)}`, '_blank');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>📲 Test Broadcast on WhatsApp</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditableCopyText(AI_COPY_TEMPLATES[selectedCopyCategory]?.text);
                          setAiActionNotice('🔄 Reset to default template');
                          setTimeout(() => setAiActionNotice(''), 2500);
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition"
                      >
                        Reset Template
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SUB-TAB 4: COD ADDRESS / RISK REVIEW ================= */}
              {aiActiveSubTab === 'rto-radar' && (() => {
                const activeOrders = ordersList.filter(o => o.status !== 'CANCELLED');
                const codOrders = activeOrders.filter(o => /cod|cash/i.test(String(o.pay || o.paymentMethod || '')));
                const parseAmount = (value) => Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;
                const flaggedCodOrders = codOrders.filter(o => {
                  const amount = parseAmount(o.total);
                  const address = String(o.address || '').trim();
                  return amount >= 1000 || address.length < 12;
                });
                const codValue = codOrders.reduce((sum, o) => sum + parseAmount(o.total), 0);

                return (
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-indigo-600" />
                          COD Address &amp; Risk Review
                        </h3>
                        <p className="text-xs text-slate-500">
                          This view uses live order data only. It flags high-value COD orders with short or missing addresses for manual confirmation; it does not predict fraud.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAiRiskScanCompleted(true);
                          setAiActionNotice(
                            `Risk view refreshed from ${activeOrders.length} live order(s). ${flaggedCodOrders.length} COD order(s) need an address check.`
                          );
                          setTimeout(() => setAiActionNotice(''), 4000);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh Risk View</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1">
                        <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Active COD Orders</div>
                        <div className="text-xl font-black text-indigo-950">{codOrders.length}</div>
                        <p className="text-xs text-indigo-700">Value: ₹{codValue.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                        <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Needs Address Check</div>
                        <div className="text-xl font-black text-amber-950">{flaggedCodOrders.length}</div>
                        <p className="text-xs text-amber-700">High value or address shorter than 12 characters.</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                        <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Other Active COD Orders</div>
                        <div className="text-xl font-black text-emerald-950">{Math.max(0, codOrders.length - flaggedCodOrders.length)}</div>
                        <p className="text-xs text-emerald-700">No automatic fraud or RTO probability is claimed.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>Live COD orders to review:</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          {aiRiskScanCompleted ? 'Live data refreshed' : 'Showing current order list'}
                        </span>
                      </div>

                      {flaggedCodOrders.length === 0 ? (
                        <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                          No active COD order currently needs an address check.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {flaggedCodOrders.slice(0, 10).map((o) => {
                            const phone = String(o.phone || '').replace(/[^0-9]/g, '').slice(-10);
                            const verifyMsg = `Hello ${o.customer || 'customer'}! Please confirm your delivery address for order ${o.id || o.orderNumber} at ${businessName || 'our store'}. Reply YES if it is correct.`;
                            return (
                              <div key={o._id || o.id || o.orderNumber} className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-wrap items-center justify-between gap-4">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                                      Address check
                                    </span>
                                    <span className="font-extrabold text-slate-900 text-xs">#{o.id || o.orderNumber} • {o.customer || 'Customer'}</span>
                                    <span className="text-xs text-slate-500 font-mono">₹{o.total} (COD)</span>
                                  </div>
                                  <p className="text-xs text-slate-600 truncate">
                                    {o.address ? o.address : 'No delivery address is stored on this order.'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {phone && (
                                    <a
                                      href={`https://wa.me/91${phone}?text=${encodeURIComponent(verifyMsg)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      <span>Verify on WhatsApp</span>
                                    </a>
                                  )}
                                  <button
                                    onClick={() => setSelectedOrderForDetail(o)}
                                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition"
                                  >
                                    Open order
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ==================== ORDER DETAIL MODAL ==================== */}
          {selectedOrderForDetail && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      Order Details: {selectedOrderForDetail.id}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${selectedOrderForDetail.statusColor}`}>
                        {selectedOrderForDetail.statusLabel}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedOrderForDetail.displayDate}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrderForDetail(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Duplicate / Double Order Detected Alert & Customer Confirmation Banner */}
                {(() => {
                  const dupes = getDuplicateOrdersForOrder(selectedOrderForDetail, ordersList);
                  if (dupes.length === 0) return null;
                  const firstTwin = dupes[0];
                  const waConfirmMessage = `Hello ${selectedOrderForDetail.customer}! 🙏\n\nOrder verification message from ${businessName || 'our store'}. We noticed 2 matching orders placed from your phone number:\n• Order 1: ${selectedOrderForDetail.id} (${selectedOrderForDetail.itemSummary})\n• Order 2: ${firstTwin.id} (${firstTwin.itemSummary})\n\nCould you please confirm if you would like both orders shipped, or if one was placed by mistake? Thank you!`;

                  return (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 border-2 border-amber-400 rounded-3xl p-4 space-y-3.5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="text-2xl">⚠️</span>
                          <div>
                            <h4 className="font-black text-amber-950 text-sm flex items-center gap-2">
                              <span>Duplicate / Double Order Detected!</span>
                              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase">
                                Action Required
                              </span>
                            </h4>
                            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                              This customer ({selectedOrderForDetail.customer}) placed <strong>{dupes.length} matching order ({dupes.map(d => d.id).join(', ')})</strong>. Please verify with the customer via WhatsApp or call before dispatching to prevent duplicate shipments and RTO charges.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Side-by-Side Comparison of Current Order and Matching Order */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-3 rounded-2xl bg-white border border-indigo-200 shadow-2xs space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
                            <span>This Order: {selectedOrderForDetail.id}</span>
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-extrabold text-[10px]">
                              {selectedOrderForDetail.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{selectedOrderForDetail.displayDate}</div>
                          <div className="font-semibold text-slate-800 text-[11px] line-clamp-1">{selectedOrderForDetail.itemSummary}</div>
                          <div className="font-black text-slate-900 text-xs mt-1">{selectedOrderForDetail.displayTotal} · {selectedOrderForDetail.pay}</div>
                        </div>

                        {dupes.map((twin) => (
                          <div key={twin.id} className="p-3 rounded-2xl bg-white border border-amber-300 shadow-2xs space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                              <span>Matching Twin: {twin.id}</span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-extrabold text-[10px]">
                                {twin.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">{twin.displayDate}</div>
                            <div className="font-semibold text-slate-800 text-[11px] line-clamp-1">{twin.itemSummary}</div>
                            <div className="font-black text-slate-900 text-xs mt-1">{twin.displayTotal} · {twin.pay}</div>
                          </div>
                        ))}
                      </div>

                      {/* One-Click Customer Confirmation & Resolution Actions */}
                      <div className="space-y-2 pt-1 border-t border-amber-200/80">
                        <div className="text-[11px] font-extrabold text-amber-900 flex items-center gap-1">
                          <span>Confirm with Customer:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 1. One-Click WhatsApp Confirmation Link */}
                          <a
                            href={`https://wa.me/${(selectedOrderForDetail.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waConfirmMessage)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                          >
                            <span>💬 Verify via WhatsApp (Ship both or single?) ↗</span>
                          </a>

                          {/* 2. Direct Phone Call */}
                          <a
                            href={`tel:${selectedOrderForDetail.phone || ''}`}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition"
                          >
                            <Phone className="w-3.5 h-3.5" /> Direct Call
                          </a>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {/* 3. Mark Both Confirmed */}
                          <button
                            type="button"
                            onClick={() => handleConfirmBothOrders(selectedOrderForDetail.id, firstTwin?.id)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition cursor-pointer"
                          >
                            ✅ Customer Confirmed Both (Ship Both)
                          </button>

                          {/* 4. Cancel Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleCancelDuplicateOrder(selectedOrderForDetail.id, firstTwin?.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer"
                          >
                            ❌ Cancel This Duplicate (Keep Single)
                          </button>

                          {/* 5. Mark Verified / Not a Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleMarkAsNotDuplicate(selectedOrderForDetail.id, firstTwin?.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs transition cursor-pointer"
                          >
                            🛡️ Mark Verified (Not a Duplicate)
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Customer & Address Details */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 text-sm">{selectedOrderForDetail.customer}</div>
                  <div className="text-slate-600">{selectedOrderForDetail.phone} · {selectedOrderForDetail.email}</div>
                  <div className="text-slate-500 pt-1 border-t border-slate-200/60">
                    <strong>Delivery Address:</strong> {selectedOrderForDetail.address}
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href={`tel:${selectedOrderForDetail.phone || ''}`}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-slate-200"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-600" /> Call Direct
                    </a>
                    <a
                      href={`https://wa.me/${selectedOrderForDetail.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${selectedOrderForDetail.customer}! Regarding your ${businessName || 'store'} order ${selectedOrderForDetail.id}...`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <span>WhatsApp ↗</span>
                    </a>
                  </div>
                </div>

                {/* Courier dispatch and tracking section (if shipped or has tracking) */}
                {(selectedOrderForDetail.status === 'SHIPPED' || selectedOrderForDetail.tracking) && (
                  <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-emerald-50/40 rounded-2xl p-4 border border-blue-200/80 space-y-3 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
                          <Truck className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
                            <span>Courier Dispatch & Tracking</span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                              {selectedOrderForDetail.courier || 'Courier not recorded'}
                            </span>
                          </h4>
                          <p className="text-[11px] text-blue-700/90 font-mono mt-0.5">
                            AWB Tracking #{selectedOrderForDetail.tracking || 'Not assigned'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center gap-1">
                        <span>✓</span> {selectedOrderForDetail.tracking ? 'Tracking number recorded' : 'No tracking number'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Courier tracking link */}
                      <a
                        href={selectedOrderForDetail.trackingUrl || getCourierTrackingUrl(selectedOrderForDetail.courier, selectedOrderForDetail.tracking, selectedOrderForDetail.id, selectedOrderForDetail.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                      >
                        <span>Open Tracking Page ↗</span>
                      </a>

                      {/* Resend WhatsApp Tracking Alert */}
                      <button
                        type="button"
                        onClick={() => handleSendTrackingNotification(selectedOrderForDetail)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <span>💬 Resend WhatsApp Tracking</span>
                      </button>

                      {/* Copy Tracking URL */}
                      <button
                        type="button"
                        onClick={() => {
                          const url = selectedOrderForDetail.trackingUrl || getCourierTrackingUrl(selectedOrderForDetail.courier, selectedOrderForDetail.tracking, selectedOrderForDetail.id, selectedOrderForDetail.phone);
                          navigator.clipboard?.writeText(url);
                          setActionSuccessToast(`📋 Tracking link copied to clipboard!`);
                          setTimeout(() => setActionSuccessToast(''), 3000);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition cursor-pointer"
                      >
                        <span>Copy Link</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Marketing & Ads Attribution Card */}
                <div className="bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/40 rounded-2xl p-4 border border-indigo-100/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                      <span>🎯 Marketing Source Attribution:</span>
                    </span>
                    {(() => {
                      const meta = getOrderSourceMeta(selectedOrderForDetail.source);
                      return (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.badge}`}>
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-indigo-100/60">
                    <div>
                      <span className="text-slate-500 font-medium">Channel / Placement: </span>
                      <strong className="text-slate-800 font-bold block">{selectedOrderForDetail.channelName || 'Not recorded'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Campaign: </span>
                      <strong className="text-slate-800 font-bold block truncate" title={selectedOrderForDetail.campaign}>
                        {selectedOrderForDetail.campaign || 'Direct / None'}
                      </strong>
                    </div>
                    {selectedOrderForDetail.adCreative && (
                      <div className="col-span-2 pt-1">
                        <span className="text-slate-500 font-medium">Ad Creative / Hook: </span>
                        <div className="text-indigo-900 font-semibold bg-white/90 px-2.5 py-1 rounded-lg border border-indigo-200/60 mt-0.5">
                          🎬 {selectedOrderForDetail.adCreative}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-800">Ordered Items ({selectedOrderForDetail.items?.length || 1}):</div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedOrderForDetail.items?.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border" />
                          <div>
                            <div className="font-bold text-slate-900">{item.name}</div>
                            <div className="text-[10px] text-slate-400">{item.variant} · Qty: {item.qty}</div>
                          </div>
                        </div>
                        <div className="font-black text-slate-900">₹{item.price * item.qty}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Payment Mode: </span>
                    <strong className="text-slate-800">{selectedOrderForDetail.payMethod} ({selectedOrderForDetail.pay})</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[11px]">Total Amount: </span>
                    <span className="font-black text-slate-900 text-base">{selectedOrderForDetail.displayTotal}</span>
                  </div>
                </div>

                {/* Order Progress Timeline */}
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-800">Order Progress Timeline:</div>
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    {selectedOrderForDetail.timeline?.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                          step.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {step.done ? '✓' : idx + 1}
                        </div>
                        <div>
                          <div className={`font-semibold ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.title}
                          </div>
                          <div className="text-[10px] text-slate-400">{step.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => {
                      setActionErrorToast('Invoice PDF generation is not configured. No document was printed.');
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Invoice
                  </button>

                  <div className="flex items-center gap-2">
                    {selectedOrderForDetail.status === 'NEW' && (
                      <button
                        onClick={() => {
                          handleAcceptOrder(selectedOrderForDetail.id);
                          setSelectedOrderForDetail(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                      >
                        Accept Order Now
                      </button>
                    )}
                    {selectedOrderForDetail.status === 'CONFIRMED' && (
                      <button
                        onClick={() => {
                          handleMarkReadyToPack(selectedOrderForDetail.id);
                          setSelectedOrderForDetail(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md"
                      >
                        Mark Ready to Pack
                      </button>
                    )}
                    {selectedOrderForDetail.status === 'PROCESSING' && (
                      <button
                        onClick={() => {
                          const ord = selectedOrderForDetail;
                          setSelectedOrderForDetail(null);
                          setDispatchModalOrder(ord);
                          setTrackingNumber('');
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" /> Dispatch & Send Tracking
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrderForDetail(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== COURIER DISPATCH MODAL ==================== */}
          {dispatchModalOrder && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <Truck className="w-5 h-5 text-indigo-600" />
                    <span>Dispatch Order {dispatchModalOrder.id}</span>
                  </div>
                  <button onClick={() => setDispatchModalOrder(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1 text-slate-700">
                  <div>Customer: <strong className="text-slate-900">{dispatchModalOrder.customer}</strong> ({dispatchModalOrder.phone})</div>
                  <div className="text-[11px] text-slate-500 truncate">Address: {dispatchModalOrder.address}</div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Select Courier Partner:</label>
                    <select
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">Select courier</option>
                      <option value="Delhivery Express">Delhivery Express</option>
                      <option value="BlueDart Air Express">BlueDart Air Express</option>
                      <option value="XpressBees Surface">XpressBees Surface</option>
                      <option value="India Post Speed Post">India Post Speed Post</option>
                      <option value="DTDC Premium">DTDC Premium</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800 block">Waybill / Tracking Number (AWB):</label>
                      <span className="text-[10px] text-slate-400 font-medium">Use the AWB issued by your courier</span>
                    </div>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. DEL-8492014"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Tracking URL preview */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">🔗 Customer tracking link:</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Courier link</span>
                    </div>
                    <div className="font-mono text-[10px] text-indigo-600 truncate">
                      {trackingNumber.trim()
                        ? getCourierTrackingUrl(courierName, trackingNumber.trim(), dispatchModalOrder.orderNumber || dispatchModalOrder.id, dispatchModalOrder.phone)
                        : 'Enter the courier AWB to preview the tracking link'}
                    </div>
                  </div>

                  {/* Auto-Notification Toggle */}
                  <label className="flex items-start gap-2.5 p-3 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoNotifyWhatsApp}
                      onChange={(e) => setAutoNotifyWhatsApp(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded mt-0.5 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-indigo-950 block">Open WhatsApp with the tracking message</span>
                      <span className="text-[11px] text-indigo-800">
                        After the server saves the shipment, a WhatsApp chat with the customer's number ({dispatchModalOrder.phone}) will open with the tracking message. Opening the chat is not proof of delivery.
                      </span>
                    </div>
                  </label>

                  {/* Message Preview */}
                  <div className="p-3 rounded-2xl bg-slate-900 text-slate-200 text-[11px] space-y-1 font-sans">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <span>💬 Message Preview (Customer WhatsApp Notification):</span>
                    </div>
                    <div className="text-slate-300 text-[11px] whitespace-pre-line leading-relaxed font-mono">
                      {trackingNumber.trim()
                        ? generateTrackingMessage(dispatchModalOrder, courierName, trackingNumber.trim())
                        : 'Tracking message will be generated after you enter a real AWB.'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDispatchModalOrder(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDispatch}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5 transition"
                  >
                    <span>🚀 Confirm Dispatch &amp; Auto-Send Tracking</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== CANCELLATION MODAL ==================== */}
          {cancelModalOrder && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span>Cancel Order {cancelModalOrder.id}</span>
                  </div>
                  <button onClick={() => setCancelModalOrder(null)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>

                <div className="text-slate-600">
                  Are you sure you want to cancel the order for <strong>{cancelModalOrder.customer}</strong>?
                  Items will be automatically returned to product inventory.
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Cancellation Reason:</label>
                  <textarea
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setCancelModalOrder(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/30 cursor-pointer"
                  >
                    Confirm Cancellation &amp; Restock
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== CATEGORY PHOTO EDIT MODAL ==================== */}
          {editingCategory && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="font-extrabold text-slate-900 text-base">
                    Change Category Photo: {editingCategory.name}
                  </div>
                  <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>

                {/* Live Preview */}
                <div className="relative h-40 bg-slate-900 rounded-2xl overflow-hidden border border-slate-200">
                  <img
                    src={categoryPhotoUrl || editingCategory.image}
                    alt="Category Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white font-bold text-sm">
                    {editingCategory.name} (Customer Storefront Preview)
                  </div>
                </div>

                {/* Device Gallery Upload + Preset Picker */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 block">Choose a photo from your device:</label>
                  
                  {/* Device Upload */}
                  <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-600 font-bold text-xs cursor-pointer transition">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>📁 Upload from Phone / PC Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => setCategoryPhotoUrl(reader.result);
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>

                </div>

                {/* Custom URL Input */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Or Enter Custom Image URL:</label>
                  <input
                    type="text"
                    value={categoryPhotoUrl}
                    onChange={(e) => setCategoryPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCategoryPhoto}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm shadow-indigo-500/10 cursor-pointer"
                  >
                    Save Category Photo
                  </button>
                </div>
              </div>
            </div>
          )}



          {/* ==================== 7. SERVICE BOOKINGS (CALENDAR & LIST) ==================== */}
          {activeTab === 'service-bookings' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Manage studio availability, customer appointments, shoots &amp; confirmed dates</p>
                  <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">Click any date cell or appointment pill to view or schedule bookings</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAvailabilityModal(true)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-medium text-xs text-slate-700 cursor-pointer transition shadow-2xs flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Availability settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setNewServiceForm(prev => ({ ...prev, date: todayStr, dayNumber: new Date().getDate() }));
                      setShowAddServiceBookingModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Booking</span>
                  </button>
                </div>
              </div>

              {/* 4 Dynamic Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Total Bookings</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{serviceBookingsList.length}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">In active schedule</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Confirmed bookings</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {serviceBookingsList.filter(b => b.status === 'Confirmed').length}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                    {serviceBookingsList.length > 0 ? Math.round((serviceBookingsList.filter(b => b.status === 'Confirmed').length / serviceBookingsList.length) * 100) : 0}% confirmed
                  </div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Pending quotations</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {serviceBookingsList.filter(b => b.status.includes('Pending') || b.status.includes('Enquiry')).length}
                  </div>
                  <div className="text-[11px] text-amber-600 font-medium mt-0.5">Awaiting customer response</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Pipeline Value</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    ₹{serviceBookingsList.reduce((acc, b) => acc + (b.price || 0), 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-indigo-600 font-medium mt-0.5">Total booked revenue</div>
                </div>
              </div>

              {/* Service Calendar / List Container */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-indigo-600" />
                      <span>{calendarMonth}</span>
                    </h3>
                    <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                      <button
                        onClick={() => shiftCalendarMonth(-1)}
                        className="px-2.5 py-1 text-xs rounded-md transition cursor-pointer text-slate-600 hover:bg-slate-200/60"
                        title="Previous Month"
                      >
                        &lt;
                      </button>
                      <button
                        onClick={() => {
                          const now = new Date();
                          setCalendarMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
                          setActionSuccessToast(`Viewing current month: ${currentMonthLabel}`);
                          setTimeout(() => setActionSuccessToast(''), 3000);
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                          calendarMonth === currentMonthLabel ? 'bg-indigo-600 text-white font-bold' : 'text-slate-800 hover:bg-slate-200/60'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => shiftCalendarMonth(1)}
                        className="px-2.5 py-1 text-xs rounded-md transition cursor-pointer text-slate-600 hover:bg-slate-200/60"
                        title="Next Month"
                      >
                        &gt;
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-0.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center">
                      <button
                        onClick={() => setServiceViewMode('calendar')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          serviceViewMode === 'calendar'
                            ? 'bg-white text-indigo-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Calendar view
                      </button>
                      <button
                        onClick={() => setServiceViewMode('list')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          serviceViewMode === 'list'
                            ? 'bg-white text-indigo-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        List view ({serviceBookingsList.length})
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setNewServiceForm(prev => ({ ...prev, date: todayStr, dayNumber: new Date().getDate() }));
                        setShowAddServiceBookingModal(true);
                      }}
                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm cursor-pointer transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Booking</span>
                    </button>
                  </div>
                </div>

                {/* 1. CALENDAR VIEW */}
                {serviceViewMode === 'calendar' && (
                  <div>
                    {/* Days of Week Header */}
                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 py-1 border-b border-slate-100">
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                      <div>Thu</div>
                      <div>Fri</div>
                      <div>Sat</div>
                      <div>Sun</div>
                    </div>

                    {/* Current month grid, Monday first. Bookings are matched by full date. */}
                    <div className="grid grid-cols-7 gap-2 text-xs pt-2">
                      {(() => {
                        const year = calendarMonthDate.getFullYear();
                        const month = calendarMonthDate.getMonth();
                        const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        return Array.from({ length: 42 }, (_, index) => {
                          const dayNumber = index - firstWeekday + 1;
                          const cellDate = new Date(year, month, dayNumber);
                          const inMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
                          const dateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
                          const isToday = inMonth && dateStr === todayStr;
                          const dayBookings = inMonth
                            ? serviceBookingsList.filter((b) => b.date === dateStr)
                            : [];
                          const dateLabel = cellDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

                          if (!inMonth) {
                            return (
                              <div
                                key={dateStr}
                                className="min-h-[82px] p-2 rounded-xl border bg-slate-50/40 border-slate-100 text-slate-300 select-none"
                              >
                                <div className="font-medium text-right text-[11px]">{cellDate.getDate()}</div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={dateStr}
                              onClick={() => {
                                setNewServiceForm(prev => ({ ...prev, date: dateStr, dayNumber }));
                                setShowAddServiceBookingModal(true);
                              }}
                              className={`min-h-[82px] p-2 rounded-xl border transition flex flex-col justify-between cursor-pointer group hover:shadow-sm ${
                                isToday
                                  ? 'bg-indigo-50/30 border-indigo-300 ring-1 ring-indigo-200'
                                  : 'bg-white border-slate-200/80 hover:border-indigo-400 hover:bg-slate-50/50'
                              }`}
                              title={`Click to add booking on ${dateLabel}`}
                            >
                              <div className="flex items-center justify-between">
                                {isToday ? (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-indigo-600 text-white">
                                    Today
                                  </span>
                                ) : (
                                  <span className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-500 font-bold transition">
                                    +
                                  </span>
                                )}
                                <span className={`font-bold text-right text-xs ${isToday ? 'text-indigo-700' : 'text-slate-700'}`}>
                                  {dayNumber}
                                </span>
                              </div>

                              <div className="space-y-1 mt-1">
                                {dayBookings.map((b) => (
                                  <div
                                    key={b.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedServiceBooking(b);
                                    }}
                                    className={`text-[10px] font-bold p-1 rounded-md border truncate shadow-2xs hover:scale-[1.02] transition cursor-pointer ${b.color}`}
                                    title={`${b.client}: ${b.service} (${b.time}) - Click for details`}
                                  >
                                    {b.service}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* 2. LIST VIEW (Full Interactive Appointments Table) */}
                {serviceViewMode === 'list' && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-xs">
                      <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-5">CLIENT &amp; PHONE</th>
                          <th className="py-3 px-4">SERVICE / SESSION</th>
                          <th className="py-3 px-4">DATE &amp; TIME SLOT</th>
                          <th className="py-3 px-4">AMOUNT &amp; ADVANCE</th>
                          <th className="py-3 px-4">STATUS</th>
                          <th className="py-3 px-5 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                          const filtered = serviceBookingsList.filter((item) => {
                            if (!searchTerm.trim()) return true;
                            const tokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
                            const searchable = `${item.client || ''} ${item.phone || ''} ${item.service || ''} ${item.status || ''} ${item.time || ''} ${item.date || ''}`.toLowerCase();
                            return tokens.every((t) => searchable.includes(t));
                          });
                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-400">
                                  No service bookings match your search "{searchTerm}".
                                </td>
                              </tr>
                            );
                          }
                          return filtered.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-5">
                              <div className="font-bold text-slate-900">{item.client}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span>{item.phone}</span>
                                <a
                                  href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${item.client}! Regarding your ${item.service} session scheduled for ${item.date} (${item.time}).`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-0.5 px-1 py-0.2 bg-emerald-50 rounded"
                                >
                                  WhatsApp
                                </a>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${item.color}`}>
                                {item.service}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800">{item.date}</div>
                              <div className="text-[11px] text-slate-500">{item.time}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">₹{item.price.toLocaleString('en-IN')}</div>
                              <div className="text-[10px] text-slate-400">{item.payStatus}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.statusColor}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedServiceBooking(item)}
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                                >
                                  Details
                                </button>
                                {item.status !== 'Confirmed' && (
                                  <button
                                    onClick={() => handleUpdateServiceBookingStatus(item.id, 'Confirmed')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                )}
                                {item.status !== 'Completed' && (
                                  <button
                                    onClick={() => handleUpdateServiceBookingStatus(item.id, 'Completed')}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold cursor-pointer"
                                  >
                                    Complete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 8. TRAVEL BOOKINGS ==================== */}
          {activeTab === 'travel-bookings' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Manage tour packages, passengers, departures and payments</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showActionError('The tour package catalog is not loaded in this dashboard. Manage packages from the storefront catalog before creating bookings.')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-medium text-xs text-slate-600 cursor-pointer"
                  >
                    Tour packages
                  </button>
                  <button
                    onClick={() => setShowAddTourModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Booking request
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Travel enquiries</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">126</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">This month</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Confirmed trips</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{travelList.filter(t => t.status === 'Confirmed').length}</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Ready for operation</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Pending payments</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{travelList.filter(t => t.status === 'Pending').length}</div>
                  <div className="text-[11px] text-amber-600 font-medium mt-0.5">Need follow-up</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Upcoming departures</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">7</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Next 14 days</div>
                </div>
              </div>

              {/* Travel Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-5">CUSTOMER / PACKAGE</th>
                        <th className="py-3 px-4">PASSENGERS</th>
                        <th className="py-3 px-4">TRAVEL DATE</th>
                        <th className="py-3 px-4">PICKUP / DEST.</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-5">PAYMENT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const filtered = travelList.filter((tr) => {
                          if (!searchTerm.trim()) return true;
                          const tokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
                          const searchable = `${tr.customer || ''} ${tr.pkg || ''} ${tr.loc || ''} ${tr.status || ''} ${tr.date || ''} ${tr.pay || ''}`.toLowerCase();
                          return tokens.every((t) => searchable.includes(t));
                        });
                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400">
                                No safari or travel bookings match your search "{searchTerm}".
                              </td>
                            </tr>
                          );
                        }
                        return filtered.map((tr, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-5">
                              <div className="font-bold text-slate-900">{tr.customer}</div>
                              <div className="text-[10px] text-slate-400">{tr.pkg}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{tr.pass}</td>
                            <td className="py-3 px-4 font-bold text-slate-800">{tr.date}</td>
                            <td className="py-3 px-4 text-slate-600">{tr.loc}</td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tr.statusColor}`}>
                                {tr.status}
                              </span>
                            </td>
                            <td className="py-3 px-5 font-bold text-slate-800">{tr.pay}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 9. MARKETING & ADS (META ATTRIBUTION COMMAND CENTER) ==================== */}
          {activeTab === 'marketing' && (
            <MarketingAdsHub
              ordersList={ordersList}
              setSelectedOrderForDetail={setSelectedOrderForDetail}
              tenantInfo={tenant}
            />
          )}

          {/* ==================== 10. AUTOMATIONS ENGINE ==================== */}
          {activeTab === 'automations' && (
            <AutomationManager />
          )}

          {/* ==================== 11. STAFF & ROLES (MERCHANT) ==================== */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              {/* Header Title & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    Staff Accounts, Roles &amp; Permissions
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Granular Access Control
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure permissions for each staff member: choose allowed pages and whether they see <strong>Confirmed Only</strong>, <strong>Pending Only</strong>, or <strong>All Orders</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add New Staff Member
                  </button>
                </div>
              </div>

              {/* 1-Click Interactive Role Perspective Switcher Bar */}
              <div className="bg-gradient-to-r from-slate-50 via-indigo-50/50 to-slate-50 border border-indigo-200/80 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👁️</span>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">Live Role Perspective Tester</div>
                      <div className="text-[11px] text-slate-500">
                        Click any staff member below to preview the Orders page from their perspective:
                      </div>
                    </div>
                  </div>
                  {simulatedStaffId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSimulatedStaffId(null);
                        setActionSuccessToast('Admin View restored. Viewing full merchant controls.');
                        setTimeout(() => setActionSuccessToast(''), 3000);
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer transition"
                    >
                      ✕ Reset to Admin View
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedStaffId(null);
                      setActionSuccessToast('Admin Mode Active: All orders and modules visible.');
                      setTimeout(() => setActionSuccessToast(''), 3000);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      simulatedStaffId === null
                        ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    👑 Merchant Admin (Owner - Full View)
                  </button>

                  {staffList.filter(s => s.id !== 'staff_admin').map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setSimulatedStaffId(st.id);
                        setActionSuccessToast(`Switched view to ${st.name} (${st.role}). Orders filtered!`);
                        setTimeout(() => setActionSuccessToast(''), 4000);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        simulatedStaffId === st.id
                          ? 'bg-amber-500 text-slate-900 shadow-xs ring-2 ring-amber-300'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>
                        {st.orderScope === 'CONFIRMED_ONLY' && '🎯'}
                        {st.orderScope === 'PENDING_ONLY' && '⏳'}
                        {st.orderScope === 'DISPATCH_ONLY' && '🚚'}
                        {st.orderScope === 'ALL' && '📦'}
                      </span>
                      <span>{st.name} ({st.role})</span>
                      <span className="text-[10px] opacity-80 underline">
                        {st.orderScope === 'CONFIRMED_ONLY' ? 'Confirmed Only' : st.orderScope === 'PENDING_ONLY' ? 'Pending Only' : st.orderScope}
                      </span>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="ml-auto px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer transition flex items-center gap-1"
                  >
                    <span>👉 View Filtered Orders</span>
                  </button>
                </div>
              </div>

              {/* 4 Dynamic Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Total Staff Accounts</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{staffList.length}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Across store operations</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Active Logins</div>
                  <div className="text-2xl font-black text-emerald-600 mt-2">
                    {staffList.filter(s => s.status === 'Active').length}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Ready to process orders</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Packing Staff (Confirmed Only)</div>
                  <div className="text-2xl font-black text-purple-600 mt-2">
                    {staffList.filter(s => s.orderScope === 'CONFIRMED_ONLY').length}
                  </div>
                  <div className="text-[11px] text-purple-600 font-medium mt-0.5">Only see confirmed orders</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Call Desk (Pending Only)</div>
                  <div className="text-2xl font-black text-blue-600 mt-2">
                    {staffList.filter(s => s.orderScope === 'PENDING_ONLY').length}
                  </div>
                  <div className="text-[11px] text-blue-600 font-medium mt-0.5">Only see new orders to call</div>
                </div>
              </div>

              {/* Staff Accounts Table with Granular Scope Badges & Adjust Button */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Staff Members &amp; Permission Scopes</h3>
                    <p className="text-[11px] text-slate-500">Each staff member has customized order visibility and module access</p>
                  </div>
                  <div className="text-xs text-slate-400">
                    Showing <strong>{staffList.length}</strong> accounts
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-5">STAFF MEMBER</th>
                        <th className="py-3 px-4">ASSIGNED ROLE</th>
                        <th className="py-3 px-4">ORDER VISIBILITY SCOPE</th>
                        <th className="py-3 px-4">MODULE ACCESS</th>
                        <th className="py-3 px-4">ACTION RIGHTS</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-5 text-right">ADJUST &amp; TEST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffList.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                {st.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{st.name}</span>
                                  {simulatedStaffId === st.id && (
                                    <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded border border-amber-300">
                                      Simulating View
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>{st.email}</span>
                                  {st.phone && (
                                    <>
                                      <span>•</span>
                                      <a href={`tel:${st.phone}`} className="text-indigo-600 hover:underline">{st.phone}</a>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                              {st.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {st.orderScope === 'CONFIRMED_ONLY' && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-extrabold text-[11px] border border-purple-200">
                                  <span>🎯</span> Confirmed Only Orders
                                </span>
                                <div className="text-[10px] text-slate-400 font-medium">Packing &amp; Kitchen (Pending hide)</div>
                              </div>
                            )}

                            {st.orderScope === 'PENDING_ONLY' && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[11px] border border-blue-200">
                                  <span>⏳</span> New &amp; Pending Orders Only
                                </span>
                                <div className="text-[10px] text-slate-400 font-medium">Call Desk (Pending Verification)</div>
                              </div>
                            )}

                            {st.orderScope === 'DISPATCH_ONLY' && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-[11px] border border-indigo-200">
                                  <span>🚚</span> Dispatched Only Orders
                                </span>
                                <div className="text-[10px] text-slate-400 font-medium">Courier &amp; In-transit tracking</div>
                              </div>
                            )}

                            {st.orderScope === 'ALL' && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[11px] border border-emerald-200">
                                  <span>📦</span> All Orders (All)
                                </span>
                                <div className="text-[10px] text-slate-400 font-medium">Full visibility of all statuses</div>
                              </div>
                            )}

                            {st.orderScope === 'CUSTOM' && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[11px] border border-amber-200">
                                  <span>⚙️</span> Custom Statuses ({st.allowedOrderStatuses?.length || 0})
                                </span>
                                <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                                  {st.allowedOrderStatuses?.join(', ')}
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {st.modules && st.modules.map(mod => (
                                <span key={mod} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded capitalize">
                                  {mod}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5 text-[10px]">
                              <div className="flex items-center gap-1">
                                <span className={st.canAcceptOrders ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                                  {st.canAcceptOrders ? '✓ Accept' : '✕ Accept'}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className={st.canPackOrders ? 'text-purple-600 font-bold' : 'text-slate-400'}>
                                  {st.canPackOrders ? '✓ Pack' : '✕ Pack'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={st.canDispatchOrders ? 'text-blue-600 font-bold' : 'text-slate-400'}>
                                  {st.canDispatchOrders ? '✓ Dispatch' : '✕ Dispatch'}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className={st.canViewRevenue ? 'text-emerald-700 font-bold' : 'text-slate-400 font-mono'}>
                                  {st.canViewRevenue ? '₹ Revenue' : '•••• Revenue'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStaffStatus(st)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition ${
                                st.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {st.status}
                            </button>
                          </td>

                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStaffForEdit(st);
                                  setShowEditStaffModal(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-1 cursor-pointer transition"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust Permissions
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSimulatedStaffId(st.id);
                                  setActiveTab('orders');
                                  setActionSuccessToast(`Simulation Active: Showing Orders tab as seen by ${st.name}`);
                                  setTimeout(() => setActionSuccessToast(''), 4000);
                                }}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1 cursor-pointer transition"
                                title="Test what this staff member sees in Orders"
                              >
                                <Eye className="w-3.5 h-3.5" /> Test View
                              </button>

                              {st.id !== 'staff_admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStaff(st)}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="Remove Staff"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Role Matrix Best Practices Guide Box */}
              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Role Matrix &amp; Operational Security Guide
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Segregating order visibility by team role prevents fulfillment errors and protects customer privacy:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-purple-700">
                      <span>🎯</span> Packing Staff (Confirmed Only)
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Kitchen and packing staff only see orders with <strong>Confirmed</strong> status in this view.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-blue-700">
                      <span>⏳</span> Calling Desk (Pending Only)
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Calling staff only see <strong>New / Pending</strong> orders in this view. Confirmed orders move to the packing queue.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-emerald-700">
                      <span>🔒</span> Revenue Confidentiality
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      <strong>Total Revenue Masking</strong> keeps business turnover and gross profit margins confidential from non-admin staff accounts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 12. INTEGRATIONS (MERCHANT) ==================== */}
          {activeTab === 'integrations' && (
            <IntegrationsManager />
          )}

          {/* ==================== 13. REPORTS ==================== */}
          {activeTab === 'reports' && (() => {
            const totalOrders = ordersList.length;
            const grossOrderValue = ordersList.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
            const netSales = ordersList.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + (Number(o.total) || 0), 0);
            const deliveredOrders = ordersList.filter(o => o.status === 'DELIVERED').length;
            const processingOrders = ordersList.filter(o => o.status === 'PROCESSING' || o.status === 'SHIPPED').length;
            const pendingOrders = ordersList.filter(o => o.status === 'NEW' || o.status === 'CONFIRMED').length;
            const cancelledOrders = ordersList.filter(o => o.status === 'CANCELLED').length;
            const cancelledValue = ordersList.filter(o => o.status === 'CANCELLED').reduce((sum, o) => sum + (Number(o.total) || 0), 0);
            const paidOrders = ordersList.filter(o => o.paymentStatus === 'PAID' && o.status !== 'CANCELLED');
            const paidOrderValue = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
            const trendData = dailyChartData.slice(-10);
            const trendMax = Math.max(...trendData.map(d => d.revenue), 1);
            const hasTrendData = trendData.some(d => d.revenue > 0 || d.count > 0);

            const safeTotal = totalOrders || 1;
            const deliveredPct = Math.round((deliveredOrders / safeTotal) * 100);
            const processingPct = Math.round((processingOrders / safeTotal) * 100);
            const pendingPct = Math.round((pendingOrders / safeTotal) * 100);
            const cancelledPct = Math.round((cancelledOrders / safeTotal) * 100);

            const totalBookings = serviceBookingsList?.length || 0;
            const wonLeads = crmLeads.filter(l => (l.status || '').toUpperCase() === 'WON').length;
            const convRate = crmLeads.length > 0 ? ((wonLeads / crmLeads.length) * 100).toFixed(1) : null;

            return (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">Review sales, bookings, inventory and campaign outcomes</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-600">
                      Loaded order records
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const csvHeaders = "Metric,Value\n";
                        const csvRows = [
                          `"Total Orders","${totalOrders}"`,
                          `"Gross Order Value","₹${grossOrderValue}"`,
                          `"Net Sales","₹${netSales}"`,
                          `"Paid Order Value","₹${paidOrderValue}"`,
                          `"Cancelled Order Value (not refunds)","₹${cancelledValue}"`,
                          `"Delivered Orders","${deliveredOrders}"`,
                          `"Processing Orders","${processingOrders}"`,
                          `"Pending Orders","${pendingOrders}"`,
                          `"Cancelled Orders","${cancelledOrders}"`
                        ].join("\n");
                        const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'financial_report.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                        setActionSuccessToast('Report CSV exported successfully!');
                        setTimeout(() => setActionSuccessToast(''), 3000);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Export
                    </button>
                  </div>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <div className="text-xs text-slate-500 font-medium">Net sales</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">₹{netSales.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Loaded records, excluding cancelled</div>
                  </div>
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <div className="text-xs text-slate-500 font-medium">Orders</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">{totalOrders}</div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Orders in the loaded dataset</div>
                  </div>
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <div className="text-xs text-slate-500 font-medium">Bookings / Service</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">{totalBookings}</div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Scheduled appointments</div>
                  </div>
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <div className="text-xs text-slate-500 font-medium">Lead Conversion</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">{convRate === null ? '—' : `${convRate}%`}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{crmLeads.length > 0 ? `${wonLeads} won of ${crmLeads.length} leads` : 'No CRM leads loaded'}</div>
                  </div>
                </div>

                {/* Row 2: Sales Trend & Order Status Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Sales trend (last 10 days in range)</h3>
                    {hasTrendData ? (
                      <div className="h-44 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
                        {trendData.map((day) => (
                          <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                            <div
                              style={{ height: `${(day.revenue / trendMax) * 100}%` }}
                              className="w-full bg-indigo-600 rounded-t-lg transition"
                              title={`${day.dayLabel}: ₹${day.revenue.toLocaleString('en-IN')} from ${day.count} order(s)`}
                            />
                            <span className="text-[9px] text-slate-400 truncate w-full text-center">{day.dayLabel}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                        No non-cancelled orders recorded in the selected date range.
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Order status distribution</h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between text-slate-600 font-semibold mb-1">
                          <span>Delivered</span>
                          <span className="font-bold text-slate-900">{deliveredOrders} ({deliveredPct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${deliveredPct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-600 font-semibold mb-1">
                          <span>Processing / Shipped</span>
                          <span className="font-bold text-slate-900">{processingOrders} ({processingPct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${processingPct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-600 font-semibold mb-1">
                          <span>Pending / New</span>
                          <span className="font-bold text-slate-900">{pendingOrders} ({pendingPct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${pendingPct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-600 font-semibold mb-1">
                          <span>Cancelled</span>
                          <span className="font-bold text-slate-900">{cancelledOrders} ({cancelledPct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${cancelledPct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Summary Audit Table */}
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 px-6 border-b border-slate-200/80">
                    <h3 className="font-bold text-slate-900 text-sm">Performance summary</h3>
                    <p className="text-[11px] text-slate-400">Values below cover the orders currently loaded in this dashboard. Cancellations are not a refund ledger.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-6">METRIC</th>
                          <th className="py-3 px-4">CURRENT RECORDED</th>
                          <th className="py-3 px-4">PERCENTAGE / COUNT</th>
                          <th className="py-3 px-6 text-right">DEFINITION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { metric: 'Gross Order value', curr: `₹${grossOrderValue.toLocaleString('en-IN')}`, count: `${totalOrders} orders`, def: 'Total value of all placed orders' },
                          { metric: 'Net Sales', curr: `₹${netSales.toLocaleString('en-IN')}`, count: `${totalOrders - cancelledOrders} orders`, def: 'Order value excluding cancellations' },
                          { metric: 'Paid order value', curr: `₹${paidOrderValue.toLocaleString('en-IN')}`, count: `${paidOrders.length} paid orders`, def: 'Orders explicitly marked paymentStatus = PAID' },
                          { metric: 'Cancelled order value', curr: `₹${cancelledValue.toLocaleString('en-IN')}`, count: `${cancelledOrders} orders`, def: 'Value of cancelled orders; not a refund record' },
                          { metric: 'CRM Leads Ingested', curr: `${crmLeads.length} leads`, count: `${crmLeads.filter(l => l.status === 'WON').length} converted`, def: 'Meta Ads & organic leads' }
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="py-3.5 px-6 font-bold text-slate-900">{row.metric}</td>
                            <td className="py-3.5 px-4 font-black text-slate-900">{row.curr}</td>
                            <td className="py-3.5 px-4 font-bold text-indigo-600">{row.count}</td>
                            <td className="py-3.5 px-6 text-right text-slate-500">{row.def}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ==================== 13B. SUBSCRIPTION & BILLING SCREEN ==================== */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    Subscription Plan, Quotas &amp; Invoices
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live tier tracking, monthly order quotas, Meta CAPI usage, and 1-click plan upgrades
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('settings');
                      setSettingsSubTab('billing');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                  >
                    View in Settings &rarr;
                  </button>
                </div>
              </div>

              <BillingSettings />
            </div>
          )}

          {/* ==================== 14. SETTINGS & BILLING ==================== */}

          {/* ==================== 15. CUSTOMER STOREFRONT PREVIEW & PUBLIC ACCESS ==================== */}
          {activeTab === 'customer-view' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
                      <Store className="w-5 h-5" />
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                      Customer Storefront &amp; Public Ordering Page
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Direct public storefront where customers browse products, add to cart, and place orders.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/store/${businessSlug}`);
                      setActionSuccessToast('Public storefront URL copied to clipboard!');
                      setTimeout(() => setActionSuccessToast(''), 4000);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Store Link</span>
                  </button>

                  <a
                    href={`/store/${businessSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>Open Store in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Storefront status and configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Storefront Status</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${tenant?.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    <span className="font-extrabold text-slate-900 text-sm">{tenant?.status === 'ACTIVE' ? 'Active account' : tenant?.status ? `Account ${tenant.status}` : 'Status unavailable'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {productsList.length > 0 ? `${productsList.length} products listed` : 'No products listed'}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Public Store URL</div>
                  <div className="font-mono text-xs font-bold text-indigo-600 truncate mt-1.5">
                    /store/{businessSlug}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Public storefront path</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Meta Pixel &amp; CAPI</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                      tenant?.settings?.metaPixelId || tenant?.integrations?.meta?.pixelId
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {tenant?.settings?.metaPixelId || tenant?.integrations?.meta?.pixelId ? 'Configured' : 'Not configured'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Browser Pixel + Conversions API when configured</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Catalog</div>
                  <div className="font-extrabold text-slate-900 text-sm mt-1.5">
                    {productsList.length} Products Listed
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Catalog loaded from the server</div>
                </div>
              </div>

              {/* Live Preview Container with Device View Toggle */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-sm text-slate-800">Storefront Preview</span>
                    <span className="text-[11px] text-slate-400">
                      (Preview of the public storefront layout)
                    </span>
                  </div>

                  {/* Device Viewport Selector */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setStorePreviewDevice('desktop')}
                      className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        storePreviewDevice === 'desktop'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Desktop View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStorePreviewDevice('mobile')}
                      className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        storePreviewDevice === 'mobile'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Mobile View (375px)</span>
                    </button>
                  </div>
                </div>

                {/* Device Frame */}
                {storePreviewDevice === 'mobile' ? (
                  <div className="flex flex-col items-center justify-center py-6 bg-slate-100 rounded-2xl border border-slate-200/80">
                    <div className="w-[390px] h-[720px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 flex flex-col relative">
                      {/* Speaker & camera notch */}
                      <div className="w-28 h-5 bg-black rounded-full mx-auto mb-2 shrink-0"></div>
                      <div className="flex-1 bg-white rounded-[32px] overflow-hidden flex flex-col">
                        <iframe
                          src={`/store/${businessSlug}`}
                          title="Customer Mobile Storefront Preview"
                          className="w-full h-full border-0 select-auto"
                        />
                      </div>
                      <div className="w-32 h-1 bg-slate-600 rounded-full mx-auto mt-2 shrink-0"></div>
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-3 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                      Mobile viewport preview of the public storefront
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col">
                    {/* Mock Browser Header Bar */}
                    <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span>
                        <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                        <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
                      </div>
                      <div className="flex-1 bg-slate-100 rounded-lg px-3 py-1 text-[11px] font-mono text-slate-600 flex items-center justify-between border border-slate-200">
                        <span className="truncate">{typeof window !== 'undefined' ? window.location.origin : ''}/store/{businessSlug}</span>
                        <span className="text-slate-500 font-semibold text-[10px]">Storefront link</span>
                      </div>
                    </div>
                    <div className="h-[750px] w-full bg-white">
                      <iframe
                        src={`/store/${businessSlug}`}
                        title="Customer Desktop Storefront Preview"
                        className="w-full h-full border-0"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Settings & Configuration</h2>
                  <p className="text-xs text-slate-500">Configure your business profile, branding, storefront, payments, team and Meta ads integration</p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 cursor-pointer flex items-center gap-1.5 transition"
                >
                  <Check className="w-3.5 h-3.5" /> Save changes
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sub Menu */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm space-y-1 text-xs font-semibold self-start">
                  {[
                    { key: 'profile', label: 'Business profile', icon: Building2 },
                    { key: 'branding', label: 'Branding & Theme', icon: Sparkles },
                    { key: 'store', label: 'Store / ordering page', icon: ShoppingBag },
                    { key: 'payments', label: 'Payments & UPI', icon: CreditCard },
                    { key: 'notifications', label: 'Notifications & Alerts', icon: Bell },
                    { key: 'team', label: 'Team & permissions', icon: Users },
                    { key: 'billing', label: 'Subscription & billing', icon: DollarSign },
                    { key: 'meta', label: 'Facebook & Instagram Ads', icon: Share2, badge: 'Live CAPI' },
                    { key: 'privacy', label: 'Privacy & data', icon: ShieldCheck }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = settingsSubTab === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSettingsSubTab(item.key)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-600 font-bold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Sub Tab Form Content */}
                <div className="lg:col-span-3">
                  {/* 1. Business Profile */}
                  {settingsSubTab === 'profile' && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-900 text-sm">Business profile</h3>
                        <p className="text-[11px] text-slate-400">These details appear on your public business pages, receipts and SMS notifications</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Business name</label>
                          <input
                            type="text"
                            value={bizProfileName}
                            onChange={(e) => setBizProfileName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Business type</label>
                          <select
                            value={bizType}
                            onChange={(e) => setBizType(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                          >
                            <option>Product selling (physical goods)</option>
                            <option>Photography & Events</option>
                            <option>Travel Agency</option>
                            <option>Lead Generation CRM</option>
                            <option>Service Business</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Contact email</label>
                          <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Contact phone (Customer helpline)</label>
                          <input
                            type="text"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">GSTIN / Business Registration Number</label>
                          <input
                            type="text"
                            value={gstinNumber}
                            onChange={(e) => setGstinNumber(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Currency & Region</label>
                          <input
                            type="text"
                            readOnly
                            value="INR (₹) · India (IST)"
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-600 font-medium cursor-not-allowed"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-slate-700 font-bold block mb-1">Business address</label>
                          <input
                            type="text"
                            value={bizAddress}
                            onChange={(e) => setBizAddress(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={handleSaveSettings}
                          className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 cursor-pointer"
                        >
                          Save Profile
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. Branding & Theme */}
                  {settingsSubTab === 'branding' && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-900 text-sm">Branding & Store Theme</h3>
                        <p className="text-[11px] text-slate-400">Customize your storefront tagline and primary color</p>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Store Tagline / Slogan</label>
                          <input
                            type="text"
                            value={brandTagline}
                            onChange={(e) => setBrandTagline(e.target.value)}
                            placeholder="e.g. Your store tagline"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-slate-700 font-bold block mb-2">Primary Brand Color</label>
                          <div className="flex items-center gap-3">
                            {[
                              { hex: '#5046e5', name: 'Indigo Royal' },
                              { hex: '#059669', name: 'Desi Emerald' },
                              { hex: '#d97706', name: 'Mustard Amber' },
                              { hex: '#dc2626', name: 'Chilli Red' }
                            ].map((clr) => (
                              <button
                                key={clr.hex}
                                type="button"
                                onClick={() => setBrandColor(clr.hex)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                                  brandColor === clr.hex ? 'border-slate-800 bg-slate-50 shadow-xs' : 'border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: clr.hex }} />
                                {clr.name}
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={handleSaveSettings}
                          className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 cursor-pointer"
                        >
                          Save Branding
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. Store / Ordering Page */}
                  {settingsSubTab === 'store' && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">Store / Ordering Page</h3>
                          <p className="text-[11px] text-slate-400">Controls for your public online store and checkout options</p>
                        </div>
                        <a
                          href={`/store/${businessSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-100"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Live Storefront
                        </a>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                          <div>
                            <div className="font-bold text-slate-800 text-xs">Public storefront status</div>
                            <div className="text-[11px] text-slate-400">Controlled by the platform account status, not by this form</div>
                          </div>
                          <span className="text-xs font-bold text-slate-700">{tenant?.status || 'Unknown'}</span>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                          <div>
                            <div className="font-bold text-slate-800 text-xs">Enable Cash on Delivery (COD)</div>
                            <div className="text-[11px] text-slate-400">Allow customers to pay cash when order arrives at their door</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEnableCod(!enableCod)}
                            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                              enableCod ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${enableCod ? 'left-5' : 'left-0.5'}`} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="text-slate-700 font-bold block mb-1">Minimum Order Amount (₹)</label>
                            <input
                              type="number"
                              value={minOrderValue}
                              onChange={(e) => setMinOrderValue(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Orders below this amount cannot be checked out.</p>
                          </div>
                          <div>
                            <label className="text-slate-700 font-bold block mb-1">Standard Shipping Fee (₹)</label>
                            <input
                              type="number"
                              value={shippingFee}
                              onChange={(e) => setShippingFee(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              {Number(tenant?.settings?.freeShippingThreshold) > 0
                                ? `Free delivery applies at or above ₹${Number(tenant.settings.freeShippingThreshold).toLocaleString('en-IN')}.`
                                : 'No free-delivery threshold is configured.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={handleSaveSettings}
                          className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 cursor-pointer"
                        >
                          Save Store Settings
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. Payments & UPI */}
                  {settingsSubTab === 'payments' && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-900 text-sm">Payments & UPI Gateway</h3>
                        <p className="text-[11px] text-slate-400">Configure online payments via UPI, Debit/Credit cards, NetBanking & Razorpay</p>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Merchant UPI ID (VPA)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={merchantUpiId}
                              onChange={(e) => setMerchantUpiId(e.target.value)}
                              placeholder="e.g. business@icici or 9876543210@upi"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-medium"
                            />
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200 shrink-0">
                              Instant Settlement
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">UPI QR code and payment link will receive funds directly to this bank VPA.</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
                          <div className="font-bold text-slate-800">Razorpay keys are managed in Integrations</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            This form does not collect or verify gateway credentials. Open Integrations to save Razorpay keys.
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-800">Paid orders are confirmed by the payment webhook</div>
                            <div className="text-[11px] text-slate-400">The server applies this after a verified Razorpay event</div>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Server behavior
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={handleSaveSettings}
                          className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 cursor-pointer"
                        >
                          Save UPI Setting
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 5. Notifications & Alerts */}
                  {settingsSubTab === 'notifications' && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-900 text-sm">Notifications & Alerts</h3>
                        <p className="text-[11px] text-slate-400">Automatic WhatsApp, SMS and email delivery is not configured</p>
                      </div>

                      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 space-y-2">
                        <p className="font-bold">No automatic notifications are sent by this setting.</p>
                        <p>
                          Order confirmations, tracking links and review requests are opened manually from the Orders page. SMS and PDF invoice email are not implemented.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('orders')}
                          className="font-bold text-amber-950 underline cursor-pointer"
                        >
                          Go to Orders to open a customer message
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 6. Team & Permissions */}
                  {settingsSubTab === 'team' && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">Team Members &amp; Staff Access</h3>
                          <p className="text-[11px] text-slate-400">Control role-based permissions, order visibility scopes, and staff logins</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddStaffModal(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-indigo-700"
                        >
                          <Plus className="w-3.5 h-3.5" /> + Add Staff Member
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                            <tr>
                              <th className="py-2.5 px-4">NAME</th>
                              <th className="py-2.5 px-4">EMAIL</th>
                              <th className="py-2.5 px-4">ROLE</th>
                              <th className="py-2.5 px-4">ORDER SCOPE</th>
                              <th className="py-2.5 px-4">STATUS</th>
                              <th className="py-2.5 px-4 text-right">ACTION</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {staffList.map((mem) => (
                              <tr key={mem.id} className="hover:bg-slate-50 transition">
                                <td className="py-3 px-4 font-bold text-slate-900">{mem.name}</td>
                                <td className="py-3 px-4 text-slate-600 font-mono">{mem.email}</td>
                                <td className="py-3 px-4">
                                  <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px]">
                                    {mem.role}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                    mem.orderScope === 'CONFIRMED_ONLY' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    mem.orderScope === 'PENDING_ONLY' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    mem.orderScope === 'DISPATCH_ONLY' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    {mem.orderScope === 'CONFIRMED_ONLY' && '🎯 Confirmed Only'}
                                    {mem.orderScope === 'PENDING_ONLY' && '⏳ Pending Only'}
                                    {mem.orderScope === 'DISPATCH_ONLY' && '🚚 Dispatched Only'}
                                    {mem.orderScope === 'ALL' && '📦 All Orders'}
                                    {mem.orderScope === 'CUSTOM' && '⚙️ Custom'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded-full text-[10px] border border-emerald-200">
                                    {mem.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedStaffForEdit(mem);
                                      setShowEditStaffModal(true);
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 font-bold text-xs cursor-pointer"
                                  >
                                    Adjust Permissions
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 7. Subscription & Billing */}
                  {settingsSubTab === 'billing' && (
                    <div className="space-y-6">
                      <BillingSettings />
                    </div>
                  )}

                  {/* 8. Facebook & Instagram Ads (Meta OAuth, Lead Ads & CAPI Tracking) */}
                  {settingsSubTab === 'meta' && (
                    <div className="space-y-6">
                      <MetaAdsIntegration onLeadSynced={fetchCrmLeads} />
                      <MetaTrackingSettings />
                    </div>
                  )}

                  {/* 9. Privacy & Customer Data */}
                  {settingsSubTab === 'privacy' && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-900 text-sm">Privacy & Data Governance</h3>
                        <p className="text-[11px] text-slate-400">Digital Personal Data Protection (DPDP) and customer consent compliance</p>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="font-bold text-slate-800">Customer Data Retention Policy</span>
                          <p className="text-slate-500 text-[11px]">
                            Customer contact numbers and addresses are strictly scoped to your tenant database and never shared across merchants.
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
                          <div>
                            <div className="font-bold text-slate-800">Export All Customer Records</div>
                            <div className="text-[11px] text-slate-400">Download the loaded lead and customer records as CSV</div>
                          </div>
                          <button
                            type="button"
                            onClick={handleExportCustomersCsv}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Export CSV
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 1. Adjust Permissions Modal */}
              {showEditStaffModal && selectedStaffForEdit && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-700">
                            <SlidersHorizontal className="w-4 h-4" />
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-base">
                            Adjust Permissions &amp; Role Scopes
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Configure permissions for <strong>{selectedStaffForEdit.name}</strong> ({selectedStaffForEdit.email})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEditStaffModal(false)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-5 text-xs">
                      {/* Section 1: Staff Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Full Name</label>
                          <input
                            type="text"
                            value={selectedStaffForEdit.name}
                            onChange={(e) => setSelectedStaffForEdit({ ...selectedStaffForEdit, name: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Role Title</label>
                          <input
                            type="text"
                            value={selectedStaffForEdit.role}
                            onChange={(e) => setSelectedStaffForEdit({ ...selectedStaffForEdit, role: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Phone Number</label>
                          <input
                            type="text"
                            value={selectedStaffForEdit.phone || ''}
                            onChange={(e) => setSelectedStaffForEdit({ ...selectedStaffForEdit, phone: e.target.value })}
                            placeholder="+91 98290 ..."
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium text-slate-900"
                          />
                        </div>
                      </div>

                      {/* Section 2: Order Visibility Scope (THE CORE USER REQUIREMENT) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-900 font-extrabold text-xs flex items-center gap-1.5">
                            <span className="text-indigo-600">🎯</span> Order Status Visibility Scope
                          </label>
                          <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                            Selected: {selectedStaffForEdit.orderScope}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Choose which order statuses this staff member is allowed to view in the orders table:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                          {/* Option 1: CONFIRMED_ONLY (Packing) */}
                          <div
                            onClick={() => setSelectedStaffForEdit({
                              ...selectedStaffForEdit,
                              orderScope: 'CONFIRMED_ONLY',
                              allowedOrderStatuses: ['CONFIRMED', 'PROCESSING']
                            })}
                            className={`p-3 rounded-2xl border cursor-pointer transition space-y-1 ${
                              selectedStaffForEdit.orderScope === 'CONFIRMED_ONLY'
                                ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-300'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs text-purple-900">
                                <span>🎯</span> Confirmed Only &amp; Processing Orders
                              </span>
                              <input
                                type="radio"
                                name="orderScope"
                                checked={selectedStaffForEdit.orderScope === 'CONFIRMED_ONLY'}
                                onChange={() => {}}
                                className="cursor-pointer text-purple-600"
                              />
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              <strong>Recommended for Kitchen &amp; Packing Staff.</strong> Shows confirmed orders only so unconfirmed or unpaid orders are not packed prematurely.
                            </p>
                            <div className="text-[10px] text-purple-700 font-mono font-bold">
                              Statuses: CONFIRMED, PROCESSING
                            </div>
                          </div>

                          {/* Option 2: PENDING_ONLY (Calling Desk) */}
                          <div
                            onClick={() => setSelectedStaffForEdit({
                              ...selectedStaffForEdit,
                              orderScope: 'PENDING_ONLY',
                              allowedOrderStatuses: ['NEW']
                            })}
                            className={`p-3 rounded-2xl border cursor-pointer transition space-y-1 ${
                              selectedStaffForEdit.orderScope === 'PENDING_ONLY'
                                ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-300'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs text-blue-900">
                                <span>⏳</span> New &amp; Pending Orders Only
                              </span>
                              <input
                                type="radio"
                                name="orderScope"
                                checked={selectedStaffForEdit.orderScope === 'PENDING_ONLY'}
                                onChange={() => {}}
                                className="cursor-pointer text-blue-600"
                              />
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              <strong>Recommended for Calling Desk &amp; Verification.</strong> Staff verifies new orders by phone. Once accepted, the order transitions to Confirmed.
                            </p>
                            <div className="text-[10px] text-blue-700 font-mono font-bold">
                              Statuses: NEW (Pending)
                            </div>
                          </div>

                          {/* Option 3: DISPATCH_ONLY (Courier) */}
                          <div
                            onClick={() => setSelectedStaffForEdit({
                              ...selectedStaffForEdit,
                              orderScope: 'DISPATCH_ONLY',
                              allowedOrderStatuses: ['SHIPPED', 'DELIVERED']
                            })}
                            className={`p-3 rounded-2xl border cursor-pointer transition space-y-1 ${
                              selectedStaffForEdit.orderScope === 'DISPATCH_ONLY'
                                ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-300'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs text-indigo-900">
                                <span>🚚</span> Dispatched &amp; Shipped Orders Only
                              </span>
                              <input
                                type="radio"
                                name="orderScope"
                                checked={selectedStaffForEdit.orderScope === 'DISPATCH_ONLY'}
                                onChange={() => {}}
                                className="cursor-pointer text-indigo-600"
                              />
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              <strong>Recommended for Delivery Partners &amp; Logistics.</strong> Shows only in-transit and dispatched orders with tracking IDs.
                            </p>
                            <div className="text-[10px] text-indigo-700 font-mono font-bold">
                              Statuses: SHIPPED, DELIVERED
                            </div>
                          </div>

                          {/* Option 4: ALL (Full Access) */}
                          <div
                            onClick={() => setSelectedStaffForEdit({
                              ...selectedStaffForEdit,
                              orderScope: 'ALL',
                              allowedOrderStatuses: ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
                            })}
                            className={`p-3 rounded-2xl border cursor-pointer transition space-y-1 ${
                              selectedStaffForEdit.orderScope === 'ALL'
                                ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-300'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-900">
                                <span>📦</span> All Orders (All Statuses)
                              </span>
                              <input
                                type="radio"
                                name="orderScope"
                                checked={selectedStaffForEdit.orderScope === 'ALL'}
                                onChange={() => {}}
                                className="cursor-pointer text-emerald-600"
                              />
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              <strong>Recommended for Store Managers &amp; Admins.</strong> Full access to all orders across every pipeline stage.
                            </p>
                            <div className="text-[10px] text-emerald-700 font-mono font-bold">
                              Statuses: NEW, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
                            </div>
                          </div>
                        </div>

                        {/* Custom Status Checkboxes if CUSTOM selected */}
                        {selectedStaffForEdit.orderScope === 'CUSTOM' && (
                          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-2 mt-2">
                            <span className="font-bold text-amber-900 text-xs">Select Custom Statuses:</span>
                            <div className="flex flex-wrap gap-2">
                              {['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => {
                                const isChecked = selectedStaffForEdit.allowedOrderStatuses?.includes(st);
                                return (
                                  <label key={st} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-amber-300 cursor-pointer font-bold text-[11px] text-slate-800">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const cur = selectedStaffForEdit.allowedOrderStatuses || [];
                                        const updated = e.target.checked ? [...cur, st] : cur.filter(x => x !== st);
                                        setSelectedStaffForEdit({ ...selectedStaffForEdit, allowedOrderStatuses: updated });
                                      }}
                                      className="rounded text-indigo-600"
                                    />
                                    <span>{st}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Section 3: Accessible Pages / Modules */}
                      <div className="space-y-2">
                        <label className="text-slate-900 font-extrabold text-xs flex items-center gap-1.5">
                          <span>🛡️</span> Accessible Modules &amp; Pages
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Unchecking will hide and lock this module from the staff member's sidebar navigation:
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { key: 'orders', label: '🛍️ Orders & Hub' },
                            { key: 'products', label: '📦 Products Catalog' },
                            { key: 'categories', label: '📂 Categories & Showcase' },
                            { key: 'leads', label: '👥 CRM Leads' },
                            { key: 'customers', label: '🤝 Customers' },
                            { key: 'marketing', label: '📢 Marketing & Meta' },
                            { key: 'automations', label: '⚡ Automations' },
                            { key: 'staff', label: '🛡️ Staff & Roles' },
                            { key: 'settings', label: '⚙️ Store Settings' },
                          ].map((mod) => {
                            const hasMod = selectedStaffForEdit.modules?.includes(mod.key);
                            return (
                              <label
                                key={mod.key}
                                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                  hasMod ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold' : 'bg-white border-slate-200 text-slate-600 font-medium'
                                }`}
                              >
                                <span className="text-[11px]">{mod.label}</span>
                                <input
                                  type="checkbox"
                                  checked={hasMod}
                                  onChange={(e) => {
                                    const cur = selectedStaffForEdit.modules || [];
                                    const updated = e.target.checked ? [...cur, mod.key] : cur.filter(x => x !== mod.key);
                                    setSelectedStaffForEdit({ ...selectedStaffForEdit, modules: updated });
                                  }}
                                  className="rounded text-indigo-600 cursor-pointer"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 4: Operational Action Rights */}
                      <div className="space-y-2">
                        <label className="text-slate-900 font-extrabold text-xs flex items-center gap-1.5">
                          <span>⚡</span> Operational Action Rights
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                          <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                            <div>
                              <div className="font-bold text-slate-900">Accept / Confirm Orders</div>
                              <div className="text-[10px] text-slate-500">Can confirm new orders</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedStaffForEdit.canAcceptOrders ?? true}
                              onChange={(e) => setSelectedStaffForEdit({ ...selectedStaffForEdit, canAcceptOrders: e.target.checked })}
                              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                            />
                          </label>

                          <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                            <div>
                              <div className="font-bold text-slate-900">Pack &amp; Box Orders</div>
                              <div className="text-[10px] text-slate-500">Can mark orders packed and ready</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedStaffForEdit.canPackOrders ?? true}
                              onChange={(e) => setSelectedStaffForEdit({ ...selectedStaffForEdit, canPackOrders: e.target.checked })}
                              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                            />
                          </label>

                          <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                            <div>
                              <div className="font-bold text-slate-900">Courier Dispatch Rights</div>
                              <div className="text-[10px] text-slate-500">Can enter tracking ID and dispatch orders</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedStaffForEdit.canDispatchOrders ?? true}
                              onChange={(e) => setSelectedStaffForEdit({ ...selectedStaffForEdit, canDispatchOrders: e.target.checked })}
                              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                            />
                          </label>

                          <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                            <div>
                              <div className="font-bold text-slate-900">Cancel &amp; Reject Orders</div>
                              <div className="text-[10px] text-slate-500">Can cancel customer orders</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedStaffForEdit.canCancelOrders ?? false}
                              onChange={(e) => setSelectedStaffForEdit({ ...selectedStaffForEdit, canCancelOrders: e.target.checked })}
                              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                            />
                          </label>

                          <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 cursor-pointer sm:col-span-2">
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>🔒</span> View Store Revenue &amp; Order Prices (Confidential)
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Disabling hides total revenue and order amounts (masked as ••••).
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedStaffForEdit.canViewRevenue ?? true}
                              onChange={(e) => setSelectedStaffForEdit({ ...selectedStaffForEdit, canViewRevenue: e.target.checked })}
                              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleSaveStaffPermissions(selectedStaffForEdit, { testView: true })}
                        className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs border border-purple-200 cursor-pointer transition flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Save &amp; Test This View in Orders
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowEditStaffModal(false)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveStaffPermissions(selectedStaffForEdit)}
                          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-500/10 cursor-pointer transition flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Save Permissions
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Add New Staff Member Modal */}
              {(showAddStaffModal || showAddTeamModal) && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">Add New Staff Member</h3>
                        <p className="text-xs text-slate-400">Assign role and customized order visibility</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddStaffModal(false);
                          setShowAddTeamModal(false);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newStaffForm.name.trim() || !newStaffForm.email.trim()) {
                          showActionError('Enter the staff member name and email address.');
                          return;
                        }
                        if (!newStaffForm.password || newStaffForm.password.length < 8) {
                          showActionError('Set an initial password of at least 8 characters for the new staff account.');
                          return;
                        }

                        let apiRole = 'ORDER_MANAGER';
                        if (newStaffForm.orderScope === 'PENDING_ONLY') apiRole = 'SUPPORT_STAFF';
                        else if (newStaffForm.orderScope === 'DISPATCH_ONLY') apiRole = 'INVENTORY_STAFF';
                        else if (newStaffForm.modules?.includes('marketing')) apiRole = 'MARKETING_STAFF';

                        try {
                          const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
                          const res = await axios.post('/api/auth/staff', {
                            name: newStaffForm.name.trim(),
                            email: newStaffForm.email.trim(),
                            password: newStaffForm.password,
                            role: apiRole,
                            phone: newStaffForm.phone?.trim() || ''
                          }, {
                            headers: token ? { Authorization: `Bearer ${token}` } : {}
                          });
                          if (!res.data?.success) {
                            throw new Error(res.data?.message || 'The staff account was not created.');
                          }
                        } catch (err) {
                          showActionError(
                            err.response?.data?.message || err.message || 'Could not create the staff account.'
                          );
                          return;
                        }

                        await fetchStaff();
                        setShowAddStaffModal(false);
                        setShowAddTeamModal(false);
                        setNewStaffForm({
                          name: '',
                          email: '',
                          password: '',
                          phone: '',
                          role: 'Packing & Kitchen Staff',
                          orderScope: 'CONFIRMED_ONLY',
                          allowedOrderStatuses: ['CONFIRMED', 'PROCESSING'],
                          modules: ['orders'],
                          canAcceptOrders: false,
                          canPackOrders: true,
                          canDispatchOrders: true,
                          canCancelOrders: false,
                          canViewRevenue: false
                        });
                        setActionSuccessToast(`Staff member ${newStaffForm.name.trim()} created.`);
                        setTimeout(() => setActionSuccessToast(''), 4000);
                      }}
                      className="space-y-3.5 text-xs"
                    >
                      {/* Quick Role Preset Pills */}
                      <div className="space-y-1.5">
                        <label className="text-slate-700 font-bold block">Quick Role Presets</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewStaffForm({
                              ...newStaffForm,
                              role: 'Packing & Kitchen Staff',
                              orderScope: 'CONFIRMED_ONLY',
                              allowedOrderStatuses: ['CONFIRMED', 'PROCESSING'],
                              modules: ['orders'],
                              canAcceptOrders: false,
                              canPackOrders: true,
                              canDispatchOrders: true,
                              canCancelOrders: false,
                              canViewRevenue: false
                            })}
                            className={`p-2 rounded-xl border text-left cursor-pointer transition ${
                              newStaffForm.orderScope === 'CONFIRMED_ONLY'
                                ? 'bg-purple-50 border-purple-300 font-bold text-purple-900'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="font-extrabold">🎯 Packing Staff</div>
                            <div className="text-[10px] text-slate-500">Only confirmed orders visible</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNewStaffForm({
                              ...newStaffForm,
                              role: 'Calling & Verification Desk',
                              orderScope: 'PENDING_ONLY',
                              allowedOrderStatuses: ['NEW'],
                              modules: ['orders', 'leads', 'customers'],
                              canAcceptOrders: true,
                              canPackOrders: false,
                              canDispatchOrders: false,
                              canCancelOrders: true,
                              canViewRevenue: false
                            })}
                            className={`p-2 rounded-xl border text-left cursor-pointer transition ${
                              newStaffForm.orderScope === 'PENDING_ONLY'
                                ? 'bg-blue-50 border-blue-300 font-bold text-blue-900'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="font-extrabold">⏳ Calling Desk</div>
                            <div className="text-[10px] text-slate-500">Only pending orders visible</div>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Full Name</label>
                          <input
                            type="text"
                            required
                            value={newStaffForm.name}
                            onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                            placeholder="e.g. Ramesh Chandra"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Email Address</label>
                          <input
                            type="email"
                            required
                            value={newStaffForm.email}
                            onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                            placeholder="e.g. staff@yourbusiness.example"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Phone Number</label>
                          <input
                            type="tel"
                            value={newStaffForm.phone}
                            onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                            placeholder="e.g. +91 98290 11223"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Role Title</label>
                          <input
                            type="text"
                            value={newStaffForm.role}
                            onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                            placeholder="e.g. Kitchen Packer"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                          />
                        </div>
                      </div>

                      {/* Order Visibility Choice */}
                      <div>
                        <label className="text-slate-700 font-bold block mb-1">
                          Order Visibility Scope
                        </label>
                        <select
                          value={newStaffForm.orderScope}
                          onChange={(e) => {
                            const val = e.target.value;
                            let statuses = ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
                            if (val === 'CONFIRMED_ONLY') statuses = ['CONFIRMED', 'PROCESSING'];
                            if (val === 'PENDING_ONLY') statuses = ['NEW'];
                            if (val === 'DISPATCH_ONLY') statuses = ['SHIPPED', 'DELIVERED'];
                            setNewStaffForm({
                              ...newStaffForm,
                              orderScope: val,
                              allowedOrderStatuses: statuses
                            });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                        >
                          <option value="CONFIRMED_ONLY">🎯 Confirmed Only &amp; Processing Orders (Packing Desk)</option>
                          <option value="PENDING_ONLY">⏳ New &amp; Pending Orders Only (Call Desk)</option>
                          <option value="DISPATCH_ONLY">🚚 Dispatched Orders Only (Courier)</option>
                          <option value="ALL">📦 All Orders (Full Access)</option>
                        </select>
                      </div>

                      {/* Action Rights Toggles */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-[11px] text-slate-700">
                          <input
                            type="checkbox"
                            checked={newStaffForm.canAcceptOrders}
                            onChange={(e) => setNewStaffForm({ ...newStaffForm, canAcceptOrders: e.target.checked })}
                            className="rounded text-indigo-600"
                          />
                          <span>Can Accept Orders</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-[11px] text-slate-700">
                          <input
                            type="checkbox"
                            checked={newStaffForm.canPackOrders}
                            onChange={(e) => setNewStaffForm({ ...newStaffForm, canPackOrders: e.target.checked })}
                            className="rounded text-indigo-600"
                          />
                          <span>Can Pack Orders</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-[11px] text-slate-700">
                          <input
                            type="checkbox"
                            checked={newStaffForm.canDispatchOrders}
                            onChange={(e) => setNewStaffForm({ ...newStaffForm, canDispatchOrders: e.target.checked })}
                            className="rounded text-indigo-600"
                          />
                          <span>Can Dispatch Courier</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-[11px] text-slate-700">
                          <input
                            type="checkbox"
                            checked={newStaffForm.canViewRevenue}
                            onChange={(e) => setNewStaffForm({ ...newStaffForm, canViewRevenue: e.target.checked })}
                            className="rounded text-indigo-600"
                          />
                          <span>Can View Revenue</span>
                        </label>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddStaffModal(false);
                            setShowAddTeamModal(false);
                          }}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer shadow-sm shadow-indigo-500/10"
                        >
                          + Add Staff Account
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 1. Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add New Product to Catalog</h3>
                <p className="text-xs text-slate-400">Instantly publishes to merchant storefront</p>
              </div>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-800 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Product name and pack size"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">SKU Code</label>
                  <input
                    type="text"
                    placeholder="e.g. ACH-GAR-500"
                    value={newProductForm.sku}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold block">Category *</label>
                    <button
                      type="button"
                      onClick={() => setShowCustomCatInput(!showCustomCatInput)}
                      className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      {showCustomCatInput ? '← Select existing' : '+ Add new category'}
                    </button>
                  </div>
                  {showCustomCatInput ? (
                    <input
                      type="text"
                      placeholder="Type a new category name"
                      value={newProductForm.newCatInput || ''}
                      onChange={(e) => setNewProductForm({ ...newProductForm, newCatInput: e.target.value })}
                      className="w-full bg-slate-50 border border-indigo-400 ring-1 ring-indigo-200 rounded-xl p-2.5 text-slate-900 font-semibold"
                      autoFocus
                    />
                  ) : (
                    <select
                      value={newProductForm.cat}
                      onChange={(e) => setNewProductForm({ ...newProductForm, cat: e.target.value, newCatInput: '' })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold"
                    >
                      {categoriesList.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="299"
                    value={newProductForm.price}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewProductForm(prev => {
                        const num = parseFloat(val);
                        const updatedJars = num > 0 ? (prev.jars || []).map(j => {
                          if (j.id === 'j500') return { ...j, price: num };
                          return j;
                        }) : prev.jars;
                        return { ...prev, price: val, jars: updatedJars };
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Original MRP (₹)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="399"
                    value={newProductForm.compareAtPrice || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, compareAtPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Stock (Units) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="50"
                    value={newProductForm.stock}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Dynamic Discount Indicator */}
              {(() => {
                const sp = parseFloat(newProductForm.price) || 0;
                const mrp = parseFloat(newProductForm.compareAtPrice) || 0;
                const pct = mrp > sp && mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : null;
                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏷️</span>
                      <div>
                        <span className="font-bold text-emerald-950">
                          {pct ? `${pct}% Customer Discount Active` : 'Selling at Normal Price'}
                        </span>
                        {pct && (
                          <span className="text-emerald-700 text-[11px] block">
                            Customer saves ₹{mrp - sp} per unit!
                          </span>
                        )}
                      </div>
                    </div>
                    {pct && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[11px]">
                        {pct}% OFF BADGE
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Variant & Option Manager */}
              <div className="space-y-2.5 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-slate-800 font-bold block text-xs flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Available Variants &amp; Custom Pricing</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Select which variants are available and adjust price/stock for each.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {newProductForm.jars?.filter(j => j.enabled).length || 0} Variants Active
                  </span>
                </div>

                <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
                  {newProductForm.jars?.map((jar, jIdx) => (
                    <div
                      key={jar.id || jIdx}
                      className={`p-2.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        jar.enabled
                          ? 'bg-white border-indigo-200 shadow-xs'
                          : 'bg-slate-100/70 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={`jar-add-${jIdx}`}
                          checked={!!jar.enabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setNewProductForm(prev => ({
                              ...prev,
                              jars: prev.jars.map((j, idx) => idx === jIdx ? { ...j, enabled: checked } : j)
                            }));
                          }}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        />
                        <label htmlFor={`jar-add-${jIdx}`} className="font-bold text-slate-800 text-xs cursor-pointer flex items-center gap-1.5">
                          <span>{jar.name}</span>
                        </label>
                      </div>

                      {jar.enabled && (
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-semibold text-slate-500">₹</span>
                            <input
                              type="number"
                              min="1"
                              placeholder="Price"
                              value={jar.price}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setNewProductForm(prev => ({
                                  ...prev,
                                  jars: prev.jars.map((j, idx) => idx === jIdx ? { ...j, price: val } : j)
                                }));
                              }}
                              className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-bold text-xs"
                              title="Variant price in ₹"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold text-slate-400">Qty:</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="Stock"
                              value={jar.stock}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setNewProductForm(prev => ({
                                  ...prev,
                                  jars: prev.jars.map((j, idx) => idx === jIdx ? { ...j, stock: val } : j)
                                }));
                              }}
                              className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-semibold text-xs"
                              title="Variant stock units"
                            />
                          </div>

                          {jar.isCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewProductForm(prev => ({
                                  ...prev,
                                  jars: prev.jars.filter((_, idx) => idx !== jIdx)
                                }));
                              }}
                              className="text-rose-500 hover:text-rose-700 p-1 text-xs cursor-pointer font-bold"
                              title="Remove custom variant"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Custom Variant Sub-Form */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                      <span>+ Add Custom Variant:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Large / 750g / Red"
                        value={newJarName}
                        onChange={(e) => setNewJarName(e.target.value)}
                        className="flex-1 min-w-[130px] bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                      />
                      <input
                        type="number"
                        placeholder="₹ Price"
                        value={newJarPrice}
                        onChange={(e) => setNewJarPrice(e.target.value)}
                        className="w-20 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-bold"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={newJarStock}
                        onChange={(e) => setNewJarStock(e.target.value)}
                        className="w-16 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newJarName.trim()) {
                            alert('Please enter a variant name (e.g. Large / 750g).');
                            return;
                          }
                          const variantPrice = Number(newJarPrice);
                          if (!Number.isFinite(variantPrice) || variantPrice <= 0) {
                            alert('Enter a real variant price greater than zero.');
                            return;
                          }
                          const variantStock = Number.parseInt(newJarStock, 10);
                          if (!Number.isFinite(variantStock) || variantStock < 0) {
                            alert('Enter the real variant stock quantity (zero or more).');
                            return;
                          }
                          const newJarObj = {
                            id: `custom-${Date.now()}`,
                            name: newJarName.trim(),
                            price: variantPrice,
                            stock: variantStock,
                            enabled: true,
                            isCustom: true
                          };
                          setNewProductForm(prev => ({
                            ...prev,
                            jars: [...(prev.jars || []), newJarObj]
                          }));
                          setNewJarName('');
                          setNewJarPrice('');
                          setNewJarStock('');
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 cursor-pointer"
                      >
                        + Add Variant
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Photo Selection */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold block">Product Photo</label>
                  {newProductForm.img && (
                    <button
                      type="button"
                      onClick={() => setNewProductForm({ ...newProductForm, img: '' })}
                      className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      ✕ Remove photo
                    </button>
                  )}
                </div>

                {/* 1. Choose from Device Gallery */}
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-600 font-bold text-xs cursor-pointer transition">
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>📁 Choose from Phone / Computer Gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProductImageUpload}
                  />
                </label>

                {/* Optional Web Link Input */}
                <div>
                  <input
                    type="text"
                    placeholder="Or paste image URL (optional)"
                    value={newProductForm.img}
                    onChange={(e) => setNewProductForm({ ...newProductForm, img: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono text-[11px]"
                  />
                </div>

                {/* Live Preview Display */}
                {newProductForm.img ? (
                  <div className="flex items-center gap-3 p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <img src={newProductForm.img} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-emerald-300 shadow-xs shrink-0" />
                    <div className="text-[11px] text-slate-700">
                      <strong className="text-emerald-800 font-bold block flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Photo Selected Ready
                      </strong>
                      This photo will appear on customer storefront cards &amp; invoices.
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                    No photo selected yet. Upload a real product image.
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Publish Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1B. Edit Product Modal */}
      {showEditProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <span>✏️ Edit Product: {editingProduct.name}</span>
                </h3>
                <p className="text-xs text-slate-400">Update pricing, inventory stock, photo, and details</p>
              </div>
              <button onClick={() => setShowEditProductModal(false)} className="text-slate-400 hover:text-slate-800 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Product name and variant"
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">SKU Code</label>
                  <input
                    type="text"
                    placeholder="e.g. ACH-MG-500"
                    value={editProductForm.sku}
                    onChange={(e) => setEditProductForm({ ...editProductForm, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold block">Category *</label>
                    <button
                      type="button"
                      onClick={() => setShowEditCustomCatInput(!showEditCustomCatInput)}
                      className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      {showEditCustomCatInput ? '← Select' : '+ New Category'}
                    </button>
                  </div>
                  {showEditCustomCatInput ? (
                    <input
                      type="text"
                      placeholder="Type category name"
                      value={editProductForm.newCatInput || ''}
                      onChange={(e) => setEditProductForm({ ...editProductForm, newCatInput: e.target.value })}
                      className="w-full bg-slate-50 border border-indigo-400 ring-1 ring-indigo-200 rounded-xl p-2.5 text-slate-900 font-semibold"
                      autoFocus
                    />
                  ) : (
                    <select
                      value={editProductForm.cat}
                      onChange={(e) => setEditProductForm({ ...editProductForm, cat: e.target.value, newCatInput: '' })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold cursor-pointer"
                    >
                      {categoriesList.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="299"
                    value={editProductForm.price}
                    onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-black text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Original MRP (₹)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="399"
                    value={editProductForm.compareAtPrice || ''}
                    onChange={(e) => setEditProductForm({ ...editProductForm, compareAtPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-black text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">In-Stock (Units) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="50"
                    value={editProductForm.stock}
                    onChange={(e) => setEditProductForm({ ...editProductForm, stock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-black text-sm"
                  />
                </div>
              </div>

              {/* Dynamic Discount Indicator */}
              {(() => {
                const sp = parseFloat(editProductForm.price) || 0;
                const mrp = parseFloat(editProductForm.compareAtPrice) || 0;
                const pct = mrp > sp && mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : null;
                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏷️</span>
                      <div>
                        <span className="font-bold text-emerald-950">
                          {pct ? `${pct}% Customer Discount Active` : 'Selling at Normal Price'}
                        </span>
                        {pct && (
                          <span className="text-emerald-700 text-[11px] block">
                            Customer saves ₹{mrp - sp} per unit on this product!
                          </span>
                        )}
                      </div>
                    </div>
                    {pct && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[11px]">
                        {pct}% OFF BADGE
                      </span>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Stock Status</label>
                  <select
                    value={editProductForm.status}
                    onChange={(e) => setEditProductForm({ ...editProductForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold cursor-pointer"
                  >
                    <option value="In stock">In stock</option>
                    <option value="Low stock">Low stock</option>
                    <option value="Out of stock">Out of stock</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Storefront Visibility</label>
                  <select
                    value={editProductForm.vis}
                    onChange={(e) => setEditProductForm({ ...editProductForm, vis: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold cursor-pointer"
                  >
                    <option value="Published">Published (Live on Store)</option>
                    <option value="Hidden">Hidden (Draft)</option>
                  </select>
                </div>
              </div>

              {/* Variant & Option Manager */}
              <div className="space-y-2.5 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-slate-800 font-bold block text-xs flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Available Variants &amp; Custom Pricing</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Customize which variants are available in store and set custom rates &amp; stock.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {editProductForm.jars?.filter(j => j.enabled).length || 0} Variants Active
                  </span>
                </div>

                <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
                  {editProductForm.jars?.map((jar, jIdx) => (
                    <div
                      key={jar.id || jIdx}
                      className={`p-2.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        jar.enabled
                          ? 'bg-white border-indigo-200 shadow-xs'
                          : 'bg-slate-100/70 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={`jar-edit-${jIdx}`}
                          checked={!!jar.enabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEditProductForm(prev => ({
                              ...prev,
                              jars: prev.jars.map((j, idx) => idx === jIdx ? { ...j, enabled: checked } : j)
                            }));
                          }}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        />
                        <label htmlFor={`jar-edit-${jIdx}`} className="font-bold text-slate-800 text-xs cursor-pointer flex items-center gap-1.5">
                          <span>{jar.name}</span>
                        </label>
                      </div>

                      {jar.enabled && (
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-semibold text-slate-500">₹</span>
                            <input
                              type="number"
                              min="1"
                              placeholder="Price"
                              value={jar.price}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setEditProductForm(prev => ({
                                  ...prev,
                                  jars: prev.jars.map((j, idx) => idx === jIdx ? { ...j, price: val } : j)
                                }));
                              }}
                              className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-bold text-xs"
                              title="Variant price in ₹"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold text-slate-400">Qty:</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="Stock"
                              value={jar.stock}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setEditProductForm(prev => ({
                                  ...prev,
                                  jars: prev.jars.map((j, idx) => idx === jIdx ? { ...j, stock: val } : j)
                                }));
                              }}
                              className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-semibold text-xs"
                              title="Variant stock units"
                            />
                          </div>

                          {jar.isCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditProductForm(prev => ({
                                  ...prev,
                                  jars: prev.jars.filter((_, idx) => idx !== jIdx)
                                }));
                              }}
                              className="text-rose-500 hover:text-rose-700 p-1 text-xs cursor-pointer font-bold"
                              title="Remove custom variant"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Custom Variant Sub-Form */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                      <span>+ Add Custom Variant:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Large / 750g / Red"
                        value={editNewJarName}
                        onChange={(e) => setEditNewJarName(e.target.value)}
                        className="flex-1 min-w-[130px] bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                      />
                      <input
                        type="number"
                        placeholder="₹ Price"
                        value={editNewJarPrice}
                        onChange={(e) => setEditNewJarPrice(e.target.value)}
                        className="w-20 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-bold"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={editNewJarStock}
                        onChange={(e) => setEditNewJarStock(e.target.value)}
                        className="w-16 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!editNewJarName.trim()) {
                            alert('Please enter a variant name (e.g. Large / 750g).');
                            return;
                          }
                          const variantPrice = Number(editNewJarPrice);
                          if (!Number.isFinite(variantPrice) || variantPrice <= 0) {
                            alert('Enter a real variant price greater than zero.');
                            return;
                          }
                          const variantStock = Number.parseInt(editNewJarStock, 10);
                          if (!Number.isFinite(variantStock) || variantStock < 0) {
                            alert('Enter the real variant stock quantity (zero or more).');
                            return;
                          }
                          const newJarObj = {
                            id: `custom-${Date.now()}`,
                            name: editNewJarName.trim(),
                            price: variantPrice,
                            stock: variantStock,
                            enabled: true,
                            isCustom: true
                          };
                          setEditProductForm(prev => ({
                            ...prev,
                            jars: [...(prev.jars || []), newJarObj]
                          }));
                          setEditNewJarName('');
                          setEditNewJarPrice('');
                          setEditNewJarStock('');
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 cursor-pointer"
                      >
                        + Add Variant
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Photo Selection */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold block">Product Photo</label>
                  {editProductForm.img && (
                    <button
                      type="button"
                      onClick={() => setEditProductForm({ ...editProductForm, img: '' })}
                      className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      ✕ Remove photo
                    </button>
                  )}
                </div>

                {/* 1. Device Gallery Upload */}
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-600 font-bold text-xs cursor-pointer transition">
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>📁 Choose from Phone / Computer Gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleEditProductImageUpload}
                  />
                </label>

                {/* Web Link Input */}
                <div>
                  <input
                    type="text"
                    placeholder="Or paste image URL (optional)"
                    value={editProductForm.img}
                    onChange={(e) => setEditProductForm({ ...editProductForm, img: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono text-[11px]"
                  />
                </div>

                {/* Live Preview */}
                {editProductForm.img ? (
                  <div className="flex items-center gap-3 p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <img src={editProductForm.img} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-emerald-300 shadow-xs shrink-0" />
                    <div className="text-[11px] text-slate-700">
                      <strong className="text-emerald-800 font-bold block flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Photo Updated
                      </strong>
                      Will appear immediately on customer storefront and invoices.
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                    No photo selected
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(editingProduct)}
                  className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold cursor-pointer text-xs flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Product</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditProductModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer shadow-md text-xs transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showAddCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-indigo-600" />
                  <span>Create New Storefront Coupon</span>
                </h3>
                <p className="text-xs text-slate-400">Add a promotional discount code for customers to use at checkout</p>
              </div>
              <button onClick={() => setShowAddCouponModal(false)} className="text-slate-400 hover:text-slate-800 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FESTIVE20"
                    value={newCouponForm.code}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-black text-sm uppercase tracking-wider"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Discount Type *</label>
                  <select
                    value={newCouponForm.discountType}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, discountType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold cursor-pointer"
                  >
                    <option value="PERCENTAGE">Percentage (% OFF)</option>
                    <option value="FLAT">Flat Cash (₹ OFF)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Offer Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festive Special 20% OFF"
                  value={newCouponForm.title}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    {newCouponForm.discountType === 'PERCENTAGE' ? 'Discount (%) *' : 'Discount (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={newCouponForm.discountType === 'PERCENTAGE' ? 90 : 5000}
                    placeholder={newCouponForm.discountType === 'PERCENTAGE' ? '20' : '100'}
                    value={newCouponForm.discountValue}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, discountValue: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-black text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Min. Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="399"
                    value={newCouponForm.minOrderValue}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, minOrderValue: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-black text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="150"
                    value={newCouponForm.maxDiscount}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, maxDiscount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-black text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Description / Conditions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Valid on all products above ₹399."
                  value={newCouponForm.description}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="coupon-active-toggle"
                  checked={newCouponForm.isActive}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="coupon-active-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Activate immediately on storefront (Customers can apply right away)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCouponModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 text-xs shadow-md transition cursor-pointer"
                >
                  Create &amp; Publish Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Storewide Bulk Product Discount Modal */}
      {showBulkDiscountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Percent className="w-5 h-5 text-amber-500" />
                  <span>Storewide Discount Tool</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Review and overwrite selling prices for all products or one category
                </p>
              </div>
              <button onClick={() => setShowBulkDiscountModal(false)} className="text-slate-400 hover:text-slate-800 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleApplyBulkDiscount} className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1.5 text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <span>⚠️</span> Destructive price update
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  This uses each product’s compare-at price when one is set, otherwise its current selling price, and overwrites the selling price immediately. It also enables crossed-out compare-at pricing on product cards. This is not a reversible coupon.
                </p>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Discount Percentage (% OFF) *</label>
                <div className="flex gap-2">
                  {[10, 15, 20, 25, 30].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setBulkDiscountForm({ ...bulkDiscountForm, discountPercent: pct })}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                        Number(bulkDiscountForm.discountPercent) === pct
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    placeholder="Custom % (e.g. 18)"
                    value={bulkDiscountForm.discountPercent}
                    onChange={(e) => setBulkDiscountForm({ ...bulkDiscountForm, discountPercent: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-black text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Target Products Scope</label>
                <select
                  value={bulkDiscountForm.categoryName}
                  onChange={(e) => setBulkDiscountForm({ ...bulkDiscountForm, categoryName: e.target.value, scope: e.target.value === 'ALL' ? 'ALL' : 'CATEGORY' })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold cursor-pointer"
                >
                  <option value="ALL">All Products ({productsList.length} in catalog)</option>
                  {categoriesList.map(c => (
                    <option key={c.id || c.name} value={c.name}>Only "{c.name}" Category</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkDiscountModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-500 text-xs shadow-md transition cursor-pointer"
                >
                  Apply {bulkDiscountForm.discountPercent}% to Prices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add New Product Category</h3>
                <p className="text-xs text-slate-400">Creates a showcase section on the storefront</p>
              </div>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-slate-400 hover:text-slate-800 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Product category"
                  value={newCategoryForm.name}
                  onChange={(e) => setNewCategoryForm({
                    ...newCategoryForm,
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">URL Slug</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-mono text-xs">
                  <span>/store/{businessSlug}/category/</span>
                  <input
                    type="text"
                    value={newCategoryForm.slug}
                    onChange={(e) => setNewCategoryForm({ ...newCategoryForm, slug: e.target.value })}
                    placeholder="category-slug"
                    className="bg-transparent text-slate-900 font-bold focus:outline-none flex-1 ml-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Category Description</label>
                <textarea
                  rows={2}
                  value={newCategoryForm.description}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, description: e.target.value })}
                  placeholder="Describe this category for customers"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              {/* Category Photo Selection */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold block">Category Photo</label>
                  {newCategoryForm.image && (
                    <button
                      type="button"
                      onClick={() => setNewCategoryForm({ ...newCategoryForm, image: '' })}
                      className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      ✕ Remove photo
                    </button>
                  )}
                </div>

                {/* 1. Choose from Device Gallery */}
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-600 font-bold text-xs cursor-pointer transition">
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>📁 Choose Category Image from Gallery / Phone / PC</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCategoryImageUpload}
                  />
                </label>

                {/* Optional Image URL Input */}
                <input
                  type="text"
                  placeholder="Or paste image URL (optional)"
                  value={newCategoryForm.image}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, image: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono text-[11px]"
                />

                {/* Live Preview Display */}
                {newCategoryForm.image ? (
                  <div className="relative h-28 rounded-xl overflow-hidden border border-emerald-300 shadow-xs">
                    <img src={newCategoryForm.image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-emerald-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-300" /> Category Photo Selected
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                    No image selected yet. Upload a real category image.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Tour Booking Modal */}
      {showAddTourModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">New Travel Booking Request</h3>
                <p className="text-xs text-slate-400">Record customer tour reservations & packages</p>
              </div>
              <button onClick={() => setShowAddTourModal(false)} className="text-slate-400 hover:text-slate-800 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveTourBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Rathore"
                    value={addTourForm.customer}
                    onChange={(e) => setAddTourForm({ ...addTourForm, customer: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Package Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter the published package name"
                    value={addTourForm.pkg}
                    onChange={(e) => setAddTourForm({ ...addTourForm, pkg: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Passengers</label>
                  <select
                    value={addTourForm.pass}
                    onChange={(e) => setAddTourForm({ ...addTourForm, pass: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="1 passenger">1 passenger</option>
                    <option value="2 passengers">2 passengers</option>
                    <option value="3 passengers">3 passengers</option>
                    <option value="4 passengers">4 passengers</option>
                    <option value="5+ passengers">5+ passengers</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Travel Date</label>
                  <input
                    type="date"
                    value={addTourForm.date}
                    onChange={(e) => setAddTourForm({ ...addTourForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Destination / Base</label>
                  <input
                    type="text"
                    placeholder="e.g. Pickup city or starting point"
                    value={addTourForm.loc}
                    onChange={(e) => setAddTourForm({ ...addTourForm, loc: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTourModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4.5 Add Customer Profile Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add New Customer</h3>
                <p className="text-xs text-slate-400">Add a customer contact to your CRM directory</p>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-800 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Mobile / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={newCustomerForm.mobile}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Delivery Address</label>
                <textarea
                  rows={2}
                  placeholder="House / Street, City, State, Pincode"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4.6 Add Service / Studio Booking Modal */}
      {showAddServiceBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">New Service &amp; Studio Booking</h3>
                <p className="text-xs text-slate-400">Schedule photoshoots, video coverage, wedding shoots &amp; appointments</p>
              </div>
              <button
                onClick={() => setShowAddServiceBookingModal(false)}
                className="text-slate-400 hover:text-slate-800 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveServiceBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pooja Agarwal"
                    value={newServiceForm.client}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, client: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Client WhatsApp / Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98291 55667"
                    value={newServiceForm.phone}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Service / Session Type *</label>
                  <select
                    value={newServiceForm.service}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, service: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-indigo-500"
                  >
                    <option value="Photo session">Photo session (Studio / Outdoor)</option>
                    <option value="Wedding shoot">Wedding shoot &amp; Pre-wedding</option>
                    <option value="Video booking">Video booking &amp; Reels</option>
                    <option value="Product shoot">Product &amp; Commercial shoot</option>
                    <option value="Event coverage">Event coverage &amp; Functions</option>
                    <option value="Client Consultation">Consultation &amp; Styling</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={newServiceForm.date}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Time Slot</label>
                  <select
                    value={newServiceForm.time}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-indigo-500"
                  >
                    <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                    <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                    <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                    <option value="04:00 PM - 07:00 PM">04:00 PM - 07:00 PM</option>
                    <option value="Full Day (09:00 AM - 08:00 PM)">Full Day (09 AM - 08 PM)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Total Fee (₹)</label>
                  <input
                    type="number"
                    value={newServiceForm.price}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Advance (₹)</label>
                  <input
                    type="number"
                    value={newServiceForm.advancePaid}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, advancePaid: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Initial Status</label>
                <select
                  value={newServiceForm.status}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-indigo-500"
                >
                  <option value="Confirmed">Confirmed (Slot Blocked)</option>
                  <option value="Pending Quotation">Pending Quotation / Inquiry</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddServiceBookingModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Confirm &amp; Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4.7 Studio Availability Settings Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <span>Studio Availability Settings</span>
                </h3>
                <p className="text-xs text-slate-400">Set open days, operating hours, slot lengths &amp; auto-booking policies</p>
              </div>
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="text-slate-400 hover:text-slate-800 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-2">Available Working Days:</label>
                <div className="flex flex-wrap gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                    const isChecked = availabilityConfig.workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const updated = isChecked
                            ? availabilityConfig.workingDays.filter(d => d !== day)
                            : [...availabilityConfig.workingDays, day];
                          setAvailabilityConfig({ ...availabilityConfig, workingDays: updated });
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold border transition cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Opening Time</label>
                  <select
                    value={availabilityConfig.startTime}
                    onChange={(e) => setAvailabilityConfig({ ...availabilityConfig, startTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="08:00 AM">08:00 AM</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Closing Time</label>
                  <select
                    value={availabilityConfig.endTime}
                    onChange={(e) => setAvailabilityConfig({ ...availabilityConfig, endTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="07:00 PM">07:00 PM</option>
                    <option value="08:00 PM">08:00 PM</option>
                    <option value="09:00 PM">09:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Default Slot Duration</label>
                  <select
                    value={availabilityConfig.slotDuration}
                    onChange={(e) => setAvailabilityConfig({ ...availabilityConfig, slotDuration: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="30 Mins">30 Mins</option>
                    <option value="1 Hour">1 Hour</option>
                    <option value="2 Hours">2 Hours</option>
                    <option value="4 Hours">4 Hours (Half Day)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Buffer Between Sessions</label>
                  <select
                    value={availabilityConfig.bufferTime}
                    onChange={(e) => setAvailabilityConfig({ ...availabilityConfig, bufferTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="0 Mins">0 Mins</option>
                    <option value="15 Mins">15 Mins</option>
                    <option value="30 Mins">30 Mins</option>
                    <option value="1 Hour">1 Hour</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Instant Online Confirmation</div>
                  <div className="text-[11px] text-slate-500">Auto-accept appointments without manual quotation review</div>
                </div>
                <input
                  type="checkbox"
                  checked={availabilityConfig.autoAccept}
                  onChange={(e) => setAvailabilityConfig({ ...availabilityConfig, autoAccept: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAvailabilityModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAvailabilityModal(false);
                    setActionSuccessToast('Availability updated for this browser session only. Server-side availability persistence is not configured yet.');
                    setTimeout(() => setActionSuccessToast(''), 4500);
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Save Availability
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4.8 Service Booking Detail & Action Modal */}
      {selectedServiceBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  {selectedServiceBooking.id}
                </span>
                <h3 className="font-black text-slate-900 text-lg mt-1">{selectedServiceBooking.service}</h3>
                <p className="text-xs text-slate-500">{selectedServiceBooking.client} · {selectedServiceBooking.date}</p>
              </div>
              <button
                onClick={() => setSelectedServiceBooking(null)}
                className="text-slate-400 hover:text-slate-800 text-lg p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Client Name</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedServiceBooking.client}</div>
                  <div className="text-slate-600 mt-1">{selectedServiceBooking.phone}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Slot &amp; Timing</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedServiceBooking.date}</div>
                  <div className="text-indigo-600 font-semibold mt-1">{selectedServiceBooking.time}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Package Fee</div>
                  <div className="font-black text-slate-900 text-base mt-0.5">₹{selectedServiceBooking.price.toLocaleString('en-IN')}</div>
                  <div className="text-emerald-600 font-bold text-[11px] mt-0.5">{selectedServiceBooking.payStatus}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Booking Status</div>
                  <div className="mt-1">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${selectedServiceBooking.statusColor}`}>
                      {selectedServiceBooking.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Action Link */}
              <a
                href={`https://wa.me/${selectedServiceBooking.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${selectedServiceBooking.client}! This is regarding your upcoming ${selectedServiceBooking.service} booking scheduled for ${selectedServiceBooking.date} (${selectedServiceBooking.time}).`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition text-xs"
              >
                <span>💬 Chat on WhatsApp with {selectedServiceBooking.client}</span>
              </a>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateServiceBookingStatus(selectedServiceBooking.id, 'Cancelled');
                    setSelectedServiceBooking(null);
                  }}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel Booking
                </button>

                <div className="flex items-center gap-2">
                  {selectedServiceBooking.status !== 'Confirmed' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateServiceBookingStatus(selectedServiceBooking.id, 'Confirmed')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                    >
                      Confirm Slot
                    </button>
                  )}
                  {selectedServiceBooking.status !== 'Completed' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateServiceBookingStatus(selectedServiceBooking.id, 'Completed')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                    >
                      Mark Completed
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedServiceBooking(null)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Interactive Date Range Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-indigo-600" />
                  <span>Interactive Date Range Calendar</span>
                </h3>
                <p className="text-xs text-slate-400">Select any Start Date &amp; End Date to auto-arrange all analytics, daily trend bars, and orders</p>
              </div>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="text-slate-400 hover:text-slate-800 text-lg p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Interactive Calendar Instruction Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-950 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span>Click any day to select <strong>Start Date</strong>, then click another day for <strong>End Date</strong></span>
              </div>
              <div className="font-bold text-xs bg-white text-indigo-900 px-3 py-1 rounded-xl border border-indigo-200 shadow-2xs">
                {selectedRangeStart} &rarr; {selectedRangeEnd}
              </div>
            </div>

            {/* Calendar Controls (Month Switcher) */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-base">
                    {new Date(calPickerYear, calPickerMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    ({ordersList.filter(o => o.date.startsWith(`${calPickerYear}-${String(calPickerMonth + 1).padStart(2, '0')}`)).length} Orders recorded)
                  </span>
                </div>
                <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-0.5 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => {
                      if (calPickerMonth === 0) {
                        setCalPickerMonth(11);
                        setCalPickerYear(prev => prev - 1);
                      } else {
                        setCalPickerMonth(prev => prev - 1);
                      }
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-white rounded-lg transition cursor-pointer"
                  >
                    &larr; Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalPickerYear(2026);
                      setCalPickerMonth(9);
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-slate-800 hover:bg-white rounded-lg transition cursor-pointer"
                  >
                    Current (Oct 2026)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (calPickerMonth === 11) {
                        setCalPickerMonth(0);
                        setCalPickerYear(prev => prev + 1);
                      } else {
                        setCalPickerMonth(prev => prev + 1);
                      }
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-white rounded-lg transition cursor-pointer"
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 pb-1">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-1 text-xs">
                {getCalendarDays(calPickerYear, calPickerMonth).map((cell, idx) => {
                  if (!cell.isCurrentMonth) {
                    return (
                      <div key={idx} className="h-10 flex items-center justify-center text-slate-300 text-xs select-none">
                        {cell.day}
                      </div>
                    );
                  }

                  const isStart = cell.dateStr === selectedRangeStart;
                  const isEnd = cell.dateStr === selectedRangeEnd;
                  const inRange = selectedRangeStart && selectedRangeEnd && cell.dateStr >= selectedRangeStart && cell.dateStr <= selectedRangeEnd;
                  const hasOrders = ordersList.some(o => o.date === cell.dateStr);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCalendarDayClick(cell.dateStr)}
                      className={`h-11 rounded-xl flex flex-col items-center justify-center transition cursor-pointer relative font-semibold ${
                        isStart || isEnd
                          ? 'bg-indigo-600 text-white font-extrabold shadow-sm shadow-indigo-500/10 z-10'
                          : inRange
                          ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-100'
                      }`}
                    >
                      <span>{cell.day}</span>
                      {hasOrders && (
                        <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isStart || isEnd ? 'bg-amber-300' : 'bg-indigo-600'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selection Summary Footer & Auto-Arrange Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs">
                <span className="text-slate-400 font-medium">Selected Window: </span>
                <strong className="text-slate-900 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
                  {selectedRangeStart} &rarr; {selectedRangeEnd}
                </strong>
                <span className="text-slate-500 ml-2 font-medium">
                  ({Math.max(1, Math.round((new Date(selectedRangeEnd) - new Date(selectedRangeStart)) / (1000 * 60 * 60 * 24)) + 1)} Days Window)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCalendarRange}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Auto-Arrange &amp; Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default MerchantDashboard;
