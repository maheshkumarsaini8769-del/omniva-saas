import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/useAuth';
import { PortalSwitcherBar } from '../components/PortalSwitcherBar';
import {
  Menu,
  X,
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

const formatAdminSyncTime = (value) => {
  if (!value) return 'Never tested';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Never tested' : date.toLocaleString('en-IN');
};

const createEmptySuperAdminIntegrationConfig = () => ({
  meta: {
    enabled: false,
    pixelId: '',
    capiToken: '',
    testEventCode: '',
    datasetName: '',
    status: 'NOT_CONFIGURED',
    matchRate: 'Not measured',
    lastTested: 'Never tested',
  },
  whatsapp: {
    enabled: false,
    wabaId: '',
    phoneNumberId: '',
    accessToken: '',
    senderPhone: '',
    status: 'NOT_CONFIGURED',
    qualityScore: 'Not reported',
    lastTested: 'Never tested',
  },
  courier: {
    enabled: false,
    provider: '',
    apiKey: '',
    apiSecret: '',
    pickupPincode: '',
    status: 'NOT_CONFIGURED',
    serviceable: 'Not reported',
    lastTested: 'Never tested',
  },
  payment: {
    enabled: false,
    provider: 'Razorpay',
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    liveMode: false,
    status: 'NOT_CONFIGURED',
    instantRefunds: 'Not reported',
    lastTested: 'Never tested',
  },
  webhooks: {
    enabled: false,
    targetUrl: '',
    secretToken: '',
    status: 'NOT_CONFIGURED',
  },
  managedBySuperAdmin: true,
});

const normalizeSuperAdminIntegrationConfig = (integrations = {}) => {
  const empty = createEmptySuperAdminIntegrationConfig();
  const meta = integrations.meta || {};
  const whatsapp = integrations.whatsapp || {};
  const courier = integrations.courier || {};
  const payment = integrations.payment || {};
  const webhooks = integrations.webhooks || {};

  return {
    meta: {
      ...empty.meta,
      enabled: Boolean(meta.enabled),
      pixelId: meta.pixelId || '',
      capiToken: meta.capiToken || '',
      testEventCode: meta.testEventCode || '',
      datasetName: meta.datasetId || '',
      status: meta.status || (meta.enabled && meta.pixelId ? 'CONFIGURED' : 'NOT_CONFIGURED'),
      matchRate: 'Not measured',
      lastTested: formatAdminSyncTime(meta.lastSyncedAt),
    },
    whatsapp: {
      ...empty.whatsapp,
      enabled: Boolean(whatsapp.enabled),
      wabaId: whatsapp.wabaId || '',
      phoneNumberId: whatsapp.phoneNumberId || '',
      accessToken: whatsapp.accessToken || '',
      senderPhone: whatsapp.senderPhone || '',
      status: whatsapp.status || (whatsapp.enabled && (whatsapp.wabaId || whatsapp.phoneNumberId) ? 'CONFIGURED' : 'NOT_CONFIGURED'),
      lastTested: formatAdminSyncTime(whatsapp.lastSyncedAt),
    },
    courier: {
      ...empty.courier,
      enabled: Boolean(courier.enabled),
      provider: courier.provider || '',
      apiKey: courier.apiKey || '',
      apiSecret: courier.apiSecret || '',
      pickupPincode: courier.pickupPincode || '',
      status: courier.status || (courier.enabled && courier.provider ? 'CONFIGURED' : 'NOT_CONFIGURED'),
      lastTested: formatAdminSyncTime(courier.lastSyncedAt),
    },
    payment: {
      ...empty.payment,
      enabled: Boolean(payment.enabled),
      provider: payment.provider || 'Razorpay',
      keyId: payment.keyId || '',
      keySecret: payment.keySecret || '',
      webhookSecret: payment.webhookSecret || '',
      liveMode: Boolean(payment.liveMode),
      status: payment.status || (payment.enabled && payment.keyId ? 'CONFIGURED' : 'NOT_CONFIGURED'),
      lastTested: formatAdminSyncTime(payment.lastSyncedAt),
    },
    webhooks: {
      ...empty.webhooks,
      enabled: Boolean(webhooks.enabled),
      targetUrl: webhooks.url || '',
      secretToken: webhooks.secret || '',
      status: webhooks.status || (webhooks.enabled && webhooks.url ? 'CONFIGURED' : 'NOT_CONFIGURED'),
    },
    managedBySuperAdmin: integrations.managedBySuperAdmin !== false,
  };
};


const mapAdminMerchant = (t) => ({
  id: t._id,
  realDbId: t._id,
  displayId: `M-${String(t._id).slice(-6).toUpperCase()}`,
  gstin: t.settings?.gstinNumber || '',
  slug: t.slug || '',
  templateCode: t.templateCode || '',
  name: t.businessName || 'Unnamed merchant',
  owner: t.ownerName || '',
  email: t.ownerEmail || t.contact?.email || '',
  phone: t.contact?.phone || '',
  address: t.contact?.address || [t.contact?.city, t.contact?.state].filter(Boolean).join(', '),
  type: t.businessType === 'PRODUCT' ? 'Product' : t.businessType === 'SERVICE' ? 'Service' : t.businessType === 'TRAVEL' ? 'Travel' : (t.businessType || 'Custom'),
  plan: t.planTier ? t.planTier.charAt(0) + t.planTier.slice(1).toLowerCase() : '',
  status: t.status === 'ACTIVE' ? 'Active' : t.status === 'SUSPENDED' ? 'Suspended' : 'Pending',
  joinedDate: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
  domain: t.customDomain || (t.slug ? `/store/${t.slug}` : ''),
  orders: Number(t.ordersCount) || 0,
  bookings: Number(t.bookingsCount) || 0,
  leads: Number(t.leadsCount) || 0,
  staffCount: Number(t.staffCount) || 0,
  activeStaffCount: Number(t.activeStaffCount) || 0,
  subscription: t.subscription || null,
  revenue: Number(t.revenue) || 0,
  customers: null,
  staff: '',
  storage: '',
  quota: '',
  enabledModules: t.enabledModules || {}
});

const buildSuperAdminIntegrationPayload = (config) => ({
  managedBySuperAdmin: config.managedBySuperAdmin !== false,
  meta: {
    enabled: Boolean(config.meta.enabled),
    pixelId: config.meta.pixelId?.trim() || '',
    capiToken: config.meta.capiToken?.trim() || '',
    testEventCode: config.meta.testEventCode?.trim() || '',
    datasetId: config.meta.datasetName?.trim() || '',
    status: config.meta.enabled && config.meta.pixelId?.trim() ? 'CONFIGURED' : 'NOT_CONFIGURED',
  },
  whatsapp: {
    enabled: Boolean(config.whatsapp.enabled),
    wabaId: config.whatsapp.wabaId?.trim() || '',
    phoneNumberId: config.whatsapp.phoneNumberId?.trim() || '',
    accessToken: config.whatsapp.accessToken?.trim() || '',
    senderPhone: config.whatsapp.senderPhone?.trim() || '',
    status: config.whatsapp.enabled && (config.whatsapp.phoneNumberId?.trim() || config.whatsapp.wabaId?.trim()) ? 'CONFIGURED' : 'NOT_CONFIGURED',
  },
  courier: {
    enabled: Boolean(config.courier.enabled),
    provider: config.courier.provider?.trim() || '',
    apiKey: config.courier.apiKey?.trim() || '',
    apiSecret: config.courier.apiSecret?.trim() || '',
    pickupPincode: config.courier.pickupPincode?.trim() || '',
    status: config.courier.enabled && config.courier.provider?.trim() ? 'CONFIGURED' : 'NOT_CONFIGURED',
  },
  payment: {
    enabled: Boolean(config.payment.enabled),
    provider: config.payment.provider?.trim() || 'Razorpay',
    keyId: config.payment.keyId?.trim() || '',
    keySecret: config.payment.keySecret?.trim() || '',
    webhookSecret: config.payment.webhookSecret?.trim() || '',
    liveMode: Boolean(config.payment.liveMode),
    status: config.payment.enabled && config.payment.keyId?.trim() ? 'CONFIGURED' : 'NOT_CONFIGURED',
  },
  webhooks: {
    enabled: Boolean(config.webhooks.enabled),
    url: config.webhooks.targetUrl?.trim() || '',
    secret: config.webhooks.secretToken?.trim() || '',
    status: config.webhooks.enabled && config.webhooks.targetUrl?.trim() ? 'CONFIGURED' : 'NOT_CONFIGURED',
  },
});


export const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active platform tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, merchants, add-merchant, merchant-details, subscriptions, plans, templates, integrations, analytics, tickets, staff, health, logs, settings
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [addStep, setAddStep] = useState(1);
  const [merchantDetailsSubTab, setMerchantDetailsSubTab] = useState('overview');
  const [adminToast, setAdminToast] = useState('');
  const [adminError, setAdminError] = useState('');
  const [merchantPage, setMerchantPage] = useState(1);

  const showAdminError = (message) => {
    setAdminError(message);
    setTimeout(() => setAdminError(''), 6500);
  };
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ================= Merchant API Keys & Connectors Provisioning (Super Admin Managed) =================
  const [selectedApiMerchantId, setSelectedApiMerchantId] = useState('');
  const [activeApiConnectorTab, setActiveApiConnectorTab] = useState('meta');
  const [showApiTokenSecret, setShowApiTokenSecret] = useState(false);
  const [apiTestingConnector, setApiTestingConnector] = useState(null);
  const [apiTestSuccessMsg, setApiTestSuccessMsg] = useState('');
  const [merchantApiStore, setMerchantApiStore] = useState({});

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

  // Merchants Data
  const [merchants, setMerchants] = useState([]);

  const handleToggleManagedBySuperAdmin = (merchantId) => {
    const current = merchantApiStore[merchantId] || createEmptySuperAdminIntegrationConfig();
    const nextValue = !current.managedBySuperAdmin;
    setMerchantApiStore(prev => ({
      ...prev,
      [merchantId]: {
        ...(prev[merchantId] || createEmptySuperAdminIntegrationConfig()),
        managedBySuperAdmin: nextValue
      }
    }));
    setAdminToast('Managed mode changed locally. Click Provision All Keys to save it on the server.');
    setTimeout(() => setAdminToast(''), 4500);
  };

  const handleTestApiConnector = async (serviceName) => {
    const target = merchants.find(m => m.id === selectedApiMerchantId);
    if (!target?.realDbId) {
      showAdminError('Select a real merchant before testing an integration.');
      return;
    }
    setApiTestingConnector(serviceName);
    setApiTestSuccessMsg('');
    try {
      const res = await axios.post(
        `/api/admin/merchants/${target.realDbId}/integrations/test`,
        { serviceType: serviceName }
      );
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'The configuration check failed.');
      }
      const checkedAt = res.data.diagnostic?.testedAt
        ? new Date(res.data.diagnostic.testedAt).toLocaleString('en-IN')
        : new Date().toLocaleString('en-IN');
      setApiTestSuccessMsg(`${res.data.message} Checked ${checkedAt}.`);
      setTimeout(() => setApiTestSuccessMsg(''), 8000);
    } catch (err) {
      setApiTestSuccessMsg('');
      showAdminError(err.response?.data?.message || err.message || 'The configuration check failed.');
    } finally {
      setApiTestingConnector(null);
    }
  };

  const handleSaveMerchantApiKeys = async (merchantId) => {
    const target = merchants.find(m => m.id === merchantId);
    if (!target?.realDbId) {
      showAdminError('Select a real merchant before saving integration credentials.');
      return;
    }
    const config = merchantApiStore[merchantId];
    if (!config) {
      showAdminError('The integration configuration has not loaded yet. Try again in a moment.');
      return;
    }
    try {
      const res = await axios.put(
        `/api/admin/merchants/${target.realDbId}/integrations`,
        { integrations: buildSuperAdminIntegrationPayload(config) }
      );
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'The integration credentials were not saved.');
      }
      setMerchantApiStore(prev => ({
        ...prev,
        [merchantId]: normalizeSuperAdminIntegrationConfig({ ...config, ...res.data.data }),
      }));
      setAdminToast(`Connector settings saved for "${target.name}". The UI no longer claims a live handshake.`);
    } catch (err) {
      showAdminError(err.response?.data?.message || err.message || 'Could not save integration credentials.');
    }
    setTimeout(() => setAdminToast(''), 5000);
  };

  useEffect(() => {
    const target = merchants.find(m => m.id === selectedApiMerchantId);
    if (!target?.realDbId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`/api/admin/merchants/${target.realDbId}/integrations`);
        if (cancelled) return;
        if (!res.data?.success) {
          throw new Error(res.data?.message || 'Could not load integration settings.');
        }
        setMerchantApiStore(prev => ({
          ...prev,
          [target.id]: normalizeSuperAdminIntegrationConfig(res.data.integrations || {}),
        }));
      } catch (err) {
        if (cancelled) return;
        setMerchantApiStore(prev => ({
          ...prev,
          [target.id]: createEmptySuperAdminIntegrationConfig(),
        }));
        showAdminError(
          err.response?.status === 403
            ? 'Only a SUPER_ADMIN can view merchant integration secrets.'
            : err.response?.data?.message || err.message || 'Could not load integration settings.'
        );
      }
    })();
    return () => { cancelled = true; };
  }, [selectedApiMerchantId, merchants]);

  const [showEditMerchantModal, setShowEditMerchantModal] = useState(false);
  const [editMerchantForm, setEditMerchantForm] = useState({ id: '', name: '', owner: '', email: '', phone: '', address: '', plan: 'Growth', type: 'Product' });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [merchantTypeFilter, setMerchantTypeFilter] = useState('ALL');
  const [merchantStatusFilter, setMerchantStatusFilter] = useState('ALL');

  // Add Merchant Form State
  const [newBizName, setNewBizName] = useState('');
  const [newBizType, setNewBizType] = useState('Product selling');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [isolateWorkspace, setIsolateWorkspace] = useState(true);
  const [sendInvite, setSendInvite] = useState(true);
  const [defaultCrm, setDefaultCrm] = useState(false);

  // Platform Settings State
  const [platformName, setPlatformName] = useState('Omniva');
  const [timezone, setTimezone] = useState('Asia/Kolkata (GMT+5:30)');
  const [platformUrl, setPlatformUrl] = useState(typeof window !== 'undefined' ? window.location.origin : '');
  const [currency, setCurrency] = useState('INR — Indian Rupee');
  const [supportEmail, setSupportEmail] = useState('');
  const [dateFormat, setDateFormat] = useState('DD MMM YYYY');
  const [reqEmailVerify, setReqEmailVerify] = useState(true);
  const [req2FA, setReq2FA] = useState(true);
  const [alertFailures, setAlertFailures] = useState(true);
  const [allowUnverifiedDomains, setAllowUnverifiedDomains] = useState(false);

  const [livePlatformStats, setLivePlatformStats] = useState(null);
  const [platformPlans, setPlatformPlans] = useState(null);
  const [healthSnapshot, setHealthSnapshot] = useState(null);
  const [healthError, setHealthError] = useState('');
  const [merchantUsage, setMerchantUsage] = useState(null);
  const [merchantStaff, setMerchantStaff] = useState(null);
  const [merchantDetailError, setMerchantDetailError] = useState('');

  // Load real merchants and platform statistics from backend
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [merchantsRes, statsRes, plansRes] = await Promise.all([
          axios.get('/api/admin/merchants'),
          axios.get('/api/admin/stats'),
          axios.get('/api/admin/plans').catch(() => ({ data: { success: false } }))
        ]);
        if (merchantsRes.data.success && Array.isArray(merchantsRes.data.data)) {
          const liveList = merchantsRes.data.data.map(mapAdminMerchant);
          setMerchants(liveList);
          setSelectedMerchantId(prev => prev || liveList[0]?.id || '');
          setSelectedApiMerchantId(prev => prev || liveList[0]?.id || '');
        } else {
          setMerchants([]);
        }
        if (statsRes.data.success) {
          setLivePlatformStats(statsRes.data.data);
        } else {
          setLivePlatformStats(null);
        }
        setPlatformPlans(plansRes.data?.success ? plansRes.data.data : null);
      } catch (err) {
        console.warn('Could not load live admin data:', err.message);
        setMerchants([]);
        setLivePlatformStats(null);
        setPlatformPlans(null);
        setAdminToast(err.response?.data?.message || 'Could not load live platform data.');
        setTimeout(() => setAdminToast(''), 5000);
      }
    };
    fetchAdminData();
  }, []);

  const loadHealthSnapshot = async () => {
    setHealthError('');
    try {
      const res = await axios.get('/api/health/deep');
      if (!res.data) throw new Error('Health endpoint returned no data.');
      setHealthSnapshot(res.data);
    } catch (err) {
      setHealthError(err.response?.data?.message || err.message || 'Could not reach the health endpoint.');
      setHealthSnapshot(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'health') loadHealthSnapshot();
  }, [activeTab]);

  const handleChangeMerchantTemplate = async (templateCode, businessType) => {
    const target = merchants.find(m => m.id === selectedMerchantId);
    if (!target?.realDbId) {
      showAdminError('Merchant could not be identified. Refresh the list and try again.');
      return;
    }
    try {
      const res = await axios.patch(`/api/admin/merchants/${target.realDbId}/template`, { templateCode, businessType });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Template update was rejected.');
      }
      const displayType = templateCode === 'PRODUCT' ? 'Product'
        : templateCode === 'TRAVEL' ? 'Travel'
        : templateCode === 'SERVICE' ? 'Service'
        : templateCode;
      setMerchants(prev => prev.map(m => m.id === target.id
        ? { ...m, type: displayType, templateCode, enabledModules: res.data.data?.enabledModules || m.enabledModules }
        : m));
      setAdminToast(`Template updated to ${templateCode} for ${target.name}.`);
      setTimeout(() => setAdminToast(''), 4000);
    } catch (err) {
      showAdminError(err.response?.data?.message || err.message || 'Could not update the merchant template.');
    }
  };

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId) || merchants[0];

  useEffect(() => {
    if (!selectedMerchant?.realDbId) {
      setMerchantUsage(null);
      setMerchantStaff(null);
      return undefined;
    }
    if (merchantDetailsSubTab !== 'usage' && merchantDetailsSubTab !== 'staff') return undefined;
    let cancelled = false;
    const load = async () => {
      setMerchantDetailError('');
      try {
        if (merchantDetailsSubTab === 'usage') {
          setMerchantUsage(null);
          const res = await axios.get(`/api/admin/merchants/${selectedMerchant.realDbId}/usage`);
          if (!cancelled && res.data?.success) setMerchantUsage(res.data.data);
        } else {
          setMerchantStaff(null);
          const res = await axios.get(`/api/admin/merchants/${selectedMerchant.realDbId}/staff`);
          if (!cancelled && res.data?.success) setMerchantStaff(res.data.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setMerchantDetailError(err.response?.data?.message || err.message || 'Could not load merchant details.');
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [merchantDetailsSubTab, selectedMerchantId]);

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
    if (!target?.realDbId) {
      showAdminError('Merchant could not be identified. Refresh the list and try again.');
      return;
    }
    const newStatus = target.status === 'Suspended' ? 'Active' : 'Suspended';
    try {
      const res = await axios.patch(`/api/admin/merchants/${target.realDbId}/status`, {
        status: newStatus.toUpperCase()
      });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Status update was rejected.');
      }
    } catch (err) {
      showAdminError(err.response?.data?.message || err.message || 'Could not update merchant status.');
      return;
    }
    setMerchants((prev) => prev.map((m) => m.id === merchantId ? { ...m, status: newStatus } : m));
    setAdminToast(`Merchant "${target.name}" is now marked ${newStatus}.`);
    setTimeout(() => setAdminToast(''), 4000);
  };

  const handleCreateMerchant = async () => {
    if (!newBizName.trim() || !newOwnerName.trim() || !newOwnerEmail.trim() || !newOwnerPassword) {
      showAdminError('Business name, owner name, owner email and a temporary password are required.');
      return;
    }
    if (newOwnerPassword.length < 8) {
      showAdminError('The temporary owner password must be at least 8 characters.');
      return;
    }
    const typeMap = {
      'Product selling': { businessType: 'PRODUCT', templateCode: 'PRODUCT' },
      'Photography & Events': { businessType: 'SERVICE', templateCode: 'SERVICE' },
      'Travel Agency': { businessType: 'TRAVEL', templateCode: 'TRAVEL' },
      'Salon & Beauty': { businessType: 'SALON', templateCode: 'SERVICE' },
    };
    const mappedType = typeMap[newBizType] || typeMap['Product selling'];
    try {
      const res = await axios.post('/api/admin/merchants', {
        businessName: newBizName.trim(),
        businessType: mappedType.businessType,
        templateCode: mappedType.templateCode,
        planTier: 'GROWTH',
        ownerName: newOwnerName.trim(),
        ownerEmail: newOwnerEmail.trim(),
        password: newOwnerPassword,
        phone: newPhone.trim(),
        enabledModules: defaultCrm
          ? undefined
          : { products: true, orders: true, inventory: true, serviceBookings: false, travelBookings: false, crmLeads: false, marketingAds: true, automations: true },
      });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'The merchant account was not created.');
      }
      const created = mapAdminMerchant(res.data.data);
      setMerchants(prev => [created, ...prev]);
      setSelectedMerchantId(created.id);
      setSelectedApiMerchantId(created.id);
      setNewBizName('');
      setNewOwnerName('');
      setNewOwnerEmail('');
      setNewOwnerPassword('');
      setNewPhone('');
      setNewAddress('');
      setActiveTab('merchants');
      setAdminToast(`Merchant "${created.name}" created. Share the temporary password with the owner securely.`);
      setTimeout(() => setAdminToast(''), 7000);
    } catch (err) {
      showAdminError(err.response?.data?.message || err.message || 'Could not create the merchant.');
    }
  };

  const handleExportMerchantsCsv = () => {
    const headers = "ID,Name,Owner,Email,Phone,Type,Plan,Status,JoinedDate\n";
    const rows = merchants.map(m => `"${m.displayId}","${m.name}","${m.owner}","${m.email}","${m.phone}","${m.type}","${m.plan}","${m.status}","${m.joinedDate}"`).join("\n");
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

  const handleSaveEditMerchant = async (e) => {
    e.preventDefault();
    const target = merchants.find(m => m.id === editMerchantForm.id);
    if (!target?.realDbId) {
      showAdminError('Merchant could not be identified. Refresh the list and try again.');
      return;
    }
    const planTier = String(editMerchantForm.plan || '').toUpperCase();
    try {
      const res = await axios.patch(`/api/admin/merchants/${target.realDbId}`, {
        businessName: editMerchantForm.name.trim(),
        ownerName: editMerchantForm.owner.trim(),
        ownerEmail: editMerchantForm.email.trim(),
        contactEmail: editMerchantForm.email.trim(),
        contactPhone: editMerchantForm.phone.trim(),
        contactAddress: editMerchantForm.address.trim(),
        planTier: ['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'].includes(planTier) ? planTier : undefined,
      });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Merchant profile update was rejected.');
      }
      const updated = mapAdminMerchant(res.data.data);
      setMerchants(prev => prev.map(m => m.id === updated.id ? updated : m));
      setShowEditMerchantModal(false);
      setAdminToast(`Merchant "${updated.name}" updated in the database.`);
      setTimeout(() => setAdminToast(''), 4000);
    } catch (err) {
      showAdminError(err.response?.data?.message || err.message || 'Could not update the merchant profile.');
    }
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

    if (!target.realDbId) {
      showAdminError('Merchant could not be identified. Refresh the list and try again.');
      return;
    }
    try {
      const res = await axios.patch(`/api/admin/merchants/${target.realDbId}/modules`, { enabledModules: updatedModules });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Module update was rejected.');
      }
    } catch (err) {
      showAdminError(err.response?.data?.message || err.message || 'Could not update merchant modules.');
      return;
    }

    setMerchants(prev => prev.map(m => m.id === merchantId ? { ...m, enabledModules: updatedModules } : m));
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
          setMobileSidebarOpen(false);
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
      {adminError && (
        <div className="bg-rose-600 text-white px-5 py-2.5 shadow-lg flex items-center justify-between text-xs font-semibold z-40 sticky top-10 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-200" />
            <span>{adminError}</span>
          </div>
          <button onClick={() => setAdminError('')} className="text-white/80 hover:text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

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
      <div className="flex-1 flex min-w-0 overflow-hidden relative">
        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* 1. Left Light Sidebar (Omniva SAAS PLATFORM) */}
        <aside
          className={`${
            mobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50 flex shadow-2xl animate-in slide-in-from-left duration-200' : 'hidden md:flex'
          } w-64 bg-white flex-col shrink-0 select-none border-r border-slate-200 h-full overflow-hidden transition-all`}
        >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-500/20">
              O
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-base tracking-tight leading-tight">Omniva</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SAAS PLATFORM</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
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
              {(user?.name || 'A').trim().charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Platform Admin'}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email || 'Email not loaded'}</div>
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
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 capitalize">
                Platform / {activeTab.replace('-', ' ')}
              </div>
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 capitalize tracking-tight truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none">
                {activeTab === 'add-merchant'
                  ? 'Add Merchant'
                  : activeTab === 'merchant-details'
                  ? (selectedMerchant?.name || 'Merchant details')
                  : activeTab.replace('-', ' ')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Search Input */}
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 w-44 md:w-56 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Quick Actions */}
            <button className="hidden xs:flex p-2 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl bg-white hover:bg-slate-50 transition cursor-pointer">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            <button className="p-2 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl bg-white hover:bg-slate-50 transition cursor-pointer">
              <Bell className="w-3.5 h-3.5" />
            </button>

            {/* Admin Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                {(user?.name || 'A').trim().charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Platform Admin'}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : (user?.role || 'Platform team')}</div>
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

              {/* Live platform metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Total merchants',
                    value: livePlatformStats?.totalMerchants ?? merchants.length,
                    note: 'All tenant accounts in the database',
                    icon: Building2,
                    color: 'bg-indigo-50 text-indigo-600',
                  },
                  {
                    label: 'Active merchants',
                    value: livePlatformStats?.activeMerchants ?? merchants.filter(m => m.status === 'Active').length,
                    note: 'Status ACTIVE',
                    icon: CheckCircle2,
                    color: 'bg-emerald-50 text-emerald-600',
                  },
                  {
                    label: 'Orders',
                    value: livePlatformStats?.totalOrders ?? '—',
                    note: 'Across all tenants',
                    icon: ShoppingBag,
                    color: 'bg-blue-50 text-blue-600',
                  },
                  {
                    label: 'Recorded order value',
                    value: livePlatformStats?.totalRevenue != null
                      ? `₹${Number(livePlatformStats.totalRevenue).toLocaleString('en-IN')}`
                      : '—',
                    note: 'Excludes cancelled orders',
                    icon: Activity,
                    color: 'bg-amber-50 text-amber-600',
                  },
                ].map((metric) => (
                  <div key={metric.label} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>{metric.label}</span>
                      <span className={`p-1 rounded-lg ${metric.color}`}>
                        <metric.icon className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-black text-slate-900">{metric.value}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{metric.note}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <div className="text-xs text-slate-400 font-semibold uppercase">Live platform totals</div>
                    <div className="text-xs text-slate-500 mt-0.5">Only fields returned by /api/admin/stats are displayed</div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      ['Bookings', livePlatformStats?.totalBookings ?? '—'],
                      ['Leads', livePlatformStats?.totalLeads ?? '—'],
                      ['Active subscriptions', livePlatformStats?.activeSubscriptions ?? '—'],
                      ['Merchant accounts', livePlatformStats?.totalMerchants ?? merchants.length],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                        <div className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">{label}</div>
                        <div className="text-lg font-black text-slate-900 mt-1">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                    Revenue trend and onboarding charts are not rendered because the backend does not expose a historical time-series endpoint. No simulated bars are shown.
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <div>
                    <div className="text-xs text-slate-400 font-semibold uppercase">Operational note</div>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">No uptime or MRR telemetry</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Omniva does not currently store platform uptime samples or subscription billing amounts in these admin endpoints. Those values are intentionally shown as unavailable rather than hardcoded.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('health')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Open system health
                  </button>
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
                    <table className="w-full min-w-[600px] text-left text-xs">
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
                              setSelectedApiMerchantId(m.id);
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

                {/* Recent merchant records (1 col) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Recent merchant records</h3>
                    <p className="text-[11px] text-slate-400">Live tenants, newest first</p>
                  </div>

                  <div className="space-y-3.5">
                    {merchants.slice(0, 5).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMerchantId(m.id);
                              setSelectedApiMerchantId(m.id);
                          setActiveTab('merchant-details');
                        }}
                        className="w-full flex items-start gap-3 text-left hover:bg-slate-50 rounded-xl p-2 -m-2 transition cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{m.name}</div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {m.joinedDate ? `Joined ${m.joinedDate}` : 'Join date not recorded'} · {m.status}
                          </div>
                        </div>
                      </button>
                    ))}
                    {merchants.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500">
                        No merchant records are available.
                      </div>
                    )}
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
                  <div className="text-2xl font-black text-slate-900 mt-2">{merchants.length}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Loaded from the database</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Active</span>
                    <span className="p-1 rounded-md bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{merchants.filter(m => m.status === 'Active').length}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Status ACTIVE</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Pending</span>
                    <span className="p-1 rounded-md bg-purple-50 text-purple-600"><Clock className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{merchants.filter(m => m.status === 'Pending').length}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Awaiting activation</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Suspended</span>
                    <span className="p-1 rounded-md bg-amber-50 text-amber-600"><AlertTriangle className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{merchants.filter(m => m.status === 'Suspended').length}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Status SUSPENDED</div>
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
                  <table className="w-full min-w-[700px] text-left text-xs">
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
                              setSelectedApiMerchantId(m.id);
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
                              {m.type || 'Not set'}
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

                <div className="p-3 px-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span>Showing {filteredMerchants.length} of {merchants.length} merchant(s)</span>
                  <span>All loaded records are shown; no server-side paging endpoint is configured.</span>
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
                        <label className="text-slate-600 font-semibold block mb-1">Temporary owner password *</label>
                        <input
                          type="password"
                          value={newOwnerPassword}
                          onChange={(e) => setNewOwnerPassword(e.target.value)}
                          minLength={8}
                          placeholder="At least 8 characters"
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
                        onClick={handleCreateMerchant}
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
          {activeTab === 'merchant-details' && !selectedMerchant && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <Building2 className="w-6 h-6 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No merchant selected</h3>
              <p className="text-xs text-slate-500">Open the merchants directory and select a real account.</p>
              <button onClick={() => setActiveTab('merchants')} className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold">Open merchants</button>
            </div>
          )}

          {activeTab === 'merchant-details' && selectedMerchant && (
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
                    {selectedMerchant.slug ? (
                      <a
                        href={`/store/${selectedMerchant.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-mono border border-slate-200 flex items-center gap-1"
                      >
                        {selectedMerchant.domain} <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-50 text-slate-500 text-xs border border-slate-200">No storefront slug</span>
                    )}
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
                  <div className="text-[11px] text-slate-400">All time, all statuses</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Recorded order value</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">₹{Number(selectedMerchant.revenue || 0).toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Excludes cancelled orders</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">CRM leads</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{selectedMerchant.leads}</div>
                  <div className="text-[11px] text-slate-400">{selectedMerchant.bookings} booking(s)</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Staff accounts</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{selectedMerchant.staffCount}</div>
                  <div className="text-[11px] text-slate-400">{selectedMerchant.activeStaffCount} active</div>
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
                      <p className="text-[11px] text-slate-400">Current subscription record</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {selectedMerchant.subscription?.status || selectedMerchant.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-3.5">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current plan</span>
                      <div className="text-base font-extrabold text-slate-900 mt-0.5">
                        {selectedMerchant.plan || 'Not set'}
                        {selectedMerchant.subscription?.billingCycle ? ` · ${selectedMerchant.subscription.billingCycle.toLowerCase()}` : ''}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {selectedMerchant.subscription?.currentPeriodEnd
                          ? `Current period ends ${new Date(selectedMerchant.subscription.currentPeriodEnd).toLocaleDateString('en-IN')}`
                          : 'Billing period not recorded'}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Staff accounts</span>
                        <span className="font-bold text-slate-900">{selectedMerchant.staffCount} total · {selectedMerchant.activeStaffCount} active</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Orders</span>
                        <span className="font-bold text-slate-900">{selectedMerchant.orders} all-time</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Bookings</span>
                        <span className="font-bold text-slate-900">{selectedMerchant.bookings}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-dashed border-slate-200 p-3 text-[11px] text-slate-500">
                      Storage usage and API quota counters are not stored in the tenant admin payload, so no invented usage bars are displayed.
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(selectedMerchant)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Edit plan
                      </button>
                      <button
                        onClick={() => setMerchantDetailsSubTab('audit-logs')}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                      >
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
                      {selectedMerchant.templateCode || selectedMerchant.type || 'Not configured'}
                    </span>
                  </div>
                </div>

                {/* 3 Template Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Product */}
                  <div
                    onClick={() => handleChangeMerchantTemplate('PRODUCT', 'PRODUCT')}
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
                    <div className="font-bold text-slate-900 text-sm">Product Selling</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      E-commerce storefront, categories, cart, order lifecycle (pack, ship, deliver), and inventory.
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">Storefront</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">Product Catalog</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">COD &amp; Orders</span>
                    </div>
                  </div>

                  {/* Card 2: Travel Bookings */}
                  <div
                    onClick={() => handleChangeMerchantTemplate('TRAVEL', 'TRAVEL')}
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
                    onClick={() => handleChangeMerchantTemplate('SERVICE', 'SERVICE')}
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

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  Module toggles are saved immediately through the backend. There is no separate unsaved configuration to synchronize.
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
                      <h3 className="font-extrabold text-slate-900 text-sm">Business profile</h3>
                      <p className="text-slate-400">Fields stored on the tenant record</p>
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
                      <span className="font-bold text-slate-700 block">Business identity:</span>
                      <div className="text-slate-900 font-bold text-sm">{selectedMerchant.name}</div>
                      <div className="text-slate-600">GSTIN: {selectedMerchant.gstin || 'Not recorded'}</div>
                      <div className="text-slate-600">Business model: {selectedMerchant.type || 'Not set'}</div>
                      <div className="text-slate-600">Storefront slug: {selectedMerchant.slug || 'Not configured'}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <span className="font-bold text-slate-700 block">Contact and ownership:</span>
                      <div className="text-slate-900 font-semibold">{selectedMerchant.address || 'Address not recorded'}</div>
                      <div className="text-slate-600">Primary contact: {selectedMerchant.phone || 'Not recorded'}</div>
                      <div className="text-slate-600">Official email: {selectedMerchant.email || 'Not recorded'}</div>
                      <div className="text-slate-600">Owner: {selectedMerchant.owner || 'No owner account found'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBSCRIPTION SUBTAB */}
              {merchantDetailsSubTab === 'subscription' && (() => {
                const planInfo = Object.values(platformPlans || {}).find(
                  plan => plan.tier === (selectedMerchant.plan || '').toUpperCase()
                );
                const subscription = selectedMerchant.subscription;
                return (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Subscription record</h3>
                      <p className="text-slate-400">Only stored plan, status and period dates are shown</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      {subscription?.status || 'Status not recorded'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                      <span className="text-slate-500 font-medium">Assigned tier</span>
                      <div className="text-2xl font-black text-indigo-950 mt-1">{selectedMerchant.plan || 'Not set'}</div>
                      <div className="text-indigo-700 font-semibold mt-1">
                        {planInfo ? `₹${Number(planInfo.priceInr || 0).toLocaleString('en-IN')} configured list price` : 'No plan price record loaded'}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-slate-500 font-medium">Current period ends</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">
                        {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN') : 'Not recorded'}
                      </div>
                      <div className="text-slate-500 font-medium mt-1">Auto-debit and renewal history are not stored</div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-slate-500 font-medium">Billing cycle</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">{subscription?.billingCycle || 'Not recorded'}</div>
                      <div className="text-slate-500 font-semibold mt-1">Invoice totals are not exposed by the admin API</div>
                    </div>
                  </div>
                </div>
                );
              })()}

              {/* USAGE SUBTAB */}
              {merchantDetailsSubTab === 'usage' && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-extrabold text-slate-900 text-sm">Current-month quota usage</h3>
                  {merchantDetailError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">{merchantDetailError}</div>
                  )}
                  {!merchantUsage && !merchantDetailError && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-500">Loading usage from the server…</div>
                  )}
                  {merchantUsage && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          ['Monthly orders', merchantUsage.usage?.ordersThisMonth || 0, merchantUsage.limits?.maxMonthlyOrders],
                          ['Monthly leads', merchantUsage.usage?.leadsThisMonth || 0, merchantUsage.limits?.maxMonthlyLeads],
                          ['Staff seats', merchantUsage.usage?.staffCount || 0, merchantUsage.limits?.maxStaffSeats],
                        ].map(([label, used, limit]) => {
                          const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                          return (
                            <div key={label} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                              <div className="flex justify-between font-bold text-slate-800">
                                <span>{label}</span>
                                <span className="text-indigo-600">{used} / {limit ?? '—'}</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-slate-400 text-[11px]">{pct}% of the configured limit</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Period starts {new Date(merchantUsage.periodStart).toLocaleDateString('en-IN')}. Storage and webhook-rate counters are not stored by the backend.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* STAFF SUBTAB */}
              {merchantDetailsSubTab === 'staff' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Merchant personnel</h3>
                      <p className="text-slate-400">Accounts stored for this tenant</p>
                    </div>
                  </div>
                  {merchantDetailError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">{merchantDetailError}</div>
                  )}
                  {!merchantStaff && !merchantDetailError && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-500">Loading staff accounts…</div>
                  )}
                  <div className="divide-y divide-slate-100">
                    {(merchantStaff || []).map((staff) => (
                      <div key={staff._id} className="py-2.5 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-800">{staff.name || 'Unnamed account'}</div>
                          <div className="text-[11px] text-slate-400">{staff.email || 'No email recorded'}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-600">{staff.role}</span>
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${staff.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {staff.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {merchantStaff && merchantStaff.length === 0 && (
                      <div className="py-6 text-center text-slate-500">No staff accounts are stored for this merchant.</div>
                    )}
                  </div>
                </div>
              )}

              {/* INTEGRATIONS SUBTAB */}
              {merchantDetailsSubTab === 'integrations' && (() => {
                const config = merchantApiStore[selectedMerchant.id];
                const connectors = config ? [
                  { name: 'Meta Ads & CAPI', status: config.meta.status, detail: config.meta.pixelId ? 'Pixel ID stored' : 'No Pixel ID stored', icon: '📢' },
                  { name: 'WhatsApp Cloud API', status: config.whatsapp.status, detail: config.whatsapp.phoneNumberId || config.whatsapp.wabaId ? 'WhatsApp identifier stored' : 'No WhatsApp identifier stored', icon: '💬' },
                  { name: 'Courier API', status: config.courier.status, detail: config.courier.provider ? `${config.courier.provider} selected` : 'No courier provider selected', icon: '🚚' },
                  { name: 'Payment Gateway', status: config.payment.status, detail: config.payment.keyId ? 'Gateway key ID stored' : 'No gateway key ID stored', icon: '💳' },
                ] : [];
                return (
                <div className="space-y-4 text-xs">
                  <h3 className="font-extrabold text-slate-900 text-sm">Stored connector configuration</h3>
                  <p className="text-[11px] text-slate-500">Status reflects saved fields only. No live handshake is performed.</p>
                  {!config && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-500">
                      Loading connector configuration for this merchant…
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {connectors.map((it) => {
                      const configured = it.status === 'CONFIGURED';
                      return (
                        <div key={it.name} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                          <span className="text-2xl">{it.icon}</span>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{it.name}</span>
                              <span className={`px-2 py-0.5 rounded-full border font-bold text-[10px] ${configured ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {it.status || 'NOT_CONFIGURED'}
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] leading-relaxed">{it.detail}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('integrations')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs"
                  >
                    Open connector provisioning
                  </button>
                </div>
                );
              })()}

              {/* AUDIT LOGS SUBTAB */}
              {merchantDetailsSubTab === 'audit-logs' && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-extrabold text-slate-900 text-sm">Administrative activity trail</h3>
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                    No persisted audit-log endpoint is configured. The previous rows, timestamps and IP addresses were hardcoded and have been removed.
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
                <p className="text-xs text-slate-500">Read-only subscription records. Payment collection and invoicing are handled outside this admin console.</p>
              </div>

              {/* Real subscription counts */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Merchant accounts</span>
                    <span className="p-1 rounded-md bg-indigo-50 text-indigo-600"><Building2 className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{merchants.length}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Loaded from the database</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Active subscriptions</span>
                    <span className="p-1 rounded-md bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{merchants.filter(m => (m.subscription?.status || '').toUpperCase() === 'ACTIVE').length}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Subscription status ACTIVE</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Trial subscriptions</span>
                    <span className="p-1 rounded-md bg-amber-50 text-amber-600"><Clock className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{merchants.filter(m => (m.subscription?.status || '').toUpperCase() === 'TRIAL').length}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Subscription status TRIAL</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Recorded order value</span>
                    <span className="p-1 rounded-md bg-blue-50 text-blue-600"><Activity className="w-3.5 h-3.5" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {livePlatformStats?.totalRevenue != null ? `₹${Number(livePlatformStats.totalRevenue).toLocaleString('en-IN')}` : '—'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Plan billing amounts are not recorded</div>
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
                  <table className="w-full min-w-[700px] text-left text-xs">
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
                      {merchants.map((m) => {
                        const cycle = m.subscription?.billingCycle
                          ? (m.subscription.billingCycle === 'ANNUAL' ? 'Yearly' : 'Monthly')
                          : '—';
                        const status = m.subscription?.status || m.status;
                        const nextBilling = m.subscription?.currentPeriodEnd
                          ? new Date(m.subscription.currentPeriodEnd).toLocaleDateString('en-IN')
                          : '—';
                        return (
                          <tr key={m.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                                  {m.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{m.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{m.displayId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">{m.plan || 'Not set'}</td>
                            <td className="py-3 px-4 font-bold text-slate-500">Not recorded</td>
                            <td className="py-3 px-4 text-slate-600">{cycle}</td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                status === 'ACTIVE' || status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : status === 'TRIAL' || status === 'Pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">{nextBilling}</td>
                            <td className="py-3 px-5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMerchantId(m.id);
                              setSelectedApiMerchantId(m.id);
                                  setActiveTab('merchant-details');
                                  setMerchantDetailsSubTab('subscription');
                                }}
                                className="text-[11px] font-bold text-indigo-600 hover:underline"
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {merchants.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 px-5 text-center text-slate-500">
                            No merchant subscription records are available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 6. PLANS & PRICING ==================== */}
          {activeTab === 'plans' && (() => {
            const plans = Object.values(platformPlans || {});
            const activeSubscriptionCount = livePlatformStats?.activeSubscriptions
              ?? merchants.filter(m => (m.subscription?.status || '').toUpperCase() === 'ACTIVE').length;
            return (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Plan limits come from the backend plan configuration.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Merchant counts are calculated from live tenant records.</p>
                </div>
              </div>

              {(!platformPlans || plans.length === 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
                  The plan catalog could not be loaded from <code>/api/admin/plans</code>. No replacement prices or limits are displayed.
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ['Configured plans', plans.length],
                  ['Merchant accounts', merchants.length],
                  ['Active subscriptions', activeSubscriptionCount],
                  ['Recorded order value', livePlatformStats?.totalRevenue != null ? `₹${Number(livePlatformStats.totalRevenue).toLocaleString('en-IN')}` : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <div className="text-xs text-slate-500 font-medium">{label}</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">{value}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Live backend data</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const merchantCount = merchants.filter(m => (m.plan || '').toUpperCase() === plan.tier).length;
                  return (
                    <div key={plan.tier} className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6 ${plan.tier === 'GROWTH' ? 'border-indigo-600 border-2' : 'border-slate-200/80'}`}>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{merchantCount} merchant(s) on this tier</p>
                        </div>
                        <div>
                          <div className="text-3xl font-black text-slate-900">₹{Number(plan.priceInr || 0).toLocaleString('en-IN')} <span className="text-xs text-slate-400 font-medium">/ month</span></div>
                          <p className="text-[11px] text-slate-400 mt-0.5">Configured list price. Billing agreements are not stored per merchant.</p>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                          {(plan.features || []).map((feature) => (
                            <li key={feature} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {feature}</li>
                          ))}
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('merchants')}
                        className="py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        View merchant directory
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 px-6 border-b border-slate-200/80">
                  <h3 className="font-bold text-slate-900 text-sm">Enforced quotas</h3>
                  <p className="text-[11px] text-slate-400">These limits are enforced by the backend quota middleware.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-6">LIMIT</th>
                        {plans.map(plan => <th key={plan.tier} className="py-3 px-6">{plan.tier}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        ['Orders / month', 'maxMonthlyOrders'],
                        ['Leads / month', 'maxMonthlyLeads'],
                        ['Staff seats', 'maxStaffSeats'],
                      ].map(([label, key]) => (
                        <tr key={key} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-6 font-semibold text-slate-800">{label}</td>
                          {plans.map(plan => <td key={plan.tier} className="py-3 px-6 text-slate-700 font-bold">{plan[key]?.toLocaleString('en-IN') ?? '—'}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            );
          })()}

          {/* ==================== 7. BUSINESS TEMPLATES ==================== */}
          {activeTab === 'templates' && (() => {
            const templates = [
              { code: 'PRODUCT', name: 'Product Selling', desc: 'Catalog, inventory and order management', tags: ['Products', 'Stock', 'Checkout'] },
              { code: 'SERVICE', name: 'Service Business', desc: 'Service packages, bookings and staff schedules', tags: ['Services', 'Bookings', 'Calendar'] },
              { code: 'TRAVEL', name: 'Travel Agency', desc: 'Tours, passengers and trip bookings', tags: ['Tours', 'Passengers', 'Trips'] },
              { code: 'RESTAURANT', name: 'Restaurant', desc: 'Menu-led ordering workflow', tags: ['Menu', 'Orders', 'Delivery'] },
              { code: 'SALON', name: 'Salon & Beauty', desc: 'Appointments and service teams', tags: ['Services', 'Availability', 'Reminders'] },
              { code: 'CUSTOM', name: 'Custom Template', desc: 'A tenant-specific workflow selection', tags: ['Modules', 'Roles', 'Custom'] },
            ];
            const countFor = (code) => merchants.filter(m => (m.templateCode || '') === code).length;
            const assigned = templates.reduce((sum, tpl) => sum + countFor(tpl.code), 0);
            return (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Template codes are stored on each tenant. Workflow editing is not persisted by this console.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">The counts below are live; no draft or version metadata is claimed.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ['Supported template codes', templates.length],
                  ['Assigned workspaces', assigned],
                  ['Unassigned records', Math.max(0, merchants.length - assigned)],
                  ['Custom workspaces', countFor('CUSTOM')],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <div className="text-xs text-slate-500 font-medium">{label}</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">{value}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Derived from tenant records</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((tpl) => (
                  <div key={tpl.code} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                          {tpl.code}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{tpl.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{tpl.desc}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tpl.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-semibold">{countFor(tpl.code)} workspace(s)</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('merchants')}
                        className="px-3 py-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        View merchants
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            );
          })()}

          {/* ==================== 8. INTEGRATIONS ==================== */}
          {activeTab === 'integrations' && (() => {
            const currentApiMerchant = merchants.find(m => m.id === selectedApiMerchantId) || merchants[0];
            if (!currentApiMerchant) {
              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                  <Key className="w-6 h-6 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">No merchant accounts found</h3>
                  <p className="text-xs text-slate-500">Create a merchant account before provisioning integration credentials.</p>
                </div>
              );
            }
            const currentConfig = merchantApiStore[currentApiMerchant.id] || createEmptySuperAdminIntegrationConfig();

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
                    <p className="text-[11px] text-indigo-800 max-w-3xl leading-relaxed font-medium">
                      Stored secrets are encrypted at rest and shown only as a mask. Leave a masked field unchanged to keep the existing credential; enter a new value only when rotating it.
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
                      {currentApiMerchant.name} ({currentApiMerchant.slug || currentApiMerchant.displayId})
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
                    { id: 'courier', name: 'Logistics & Courier Delivery API', sub: 'Saved courier API credentials', icon: '🚚', status: currentConfig.courier.status },
                    { id: 'payment', name: 'Razorpay UPI & Payment Gateway', sub: 'Key ID, Secret & Webhooks', icon: '💳', status: currentConfig.payment.status },
                    { id: 'webhooks', name: 'Outbound ERP & Zapier Webhook', sub: 'Saved outbound webhook URL', icon: '🌐', status: currentConfig.webhooks.status }
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
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Credential storage warning
                    </div>
                    <p className="text-slate-600">
                      Integration credentials are stored on the tenant record and returned to SUPER_ADMIN accounts. This is not encrypted-at-rest storage; use an external secrets manager before production.
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
                            placeholder="Dataset name"
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
                            placeholder="Paste Meta CAPI token"
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
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/meta?merchant=${currentApiMerchant.slug || currentApiMerchant.realDbId}`}
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
                            placeholder="WhatsApp Business Account ID"
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
                          <label className="block text-slate-700 font-bold mb-1">Inbound Webhook Verification</label>
                          <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs">
                            Not configured. Omniva currently uses WhatsApp Cloud API credentials for outbound messages only.
                          </div>
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
                            placeholder="Courier API key"
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
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Credentials Saved
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
                            placeholder="Razorpay key ID"
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
                            placeholder="Webhook signing secret"
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
                    <h3 className="font-extrabold text-slate-900 text-sm">Cross-Merchant API Provisioning Status</h3>
                    <p className="text-xs text-slate-500">Status from the saved tenant fields; no live handshake is performed</p>
                  </div>
                  <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
                    {merchants.length} Workspaces Loaded
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-xs">
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
                        const mConfig = merchantApiStore[m.id] || createEmptySuperAdminIntegrationConfig();
                        const isSelected = m.id === selectedApiMerchantId;

                        return (
                          <tr key={m.id} className={`hover:bg-slate-50 transition ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{m.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{m.displayId} · {m.owner || 'No owner record'}</div>
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
                                {mConfig.payment.provider}
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
                <p className="text-xs text-slate-500">Live aggregate metrics returned by the admin API</p>
                <button
                  onClick={handleExportMerchantsCsv}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export merchants
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ['Recorded order value', livePlatformStats?.totalRevenue != null ? `₹${Number(livePlatformStats.totalRevenue).toLocaleString('en-IN')}` : '—'],
                  ['Total merchants', livePlatformStats?.totalMerchants ?? merchants.length],
                  ['Orders processed', livePlatformStats?.totalOrders ?? '—'],
                  ['Bookings received', livePlatformStats?.totalBookings ?? '—'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <div className="text-xs text-slate-500 font-medium">{label}</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">{value}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Current database aggregate</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Merchant distribution by business type</h3>
                  <div className="space-y-2 text-xs">
                    {Object.entries(
                      merchants.reduce((acc, m) => {
                        const key = m.type || 'Not set';
                        acc[key] = (acc[key] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                        <span className="font-semibold text-slate-700">{type}</span>
                        <span className="font-bold text-slate-900">{count}</span>
                      </div>
                    ))}
                    {merchants.length === 0 && <div className="text-slate-500">No merchant records available.</div>}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Analytics limitations</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The current backend does not expose time-series revenue, trial conversion, churn or per-plan revenue. These are left unavailable instead of being estimated.
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600">
                    CRM leads: <strong>{livePlatformStats?.totalLeads ?? '—'}</strong><br />
                    Active merchants: <strong>{livePlatformStats?.activeMerchants ?? merchants.filter(m => m.status === 'Active').length}</strong><br />
                    Suspended merchants: <strong>{merchants.filter(m => m.status === 'Suspended').length}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 10. SUPPORT TICKETS ==================== */}
          {activeTab === 'tickets' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Support ticket management</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                <LifeBuoy className="w-6 h-6 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">Support ticket storage is not configured</h3>
                <p className="text-xs text-slate-500 max-w-xl mx-auto">
                  No ticket collection or support API exists in this backend. The previous ticket records and SLA metrics were hardcoded and have been removed. Connect a real support system before displaying ticket counts.
                </p>
              </div>
            </div>
          )}

          {/* ==================== 11. STAFF & ROLES ==================== */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Platform team access model</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                <Users className="w-6 h-6 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">Platform staff directory is not exposed by the API</h3>
                <p className="text-xs text-slate-500 max-w-xl mx-auto">
                  The previous staff names, invitation counts and activity timestamps were hardcoded. No platform-staff listing endpoint exists yet, so those records have been removed. Merchant-scoped staff are managed inside each merchant workspace.
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 px-6 border-b border-slate-200/80">
                  <h3 className="font-bold text-slate-900 text-sm">Documented role boundary</h3>
                  <p className="text-[11px] text-slate-400">This is the access policy enforced by the backend, not editable platform data.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-6">PERMISSION</th>
                        <th className="py-3 px-4">SUPER ADMIN</th>
                        <th className="py-3 px-4">SUPER STAFF</th>
                        <th className="py-3 px-4">MERCHANT OWNER</th>
                        <th className="py-3 px-6">MERCHANT STAFF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { perm: 'View merchants', admin: 'Full', superStaff: 'Limited', owner: 'Own tenant', staff: 'Own tenant' },
                        { perm: 'Merchant integration secrets', admin: 'Full', superStaff: 'No access', owner: 'Own tenant', staff: 'No access' },
                        { perm: 'Platform statistics', admin: 'Full', superStaff: 'Full', owner: 'Own tenant', staff: 'Scoped' },
                        { perm: 'Upgrade subscription', admin: 'Full', superStaff: 'Full', owner: 'Own tenant', staff: 'No access' },
                        { perm: 'Manage merchant modules', admin: 'Full', superStaff: 'Full', owner: 'No access', staff: 'No access' },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-6 font-semibold text-slate-800">{row.perm}</td>
                          <td className="py-3 px-4 font-bold text-indigo-700">{row.admin}</td>
                          <td className="py-3 px-4 text-slate-600">{row.superStaff}</td>
                          <td className="py-3 px-4 text-slate-600">{row.owner}</td>
                          <td className="py-3 px-6 text-slate-600">{row.staff}</td>
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
                <p className="text-xs text-slate-500">Real response from <code>/api/health/deep</code></p>
                <button
                  onClick={loadHealthSnapshot}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              {healthError && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800">
                  {healthError}
                </div>
              )}

              {!healthSnapshot && !healthError && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                  Loading the live health snapshot…
                </div>
              )}

              {healthSnapshot && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      ['Service status', healthSnapshot.status || 'Unknown', healthSnapshot.status === 'ready' ? 'text-emerald-600' : 'text-amber-600'],
                      ['Database', healthSnapshot.database?.connected ? 'Connected' : 'Disconnected', healthSnapshot.database?.connected ? 'text-emerald-600' : 'text-rose-600'],
                      ['Database latency', healthSnapshot.database?.latencyMs >= 0 ? `${healthSnapshot.database.latencyMs} ms` : 'Not measured', 'text-slate-900'],
                      ['Process uptime', healthSnapshot.uptimeSeconds != null ? `${Math.floor(healthSnapshot.uptimeSeconds / 60)} min` : '—', 'text-slate-900'],
                    ].map(([label, value, color]) => (
                      <div key={label} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                        <div className="text-xs text-slate-500 font-medium">{label}</div>
                        <div className={`text-xl font-black mt-2 ${color}`}>{value}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Live snapshot</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                      <h3 className="font-bold text-slate-900 text-sm">Runtime</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-600">Platform</span><span className="font-bold text-slate-900">{healthSnapshot.platform || 'Omniva'}</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-600">Version</span><span className="font-bold text-slate-900">{healthSnapshot.version || '—'}</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-600">Node.js</span><span className="font-bold text-slate-900">{healthSnapshot.system?.nodeVersion || '—'}</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-600">Environment</span><span className="font-bold text-slate-900">{healthSnapshot.environment || 'Unknown'}</span></div>
                        <div className="flex justify-between py-1"><span className="text-slate-600">Checked at</span><span className="font-bold text-slate-900">{healthSnapshot.timestamp ? new Date(healthSnapshot.timestamp).toLocaleString('en-IN') : '—'}</span></div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                      <h3 className="font-bold text-slate-900 text-sm">Memory and database</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-600">Heap used</span><span className="font-bold text-slate-900">{healthSnapshot.system?.memory?.heapUsedMb ?? '—'} MB</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-600">Heap total</span><span className="font-bold text-slate-900">{healthSnapshot.system?.memory?.heapTotalMb ?? '—'} MB</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-600">RSS</span><span className="font-bold text-slate-900">{healthSnapshot.system?.memory?.rssMb ?? '—'} MB</span></div>
                        <div className="flex justify-between py-1"><span className="text-slate-600">Database connected</span><span className={`font-bold ${healthSnapshot.database?.connected ? 'text-emerald-600' : 'text-rose-600'}`}>{healthSnapshot.database?.connected ? 'Yes' : 'No'}</span></div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ==================== 13. SYSTEM LOGS ==================== */}
          {activeTab === 'logs' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Platform audit and event logs</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                <Terminal className="w-6 h-6 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">No platform log endpoint is configured</h3>
                <p className="text-xs text-slate-500 max-w-xl mx-auto">
                  The previous event counts, latency figures and log rows were hardcoded. They have been removed. Use infrastructure logs or add a persisted audit-log API before displaying platform events here.
                </p>
              </div>
            </div>
          )}

          {/* ==================== 14. PLATFORM SETTINGS ==================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Configure global preferences, security and communication defaults</p>
                <button
                  onClick={() => showAdminError('Platform-wide settings are not persisted by the backend yet. No values were saved.')}
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
                      onClick={() => showAdminError('Platform-wide settings are not persisted by the backend yet. No values were saved.')}
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
                    <option value="Product">📦 Product</option>
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
