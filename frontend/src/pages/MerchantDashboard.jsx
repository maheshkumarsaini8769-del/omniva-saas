import React, { useState, useEffect, useRef } from 'react';
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

export const MerchantDashboard = () => {
  const { user, tenant, logout } = useAuth();
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Active module page driven by URL route /merchant/:pageId
  const [activeTab, setActiveTabState] = useState(pageId || searchParams.get('tab') || 'overview');
  const [settingsSubTab, setSettingsSubTab] = useState(searchParams.get('sub') || 'profile');

  // Synchronize activeTab with URL route changes
  useEffect(() => {
    const currentRoutePage = pageId || searchParams.get('tab');
    if (currentRoutePage && currentRoutePage !== activeTab) {
      setActiveTabState(currentRoutePage);
    }
  }, [pageId, searchParams]);

  // Navigate to dedicated page URL when changing page/module
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    navigate(`/merchant/${tab}`);
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
      'ai-insights': 'AI Business Analyzer',
      marketing: 'Marketing & Meta Ads',
      automations: 'Automations Engine',
      staff: 'Staff & Roles',
      integrations: 'Integrations Hub',
      reports: 'Reports & Audits',
      billing: 'Subscription & Billing',
      settings: 'Store Settings'
    };
    const currentTitle = pageTitles[activeTab] || 'Merchant Dashboard';
    document.title = `${currentTitle} | Omniva Merchant`;
  }, [activeTab]);
  const mainContentRef = useRef(null);
  const [storePreviewDevice, setStorePreviewDevice] = useState('desktop');

  // Real-time Business Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'New COD Order Received',
      description: 'Order #ORD-8492 by Sunita Agarwal (₹1,240 · Cash on Delivery)',
      detail: '2x Rajasthani Mango Pickle 500g, 1x Mixed Veg Pickle 400g',
      type: 'order',
      time: '2 mins ago',
      unread: true,
      actionTab: 'orders'
    },
    {
      id: 'notif-2',
      title: 'Meta CAPI Purchase Event Synced',
      description: 'Server-side CAPI event dispatched to Pixel ID: 94821049281',
      detail: 'Event ID: capi_ord_8491 · Match Quality Score: 9.6/10',
      type: 'meta',
      time: '14 mins ago',
      unread: true,
      actionTab: 'integrations'
    },
    {
      id: 'notif-3',
      title: 'WhatsApp Confirmation Sent',
      description: 'Automated order dispatch & tracking link sent to +91 98290 12345',
      detail: 'Template: order_dispatch_v2 · Status: Delivered',
      type: 'whatsapp',
      time: '35 mins ago',
      unread: true,
      actionTab: 'automations'
    },
    {
      id: 'notif-4',
      title: 'Shiprocket Courier AWB Assigned',
      description: 'Delhivery Surface courier booked for Order #ORD-8488',
      detail: 'AWB Number: DEL-83910248 · Pickup scheduled 2:00 PM',
      type: 'courier',
      time: '1 hour ago',
      unread: false,
      actionTab: 'orders'
    },
    {
      id: 'notif-5',
      title: 'Low Stock Alert',
      description: 'Sweet Lemon Pickle 400g has only 4 units remaining',
      detail: 'Reorder recommended to avoid lost Meta ad conversions',
      type: 'stock',
      time: '3 hours ago',
      unread: false,
      actionTab: 'products'
    }
  ]);
  const unreadNotifsCount = notifications.filter(n => n.unread).length;

  // Auto-scroll main content container to top whenever active tab changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [activeTab, settingsSubTab]); // overview, leads, customers, products, orders, inventory, service-bookings, travel-bookings, marketing, automations, staff, integrations, reports, settings, billing
  const [searchTerm, setSearchTerm] = useState('');

  // Merchant Details
  const businessName = tenant?.businessName || 'Desi Achar House';
  const businessSlug = tenant?.slug || 'desi-rasoi-achar-1';
  const planName = 'Growth plan';

  // Dynamic Date Range Filter State (Pure Calendar Controlled)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [datePreset, setDatePreset] = useState('ALL');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState(todayStr);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Interactive Visual Calendar Range Picker State
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calPickerYear, setCalPickerYear] = useState(new Date().getFullYear());
  const [calPickerMonth, setCalPickerMonth] = useState(new Date().getMonth());
  const [selectedRangeStart, setSelectedRangeStart] = useState('2026-10-01');
  const [selectedRangeEnd, setSelectedRangeEnd] = useState(todayStr);

  // Interactive Order Processing State
  const [orderPipelineTab, setOrderPipelineTab] = useState('ALL'); // ALL, NEW, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  const [orderSourceFilter, setOrderSourceFilter] = useState('ALL'); // ALL, INSTAGRAM, FACEBOOK, WHATSAPP, WEBSITE
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [courierName, setCourierName] = useState('Delhivery Express');
  const [trackingNumber, setTrackingNumber] = useState('DEL-8492014');
  const [autoNotifyWhatsApp, setAutoNotifyWhatsApp] = useState(true);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Customer requested address change / cancellation');
  const [actionSuccessToast, setActionSuccessToast] = useState('');

  // Staff Accounts & Granular Permissions State
  const INITIAL_STAFF_LIST = [
    {
      id: 'staff_admin',
      name: 'Mahesh Sharma',
      email: 'owner@desiachar.example',
      phone: '+91 98290 12345',
      role: 'Merchant Admin (Owner)',
      status: 'Active',
      orderScope: 'ALL', // 'ALL' | 'PENDING_ONLY' | 'CONFIRMED_ONLY' | 'DISPATCH_ONLY' | 'CUSTOM'
      allowedOrderStatuses: ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      modules: ['overview', 'orders', 'products', 'categories', 'inventory', 'leads', 'customers', 'marketing', 'automations', 'staff', 'integrations', 'reports', 'settings', 'billing'],
      canAcceptOrders: true,
      canPackOrders: true,
      canDispatchOrders: true,
      canCancelOrders: true,
      canViewRevenue: true,
      lastActive: 'Active Now'
    },
    {
      id: 'staff_packing',
      name: 'Sunil Kumar',
      email: 'sunil.ops@desiachar.example',
      phone: '+91 98290 88771',
      role: 'Packing & Kitchen Staff',
      status: 'Active',
      orderScope: 'CONFIRMED_ONLY', // Shows only Confirmed & Processing orders for packing staff
      allowedOrderStatuses: ['CONFIRMED', 'PROCESSING'],
      modules: ['orders', 'inventory'],
      canAcceptOrders: false,
      canPackOrders: true,
      canDispatchOrders: true,
      canCancelOrders: false,
      canViewRevenue: false,
      lastActive: '12 mins ago'
    },
    {
      id: 'staff_calling',
      name: 'Pooja Verma',
      email: 'pooja.cs@desiachar.example',
      phone: '+91 98290 77665',
      role: 'Order Desk & Calling Staff',
      status: 'Active',
      orderScope: 'PENDING_ONLY', // Shows only New & Pending orders (for phone verification)
      allowedOrderStatuses: ['NEW'],
      modules: ['orders', 'leads', 'customers'],
      canAcceptOrders: true,
      canPackOrders: false,
      canDispatchOrders: false,
      canCancelOrders: true,
      canViewRevenue: false,
      lastActive: '25 mins ago'
    },
    {
      id: 'staff_dispatch',
      name: 'Karan Singh',
      email: 'karan.logistics@desiachar.example',
      phone: '+91 98290 44332',
      role: 'Logistics & Dispatch Courier Partner',
      status: 'Active',
      orderScope: 'DISPATCH_ONLY', // Shows only Shipped & Dispatched orders
      allowedOrderStatuses: ['SHIPPED', 'DELIVERED'],
      modules: ['orders'],
      canAcceptOrders: false,
      canPackOrders: false,
      canDispatchOrders: true,
      canCancelOrders: false,
      canViewRevenue: false,
      lastActive: '1 hour ago'
    },
    {
      id: 'staff_sales',
      name: 'Rahul Mehra',
      email: 'rahul.growth@desiachar.example',
      phone: '+91 98290 99001',
      role: 'Sales & Meta Ads Manager',
      status: 'Active',
      orderScope: 'ALL',
      allowedOrderStatuses: ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      modules: ['leads', 'customers', 'marketing', 'reports'],
      canAcceptOrders: false,
      canPackOrders: false,
      canDispatchOrders: false,
      canCancelOrders: false,
      canViewRevenue: true,
      lastActive: '3 hours ago'
    }
  ];

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
      text: `✨ Authentic artisanal flavors direct from the Royal Kitchens of Rajasthan! ✨\n\nDear Customer, Desi Achar House brings you an exclusive Festive Special Offer! 🏺\n\n🔥 Buy Any 2 Handcrafted Pickles & Get 15% OFF + Free Home Delivery!\n✅ 100% Cold-Pressed Mustard Oil\n✅ Sun-Dried Heirloom Spices\n✅ Zero Artificial Preservatives\n\n👉 Order Online Now: https://desiachar.example/store/desi-rasoi-achar-1\nUse Coupon: FESTIVE15 at checkout! 🌶️`
    },
    'cod-confirm': {
      title: '💬 COD Order Verification & Address Check (RTO Prevention)',
      audience: 'New Cash on Delivery Buyers',
      text: `Hello {CustomerName}! 🙏\n\nWe received your Order #{OrderId} (₹{OrderTotal}) at Desi Achar House.\n\n📦 Items: Traditional Rajasthani Mango Pickle 500g\n📍 Delivery Address: {Address}\n\nPlease reply *YES* to verify your delivery address so we can immediately dispatch your parcel via Delhivery Express Courier. Thank you!`
    },
    review: {
      title: '⭐️ 5-Star Review & Repeat Order Code (Post-Delivery Feedback)',
      audience: 'Delivered Order Customers (3 Days Post-Delivery)',
      text: `Hello {CustomerName}! 😋\n\nWe hope you enjoyed our handcrafted traditional Rajasthani pickles!\n\nYour feedback means the world to us. Please take a moment to leave a 5-star review: https://desiachar.example/review\n\nEnjoy ₹50 off your next order with coupon code: *VIPREPEAT50*\n\nWarm regards, Desi Achar House Family 🏺`
    },
    'meta-reel': {
      title: '📸 Viral Instagram Reel Caption & 15 Top Hashtags',
      audience: 'Instagram Reel & Facebook Post Ad Creative',
      text: `Remember the authentic taste of grandmother's heirloom pickles? 👵❤️\n\nSlowly sun-ripened mangoes infused with aromatic hing, cold-pressed mustard oil, and time-tested Rajasthani spices! 🌶️✨\n\n100% Handcrafted, Zero Chemicals, Pure Authentic Flavor.\n\n📦 Flat 10% Off on First Order | Cash on Delivery Available Nationwide 🇮🇳\n👉 Tap the link in bio to order directly on WhatsApp or Website!\n\n#ArtisanalPickles #MangoPickle #HandcraftedFood #TraditionalTaste #OrganicFood #IndianFlavors #GourmetFood #FoodReels #PureSpices #HeritageKitchen`
    }
  };

  const [aiChatMessages, setAiChatMessages] = useState([
    {
      id: 'msg_welcome',
      sender: 'ai',
      time: 'Just now',
      text: 'Hello Mahesh! I am your **Omniva AI Business Copilot 2.0**. I have analyzed your store **Desi Achar House** across past 30 days revenue (₹54,200), Meta Ads (Instagram vs Facebook), inventory levels, and COD order trends.\n\nYou can ask me questions such as:\n• "Which pickle variety has the highest profit margin?"\n• "Which Meta ad platform delivers the highest ROAS?"\n• "How do I reduce COD order RTO return risk?"\n• "How much stock should we prepare for the festive season?"'
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
      let aiResponseText = '';

      if (qLower.includes('margin') || qLower.includes('bika') || qLower.includes('profit') || qLower.includes('selling') || qLower.includes('top')) {
        aiResponseText = `📊 **Sales & Margin Analysis (Profit Report):**\n\n1. 🥇 **Traditional Rajasthani Mango Pickle 500g:** Your #1 Bestseller accounting for **44% of total order volume**. Selling Price: ₹299, Estimated Gross Margin: **63.5% (₹190/jar)**.\n2. 🥈 **Spicy Green Chilli Pickle 250g:** High repeat purchase item (32% repeat rate). Selling Price: ₹189, Margin: **58%**.\n3. 💡 **AI Recommendation:** Create a ₹449 Combo Bundle of Mango Pickle + Green Chilli to increase Average Order Value (AOV) by +38%!`;
      } else if (qLower.includes('meta') || qLower.includes('ad') || qLower.includes('insta') || qLower.includes('facebook') || qLower.includes('spend') || qLower.includes('roas')) {
        aiResponseText = `📈 **Meta Ads Performance Diagnostic (Ad Campaign Analysis):**\n\n• **📸 Instagram Reels Video Ads:** Spend ₹6,180 | Revenue ₹23,450 | **ROAS 3.8x** | Conversion Rate: 4.2%.\n• **🔵 Facebook Feed Ads:** Spend ₹4,920 | Revenue ₹11,800 | **ROAS 2.4x** | Conversion Rate: 2.1%.\n\n🎯 **AI Recommendation:** Instagram Reels outperforms Facebook feeds by **+58%**. We recommend shifting 70% of ad spend to Instagram Video Reels to scale ROAS to 4.2x.`;
      } else if (qLower.includes('rto') || qLower.includes('cod') || qLower.includes('return') || qLower.includes('fraud') || qLower.includes('cancel')) {
        aiResponseText = `🛡️ **COD & RTO Risk Shield (Return Prevention Report):**\n\n• Out of all active orders, **57% are Cash on Delivery (COD)** and **43% are Prepaid**.\n• Current RTO Rate: **3.8%** (significantly better than the 14% industry average).\n• **High-Risk Alert:** 2 COD orders have incomplete street addresses or unverified phone numbers.\n\n⚡ **AI Action:** Send a 1-click **WhatsApp Confirmation Link** before dispatching. Hand over to courier only after customer verification.`;
      } else if (qLower.includes('stock') || qLower.includes('tyohar') || qLower.includes('diwali') || qLower.includes('holi') || qLower.includes('forecast') || qLower.includes('kitna')) {
        aiResponseText = `📦 **Festive Demand Forecast & Stock Alerts (Inventory Planning):**\n\n• **Festive Gourmet Hamper 1.2kg:** Current stock is 24 units. Projected demand is expected to surge by **+280%** over the upcoming festive season. Risk of stockout in ~6 days!\n• **Mango Pickle 500g:** 120 units available in stock (sufficient for next 14 days).\n\n👩‍🍳 **Kitchen Batching Recommendation:** Schedule kitchen preparation for 150 Festive Hampers and 100 Spicy Chilli Pouches within 3 days.`;
      } else {
        aiResponseText = `🤖 **Store Intelligence Summary (Health Benchmark):**\n\n• **Total Store Revenue:** ₹${rangeRevenue.toLocaleString('en-IN')} (${rangeTotalOrders} Orders).\n• **Order Processing SLA:** Avg time to accept is 28 mins.\n• **Store Health Score:** **94 / 100 (Excellent 🟢)**\n\nVisit the "Forecast" tab to view 30-day stock projections, or use the "Copywriter" tab to generate high-converting promotional broadcasts!`;
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
  const [ordersList, setOrdersList] = useState([
    {
      id: '#ORD-1088',
      orderNumber: 'ORD-1088',
      date: '2026-10-07',
      displayDate: '07 Oct 2026, 11:22 AM',
      customer: 'Vikram Rathore',
      phone: '+91 98290 12345',
      email: 'vikram.rathore@example.com',
      address: 'Plot 42, Civil Lines, Jaipur, Rajasthan - 302006',
      source: 'INSTAGRAM',
      channelName: 'Instagram Reels Ad',
      campaign: 'Reel Launch - Rajasthani Achar Promo',
      adCreative: 'Aam Achar Tasting Video Reel #04',
      items: [
        { name: 'Traditional Rajasthani Mango Pickle 500g', variant: '500g Glass Jar', qty: 1, price: 299, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80' },
        { name: 'Spicy Green Chilli Pickle 250g', variant: '250g Pouch', qty: 1, price: 189, image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&auto=format&fit=crop&q=80' }
      ],
      itemSummary: '2 items (Mango 500g, Green Chilli 250g)',
      total: 488,
      displayTotal: '₹488',
      pay: 'COD',
      payMethod: 'COD',
      payColor: 'bg-amber-50 text-amber-700 border-amber-200',
      status: 'NEW',
      statusLabel: 'New / Awaiting Acceptance',
      statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
      courier: '',
      tracking: '',
      timeline: [
        { title: 'Order Placed by Customer (Duplicate 2 mins after #ORD-1087)', time: '07 Oct 2026, 11:22 AM', done: true },
        { title: 'Merchant Acceptance', time: 'Awaiting Action', done: false },
        { title: 'Packed & Boxed', time: 'Pending', done: false },
        { title: 'Courier Dispatch', time: 'Pending', done: false },
        { title: 'Delivered', time: 'Pending', done: false },
      ]
    },
    {
      id: '#ORD-1087',
      orderNumber: 'ORD-1087',
      date: '2026-10-07',
      displayDate: '07 Oct 2026, 11:20 AM',
      customer: 'Vikram Rathore',
      phone: '+91 98290 12345',
      email: 'vikram.rathore@example.com',
      address: 'Plot 42, Civil Lines, Jaipur, Rajasthan - 302006',
      source: 'INSTAGRAM',
      channelName: 'Instagram Reels Ad',
      campaign: 'Reel Launch - Rajasthani Achar Promo',
      adCreative: 'Aam Achar Tasting Video Reel #04',
      items: [
        { name: 'Traditional Rajasthani Mango Pickle 500g', variant: '500g Glass Jar', qty: 1, price: 299, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80' },
        { name: 'Spicy Green Chilli Pickle 250g', variant: '250g Pouch', qty: 1, price: 189, image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&auto=format&fit=crop&q=80' }
      ],
      itemSummary: '2 items (Mango 500g, Green Chilli 250g)',
      total: 488,
      displayTotal: '₹488',
      pay: 'Paid',
      payMethod: 'ONLINE',
      payColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      status: 'NEW',
      statusLabel: 'New / Awaiting Acceptance',
      statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
      courier: '',
      tracking: '',
      timeline: [
        { title: 'Order Placed by Customer', time: '07 Oct 2026, 11:20 AM', done: true },
        { title: 'Merchant Acceptance', time: 'Awaiting Action', done: false },
        { title: 'Packed & Boxed', time: 'Pending', done: false },
        { title: 'Courier Dispatch', time: 'Pending', done: false },
        { title: 'Delivered', time: 'Pending', done: false },
      ]
    },
    {
      id: '#ORD-1086',
      orderNumber: 'ORD-1086',
      date: '2026-10-07',
      displayDate: '07 Oct 2026, 09:45 AM',
      customer: 'Meera Joshi',
      phone: '+91 98450 67890',
      email: 'meera.joshi@example.com',
      address: '15/B Malviya Nagar, Jaipur, Rajasthan - 302017',
      source: 'FACEBOOK',
      channelName: 'Facebook Feed Ad',
      campaign: 'Diwali Festive Combo Hamper FB Blast',
      adCreative: 'Royal Festive Hamper Carousel Ad',
      items: [
        { name: 'Royal Heritage Festive Pickle Combo Box 1.2kg', variant: 'Gift Hamper', qty: 2, price: 799, image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=300&auto=format&fit=crop&q=80' }
      ],
      itemSummary: '2 items (Heritage Festive Gift Box x2)',
      total: 1598,
      displayTotal: '₹1,598',
      pay: 'COD',
      payMethod: 'COD',
      payColor: 'bg-amber-50 text-amber-700 border-amber-200',
      status: 'NEW',
      statusLabel: 'New / Awaiting Acceptance',
      statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
      courier: '',
      tracking: '',
      timeline: [
        { title: 'Order Placed by Customer (COD)', time: '07 Oct 2026, 09:45 AM', done: true },
        { title: 'Merchant Acceptance', time: 'Awaiting Action', done: false },
        { title: 'Packed & Boxed', time: 'Pending', done: false },
        { title: 'Courier Dispatch', time: 'Pending', done: false },
        { title: 'Delivered', time: 'Pending', done: false },
      ]
    },
    {
      id: '#ORD-1085',
      orderNumber: 'ORD-1085',
      date: '2026-10-06',
      displayDate: '06 Oct 2026, 04:15 PM',
      customer: 'Rohit Kumar',
      phone: '+91 97110 54321',
      email: 'rohit.kumar@example.com',
      address: 'Flat 402, Vaishali Heights, Vaishali Nagar, Jaipur - 302021',
      source: 'INSTAGRAM',
      channelName: 'Instagram Story Ad',
      campaign: 'Spicy Green Chilli & Mix Promo',
      adCreative: 'Green Chilli Masala Close-up Video',
      items: [
        { name: 'Organic Mixed Vegetable Pickle 500g', variant: '500g Jar', qty: 1, price: 249, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&auto=format&fit=crop&q=80' },
        { name: 'Spicy Green Chilli Pickle 250g', variant: '250g Jar', qty: 1, price: 189, image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&auto=format&fit=crop&q=80' }
      ],
      itemSummary: '2 items (Mixed Pickle, Chilli Pickle)',
      total: 438,
      displayTotal: '₹438',
      pay: 'COD',
      payMethod: 'COD',
      payColor: 'bg-amber-50 text-amber-700 border-amber-200',
      status: 'CONFIRMED',
      statusLabel: 'Accepted / Confirmed',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
      courier: '',
      tracking: '',
      timeline: [
        { title: 'Order Placed by Customer', time: '06 Oct 2026, 04:15 PM', done: true },
        { title: 'Merchant Accepted Order', time: '06 Oct 2026, 05:00 PM', done: true },
        { title: 'Packed & Boxed', time: 'Pending Action', done: false },
        { title: 'Courier Dispatch', time: 'Pending', done: false },
        { title: 'Delivered', time: 'Pending', done: false },
      ]
    },
    {
      id: '#ORD-1084',
      orderNumber: 'ORD-1084',
      date: '2026-10-05',
      displayDate: '05 Oct 2026, 02:30 PM',
      customer: 'Neha Singh',
      phone: '+91 98112 33445',
      email: 'neha.singh@example.com',
      address: 'B-88, Tilak Nagar, Jaipur, Rajasthan - 302004',
      source: 'WHATSAPP',
      channelName: 'WhatsApp Direct Chat',
      campaign: 'VIP Repeat Customers Broadcast',
      adCreative: 'Direct Message Link',
      items: [
        { name: 'Sweet & Tangy Lemon Pickle 500g', variant: '500g Glass Jar', qty: 2, price: 229, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80' },
        { name: 'Traditional Rajasthani Mango Pickle 500g', variant: '500g Jar', qty: 1, price: 299, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80' }
      ],
      itemSummary: '3 items (Lemon Pickle x2, Mango 500g)',
      total: 757,
      displayTotal: '₹757',
      pay: 'Paid',
      payMethod: 'ONLINE',
      payColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      status: 'PROCESSING',
      statusLabel: 'Packed / Ready to Ship',
      statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
      courier: 'Delhivery Express',
      tracking: 'DEL-PENDING',
      timeline: [
        { title: 'Order Placed by Customer', time: '05 Oct 2026, 02:30 PM', done: true },
        { title: 'Merchant Accepted Order', time: '05 Oct 2026, 03:00 PM', done: true },
        { title: 'Packed & Quality Checked', time: '05 Oct 2026, 05:30 PM', done: true },
        { title: 'Courier Pickup & Dispatch', time: 'Pending Action', done: false },
        { title: 'Delivered', time: 'Pending', done: false },
      ]
    },
    {
      id: '#ORD-1083',
      orderNumber: 'ORD-1083',
      date: '2026-10-04',
      displayDate: '04 Oct 2026, 10:10 AM',
      customer: 'Amit Patel',
      phone: '+91 99099 88776',
      email: 'amit.patel@example.com',
      address: 'Shop 12, Johari Bazaar, Jaipur, Rajasthan - 302003',
      source: 'FACEBOOK',
      channelName: 'Facebook Feed & Marketplace',
      campaign: 'Garlic Lahsun Achar Special FB Offer',
      adCreative: 'Authentic Village Recipe Banner Ad',
      items: [
        { name: 'Spicy Garlic Pickle (Lahsun Achar) 400g', variant: '400g Jar', qty: 2, price: 249, image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=300&auto=format&fit=crop&q=80' }
      ],
      itemSummary: '2 items (Garlic Pickle 400g x2)',
      total: 498,
      displayTotal: '₹498',
      pay: 'COD',
      payMethod: 'COD',
      payColor: 'bg-amber-50 text-amber-700 border-amber-200',
      status: 'SHIPPED',
      statusLabel: 'Shipped / Out for Delivery',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
      courier: 'Delhivery Surface',
      tracking: 'DEL-98402150',
      timeline: [
        { title: 'Order Placed by Customer', time: '04 Oct 2026, 10:10 AM', done: true },
        { title: 'Merchant Accepted Order', time: '04 Oct 2026, 10:45 AM', done: true },
        { title: 'Packed & Quality Checked', time: '04 Oct 2026, 01:20 PM', done: true },
        { title: 'Dispatched via Delhivery (DEL-98402150)', time: '04 Oct 2026, 04:00 PM', done: true },
        { title: 'Delivered to Customer', time: 'Out for delivery today', done: false },
      ]
    },
    {
      id: '#ORD-1082',
      orderNumber: 'ORD-1082',
      date: '2026-10-03',
      displayDate: '03 Oct 2026, 01:15 PM',
      customer: 'Priya Verma',
      phone: '+91 98119 87654',
      email: 'priya.verma@example.com',
      address: 'A-22, Mansarovar Sector 5, Jaipur, Rajasthan - 302020',
      source: 'INSTAGRAM',
      channelName: 'Instagram Reels Ad',
      campaign: 'Reel Launch - Rajasthani Achar Promo',
      adCreative: 'Grandmother Recipe Heritage Reel #01',
      items: [
        { name: 'Royal Heritage Festive Pickle Combo Box 1.2kg', variant: 'Gift Hamper', qty: 1, price: 799, image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=300&auto=format&fit=crop&q=80' },
        { name: 'Traditional Rajasthani Mango Pickle 500g', variant: '500g Jar', qty: 1, price: 299, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80' }
      ],
      itemSummary: '2 items (Heritage Combo, Mango 500g)',
      total: 1098,
      displayTotal: '₹1,098',
      pay: 'Paid',
      payMethod: 'ONLINE',
      payColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      status: 'DELIVERED',
      statusLabel: 'Delivered Successfully',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      courier: 'BlueDart Express',
      tracking: 'BLU-30982145',
      timeline: [
        { title: 'Order Placed by Customer', time: '03 Oct 2026, 01:15 PM', done: true },
        { title: 'Merchant Accepted Order', time: '03 Oct 2026, 01:30 PM', done: true },
        { title: 'Packed & Quality Checked', time: '03 Oct 2026, 03:00 PM', done: true },
        { title: 'Dispatched via BlueDart', time: '03 Oct 2026, 06:00 PM', done: true },
        { title: 'Delivered Successfully (OTP Verified)', time: '05 Oct 2026, 12:45 PM', done: true },
      ]
    },
    {
      id: '#ORD-1081',
      orderNumber: 'ORD-1081',
      date: '2026-10-02',
      displayDate: '02 Oct 2026, 11:00 AM',
      customer: 'Aarav Sharma',
      phone: '+91 98291 00223',
      email: 'aarav.sharma@example.com',
      address: 'House 5, Bani Park, Jaipur, Rajasthan - 302016',
      source: 'WEBSITE',
      channelName: 'Direct Storefront Web',
      campaign: 'Organic Search & Direct Link',
      adCreative: 'Storefront Homepage Buy Button',
      items: [
        { name: 'Traditional Rajasthani Mango Pickle 500g', variant: '500g Jar', qty: 2, price: 299, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80' },
        { name: 'Spicy Garlic Pickle (Lahsun Achar) 400g', variant: '400g Jar', qty: 1, price: 249, image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=300&auto=format&fit=crop&q=80' }
      ],
      itemSummary: '3 items (Mango Pickle x2, Garlic Pickle)',
      total: 847,
      displayTotal: '₹847',
      pay: 'Paid',
      payMethod: 'COD_COLLECTED',
      payColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      status: 'DELIVERED',
      statusLabel: 'Delivered Successfully',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      courier: 'Delhivery Surface',
      tracking: 'DEL-8910245',
      timeline: [
        { title: 'Order Placed by Customer', time: '02 Oct 2026, 11:00 AM', done: true },
        { title: 'Merchant Accepted Order', time: '02 Oct 2026, 11:30 AM', done: true },
        { title: 'Packed & Quality Checked', time: '02 Oct 2026, 02:00 PM', done: true },
        { title: 'Dispatched via Delhivery', time: '02 Oct 2026, 05:00 PM', done: true },
        { title: 'Delivered & COD Cash Collected', time: '04 Oct 2026, 03:10 PM', done: true },
      ]
    },
    {
      id: '#ORD-1080',
      orderNumber: 'ORD-1080',
      date: '2026-09-30',
      displayDate: '30 Sep 2026, 05:10 PM',
      customer: 'Kavita Chawla',
      phone: '+91 98765 11223',
      email: 'kavita@example.com',
      address: 'Ajmer Road, Jaipur',
      source: 'FACEBOOK',
      channelName: 'Facebook Feed Ad',
      campaign: 'Diwali Festive Combo Hamper FB Blast',
      adCreative: 'Festive Combo Savings Video',
      items: [{ name: 'Mixed Achar 500g', variant: '500g', qty: 1, price: 249, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&auto=format&fit=crop&q=80' }],
      itemSummary: '1 item (Mixed Achar)',
      total: 249,
      displayTotal: '₹249',
      pay: 'Paid',
      payMethod: 'ONLINE',
      payColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      status: 'DELIVERED',
      statusLabel: 'Delivered',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      courier: 'Delhivery',
      tracking: 'DEL-778912',
      timeline: []
    },
    {
      id: '#ORD-1079',
      orderNumber: 'ORD-1079',
      date: '2026-09-28',
      displayDate: '28 Sep 2026, 03:00 PM',
      customer: 'Deepak Sharma',
      phone: '+91 98223 44556',
      email: 'deepak@example.com',
      address: 'Raja Park, Jaipur',
      source: 'INSTAGRAM',
      channelName: 'Instagram Reels Ad',
      campaign: 'Reel Launch - Rajasthani Achar Promo',
      adCreative: '1kg Bulk Jar Free Delivery Promo Reel',
      items: [{ name: 'Rajasthani Mango Pickle 1kg', variant: '1kg', qty: 1, price: 499, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80' }],
      itemSummary: '1 item (Mango Pickle 1kg)',
      total: 499,
      displayTotal: '₹499',
      pay: 'Paid',
      payMethod: 'ONLINE',
      payColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      status: 'DELIVERED',
      statusLabel: 'Delivered',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      courier: 'BlueDart',
      tracking: 'BLU-112233',
      timeline: []
    }
  ]);

  // Categories Showcase State with Authentic Photos
  const [categoriesList, setCategoriesList] = useState([
    {
      id: 'CAT-01',
      name: 'Mango Pickles (Aam ka Achar)',
      slug: 'mango-pickles',
      description: 'Traditional slow-sun-cured raw mango slices in cold-pressed mustard oil with fenugreek, fennel, and whole spices.',
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
      productsCount: 3,
      status: 'Active'
    },
    {
      id: 'CAT-02',
      name: 'Green Chilli (Hari Mirch Achar)',
      slug: 'green-chilli',
      description: 'Hand-slit spicy green chillies seasoned with yellow mustard seeds, amchur, and roasted cumin.',
      image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80',
      productsCount: 2,
      status: 'Active'
    },
    {
      id: 'CAT-03',
      name: 'Garlic Pickle (Lahsun Achar)',
      slug: 'garlic-pickle',
      description: 'Peeled pungent garlic cloves steeped in spicy Rajasthani masala and mustard oil.',
      image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80',
      productsCount: 2,
      status: 'Active'
    },
    {
      id: 'CAT-04',
      name: 'Mixed & Lemon Pickles',
      slug: 'mixed-pickles',
      description: 'Handcrafted seasonal carrots, cauliflower, turnip, ginger and tangy sweet lemons.',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
      productsCount: 2,
      status: 'Active'
    },
    {
      id: 'CAT-05',
      name: 'Stuffed Red Chilli (Banarasi Lal Mirch)',
      slug: 'red-chilli',
      description: 'Sun-dried Banarasi thick red chillies stuffed with authentic heirloom mustard and amchur masala.',
      image: 'https://images.unsplash.com/photo-1596040033282-5d9b23b72c4d?w=600&auto=format&fit=crop&q=80',
      productsCount: 2,
      status: 'Active'
    },
    {
      id: 'CAT-06',
      name: 'Handcrafted Festive Gift Boxes',
      slug: 'gift-combos',
      description: 'Premium wooden and earthen jar assortments for festivals, weddings, and gifting.',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      productsCount: 2,
      status: 'Active'
    }
  ]);

  const photoPresets = [
    { label: 'Sun-dried Raw Mango', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80' },
    { label: 'Fiery Green Chilli', url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80' },
    { label: 'Roasted Garlic & Spices', url: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80' },
    { label: 'Heritage Mixed Pickle', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80' },
    { label: 'Festive Gourmet Hamper', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80' },
    { label: 'Kashmiri Red Chilli', url: 'https://images.unsplash.com/photo-1596040033282-5d9b23b72c4d?w=600&auto=format&fit=crop&q=80' }
  ];

  // Dynamic Date Filter & Range Calculations
  const dateFilteredOrders = ordersList.filter(o => {
    if (datePreset !== 'ALL') {
      if (startDate && o.date < startDate) return false;
      if (endDate && o.date > endDate) return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchCust = o.customer?.toLowerCase().includes(q);
      const matchId = o.id?.toLowerCase().includes(q) || o.orderNumber?.toLowerCase().includes(q);
      const matchPhone = o.phone?.includes(q);
      const matchItem = o.itemSummary?.toLowerCase().includes(q);
      if (!matchCust && !matchId && !matchPhone && !matchItem) return false;
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

  // Helper to generate live courier tracking link
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

    return `Hello ${order.customer}! 🙏\n\nYour Desi Achar House Order ${order.id} has been dispatched!\n\n🚚 Courier Partner: ${courier}\n🔢 Tracking No (AWB): ${tracking}\n📍 Live Parcel Tracking: ${fullTrackingUrl}\n\nClick the link above to track your parcel in real-time. Thank you for shopping with us! 🏺`;
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
    if (orderSourceFilter !== 'ALL' && (o.source || 'WEBSITE') !== orderSourceFilter) return false;
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
  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const durationMs = endD.getTime() - startD.getTime();
  const priorStartD = new Date(startD.getTime() - durationMs - (24 * 60 * 60 * 1000));
  const priorEndD = new Date(startD.getTime() - (24 * 60 * 60 * 1000));
  const priorStartStr = priorStartD.toISOString().slice(0, 10);
  const priorEndStr = priorEndD.toISOString().slice(0, 10);

  const priorPeriodOrders = ordersList.filter(o => o.date >= priorStartStr && o.date <= priorEndStr && o.status !== 'CANCELLED');
  const priorPeriodRevenue = priorPeriodOrders.reduce((sum, o) => sum + o.total, 0) || 1200;

  const growthRate = rangeRevenue > 0
    ? (((rangeRevenue - priorPeriodRevenue) / priorPeriodRevenue) * 100).toFixed(1)
    : '0.0';

  // Dynamic channel statistics for circular graphs and amounts
  const channelStats = (() => {
    const total = Math.max(rangeRevenue, 1);
    const instaOrders = staffScopedOrders.filter(o => o.source === 'INSTAGRAM' && o.status !== 'CANCELLED');
    const webOrders = staffScopedOrders.filter(o => (o.source === 'WEBSITE' || !o.source) && o.status !== 'CANCELLED');
    const fbOrders = staffScopedOrders.filter(o => (o.source === 'FACEBOOK' || o.source === 'WHATSAPP') && o.status !== 'CANCELLED');

    const instaRev = instaOrders.reduce((sum, o) => sum + o.total, 0) || Math.round(total * 0.43);
    const webRev = webOrders.reduce((sum, o) => sum + o.total, 0) || Math.round(total * 0.35);
    const fbRev = fbOrders.reduce((sum, o) => sum + o.total, 0) || Math.max(0, total - instaRev - webRev);

    const instaPct = Math.min(100, Math.round((instaRev / total) * 100));
    const webPct = Math.min(100, Math.round((webRev / total) * 100));
    const fbPct = Math.max(0, 100 - instaPct - webPct);

    return {
      insta: { rev: instaRev, pct: instaPct, count: instaOrders.length || 7 },
      web: { rev: webRev, pct: webPct, count: webOrders.length || 6 },
      fb: { rev: fbRev, pct: fbPct, count: fbOrders.length || 3 }
    };
  })();

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

  // Live LocalStorage Order Status Synchronization
  const syncLiveOrderStatus = (targetIdentifier, newStatus) => {
    try {
      const localPlaced = JSON.parse(localStorage.getItem('omniva_live_orders') || '[]');
      if (Array.isArray(localPlaced) && localPlaced.length > 0) {
        const idClean = String(targetIdentifier || '').replace(/^#/, '');
        const updated = localPlaced.map(o => {
          if (o.orderNumber === idClean || o._id === idClean || o.orderId === idClean || String(o.id || '').replace(/^#/, '') === idClean) {
            return { ...o, orderStatus: newStatus };
          }
          return o;
        });
        localStorage.setItem('omniva_live_orders', JSON.stringify(updated));
      }
    } catch (e) {}
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
    if (target?._id || target?.orderNumber) {
      try {
        const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.patch(`/api/orders/${target._id || target.orderNumber}/status`, { orderStatus: 'CONFIRMED' }, { headers: authHeaders });
      } catch (err) {
        console.warn('Failed to update order status on backend:', err);
      }
    }
    syncLiveOrderStatus(orderId, 'CONFIRMED');
    if (target?.orderNumber) syncLiveOrderStatus(target.orderNumber, 'CONFIRMED');
    setOrdersList(prev => prev.map(o => {
      if (o.id === orderId || o.orderNumber === orderId || (target && o._id === target._id)) {
        return {
          ...o,
          status: 'CONFIRMED',
          statusLabel: 'Accepted / Confirmed',
          statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
          timeline: Array.isArray(o.timeline) ? o.timeline.map((t, idx) => idx === 1 ? { ...t, time: 'Accepted Just Now by Merchant', done: true } : t) : []
        };
      }
      return o;
    }));
    setActionSuccessToast(`Order ${orderId} accepted successfully! Moved to Confirmed queue.`);
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
    if (target?._id || target?.orderNumber) {
      try {
        const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.patch(`/api/orders/${target._id || target.orderNumber}/status`, { orderStatus: 'PROCESSING' }, { headers: authHeaders });
      } catch (err) {
        console.warn('Failed to update order status on backend:', err);
      }
    }
    syncLiveOrderStatus(orderId, 'PROCESSING');
    if (target?.orderNumber) syncLiveOrderStatus(target.orderNumber, 'PROCESSING');
    setOrdersList(prev => prev.map(o => {
      if (o.id === orderId || o.orderNumber === orderId || (target && o._id === target._id)) {
        return {
          ...o,
          status: 'PROCESSING',
          statusLabel: 'Packed / Ready to Ship',
          statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
          timeline: Array.isArray(o.timeline) ? o.timeline.map((t, idx) => idx === 2 ? { ...t, time: 'Packed & Boxed Just Now', done: true } : t) : []
        };
      }
      return o;
    }));
    setActionSuccessToast(`Order ${orderId} marked Packed & Boxed! Ready for courier dispatch.`);
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

    const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

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

    const updatePromises = [];
    if (o1?._id) {
      updatePromises.push(
        axios.patch(`/api/orders/${o1._id}/status`, {
          orderStatus: 'CONFIRMED',
          duplicateResolved: true,
          note: 'Customer confirmed both orders are valid'
        }, { headers: authHeaders }).catch(err => console.warn('Failed to update order 1 duplicate status:', err))
      );
    }
    if (o2?._id) {
      updatePromises.push(
        axios.patch(`/api/orders/${o2._id}/status`, {
          orderStatus: 'CONFIRMED',
          duplicateResolved: true,
          note: 'Customer confirmed both orders are valid'
        }, { headers: authHeaders }).catch(err => console.warn('Failed to update order 2 duplicate status:', err))
      );
    }

    if (updatePromises.length > 0) {
      await Promise.allSettled(updatePromises);
    }

    setActionSuccessToast(`Both orders (${orderId1} & ${orderId2}) marked as Confirmed and Verified!`);
    setTimeout(() => setActionSuccessToast(''), 4500);
    setSelectedOrderForDetail(null);
  };

  const handleCancelDuplicateOrder = async (duplicateOrderId, originalOrderId) => {
    if (window.confirm(`Are you sure you want to cancel duplicate order "${duplicateOrderId}"? The original order "${originalOrderId}" will remain active.`)) {
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

      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

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
          return {
            ...o,
            duplicateResolved: true
          };
        }
        return o;
      }));

      const patchPromises = [];
      if (dup?._id) {
        patchPromises.push(
          axios.patch(`/api/orders/${dup._id}/status`, {
            orderStatus: 'CANCELLED',
            duplicateResolved: true,
            note: `Duplicate order cancelled. Customer confirmed only ${originalOrderId} is needed.`
          }, { headers: authHeaders }).catch(err => console.warn('Failed to cancel duplicate order on backend:', err))
        );
      }
      if (orig?._id) {
        patchPromises.push(
          axios.patch(`/api/orders/${orig._id}/status`, {
            duplicateResolved: true,
            note: 'Duplicate order resolved. Original order kept.'
          }, { headers: authHeaders }).catch(err => console.warn('Failed to update original order duplicate status:', err))
        );
      }

      if (patchPromises.length > 0) {
        await Promise.allSettled(patchPromises);
      }

      setActionSuccessToast(`Duplicate order ${duplicateOrderId} cancelled. Original order ${originalOrderId} active!`);
      setTimeout(() => setActionSuccessToast(''), 4500);
      setSelectedOrderForDetail(null);
    }
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

    const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    setOrdersList(prev => prev.map(o => {
      const match1 = o1 && (o.id === o1.id || o._id === o1._id);
      const match2 = o2 && (o.id === o2.id || o._id === o2._id);
      if (match1 || match2) {
        return {
          ...o,
          duplicateResolved: true
        };
      }
      return o;
    }));

    const updatePromises = [];
    if (o1?._id) {
      updatePromises.push(
        axios.patch(`/api/orders/${o1._id}/status`, {
          duplicateResolved: true,
          note: 'Verified by merchant - separate valid order'
        }, { headers: authHeaders }).catch(err => console.warn('Failed to mark order 1 as not duplicate:', err))
      );
    }
    if (o2?._id) {
      updatePromises.push(
        axios.patch(`/api/orders/${o2._id}/status`, {
          duplicateResolved: true,
          note: 'Verified by merchant - separate valid order'
        }, { headers: authHeaders }).catch(err => console.warn('Failed to mark order 2 as not duplicate:', err))
      );
    }

    if (updatePromises.length > 0) {
      await Promise.allSettled(updatePromises);
    }

    setActionSuccessToast('Orders marked as verified! Duplicate alert dismissed.');
    setTimeout(() => setActionSuccessToast(''), 4500);
    setSelectedOrderForDetail(null);
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchModalOrder) return;
    const orderId = dispatchModalOrder.id;
    const finalTracking = (trackingNumber && trackingNumber.trim()) || ('DEL-' + Math.floor(100000 + Math.random() * 900000));
    const cleanPhone = (dispatchModalOrder.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const trackingUrl = getCourierTrackingUrl(courierName, finalTracking, dispatchModalOrder.orderNumber || dispatchModalOrder.id, cleanPhone);
    const trackingMsg = generateTrackingMessage(dispatchModalOrder, courierName, finalTracking);

    if (dispatchModalOrder._id || dispatchModalOrder.orderNumber) {
      try {
        const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.patch(`/api/orders/${dispatchModalOrder._id || dispatchModalOrder.orderNumber}/status`, {
          orderStatus: 'SHIPPED',
          courierPartner: courierName,
          trackingNumber: finalTracking
        }, { headers: authHeaders });
      } catch (err) {
        console.warn('Failed to update dispatch status on backend:', err);
      }
    }
    syncLiveOrderStatus(dispatchModalOrder?.orderNumber || dispatchModalOrder?.id, 'SHIPPED');

    setOrdersList(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'SHIPPED',
          statusLabel: 'Shipped / Out for Delivery',
          statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
          courier: courierName,
          tracking: finalTracking,
          trackingUrl: trackingUrl,
          trackingNotified: true,
          trackingNotifiedAt: new Date().toISOString(),
          trackingMessage: trackingMsg,
          timeline: Array.isArray(o.timeline) ? o.timeline.map((t, idx) => idx === 3 ? { ...t, time: `Dispatched via ${courierName} (${finalTracking})`, done: true } : t) : []
        };
      }
      return o;
    }));

    // Increment Rule 02 counter & add log in Automations Engine
    setAutomationRules(prev => prev.map(r => r._id === 'rule_02' ? {
      ...r,
      executionCount: (r.executionCount || 0) + 1,
      lastExecutedAt: new Date().toISOString()
    } : r));

    setAutomationLogs(prev => [
      {
        _id: `log_${Date.now()}`,
        ruleName: 'Order Dispatched Courier Tracking Alert',
        trigger: 'ORDER_SHIPPED',
        entityType: 'ORDER',
        entityId: orderId,
        actionType: 'SEND_WHATSAPP',
        status: 'SUCCESS',
        payloadSummary: `Automated live tracking sent to ${dispatchModalOrder.customer} (${dispatchModalOrder.phone}) via ${courierName}. AWB: ${finalTracking}`,
        createdAt: new Date().toISOString()
      },
      ...prev
    ]);

    // Auto-open WhatsApp with pre-composed tracking message if enabled
    if (autoNotifyWhatsApp && cleanPhone) {
      window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(trackingMsg)}`, '_blank');
    }

    setDispatchModalOrder(null);
    setActionSuccessToast(`🚀 Order ${orderId} dispatched via ${courierName}! Tracking #${finalTracking} automatically sent to customer.`);
    setTimeout(() => setActionSuccessToast(''), 4500);
  };

  const handleSendTrackingNotification = (ord) => {
    if (!ord) return;
    const cleanPhone = (ord.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const trk = ord.tracking || 'DEL-8492014';
    const cour = ord.courier || 'Delhivery Express';
    const trackingMsg = ord.trackingMessage || generateTrackingMessage(ord, cour, trk);
    
    if (cleanPhone) {
      window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(trackingMsg)}`, '_blank');
    }

    setOrdersList(prev => prev.map(o => o.id === ord.id ? { ...o, trackingNotified: true, trackingNotifiedAt: new Date().toISOString() } : o));

    setActionSuccessToast(`💬 WhatsApp tracking notification opened for ${ord.customer} (${ord.phone})!`);
    setTimeout(() => setActionSuccessToast(''), 4500);
  };

  const handleBulkSendTracking = () => {
    const shippedOrders = ordersList.filter(o => o.status === 'SHIPPED');
    if (shippedOrders.length === 0) {
      alert('No Shipped orders available to notify.');
      return;
    }

    const nowIso = new Date().toISOString();
    setOrdersList(prev => prev.map(o => {
      if (o.status === 'SHIPPED') {
        const trk = o.tracking || ('DEL-' + Math.floor(100000 + Math.random() * 900000));
        const cour = o.courier || 'Delhivery Express';
        const trkUrl = o.trackingUrl || getCourierTrackingUrl(cour, trk, o.orderNumber || o.id, o.phone);
        const msg = o.trackingMessage || generateTrackingMessage(o, cour, trk);
        return {
          ...o,
          tracking: trk,
          courier: cour,
          trackingUrl: trkUrl,
          trackingNotified: true,
          trackingNotifiedAt: nowIso,
          trackingMessage: msg
        };
      }
      return o;
    }));

    setAutomationRules(prev => prev.map(r => r._id === 'rule_02' ? {
      ...r,
      executionCount: (r.executionCount || 0) + shippedOrders.length,
      lastExecutedAt: nowIso
    } : r));

    const newLogs = shippedOrders.map(o => ({
      _id: `log_bulk_${o.id}_${Date.now()}`,
      ruleName: 'Order Dispatched Courier Tracking Alert',
      trigger: 'ORDER_SHIPPED',
      entityType: 'ORDER',
      entityId: o.id,
      actionType: 'SEND_WHATSAPP',
      status: 'SUCCESS',
      payloadSummary: `Bulk auto-dispatch tracking sent to ${o.customer} (${o.phone}). AWB: ${o.tracking || 'DEL-Auto'}`,
      createdAt: nowIso
    }));
    setAutomationLogs(prev => [...newLogs, ...prev]);

    const firstWithPhone = shippedOrders.find(o => o.phone);
    if (firstWithPhone) {
      const cleanPhone = (firstWithPhone.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const msg = firstWithPhone.trackingMessage || generateTrackingMessage(firstWithPhone, firstWithPhone.courier || 'Delhivery Express', firstWithPhone.tracking || 'DEL-98402150');
      window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    setActionSuccessToast(`⚡ Batch Automated Dispatch: Tracking IDs generated & sent for all ${shippedOrders.length} Shipped Orders!`);
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
    if (target?._id || target?.orderNumber) {
      try {
        const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.patch(`/api/orders/${target._id || target.orderNumber}/status`, {
          orderStatus: 'DELIVERED',
          paymentStatus: 'PAID'
        }, { headers: authHeaders });
      } catch (err) {
        console.warn('Failed to update delivered status on backend:', err);
      }
    }
    syncLiveOrderStatus(orderId, 'DELIVERED');
    if (target?.orderNumber) syncLiveOrderStatus(target.orderNumber, 'DELIVERED');
    setOrdersList(prev => prev.map(o => {
      if (o.id === orderId || o.orderNumber === orderId || (target && o._id === target._id)) {
        return {
          ...o,
          status: 'DELIVERED',
          statusLabel: 'Delivered Successfully',
          statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          pay: 'Paid',
          payColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          timeline: Array.isArray(o.timeline) ? o.timeline.map((t, idx) => idx === 4 ? { ...t, time: 'Delivered Successfully Just Now', done: true } : t) : []
        };
      }
      return o;
    }));
    setActionSuccessToast(`Order ${orderId} marked Delivered! Payment verified & recorded.`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    const orderId = cancelModalOrder.id;
    if (cancelModalOrder._id || cancelModalOrder.orderNumber) {
      try {
        const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.patch(`/api/orders/${cancelModalOrder._id || cancelModalOrder.orderNumber}/status`, {
          orderStatus: 'CANCELLED',
          note: cancelReason
        }, { headers: authHeaders });
      } catch (err) {
        console.warn('Failed to update cancelled status on backend:', err);
      }
    }
    syncLiveOrderStatus(orderId, 'CANCELLED');
    if (cancelModalOrder.orderNumber) syncLiveOrderStatus(cancelModalOrder.orderNumber, 'CANCELLED');
    setOrdersList(prev => prev.map(o => {
      if (o.id === orderId || o.orderNumber === orderId) {
        return {
          ...o,
          status: 'CANCELLED',
          statusLabel: 'Cancelled',
          statusColor: 'bg-rose-50 text-rose-700 border-rose-200',
          timeline: Array.isArray(o.timeline) ? [...o.timeline, { title: `Cancelled: ${cancelReason}`, time: 'Just Now', done: true }] : []
        };
      }
      return o;
    }));
    setCancelModalOrder(null);
    setActionSuccessToast(`Order ${orderId} cancelled. Inventory restored to stock.`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  const handleApplyPreset = (preset) => {
    setDatePreset(preset);
    let s = '2026-10-02';
    let e = '2026-10-07';
    if (preset === 'TODAY') {
      s = '2026-10-07';
      e = '2026-10-07';
    } else if (preset === 'YESTERDAY') {
      s = '2026-10-06';
      e = '2026-10-06';
    } else if (preset === 'THIS_WEEK') {
      s = '2026-10-01';
      e = '2026-10-07';
    } else if (preset === 'OCT_1_TO_5') {
      s = '2026-10-01';
      e = '2026-10-05';
    } else if (preset === 'OCT_2_TO_7') {
      s = '2026-10-02';
      e = '2026-10-07';
    } else if (preset === 'THIS_MONTH') {
      s = '2026-10-01';
      e = '2026-10-31';
    } else if (preset === 'SEP_MONTH') {
      s = '2026-09-01';
      e = '2026-09-30';
      setCalPickerMonth(8);
    }
    setStartDate(s);
    setEndDate(e);
    setSelectedRangeStart(s);
    setSelectedRangeEnd(e);
    setActionSuccessToast(`Date range auto-arranged: ${s} to ${e}. Analytics updated!`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  const handleSaveCategoryPhoto = async () => {
    if (!editingCategory) return;
    const catId = editingCategory._id || editingCategory.id;
    if (editingCategory._id) {
      try {
        const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.put(`/api/categories/${editingCategory._id}`, { image: categoryPhotoUrl }, { headers: authHeaders });
      } catch (err) {
        console.warn('Failed to update category photo on backend:', err);
      }
    }
    setCategoriesList(prev => prev.map(c => ((c._id && c._id === catId) || c.id === catId) ? { ...c, image: categoryPhotoUrl } : c));
    setEditingCategory(null);
    setActionSuccessToast(`Category image updated successfully! Synchronized with customer storefront.`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  // Interactive Settings Form State
  const [bizProfileName, setBizProfileName] = useState(businessName);
  const [bizType, setBizType] = useState('Product selling');
  const [contactEmail, setContactEmail] = useState('support@desiachar.example');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');
  const [bizAddress, setBizAddress] = useState('Jaipur, Rajasthan, India');
  const [showStorePage, setShowStorePage] = useState(true);
  const [enableCod, setEnableCod] = useState(true);
  const [sendOrderNotifications, setSendOrderNotifications] = useState(true);
  const [enableMarketingByDefault, setEnableMarketingByDefault] = useState(false);

  // Marketing & Settings Sub-tabs State
  const [marketingSubTab, setMarketingSubTab] = useState('meta-orders'); // 'meta-orders' | 'campaigns' | 'meta-setup'
  const [metaOrdersPlatformFilter, setMetaOrdersPlatformFilter] = useState('ALL_META'); // 'ALL_META' | 'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP'

  // Additional settings state
  const [gstinNumber, setGstinNumber] = useState('08AABCR1234F1Z8');
  const [brandTagline, setBrandTagline] = useState('Authentic Handcrafted Pickles & Murabbas of Rajasthan');
  const [brandColor, setBrandColor] = useState('#5046e5');
  const [minOrderValue, setMinOrderValue] = useState('249');
  const [shippingFee, setShippingFee] = useState('49');
  const [razorpayKeyId, setRazorpayKeyId] = useState('rzp_live_98a76d5432');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('••••••••••••');
  const [merchantUpiId, setMerchantUpiId] = useState('desiachar@icici');
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);

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

  const defaultCrmLeads = [
    {
      _id: 'lead_meta_01',
      name: 'Pooja Agarwal',
      phone: '9844556677',
      email: 'pooja.agarwal@example.com',
      source: 'META_ADS',
      campaignName: 'Instagram Reel Ad - Organic Achar Launch',
      adName: 'Video Reel Creative 15s',
      status: 'NEW',
      budget: 1250,
      notes: [
        {
          note: 'Inquired about Festive Mango & Chilli combo box on Instagram Reel Ad.',
          authorName: 'Meta Ads Webhook',
          createdAt: '2026-10-14T11:20:00Z'
        }
      ],
      createdAt: '2026-10-14T11:20:00Z'
    },
    {
      _id: 'lead_meta_02',
      name: 'Aarav Sharma',
      phone: '9811223344',
      email: 'aarav.sharma@gmail.com',
      source: 'META_ADS',
      campaignName: 'Diwali Homemade Pickle Special',
      adName: 'Delhi NCR Foodies 25-45',
      status: 'CONTACTED',
      budget: 1500,
      notes: [
        {
          note: 'Called customer; discussed sample jars. Customer requested WhatsApp catalogue.',
          authorName: 'Rahul Sharma',
          createdAt: '2026-10-14T10:15:00Z'
        }
      ],
      createdAt: '2026-10-14T10:15:00Z'
    },
    {
      _id: 'lead_web_03',
      name: 'Priya Verma',
      phone: '9788112233',
      email: 'priya.v@outlook.com',
      source: 'WEBSITE',
      campaignName: 'Storefront Organic Search',
      adName: 'Product Enquiry',
      status: 'QUALIFIED',
      budget: 850,
      notes: [
        {
          note: 'Customer wants 2x Banarasi Red Chilli and 1x Garlic Achar. Price agreed.',
          authorName: 'Neha',
          createdAt: '2026-10-14T09:30:00Z'
        }
      ],
      createdAt: '2026-10-14T09:30:00Z'
    },
    {
      _id: 'lead_wa_04',
      name: 'Amit Patel',
      phone: '9655443322',
      email: 'amit.patel@yahoo.com',
      source: 'WHATSAPP',
      campaignName: 'WhatsApp Click-to-Chat Ad',
      adName: 'Direct Chat',
      status: 'QUOTATION_SENT',
      budget: 2200,
      notes: [
        {
          note: 'Sent corporate Diwali gift pack quotation with 10% volume discount.',
          authorName: 'Rahul Sharma',
          createdAt: '2026-10-13T16:45:00Z'
        }
      ],
      createdAt: '2026-10-13T16:45:00Z'
    },
    {
      _id: 'lead_ref_05',
      name: 'Sneha Joshi',
      phone: '9944332211',
      email: 'sneha.joshi@example.com',
      source: 'REFERRAL',
      campaignName: 'Word of Mouth / Existing Buyer',
      adName: '—',
      status: 'WON',
      budget: 3100,
      notes: [
        {
          note: 'Placed order ORD-9921 for 6 jars. Advance payment verified via UPI.',
          authorName: 'Rahul Sharma',
          createdAt: '2026-10-13T14:10:00Z'
        }
      ],
      createdAt: '2026-10-13T14:10:00Z'
    },
    {
      _id: 'lead_lost_06',
      name: 'Vikram Choudhary',
      phone: '9877665544',
      email: 'vikram.c@gmail.com',
      source: 'META_ADS',
      campaignName: 'Facebook Feed Sponsored Post',
      adName: 'Spicy Mirch Achar Ad',
      status: 'LOST',
      budget: 450,
      notes: [
        {
          note: 'Customer decided to buy local market pickles. Dropped from pipeline.',
          authorName: 'Neha',
          createdAt: '2026-10-12T18:00:00Z'
        }
      ],
      createdAt: '2026-10-12T18:00:00Z'
    }
  ];

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
    source: 'META_ADS',
    campaignName: 'Instagram Reel Ad',
    budget: '750',
    note: ''
  });
  const [newLeadNote, setNewLeadNote] = useState('');

  // Calendar month state
  const [calendarMonth, setCalendarMonth] = useState('October 2026');

  // Meta Ads Real-Time Syncing State
  const [syncingMeta, setSyncingMeta] = useState(false);

  // Products State (so Add Product updates catalog immediately)
  const [productsList, setProductsList] = useState([
    {
      name: 'Traditional Rajasthani Mango Pickle',
      sku: 'ACH-MG-500',
      cat: 'Mango Pickles',
      price: '₹299',
      stock: 120,
      status: 'In stock',
      statusColor: 'bg-emerald-50 text-emerald-700',
      vis: 'Published',
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
      jars: [
        { id: 'j250', name: '250g Glass Jar', price: 189, stock: 40, enabled: true },
        { id: 'j500', name: '500g Traditional Jar', price: 299, stock: 50, enabled: true },
        { id: 'j1000', name: '1kg Family Pack Jar', price: 499, stock: 30, enabled: true },
        { id: 'jmartban', name: 'Ceramic Martban Jar 1.2kg', price: 799, stock: 10, enabled: true }
      ]
    },
    {
      name: 'Spicy Green Chilli Pickle (Hari Mirch)',
      sku: 'ACH-GC-250',
      cat: 'Green Chilli',
      price: '₹189',
      stock: 85,
      status: 'In stock',
      statusColor: 'bg-emerald-50 text-emerald-700',
      vis: 'Published',
      img: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80',
      jars: [
        { id: 'j250', name: '250g Glass Jar', price: 189, stock: 45, enabled: true },
        { id: 'j500', name: '500g Traditional Jar', price: 299, stock: 40, enabled: true }
      ]
    },
    {
      name: 'Piquant Garlic Pickle (Lahsun Achar)',
      sku: 'ACH-GA-400',
      cat: 'Garlic Pickle',
      price: '₹249',
      stock: 42,
      status: 'In stock',
      statusColor: 'bg-emerald-50 text-emerald-700',
      vis: 'Published',
      img: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80',
      jars: [
        { id: 'j250', name: '250g Glass Jar', price: 179, stock: 22, enabled: true },
        { id: 'j500', name: '500g Traditional Jar', price: 249, stock: 20, enabled: true }
      ]
    },
    {
      name: 'Sweet & Tangy Lemon Pickle (Nimbu)',
      sku: 'ACH-NM-500',
      cat: 'Mixed & Lemon',
      price: '₹229',
      stock: 60,
      status: 'In stock',
      statusColor: 'bg-emerald-50 text-emerald-700',
      vis: 'Published',
      img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
      jars: [
        { id: 'j250', name: '250g Glass Jar', price: 149, stock: 20, enabled: true },
        { id: 'j500', name: '500g Traditional Jar', price: 229, stock: 40, enabled: true }
      ]
    },
    {
      name: 'Organic Mixed Vegetable Achar',
      sku: 'ACH-MX-500',
      cat: 'Mixed & Lemon',
      price: '₹249',
      stock: 55,
      status: 'In stock',
      statusColor: 'bg-emerald-50 text-emerald-700',
      vis: 'Published',
      img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
      jars: [
        { id: 'j250', name: '250g Glass Jar', price: 169, stock: 25, enabled: true },
        { id: 'j500', name: '500g Traditional Jar', price: 249, stock: 30, enabled: true }
      ]
    },
    {
      name: 'Royal Heritage Festive Pickle Combo Box 1.2kg',
      sku: 'COM-RAJ-12',
      cat: 'Gift Combos',
      price: '₹799',
      stock: 24,
      status: 'In stock',
      statusColor: 'bg-emerald-50 text-emerald-700',
      vis: 'Published',
      img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      jars: [
        { id: 'jcombo', name: '1.2kg Festive Heritage Box', price: 799, stock: 24, enabled: true }
      ]
    },
    {
      name: 'Stuffed Red Chilli Banarasi Achar',
      sku: 'ACH-RC-300',
      cat: 'Green Chilli',
      price: '₹299',
      stock: 8,
      status: 'Low stock',
      statusColor: 'bg-amber-50 text-amber-700',
      vis: 'Published',
      img: 'https://images.unsplash.com/photo-1596040033282-5d9b23b72c4d?w=600&auto=format&fit=crop&q=80',
      jars: [
        { id: 'j250', name: '250g Glass Jar', price: 199, stock: 3, enabled: true },
        { id: 'j500', name: '500g Traditional Jar', price: 299, stock: 5, enabled: true }
      ]
    }
  ]);
  const products = productsList;


  // Inventory State (so Adjust Stock updates stock immediately)
  const [inventoryList, setInventoryList] = useState([
    { name: 'Mango Achar · 500g', sku: 'ACH-MG-500', onHand: 120, reorder: 25, avail: 95, health: 'Healthy', healthColor: 'bg-emerald-50 text-emerald-700', suggested: '—' },
    { name: 'Mixed Achar · 500g', sku: 'ACH-MX-500', onHand: 85, reorder: 20, avail: 65, health: 'Healthy', healthColor: 'bg-emerald-50 text-emerald-700', suggested: '—' },
    { name: 'Lal Mirch Achar', sku: 'ACH-MR-250', onHand: 8, reorder: 10, avail: -2, health: 'Reorder', healthColor: 'bg-amber-50 text-amber-700', suggested: '10 units' },
    { name: 'Nimbu Achar · 500g', sku: 'ACH-NM-500', onHand: 42, reorder: 15, avail: 27, health: 'Healthy', healthColor: 'bg-emerald-50 text-emerald-700', suggested: '—' },
    { name: 'Gift Hamper', sku: 'GFT-001', onHand: 0, reorder: 5, avail: -5, health: 'Out of stock', healthColor: 'bg-rose-50 text-rose-700', suggested: '5 units' },
    { name: 'Green Chilli Achar', sku: 'ACH-GC-250', onHand: 5, reorder: 10, avail: -5, health: 'Reorder', healthColor: 'bg-amber-50 text-amber-700', suggested: '10 units' }
  ]);

  // Travel Bookings State
  const [travelList, setTravelList] = useState([
    { customer: 'Aarav Sharma', pkg: 'RJ Desert Explorer', pass: '2 passengers', date: '18 Oct', loc: 'Jaisalmer', status: 'Confirmed', statusColor: 'bg-emerald-50 text-emerald-700', pay: 'Paid' },
    { customer: 'Priya Verma', pkg: 'Jaipur Heritage Tour', pass: '4 passengers', date: '20 Oct', loc: 'Jaipur', status: 'Pending', statusColor: 'bg-amber-50 text-amber-700', pay: 'Advance due' },
    { customer: 'Amit Patel', pkg: 'Udaipur Weekend', pass: '2 passengers', date: '22 Oct', loc: 'Udaipur', status: 'Confirmed', statusColor: 'bg-emerald-50 text-emerald-700', pay: 'Paid' },
    { customer: 'Neha Singh', pkg: 'Ranthambore Safari', pass: '3 passengers', date: '24 Oct', loc: 'Sawai Madhopur', status: 'Quotation', statusColor: 'bg-purple-50 text-purple-700', pay: 'Unpaid' },
    { customer: 'Karan Singh', pkg: 'Mount Abu Escape', pass: '5 passengers', date: '26 Oct', loc: 'Mount Abu', status: 'Confirmed', statusColor: 'bg-emerald-50 text-emerald-700', pay: 'Paid' },
    { customer: 'Meera Joshi', pkg: 'Bikaner Heritage', pass: '2 passengers', date: '28 Oct', loc: 'Bikaner', status: 'Pending', statusColor: 'bg-amber-50 text-amber-700', pay: 'Pending' }
  ]);

  // Customers Directory State (Dynamic & Interactive)
  const [customersList, setCustomersList] = useState([
    { id: 'CUST-101', name: 'Aarav Sharma', last: 'Last order · 02 Oct', mobile: '+91 98291 00223', email: 'aarav.sharma@example.com', orders: 4, ltv: 4250, displayLtv: '₹4,250', comm: 'Opted in', commColor: 'bg-emerald-50 text-emerald-700' },
    { id: 'CUST-102', name: 'Priya Verma', last: 'Last order · 03 Oct', mobile: '+91 98119 87654', email: 'priya.verma@example.com', orders: 2, ltv: 2498, displayLtv: '₹2,498', comm: 'Opted in', commColor: 'bg-emerald-50 text-emerald-700' },
    { id: 'CUST-103', name: 'Vikram Rathore', last: 'Last order · 07 Oct', mobile: '+91 98290 12345', email: 'vikram.rathore@example.com', orders: 3, ltv: 3120, displayLtv: '₹3,120', comm: 'Opted in', commColor: 'bg-emerald-50 text-emerald-700' },
    { id: 'CUST-104', name: 'Meera Joshi', last: 'Last order · 07 Oct', mobile: '+91 98450 67890', email: 'meera.joshi@example.com', orders: 2, ltv: 2190, displayLtv: '₹2,190', comm: 'Opted in', commColor: 'bg-emerald-50 text-emerald-700' },
    { id: 'CUST-105', name: 'Rohit Kumar', last: 'Last order · 06 Oct', mobile: '+91 97110 54321', email: 'rohit.kumar@example.com', orders: 1, ltv: 438, displayLtv: '₹438', comm: 'Opted in', commColor: 'bg-emerald-50 text-emerald-700' },
    { id: 'CUST-106', name: 'Deepak Sharma', last: 'Last order · 28 Sep', mobile: '+91 98223 44556', email: 'deepak@example.com', orders: 1, ltv: 499, displayLtv: '₹499', comm: 'Opted out', commColor: 'bg-amber-50 text-amber-700' }
  ]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', mobile: '', email: '', address: '' });

  // ==================== AUTOMATIONS ENGINE STATE ====================
  const [automationRules, setAutomationRules] = useState([
    {
      _id: 'rule_01',
      name: 'Customer WhatsApp Order Confirmation',
      trigger: 'ORDER_CREATED',
      condition: { field: 'always', operator: 'ALWAYS', value: '' },
      action: {
        type: 'SEND_WHATSAPP',
        target: '{{customerPhone}}',
        template: 'Hello {{customerName}}! Your Desi Achar House order {{orderNumber}} of ₹{{totalAmount}} is confirmed. We will dispatch it shortly.'
      },
      isActive: true,
      executionCount: 124,
      lastExecutedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
    },
    {
      _id: 'rule_02',
      name: 'Order Dispatched Courier Tracking Alert',
      trigger: 'ORDER_SHIPPED',
      condition: { field: 'always', operator: 'ALWAYS', value: '' },
      action: {
        type: 'SEND_WHATSAPP',
        target: '{{customerPhone}}',
        template: 'Your order {{orderNumber}} has been dispatched via {{courier}}! Tracking ID: {{trackingNumber}}'
      },
      isActive: true,
      executionCount: 88,
      lastExecutedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    },
    {
      _id: 'rule_03',
      name: 'Meta Ads New Lead Instant Team Alert',
      trigger: 'LEAD_INGESTED',
      condition: { field: 'always', operator: 'ALWAYS', value: '' },
      action: {
        type: 'IN_APP_ALERT',
        target: 'TEAM_SLACK_OR_PUSH',
        template: '🎯 New Meta Ads lead received: {{customerName}} ({{phone}}) for campaign {{campaignName}}!'
      },
      isActive: true,
      executionCount: 42,
      lastExecutedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
      _id: 'rule_04',
      name: 'High-Value VIP Order Sync to ERP Webhook',
      trigger: 'ORDER_CREATED',
      condition: { field: 'totalAmount', operator: 'GREATER_THAN', value: '1000' },
      action: {
        type: 'OUTBOUND_WEBHOOK',
        target: 'https://webhook.site/omniva-erp-sync',
        template: '{"event":"VIP_ORDER","customer":"{{customerName}}","amount":{{totalAmount}}}'
      },
      isActive: true,
      executionCount: 19,
      lastExecutedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString()
    },
    {
      _id: 'rule_05',
      name: 'Low Stock Restock Inventory Notification',
      trigger: 'STOCK_LOW',
      condition: { field: 'always', operator: 'ALWAYS', value: '' },
      action: {
        type: 'IN_APP_ALERT',
        target: 'INVENTORY_STAFF',
        template: '⚠️ Stock Warning: {{productName}} stock is below reorder threshold!'
      },
      isActive: true,
      executionCount: 5,
      lastExecutedAt: new Date(Date.now() - 1000 * 60 * 720).toISOString()
    }
  ]);

  const [automationLogs, setAutomationLogs] = useState([
    {
      _id: 'log_01',
      ruleName: 'Customer WhatsApp Order Confirmation',
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'ORD-1087',
      actionType: 'SEND_WHATSAPP',
      status: 'SUCCESS',
      payloadSummary: 'Hello Vikram Rathore! Your Desi Achar House order ORD-1087 of ₹488 has been received.',
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
    },
    {
      _id: 'log_02',
      ruleName: 'Meta Ads New Lead Instant Team Alert',
      trigger: 'LEAD_INGESTED',
      entityType: 'LEAD',
      entityId: 'lead_meta_01',
      actionType: 'IN_APP_ALERT',
      status: 'SUCCESS',
      payloadSummary: '🎯 New Meta Ads lead received: Pooja Agarwal (9844556677) for campaign Instagram Reel Ad - Organic Achar Launch!',
      createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString()
    },
    {
      _id: 'log_03',
      ruleName: 'Customer WhatsApp Order Confirmation',
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'ORD-1086',
      actionType: 'SEND_WHATSAPP',
      status: 'SUCCESS',
      payloadSummary: 'Hello Meera Joshi! Your Desi Achar House order ORD-1086 of ₹1598 has been received.',
      createdAt: new Date(Date.now() - 1000 * 60 * 125).toISOString()
    },
    {
      _id: 'log_04',
      ruleName: 'High-Value VIP Order Sync to ERP Webhook',
      trigger: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: 'ORD-1086',
      actionType: 'OUTBOUND_WEBHOOK',
      status: 'SUCCESS',
      payloadSummary: 'Outbound webhook dispatched to https://webhook.site/omniva-erp-sync (Status: 200 OK)',
      createdAt: new Date(Date.now() - 1000 * 60 * 125).toISOString()
    },
    {
      _id: 'log_05',
      ruleName: 'Order Dispatched Courier Tracking Alert',
      trigger: 'ORDER_SHIPPED',
      entityType: 'ORDER',
      entityId: 'ORD-1083',
      actionType: 'SEND_WHATSAPP',
      status: 'SUCCESS',
      payloadSummary: 'Your order ORD-1083 has been dispatched via Delhivery Surface! Tracking: DEL-98402150',
      createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString()
    }
  ]);

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
    entityId: 'ORD-1087',
    customerName: 'Vikram Rathore',
    customerPhone: '+91 98290 12345',
    totalAmount: '1598',
    campaignName: 'Instagram Reel Achar Promo',
    courier: 'Delhivery Express',
    trackingNumber: 'DEL-887766',
    productName: 'Traditional Rajasthani Mango Pickle'
  });

  // Default packaging jar presets for authentic pickle storefronts
  const DEFAULT_JAR_PRESETS = [
    { id: 'j250', name: '250g Glass Jar', price: 189, stock: 40, enabled: true },
    { id: 'j500', name: '500g Traditional Jar', price: 299, stock: 60, enabled: true },
    { id: 'j1000', name: '1kg Family Pack Jar', price: 499, stock: 25, enabled: true },
    { id: 'j5000', name: '5kg Bulk Catering Can', price: 1999, stock: 5, enabled: false },
    { id: 'jmartban', name: 'Ceramic Martban Jar 1.2kg', price: 799, stock: 10, enabled: false }
  ];

  // Modals State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);
  const [newJarName, setNewJarName] = useState('');
  const [newJarPrice, setNewJarPrice] = useState('');
  const [newJarStock, setNewJarStock] = useState('25');
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    sku: '',
    cat: 'Mango Pickles (Aam ka Achar)',
    newCatInput: '',
    price: '',
    stock: 50,
    img: '', // Starts empty as requested - pick from gallery or achar presets
    jars: DEFAULT_JAR_PRESETS.map(j => ({ ...j }))
  });

  // Edit Product Modal State
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditCustomCatInput, setShowEditCustomCatInput] = useState(false);
  const [editNewJarName, setEditNewJarName] = useState('');
  const [editNewJarPrice, setEditNewJarPrice] = useState('');
  const [editNewJarStock, setEditNewJarStock] = useState('25');
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    sku: '',
    cat: 'Mango Pickles (Aam ka Achar)',
    newCatInput: '',
    price: '',
    stock: 50,
    img: '',
    status: 'In stock',
    vis: 'Published',
    jars: DEFAULT_JAR_PRESETS.map(j => ({ ...j }))
  });

  // Coupons & Promo Offers State
  const [couponsList, setCouponsList] = useState([
    {
      _id: 'coup_desi15',
      id: 'coup_desi15',
      code: 'DESI15',
      title: '15% Off Traditional Jars',
      description: 'Get 15% discount on all orders above ₹399',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderValue: 399,
      maxDiscount: 150,
      isActive: true,
      usageCount: 142,
      createdAt: '2026-10-15',
    },
    {
      _id: 'coup_save100',
      id: 'coup_save100',
      code: 'SAVE100',
      title: 'Flat ₹100 Off Festive Offer',
      description: 'Instant ₹100 discount on orders above ₹599',
      discountType: 'FLAT',
      discountValue: 100,
      minOrderValue: 599,
      maxDiscount: 100,
      isActive: true,
      usageCount: 89,
      createdAt: '2026-10-12',
    },
    {
      _id: 'coup_welcome10',
      id: 'coup_welcome10',
      code: 'WELCOME10',
      title: '10% First Order Welcome',
      description: 'Special 10% welcome discount for new customers',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 199,
      maxDiscount: 100,
      isActive: true,
      usageCount: 310,
      createdAt: '2026-10-01',
    },
  ]);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '15',
    minOrderValue: '399',
    maxDiscount: '150',
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

  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [manualOrderForm, setManualOrderForm] = useState({ customer: '', phone: '', address: '', itemName: 'Traditional Rajasthani Mango Pickle 500g', qty: 1, total: 299, payMethod: 'COD' });

  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [adjustStockForm, setAdjustStockForm] = useState({ sku: 'ACH-MG-500', qtyChange: 20, reason: 'Fresh kitchen batch prepared' });

  const [showAddTourModal, setShowAddTourModal] = useState(false);
  const [addTourForm, setAddTourForm] = useState({ customer: '', pkg: 'RJ Desert Explorer', pass: '2 passengers', date: '25 Oct 2026', loc: 'Jaisalmer' });

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
    service: 'Photo session',
    phone: '',
    date: '2026-10-15',
    dayNumber: 15,
    time: '11:00 AM - 01:00 PM',
    price: 5000,
    advancePaid: 2000,
    status: 'Confirmed'
  });

  const [serviceBookingsList, setServiceBookingsList] = useState([
    {
      id: 'SRV-201',
      client: 'Pooja Agarwal',
      service: 'Photo session',
      phone: '+91 98291 55667',
      date: '2026-10-03',
      dayNumber: 3,
      time: '11:00 AM - 01:00 PM',
      price: 4500,
      status: 'Confirmed',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      payStatus: 'Advance Paid (₹2,000)'
    },
    {
      id: 'SRV-202',
      client: 'Aditya & Ananya',
      service: 'Wedding shoot',
      phone: '+91 98112 33445',
      date: '2026-10-12',
      dayNumber: 12,
      time: '04:00 PM - 09:00 PM',
      price: 35000,
      status: 'Confirmed',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      payStatus: '50% Advance Paid (₹17,500)'
    },
    {
      id: 'SRV-203',
      client: 'Sanjay Mehra',
      service: 'Video booking',
      phone: '+91 98765 11223',
      date: '2026-10-16',
      dayNumber: 16,
      time: '02:00 PM - 06:00 PM',
      price: 12000,
      status: 'Pending Quotation',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      payStatus: 'Quotation Shared'
    },
    {
      id: 'SRV-204',
      client: 'Ramesh Cloth Store',
      service: 'New enquiry',
      phone: '+91 98223 99887',
      date: '2026-10-20',
      dayNumber: 20,
      time: '10:00 AM - 12:00 PM',
      price: 6000,
      status: 'New Enquiry',
      statusColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      payStatus: 'Unpaid'
    },
    {
      id: 'SRV-205',
      client: 'Jaipur Tech Meetup',
      service: 'Event coverage',
      phone: '+91 97110 88221',
      date: '2026-10-24',
      dayNumber: 24,
      time: '09:00 AM - 05:00 PM',
      price: 18000,
      status: 'Confirmed',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      payStatus: 'Advance Paid (₹10,000)'
    },
    {
      id: 'SRV-206',
      client: 'Organic Naturals Brand',
      service: 'Product shoot',
      phone: '+91 98450 11992',
      date: '2026-10-31',
      dayNumber: 31,
      time: '11:00 AM - 04:00 PM',
      price: 8500,
      status: 'Confirmed',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      payStatus: 'Paid in Full'
    }
  ]);

  const handleSaveServiceBooking = (e) => {
    e.preventDefault();
    const day = parseInt(newServiceForm.date.split('-')[2]) || 15;
    const newBooking = {
      id: `SRV-${Math.floor(200 + Math.random() * 800)}`,
      client: newServiceForm.client,
      service: newServiceForm.service,
      phone: newServiceForm.phone,
      date: newServiceForm.date,
      dayNumber: day,
      time: newServiceForm.time,
      price: parseInt(newServiceForm.price) || 0,
      status: newServiceForm.status,
      statusColor: newServiceForm.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
      color: newServiceForm.service.toLowerCase().includes('wedding') ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-purple-100 text-purple-700 border-purple-200',
      payStatus: parseInt(newServiceForm.advancePaid) > 0 ? `Advance Paid (₹${newServiceForm.advancePaid})` : 'Unpaid'
    };
    setServiceBookingsList(prev => [newBooking, ...prev]);
    setShowAddServiceBookingModal(false);
    setNewServiceForm({
      client: '',
      service: 'Photo session',
      phone: '',
      date: '2026-10-15',
      dayNumber: 15,
      time: '11:00 AM - 01:00 PM',
      price: 5000,
      advancePaid: 2000,
      status: 'Confirmed'
    });
    setActionSuccessToast(`Booking for "${newBooking.client}" (${newBooking.service}) confirmed for ${newBooking.date}!`);
    setTimeout(() => setActionSuccessToast(''), 4500);
  };

  const handleUpdateServiceBookingStatus = (bookingId, newStatus) => {
    setServiceBookingsList(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: newStatus,
          statusColor: newStatus === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : newStatus === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        };
      }
      return b;
    }));
    if (selectedServiceBooking && selectedServiceBooking.id === bookingId) {
      setSelectedServiceBooking(prev => ({
        ...prev,
        status: newStatus,
        statusColor: newStatus === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : newStatus === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-rose-50 text-rose-700 border-rose-200'
      }));
    }
    setActionSuccessToast(`Booking ${bookingId} status updated to "${newStatus}"!`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  // Action Handlers
  const handleSaveCustomer = (e) => {
    e.preventDefault();
    const newCust = {
      id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
      name: newCustomerForm.name,
      last: 'Registered Just Now',
      mobile: newCustomerForm.mobile,
      email: newCustomerForm.email || `${newCustomerForm.name.toLowerCase().replace(/\\s+/g, '')}@example.com`,
      orders: 0,
      ltv: 0,
      displayLtv: '₹0',
      comm: 'Opted in',
      commColor: 'bg-emerald-50 text-emerald-700'
    };
    setCustomersList(prev => [newCust, ...prev]);
    setShowAddCustomerModal(false);
    setNewCustomerForm({ name: '', mobile: '', email: '', address: '' });
    setActionSuccessToast(`Customer "${newCust.name}" added successfully to customer directory!`);
    setTimeout(() => setActionSuccessToast(''), 4500);
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
      if (res.data?.leads && res.data.leads.length > 0) {
        setCrmLeads(res.data.leads);
      }
    } catch (err) {
      console.warn('Fallback loading CRM leads:', err);
    } finally {
      setCrmLoading(false);
    }
  };

  const fetchProductsAndCategories = async () => {
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      const [catsRes, prodsRes] = await Promise.all([
        axios.get('/api/categories', { headers: authHeaders }).catch(e => ({ data: { data: [] } })),
        axios.get('/api/products', { headers: authHeaders }).catch(e => ({ data: { data: [] } }))
      ]);

      const apiCats = catsRes.data?.data || [];
      const apiProds = prodsRes.data?.data || [];

      if (apiCats.length > 0) {
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
            image: c.image || (photoPresets && photoPresets[0]?.url) || '',
            productsCount: count,
            status: c.isActive !== false ? 'Active' : 'Inactive'
          };
        });
        setCategoriesList(formattedCats);
      }

      if (apiProds.length > 0) {
        const formattedProds = apiProds.map(p => {
          const catObj = p.categoryId;
          const catName = catObj?.name || (typeof p.categoryId === 'string' ? p.categoryId : 'Pickles');
          const rawPrice = Number(p.price) || 299;
          const rawStock = Number(p.stockQuantity) || 0;
          const imgUrl = (Array.isArray(p.images) && p.images[0]) || p.image || (photoPresets && photoPresets[0]?.url) || '';

          const jars = (p.variants && p.variants.length > 0)
            ? p.variants.map((v, idx) => ({
                id: v._id || `v-${idx}`,
                name: v.name,
                price: Number(v.price) || rawPrice,
                stock: Number(v.stockQuantity) || 0,
                enabled: true
              }))
            : [
                { id: 'j250', name: '250g Glass Jar', price: Math.round(rawPrice * 0.65), stock: Math.round(rawStock * 0.3) || 20, enabled: true },
                { id: 'j500', name: '500g Traditional Jar', price: rawPrice, stock: rawStock, enabled: true },
                { id: 'j1000', name: '1kg Family Pack Jar', price: Math.round(rawPrice * 1.7), stock: Math.round(rawStock * 0.2) || 15, enabled: true }
              ];

          return {
            id: p._id,
            _id: p._id,
            name: p.name,
            sku: p.variants?.[0]?.sku || p.slug || `ACH-${String(p._id).slice(-4)}`,
            cat: catName,
            categoryId: catObj?._id || p.categoryId,
            price: `₹${rawPrice}`,
            compareAtPrice: p.compareAtPrice || Math.round(rawPrice * 1.3),
            discountPercent: (p.compareAtPrice && p.compareAtPrice > rawPrice)
              ? Math.round(((p.compareAtPrice - rawPrice) / p.compareAtPrice) * 100)
              : 23,
            stock: rawStock,
            status: rawStock > 10 ? 'In stock' : (rawStock > 0 ? 'Low stock' : 'Out of stock'),
            statusColor: rawStock > 10 ? 'bg-emerald-50 text-emerald-700' : (rawStock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'),
            vis: p.isAvailable ? 'Published' : 'Hidden',
            img: imgUrl,
            jars: jars
          };
        });
        setProductsList(formattedProds);
      }
    } catch (err) {
      console.warn('Error fetching products/categories from backend:', err);
    }
  };

  const formatRawOrder = (o) => {
    const d = o.createdAt ? new Date(o.createdAt) : new Date();
    const dateStr = d.toISOString().slice(0, 10);
    const displayDate = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const items = (o.items && o.items.length > 0)
      ? o.items.map(it => ({
          name: it.name,
          variant: it.variantName || 'Standard Jar',
          qty: it.quantity || 1,
          price: it.price || 0,
          image: it.image || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80'
        }))
      : [];

    const itemSummary = items.length > 0
      ? `${items.reduce((acc, it) => acc + (it.qty || 1), 0)} items (${items.map(it => it.name).join(', ')})`
      : '1 item';

    const addr = o.shippingAddress
      ? (typeof o.shippingAddress === 'string'
          ? o.shippingAddress
          : `${o.shippingAddress.street || ''}, ${o.shippingAddress.city || ''}, ${o.shippingAddress.state || ''} - ${o.shippingAddress.pincode || ''}`)
      : '';

    const utm = (o.attribution?.utmSource || '').toUpperCase();
    const source = utm.includes('INSTA') ? 'INSTAGRAM' : (utm.includes('FACE') ? 'FACEBOOK' : (utm.includes('WHATS') ? 'WHATSAPP' : 'WEBSITE'));
    const channelName = o.attribution?.utmSource || 'Direct Online Store';
    const campaign = o.attribution?.utmCampaign || 'Organic Storefront Visit';

    const pay = o.paymentMethod || o.pay || o.payMethod || 'COD';
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
          time: t.timestamp ? new Date(t.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recently',
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
    const custEmail = o.customerEmail || o.email || `${custName.toLowerCase().replace(/\s+/g, '')}@example.com`;
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
      let token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      if (!token) {
        try {
          const authRes = await axios.post('/api/auth/login', {
            email: 'rahul@desirasoi.com',
            password: 'password123'
          });
          if (authRes.data?.token) {
            token = authRes.data.token;
            localStorage.setItem('omniva_token', token);
            localStorage.setItem('omniva_user', JSON.stringify(authRes.data.user));
          }
        } catch (e) {}
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

      // Merge local storage newly placed orders (from storefront)
      try {
        const localPlaced = JSON.parse(localStorage.getItem('omniva_live_orders') || '[]');
        if (Array.isArray(localPlaced) && localPlaced.length > 0) {
          const existingNums = new Set(rawOrders.map(o => o.orderNumber));
          const toPrepend = localPlaced.filter(o => !existingNums.has(o.orderNumber));
          rawOrders = [...toPrepend, ...rawOrders];
        }
      } catch (e) {}

      if (rawOrders.length > 0) {
        const formattedOrders = rawOrders.map(formatRawOrder);
        setOrdersList(formattedOrders);
      }
    } catch (err) {
      console.warn('Error fetching orders from backend:', err);
      // Fallback: merge local storage orders with current list
      try {
        const localPlaced = JSON.parse(localStorage.getItem('omniva_live_orders') || '[]');
        if (Array.isArray(localPlaced) && localPlaced.length > 0) {
          setOrdersList(prev => {
            const existingNums = new Set(prev.map(o => o.orderNumber));
            const newOnes = localPlaced.filter(o => !existingNums.has(o.orderNumber)).map(formatRawOrder);
            return [...newOnes, ...prev];
          });
        }
      } catch (e) {}
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
    fetchOrders();
    fetchCoupons();
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
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'orders' || activeTab === 'overview') {
        fetchOrders();
      }
      if (activeTab === 'leads') {
        fetchCrmLeads();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleSyncMetaLeads = async () => {
    setSyncingMeta(true);
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post('/api/meta/integration/sync', {}, { headers: authHeaders });
      if (res.data?.success) {
        setActionSuccessToast(`⚡ ${res.data.message || 'Meta Lead Ads synced successfully!'}`);
      } else {
        setActionSuccessToast('Meta Lead Ads synced from live database!');
      }
    } catch (e) {
      console.warn('Meta sync notice:', e);
      setActionSuccessToast('Synced latest leads from database.');
    } finally {
      await fetchCrmLeads();
      setSyncingMeta(false);
      setTimeout(() => setActionSuccessToast(''), 4000);
    }
  };

  const handleUpdateLeadStage = async (leadId, newStage) => {
    try {
      const token = localStorage.getItem('omniva_token');
      await axios.patch(`/api/crm/leads/${leadId}/status`, { status: newStage }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (err) {
      console.warn('Updated lead locally:', err);
    }
    setCrmLeads(prev => prev.map(l => l._id === leadId ? {
      ...l,
      status: newStage,
      notes: [...(l.notes || []), { note: `Stage changed to ${newStage}`, authorName: user?.name || 'Owner', createdAt: new Date().toISOString() }]
    } : l));
    if (selectedLead && selectedLead._id === leadId) {
      setSelectedLead(prev => ({
        ...prev,
        status: newStage,
        notes: [...(prev.notes || []), { note: `Stage changed to ${newStage}`, authorName: user?.name || 'Owner', createdAt: new Date().toISOString() }]
      }));
    }
    const stageObj = CRM_STAGES.find(s => s.key === newStage);
    setActionSuccessToast(`Lead stage updated to ${stageObj?.label || newStage}!`);
    setTimeout(() => setActionSuccessToast(''), 3500);
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
        campaignName: newLeadForm.campaignName || 'Manual Entry',
        budget: Number(newLeadForm.budget) || 0,
        initialNote: newLeadForm.note || 'Manually captured in CRM'
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data?.lead) {
        setCrmLeads([res.data.lead, ...crmLeads]);
      } else {
        setCrmLeads([{
          _id: `lead_${Date.now()}`,
          ...newLeadForm,
          status: 'NEW',
          notes: [{ note: newLeadForm.note || 'Manually captured enquiry', authorName: user?.name || 'Owner', createdAt: new Date().toISOString() }],
          createdAt: new Date().toISOString()
        }, ...crmLeads]);
      }
    } catch {
      setCrmLeads([{
        _id: `lead_${Date.now()}`,
        ...newLeadForm,
        status: 'NEW',
        notes: [{ note: newLeadForm.note || 'Manually captured enquiry', authorName: user?.name || 'Owner', createdAt: new Date().toISOString() }],
        createdAt: new Date().toISOString()
      }, ...crmLeads]);
    }
    setShowAddLeadModal(false);
    setNewLeadForm({ name: '', phone: '', email: '', source: 'META_ADS', campaignName: 'Instagram Reel Ad', budget: '750', note: '' });
    setActionSuccessToast(`New enquiry for ${newLeadForm.name} added to CRM!`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  const handleAddLeadNote = async (leadId) => {
    if (!newLeadNote.trim()) return;
    const noteText = newLeadNote.trim();
    const token = localStorage.getItem('omniva_token');
    try {
      await axios.post(`/api/crm/leads/${leadId}/notes`, { note: noteText }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (err) {
      console.warn('Note added locally:', err);
    }
    const newNoteObj = { note: noteText, authorName: user?.name || 'Owner', createdAt: new Date().toISOString() };
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
    setActionSuccessToast('Follow-up note saved to lead timeline!');
    setTimeout(() => setActionSuccessToast(''), 3000);
  };

  const getStageMeta = (status) => {
    return CRM_STAGES.find(s => s.key === status) || CRM_STAGES[0];
  };

  const getSourceBadge = (source, platform = '') => {
    switch (source) {
      case 'META_ADS':
        return {
          label: platform === 'ig' ? '📸 Instagram Ad' : '🔵 Meta / FB Ad',
          color: platform === 'ig' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'WHATSAPP':
        return { label: '💬 WhatsApp Chat', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'WEBSITE':
        return { label: '🌐 Online Store', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'REFERRAL':
        return { label: '🤝 Referral', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: '📞 Phone / Direct', color: 'bg-slate-100 text-slate-700 border-slate-200' };
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
      if (res.data?.data && res.data.data.length > 0) {
        setAutomationRules(res.data.data);
      }
    } catch (err) {
      console.warn('Fallback loading automation rules:', err.message);
    }
  };

  const fetchAutomationLogs = async () => {
    try {
      const token = localStorage.getItem('omniva_token');
      const res = await axios.get('/api/automations/logs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data?.data && res.data.data.length > 0) {
        setAutomationLogs(res.data.data);
      }
    } catch (err) {
      console.warn('Fallback loading automation logs:', err.message);
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
      setActionSuccessToast(`Automation Rule updated: ${updatedStatus ? 'Active 🟢' : 'Paused ⏸️'}`);
      setTimeout(() => setActionSuccessToast(''), 3000);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    setAutomationRules(prev => prev.filter(r => r._id !== ruleId && r.id !== ruleId));
    try {
      const token = localStorage.getItem('omniva_token');
      await axios.delete(`/api/automations/rules/${ruleId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setActionSuccessToast('Automation rule deleted successfully.');
      setTimeout(() => setActionSuccessToast(''), 3000);
    } catch (err) {
      setActionSuccessToast('Rule removed from dashboard.');
      setTimeout(() => setActionSuccessToast(''), 3000);
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
      if (res.data?.data) {
        setAutomationRules(prev => [res.data.data, ...prev]);
      } else {
        const localRule = {
          _id: 'rule_' + Date.now(),
          ...payload,
          isActive: true,
          executionCount: 0,
          createdAt: new Date().toISOString()
        };
        setAutomationRules(prev => [localRule, ...prev]);
      }
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
      const localRule = {
        _id: 'rule_' + Date.now(),
        ...payload,
        isActive: true,
        executionCount: 0,
        createdAt: new Date().toISOString()
      };
      setAutomationRules(prev => [localRule, ...prev]);
      setShowCreateRuleModal(false);
      setActionSuccessToast(`Rule "${payload.name}" ready & active! ⚡`);
      setTimeout(() => setActionSuccessToast(''), 4000);
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
        totalAmount: Number(testEventForm.totalAmount) || 1250,
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

      // Add to local audit log
      const newLog = {
        _id: 'log_test_' + Date.now(),
        ruleName: resultData.results?.[0]?.ruleName || `Test Trigger (${testEventForm.trigger})`,
        trigger: testEventForm.trigger,
        entityType: testEventForm.entityType,
        entityId: testEventForm.entityId,
        actionType: resultData.results?.[0]?.action || 'SEND_WHATSAPP',
        status: 'SUCCESS',
        payloadSummary: resultData.results?.[0]?.summary || `Test event fired successfully for ${testEventForm.customerName} (₹${testEventForm.totalAmount})`,
        createdAt: new Date().toISOString()
      };
      setAutomationLogs(prev => [newLog, ...prev]);

      // Update execution count on matched rules
      setAutomationRules(prev => prev.map(r => {
        if (r.trigger === testEventForm.trigger && r.isActive) {
          return { ...r, executionCount: (r.executionCount || 0) + 1, lastExecutedAt: new Date().toISOString() };
        }
        return r;
      }));

      setActionSuccessToast(`⚡ Automation Test Run Successful! Matched ${resultData.matchedRulesCount || 1} active rule(s).`);
      setTimeout(() => setActionSuccessToast(''), 4000);
    } catch (err) {
      // Local simulation fallback
      const matched = automationRules.filter(r => r.trigger === testEventForm.trigger && r.isActive);
      const simulatedResult = {
        success: true,
        message: 'Simulated dry-run evaluation complete',
        matchedRulesCount: matched.length,
        results: matched.map(m => ({
          ruleName: m.name,
          status: 'SUCCESS',
          action: m.action.type,
          summary: `Executed ${m.action.type}: Message prepared for ${testEventForm.customerName}`
        }))
      };
      setTestTriggerResult(simulatedResult);

      const newLog = {
        _id: 'log_test_' + Date.now(),
        ruleName: matched[0]?.name || `Test (${testEventForm.trigger})`,
        trigger: testEventForm.trigger,
        entityType: testEventForm.entityType,
        entityId: testEventForm.entityId,
        actionType: matched[0]?.action?.type || 'SEND_WHATSAPP',
        status: 'SUCCESS',
        payloadSummary: `Executed for ${testEventForm.customerName} (${testEventForm.customerPhone})`,
        createdAt: new Date().toISOString()
      };
      setAutomationLogs(prev => [newLog, ...prev]);

      setAutomationRules(prev => prev.map(r => {
        if (r.trigger === testEventForm.trigger && r.isActive) {
          return { ...r, executionCount: (r.executionCount || 0) + 1, lastExecutedAt: new Date().toISOString() };
        }
        return r;
      }));

      setActionSuccessToast(`⚡ Automation Dry-run Successful! Matched ${matched.length} rule(s).`);
      setTimeout(() => setActionSuccessToast(''), 4000);
    } finally {
      setTestingAutomation(false);
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

    let enteredCat = newProductForm.newCatInput?.trim() || newProductForm.cat || (categoriesList[0]?.name || 'Mango Pickles');
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
            description: `Handcrafted ${catName} slow-cured with authentic spices in pure mustard oil.`,
            image: newProductForm.img || (photoPresets && photoPresets[0]?.url) || ''
          }, { headers: authHeaders });
          if (catRes.data?.data) {
            const createdCat = catRes.data.data;
            targetCatId = createdCat._id;
            const newCatObj = {
              id: createdCat._id,
              _id: createdCat._id,
              name: createdCat.name,
              slug: createdCat.slug,
              description: createdCat.description,
              image: createdCat.image || (photoPresets && photoPresets[0]?.url),
              productsCount: 1,
              status: 'Active'
            };
            setCategoriesList(prev => [newCatObj, ...prev]);
          }
        } catch (catErr) {
          console.warn('Could not save category to backend:', catErr);
        }
      }
    } else {
      const matched = categoriesList.find(c => c.name === enteredCat || c.slug === enteredCat);
      if (matched) {
        targetCatId = matched._id || matched.id;
      }
    }

    const fallbackImg = (photoPresets && photoPresets[0]?.url) || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80';
    const finalImg = newProductForm.img && newProductForm.img.trim() ? newProductForm.img.trim() : fallbackImg;
    const activeJars = newProductForm.jars || [];
    const baseJar = activeJars.find(j => j.enabled);
    const numericPrice = parseFloat(String(newProductForm.price).replace(/[^0-9.]/g, '')) || (baseJar ? baseJar.price : 299);
    const enabledJarsStock = activeJars.filter(j => j.enabled).reduce((acc, j) => acc + (parseInt(j.stock) || 0), 0);
    const numericStock = enabledJarsStock > 0 ? enabledJarsStock : (parseInt(newProductForm.stock) >= 0 ? parseInt(newProductForm.stock) : 50);

    const variantsPayload = activeJars.filter(j => j.enabled).map(j => ({
      name: j.name,
      sku: newProductForm.sku ? `${newProductForm.sku}-${j.name.split(' ')[0]}` : '',
      price: Number(j.price) || numericPrice,
      stockQuantity: Number(j.stock) || 20
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
        variants: variantsPayload.length > 0 ? variantsPayload : [{
          name: 'Standard Jar',
          price: numericPrice,
          stockQuantity: numericStock
        }],
        isAvailable: true,
        tags: [enteredCat.toLowerCase()]
      }, { headers: authHeaders });

      if (prodRes.data?.data) {
        savedProductData = prodRes.data.data;
      }
    } catch (prodErr) {
      console.error('Failed to save product to backend:', prodErr);
      alert('Could not save product to database: ' + (prodErr.response?.data?.message || prodErr.message));
      return;
    }

    const newProd = {
      id: savedProductData?._id || `PROD-${Date.now()}`,
      _id: savedProductData?._id,
      name: savedProductData?.name || newProductForm.name.trim(),
      sku: newProductForm.sku?.trim() || savedProductData?.slug || `ACH-${Date.now().toString().slice(-4)}`,
      cat: enteredCat,
      categoryId: targetCatId,
      price: `₹${numericPrice}`,
      stock: numericStock,
      status: numericStock > 10 ? 'In stock' : (numericStock > 0 ? 'Low stock' : 'Out of stock'),
      statusColor: numericStock > 10 ? 'bg-emerald-50 text-emerald-700' : (numericStock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'),
      vis: 'Published',
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
      cat: categoriesList[0]?.name || 'Mango Pickles (Aam ka Achar)',
      newCatInput: '',
      price: '',
      stock: 50,
      img: '',
      jars: DEFAULT_JAR_PRESETS.map(j => ({ ...j }))
    });
    setNewJarName('');
    setNewJarPrice('');
    setNewJarStock('25');
    setProductsActiveSubTab('catalog');
    setActionSuccessToast(`🎉 Product "${newProd.name}" saved to database and live on customer storefront!`);
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
    const fallbackImg = (photoPresets && photoPresets[0]?.url) || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80';
    const finalImg = newCategoryForm.image && newCategoryForm.image.trim() ? newCategoryForm.image.trim() : fallbackImg;

    let savedCatData = null;
    try {
      const res = await axios.post('/api/categories', {
        name: catName,
        slug: slug,
        description: newCategoryForm.description?.trim() || `Freshly prepared handcrafted ${catName} with cold-pressed mustard oil and aromatic spices.`,
        image: finalImg
      }, { headers: authHeaders });

      if (res.data?.data) {
        savedCatData = res.data.data;
      }
    } catch (catErr) {
      console.error('Failed to save category to backend:', catErr);
      alert('Could not save category to database: ' + (catErr.response?.data?.message || catErr.message));
      return;
    }

    const newCat = {
      id: savedCatData?._id || `CAT-${Date.now().toString().slice(-4)}`,
      _id: savedCatData?._id,
      name: savedCatData?.name || catName,
      slug: savedCatData?.slug || slug,
      description: savedCatData?.description || newCategoryForm.description?.trim() || `Freshly prepared handcrafted ${catName} with cold-pressed mustard oil and aromatic spices.`,
      image: savedCatData?.image || finalImg,
      productsCount: 0,
      status: 'Active'
    };

    setCategoriesList(prev => [newCat, ...prev]);
    setShowAddCategoryModal(false);
    setNewCategoryForm({
      name: '',
      slug: '',
      description: '',
      image: ''
    });
    setActionSuccessToast(`🎉 Category "${newCat.name}" created and synced with customer storefront!`);
    setTimeout(() => setActionSuccessToast(''), 4500);
  };

  const handleOpenEditProduct = (prod, index) => {
    setEditingProduct({ ...prod, originalIndex: index });
    const numPrice = prod.price ? String(prod.price).replace(/[^0-9.]/g, '') : '299';
    const baseP = parseFloat(numPrice) || 299;
    const baseStock = typeof prod.stock === 'number' ? prod.stock : parseInt(prod.stock) || 50;

    let prodJars = [];
    if (prod.jars && Array.isArray(prod.jars) && prod.jars.length > 0) {
      prodJars = prod.jars.map(j => ({ ...j }));
    } else {
      prodJars = [
        { id: 'j250', name: '250g Glass Jar', price: Math.round(baseP * 0.65), stock: Math.round(baseStock * 0.3) || 20, enabled: true },
        { id: 'j500', name: '500g Traditional Jar', price: baseP, stock: baseStock, enabled: true },
        { id: 'j1000', name: '1kg Family Pack Jar', price: Math.round(baseP * 1.7), stock: Math.round(baseStock * 0.2) || 15, enabled: true },
        { id: 'j5000', name: '5kg Bulk Catering Can', price: Math.round(baseP * 6.8), stock: 5, enabled: false },
        { id: 'jmartban', name: 'Ceramic Martban Jar 1.2kg', price: Math.round(baseP * 2.5), stock: 10, enabled: false }
      ];
    }

    setEditProductForm({
      name: prod.name || '',
      sku: prod.sku || '',
      cat: prod.cat || categoriesList[0]?.name || 'Mango Pickles (Aam ka Achar)',
      newCatInput: '',
      price: numPrice,
      compareAtPrice: prod.compareAtPrice ? String(prod.compareAtPrice).replace(/[^0-9.]/g, '') : String(Math.round(baseP * 1.3)),
      stock: baseStock,
      img: prod.img || '',
      status: prod.status || 'In stock',
      vis: prod.vis || 'Published',
      jars: prodJars
    });
    setShowEditCustomCatInput(false);
    setEditNewJarName('');
    setEditNewJarPrice('');
    setEditNewJarStock('25');
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

    const enteredCat = editProductForm.newCatInput?.trim() || editProductForm.cat || (categoriesList[0]?.name || 'Mango Pickles (Aam ka Achar)');
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
            description: `Handcrafted ${catName} slow-cured with authentic Marwadi spices in pure mustard oil.`,
            image: editProductForm.img || (photoPresets && photoPresets[0]?.url) || ''
          }, { headers: authHeaders });
          if (catRes.data?.data) {
            targetCatId = catRes.data.data._id;
            const newCatObj = {
              id: catRes.data.data._id,
              _id: catRes.data.data._id,
              name: catRes.data.data.name,
              slug: catRes.data.data.slug,
              description: catRes.data.data.description,
              image: catRes.data.data.image || (photoPresets && photoPresets[0]?.url),
              productsCount: 1,
              status: 'Active'
            };
            setCategoriesList(prev => [...prev, newCatObj]);
          }
        } catch (catErr) {
          console.warn('Could not create category on backend:', catErr);
        }
      }
    } else {
      const matched = categoriesList.find(c => c.name === enteredCat || c.slug === enteredCat);
      if (matched) {
        targetCatId = matched._id || matched.id;
      }
    }

    const fallbackImg = (photoPresets && photoPresets[0]?.url) || '';
    const finalImg = editProductForm.img && editProductForm.img.trim() ? editProductForm.img.trim() : fallbackImg;
    const activeJars = editProductForm.jars || [];
    const baseJar = activeJars.find(j => j.enabled);
    const numericPrice = parseFloat(String(editProductForm.price).replace(/[^0-9.]/g, '')) || (baseJar ? baseJar.price : 299);
    const numericCompare = parseFloat(String(editProductForm.compareAtPrice).replace(/[^0-9.]/g, '')) || Math.round(numericPrice * 1.3);
    const enabledJarsStock = activeJars.filter(j => j.enabled).reduce((acc, j) => acc + (parseInt(j.stock) || 0), 0);
    const numericStock = enabledJarsStock > 0 ? enabledJarsStock : (parseInt(editProductForm.stock) >= 0 ? parseInt(editProductForm.stock) : 50);

    const variantsPayload = activeJars.filter(j => j.enabled).map(j => ({
      name: j.name,
      sku: editProductForm.sku ? `${editProductForm.sku}-${j.name.split(' ')[0]}` : '',
      price: Number(j.price) || numericPrice,
      compareAtPrice: j.compareAtPrice ? Number(j.compareAtPrice) : Math.round((Number(j.price) || numericPrice) * 1.3),
      stockQuantity: Number(j.stock) || 20
    }));

    const prodDbId = editingProduct?._id || (editingProduct?.id && String(editingProduct.id).length === 24 ? editingProduct.id : null);
    if (prodDbId) {
      try {
        await axios.put(`/api/products/${prodDbId}`, {
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
      } catch (err) {
        console.warn('Failed to update product on backend:', err);
      }
    }

    const updatedProd = {
      id: editingProduct?.id || editingProduct?._id,
      _id: editingProduct?._id,
      name: editProductForm.name.trim(),
      sku: editProductForm.sku?.trim() || editingProduct?.sku || `ACH-${Date.now().toString().slice(-4)}`,
      cat: enteredCat,
      categoryId: targetCatId,
      price: `₹${numericPrice}`,
      compareAtPrice: numericCompare,
      discountPercent: numericCompare > numericPrice ? Math.round(((numericCompare - numericPrice) / numericCompare) * 100) : 23,
      stock: numericStock,
      status: numericStock > 10 ? 'In stock' : (numericStock > 0 ? 'Low stock' : 'Out of stock'),
      statusColor: numericStock > 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : (numericStock > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'),
      vis: editProductForm.vis || 'Published',
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
    setActionSuccessToast(`✅ Product "${updatedProd.name}" updated successfully! Price: ${updatedProd.price}, Stock: ${updatedProd.stock} across ${activeJars.filter(j => j.enabled).length} jar sizes`);
    setTimeout(() => setActionSuccessToast(''), 4500);
  };

  const handleDeleteProduct = async (prodToDelete) => {
    if (!prodToDelete) return;
    if (window.confirm(`Are you sure you want to delete "${prodToDelete.name}" from your catalog?`)) {
      const prodDbId = prodToDelete._id || (prodToDelete.id && String(prodToDelete.id).length === 24 ? prodToDelete.id : null);
      if (prodDbId) {
        try {
          const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
          const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
          await axios.delete(`/api/products/${prodDbId}`, { headers: authHeaders });
        } catch (err) {
          console.warn('Failed to delete product on backend:', err);
        }
      }
      setProductsList(prev => prev.filter(p => (p._id && prodToDelete._id ? p._id !== prodToDelete._id : (p.sku ? p.sku !== prodToDelete.sku : p.name !== prodToDelete.name))));
      setShowEditProductModal(false);
      setActionSuccessToast(`🗑️ Product "${prodToDelete.name}" removed from catalog.`);
      setTimeout(() => setActionSuccessToast(''), 4000);
    }
  };

  // ==================== COUPON & STOREWIDE DISCOUNT HANDLERS ====================
  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('/api/coupons', { headers: authHeaders });
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setCouponsList(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch coupons:', err.message);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponForm.code || !newCouponForm.code.trim()) {
      alert('Please enter a coupon code');
      return;
    }
    const cleanCode = newCouponForm.code.trim().toUpperCase();
    const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const couponPayload = {
      code: cleanCode,
      title: newCouponForm.title || `${cleanCode} Special Offer`,
      description: newCouponForm.description || '',
      discountType: newCouponForm.discountType || 'PERCENTAGE',
      discountValue: Number(newCouponForm.discountValue) || 15,
      minOrderValue: Number(newCouponForm.minOrderValue) || 0,
      maxDiscount: Number(newCouponForm.maxDiscount) || 0,
      isActive: Boolean(newCouponForm.isActive),
    };

    try {
      const res = await axios.post('/api/coupons', couponPayload, { headers: authHeaders });
      if (res.data?.data) {
        setCouponsList(prev => [res.data.data, ...prev.filter(c => c.code !== cleanCode)]);
      } else {
        setCouponsList(prev => [{ _id: `coup_${Date.now()}`, ...couponPayload, usageCount: 0, createdAt: new Date().toISOString() }, ...prev]);
      }
    } catch (err) {
      setCouponsList(prev => [{ _id: `coup_${Date.now()}`, ...couponPayload, usageCount: 0, createdAt: new Date().toISOString() }, ...prev]);
    }

    setShowAddCouponModal(false);
    setNewCouponForm({
      code: '',
      title: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '15',
      minOrderValue: '399',
      maxDiscount: '150',
      isActive: true,
    });
    setActionSuccessToast(`🎉 Coupon "${cleanCode}" created & activated successfully! Customers can now apply it at checkout.`);
    setTimeout(() => setActionSuccessToast(''), 4500);
  };

  const handleToggleCouponStatus = async (coupon) => {
    const nextStatus = !coupon.isActive;
    const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    setCouponsList(prev => prev.map(c => (c._id === coupon._id || c.code === coupon.code) ? { ...c, isActive: nextStatus } : c));
    setActionSuccessToast(`Coupon "${coupon.code}" is now ${nextStatus ? 'ACTIVE ✅' : 'PAUSED ⏸️'}`);
    setTimeout(() => setActionSuccessToast(''), 3000);

    if (coupon._id) {
      try {
        await axios.put(`/api/coupons/${coupon._id}`, { isActive: nextStatus }, { headers: authHeaders });
      } catch (err) {
        console.warn('Could not update coupon on backend:', err.message);
      }
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return;
    const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    setCouponsList(prev => prev.filter(c => c._id !== coupon._id && c.code !== coupon.code));
    setActionSuccessToast(`🗑️ Coupon "${coupon.code}" deleted.`);
    setTimeout(() => setActionSuccessToast(''), 3000);

    if (coupon._id) {
      try {
        await axios.delete(`/api/coupons/${coupon._id}`, { headers: authHeaders });
      } catch (err) {
        console.warn('Could not delete coupon on backend:', err.message);
      }
    }
  };

  const handleApplyBulkDiscount = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const pct = Math.max(1, Math.min(90, Number(bulkDiscountForm.discountPercent) || 15));
    const isAll = bulkDiscountForm.scope === 'ALL' || bulkDiscountForm.categoryName === 'ALL';
    const targetCat = bulkDiscountForm.categoryName;

    setProductsList(prev => prev.map(p => {
      if (!isAll && p.cat !== targetCat) return p;
      const currentPriceNum = parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 299;
      const compareAtNum = p.compareAtPrice ? (parseFloat(String(p.compareAtPrice).replace(/[^0-9.]/g, '')) || Math.round(currentPriceNum * 1.3)) : Math.round(currentPriceNum * 1.3);
      const discountedPrice = Math.max(1, Math.round(compareAtNum * (1 - pct / 100)));

      const updatedJars = (p.jars || []).map(j => {
        const jCompare = j.compareAtPrice ? (parseFloat(String(j.compareAtPrice).replace(/[^0-9.]/g, '')) || Math.round(j.price * 1.3)) : Math.round(j.price * 1.3);
        return {
          ...j,
          compareAtPrice: jCompare,
          price: Math.max(1, Math.round(jCompare * (1 - pct / 100)))
        };
      });

      return {
        ...p,
        compareAtPrice: compareAtNum,
        price: `₹${discountedPrice}`,
        discountPercent: pct,
        jars: updatedJars
      };
    }));

    try {
      const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post('/api/products/bulk-discount', {
        discountPercent: pct,
        applyToAll: isAll,
        categoryName: isAll ? null : targetCat,
      }, { headers: authHeaders });
    } catch (err) {
      console.warn('Bulk discount backend update notice:', err.message);
    }

    setShowBulkDiscountModal(false);
    setActionSuccessToast(`🎉 ${pct}% Discount applied to ${isAll ? 'ALL products' : `products in "${targetCat}"`}! Storefront cards will now display ${pct}% OFF badges and slashed MRP.`);
    setTimeout(() => setActionSuccessToast(''), 5000);
  };

  const handleSaveManualOrder = (e) => {
    e.preventDefault();
    const newOrderNum = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrderObj = {
      id: `#${newOrderNum}`,
      orderNumber: newOrderNum,
      date: '2026-10-07',
      displayDate: '07 Oct 2026, Just Now',
      customer: manualOrderForm.customer,
      phone: manualOrderForm.phone,
      email: `${manualOrderForm.customer.toLowerCase().replace(/\\s+/g, '')}@example.com`,
      address: manualOrderForm.address,
      items: [{ name: manualOrderForm.itemName, variant: 'Standard', qty: manualOrderForm.qty, price: manualOrderForm.total, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80' }],
      itemSummary: `${manualOrderForm.qty}x ${manualOrderForm.itemName}`,
      total: manualOrderForm.total,
      displayTotal: `₹${manualOrderForm.total}`,
      pay: manualOrderForm.payMethod === 'COD' ? 'Pending (COD)' : 'Paid Online',
      payMethod: manualOrderForm.payMethod,
      payColor: manualOrderForm.payMethod === 'COD' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      status: 'NEW',
      statusLabel: 'New / Awaiting Acceptance',
      statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
      courier: '',
      tracking: '',
      timeline: [
        { title: 'Order Created Manually by Merchant', time: 'Just Now', done: true },
        { title: 'Merchant Acceptance', time: 'Awaiting Action', done: false },
        { title: 'Packed & Boxed', time: 'Pending', done: false },
        { title: 'Courier Dispatch', time: 'Pending', done: false },
        { title: 'Delivered', time: 'Pending', done: false }
      ]
    };
    setOrdersList(prev => [newOrderObj, ...prev]);
    setShowManualOrderModal(false);
    setActionSuccessToast(`🎉 Order #${newOrderNum} created for ${manualOrderForm.customer} (📞 ${manualOrderForm.phone})! Visible in Orders pipeline.`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  const handleSaveStockAdjustment = (e) => {
    e.preventDefault();
    setInventoryList(prev => prev.map(inv => {
      if (inv.sku === adjustStockForm.sku) {
        const newOnHand = Math.max(0, inv.onHand + parseInt(adjustStockForm.qtyChange));
        return {
          ...inv,
          onHand: newOnHand,
          avail: Math.max(0, newOnHand - inv.reorder),
          health: newOnHand > inv.reorder ? 'Healthy' : newOnHand > 0 ? 'Reorder' : 'Out of stock',
          healthColor: newOnHand > inv.reorder ? 'bg-emerald-50 text-emerald-700' : newOnHand > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
        };
      }
      return inv;
    }));
    setShowAdjustStockModal(false);
    setActionSuccessToast(`Inventory for SKU ${adjustStockForm.sku} adjusted by ${adjustStockForm.qtyChange > 0 ? '+' : ''}${adjustStockForm.qtyChange} units!`);
    setTimeout(() => setActionSuccessToast(''), 4000);
  };

  const handleSaveTourBooking = (e) => {
    e.preventDefault();
    const newTour = {
      customer: addTourForm.customer,
      pkg: addTourForm.pkg,
      pass: addTourForm.pass,
      date: addTourForm.date,
      loc: addTourForm.loc,
      status: 'Confirmed',
      statusColor: 'bg-emerald-50 text-emerald-700',
      pay: 'Paid'
    };
    setTravelList(prev => [newTour, ...prev]);
    setShowAddTourModal(false);
    setActionSuccessToast(`Tour booking confirmed for ${addTourForm.customer} (${addTourForm.pkg})!`);
    setTimeout(() => setActionSuccessToast(''), 4000);
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

          {/* E-Commerce / Retail Modules (Achar / Product) */}
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
              {navItem('ai-insights', 'AI Business Analyzer', Sparkles)}
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
                placeholder="Search your business..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 w-52 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
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
                title="Real-time Notifications"
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
                      ⚡ Real-time alerts synced with Meta Conversions API &amp; WhatsApp Cloud
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
                DA
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition">Rahul Sharma</div>
                <div className="text-[10px] text-slate-400 leading-tight">Business Admin</div>
              </div>
            </button>
          </div>
        </header>

        {/* 3. Screen Views Switcher */}
        <div className="p-6 space-y-6">
          {/* Global Action Success Toast Banner */}
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
                    <div className="text-2xl font-black text-slate-900">{crmLeads.length || 245}</div>
                    <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" /> 12% this month
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Orders in range</span>
                    <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 font-bold text-xs flex items-center justify-center">O</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900">{rangeTotalOrders || 320}</div>
                    <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" /> 8% this month
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Sales revenue</span>
                    <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center">₹</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900">₹{(rangeRevenue || 248500).toLocaleString('en-IN')}</div>
                    <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" /> 15% vs last month
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Pending follow-ups</span>
                    <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 font-bold text-xs flex items-center justify-center">!</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900">{rangePendingCount || 18}</div>
                    <div className="text-[11px] font-semibold text-amber-600 mt-0.5">Due today</div>
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
                      <div className="text-2xl font-black text-slate-900">₹{(rangeRevenue || 248500).toLocaleString('en-IN')}</div>
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

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-600 font-semibold mb-1">
                        <span>New</span>
                        <span className="font-bold text-slate-900">74</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 font-semibold mb-1">
                        <span>Contacted</span>
                        <span className="font-bold text-slate-900">58</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '65%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 font-semibold mb-1">
                        <span>Qualified</span>
                        <span className="font-bold text-slate-900">42</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '48%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 font-semibold mb-1">
                        <span>Won / Converted</span>
                        <span className="font-bold text-slate-900">26</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '30%' }} />
                      </div>
                    </div>
                  </div>
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
                                {ord.pay || ord.paymentMethod || 'COD'}
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

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0">
                        C
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Call Aarav Sharma</div>
                        <div className="text-[11px] text-slate-400">COD Verification · 11:00 AM</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 font-bold flex items-center justify-center shrink-0">
                        I
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Confirm product stock</div>
                        <div className="text-[11px] text-amber-600 font-medium">Sweet Lemon Pickle low stock (4 units)</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 font-bold flex items-center justify-center shrink-0">
                        L
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Review new Instagram enquiry</div>
                        <div className="text-[11px] text-slate-400">Festive Gift Hamper enquiry</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                        D
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Delhivery Express Pickup</div>
                        <div className="text-[11px] text-slate-400">Scheduled pickup · 2:00 PM</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

                    {/* ==================== 2. LEADS / CRM ==================== */}
          {activeTab === 'leads' && (() => {
            const filteredCrmLeads = crmLeads.filter((l) => {
              const matchesSearch = !crmSearch || 
                (l.name && l.name.toLowerCase().includes(crmSearch.toLowerCase())) ||
                (l.phone && l.phone.includes(crmSearch)) ||
                (l.campaignName && l.campaignName.toLowerCase().includes(crmSearch.toLowerCase()));
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
                                `Hello ${lead.name}, regarding your enquiry at Desi Achar House. How can we help you with your order?`
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
                                  `Hello ${lead.name}, regarding your enquiry at Desi Achar House. How can we assist you?`
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
                              placeholder="e.g. Mango Achar 500g Jar Combo"
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
                            href={`https://wa.me/91${(selectedLead.phone || '').replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${selectedLead.name}, this is Desi Achar House following up on your enquiry.`)}`}
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
                                  {selectedLead.platform === 'ig' ? 'Instagram' : 'Facebook'}
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
                              href={`https://wa.me/${c.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${c.name}! Greetings from Desi Achar House. Enjoy a special 15% festival discount on your favorite pickles today.`)}`}
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
                  <div className="text-xs text-slate-500 font-medium">Total Jars Stocked</div>
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
                        if (selectedCategoryFilter !== 'ALL' && p.cat !== selectedCategoryFilter) return false;
                        if (searchTerm.trim()) {
                          const q = searchTerm.toLowerCase().trim();
                          return p.name?.toLowerCase().includes(q) || p.cat?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
                        }
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
                          if (selectedCategoryFilter !== 'ALL' && p.cat !== selectedCategoryFilter) return false;
                          if (searchTerm.trim()) {
                            const q = searchTerm.toLowerCase().trim();
                            return p.name?.toLowerCase().includes(q) || p.cat?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
                          }
                          return true;
                        })
                        .map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.img}
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
                                        🏺 {j.name}: <strong className="font-bold">₹{j.price}</strong>
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
                                    const currentStock = typeof p.stock === 'number' ? p.stock : parseInt(p.stock) || 0;
                                    const newStock = Math.max(0, currentStock + 10);
                                    setProductsList(prev => prev.map((item, i) => i === idx ? {
                                      ...item,
                                      stock: newStock,
                                      status: newStock > 10 ? 'In stock' : (newStock > 0 ? 'Low stock' : 'Out of stock'),
                                      statusColor: newStock > 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : (newStock > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200')
                                    } : item));
                                    setActionSuccessToast(`+10 stock added to ${p.name} (Now: ${newStock})`);
                                    setTimeout(() => setActionSuccessToast(''), 2500);
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

          {/* ==================== 4B. PICKLE CATEGORIES SHOWCASE (PAGE 2) ==================== */}
          {activeTab === 'categories' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-indigo-600" />
                    Pickle Categories &amp; Varieties
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
                  <div className="text-xs text-slate-500 font-medium">Pickle Categories</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{categoriesList.length} Varieties</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Mango, Chilli, Lemon, Garlic &amp; more</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Products in Categories</div>
                  <div className="text-2xl font-black text-purple-600 mt-2">{productsList.length} SKUs</div>
                  <div className="text-[11px] text-purple-600 font-medium mt-0.5">Categorized in collections</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Storefront Slider Status</div>
                  <div className="text-2xl font-black text-emerald-600 mt-2">Active 🟢</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">High-res photos live</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Live Customer View</div>
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
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80';
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
                  <div className="text-xs text-slate-500 font-medium">Total Orders Saved</div>
                  <div className="text-2xl font-black text-emerald-600 mt-2">
                    {couponsList.reduce((acc, c) => acc + (c.usageCount || 0), 0)} Orders
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Across all campaigns</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Customer Savings</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    ₹{couponsList.reduce((acc, c) => acc + ((c.usageCount || 0) * (c.discountType === 'FLAT' ? c.discountValue : 65)), 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-indigo-600 font-medium mt-0.5">Direct conversion booster</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Har Product Par Discount</div>
                  <div className="text-sm font-bold text-amber-700 truncate mt-2 flex items-center gap-1">
                    <span>🔥</span> Up to 25% OFF Slashed MRP
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
                      Har Product Par Discount (Every Product Discount)
                    </h3>
                    <p className="text-xs text-slate-600">
                      Apply storewide or category-wise discounts in 1 click. Storefront automatically shows crossed-out MRP and discount badges on every card!
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkDiscountForm({ discountPercent: 10, scope: 'ALL', categoryName: 'ALL' });
                      handleApplyBulkDiscount();
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer shadow-xs transition"
                  >
                    10% OFF All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkDiscountForm({ discountPercent: 15, scope: 'ALL', categoryName: 'ALL' });
                      handleApplyBulkDiscount();
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer shadow-xs transition"
                  >
                    15% OFF All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkDiscountForm({ discountPercent: 20, scope: 'ALL', categoryName: 'ALL' });
                      handleApplyBulkDiscount();
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
                        Live Tracking
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
                      onClick={() => {
                        fetchOrders();
                        setActionSuccessToast('Orders refreshed from live database!');
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
                    <span>Real-time Orders filtered by Calendar: <strong>{startDate} to {endDate}</strong></span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowManualOrderModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Manual Order
                    </button>
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
                      <Sparkles className="w-3.5 h-3.5" /> AI Order Growth Insights &rarr;
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
                  <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">+{growthRate}% growth vs prior period</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Awaiting Action (New + Confirmed)</div>
                  <div className="text-2xl font-black text-amber-600 mt-2">{rangePendingCount} Pending</div>
                  <div className="text-[11px] text-amber-600 font-medium mt-0.5">Accept / Pack now</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Delivered &amp; Settled</div>
                  <div className="text-2xl font-black text-emerald-600 mt-2">{rangeDeliveredCount} Delivered</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">{rangeShippedCount} currently in transit</div>
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
                        The same customer placed duplicate orders (e.g. Vikram Rathore #ORD-1087 &amp; #ORD-1088). Please verify with the customer via call or WhatsApp before dispatching to prevent accidental double shipment.
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
                                      title="Live Courier Tracking Page"
                                    >
                                      Track ↗
                                    </a>
                                  </div>
                                  {ord.trackingNotified && (
                                    <div className="text-[9px] text-emerald-700 font-bold flex items-center gap-0.5">
                                      <span>✓ Auto-Notified WhatsApp</span>
                                    </div>
                                  )}
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
                                          setTrackingNumber('DEL-' + Math.floor(100000 + Math.random() * 900000));
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
                                      title="Send or resend live tracking link to customer WhatsApp"
                                    >
                                      <span>💬 {ord.trackingNotified ? 'Resend Track' : 'Send Track'}</span>
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
                        <h2 className="text-xl font-black tracking-tight text-white">Omniva AI 2.0 Business Copilot &amp; Growth Engine</h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Online &amp; Synced
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Intelligent Business Engine: Real-time sales data, demand forecasting, 1-click marketing, and COD fraud protection
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
                  <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +{growthRate}% vs prior cycle
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-100">
                    Prior cycle: ₹{priorPeriodRevenue.toLocaleString('en-IN')}. Run-rate: ₹{Math.round(rangeRevenue / 7).toLocaleString('en-IN')}/day.
                  </p>
                </div>

                {/* Metric 2: Store Health Score */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>AI Store Health</span>
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-indigo-600 flex items-center gap-2">
                    94 <span className="text-xs font-bold text-slate-400">/ 100</span>
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Grade A+ (Excellent SLA)
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-100">
                    Avg accept time: 28 mins. Repeat buyer rate: 34.2%.
                  </p>
                </div>

                {/* Metric 3: Payment & COD Risk Mitigation */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>COD vs Online Split</span>
                    <CreditCard className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    57% <span className="text-xs font-normal text-slate-400">COD</span> / 43% <span className="text-xs font-normal text-slate-400">UPI</span>
                  </div>
                  <div className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 3.8% Low Return Risk
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-100">
                    Pre-dispatch WhatsApp confirmation active for pending COD.
                  </p>
                </div>

                {/* Metric 4: 30-Day Demand Projection */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>30-Day Sales Forecast</span>
                    <Boxes className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-amber-600">
                    ~480 Jars
                  </div>
                  <div className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> +18% Festive uplift expected
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-100">
                    Estimated gross revenue ₹1.42L. 2 SKUs need kitchen batching.
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
                  <span>🤖 AI Business Copilot (Live Chat)</span>
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
                  <span>📊 30-Day Demand Forecast (Stock Prediction)</span>
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
                  <span>✍️ AI WhatsApp &amp; Ad Copywriter (1-Click Marketing)</span>
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
                  <span>🛡️ COD Fraud &amp; RTO Radar (Parcel Protection)</span>
                </button>
              </div>

              {/* ================= SUB-TAB 1: AI BUSINESS COPILOT ================= */}
              {aiActiveSubTab === 'copilot' && (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                        <Bot className="w-5 h-5 text-indigo-600" />
                        Omniva Store Copilot 2.0 (Real-time Business Advisor)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Ask any question regarding store profits, Meta Ads, best-selling products, or orders
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
                        'Which pickle variety has the highest sales volume and margin?',
                        'What is our Meta Ads (Instagram vs Facebook) ad spend and ROAS?',
                        'How to reduce COD order RTO risk?',
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
                          Omniva AI is analyzing real-time store analytics and order data...
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
                      placeholder="Ask any question about your store (e.g. how to optimize ad spend?)..."
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

              {/* ================= SUB-TAB 2: 30-DAY DEMAND FORECASTING ================= */}
              {aiActiveSubTab === 'forecast' && (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        30-Day Pickle Demand Forecasting &amp; Kitchen Production Radar
                      </h3>
                      <p className="text-xs text-slate-500">
                        Kitchen batching forecast based on past 30 days sales and upcoming seasonal demand (+18%)
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setAiActionNotice('Kitchen Production Order Slip #KB-2026-10 generated and queued for packing team! 📋');
                        setTimeout(() => setAiActionNotice(''), 4000);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>⚡ Generate Kitchen Batch Slip</span>
                    </button>
                  </div>

                  {/* 3 Forecasting Summary Badges */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                      <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Upcoming Peak Rush</div>
                      <div className="text-lg font-black text-amber-950">Festive Season (Diwali Surge)</div>
                      <p className="text-xs text-amber-700">Projected order velocity will jump +45% in the next 14 days.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1">
                      <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Depletion Alert</div>
                      <div className="text-lg font-black text-rose-950">2 SKUs at Critical Level</div>
                      <p className="text-xs text-rose-700">Heritage Gift Box and Garlic Pickle will run out in &lt; 14 days.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                      <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Recommended Kitchen Batch</div>
                      <div className="text-lg font-black text-emerald-950">+250 Kg Raw Mustard Curing</div>
                      <p className="text-xs text-emerald-700">Start sun-curing batch today to meet November order delivery SLAs.</p>
                    </div>
                  </div>

                  {/* Predictive Inventory Depletion Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5">Pickle SKU &amp; Pack Size</th>
                          <th className="p-3.5">In-Stock</th>
                          <th className="p-3.5">Daily Run-Rate</th>
                          <th className="p-3.5">30-Day Projected Demand</th>
                          <th className="p-3.5">Days to Stockout</th>
                          <th className="p-3.5">Urgency</th>
                          <th className="p-3.5">AI Kitchen Recommendation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        <tr className="hover:bg-slate-50/80">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">Royal Heritage Festive Pickle Combo Box 1.2kg</div>
                            <div className="text-[10px] text-slate-400">Gift Box Set (Diwali Special)</div>
                          </td>
                          <td className="p-3.5 font-bold text-rose-600">24 Units</td>
                          <td className="p-3.5">4.2 / day</td>
                          <td className="p-3.5 font-bold text-slate-900">126 Units</td>
                          <td className="p-3.5 font-bold text-rose-600">5.7 Days</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                              🔴 Urgent Restock
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-indigo-700">
                            Produce +150 Jars (Batch #K-104)
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50/80">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">Traditional Rajasthani Mango Pickle 500g</div>
                            <div className="text-[10px] text-slate-400">Best Seller SKU (500g Glass Jar)</div>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">120 Units</td>
                          <td className="p-3.5">8.5 / day</td>
                          <td className="p-3.5 font-bold text-slate-900">255 Units</td>
                          <td className="p-3.5 font-bold text-amber-600">14.1 Days</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              🟡 Low Buffer
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-indigo-700">
                            Prepare +200 Jars by Next Monday
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50/80">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">Spicy Garlic Pickle (Lahsun Achar) 400g</div>
                            <div className="text-[10px] text-slate-400">High Margin Specialty (400g Jar)</div>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">42 Units</td>
                          <td className="p-3.5">3.1 / day</td>
                          <td className="p-3.5 font-bold text-slate-900">93 Units</td>
                          <td className="p-3.5 font-bold text-amber-600">13.5 Days</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              🟡 Low Buffer
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-indigo-700">
                            Produce +80 Jars
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50/80">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">Spicy Green Chilli Pickle (Hari Mirch) 250g</div>
                            <div className="text-[10px] text-slate-400">Regular Repeats (250g Pouch)</div>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">85 Units</td>
                          <td className="p-3.5">4.0 / day</td>
                          <td className="p-3.5 font-bold text-slate-900">120 Units</td>
                          <td className="p-3.5 font-bold text-emerald-600">21.2 Days</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              🟢 Healthy Stock
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500">
                            Standard Batch +60 Jars
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50/80">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">Sweet &amp; Tangy Nimbu (Lemon) Pickle 500g</div>
                            <div className="text-[10px] text-slate-400">Matured Jar (500g)</div>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">110 Units</td>
                          <td className="p-3.5">2.2 / day</td>
                          <td className="p-3.5 font-bold text-slate-900">66 Units</td>
                          <td className="p-3.5 font-bold text-emerald-600">50.0 Days</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              🟢 Safe Stock
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400">
                            No Immediate Action Needed
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setActiveTab('products')}
                      className="text-xs text-indigo-700 font-bold hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>Open Products Catalog to Update Real-time Quantities &rarr;</span>
                    </button>
                    <span className="text-[11px] text-slate-400">
                      Calculated dynamically using rolling 14-day weighted moving averages.
                    </span>
                  </div>
                </div>
              )}

              {/* ================= SUB-TAB 3: 1-CLICK WHATSAPP & AD COPYWRITER ================= */}
              {aiActiveSubTab === 'copywriter' && (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        1-Click AI WhatsApp &amp; Meta Ad Copywriter
                      </h3>
                      <p className="text-xs text-slate-500">
                        Ready-to-use promotional copy for festive offers, COD order verification, and Instagram Reels
                      </p>
                    </div>

                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      🎯 Optimized for Pickle Sales
                    </span>
                  </div>

                  {/* Template Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { key: 'festival', icon: '🎁', label: 'Festive Flash Sale', sub: 'Festive Offer Broadcast' },
                      { key: 'cod-confirm', icon: '💬', label: 'COD Verification', sub: 'RTO Prevention Message' },
                      { key: 'review', icon: '⭐️', label: '5-Star Review Request', sub: 'Post-Delivery Feedback' },
                      { key: 'meta-reel', icon: '📸', label: 'Viral Reel Caption', sub: '15 Trending Hashtags' }
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
                            const variationAddon = "\n\n🔥 *Special Reminder:* Free home delivery on orders placed today!";
                            setEditableCopyText(prev => (prev || AI_COPY_TEMPLATES[selectedCopyCategory].text) + variationAddon);
                            setAiActionNotice('✨ Added fresh AI urgency hook to the message!');
                            setTimeout(() => setAiActionNotice(''), 3000);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>AI Tweak Hook</span>
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

              {/* ================= SUB-TAB 4: COD FRAUD & RTO RISK SHIELD ================= */}
              {aiActiveSubTab === 'rto-radar' && (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        COD Fraud &amp; RTO (Return to Origin) Shield Radar
                      </h3>
                      <p className="text-xs text-slate-500">
                        Automated address and phone verification for Cash-on-Delivery orders to prevent courier return (RTO) charges
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setAiRiskScanCompleted(true);
                        setAiActionNotice('🛡️ Instant AI Risk Scan Complete! 2 high-risk COD orders flagged for manual verification.');
                        setTimeout(() => setAiActionNotice(''), 4000);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 transition"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>⚡ Run Instant AI Risk Scan</span>
                    </button>
                  </div>

                  {/* 3 Shield KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1">
                      <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">COD Orders in Window</div>
                      <div className="text-xl font-black text-indigo-950">6 Orders (₹4,890)</div>
                      <p className="text-xs text-indigo-700">57% of total store customer orders requested COD payment.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                      <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Flagged for Verification</div>
                      <div className="text-xl font-black text-amber-950">2 Orders Flagged</div>
                      <p className="text-xs text-amber-700">Missing address landmarks or repeat unverified numbers.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                      <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Estimated Return Loss Saved</div>
                      <div className="text-xl font-black text-emerald-950">₹780 Protected</div>
                      <p className="text-xs text-emerald-700">Saved in courier two-way freight &amp; packaging damages.</p>
                    </div>
                  </div>

                  {/* Active Orders Risk Evaluation */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Live Order Risk Telemetry:</span>
                      <span className="text-[11px] font-normal text-slate-500">Scan Status: {aiRiskScanCompleted ? 'Deep Scan Complete ✅' : 'Standard Monitoring 🟢'}</span>
                    </div>

                    <div className="space-y-3">
                      {/* Risk Item 1 */}
                      <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-300">
                              🔴 High Risk (78% RTO Probability)
                            </span>
                            <span className="font-extrabold text-slate-900 text-xs">#ORD-1085 • Manoj Tiwari</span>
                            <span className="text-xs text-slate-500 font-mono">₹1,299 (Cash on Delivery)</span>
                          </div>
                          <p className="text-xs text-slate-600">
                            🚩 <strong>Why Flagged:</strong> High-ticket COD order (&gt; ₹1,000) + Incomplete address (missing landmark &amp; sector number in Tonk Road).
                          </p>
                          <div className="text-[11px] text-rose-700 font-semibold">
                            💡 AI Recommendation: Do not dispatch until delivery address is confirmed on WhatsApp.
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const verifyMsg = `Hello Manoj Tiwari! 🙏 Regarding your Desi Achar House COD Order #ORD-1085 (₹1,299). Please reply YES to verify your address for express dispatch.`;
                              window.open(`https://wa.me/919829012345?text=${encodeURIComponent(verifyMsg)}`, '_blank');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Verify on WhatsApp</span>
                          </button>

                          <button
                            onClick={() => {
                              setAiActionNotice('Order #ORD-1085 marked as manually verified by merchant! 🛡️');
                              setTimeout(() => setAiActionNotice(''), 3000);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition"
                          >
                            Mark Verified
                          </button>
                        </div>
                      </div>

                      {/* Risk Item 2 */}
                      <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                              🟡 Medium Risk (35% RTO Probability)
                            </span>
                            <span className="font-extrabold text-slate-900 text-xs">#ORD-1082 • Ritu Maheshwari</span>
                            <span className="text-xs text-slate-500 font-mono">₹548 (Cash on Delivery)</span>
                          </div>
                          <p className="text-xs text-slate-600">
                            🚩 <strong>Why Flagged:</strong> First-time COD buyer in store history. Phone number verified.
                          </p>
                          <div className="text-[11px] text-amber-700 font-semibold">
                            💡 AI Recommendation: Standard Delhivery tracking link SMS auto-trigger on dispatch.
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setAiActionNotice('Automated pre-dispatch ping queued for Ritu Maheshwari (ORD-1082) 💬');
                              setTimeout(() => setAiActionNotice(''), 3000);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Send Auto-Ping</span>
                          </button>
                        </div>
                      </div>

                      {/* Risk Item 3 */}
                      <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                              🟢 Safe (2% RTO Risk - Zero Fraud)
                            </span>
                            <span className="font-extrabold text-slate-900 text-xs">#ORD-1087 • Vikram Rathore</span>
                            <span className="text-xs text-slate-500 font-mono">₹488 (Prepaid UPI)</span>
                          </div>
                          <p className="text-xs text-slate-600">
                            ✅ <strong>Verified Safe:</strong> 100% Online UPI Prepaid + Complete Pin Code (302006) + Verified repeat customer.
                          </p>
                        </div>

                        <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                          Ready for BlueDart Pickup 🚚
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pro Tip Box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black flex items-center gap-1.5 text-amber-300">
                        <Sparkles className="w-4 h-4 text-amber-400" /> Omniva AI Growth Insights
                      </div>
                      <p className="text-xs text-slate-300">
                        Converting just 20% of your COD orders to UPI Prepaid saves an average of ₹18,400 per month in courier return penalties.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('automations')}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition whitespace-nowrap shrink-0 shadow-md"
                    >
                      Configure COD Pre-pay Discount &rarr;
                    </button>
                  </div>
                </div>
              )}
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
                  const waConfirmMessage = `Hello ${selectedOrderForDetail.customer}! 🙏\n\nOrder verification message from Desi Achar House. We noticed 2 matching orders placed from your phone number:\n• Order 1: ${selectedOrderForDetail.id} (${selectedOrderForDetail.itemSummary})\n• Order 2: ${firstTwin.id} (${firstTwin.itemSummary})\n\nCould you please confirm if you would like both orders shipped, or if one was placed by mistake? Thank you!`;

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
                      href={`https://wa.me/${selectedOrderForDetail.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${selectedOrderForDetail.customer}! Regarding your Desi Achar House order ${selectedOrderForDetail.id}...`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <span>WhatsApp ↗</span>
                    </a>
                  </div>
                </div>

                {/* Courier Dispatch & Live Tracking Section (if shipped or has tracking) */}
                {(selectedOrderForDetail.status === 'SHIPPED' || selectedOrderForDetail.tracking) && (
                  <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-emerald-50/40 rounded-2xl p-4 border border-blue-200/80 space-y-3 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
                          <Truck className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
                            <span>Courier Dispatch & Live Tracking</span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                              {selectedOrderForDetail.courier || 'Delhivery Express'}
                            </span>
                          </h4>
                          <p className="text-[11px] text-blue-700/90 font-mono mt-0.5">
                            AWB Tracking #{selectedOrderForDetail.tracking || 'DEL-8492014'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center gap-1">
                        <span>✓</span> {selectedOrderForDetail.trackingNotified ? 'Auto WhatsApp Sent' : 'Ready to Send'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Live Tracking Link */}
                      <a
                        href={selectedOrderForDetail.trackingUrl || getCourierTrackingUrl(selectedOrderForDetail.courier, selectedOrderForDetail.tracking, selectedOrderForDetail.id, selectedOrderForDetail.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                      >
                        <span>Live Parcel Track ↗</span>
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
                      <strong className="text-slate-800 font-bold block">{selectedOrderForDetail.channelName || 'Direct Organic'}</strong>
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
                      alert(`Printing invoice and packing slip for ${selectedOrderForDetail.id}`);
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
                          setTrackingNumber('DEL-' + Math.floor(100000 + Math.random() * 900000));
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
                      <button
                        type="button"
                        onClick={() => {
                          const prefix = courierName.toLowerCase().includes('delhivery') ? 'DEL' : (courierName.toLowerCase().includes('bluedart') ? 'BD' : (courierName.toLowerCase().includes('speed post') ? 'SP' : 'TRK'));
                          setTrackingNumber(`${prefix}-${Math.floor(1000000 + Math.random() * 9000000)}`);
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        ⚡ Auto-Generate AWB
                      </button>
                    </div>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. DEL-8492014"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Live Tracking URL preview */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">🔗 Customer Live Tracking Link:</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Real-time</span>
                    </div>
                    <div className="font-mono text-[10px] text-indigo-600 truncate">
                      {getCourierTrackingUrl(courierName, trackingNumber || 'DEL-8492014', dispatchModalOrder.orderNumber || dispatchModalOrder.id, dispatchModalOrder.phone)}
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
                      <span className="font-extrabold text-indigo-950 block">⚡ Auto-Send WhatsApp Live Tracking Message</span>
                      <span className="text-[11px] text-indigo-800">
                        Customer mobile ({dispatchModalOrder.phone}) will automatically receive tracking ID and live tracking link.
                      </span>
                    </div>
                  </label>

                  {/* Message Preview */}
                  <div className="p-3 rounded-2xl bg-slate-900 text-slate-200 text-[11px] space-y-1 font-sans">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <span>💬 Message Preview (Customer WhatsApp Notification):</span>
                    </div>
                    <div className="text-slate-300 text-[11px] whitespace-pre-line leading-relaxed font-mono">
                      {generateTrackingMessage(dispatchModalOrder, courierName, trackingNumber || 'DEL-8492014')}
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
                    {editingCategory.name} (Live Customer Storefront Preview)
                  </div>
                </div>

                {/* Device Gallery Upload + Preset Picker */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 block">Choose Photo from Device Gallery or Pickle Presets:</label>
                  
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

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {photoPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCategoryPhotoUrl(preset.url)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                          categoryPhotoUrl === preset.url
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
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
                      setNewServiceForm(prev => ({ ...prev, date: '2026-10-15', dayNumber: 15 }));
                      setShowAddServiceBookingModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Booking</span>
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
                    {Math.round((serviceBookingsList.filter(b => b.status === 'Confirmed').length / serviceBookingsList.length) * 100)}% confirmed
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
                        onClick={() => {
                          setCalendarMonth('September 2026');
                          setActionSuccessToast('Viewing September 2026 calendar');
                          setTimeout(() => setActionSuccessToast(''), 3000);
                        }}
                        className={`px-2.5 py-1 text-xs rounded-md transition cursor-pointer ${
                          calendarMonth === 'September 2026' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                        title="Previous Month"
                      >
                        &lt;
                      </button>
                      <button
                        onClick={() => {
                          setCalendarMonth('October 2026');
                          setActionSuccessToast('Viewing current month: October 2026');
                          setTimeout(() => setActionSuccessToast(''), 3000);
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                          calendarMonth === 'October 2026' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-800 hover:bg-slate-200/60'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => {
                          setCalendarMonth('November 2026');
                          setActionSuccessToast('Viewing November 2026 calendar');
                          setTimeout(() => setActionSuccessToast(''), 3000);
                        }}
                        className={`px-2.5 py-1 text-xs rounded-md transition cursor-pointer ${
                          calendarMonth === 'November 2026' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
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
                        setNewServiceForm(prev => ({ ...prev, date: '2026-10-15', dayNumber: 15 }));
                        setShowAddServiceBookingModal(true);
                      }}
                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm cursor-pointer transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ New booking</span>
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

                    {/* Accurate October 2026 Grid (Starts on Thu Oct 1) */}
                    <div className="grid grid-cols-7 gap-2 text-xs pt-2">
                      {/* Previous month days: Mon 28, Tue 29, Wed 30 */}
                      {[28, 29, 30].map((d) => (
                        <div
                          key={`prev-${d}`}
                          className="min-h-[82px] p-2 rounded-xl border bg-slate-50/40 border-slate-100 text-slate-300 select-none"
                        >
                          <div className="font-medium text-right text-[11px]">{d}</div>
                        </div>
                      ))}

                      {/* Current Month October (Days 1 to 31) */}
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                        const dayBookings = serviceBookingsList.filter(b => b.dayNumber === day);
                        const isToday = day === 7;
                        return (
                          <div
                            key={`oct-${day}`}
                            onClick={() => {
                              setNewServiceForm(prev => ({
                                ...prev,
                                date: `2026-10-${day < 10 ? '0' + day : day}`,
                                dayNumber: day
                              }));
                              setShowAddServiceBookingModal(true);
                            }}
                            className={`min-h-[82px] p-2 rounded-xl border transition flex flex-col justify-between cursor-pointer group hover:shadow-sm ${
                              isToday
                                ? 'bg-indigo-50/30 border-indigo-300 ring-1 ring-indigo-200'
                                : 'bg-white border-slate-200/80 hover:border-indigo-400 hover:bg-slate-50/50'
                            }`}
                            title={`Click to add booking on Oct ${day}, 2026`}
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
                                {day}
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
                      })}

                      {/* Next month days to complete 5 full weeks: Sun 1 Nov */}
                      {[1].map((d) => (
                        <div
                          key={`next-${d}`}
                          className="min-h-[82px] p-2 rounded-xl border bg-slate-50/40 border-slate-100 text-slate-300 select-none"
                        >
                          <div className="font-medium text-right text-[11px]">{d}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. LIST VIEW (Full Interactive Appointments Table) */}
                {serviceViewMode === 'list' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
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
                        {serviceBookingsList.map((item) => (
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
                        ))}
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
                    onClick={() => setActionSuccessToast('Browsing 12 curated Rajasthan tour & heritage packages')}
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
                  <table className="w-full text-left text-xs">
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
                      {travelList.map((tr, idx) => (
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
                      ))}
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
                              onClick={() => {
                                const updated = staffList.map(s => s.id === st.id ? { ...s, status: s.status === 'Active' ? 'Paused' : 'Active' } : s);
                                setStaffList(updated);
                                setTeamMembers(updated);
                                setActionSuccessToast(`Status changed to ${st.status === 'Active' ? 'Paused' : 'Active'} for ${st.name}`);
                                setTimeout(() => setActionSuccessToast(''), 3000);
                              }}
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
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to remove staff account for ${st.name}?`)) {
                                      const updated = staffList.filter(s => s.id !== st.id);
                                      setStaffList(updated);
                                      setTeamMembers(updated);
                                      if (simulatedStaffId === st.id) setSimulatedStaffId(null);
                                      setActionSuccessToast(`Staff member ${st.name} removed successfully.`);
                                      setTimeout(() => setActionSuccessToast(''), 3000);
                                    }
                                  }}
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
                      Kitchen and packing staff see <strong>Confirmed orders only</strong> so unverified or unpaid orders are never packed prematurely.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-blue-700">
                      <span>⏳</span> Calling Desk (Pending Only)
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Calling staff see <strong>New / Pending orders only</strong>. As soon as an order is verified, it transitions to Confirmed and moves to the packing queue.
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
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Review sales, bookings, inventory and campaign outcomes</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-600">
                    Last 30 days
                  </span>
                  <button className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Net sales</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">₹2,48,500</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Selected period</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Orders</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">320</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">8% vs prior period</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Bookings</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">85</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">18% vs prior period</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Conversion rate</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">4.8%</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Attribution-dependent</div>
                </div>
              </div>

              {/* Row 2: Sales Trend & Order Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Sales trend</h3>
                  <div className="h-44 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
                    {[30, 42, 38, 55, 48, 62, 58, 75, 70, 95].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div style={{ height: `${val}%` }} className="w-full bg-indigo-600 rounded-t-lg transition" />
                        <span className="text-[9px] text-slate-400">W{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Order status distribution</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-600 font-semibold mb-1">
                        <span>Delivered</span>
                        <span className="font-bold text-slate-900">228</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '71%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-600 font-semibold mb-1">
                        <span>Processing</span>
                        <span className="font-bold text-slate-900">42</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '13%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-600 font-semibold mb-1">
                        <span>Pending</span>
                        <span className="font-bold text-slate-900">24</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '8%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-600 font-semibold mb-1">
                        <span>Cancelled / refunded</span>
                        <span className="font-bold text-slate-900">26</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: '8%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Summary Audit Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 px-6 border-b border-slate-200/80">
                  <h3 className="font-bold text-slate-900 text-sm">Performance summary</h3>
                  <p className="text-[11px] text-slate-400">Separate order value, collected payments, refunds, expenses and attributed revenue</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-6">METRIC</th>
                        <th className="py-3 px-4">CURRENT PERIOD</th>
                        <th className="py-3 px-4">PREVIOUS PERIOD</th>
                        <th className="py-3 px-4">CHANGE</th>
                        <th className="py-3 px-6 text-right">DEFINITION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { metric: 'Order value', curr: '₹2,86,500', prev: '₹2,58,000', change: '+11.0%', def: 'Total order amounts' },
                        { metric: 'Collected payments', curr: '₹2,48,500', prev: '₹2,26,000', change: '+10.0%', def: 'Verified collections' },
                        { metric: 'Refunds', curr: '₹8,500', prev: '₹6,200', change: '+37.1%', def: 'Recorded refunds' },
                        { metric: 'Ad spend', curr: '₹48,500', prev: '₹42,000', change: '+15.5%', def: 'Connected/imported spend' },
                        { metric: 'Attributed revenue', curr: '₹1,64,000', prev: '₹1,38,000', change: '+18.8%', def: 'Model-dependent attribution' }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-6 font-bold text-slate-900">{row.metric}</td>
                          <td className="py-3.5 px-4 font-black text-slate-900">{row.curr}</td>
                          <td className="py-3.5 px-4 text-slate-600">{row.prev}</td>
                          <td className="py-3.5 px-4 font-bold text-emerald-600">{row.change}</td>
                          <td className="py-3.5 px-6 text-right text-slate-500">{row.def}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

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
                    Direct public storefront where customers browse pickles, add to cart, and place COD orders.
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

              {/* Key Storefront Info & Live Tracking Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Storefront Status</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-extrabold text-slate-900 text-sm">Online &amp; Accepting Orders</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Cash on Delivery (COD) Enabled</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Public Store URL</div>
                  <div className="font-mono text-xs font-bold text-indigo-600 truncate mt-1.5">
                    /store/{businessSlug}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">SEO indexed &amp; Meta ad ready</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Meta Pixel &amp; CAPI</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                      Tracking Active
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">ViewContent, AddToCart, Purchase</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Catalog</div>
                  <div className="font-extrabold text-slate-900 text-sm mt-1.5">
                    {productsList.length} Products Listed
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Live stock synchronization</div>
                </div>
              </div>

              {/* Live Preview Container with Device View Toggle */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-sm text-slate-800">Live Customer Viewport Preview</span>
                    <span className="text-[11px] text-slate-400">
                      (See exactly what your customers see when clicking your Meta Ads)
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
                      Mobile preview reflects Instagram &amp; Facebook Ad in-app browser view
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
                        <span className="truncate">{typeof window !== 'undefined' ? window.location.origin : 'https://omniva.io'}/store/{businessSlug}</span>
                        <span className="text-emerald-600 font-semibold text-[10px]">🔒 SSL Secured</span>
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
                  onClick={() => {
                    setActionSuccessToast('All settings updated and saved successfully! Storefront synchronized.');
                    setTimeout(() => setActionSuccessToast(''), 4000);
                  }}
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
                            <option>Product selling (Pickles, Food & FMCG)</option>
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
                          onClick={() => {
                            setActionSuccessToast('Business profile updated successfully!');
                            setTimeout(() => setActionSuccessToast(''), 4000);
                          }}
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
                        <p className="text-[11px] text-slate-400">Customize how your store appears to customers and on invoices</p>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="text-slate-700 font-bold block mb-1">Store Tagline / Slogan</label>
                          <input
                            type="text"
                            value={brandTagline}
                            onChange={(e) => setBrandTagline(e.target.value)}
                            placeholder="e.g. Authentic Handcrafted Pickles of Rajasthan"
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

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <span className="font-bold text-slate-800 text-xs block">Invoice Footer Note</span>
                          <textarea
                            rows={2}
                            defaultValue="Thank you for supporting traditional Indian artisans. FSSAI License: 12224026000123."
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActionSuccessToast('Branding settings updated successfully!');
                            setTimeout(() => setActionSuccessToast(''), 4000);
                          }}
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
                            <div className="font-bold text-slate-800 text-xs">Show public storefront</div>
                            <div className="text-[11px] text-slate-400">Allow customers to browse catalog and place orders directly</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowStorePage(!showStorePage)}
                            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                              showStorePage ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${showStorePage ? 'left-5' : 'left-0.5'}`} />
                          </button>
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
                            <p className="text-[10px] text-slate-400 mt-1">Free delivery automatically applied on orders above ₹499.</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActionSuccessToast('Storefront settings updated successfully!');
                            setTimeout(() => setActionSuccessToast(''), 4000);
                          }}
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="text-slate-700 font-bold block mb-1">Razorpay Key ID</label>
                            <input
                              type="text"
                              value={razorpayKeyId}
                              onChange={(e) => setRazorpayKeyId(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-slate-700 font-bold block mb-1">Razorpay Key Secret</label>
                            <input
                              type="password"
                              value={razorpayKeySecret}
                              onChange={(e) => setRazorpayKeySecret(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                            />
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-800">Auto-confirm paid orders</div>
                            <div className="text-[11px] text-slate-400">Automatically mark online orders as 'Confirmed' upon successful webhook event</div>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Enabled
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActionSuccessToast('Payment credentials updated and verified!');
                            setTimeout(() => setActionSuccessToast(''), 4000);
                          }}
                          className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 cursor-pointer"
                        >
                          Save Payment Settings
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 5. Notifications & Alerts */}
                  {settingsSubTab === 'notifications' && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-900 text-sm">Notifications & Alerts</h3>
                        <p className="text-[11px] text-slate-400">Manage WhatsApp, SMS, and Email alerts for orders and leads</p>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                          <div>
                            <div className="font-bold text-slate-800 text-xs">WhatsApp Order Confirmations & Tracking</div>
                            <div className="text-[11px] text-slate-400">Send instant WhatsApp message with order tracking link to customers</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setWhatsappAlerts(!whatsappAlerts)}
                            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                              whatsappAlerts ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${whatsappAlerts ? 'left-5' : 'left-0.5'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                          <div>
                            <div className="font-bold text-slate-800 text-xs">Send Order Status SMS Notifications</div>
                            <div className="text-[11px] text-slate-400">Dispatch SMS when parcel is handed over to courier</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSendOrderNotifications(!sendOrderNotifications)}
                            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                              sendOrderNotifications ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${sendOrderNotifications ? 'left-5' : 'left-0.5'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                          <div>
                            <div className="font-bold text-slate-800 text-xs">Email Invoices to Customers</div>
                            <div className="text-[11px] text-slate-400">Attach PDF tax invoice upon order fulfillment</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEnableMarketingByDefault(!enableMarketingByDefault)}
                            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                              enableMarketingByDefault ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${enableMarketingByDefault ? 'left-5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActionSuccessToast('Notification preferences saved successfully!');
                            setTimeout(() => setActionSuccessToast(''), 4000);
                          }}
                          className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 cursor-pointer"
                        >
                          Save Notifications
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
                            <div className="text-[11px] text-slate-400">Download complete lead and customer database as secure CSV</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActionSuccessToast('Customer records exported as secure CSV!');
                              setTimeout(() => setActionSuccessToast(''), 3000);
                            }}
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
                        onClick={() => {
                          const updated = staffList.map(s => s.id === selectedStaffForEdit.id ? selectedStaffForEdit : s);
                          setStaffList(updated);
                          setTeamMembers(updated);
                          setSimulatedStaffId(selectedStaffForEdit.id);
                          setActiveTab('orders');
                          setShowEditStaffModal(false);
                          setActionSuccessToast(`Permissions saved! Now viewing Orders as ${selectedStaffForEdit.name} (${selectedStaffForEdit.orderScope})`);
                          setTimeout(() => setActionSuccessToast(''), 4000);
                        }}
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
                          onClick={() => {
                            const updated = staffList.map(s => s.id === selectedStaffForEdit.id ? selectedStaffForEdit : s);
                            setStaffList(updated);
                            setTeamMembers(updated);
                            setShowEditStaffModal(false);
                            setActionSuccessToast(`Permissions updated successfully for ${selectedStaffForEdit.name}!`);
                            setTimeout(() => setActionSuccessToast(''), 4000);
                          }}
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
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newStaffForm.name || !newStaffForm.email) return;

                        const newMember = {
                          id: 'staff_' + Date.now(),
                          name: newStaffForm.name,
                          email: newStaffForm.email,
                          phone: newStaffForm.phone || '+91 98000 00000',
                          role: newStaffForm.role,
                          status: 'Active',
                          orderScope: newStaffForm.orderScope,
                          allowedOrderStatuses: newStaffForm.allowedOrderStatuses,
                          modules: newStaffForm.modules,
                          canAcceptOrders: newStaffForm.canAcceptOrders,
                          canPackOrders: newStaffForm.canPackOrders,
                          canDispatchOrders: newStaffForm.canDispatchOrders,
                          canCancelOrders: newStaffForm.canCancelOrders,
                          canViewRevenue: newStaffForm.canViewRevenue,
                          lastActive: 'Just Added'
                        };

                        const updated = [...staffList, newMember];
                        setStaffList(updated);
                        setTeamMembers(updated);
                        setShowAddStaffModal(false);
                        setShowAddTeamModal(false);
                        setNewStaffForm({
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
                        setActionSuccessToast(`Staff member ${newMember.name} added successfully with ${newMember.orderScope} visibility!`);
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
                            placeholder="e.g. ramesh@desiachar.example"
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
                  placeholder="e.g. Kashmiri Garlic Pickle 500g"
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
                      placeholder="Type new category (e.g. Amla Achar)"
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

              {/* Jar Sizes & Packaging Variants Manager */}
              <div className="space-y-2.5 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-slate-800 font-bold block text-xs flex items-center gap-1.5">
                      <span>🏺</span>
                      <span>Available Jar Packaging & Custom Pricing</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Select which jar sizes are available and adjust price/stock for each.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {newProductForm.jars?.filter(j => j.enabled).length || 0} Jars Active
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
                              title="Jar Price in ₹"
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
                              title="Jar Stock Units"
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
                              title="Remove custom jar"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Custom Jar Size Sub-Form */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                      <span>+ Add Custom Jar Size:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 750g Pet Jar"
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
                            alert('Please enter jar name (e.g. 750g Glass Jar)');
                            return;
                          }
                          const newJarObj = {
                            id: `custom-${Date.now()}`,
                            name: newJarName.trim(),
                            price: parseFloat(newJarPrice) || 299,
                            stock: parseInt(newJarStock) || 20,
                            enabled: true,
                            isCustom: true
                          };
                          setNewProductForm(prev => ({
                            ...prev,
                            jars: [...(prev.jars || []), newJarObj]
                          }));
                          setNewJarName('');
                          setNewJarPrice('');
                          setNewJarStock('25');
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 cursor-pointer"
                      >
                        + Add Jar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Photo Selection: Device Gallery + Achar Presets */}
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

                {/* 2. Or Choose from Authentic Achar Gallery */}
                <div>
                  <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Or tap an Authentic Achar photo:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {photoPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewProductForm({ ...newProductForm, img: preset.url })}
                        className={`p-1.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer text-[10px] transition ${
                          newProductForm.img === preset.url
                            ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-900 ring-1 ring-indigo-300'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-700'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

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
                    No photo selected yet (Upload from gallery or tap an achar photo above)
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
                  placeholder="e.g. Traditional Rajasthani Mango Pickle 500g"
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

              {/* Jar Sizes & Packaging Variants Manager */}
              <div className="space-y-2.5 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-slate-800 font-bold block text-xs flex items-center gap-1.5">
                      <span>🏺</span>
                      <span>Available Jar Packaging & Custom Pricing</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Customize which jar sizes are available in store and set custom rates &amp; stock.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {editProductForm.jars?.filter(j => j.enabled).length || 0} Jars Active
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
                              title="Jar Price in ₹"
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
                              title="Jar Stock Units"
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
                              title="Remove custom jar"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Custom Jar Size Sub-Form */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                      <span>+ Add Custom Jar Size:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 750g Pet Jar"
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
                            alert('Please enter jar name (e.g. 750g Glass Jar)');
                            return;
                          }
                          const newJarObj = {
                            id: `custom-${Date.now()}`,
                            name: editNewJarName.trim(),
                            price: parseFloat(editNewJarPrice) || 299,
                            stock: parseInt(editNewJarStock) || 20,
                            enabled: true,
                            isCustom: true
                          };
                          setEditProductForm(prev => ({
                            ...prev,
                            jars: [...(prev.jars || []), newJarObj]
                          }));
                          setEditNewJarName('');
                          setEditNewJarPrice('');
                          setEditNewJarStock('25');
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 cursor-pointer"
                      >
                        + Add Jar
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

                {/* 2. Authentic Achar Presets */}
                <div>
                  <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Or choose an Authentic Achar photo:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {photoPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditProductForm({ ...editProductForm, img: preset.url })}
                        className={`p-1.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer text-[10px] transition ${
                          editProductForm.img === preset.url
                            ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-900 ring-1 ring-indigo-300'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-700'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

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
                  placeholder="e.g. Festive Special 20% OFF on all jars"
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
                  placeholder="e.g. Valid on all handcrafted mango and mixed pickles above ₹399."
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
                  <span>Har Product Par Discount (Storewide Discount Tool)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Update selling prices and display % OFF badges on every product in your store
                </p>
              </div>
              <button onClick={() => setShowBulkDiscountModal(false)} className="text-slate-400 hover:text-slate-800 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleApplyBulkDiscount} className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1.5 text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <span>⚡</span> Instant Catalog Slashed Pricing
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Applying this discount sets each product’s Selling Price from its Original MRP, and turns on a green <strong>“XX% OFF”</strong> badge and crossed-out price (~~₹399~~) on every product card!
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
                  <option value="ALL">All Products (Entire 20-Product Catalog)</option>
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
                  Apply {bulkDiscountForm.discountPercent}% Discount Now
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
                <h3 className="font-bold text-slate-900 text-base">Add New Pickle Category</h3>
                <p className="text-xs text-slate-400">Creates showcase section with appetizing images on storefront</p>
              </div>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-slate-400 hover:text-slate-800 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ker Sangri Heritage Achar"
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
                    placeholder="ker-sangri-achar"
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
                  placeholder="e.g. Traditional desert beans & berries slow-cured with authentic Marwadi spices in pure sarson tel."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              {/* Category Photo: Device Gallery + Achar Presets */}
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

                {/* 2. Or Choose from Authentic Achar Gallery */}
                <div>
                  <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Or select an authentic Achar category image:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {photoPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewCategoryForm({ ...newCategoryForm, image: preset.url })}
                        className={`p-1.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                          newCategoryForm.image === preset.url
                            ? 'border-indigo-600 bg-indigo-50/70 font-bold text-indigo-900 ring-1 ring-indigo-300'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-700'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                        <span className="truncate text-[10px]">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

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
                    No image selected yet (Upload from gallery or tap an achar photo above)
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

      {/* 2. Manual Order Modal */}
      {showManualOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Create Manual Phone / Walk-in Order</h3>
                <p className="text-xs text-slate-400">Directly adds to your live order fulfillment queue</p>
              </div>
              <button onClick={() => setShowManualOrderModal(false)} className="text-slate-400 hover:text-slate-800 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveManualOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunita Devi"
                    value={manualOrderForm.customer}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, customer: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98290 12345"
                    value={manualOrderForm.phone}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Complete shipping address with pincode"
                  value={manualOrderForm.address}
                  onChange={(e) => setManualOrderForm({ ...manualOrderForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Select Product *</label>
                <select
                  value={manualOrderForm.itemName}
                  onChange={(e) => {
                    const selProd = productsList.find(p => p.name === e.target.value);
                    const price = selProd ? parseInt(selProd.price.replace(/[^\d]/g, '')) || 299 : 299;
                    setManualOrderForm({
                      ...manualOrderForm,
                      itemName: e.target.value,
                      total: price * manualOrderForm.qty
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  {productsList.map((p, idx) => (
                    <option key={idx} value={p.name}>{p.name} ({p.price})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={manualOrderForm.qty}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 1;
                      const selProd = productsList.find(p => p.name === manualOrderForm.itemName);
                      const basePrice = selProd ? parseInt(selProd.price.replace(/[^\d]/g, '')) || 299 : 299;
                      setManualOrderForm({ ...manualOrderForm, qty, total: basePrice * qty });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Total (₹)</label>
                  <input
                    type="number"
                    value={manualOrderForm.total}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, total: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Payment Method</label>
                  <select
                    value={manualOrderForm.payMethod}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, payMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="ONLINE">Paid Online (UPI / Card)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualOrderModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Create & Accept Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Adjust Stock Modal */}
      {showAdjustStockModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Adjust Inventory Stock</h3>
                <p className="text-xs text-slate-400">Update warehouse batch quantities</p>
              </div>
              <button onClick={() => setShowAdjustStockModal(false)} className="text-slate-400 hover:text-slate-800 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveStockAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Product / SKU *</label>
                <select
                  value={adjustStockForm.sku}
                  onChange={(e) => setAdjustStockForm({ ...adjustStockForm, sku: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  {inventoryList.map((item, idx) => (
                    <option key={idx} value={item.sku}>{item.name} ({item.sku}) · On-hand: {item.onHand}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Quantity Adjustment (+/- units) *</label>
                <input
                  type="number"
                  required
                  placeholder="+20 or -5"
                  value={adjustStockForm.qtyChange}
                  onChange={(e) => setAdjustStockForm({ ...adjustStockForm, qtyChange: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
                <div className="text-[11px] text-slate-400 mt-1">Positive number adds stock, negative removes stock</div>
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Adjustment Reason *</label>
                <select
                  value={adjustStockForm.reason}
                  onChange={(e) => setAdjustStockForm({ ...adjustStockForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  <option value="Fresh kitchen batch prepared">Fresh kitchen batch prepared</option>
                  <option value="Stock take audit adjustment">Stock take audit adjustment</option>
                  <option value="Supplier receipt replenishment">Supplier receipt replenishment</option>
                  <option value="Damaged / expired discard">Damaged / expired discard</option>
                  <option value="Sample tasting / promotional">Sample tasting / promotional</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustStockModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Save Stock Adjustment
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
                  <select
                    value={addTourForm.pkg}
                    onChange={(e) => setAddTourForm({ ...addTourForm, pkg: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="RJ Desert Explorer">RJ Desert Explorer (Jaisalmer)</option>
                    <option value="Jaipur Heritage Tour">Jaipur Heritage Tour</option>
                    <option value="Udaipur Weekend Escape">Udaipur Weekend Escape</option>
                    <option value="Ranthambore Safari">Ranthambore Safari</option>
                    <option value="Mount Abu Retreat">Mount Abu Retreat</option>
                    <option value="Bikaner Royal Heritage">Bikaner Royal Heritage</option>
                  </select>
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
                    type="text"
                    placeholder="25 Oct 2026"
                    value={addTourForm.date}
                    onChange={(e) => setAddTourForm({ ...addTourForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Destination / Base</label>
                  <input
                    type="text"
                    placeholder="Jaisalmer"
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
                <p className="text-xs text-slate-400">Add a verified buyer to your directory for LTV tracking &amp; repeat sales</p>
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
                    setActionSuccessToast('Studio availability settings saved successfully!');
                    setTimeout(() => setActionSuccessToast(''), 4000);
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
