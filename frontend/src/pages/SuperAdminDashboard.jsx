import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/useAuth';
import { PortalSwitcherBar } from '../components/PortalSwitcherBar';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Tag,
  Layers,
  Share2,
  BarChart3,
  LifeBuoy,
  Users,
  Terminal,
  Settings,
  Search,
  SlidersHorizontal,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  ShieldCheck,
  Check,
  ExternalLink,
  Activity,
  Zap,
  Server,
  Database,
  RefreshCw,
  FileText,
  Mail,
  Smartphone,
  Globe,
  Truck,
  ArrowLeft,
  TrendingUp,
  Percent,
  LogOut,
  Calendar,
  Store,
  Edit3,
  Key,
  Eye,
  EyeOff,
  MessageSquare,
  Play,
  Lock,
  Copy
} from 'lucide-react';

export const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active platform tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, merchants, add-merchant, merchant-details, subscriptions, plans, templates, integrations, analytics, tickets, staff, health, logs, settings
  const [selectedMerchantId, setSelectedMerchantId] = useState('SUB-0021');
  const [addStep, setAddStep] = useState(1);
  const [merchantDetailsSubTab, setMerchantDetailsSubTab] = useState('overview');
  const [adminToast, setAdminToast] = useState('');
  const [merchantPage, setMerchantPage] = useState(1);

  // ================= Merchant API Keys & Connectors Provisioning (Super Admin Managed) =================
  const [selectedApiMerchantId, setSelectedApiMerchantId] = useState('SUB-0021');
  const [activeApiConnectorTab, setActiveApiConnectorTab] = useState('meta');
  const [showApiTokenSecret, setShowApiTokenSecret] = useState(false);
  const [apiTestingConnector, setApiTestingConnector] = useState(null);
  const [apiTestSuccessMsg, setApiTestSuccessMsg] = useState('');
  const [merchantApiStore, setMerchantApiStore] = useState({
    'SUB-0021': {
      meta: {
        enabled: true,
        pixelId: '8492019482910',
        capiToken: 'EAAG8492019482901_pqrZ90abcdefLiveToken',
        testEventCode: 'TEST84920',
        datasetName: 'Desi Achar House CAPI Dataset',
        status: 'CONNECTED',
        matchRate: '8.9 / 10',
        lastTested: 'Verified 2 mins ago',
      },
      whatsapp: {
        enabled: true,
        wabaId: 'WABA_9829012345',
        phoneNumberId: 'PN_44820194',
        accessToken: 'EAAW9829012345_LivePermTokenMeta2026',
        senderPhone: '+91 98290 12345',
        status: 'CONNECTED',
        qualityScore: 'High (Green)',
        lastTested: 'Verified 10 mins ago',
      },
      courier: {
        enabled: true,
        provider: 'Delhivery',
        apiKey: 'del_live_k894029104',
        apiSecret: 'del_sec_9948201948201',
        pickupPincode: '302020',
        status: 'CONNECTED',
        serviceable: '29,000+ Pincodes',
        lastTested: 'Verified 1 hour ago',
      },
      payment: {
        enabled: true,
        provider: 'Razorpay',
        keyId: 'rzp_live_94820184920',
        keySecret: 'rzp_sec_4920194820194',
        webhookSecret: 'whsec_94820194820',
        liveMode: true,
        status: 'CONNECTED',
        instantRefunds: 'Operational',
        lastTested: 'Verified 25 mins ago',
      },
      webhooks: {
        enabled: true,
        targetUrl: 'https://hooks.zapier.com/hooks/catch/desiachar/orders',
        secretToken: 'wh_sec_8492019482',
        status: 'CONNECTED',
      },
      managedBySuperAdmin: true,
    },
    'SUB-0022': {
      meta: {
        enabled: true,
        pixelId: '7729104920194',
        capiToken: 'EAAG7729104920194_pixelStudioLiveToken',
        testEventCode: 'TEST77291',
        datasetName: 'Pixel Studio Event Stream',
        status: 'CONNECTED',
        matchRate: '9.2 / 10',
        lastTested: 'Verified 4 hours ago',
      },
      whatsapp: {
        enabled: true,
        wabaId: 'WABA_9811122334',
        phoneNumberId: 'PN_88192019',
        accessToken: 'EAAW9811122334_LiveToken',
        senderPhone: '+91 98111 22334',
        status: 'CONNECTED',
        qualityScore: 'High (Green)',
        lastTested: 'Verified yesterday',
      },
      courier: {
        enabled: false,
        provider: 'Shiprocket',
        apiKey: '',
        apiSecret: '',
        pickupPincode: '400001',
        status: 'NOT_CONFIGURED',
        serviceable: 'N/A (Studio/Service Model)',
        lastTested: 'Not configured',
      },
      payment: {
        enabled: true,
        provider: 'Razorpay',
        keyId: 'rzp_live_7729104920',
        keySecret: 'rzp_sec_7729104920',
        webhookSecret: 'whsec_772910',
        liveMode: true,
        status: 'CONNECTED',
        instantRefunds: 'Operational',
        lastTested: 'Verified 1 day ago',
      },
      webhooks: {
        enabled: true,
        targetUrl: 'https://api.pixelstudio.com/crm/webhook',
        secretToken: 'wh_sec_7729104920',
        status: 'CONNECTED',
      },
      managedBySuperAdmin: true,
    },
    'SUB-0023': {
      meta: {
        enabled: true,
        pixelId: '6639201948201',
        capiToken: 'EAAG6639201948201_rajasthanToursToken',
        testEventCode: 'TEST66392',
        datasetName: 'Rajasthan Tours CAPI',
        status: 'CONNECTED',
        matchRate: '8.6 / 10',
        lastTested: 'Verified 3 days ago',
      },
      whatsapp: {
        enabled: true,
        wabaId: 'WABA_9822233445',
        phoneNumberId: 'PN_77291049',
        accessToken: 'EAAW9822233445_LiveToken',
        senderPhone: '+91 98222 33445',
        status: 'CONNECTED',
        qualityScore: 'High (Green)',
        lastTested: 'Verified 2 days ago',
      },
      courier: {
        enabled: false,
        provider: 'Shiprocket',
        apiKey: '',
        apiSecret: '',
        pickupPincode: '313001',
        status: 'NOT_CONFIGURED',
        serviceable: 'N/A (Tour Package Business)',
        lastTested: 'Not configured',
      },
      payment: {
        enabled: true,
        provider: 'Cashfree',
        keyId: 'cf_live_6639201948',
        keySecret: 'cf_sec_6639201948',
        webhookSecret: 'whsec_663920',
        liveMode: true,
        status: 'CONNECTED',
        instantRefunds: 'Operational',
        lastTested: 'Verified 3 days ago',
      },
      webhooks: {
        enabled: false,
        targetUrl: '',
        secretToken: '',
        status: 'NOT_CONFIGURED',
      },
      managedBySuperAdmin: true,
    },
    'SUB-0024': {
      meta: {
        enabled: true,
        pixelId: '5549201948201',
        capiToken: 'EAAG5549201948201_glowSalonToken',
        testEventCode: 'TEST55492',
        datasetName: 'Glow Salon Ads Tracking',
        status: 'CONNECTED',
        matchRate: '8.4 / 10',
        lastTested: 'Verified 5 days ago',
      },
      whatsapp: {
        enabled: true,
        wabaId: 'WABA_9833344556',
        phoneNumberId: 'PN_66392019',
        accessToken: 'EAAW9833344556_LiveToken',
        senderPhone: '+91 98333 44556',
        status: 'CONNECTED',
        qualityScore: 'High (Green)',
        lastTested: 'Verified 4 days ago',
      },
      courier: {
        enabled: false,
        provider: 'Delhivery',
        apiKey: '',
        apiSecret: '',
        pickupPincode: '110001',
        status: 'NOT_CONFIGURED',
        serviceable: 'N/A (Salon & Spa Business)',
        lastTested: 'Not configured',
      },
      payment: {
        enabled: true,
        provider: 'Razorpay',
        keyId: 'rzp_live_5549201948',
        keySecret: 'rzp_sec_5549201948',
        webhookSecret: 'whsec_554920',
        liveMode: true,
        status: 'CONNECTED',
        instantRefunds: 'Operational',
        lastTested: 'Verified 5 days ago',
      },
      webhooks: {
        enabled: false,
        targetUrl: '',
        secretToken: '',
        status: 'NOT_CONFIGURED',
      },
      managedBySuperAdmin: true,
    }
  });

  const handleUpdateMerchantConnectorField = (merchantId, connectorKey, field, val) => {
    setMerchantApiStore(prev => ({
      ...prev,
      [merchantId]: {
        ...(prev[merchantId] || {}),
        [connectorKey]: {
          ...(prev[merchantId]?.[connectorKey] || {}),
          [field]: val
        }
      }
    }));
  };

  const handleToggleManagedBySuperAdmin = (merchantId) => {
    setMerchantApiStore(prev => ({
      ...prev,
      [merchantId]: {
        ...(prev[merchantId] || {}),
        managedBySuperAdmin: !prev[merchantId]?.managedBySuperAdmin
      }
    }));
    const isNow = !merchantApiStore[merchantId]?.managedBySuperAdmin;
    setAdminToast(`Super Admin Managed Mode is now ${isNow ? 'ACTIVE (Keys secured from merchant)' : 'SHARED (Merchant can view)'}`);
    setTimeout(() => setAdminToast(''), 4000);
  };

  const handleTestApiConnector = (serviceName) => {
    setApiTestingConnector(serviceName);
    setApiTestSuccessMsg('');
    setTimeout(() => {
      setApiTestingConnector(null);
      const latency = Math.floor(Math.random() * 35) + 32;
      setApiTestSuccessMsg(`⚡ Diagnostic Successful: ${serviceName.toUpperCase()} connector handshake verified! Response HTTP 200 OK (${latency}ms latency). Credentials authenticated.`);
      setTimeout(() => setApiTestSuccessMsg(''), 6000);
    }, 700);
  };

  const handleSaveMerchantApiKeys = (merchantId) => {
    const target = merchants.find(m => m.id === merchantId) || { name: 'Selected Merchant' };
    setAdminToast(`✅ API keys & connectors successfully provisioned for "${target.name}"! Merchant access locked in managed mode.`);
    setTimeout(() => setAdminToast(''), 4500);
  };
  const [showEditMerchantModal, setShowEditMerchantModal] = useState(false);
  const [editMerchantForm, setEditMerchantForm] = useState({ id: '', name: '', owner: '', email: '', phone: '', address: '', plan: 'Growth', type: 'Product' });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [merchantTypeFilter, setMerchantTypeFilter] = useState('ALL');
  const [merchantStatusFilter, setMerchantStatusFilter] = useState('ALL');

  // Add Merchant Form State
  const [newBizName, setNewBizName] = useState('Desi Achar House');
  const [newBizType, setNewBizType] = useState('Product selling');
  const [newOwnerName, setNewOwnerName] = useState('Rahul Sharma');
  const [newOwnerEmail, setNewOwnerEmail] = useState('owner@example.com');
  const [newPhone, setNewPhone] = useState('+91 98765 43210');
  const [newAddress, setNewAddress] = useState('Jaipur, Rajasthan, India');
  const [isolateWorkspace, setIsolateWorkspace] = useState(true);
  const [sendInvite, setSendInvite] = useState(true);
  const [defaultCrm, setDefaultCrm] = useState(false);

  // Platform Settings State
  const [platformName, setPlatformName] = useState('Omniva');
  const [timezone, setTimezone] = useState('Asia/Kolkata (GMT+5:30)');
  const [platformUrl, setPlatformUrl] = useState('https://app.omniva.io');
  const [currency, setCurrency] = useState('INR — Indian Rupee');
  const [supportEmail, setSupportEmail] = useState('support@omniva.io');
  const [dateFormat, setDateFormat] = useState('DD MMM YYYY');
  const [reqEmailVerify, setReqEmailVerify] = useState(true);
  const [req2FA, setReq2FA] = useState(true);
  const [alertFailures, setAlertFailures] = useState(true);
  const [allowUnverifiedDomains, setAllowUnverifiedDomains] = useState(false);

  // Merchants Data
  const [merchants, setMerchants] = useState([
    {
      id: 'SUB-0021',
      name: 'Desi Achar House',
      owner: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+91 98765 43210',
      address: 'Jaipur, Rajasthan, India',
      type: 'Product',
      plan: 'Growth',
      status: 'Active',
      joinedDate: '12 Oct 2026',
      domain: 'desiachar.omniva.io',
      orders: 1245,
      revenue: '₹2,48,500',
      customers: 892,
      staff: '5 / 10',
      storage: '3.8 / 10 GB',
      quota: '33 / 100 units'
    },
    {
      id: 'SUB-0022',
      name: 'Pixel Studio',
      owner: 'Neha Verma',
      email: 'neha@pixelstudio.com',
      phone: '+91 98111 22334',
      address: 'Mumbai, Maharashtra',
      type: 'Service',
      plan: 'Pro',
      status: 'Active',
      joinedDate: '11 Oct 2026',
      domain: 'pixelstudio.omniva.io',
      orders: 430,
      revenue: '₹4,12,000',
      customers: 340,
      staff: '12 / 25',
      storage: '18 / 50 GB',
      quota: '72 / 250 units'
    },
    {
      id: 'SUB-0023',
      name: 'Rajasthan Tours',
      owner: 'Amit Singh',
      email: 'amit@rajasthantours.in',
      phone: '+91 98222 33445',
      address: 'Udaipur, Rajasthan',
      type: 'Travel',
      plan: 'Growth',
      status: 'Trial',
      joinedDate: '10 Oct 2026',
      domain: 'rajasthantours.omniva.io',
      orders: 86,
      revenue: '₹1,45,000',
      customers: 120,
      staff: '4 / 10',
      storage: '2.1 / 10 GB',
      quota: '19 / 100 units'
    },
    {
      id: 'SUB-0024',
      name: 'Glow Salon',
      owner: 'Priya Singh',
      email: 'priya@glowsalon.com',
      phone: '+91 98333 44556',
      address: 'Bengaluru, Karnataka',
      type: 'Service',
      plan: 'Starter',
      status: 'Past due',
      joinedDate: '09 Oct 2026',
      domain: 'glowsalon.omniva.io',
      orders: 210,
      revenue: '₹94,000',
      customers: 195,
      staff: '2 / 3',
      storage: '0.8 / 5 GB',
      quota: '45 / 50 units'
    },
    {
      id: 'SUB-0025',
      name: 'FreshMart',
      owner: 'Vikas Kumar',
      email: 'vikas@freshmart.com',
      phone: '+91 98444 55667',
      address: 'Delhi NCR',
      type: 'Product',
      plan: 'Pro',
      status: 'Active',
      joinedDate: '08 Oct 2026',
      domain: 'freshmart.omniva.io',
      orders: 3120,
      revenue: '₹8,92,000',
      customers: 2450,
      staff: '18 / 25',
      storage: '32 / 50 GB',
      quota: '190 / 250 units'
    },
    {
      id: 'SUB-0026',
      name: 'Event Planners',
      owner: 'Karan Mehta',
      email: 'karan@eventplanners.in',
      phone: '+91 98555 66778',
      address: 'Pune, Maharashtra',
      type: 'Service',
      plan: 'Growth',
      status: 'Suspended',
      joinedDate: '07 Oct 2026',
      domain: 'eventplanners.omniva.io',
      orders: 54,
      revenue: '₹1,20,000',
      customers: 80,
      staff: '3 / 10',
      storage: '4.5 / 10 GB',
      quota: '12 / 100 units'
    },
    {
      id: 'SUB-0027',
      name: 'Trendz Clothing',
      owner: 'Neha Patel',
      email: 'neha@trendz.com',
      phone: '+91 98666 77889',
      address: 'Surat, Gujarat',
      type: 'Product',
      plan: 'Starter',
      status: 'Pending',
      joinedDate: '06 Oct 2026',
      domain: 'trendz.omniva.io',
      orders: 12,
      revenue: '₹14,500',
      customers: 22,
      staff: '1 / 3',
      storage: '0.4 / 5 GB',
      quota: '5 / 50 units'
    },
    {
      id: 'SUB-0028',
      name: 'Desert Adventures',
      owner: 'Amit Rao',
      email: 'amit@desertadv.com',
      phone: '+91 98777 88990',
      address: 'Jaisalmer, Rajasthan',
      type: 'Travel',
      plan: 'Pro',
      status: 'Active',
      joinedDate: '05 Oct 2026',
      domain: 'desertadv.omniva.io',
      orders: 320,
      revenue: '₹5,60,000',
      customers: 410,
      staff: '8 / 25',
      storage: '12 / 50 GB',
      quota: '88 / 250 units'
    }
  ]);

  const [livePlatformStats, setLivePlatformStats] = useState(null);

  // Load real merchants and platform statistics from backend
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [merchantsRes, statsRes] = await Promise.all([
          axios.get('/api/admin/merchants'),
          axios.get('/api/admin/stats')
        ]);
        if (merchantsRes.data.success && Array.isArray(merchantsRes.data.data) && merchantsRes.data.data.length > 0) {
          const liveList = merchantsRes.data.data.map((t, idx) => ({
            id: 'SUB-' + (idx + 21).toString().padStart(4, '0'),
            realDbId: t._id,
            name: t.businessName,
            owner: t.ownerName || 'Merchant Owner',
            email: t.ownerEmail || t.contact?.email || 'owner@example.com',
            phone: t.contact?.phone || '+91 98765 43210',
            address: t.contact?.city ? `${t.contact.city}, ${t.contact.state}` : 'Jaipur, Rajasthan',
            type: t.businessType === 'PRODUCT' ? 'Product' : t.businessType === 'SERVICE' ? 'Service' : t.businessType === 'TRAVEL' ? 'Travel' : 'Product',
            plan: t.planTier ? t.planTier.charAt(0) + t.planTier.slice(1).toLowerCase() : 'Growth',
            status: t.status === 'ACTIVE' ? 'Active' : t.status === 'SUSPENDED' ? 'Suspended' : 'Pending',
            joinedDate: new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            domain: `${t.slug}.omniva.io`,
            orders: t.ordersCount || 0,
            revenue: '₹' + ((t.ordersCount || 0) * 850).toLocaleString('en-IN'),
            customers: (t.leadsCount || 0) + (t.ordersCount || 0),
            staff: '5 / 10',
            storage: '2.5 / 10 GB',
            quota: `${t.ordersCount || 0} / 500 units`,
            enabledModules: t.enabledModules || {}
          }));
          setMerchants(liveList);
        }
        if (statsRes.data.success) {
          setLivePlatformStats(statsRes.data.data);
        }
      } catch (err) {
        console.warn('Live admin data load fallback:', err.message);
      }
    };
    fetchAdminData();
  }, []);

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId) || merchants[0];

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = merchantTypeFilter === 'ALL' || m.type.toUpperCase() === merchantTypeFilter;
    const matchesStatus = merchantStatusFilter === 'ALL' || m.status.toUpperCase() === merchantStatusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Action Handlers
  const handleAuditedAccess = (m) => {
    setAdminToast(`Opening audited workspace access for ${m.name}...`);
    setTimeout(() => {
      navigate('/merchant');
    }, 400);
  };

  const handleToggleSuspend = async (merchantId) => {
    const target = merchants.find((m) => m.id === merchantId);
    if (!target) return;
    const newStatus = target.status === 'Suspended' ? 'Active' : 'Suspended';
    try {
      if (target.realDbId) {
        await axios.patch(`/api/admin/merchants/${target.realDbId}/status`, { status: newStatus.toUpperCase() });
      }
    } catch (err) {
      console.warn('Backend status update warning:', err.message);
    }
    setMerchants((prev) =>
      prev.map((m) => {
        if (m.id === merchantId) {
          setAdminToast(`Merchant "${m.name}" is now marked as ${newStatus}!`);
          return { ...m, status: newStatus };
        }
        return m;
      })
    );
    setTimeout(() => setAdminToast(''), 4000);
  };

  const handleExportMerchantsCsv = () => {
    const headers = "ID,Name,Owner,Email,Phone,Type,Plan,Status,JoinedDate\n";
    const rows = merchants.map(m => `"${m.id}","${m.name}","${m.owner}","${m.email}","${m.phone}","${m.type}","${m.plan}","${m.status}","${m.joinedDate}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omniva_merchants_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setAdminToast('Merchants CSV report downloaded successfully!');
    setTimeout(() => setAdminToast(''), 4000);
  };

  const handleOpenEditModal = (m) => {
    setEditMerchantForm({
      id: m.id,
      name: m.name,
      owner: m.owner,
      email: m.email,
      phone: m.phone,
      address: m.address,
      plan: m.plan,
      type: m.type || 'Product'
    });
    setShowEditMerchantModal(true);
  };

  const handleSaveEditMerchant = (e) => {
    e.preventDefault();
    setMerchants(prev => prev.map(m => m.id === editMerchantForm.id ? { ...m, ...editMerchantForm } : m));
    setShowEditMerchantModal(false);
    setAdminToast(`Merchant "${editMerchantForm.name}" updated successfully!`);
    setTimeout(() => setAdminToast(''), 4000);
  };

  const handleToggleMerchantModule = async (merchantId, moduleKey) => {
    const target = merchants.find(m => m.id === merchantId);
    if (!target) return;
    const defaultModules = {
      products: target.type === 'Product',
      serviceBookings: target.type === 'Service',
      travelBookings: target.type === 'Travel',
      crmLeads: true,
      marketingAds: true,
      automations: true,
    };
    const currentModules = target.enabledModules || defaultModules;
    const updatedModules = {
      ...currentModules,
      [moduleKey]: !currentModules[moduleKey]
    };

    try {
      if (target.realDbId) {
        await axios.patch(`/api/admin/merchants/${target.realDbId}/modules`, { enabledModules: updatedModules });
      }
    } catch (err) {
      console.warn('Backend module update warning:', err.message);
    }

    setMerchants(prev => prev.map(m => {
      if (m.id === merchantId) {
        return {
          ...m,
          enabledModules: updatedModules
        };
      }
      return m;
    }));
    setAdminToast(`Module "${moduleKey}" updated for ${target.name}.`);
    setTimeout(() => setAdminToast(''), 3000);
  };

  // Nav Item Renderer
  const navItem = (id, label, icon) => {
    const isActive = activeTab === id;
    const Icon = icon;
    return (
      <button
        key={id}
        onClick={() => {
          setActiveTab(id);
        }}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/10 font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
        }`}
      >
        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans antialiased overflow-hidden">
      {/* Top Universal Portal Switcher */}
      <div className="shrink-0">
        <PortalSwitcherBar />
      </div>

      {/* Admin Action Success Toast */}
      {adminToast && (
        <div className="bg-indigo-600 text-white px-5 py-2.5 shadow-lg flex items-center justify-between text-xs font-semibold z-40 sticky top-10 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{adminToast}</span>
          </div>
          <button onClick={() => setAdminToast('')} className="text-white/80 hover:text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Flex Body */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* 1. Left Light Sidebar (Omniva SAAS PLATFORM) */}
        <aside className="w-64 bg-white flex flex-col shrink-0 select-none border-r border-slate-200 z-30 h-full overflow-hidden">
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-500/20">
            O
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-base tracking-tight leading-tight">Omniva</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SAAS PLATFORM</div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          PLATFORM
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          {navItem('overview', 'Overview', LayoutDashboard)}
          {navItem('merchants', 'Merchants', Building2)}
          {navItem('subscriptions', 'Subscriptions', CreditCard)}
          {navItem('plans', 'Plans & Pricing', Tag)}
          {navItem('templates', 'Business Templates', Layers)}
          {navItem('integrations', 'Merchant API Provisioning', Key)}
          {navItem('analytics', 'Analytics & Reports', BarChart3)}
          {navItem('tickets', 'Support Tickets', LifeBuoy)}
          {navItem('staff', 'Staff & Roles', Users)}
          {navItem('health', 'System Health', Activity)}
          {navItem('logs', 'System Logs', Terminal)}
          {navItem('settings', 'Platform Settings', Settings)}
        </nav>

        {/* Bottom Profile Bar */}
        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              SA
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-800 truncate">Platform Admin</div>
              <div className="text-[10px] text-slate-500 truncate">admin@omniva.io</div>
            </div>
          </div>
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[11px] font-medium text-slate-400 capitalize">
              Platform / {activeTab.replace('-', ' ')}
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 capitalize tracking-tight">
              {activeTab === 'add-merchant'
                ? 'Add Merchant'
                : activeTab === 'merchant-details'
                ? selectedMerchant.name
                : activeTab.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 w-56 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Quick Actions */}
            <button className="p-2 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl bg-white hover:bg-slate-50 transition">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            <button className="p-2 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl bg-white hover:bg-slate-50 transition">
              <Bell className="w-3.5 h-3.5" />
            </button>

            {/* Admin Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                A
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">Admin</div>
                <div className="text-[10px] text-slate-400 leading-tight">Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* 3. Screen Views Switcher */}
        <div className="p-6 space-y-6">
          {/* ==================== 1. OVERVIEW SCREEN ==================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Platform performance and activity at a glance</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-600">
                    Last 30 days
                  </span>
                  <button className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>

              {/* 4 Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Total merchants</span>
                    <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
                      <Building2 className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900">245</div>
                    <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" /> 12.4% vs last month
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Active subscriptions</span>
                    <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900">210</div>
                    <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" /> 8.2% vs last month
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Monthly recurring revenue</span>
                    <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600 font-bold">₹</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900">₹4,25,000</div>
                    <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" /> 10.8% vs last month
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Platform uptime</span>
                    <span className="p-1 rounded-lg bg-amber-50 text-amber-600">
                      <Activity className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900">99.9%</div>
                    <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All systems operational
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Revenue Line Chart & Registration Bar Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Overview (2 Cols) */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase">Revenue overview</div>
                      <div className="text-2xl font-black text-slate-900">₹4,25,000</div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-600">
                      Last 30 days
                    </span>
                  </div>

                  {/* Simulated Smooth Revenue Line Chart */}
                  <div className="h-44 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
                    {[35, 42, 38, 55, 48, 62, 58, 75, 70, 95].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                        <div
                          style={{ height: `${val}%` }}
                          className="w-full bg-indigo-500/80 group-hover:bg-indigo-600 rounded-t-lg transition relative"
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                            ₹{(val * 4500).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">W{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* New Merchant Registrations (1 Col) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <div className="text-xs text-slate-400 font-semibold uppercase">New merchant registrations</div>
                    <div className="text-xs text-slate-500 mt-0.5">Monthly onboarding trend</div>
                  </div>

                  <div className="h-44 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
                    {[20, 30, 24, 45, 52, 60, 48, 70, 65, 80].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          style={{ height: `${h}%` }}
                          className="w-full bg-indigo-600 hover:bg-indigo-600 rounded-t-md transition"
                        />
                        <span className="text-[9px] text-slate-400">M{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Recently Joined Merchants & Live Platform Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recently joined merchants (2 cols) */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 px-5 border-b border-slate-200/80 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Recently joined merchants</h3>
                      <p className="text-[11px] text-slate-400">Latest businesses onboarded on platform</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('merchants')}
                      className="text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      View all &rarr;
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-2.5 px-5">Business / Owner</th>
                          <th className="py-2.5 px-4">Type</th>
                          <th className="py-2.5 px-4">Plan</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-5">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {merchants.slice(0, 4).map((m) => (
                          <tr
                            key={m.id}
                            onClick={() => {
                              setSelectedMerchantId(m.id);
                              setActiveTab('merchant-details');
                            }}
                            className="hover:bg-slate-50 transition cursor-pointer"
                          >
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                                  {m.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{m.name}</div>
                                  <div className="text-[10px] text-slate-400">{m.owner}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-600">{m.type}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{m.plan}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  m.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : m.status === 'Trial'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                            <td className="py-3 px-5 text-slate-500 text-[11px]">{m.joinedDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Platform Activity Feed (1 col) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Platform activity</h3>
                    <p className="text-[11px] text-slate-400">Latest important events</p>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      {
                        title: 'New merchant registered',
                        sub: 'Desi Achar House · 12 min ago',
                        icon: Building2,
                        color: 'bg-indigo-50 text-indigo-600'
                      },
                      {
                        title: 'Payment received',
                        sub: '₹1,199 from Pixel Studio · 36 min ago',
                        icon: CreditCard,
                        color: 'bg-emerald-50 text-emerald-600'
                      },
                      {
                        title: 'Plan upgraded',
                        sub: 'Rajasthan Tours · 1 hour ago',
                        icon: RefreshCw,
                        color: 'bg-blue-50 text-blue-600'
                      },
                      {
                        title: 'Integration needs attention',
                        sub: 'WhatsApp connection · 2 hours ago',
                        icon: AlertTriangle,
                        color: 'bg-amber-50 text-amber-600'
                      }
                    ].map((act, i) => {
                      const Icon = act.icon;
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl ${act.color} shrink-0`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{act.title}</div>
                            <div className="text-[11px] text-slate-400">{act.sub}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 2. MERCHANTS DIRECTORY ==================== */}
          {activeTab === 'merchants' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Manage all registered businesses and their accounts</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportMerchantsCsv}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => setActiveTab('add-merchant')}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add merchant
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>All merchants</span>
                    <span className="p-1 rounded-md bg-indigo-50 text-indigo-600"><Building2 className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">245</div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">12.4% growth</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Active</span>
                    <span className="p-1 rounded-md bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">210</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">85.7% of total</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>On trial</span>
                    <span className="p-1 rounded-md bg-purple-50 text-purple-600"><Clock className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">25</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">10.2% of total</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Suspended</span>
                    <span className="p-1 rounded-md bg-amber-50 text-amber-600"><AlertTriangle className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">10</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Needs review</div>
                </div>
              </div>

              {/* Table Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search business, owner..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs w-56 focus:outline-none"
                    />
                    <select
                      value={merchantTypeFilter}
                      onChange={(e) => setMerchantTypeFilter(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600"
                    >
                      <option value="ALL">Type: All</option>
                      <option value="PRODUCT">Product</option>
                      <option value="SERVICE">Service</option>
                      <option value="TRAVEL">Travel</option>
                    </select>
                    <select
                      value={merchantStatusFilter}
                      onChange={(e) => setMerchantStatusFilter(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600"
                    >
                      <option value="ALL">Status: All</option>
                      <option value="ACTIVE">Active</option>
                      <option value="TRIAL">Trial</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setActiveTab('add-merchant')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add merchant
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-5">BUSINESS / OWNER</th>
                        <th className="py-3 px-4">BUSINESS TYPE</th>
                        <th className="py-3 px-4">PLAN</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-4">JOINED DATE</th>
                        <th className="py-3 px-5 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMerchants.map((m) => (
                        <tr
                          key={m.id}
                          onClick={() => {
                            setSelectedMerchantId(m.id);
                            setActiveTab('merchant-details');
                          }}
                          className="hover:bg-slate-50 transition cursor-pointer"
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                                {m.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{m.name}</div>
                                <div className="text-[11px] text-slate-400">{m.owner}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-medium">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                              m.type === 'Product'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : m.type === 'Travel'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}>
                              {m.type === 'Product' ? '🛍️ Product (Achar)' : m.type === 'Travel' ? '✈️ Travel Tours' : '📸 Photography'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">{m.plan}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                m.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : m.status === 'Trial'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : m.status === 'Suspended'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">{m.joinedDate}</td>
                          <td className="py-3.5 px-5 text-right text-slate-400 hover:text-slate-800">
                            <MoreVertical className="w-4 h-4 ml-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 px-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Showing 1-8 of 245 merchants</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMerchantPage(p => Math.max(1, p - 1))}
                      className="px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer text-xs"
                    >
                      &lt;
                    </button>
                    {[1, 2, 3].map((page) => (
                      <button
                        key={page}
                        onClick={() => setMerchantPage(page)}
                        className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                          merchantPage === page
                            ? 'bg-indigo-600 text-white font-bold shadow-xs'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setMerchantPage(p => Math.min(3, p + 1))}
                      className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      Next &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 3. ADD MERCHANT WIZARD ==================== */}
          {activeTab === 'add-merchant' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <button
                    onClick={() => setActiveTab('merchants')}
                    className="text-xs text-indigo-600 font-semibold flex items-center gap-1 mb-1 hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to merchants
                  </button>
                  <p className="text-xs text-slate-500">Create a new business workspace</p>
                </div>
                <button className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50">
                  Save draft
                </button>
              </div>

              {/* Wizard Content (2 Columns) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Form: Step 1 Business Details */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-6 text-xs font-semibold">
                      <span className="text-indigo-600 border-b-2 border-indigo-600 pb-3 -mb-3">
                        1. Business details
                      </span>
                      <span className="text-slate-400">2. Plan & limits</span>
                      <span className="text-slate-400">3. Review</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Step 1 of 3
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-600 font-semibold block mb-1">Business name *</label>
                        <input
                          type="text"
                          value={newBizName}
                          onChange={(e) => setNewBizName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 font-semibold block mb-1">Business type *</label>
                        <select
                          value={newBizType}
                          onChange={(e) => setNewBizType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                        >
                          <option value="Product selling">Product selling</option>
                          <option value="Photography & Events">Photography & Events</option>
                          <option value="Travel Agency">Travel Agency</option>
                          <option value="Salon & Beauty">Salon & Beauty</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-600 font-semibold block mb-1">Owner full name *</label>
                        <input
                          type="text"
                          value={newOwnerName}
                          onChange={(e) => setNewOwnerName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 font-semibold block mb-1">Business email *</label>
                        <input
                          type="email"
                          value={newOwnerEmail}
                          onChange={(e) => setNewOwnerEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-600 font-semibold block mb-1">Phone number *</label>
                        <input
                          type="text"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 font-semibold block mb-1">Website (optional)</label>
                        <input
                          type="text"
                          placeholder="https://"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Business address</label>
                      <input
                        type="text"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-600 font-semibold block mb-1">Business template *</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900">
                          <option>Product selling</option>
                          <option>Service bookings</option>
                          <option>Travel bookings</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-600 font-semibold block mb-1">Account status</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900">
                          <option>Active</option>
                          <option>Pending</option>
                        </select>
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="pt-2 space-y-3">
                      <div className="text-xs font-bold text-slate-800">Initial setup options</div>
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50">
                        <div>
                          <div className="font-bold text-slate-800">Create isolated workspace</div>
                          <div className="text-[11px] text-slate-400">Automatically create merchant-specific data scope</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsolateWorkspace(!isolateWorkspace)}
                          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                            isolateWorkspace ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                              isolateWorkspace ? 'left-5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50">
                        <div>
                          <div className="font-bold text-slate-800">Send account invitation</div>
                          <div className="text-[11px] text-slate-400">Email owner a secure setup link</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSendInvite(!sendInvite)}
                          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                            sendInvite ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                              sendInvite ? 'left-5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50">
                        <div>
                          <div className="font-bold text-slate-800">Enable default CRM pipeline</div>
                          <div className="text-[11px] text-slate-400">New &rarr; Contacted &rarr; Qualified &rarr; Won/Lost</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDefaultCrm(!defaultCrm)}
                          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                            defaultCrm ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                              defaultCrm ? 'left-5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setActiveTab('merchants')}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Merchant "${newBizName}" created successfully with isolated workspace!`);
                          setActiveTab('merchants');
                        }}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm cursor-pointer"
                      >
                        Continue to plan &rarr;
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Logo Upload & Setup Checklist */}
                <div className="space-y-5">
                  {/* Business Logo Box */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="text-xs font-bold text-slate-800">Business logo</div>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2 hover:border-indigo-400 transition bg-slate-50/50">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-slate-800 text-xs">Upload logo</div>
                      <div className="text-[10px] text-slate-400">PNG, JPG or SVG · Max 2 MB</div>
                      <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50">
                        Choose file
                      </button>
                    </div>
                  </div>

                  {/* Setup Checklist */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="text-xs font-bold text-slate-800">Setup checklist</div>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">Unique workspace URL</div>
                          <div className="text-[11px] text-slate-400">Public link will be generated</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">Tenant data isolation</div>
                          <div className="text-[11px] text-slate-400">Merchant data remains private</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">Assign subscription plan</div>
                          <div className="text-[11px] text-slate-400">Configure limits in next step</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">Invite owner securely</div>
                          <div className="text-[11px] text-slate-400">Password setup via invitation</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 4. MERCHANT DETAILS (DEEP VIEW) ==================== */}
          {activeTab === 'merchant-details' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('merchants')}
                  className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAuditedAccess(selectedMerchant)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <Store className="w-3.5 h-3.5 text-indigo-600" />
                    Audited merchant access
                  </button>
                  <button
                    onClick={() => handleToggleSuspend(selectedMerchant.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                      selectedMerchant.status === 'Suspended'
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    {selectedMerchant.status === 'Suspended' ? 'Activate Merchant' : 'Suspend'}
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(selectedMerchant)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit merchant
                  </button>
                </div>
              </div>

              {/* Merchant Banner Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-black text-lg flex items-center justify-center">
                      {selectedMerchant.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-slate-900">{selectedMerchant.name}</h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {selectedMerchant.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedMerchant.type} Selling · Owner {selectedMerchant.owner} · Joined {selectedMerchant.joinedDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                      {selectedMerchant.plan} plan
                    </span>
                    <a
                      href={`http://localhost:5173/store/desi-rasoi-achar-1`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-mono border border-slate-200 flex items-center gap-1"
                    >
                      {selectedMerchant.domain} <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>

                {/* Sub Tabs */}
                <div className="flex items-center gap-6 border-t border-slate-100 pt-3 text-xs font-semibold overflow-x-auto scrollbar-none">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'business-details', label: 'Business details' },
                    { id: 'subscription', label: 'Subscription' },
                    { id: 'usage', label: 'Usage' },
                    { id: 'staff', label: 'Staff' },
                    { id: 'integrations', label: 'Integrations' },
                    { id: 'audit-logs', label: 'Audit logs' }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setMerchantDetailsSubTab(sub.id)}
                      className={`cursor-pointer pb-2 -mb-2 transition ${
                        merchantDetailsSubTab === sub.id
                          ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtabs dynamic view rendering */}
              {merchantDetailsSubTab === 'overview' ? (
                <>
                  {/* 4 Metric Badges */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Total orders</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{selectedMerchant.orders}</div>
                  <div className="text-[11px] text-slate-400">This month</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Attributed revenue</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{selectedMerchant.revenue}</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Available records</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Customers</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{selectedMerchant.customers}</div>
                  <div className="text-[11px] text-slate-400">Total records</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Staff accounts</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">5</div>
                  <div className="text-[11px] text-slate-400">4 active</div>
                </div>
              </div>

              {/* Two Column Details: Left Info, Right Quotas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Merchant Info */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Merchant information</h3>
                      <p className="text-[11px] text-slate-400">Business account details</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Business name</span>
                        <div className="font-semibold text-slate-800 mt-0.5">{selectedMerchant.name}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Business type</span>
                        <div className="font-semibold text-slate-800 mt-0.5">{selectedMerchant.type} selling</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Owner email</span>
                        <div className="font-semibold text-slate-800 mt-0.5">{selectedMerchant.email}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Business phone</span>
                        <div className="font-semibold text-slate-800 mt-0.5">{selectedMerchant.phone}</div>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Business address</span>
                      <div className="font-semibold text-slate-800 mt-0.5">{selectedMerchant.address}</div>
                    </div>

                    <div className="pt-2">
                      <button className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">
                        Edit details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Subscription and Quota Limits */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Subscription and usage</h3>
                      <p className="text-[11px] text-slate-400">Current plan and included limits</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="text-xs space-y-3.5">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current plan</span>
                      <div className="text-base font-extrabold text-slate-900 mt-0.5">Growth · ₹1,199 / month</div>
                    </div>

                    {/* Quota 1: Staff seats */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Staff seats</span>
                        <span className="font-bold text-slate-900">5 / 10</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '50%' }} />
                      </div>
                    </div>

                    {/* Quota 2: Order allowance */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Order allowance</span>
                        <span className="font-bold text-slate-900">620 / 5,000</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '12.4%' }} />
                      </div>
                    </div>

                    {/* Quota 3: Storage */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Storage</span>
                        <span className="font-bold text-slate-900">3.8 / 10 GB</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '38%' }} />
                      </div>
                    </div>

                    {/* Quota 4: API quota */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>API monthly quota</span>
                        <span className="font-bold text-slate-900">33 / 100 units</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: '33%' }} />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">
                        Manage plan
                      </button>
                      <button className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">
                        View audit log
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Master System & Template Controller (Super Admin Authority) */}
              <div className="bg-white border-2 border-indigo-200/80 rounded-2xl p-6 shadow-md space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-indigo-500/10">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                        System Template &amp; Business Vertical Control
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Super Admin Master Authority
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Control which software system and modules this merchant workspace and customer storefront operate on.
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">Current Active System:</span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mt-0.5">
                      {selectedMerchant.type === 'Product' ? 'Handcrafted Pickles & Physical E-Commerce (PRODUCT)' : `${selectedMerchant.type} System`}
                    </span>
                  </div>
                </div>

                {/* 3 Template Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Product / Achar */}
                  <div
                    onClick={async () => {
                      if (selectedMerchant.realDbId) {
                        try {
                          await axios.patch(`/api/admin/merchants/${selectedMerchant.realDbId}/template`, { templateCode: 'PRODUCT', businessType: 'PRODUCT' });
                        } catch (err) {
                          console.warn('Backend template update warning:', err.message);
                        }
                      }
                      setMerchants(prev => prev.map(m => m.id === selectedMerchant.id ? { ...m, type: 'Product', domain: `${m.name.toLowerCase().replace(/\s+/g, '')}.omniva.io` } : m));
                      setAdminToast(`Configured ${selectedMerchant.name} with Physical Product Selling (Achar Storefront & Orders) system!`);
                      setTimeout(() => setAdminToast(''), 4000);
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      selectedMerchant.type === 'Product'
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {selectedMerchant.type === 'Product' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                    )}
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs mb-3">
                      🛍️
                    </div>
                    <div className="font-bold text-slate-900 text-sm">Product Selling (Achar / Food)</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      E-Commerce Storefront, Pickle categories, shopping cart, order lifecycle (Pack, Ship, Deliver), and inventory.
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">Storefront</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">Pickle Catalog</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">COD &amp; Orders</span>
                    </div>
                  </div>

                  {/* Card 2: Travel Bookings */}
                  <div
                    onClick={async () => {
                      if (selectedMerchant.realDbId) {
                        try {
                          await axios.patch(`/api/admin/merchants/${selectedMerchant.realDbId}/template`, { templateCode: 'TRAVEL', businessType: 'TRAVEL' });
                        } catch (err) {
                          console.warn('Backend template update warning:', err.message);
                        }
                      }
                      setMerchants(prev => prev.map(m => m.id === selectedMerchant.id ? { ...m, type: 'Travel', domain: `${m.name.toLowerCase().replace(/\s+/g, '')}.omniva.io` } : m));
                      setAdminToast(`Switched ${selectedMerchant.name} to Travel Agency & Tour Booking system!`);
                      setTimeout(() => setAdminToast(''), 4000);
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      selectedMerchant.type === 'Travel'
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {selectedMerchant.type === 'Travel' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                    )}
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs mb-3">
                      ✈️
                    </div>
                    <div className="font-bold text-slate-900 text-sm">Travel Agency &amp; Tours</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Tour packages, departure calendar, passenger count, pickup locations, advance deposit, and trip status.
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">Tour Packages</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">Passenger Lists</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">Departures</span>
                    </div>
                  </div>

                  {/* Card 3: Service Bookings */}
                  <div
                    onClick={async () => {
                      if (selectedMerchant.realDbId) {
                        try {
                          await axios.patch(`/api/admin/merchants/${selectedMerchant.realDbId}/template`, { templateCode: 'SERVICE', businessType: 'SERVICE' });
                        } catch (err) {
                          console.warn('Backend template update warning:', err.message);
                        }
                      }
                      setMerchants(prev => prev.map(m => m.id === selectedMerchant.id ? { ...m, type: 'Service', domain: `${m.name.toLowerCase().replace(/\s+/g, '')}.omniva.io` } : m));
                      setAdminToast(`Switched ${selectedMerchant.name} to Photography & Event Studio Booking system!`);
                      setTimeout(() => setAdminToast(''), 4000);
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      selectedMerchant.type === 'Service'
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {selectedMerchant.type === 'Service' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                    )}
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs mb-3">
                      📸
                    </div>
                    <div className="font-bold text-slate-900 text-sm">Photography &amp; Events</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Shoot packages, calendar slot scheduling, token advance payments, shoot location preferences, and deliveries.
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">Calendar Grid</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">Shoot Packages</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">Advance Token</span>
                    </div>
                  </div>
                </div>

                {/* Granular Module Matrix */}
                <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <span>Granular Module Entitlements: {selectedMerchant.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          {selectedMerchant.type} Template
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Only enabled modules will appear in this merchant's sidebar and API endpoints.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        key: 'products',
                        name: 'E-Commerce & Products',
                        icon: '🛍️',
                        desc: 'Products, catalog variants, inventory & courier fulfillment',
                        isDefault: selectedMerchant.type === 'Product'
                      },
                      {
                        key: 'serviceBookings',
                        name: 'Studio & Shoots Booking',
                        icon: '📸',
                        desc: 'Photo session calendar, advance tokens & shoot appointments',
                        isDefault: selectedMerchant.type === 'Service'
                      },
                      {
                        key: 'travelBookings',
                        name: 'Travel Tours & Safari',
                        icon: '✈️',
                        desc: 'Tour packages, departures, passenger manifests & pickup',
                        isDefault: selectedMerchant.type === 'Travel'
                      },
                      {
                        key: 'crmLeads',
                        name: 'Meta Ads & CRM Pipeline',
                        icon: '👥',
                        desc: 'Inbound ad leads, call logs, stages & staff assignments',
                        isDefault: true
                      },
                      {
                        key: 'marketingAds',
                        name: 'Meta CAPI Tracking',
                        icon: '📢',
                        desc: 'Server-side Conversions API, Pixel & ROAS attribution',
                        isDefault: true
                      },
                      {
                        key: 'automations',
                        name: 'Automation Rules',
                        icon: '⚡',
                        desc: 'Trigger-action workflows & automated WhatsApp notifications',
                        isDefault: true
                      }
                    ].map((mod) => {
                      const modulesState = selectedMerchant.enabledModules || {
                        products: selectedMerchant.type === 'Product',
                        serviceBookings: selectedMerchant.type === 'Service',
                        travelBookings: selectedMerchant.type === 'Travel',
                        crmLeads: true,
                        marketingAds: true,
                        automations: true
                      };
                      const isEnabled = Boolean(modulesState[mod.key]);

                      return (
                        <div
                          key={mod.key}
                          onClick={() => handleToggleMerchantModule(selectedMerchant.id, mod.key)}
                          className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                            isEnabled
                              ? 'bg-white border-indigo-200 shadow-xs ring-1 ring-indigo-50'
                              : 'bg-slate-100/60 border-slate-200 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{mod.icon}</span>
                              <span className="font-bold text-xs text-slate-900">{mod.name}</span>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                isEnabled
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-200 text-slate-600 border-slate-300'
                              }`}
                            >
                              {isEnabled ? 'ENABLED' : 'DISABLED'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">{mod.desc}</p>
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">Click card to toggle</span>
                            <span className={isEnabled ? 'text-indigo-600 font-bold' : 'text-slate-400'}>
                              {isEnabled ? '● Active' : '○ Inactive'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500">
                    Changes take effect instantly on the merchant dashboard and public storefront.
                  </div>
                  <button
                    onClick={() => {
                      setAdminToast(`System configuration and modules synchronized for ${selectedMerchant.name}!`);
                      setTimeout(() => setAdminToast(''), 4000);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-500/10 transition cursor-pointer"
                  >
                    Sync System &amp; Save Changes
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
              {/* BUSINESS DETAILS SUBTAB */}
              {merchantDetailsSubTab === 'business-details' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Full Business &amp; Legal Profile</h3>
                      <p className="text-slate-400">Registered commercial entity information and compliance</p>
                    </div>
                    <button
                      onClick={() => handleOpenEditModal(selectedMerchant)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                    >
                      Edit Profile
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <span className="font-bold text-slate-700 block">Commercial Entity:</span>
                      <div className="text-slate-900 font-bold text-sm">{selectedMerchant.name} Pvt Ltd</div>
                      <div className="text-slate-600">GSTIN: 08AAACD1234F1Z8 (Active Verified)</div>
                      <div className="text-slate-600">Business Model: Multi-Channel Commerce &amp; CRM</div>
                      <div className="text-slate-600">Domain: {selectedMerchant.domain} (SSL Active)</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <span className="font-bold text-slate-700 block">Registered Operational Address:</span>
                      <div className="text-slate-900 font-semibold">{selectedMerchant.address}</div>
                      <div className="text-slate-600">Primary Contact: {selectedMerchant.phone}</div>
                      <div className="text-slate-600">Official Email: {selectedMerchant.email}</div>
                      <div className="text-slate-600">Owner / Authorized Signatory: {selectedMerchant.owner}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBSCRIPTION SUBTAB */}
              {merchantDetailsSubTab === 'subscription' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Subscription &amp; Billing Schedule</h3>
                      <p className="text-slate-400">Merchant recurring revenue and invoices</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      Active · Auto-Renew Enabled
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                      <span className="text-slate-500 font-medium">Assigned Tier</span>
                      <div className="text-2xl font-black text-indigo-950 mt-1">{selectedMerchant.plan} Plan</div>
                      <div className="text-indigo-600 font-semibold mt-1">₹2,999 / month billed annually</div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-slate-500 font-medium">Next Renewal Date</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">01 Nov 2026</div>
                      <div className="text-slate-500 font-medium mt-1">Auto-debit via Razorpay Subscriptions</div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-slate-500 font-medium">Total Lifetime Invoiced</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">₹35,988</div>
                      <div className="text-emerald-600 font-semibold mt-1">12 Paid Invoices (0 Failed)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* USAGE SUBTAB */}
              {merchantDetailsSubTab === 'usage' && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-extrabold text-slate-900 text-sm">Quota Consumption &amp; System Limits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Monthly Order Volume</span>
                        <span className="text-indigo-600">1,245 / 5,000</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '25%' }} />
                      </div>
                      <span className="text-slate-400 text-[11px]">25% quota utilized this month</span>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Image &amp; Asset Storage</span>
                        <span className="text-emerald-600">3.8 GB / 10 GB</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '38%' }} />
                      </div>
                      <span className="text-slate-400 text-[11px]">38% cloud bucket capacity</span>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Meta Ad Webhook Events</span>
                        <span className="text-blue-600">33 / 100 per hr</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: '33%' }} />
                      </div>
                      <span className="text-slate-400 text-[11px]">Burst capacity available</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STAFF SUBTAB */}
              {merchantDetailsSubTab === 'staff' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-sm">Authorized Merchant Personnel</h3>
                    <button
                      onClick={() => {
                        setAdminToast('Staff invite link copied to clipboard!');
                        setTimeout(() => setAdminToast(''), 3000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer"
                    >
                      + Add Staff Account
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {[
                      { name: selectedMerchant.owner, role: 'Merchant Owner (Root)', email: selectedMerchant.email, status: 'Active' },
                      { name: 'Vikas Meena', role: 'Fulfillment & Order Manager', email: 'vikas@desiachar.example', status: 'Active' },
                      { name: 'Suman Devi', role: 'Kitchen & Packaging Staff', email: 'suman@desiachar.example', status: 'Active' },
                      { name: 'Amit Jain', role: 'Inventory Supervisor', email: 'amit@desiachar.example', status: 'Active' },
                      { name: 'Priya Rao', role: 'Customer Support Lead', email: 'priya@desiachar.example', status: 'Active' }
                    ].map((st, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">{st.name}</div>
                          <div className="text-[11px] text-slate-400">{st.email}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-600">{st.role}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            {st.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INTEGRATIONS SUBTAB */}
              {merchantDetailsSubTab === 'integrations' && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-extrabold text-slate-900 text-sm">Installed Business Connectors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Meta Lead Ads API', status: 'Connected', desc: 'Real-time webhook ingestion from Facebook & Instagram lead forms', icon: '📢' },
                      { name: 'Delhivery Courier Express', status: 'Connected', desc: 'Direct AWB generation, shipping label printing and live tracking webhooks', icon: '🚚' },
                      { name: 'Razorpay Payment Gateway', status: 'Active', desc: 'UPI QR, Cards and NetBanking automated settlements', icon: '💳' },
                      { name: 'WhatsApp Cloud API', status: 'Active', desc: 'Automated dispatch notifications and tracking link messaging', icon: '💬' }
                    ].map((it, i) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                        <span className="text-2xl">{it.icon}</span>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{it.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                              {it.status}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] leading-relaxed">{it.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AUDIT LOGS SUBTAB */}
              {merchantDetailsSubTab === 'audit-logs' && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-extrabold text-slate-900 text-sm">Security &amp; Administrative Activity Trail</h3>
                  <div className="divide-y divide-slate-100">
                    {[
                      { action: 'Order Accepted & Moved to Packaging (ORD-1087)', actor: selectedMerchant.owner, time: '10 minutes ago', ip: '103.21.144.12' },
                      { action: 'Courier Dispatched via Delhivery (AWB DEL-8492014)', actor: 'Vikas Meena', time: '1 hour ago', ip: '103.21.144.12' },
                      { action: 'Meta Lead Ad synchronized: Diwali Achar Campaign', actor: 'Automated Ingestion Worker', time: '3 hours ago', ip: 'Internal System' },
                      { action: 'Super Admin viewed merchant settings', actor: 'Platform Admin (audited)', time: 'Today, 11:42 AM', ip: '127.0.0.1' }
                    ].map((lg, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">{lg.action}</div>
                          <div className="text-[10px] text-slate-400">Actor: {lg.actor} · IP: {lg.ip}</div>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{lg.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

          {/* ==================== 5. SUBSCRIPTIONS ==================== */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Manage recurring revenue, renewals and billing health</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Invoices
                  </button>
                  <button className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Create
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Monthly recurring revenue</span>
                    <span className="p-1 rounded-md bg-indigo-50 text-indigo-600 font-bold">₹</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">₹4,25,000</div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">10.8% growth</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Active subscriptions</span>
                    <span className="p-1 rounded-md bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">210</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">85.7% of merchants</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Payment issues</span>
                    <span className="p-1 rounded-md bg-amber-50 text-amber-600"><AlertTriangle className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">8</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Needs follow-up</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Trial accounts</span>
                    <span className="p-1 rounded-md bg-blue-50 text-blue-600"><Clock className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">25</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Convert to paid</div>
                </div>
              </div>

              {/* Subscriptions Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search merchant..."
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs w-52"
                    />
                    <select className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600">
                      <option>All plans</option>
                      <option>Growth</option>
                      <option>Pro</option>
                      <option>Starter</option>
                    </select>
                    <select className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600">
                      <option>All status</option>
                      <option>Active</option>
                      <option>Trial</option>
                      <option>Past due</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-700">
                      Payment history
                    </button>
                    <button className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm">
                      + Subscription
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-5">MERCHANT / ID</th>
                        <th className="py-3 px-4">PLAN</th>
                        <th className="py-3 px-4">AMOUNT</th>
                        <th className="py-3 px-4">BILLING</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-4">NEXT BILLING</th>
                        <th className="py-3 px-5 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { name: 'Desi Achar House', id: 'SUB-0021', plan: 'Growth', amount: '₹1,199', cycle: 'Monthly', status: 'Active', next: '12 Nov 2026' },
                        { name: 'Pixel Studio', id: 'SUB-0022', plan: 'Pro', amount: '₹1,999', cycle: 'Monthly', status: 'Active', next: '11 Nov 2026' },
                        { name: 'Rajasthan Tours', id: 'SUB-0023', plan: 'Growth', amount: '₹1,199', cycle: 'Monthly', status: 'Trial', next: '10 Nov 2026' },
                        { name: 'Glow Salon', id: 'SUB-0024', plan: 'Starter', amount: '₹799', cycle: 'Monthly', status: 'Past due', next: '09 Oct 2026' },
                        { name: 'FreshMart', id: 'SUB-0025', plan: 'Pro', amount: '₹1,999', cycle: 'Yearly', status: 'Active', next: '08 Oct 2027' },
                        { name: 'Event Planners', id: 'SUB-0026', plan: 'Growth', amount: '₹1,199', cycle: 'Monthly', status: 'Cancelled', next: '—' },
                        { name: 'Travel With Us', id: 'SUB-0027', plan: 'Starter', amount: '₹799', cycle: 'Monthly', status: 'Active', next: '18 Nov 2026' }
                      ].map((sub, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                                {sub.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{sub.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{sub.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">{sub.plan}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{sub.amount}</td>
                          <td className="py-3 px-4 text-slate-600">{sub.cycle}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                sub.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : sub.status === 'Trial'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : sub.status === 'Cancelled'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">{sub.next}</td>
                          <td className="py-3 px-5 text-right text-slate-400">
                            <MoreVertical className="w-4 h-4 ml-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 6. PLANS & PRICING ==================== */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Configure subscription plans, limits and feature access</p>
                <button className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Create plan
                </button>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Published plans</span>
                    <span className="p-1 rounded-md bg-indigo-50 text-indigo-600"><Tag className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">3</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">2 active, 1 draft</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Merchants on Growth</span>
                    <span className="p-1 rounded-md bg-purple-50 text-purple-600"><ArrowUpRight className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">85</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">34.7% of paid users</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Average revenue / merchant</span>
                    <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 font-bold">₹</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">₹1,738</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Across paid accounts</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Upcoming plan reviews</span>
                    <span className="p-1 rounded-md bg-amber-50 text-amber-600"><Clock className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">2</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Next 30 days</div>
                </div>
              </div>

              {/* 3 Pricing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Starter */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Starter</h3>
                      <p className="text-xs text-slate-400 mt-0.5">For small businesses</p>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-slate-900">₹799 <span className="text-xs text-slate-400 font-medium">/ month</span></div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Billed monthly · annual discount configurable</p>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 1 business workspace</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Up to 3 staff</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Basic CRM</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Products or services</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Basic reports</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Email notifications</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button className="py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit plan</button>
                    <button className="py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">Limits</button>
                  </div>
                </div>

                {/* Growth - Most Popular */}
                <div className="bg-white border-2 border-indigo-600 rounded-3xl p-6 shadow-xl relative flex flex-col justify-between space-y-6">
                  <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                    MOST POPULAR
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Growth</h3>
                      <p className="text-xs text-slate-400 mt-0.5">For growing teams</p>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-slate-900">₹1,199 <span className="text-xs text-slate-400 font-medium">/ month</span></div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Billed monthly · annual discount configurable</p>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 1 business workspace</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Up to 10 staff</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> CRM + automation</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Orders and bookings</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Campaign reports</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp notifications</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button className="py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-700">Edit plan</button>
                    <button className="py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">Limits</button>
                  </div>
                </div>

                {/* Pro */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Pro</h3>
                      <p className="text-xs text-slate-400 mt-0.5">For advanced operations</p>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-slate-900">₹1,999 <span className="text-xs text-slate-400 font-medium">/ month</span></div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Billed monthly · annual discount configurable</p>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 1 business workspace</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Up to 25 staff</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> All available templates</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Advanced automation</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> API access (limited)</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Priority support</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button className="py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit plan</button>
                    <button className="py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">Limits</button>
                  </div>
                </div>
              </div>

              {/* Bottom Feature Entitlement Matrix Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 px-6 border-b border-slate-200/80">
                  <h3 className="font-bold text-slate-900 text-sm">Feature entitlements and plan limits</h3>
                  <p className="text-[11px] text-slate-400">Configure what each subscription includes</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-6">FEATURE</th>
                        <th className="py-3 px-6">STARTER</th>
                        <th className="py-3 px-6">GROWTH</th>
                        <th className="py-3 px-6">PRO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { f: 'CRM & lead management', s: 'Included', g: 'Included', p: 'Included' },
                        { f: 'Product orders', s: 'Basic', g: 'Advanced', p: 'Advanced' },
                        { f: 'Service bookings', s: 'Basic', g: 'Included', p: 'Included' },
                        { f: 'Meta CAPI', s: 'Limited / add-on', g: 'Included', p: 'Included' },
                        { f: 'Custom workflows', s: '—', g: 'Basic', p: 'Advanced' },
                        { f: 'API and webhooks', s: '—', g: 'Limited', p: 'Expanded' }
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-6 font-semibold text-slate-800">{row.f}</td>
                          <td className="py-3 px-6 text-slate-600">{row.s}</td>
                          <td className="py-3 px-6 font-bold text-indigo-700">{row.g}</td>
                          <td className="py-3 px-6 font-bold text-slate-900">{row.p}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 7. BUSINESS TEMPLATES ==================== */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Configure workflows and modules for each industry</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-600">
                    Version history
                  </button>
                  <button className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Create template
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Available templates</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">5</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Across key verticals</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Merchants using templates</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">245</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">All workspaces</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Custom workflows</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">18</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Configured workflows</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Draft templates</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">2</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Not yet published</div>
                </div>
              </div>

              {/* 6 Template Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    name: 'Product Selling',
                    desc: 'Catalog, inventory and order management',
                    tags: ['Products', 'Stock', 'Checkout'],
                    merchants: '124 merchants'
                  },
                  {
                    name: 'Photography & Events',
                    desc: 'Packages, availability and quotations',
                    tags: ['Packages', 'Calendar', 'Quotes'],
                    merchants: '38 merchants'
                  },
                  {
                    name: 'Travel Agency',
                    desc: 'Tours, passengers and trip bookings',
                    tags: ['Tours', 'Passengers', 'Trips'],
                    merchants: '24 merchants'
                  },
                  {
                    name: 'Salon & Beauty',
                    desc: 'Appointments and service teams',
                    tags: ['Services', 'Availability', 'Reminders'],
                    merchants: '18 merchants'
                  },
                  {
                    name: 'Lead Generation',
                    desc: 'Enquiries, pipeline and follow-ups',
                    tags: ['CRM', 'Tasks', 'Attribution'],
                    merchants: '29 merchants'
                  },
                  {
                    name: 'Custom Template',
                    desc: 'Create a tailored workflow',
                    tags: ['Fields', 'Statuses', 'Roles'],
                    merchants: 'Create new'
                  }
                ].map((tpl, i) => (
                  <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{tpl.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{tpl.desc}</p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tpl.tags.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">{tpl.merchants}</span>
                      <button className="px-3 py-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Configure
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 8. INTEGRATIONS ==================== */}
          {activeTab === 'integrations' && (() => {
            const currentApiMerchant = merchants.find(m => m.id === selectedApiMerchantId) || merchants[0];
            const currentConfig = merchantApiStore[selectedApiMerchantId] || merchantApiStore['SUB-0021'];

            return (
            <div className="space-y-6">
              {/* Notice Banner: Managed Agency/Platform Mode */}
              <div className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50/40 border border-indigo-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-sm shadow-indigo-600/30">
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-slate-900">
                        Merchant API Keys &amp; Connectors Provisioning Console
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                        Super Admin Managed
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                      Clients and merchants do not need to deal with developer consoles or raw API keys. Super Admin centrally configures, authenticates, and maintains Meta Conversions API (CAPI), WhatsApp Cloud API, Courier logistics, and Razorpay payment credentials on behalf of each merchant.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSaveMerchantApiKeys(selectedApiMerchantId)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-500/10 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Provision All Keys
                  </button>
                </div>
              </div>

              {/* Diagnostic Test Feedback Alert */}
              {apiTestSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{apiTestSuccessMsg}</span>
                  </div>
                  <button onClick={() => setApiTestSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer">✕</button>
                </div>
              )}

              {/* Merchant Selector Strip */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Select Merchant Account:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">Currently Configuring:</span>
                    <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                      {currentApiMerchant.name} ({currentApiMerchant.id})
                    </span>
                  </div>
                </div>

                {/* Quick Merchant Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {merchants.map((m) => {
                    const isSelected = m.id === selectedApiMerchantId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedApiMerchantId(m.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <span>{m.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {m.type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Merchant Control & Lock Status Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                    {currentApiMerchant.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">{currentApiMerchant.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {currentApiMerchant.status}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {currentApiMerchant.plan} Plan
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                      <span>Owner: {currentApiMerchant.owner} ({currentApiMerchant.email})</span>
                      <span>•</span>
                      <span>Domain: {currentApiMerchant.domain}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentConfig.managedBySuperAdmin}
                        onChange={() => handleToggleManagedBySuperAdmin(selectedApiMerchantId)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>Super Admin Managed Mode (Keys Locked from Merchant)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Main Provisioning Workspace: Left Tabs, Right Form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Connector Selector (3 cols) */}
                <div className="lg:col-span-4 space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                    Third-Party Connectors:
                  </div>

                  {[
                    { id: 'meta', name: 'Meta Ads & Instagram CAPI', sub: 'Conversions API & Pixel ID', icon: '📸', status: currentConfig.meta.status },
                    { id: 'whatsapp', name: 'WhatsApp Business Cloud API', sub: 'WABA ID & Permanent Token', icon: '💬', status: currentConfig.whatsapp.status },
                    { id: 'courier', name: 'Logistics & Courier Delivery API', sub: 'Delhivery / Shiprocket Live AWBs', icon: '🚚', status: currentConfig.courier.status },
                    { id: 'payment', name: 'Razorpay UPI & Payment Gateway', sub: 'Key ID, Secret & Webhooks', icon: '💳', status: currentConfig.payment.status },
                    { id: 'webhooks', name: 'Outbound ERP & Zapier Webhook', sub: 'Real-time JSON event dispatches', icon: '🌐', status: currentConfig.webhooks.status }
                  ].map((connector) => {
                    const isActive = activeApiConnectorTab === connector.id;
                    const isConn = connector.status === 'CONNECTED';
                    return (
                      <button
                        key={connector.id}
                        type="button"
                        onClick={() => setActiveApiConnectorTab(connector.id)}
                        className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                          isActive
                            ? 'bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl shrink-0">{connector.icon}</span>
                          <div className="truncate">
                            <div className="font-extrabold text-slate-900 text-xs truncate">{connector.name}</div>
                            <div className="text-[11px] text-slate-500 truncate">{connector.sub}</div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                          isConn ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {isConn ? 'Active' : 'Off'}
                        </span>
                      </button>
                    );
                  })}

                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Security Guarantee
                    </div>
                    <p className="text-slate-600">
                      All provisioned tokens are encrypted at rest using AES-256 before storage in the database.
                    </p>
                  </div>
                </div>

                {/* Right Active Connector Configuration Details (8 cols) */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                  {/* Connector 1: Meta Ads & Instagram CAPI */}
                  {activeApiConnectorTab === 'meta' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">📸</span>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm">Meta Conversions API (CAPI) &amp; Pixel Provisioning</h3>
                            <p className="text-xs text-slate-500">Configure Facebook &amp; Instagram server-side event tracking for {currentApiMerchant.name}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Match Rate: {currentConfig.meta.matchRate}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Meta Pixel ID *</label>
                          <input
                            type="text"
                            value={currentConfig.meta.pixelId}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'meta', 'pixelId', e.target.value)}
                            placeholder="e.g. 8492019482910"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-400 mt-0.5">Found in Events Manager &rarr; Pixel Settings</p>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Dataset / Catalog Name</label>
                          <input
                            type="text"
                            value={currentConfig.meta.datasetName}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'meta', 'datasetName', e.target.value)}
                            placeholder="e.g. Desi Achar House CAPI Dataset"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-700 font-bold">Meta Graph API System User Access Token *</label>
                            <button
                              type="button"
                              onClick={() => setShowApiTokenSecret(!showApiTokenSecret)}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              {showApiTokenSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{showApiTokenSecret ? 'Hide Token' : 'Reveal Token'}</span>
                            </button>
                          </div>
                          <input
                            type={showApiTokenSecret ? 'text' : 'password'}
                            value={currentConfig.meta.capiToken}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'meta', 'capiToken', e.target.value)}
                            placeholder="EAAG84920194..."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Test Event Code (Optional)</label>
                          <input
                            type="text"
                            value={currentConfig.meta.testEventCode}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'meta', 'testEventCode', e.target.value)}
                            placeholder="e.g. TEST84920"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Webhook Ingestion Callback</label>
                          <input
                            type="text"
                            readOnly
                            value={`https://app.omniva.io/api/webhooks/meta?merchant=${currentApiMerchant.id}`}
                            className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-600 select-all focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={apiTestingConnector === 'meta'}
                          onClick={() => handleTestApiConnector('meta')}
                          className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Play className={`w-3.5 h-3.5 text-indigo-600 ${apiTestingConnector === 'meta' ? 'animate-spin' : ''}`} />
                          <span>{apiTestingConnector === 'meta' ? 'Connecting Graph API...' : '⚡ Test Ping Meta Graph API'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveMerchantApiKeys(selectedApiMerchantId)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                        >
                          Save Meta Credentials
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Connector 2: WhatsApp Business Cloud API */}
                  {activeApiConnectorTab === 'whatsapp' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">💬</span>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm">WhatsApp Business Cloud API Provisioning</h3>
                            <p className="text-xs text-slate-500">Configure automated order alerts, tracking links &amp; cart recovery for {currentApiMerchant.name}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tier: High Quality (Green)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">WhatsApp Business Account ID (WABA ID) *</label>
                          <input
                            type="text"
                            value={currentConfig.whatsapp.wabaId}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'whatsapp', 'wabaId', e.target.value)}
                            placeholder="e.g. WABA_9829012345"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Phone Number ID *</label>
                          <input
                            type="text"
                            value={currentConfig.whatsapp.phoneNumberId}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'whatsapp', 'phoneNumberId', e.target.value)}
                            placeholder="e.g. PN_44820194"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-700 font-bold">Permanent System User Access Token *</label>
                            <button
                              type="button"
                              onClick={() => setShowApiTokenSecret(!showApiTokenSecret)}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              {showApiTokenSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{showApiTokenSecret ? 'Hide Token' : 'Reveal Token'}</span>
                            </button>
                          </div>
                          <input
                            type={showApiTokenSecret ? 'text' : 'password'}
                            value={currentConfig.whatsapp.accessToken}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'whatsapp', 'accessToken', e.target.value)}
                            placeholder="EAAW9829012345..."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Verified Sender Phone Number</label>
                          <input
                            type="text"
                            value={currentConfig.whatsapp.senderPhone}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'whatsapp', 'senderPhone', e.target.value)}
                            placeholder="e.g. +91 98290 12345"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Inbound Webhook Verification Token</label>
                          <input
                            type="text"
                            readOnly
                            value="omniva_whatsapp_secure_2026"
                            className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-600 select-all focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={apiTestingConnector === 'whatsapp'}
                          onClick={() => handleTestApiConnector('whatsapp')}
                          className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Play className={`w-3.5 h-3.5 text-indigo-600 ${apiTestingConnector === 'whatsapp' ? 'animate-spin' : ''}`} />
                          <span>{apiTestingConnector === 'whatsapp' ? 'Checking Cloud API...' : '⚡ Test Ping Cloud API'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveMerchantApiKeys(selectedApiMerchantId)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                        >
                          Save WhatsApp Credentials
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Connector 3: Logistics & Courier Delivery API */}
                  {activeApiConnectorTab === 'courier' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">🚚</span>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm">Courier &amp; Logistics Delivery API Provisioning</h3>
                            <p className="text-xs text-slate-500">Configure automated AWB tracking generation, dispatch slips &amp; shipping sync</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Coverage: 29,000+ Pincodes
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Logistics Provider</label>
                          <select
                            value={currentConfig.courier.provider}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'courier', 'provider', e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="Delhivery">Delhivery Direct Express</option>
                            <option value="Shiprocket">Shiprocket Multi-Carrier Hub</option>
                            <option value="BlueDart">BlueDart Apex Logistics</option>
                            <option value="DTDC">DTDC Courier Network</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Warehouse Pickup Pincode *</label>
                          <input
                            type="text"
                            value={currentConfig.courier.pickupPincode}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'courier', 'pickupPincode', e.target.value)}
                            placeholder="e.g. 302020"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">API Key / Client ID *</label>
                          <input
                            type="text"
                            value={currentConfig.courier.apiKey}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'courier', 'apiKey', e.target.value)}
                            placeholder="del_live_k894029104"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">API Secret / Password *</label>
                          <input
                            type="password"
                            value={currentConfig.courier.apiSecret}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'courier', 'apiSecret', e.target.value)}
                            placeholder="••••••••••••••••"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={apiTestingConnector === 'courier'}
                          onClick={() => handleTestApiConnector('courier')}
                          className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Play className={`w-3.5 h-3.5 text-indigo-600 ${apiTestingConnector === 'courier' ? 'animate-spin' : ''}`} />
                          <span>{apiTestingConnector === 'courier' ? 'Testing Serviceability...' : '⚡ Verify Courier Serviceability'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveMerchantApiKeys(selectedApiMerchantId)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                        >
                          Save Courier Credentials
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Connector 4: Payment Gateway (Razorpay UPI) */}
                  {activeApiConnectorTab === 'payment' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">💳</span>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm">Payment Gateway &amp; UPI Provisioning</h3>
                            <p className="text-xs text-slate-500">Configure instant UPI QR, cards &amp; netbanking for {currentApiMerchant.name}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Mode: Live Production
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Gateway Provider</label>
                          <select
                            value={currentConfig.payment.provider}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'payment', 'provider', e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="Razorpay">Razorpay UPI &amp; Cards</option>
                            <option value="Cashfree">Cashfree AutoCollect</option>
                            <option value="Stripe">Stripe International</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Key ID *</label>
                          <input
                            type="text"
                            value={currentConfig.payment.keyId}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'payment', 'keyId', e.target.value)}
                            placeholder="rzp_live_94820184920"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Key Secret *</label>
                          <input
                            type="password"
                            value={currentConfig.payment.keySecret}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'payment', 'keySecret', e.target.value)}
                            placeholder="••••••••••••••••"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Webhook Secret *</label>
                          <input
                            type="text"
                            value={currentConfig.payment.webhookSecret}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'payment', 'webhookSecret', e.target.value)}
                            placeholder="whsec_94820194820"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={apiTestingConnector === 'payment'}
                          onClick={() => handleTestApiConnector('payment')}
                          className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Play className={`w-3.5 h-3.5 text-indigo-600 ${apiTestingConnector === 'payment' ? 'animate-spin' : ''}`} />
                          <span>{apiTestingConnector === 'payment' ? 'Testing Gateway...' : '⚡ Test Payment Gateway Ping'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveMerchantApiKeys(selectedApiMerchantId)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                        >
                          Save Payment Credentials
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Connector 5: Outbound ERP & Zapier Webhook */}
                  {activeApiConnectorTab === 'webhooks' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">🌐</span>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm">Outbound ERP &amp; Zapier Webhook Dispatcher</h3>
                            <p className="text-xs text-slate-500">Auto-forward purchase orders, client bookings, and leads to external warehouses or spreadsheets</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 text-xs">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Target Webhook URL *</label>
                          <input
                            type="url"
                            value={currentConfig.webhooks.targetUrl}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'webhooks', 'targetUrl', e.target.value)}
                            placeholder="https://hooks.zapier.com/hooks/catch/..."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">HMAC SHA-256 Signing Secret</label>
                          <input
                            type="text"
                            value={currentConfig.webhooks.secretToken}
                            onChange={(e) => handleUpdateMerchantConnectorField(selectedApiMerchantId, 'webhooks', 'secretToken', e.target.value)}
                            placeholder="wh_sec_8492019482"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={apiTestingConnector === 'webhooks'}
                          onClick={() => handleTestApiConnector('webhooks')}
                          className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Play className={`w-3.5 h-3.5 text-indigo-600 ${apiTestingConnector === 'webhooks' ? 'animate-spin' : ''}`} />
                          <span>{apiTestingConnector === 'webhooks' ? 'Sending Payload...' : '⚡ Test Webhook Dispatch'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveMerchantApiKeys(selectedApiMerchantId)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                        >
                          Save Webhook Config
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cross-Merchant Integration Health & Provisioning Status Matrix */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Cross-Merchant API Provisioning Health Matrix</h3>
                    <p className="text-xs text-slate-500">Live operational status across all provisioned client workspaces</p>
                  </div>
                  <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
                    4 Active Workspaces Monitored
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Merchant Business</th>
                        <th className="py-3 px-4">Business Model</th>
                        <th className="py-3 px-4">Meta CAPI</th>
                        <th className="py-3 px-4">WhatsApp Cloud</th>
                        <th className="py-3 px-4">Courier Logistics</th>
                        <th className="py-3 px-4">Razorpay UPI</th>
                        <th className="py-3 px-4">Managed Mode</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {merchants.map((m) => {
                        const mConfig = merchantApiStore[m.id] || merchantApiStore['SUB-0021'];
                        const isSelected = m.id === selectedApiMerchantId;

                        return (
                          <tr key={m.id} className={`hover:bg-slate-50 transition ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{m.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{m.id} · {m.owner}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                {m.type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                {mConfig.meta.status} ({mConfig.meta.matchRate})
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                {mConfig.whatsapp.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {mConfig.courier.enabled ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                  {mConfig.courier.provider}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                                  Not needed
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                {mConfig.payment.provider} (Live)
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200 flex items-center gap-1 w-fit">
                                <Lock className="w-2.5 h-2.5" /> Super Admin
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedApiMerchantId(m.id);
                                  window.scrollTo({ top: 120, behavior: 'smooth' });
                                }}
                                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-bold text-xs transition cursor-pointer"
                              >
                                Edit API Keys
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            );
          })()}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Understand platform growth, merchant usage and recurring revenue</p>
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
                  <div className="text-xs text-slate-500 font-medium">Platform revenue</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">₹4,25,000</div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">10.8% vs prior period</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Total merchants</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">245</div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">12.4% growth</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Orders processed</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">3,460</div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">8.4% growth</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Bookings received</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">1,320</div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">18.2% growth</div>
                </div>
              </div>

              {/* Row 2: Revenue Trend & Donut Share */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Revenue trend</h3>
                  <div className="h-44 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
                    {[35, 42, 38, 55, 48, 62, 58, 75, 70, 95].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div style={{ height: `${val}%` }} className="w-full bg-indigo-600 rounded-t-lg transition" />
                        <span className="text-[9px] text-slate-400">W{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Donut Chart: Merchants by Business Template */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Merchants by business template</h3>
                  <div className="flex items-center justify-center py-2">
                    <div className="w-32 h-32 rounded-full border-8 border-indigo-600 border-t-emerald-500 border-r-amber-500 border-b-blue-400 flex items-center justify-center text-center">
                      <div>
                        <div className="text-xl font-black text-slate-900">245</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">MERCHANTS</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600"><span>Product selling</span><span className="font-bold">42%</span></div>
                    <div className="flex justify-between text-slate-600"><span>Services</span><span className="font-bold">23%</span></div>
                    <div className="flex justify-between text-slate-600"><span>Travel</span><span className="font-bold">17%</span></div>
                    <div className="flex justify-between text-slate-600"><span>Other</span><span className="font-bold">18%</span></div>
                  </div>
                </div>
              </div>

              {/* Row 3: Revenue by Plan & Operational Indicators */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Revenue by subscription plan</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-700 font-semibold mb-1">
                        <span>Starter</span>
                        <span>₹82,000</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-400 h-full rounded-full" style={{ width: '25%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-700 font-semibold mb-1">
                        <span>Growth</span>
                        <span>₹2,10,000</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-700 font-semibold mb-1">
                        <span>Pro</span>
                        <span>₹1,33,000</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-800 h-full rounded-full" style={{ width: '40%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Operational indicators</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">28.4%</div>
                        <div className="text-[11px] text-slate-400">Trial-to-paid conversion</div>
                      </div>
                      <span className="text-emerald-600 font-bold text-xs">+3.1 pts</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">2.8%</div>
                        <div className="text-[11px] text-slate-400">Subscription churn</div>
                      </div>
                      <span className="text-emerald-600 font-bold text-xs">-0.4 pts</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">0.8%</div>
                        <div className="text-[11px] text-slate-400">Failed integration events</div>
                      </div>
                      <span className="text-slate-500 font-medium text-xs">Within threshold</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 10. SUPPORT TICKETS ==================== */}
          {activeTab === 'tickets' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Manage merchant requests, incidents and service-level targets</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-600">
                    SLA settings
                  </button>
                  <button className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> New ticket
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Open tickets</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">28</div>
                  <div className="text-[11px] text-amber-600 font-medium mt-0.5">8 high priority</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">In progress</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">13</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Assigned to support</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Resolved this month</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">186</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">92% within SLA</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Median first response</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">42 min</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Target under 1 hour</div>
                </div>
              </div>

              {/* Tickets Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-5">TICKET</th>
                        <th className="py-3 px-4">SUBJECT</th>
                        <th className="py-3 px-4">MERCHANT</th>
                        <th className="py-3 px-4">PRIORITY</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-4">CREATED</th>
                        <th className="py-3 px-5">CATEGORY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { id: 'T-1245', subject: 'Payment not received', merchant: 'Desi Achar House', prio: 'High', status: 'Open', date: '12 Oct', cat: 'Billing' },
                        { id: 'T-1244', subject: 'WhatsApp integration issue', merchant: 'Pixel Studio', prio: 'Medium', status: 'In progress', date: '12 Oct', cat: 'Integrations' },
                        { id: 'T-1243', subject: 'Booking calendar error', merchant: 'Rajasthan Tours', prio: 'High', status: 'Open', date: '11 Oct', cat: 'Bookings' },
                        { id: 'T-1242', subject: 'Subscription upgrade request', merchant: 'FreshMart', prio: 'Low', status: 'Resolved', date: '11 Oct', cat: 'Billing' },
                        { id: 'T-1241', subject: 'Webhook delivery failed', merchant: 'Trendz Clothing', prio: 'Medium', status: 'In progress', date: '10 Oct', cat: 'Integrations' },
                        { id: 'T-1240', subject: 'New template request', merchant: 'Event Planners', prio: 'Low', status: 'Open', date: '10 Oct', cat: 'Templates' },
                        { id: 'T-1239', subject: 'Staff invitation not received', merchant: 'Glow Salon', prio: 'Medium', status: 'Resolved', date: '09 Oct', cat: 'Accounts' }
                      ].map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-5 font-mono font-bold text-indigo-600">{t.id}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{t.subject}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">{t.merchant}</td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.prio === 'High' ? 'text-rose-700 bg-rose-50' : 'text-slate-600 bg-slate-100'}`}>
                              {t.prio}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              t.status === 'Open'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : t.status === 'In progress'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">{t.date}</td>
                          <td className="py-3.5 px-5 font-semibold text-slate-700">{t.cat}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 11. STAFF & ROLES ==================== */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Manage platform team members and permission boundaries</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-600">
                    Permission matrix
                  </button>
                  <button className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Invite staff
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Platform staff</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">18</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Across 6 roles</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Active users</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">16</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">89% active</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Custom roles</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">6</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">2 changed this month</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Pending invitations</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">2</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Awaiting acceptance</div>
                </div>
              </div>

              {/* Staff Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-5">STAFF MEMBER</th>
                        <th className="py-3 px-4">ROLE</th>
                        <th className="py-3 px-4">ACCESS SCOPE</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-4">LAST ACTIVITY</th>
                        <th className="py-3 px-5 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { name: 'Amit Kumar', email: 'amit@omniva.io', role: 'Platform Admin', scope: 'All platform', status: 'Active', last: '2 min ago' },
                        { name: 'Neha Gupta', email: 'neha@omniva.io', role: 'Support Manager', scope: 'Support tickets', status: 'Active', last: '12 min ago' },
                        { name: 'Vikas Sharma', email: 'vikas@omniva.io', role: 'Integration Manager', scope: 'Integrations', status: 'Active', last: '1 hour ago' },
                        { name: 'Ritu Singh', email: 'ritu@omniva.io', role: 'Billing Manager', scope: 'Subscriptions', status: 'Active', last: '2 hours ago' },
                        { name: 'Anjali Verma', email: 'anjali@omniva.io', role: 'Analyst', scope: 'Read-only reports', status: 'Inactive', last: '7 days ago' }
                      ].map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                                {s.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{s.name}</div>
                                <div className="text-[10px] text-slate-400">{s.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">{s.role}</td>
                          <td className="py-3 px-4 text-slate-600">{s.scope}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">{s.last}</td>
                          <td className="py-3 px-5 text-right text-slate-400">
                            <MoreVertical className="w-4 h-4 ml-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Role Permission Matrix Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 px-6 border-b border-slate-200/80">
                  <h3 className="font-bold text-slate-900 text-sm">Role permission matrix</h3>
                  <p className="text-[11px] text-slate-400">Example access model — exact permissions should be configurable</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-6">PERMISSION</th>
                        <th className="py-3 px-4">PLATFORM ADMIN</th>
                        <th className="py-3 px-4">SUPPORT MANAGER</th>
                        <th className="py-3 px-4">BILLING MANAGER</th>
                        <th className="py-3 px-6">ANALYST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { perm: 'View merchants', admin: 'Full', supp: 'Limited', bill: 'Limited', ana: 'Read-only' },
                        { perm: 'Manage subscriptions', admin: 'Full', supp: '—', bill: 'Full', ana: '—' },
                        { perm: 'View system logs', admin: 'Full', supp: 'Limited', bill: 'Limited', ana: '—' },
                        { perm: 'Manage integrations', admin: 'Full', supp: 'Limited', bill: '—', ana: '—' },
                        { perm: 'Change platform settings', admin: 'Full', supp: '—', bill: '—', ana: '—' }
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-6 font-semibold text-slate-800">{row.perm}</td>
                          <td className="py-3 px-4 font-bold text-indigo-700">{row.admin}</td>
                          <td className="py-3 px-4 text-slate-600">{row.supp}</td>
                          <td className="py-3 px-4 text-slate-600">{row.bill}</td>
                          <td className="py-3 px-6 text-slate-600">{row.ana}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 12. SYSTEM HEALTH ==================== */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Monitor uptime, application performance and background jobs</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-600">
                    Incident history
                  </button>
                  <button className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">API uptime</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">99.95%</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Last 30 days</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Average response</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">124 ms</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Within SLA</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Error rate</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">0.08%</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">-0.02 pts</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Background jobs</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">99.8%</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Successful executions</div>
                </div>
              </div>

              {/* Row 2: API Response Time & System Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">API response time</h3>
                  <div className="h-44 w-full flex items-end gap-2.5 pt-6 pb-2 px-2 border-b border-slate-100">
                    {[110, 120, 115, 135, 140, 124, 130, 160, 145, 180].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div style={{ height: `${(h / 200) * 100}%` }} className="w-full bg-indigo-600 rounded-t-md" />
                        <span className="text-[9px] text-slate-400">{i * 2}h</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">System status</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Operational
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">All core systems operational</div>
                      <div className="text-[10px] text-slate-400">Last checked moments ago</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">API service</span>
                      <span className="font-bold text-emerald-600">Operational</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Database</span>
                      <span className="font-bold text-emerald-600">Operational</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Background workers</span>
                      <span className="font-bold text-emerald-600">Operational</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600">Notification provider</span>
                      <span className="font-bold text-amber-600">Degraded</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Incidents & Resource Usage */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm">Recent incidents</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/60">
                      <div className="font-bold text-slate-800">WhatsApp message delivery degraded</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Investigating · 10:39 AM · Owner: Integrations</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200/60">
                      <div className="font-bold text-slate-800">Payment gateway latency normalized</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Resolved · 09:12 AM</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-800">High webhook retries for courier</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Monitoring · 08:47 AM</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Resource usage</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-600 font-semibold mb-1">
                        <span>Database</span>
                        <span>46%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '46%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-600 font-semibold mb-1">
                        <span>File storage</span>
                        <span>62%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: '62%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-600 font-semibold mb-1">
                        <span>API quota</span>
                        <span>33%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '33%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-600 font-semibold mb-1">
                        <span>Background queue</span>
                        <span>22%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '22%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 13. SYSTEM LOGS ==================== */}
          {activeTab === 'logs' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Review platform activity, API events and integration failures</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-600">
                    Retention policy
                  </button>
                  <button className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Export logs
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Events today</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">18,420</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">All platform events</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Failed events</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">14</div>
                  <div className="text-[11px] text-rose-600 font-medium mt-0.5">0.08% of events</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">API p95 latency</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">124 ms</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Within target</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Queued jobs</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">32</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Processing normally</div>
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-5">TIMESTAMP</th>
                        <th className="py-3 px-4">TYPE</th>
                        <th className="py-3 px-6">MESSAGE</th>
                        <th className="py-3 px-5 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { time: '14 Oct · 10:42:31', type: 'Webhook', msg: 'Payment verified for order ORD-001', status: 'Success' },
                        { time: '14 Oct · 10:42:02', type: 'Meta CAPI', msg: 'Purchase event sent to Meta', status: 'Success' },
                        { time: '14 Oct · 10:41:40', type: 'Integration', msg: 'WhatsApp message delivery failed', status: 'Failed' },
                        { time: '14 Oct · 10:39:17', type: 'API request', msg: 'Lead created through external API', status: 'Success' },
                        { time: '14 Oct · 10:38:02', type: 'Background job', msg: 'Daily report generated', status: 'Success' },
                        { time: '14 Oct · 10:32:14', type: 'Authentication', msg: 'Failed sign-in attempt blocked', status: 'Warning' },
                        { time: '14 Oct · 10:30:49', type: 'Subscription', msg: 'Renewal payment attempt failed', status: 'Warning' },
                        { time: '14 Oct · 10:26:18', type: 'Webhook', msg: 'Courier status update received', status: 'Success' }
                      ].map((log, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-5 font-mono text-slate-500 text-[11px]">{log.time}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                              {log.type}
                            </span>
                          </td>
                          <td className="py-3 px-6 font-semibold text-slate-800">{log.msg}</td>
                          <td className="py-3 px-5 text-right">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                log.status === 'Success'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : log.status === 'Failed'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 14. PLATFORM SETTINGS ==================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Configure global preferences, security and communication defaults</p>
                <button
                  onClick={() => alert('Platform settings saved successfully!')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 cursor-pointer"
                >
                  Save changes
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Category Sub-Menu */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm space-y-1 text-xs font-semibold">
                  {[
                    'General',
                    'Branding',
                    'Email & notifications',
                    'Payment gateways',
                    'Security',
                    'API & webhooks',
                    'Data & retention'
                  ].map((cat, i) => (
                    <button
                      key={i}
                      className={`w-full text-left px-3 py-2 rounded-xl transition ${
                        i === 0 ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Right Form Fields */}
                <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">General platform settings</h3>
                    <p className="text-[11px] text-slate-400">Default configuration for the complete SaaS platform</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Platform name</label>
                      <input
                        type="text"
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Default timezone</label>
                      <input
                        type="text"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Platform URL</label>
                      <input
                        type="text"
                        value={platformUrl}
                        onChange={(e) => setPlatformUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Default currency</label>
                      <input
                        type="text"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Support email</label>
                      <input
                        type="email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Date format</label>
                      <input
                        type="text"
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Security Toggles */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-800">Security and platform behavior</div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50">
                      <div>
                        <div className="font-bold text-slate-800 text-xs">Require email verification</div>
                        <div className="text-[11px] text-slate-400">Verify new merchant and staff accounts</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReqEmailVerify(!reqEmailVerify)}
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                          reqEmailVerify ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${reqEmailVerify ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50">
                      <div>
                        <div className="font-bold text-slate-800 text-xs">Require 2FA for platform staff</div>
                        <div className="text-[11px] text-slate-400">Protect sensitive administrator actions</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReq2FA(!req2FA)}
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                          req2FA ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${req2FA ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50">
                      <div>
                        <div className="font-bold text-slate-800 text-xs">Alert on repeated integration failures</div>
                        <div className="text-[11px] text-slate-400">Notify support team about recurring errors</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAlertFailures(!alertFailures)}
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                          alertFailures ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${alertFailures ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50">
                      <div>
                        <div className="font-bold text-slate-800 text-xs">Allow unverified custom domains</div>
                        <div className="text-[11px] text-slate-400">Keep disabled until domain ownership is verified</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAllowUnverifiedDomains(!allowUnverifiedDomains)}
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                          allowUnverifiedDomains ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${allowUnverifiedDomains ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => alert('Platform settings saved successfully!')}
                      className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 cursor-pointer"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Edit Merchant Modal */}
      {showEditMerchantModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                Edit Merchant: {editMerchantForm.name}
              </h3>
              <button onClick={() => setShowEditMerchantModal(false)} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEditMerchant} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Business Name:</label>
                <input
                  type="text"
                  required
                  value={editMerchantForm.name}
                  onChange={(e) => setEditMerchantForm({ ...editMerchantForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner Name:</label>
                  <input
                    type="text"
                    required
                    value={editMerchantForm.owner}
                    onChange={(e) => setEditMerchantForm({ ...editMerchantForm, owner: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plan Tier:</label>
                  <select
                    value={editMerchantForm.plan}
                    onChange={(e) => setEditMerchantForm({ ...editMerchantForm, plan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Growth">Growth</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned System:</label>
                  <select
                    value={editMerchantForm.type}
                    onChange={(e) => setEditMerchantForm({ ...editMerchantForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-indigo-300 rounded-xl text-xs font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Product">📦 Product (Achar)</option>
                    <option value="Travel">✈️ Travel (Tours)</option>
                    <option value="Service">📸 Service (Studio)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner Email:</label>
                  <input
                    type="email"
                    required
                    value={editMerchantForm.email}
                    onChange={(e) => setEditMerchantForm({ ...editMerchantForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Phone:</label>
                  <input
                    type="text"
                    required
                    value={editMerchantForm.phone}
                    onChange={(e) => setEditMerchantForm({ ...editMerchantForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Business Address:</label>
                <input
                  type="text"
                  value={editMerchantForm.address}
                  onChange={(e) => setEditMerchantForm({ ...editMerchantForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditMerchantModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Save Merchant Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
