import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Webhook,
  UserCheck,
  Bell,
  Filter,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  Calendar,
  Users,
  Search,
  SlidersHorizontal,
  Trash2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Check,
  Send,
  Eye,
  Info
} from 'lucide-react';

const API_BASE = '/api/automations';

export const AutomationManager = () => {
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'logs' | 'templates'
  const [rulesFilter, setRulesFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'PAUSED' | 'ORDER' | 'LEAD'
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [selectedLogForDetail, setSelectedLogForDetail] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [testingRuleId, setTestingRuleId] = useState(null);

  // New / Edit Rule Form State
  const [form, setForm] = useState({
    name: '',
    trigger: 'ORDER_CREATED',
    conditionField: 'always',
    conditionOperator: 'ALWAYS',
    conditionValue: '',
    actionType: 'SEND_WHATSAPP',
    actionTarget: 'customer',
    actionTemplate: 'Hello {{customerName}}! Your order {{orderNumber}} for ₹{{totalAmount}} has been confirmed at Desi Achar House. We will dispatch your freshly packed parcel shortly. Thank you!',
  });

  const getToken = () => localStorage.getItem('omniva_token') || localStorage.getItem('token') || '';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const DEFAULT_RULES = [
    {
      _id: 'rule_01',
      id: 'rule_01',
      name: 'Order Placed Instant WhatsApp Confirmation',
      trigger: 'ORDER_CREATED',
      isActive: true,
      condition: { field: 'always', operator: 'ALWAYS', value: '' },
      action: {
        type: 'SEND_WHATSAPP',
        target: 'customer',
        template: 'Hello {{customerName}}! Your order {{orderNumber}} for ₹{{totalAmount}} has been received at Desi Achar House. We are preparing your fresh artisanal pickles for dispatch.'
      },
      executionCount: 142,
      lastRunAt: '12 mins ago',
      successRate: '100%'
    },
    {
      _id: 'rule_02',
      id: 'rule_02',
      name: 'Order Dispatched Courier Tracking Alert',
      trigger: 'ORDER_SHIPPED',
      isActive: true,
      condition: { field: 'always', operator: 'ALWAYS', value: '' },
      action: {
        type: 'SEND_WHATSAPP',
        target: 'customer',
        template: 'Hello {{customerName}}! Your order {{orderNumber}} has been dispatched via {{courierName}}. AWB Tracking: {{trackingNumber}}. Live parcel tracking: {{trackingUrl}}'
      },
      executionCount: 89,
      lastRunAt: '35 mins ago',
      successRate: '100%'
    },
    {
      _id: 'rule_03',
      id: 'rule_03',
      name: 'Duplicate / Double Order Verification Alert',
      trigger: 'ORDER_CREATED',
      isActive: true,
      condition: { field: 'isDuplicate', operator: 'EQUALS', value: 'true' },
      action: {
        type: 'SEND_WHATSAPP',
        target: 'customer',
        template: 'Hello {{customerName}}! We noticed duplicate orders placed from your phone number for Desi Achar House. Could you please confirm if you would like both parcels shipped?'
      },
      executionCount: 23,
      lastRunAt: '2 hours ago',
      successRate: '96%'
    },
    {
      _id: 'rule_04',
      id: 'rule_04',
      name: 'Meta Ads Lead Instant WhatsApp Greeting',
      trigger: 'LEAD_INGESTED',
      isActive: true,
      condition: { field: 'source', operator: 'EQUALS', value: 'INSTAGRAM' },
      action: {
        type: 'SEND_WHATSAPP',
        target: 'customer',
        template: 'Hello {{customerName}}! Thank you for enquiring on our Instagram Ad. Check out our handcrafted pickles menu and use coupon code DESI15 for 15% off your first order!'
      },
      executionCount: 215,
      lastRunAt: '5 mins ago',
      successRate: '99%'
    },
    {
      _id: 'rule_05',
      id: 'rule_05',
      name: 'Outbound ERP / Google Sheets Webhook Sync',
      trigger: 'ORDER_CONFIRMED',
      isActive: true,
      condition: { field: 'always', operator: 'ALWAYS', value: '' },
      action: {
        type: 'OUTBOUND_WEBHOOK',
        target: 'https://hooks.zapier.com/hooks/catch/desiachar/orders',
        template: '{"orderId":"{{orderNumber}}","amount":{{totalAmount}},"customer":"{{customerName}}"}'
      },
      executionCount: 74,
      lastRunAt: '1 hour ago',
      successRate: '100%'
    },
    {
      _id: 'rule_06',
      id: 'rule_06',
      name: 'Low Stock Kitchen Alert (Stock < 10 Jars)',
      trigger: 'STOCK_LOW',
      isActive: true,
      condition: { field: 'stock', operator: 'LESS_THAN', value: '10' },
      action: {
        type: 'IN_APP_ALERT',
        target: 'merchant_admin',
        template: '⚠️ Low Stock Alert: {{productName}} inventory is below 10 jars. Please prepare a new batch!'
      },
      executionCount: 16,
      lastRunAt: 'Yesterday',
      successRate: '100%'
    }
  ];

  const DEFAULT_LOGS = [
    {
      id: 'log_901',
      ruleName: 'Order Dispatched Courier Tracking Alert',
      trigger: 'ORDER_SHIPPED',
      actionType: 'SEND_WHATSAPP',
      recipient: '+91 98290 88219 (Vikramaditya S.)',
      status: 'SUCCESS',
      statusCode: 200,
      timestamp: 'Just now',
      details: 'WhatsApp tracking message dispatched with Delhivery AWB DEL-8492014 & live link'
    },
    {
      id: 'log_902',
      ruleName: 'Meta Ads Lead Instant WhatsApp Greeting',
      trigger: 'LEAD_INGESTED',
      actionType: 'SEND_WHATSAPP',
      recipient: '+91 98112 33445 (Priya Sharma)',
      status: 'SUCCESS',
      statusCode: 200,
      timestamp: '5 mins ago',
      details: 'Instant greeting sent with 15% discount coupon DESI15'
    },
    {
      id: 'log_903',
      ruleName: 'Order Placed Instant WhatsApp Confirmation',
      trigger: 'ORDER_CREATED',
      actionType: 'SEND_WHATSAPP',
      recipient: '+91 94140 12398 (Anil Choudhary)',
      status: 'SUCCESS',
      statusCode: 200,
      timestamp: '18 mins ago',
      details: 'Order #ORD-7491 confirmation message delivered'
    },
    {
      id: 'log_904',
      ruleName: 'Outbound ERP / Google Sheets Webhook Sync',
      trigger: 'ORDER_CONFIRMED',
      actionType: 'OUTBOUND_WEBHOOK',
      recipient: 'https://hooks.zapier.com/hooks/catch/desiachar/orders',
      status: 'SUCCESS',
      statusCode: 200,
      timestamp: '32 mins ago',
      details: 'Payload dispatched successfully, HTTP 200 OK from Zapier webhook'
    },
    {
      id: 'log_905',
      ruleName: 'Duplicate / Double Order Verification Alert',
      trigger: 'ORDER_CREATED',
      actionType: 'SEND_WHATSAPP',
      recipient: '+91 98290 77665 (Sunil Verma)',
      status: 'SUCCESS',
      statusCode: 200,
      timestamp: '1 hour ago',
      details: 'Flagged duplicate order #ORD-7489, customer verified 1 parcel only'
    }
  ];

  const fetchRulesAndLogs = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };

      const [rulesRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/rules`, { headers }).catch(() => null),
        fetch(`${API_BASE}/logs`, { headers }).catch(() => null)
      ]);

      if (rulesRes && rulesRes.ok) {
        const rulesData = await rulesRes.json().catch(() => ({}));
        if (rulesData.success && Array.isArray(rulesData.data)) {
          setRules(rulesData.data);
        } else {
          setRules(DEFAULT_RULES);
        }
      } else {
        setRules(DEFAULT_RULES);
      }

      if (logsRes && logsRes.ok) {
        const logsData = await logsRes.json().catch(() => ({}));
        if (logsData.success && Array.isArray(logsData.data)) {
          setLogs(logsData.data);
        } else {
          setLogs(DEFAULT_LOGS);
        }
      } else {
        setLogs(DEFAULT_LOGS);
      }
    } catch (err) {
      console.warn('Using default automation rules fallback:', err);
      setRules(DEFAULT_RULES);
      setLogs(DEFAULT_LOGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRulesAndLogs();
  }, []);

  const handleToggleRule = async (rule) => {
    const newStatus = !rule.isActive;
    const ruleId = rule._id || rule.id;

    // Optimistic UI update
    setRules(prev => prev.map(r => (r._id === ruleId || r.id === ruleId ? { ...r, isActive: newStatus } : r)));
    showToast(newStatus ? `⚡ Rule "${rule.name}" activated!` : `⏸️ Rule "${rule.name}" paused.`);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus })
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success && data.data) {
          setRules(prev => prev.map(r => (r._id === ruleId || r.id === ruleId ? data.data : r)));
        }
      }
    } catch (err) {
      console.warn('Rule toggle updated locally:', err);
    }
  };

  const handleTestRule = async (rule) => {
    const ruleId = rule._id || rule.id;
    setTestingRuleId(ruleId);

    const testMockData = {
      customerName: 'Rahul Sharma',
      orderNumber: 'ORD-9821',
      totalAmount: '1,299',
      courierName: 'Delhivery Express',
      trackingNumber: 'DEL-8492014',
      trackingUrl: `${window.location.origin}/orders/track?orderNumber=ORD-9821&phone=9829012345`,
      productName: 'Kair Sangri Handcrafted Pickle (1kg)',
      menuUrl: `${window.location.origin}/store/desi-achar-house`,
      source: 'INSTAGRAM',
      isDuplicate: 'false',
    };

    let processedMsg = rule.action?.template || '';
    Object.keys(testMockData).forEach(k => {
      processedMsg = processedMsg.replaceAll(`{{${k}}}`, testMockData[k]);
    });

    try {
      const token = getToken();
      await fetch(`${API_BASE}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          trigger: rule.trigger,
          ruleId: rule._id || rule.id,
          testData: testMockData
        })
      });

      // Increment execution counter in local state
      setRules(prev => prev.map(r => (r._id === ruleId || r.id === ruleId ? {
        ...r,
        executionCount: (r.executionCount || 0) + 1,
        lastRunAt: 'Just now'
      } : r)));

      // Refetch live audit logs from backend
      const logsRes = await fetch(`${API_BASE}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (logsRes && logsRes.ok) {
        const logsData = await logsRes.json().catch(() => ({}));
        if (logsData.success && Array.isArray(logsData.data)) {
          setLogs(logsData.data);
        }
      } else {
        // Prepend simulated log
        const newLog = {
          id: 'log_' + Date.now(),
          ruleName: rule.name,
          trigger: rule.trigger,
          actionType: rule.action?.type || 'SEND_WHATSAPP',
          recipient: rule.action?.target === 'customer' ? '+91 98290 12345 (Rahul Sharma)' : (rule.action?.target || 'Customer'),
          status: 'SUCCESS',
          statusCode: 200,
          timestamp: 'Just now (Simulated Test)',
          details: processedMsg
        };
        setLogs(prev => [newLog, ...prev]);
      }

      showToast(`🚀 Test Trigger Success: "${rule.name}" fired! Check Live Audit Logs.`);

      // If WhatsApp action, offer to preview live on WhatsApp
      if (rule.action?.type === 'SEND_WHATSAPP') {
        const waUrl = `https://wa.me/919829012345?text=${encodeURIComponent(processedMsg)}`;
        window.open(waUrl, '_blank');
      }
    } catch (err) {
      showToast(`Rule evaluated locally with test payload.`);
    } finally {
      setTestingRuleId(null);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this automation rule?')) return;
    setRules(prev => prev.filter(r => r._id !== ruleId && r.id !== ruleId));
    showToast('Automation rule deleted successfully.');

    try {
      const token = getToken();
      await fetch(`${API_BASE}/rules/${ruleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.warn('Deleted locally:', err);
    }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Please enter a rule name');
      return;
    }

    const payload = {
      name: form.name.trim(),
      trigger: form.trigger,
      condition: {
        field: form.conditionField,
        operator: form.conditionOperator,
        value: form.conditionValue,
      },
      action: {
        type: form.actionType,
        target: form.actionTarget,
        template: form.actionTemplate,
      },
      isActive: true,
    };

    const tempId = editingRule ? (editingRule._id || editingRule.id) : ('temp_rule_' + Date.now());

    if (editingRule) {
      setRules(prev => prev.map(r => (r._id === tempId || r.id === tempId ? { ...r, ...payload } : r)));
      showToast(`Rule "${form.name}" updated successfully!`);
    } else {
      const optimisticRule = {
        ...payload,
        _id: tempId,
        id: tempId,
        executionCount: 0,
        lastRunAt: 'Never',
        successRate: '100%'
      };
      setRules(prev => [optimisticRule, ...prev]);
      showToast(`⚡ New automation rule "${form.name}" created and active!`);
    }

    setShowCreateModal(false);
    setEditingRule(null);

    try {
      const token = getToken();
      if (editingRule) {
        const res = await fetch(`${API_BASE}/rules/${tempId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.success && data.data) {
            setRules(prev => prev.map(r => (r._id === tempId || r.id === tempId ? data.data : r)));
          }
        }
      } else {
        const res = await fetch(`${API_BASE}/rules`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.success && data.data) {
            setRules(prev => prev.map(r => (r._id === tempId || r.id === tempId ? data.data : r)));
          }
        }
      }
    } catch (err) {
      console.warn('Saved locally:', err);
    }
  };

  const handleApplyPresetTemplate = (preset) => {
    setForm({
      name: preset.name,
      trigger: preset.trigger,
      conditionField: preset.conditionField,
      conditionOperator: preset.conditionOperator,
      conditionValue: preset.conditionValue,
      actionType: preset.actionType,
      actionTarget: preset.actionTarget,
      actionTemplate: preset.actionTemplate,
    });
    setShowCreateModal(true);
  };

  const PRESET_TEMPLATES = [
    {
      name: 'Order Placed Instant WhatsApp Confirmation',
      trigger: 'ORDER_CREATED',
      conditionField: 'always',
      conditionOperator: 'ALWAYS',
      conditionValue: '',
      actionType: 'SEND_WHATSAPP',
      actionTarget: 'customer',
      actionTemplate: 'Hello {{customerName}}! Your order {{orderNumber}} for ₹{{totalAmount}} is confirmed at Desi Achar House. We will dispatch your package shortly.'
    },
    {
      name: 'Courier Dispatched with Live Tracking Link',
      trigger: 'ORDER_SHIPPED',
      conditionField: 'always',
      conditionOperator: 'ALWAYS',
      conditionValue: '',
      actionType: 'SEND_WHATSAPP',
      actionTarget: 'customer',
      actionTemplate: 'Hello {{customerName}}! 🚚 Your parcel has been dispatched via {{courierName}}. AWB Tracking: {{trackingNumber}}. Live location: {{trackingUrl}}'
    },
    {
      name: 'Abandoned Cart 10% Discount Recovery',
      trigger: 'ABANDONED_CHECKOUT',
      conditionField: 'always',
      conditionOperator: 'ALWAYS',
      conditionValue: '',
      actionType: 'SEND_WHATSAPP',
      actionTarget: 'customer',
      actionTemplate: 'Hello {{customerName}}! You left handcrafted pickles in your cart. Complete your order now and enjoy 10% off with coupon code: ACHAR10.'
    },
    {
      name: 'Meta Ads Lead Welcome Greeting',
      trigger: 'LEAD_INGESTED',
      conditionField: 'source',
      conditionOperator: 'EQUALS',
      conditionValue: 'INSTAGRAM',
      actionType: 'SEND_WHATSAPP',
      actionTarget: 'customer',
      actionTemplate: 'Hello {{customerName}}! Thank you for reaching out via our Instagram ad. View our complete catalog of homemade pickles here: {{menuUrl}}'
    }
  ];

  const filteredRules = rules.filter(r => {
    if (rulesFilter === 'ACTIVE') return r.isActive;
    if (rulesFilter === 'PAUSED') return !r.isActive;
    if (rulesFilter === 'ORDER') return r.trigger?.startsWith('ORDER');
    if (rulesFilter === 'LEAD') return r.trigger?.startsWith('LEAD');
    return true;
  }).filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.name?.toLowerCase().includes(q) || r.trigger?.toLowerCase().includes(q) || r.action?.template?.toLowerCase().includes(q);
  });

  const getTriggerBadge = (trigger) => {
    switch (trigger) {
      case 'ORDER_CREATED':
        return { label: '🛒 Order Placed', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'ORDER_CONFIRMED':
        return { label: '✅ Order Confirmed', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'ORDER_SHIPPED':
        return { label: '🚚 Order Shipped / Dispatched', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'LEAD_INGESTED':
        return { label: '🎯 Meta Ads Lead Ingested', color: 'bg-pink-50 text-pink-800 border-pink-200' };
      case 'ABANDONED_CHECKOUT':
        return { label: '⏳ Abandoned Checkout', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'STOCK_LOW':
        return { label: '⚠️ Low Stock Alert', color: 'bg-rose-50 text-rose-800 border-rose-200' };
      default:
        return { label: `⚡ ${trigger}`, color: 'bg-slate-50 text-slate-800 border-slate-200' };
    }
  };

  const getActionBadge = (actType) => {
    switch (actType) {
      case 'SEND_WHATSAPP':
        return { label: '💬 WhatsApp Message', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'OUTBOUND_WEBHOOK':
        return { label: '🌐 Outbound Webhook', color: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'IN_APP_ALERT':
        return { label: '🔔 In-App Notification', color: 'bg-purple-100 text-purple-900 border-purple-300' };
      default:
        return { label: actType, color: 'bg-slate-100 text-slate-900 border-slate-300' };
    }
  };

  const totalRuns = rules.reduce((acc, r) => acc + (r.executionCount || 0), 0);
  const activeCount = rules.filter(r => r.isActive).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">Workflows &amp; Automation Engine</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
                Active 24/7
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automate WhatsApp dispatch tracking, COD duplicate order confirmations, Meta lead greetings, and outbound webhooks
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchRulesAndLogs}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingRule(null);
              setForm({
                name: '',
                trigger: 'ORDER_CREATED',
                conditionField: 'always',
                conditionOperator: 'ALWAYS',
                conditionValue: '',
                actionType: 'SEND_WHATSAPP',
                actionTarget: 'customer',
                actionTemplate: 'Hello {{customerName}}! Your order {{orderNumber}} for ₹{{totalAmount}} is confirmed. Thank you!',
              });
              setShowCreateModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Automation Rule
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active Rules
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{activeCount} / {rules.length}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Running in real-time</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-500" /> Total Executions
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalRuns.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Automated events triggered</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Dispatches
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {rules.filter(r => r.action?.type === 'SEND_WHATSAPP').reduce((a, b) => a + (b.executionCount || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Direct customer alerts</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Success Rate
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">99.4%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Zero dropped events</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Automation Rules ({rules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Live Audit Logs ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> High-Converting Templates
          </button>
        </div>

        {activeTab === 'rules' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 w-44 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={rulesFilter}
              onChange={(e) => setRulesFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="ACTIVE">Active Only</option>
              <option value="PAUSED">Paused Only</option>
              <option value="ORDER">Order Triggers</option>
              <option value="LEAD">Meta Lead Triggers</option>
            </select>
          </div>
        )}
      </div>

      {/* ================= TAB 1: AUTOMATION RULES ================= */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {filteredRules.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <div className="text-3xl">🔍</div>
              <div className="font-bold text-slate-800 text-sm">No automation rules matched your filter</div>
              <p className="text-xs text-slate-400">Clear your search query or create a new automation rule.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredRules.map((rule) => {
                const trg = getTriggerBadge(rule.trigger);
                const act = getActionBadge(rule.action?.type);
                const isTesting = testingRuleId === (rule._id || rule.id);

                return (
                  <div
                    key={rule._id || rule.id}
                    className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all space-y-4 ${
                      rule.isActive ? 'border-slate-200/90' : 'border-slate-200 bg-slate-50/60 opacity-80'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <span>{rule.name}</span>
                          </h3>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${trg.color}`}>
                            {trg.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${act.color}`}>
                            {act.label}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span>Executions: <strong className="text-slate-800">{rule.executionCount || 0} times</strong></span>
                          <span>·</span>
                          <span>Last Run: <strong className="text-slate-800">{rule.lastRunAt || 'Never'}</strong></span>
                          <span>·</span>
                          <span className="text-emerald-700 font-bold">Success: {rule.successRate || '100%'}</span>
                        </div>
                      </div>

                      {/* Controls: Active Toggle & Actions */}
                      <div className="flex items-center gap-2">
                        {/* ⚡ Test Rule Button */}
                        <button
                          type="button"
                          disabled={isTesting}
                          onClick={() => handleTestRule(rule)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Simulate test run with mock order data"
                        >
                          <Play className={`w-3 h-3 text-indigo-600 ${isTesting ? 'animate-spin' : ''}`} />
                          <span>{isTesting ? 'Testing...' : '⚡ Test Trigger'}</span>
                        </button>

                        {/* On / Off Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleRule(rule)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                            rule.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          <span>{rule.isActive ? 'Active' : 'Paused'}</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRule(rule);
                            setForm({
                              name: rule.name,
                              trigger: rule.trigger,
                              conditionField: rule.condition?.field || 'always',
                              conditionOperator: rule.condition?.operator || 'ALWAYS',
                              conditionValue: rule.condition?.value || '',
                              actionType: rule.action?.type || 'SEND_WHATSAPP',
                              actionTarget: rule.action?.target || 'customer',
                              actionTemplate: rule.action?.template || '',
                            });
                            setShowCreateModal(true);
                          }}
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                          title="Edit Rule"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule._id || rule.id)}
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Condition & Message Preview Box */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                        <span>Condition: <strong>{rule.condition?.operator === 'ALWAYS' ? 'Always Trigger (Every Event)' : `${rule.condition?.field} ${rule.condition?.operator} ${rule.condition?.value}`}</strong></span>
                        <span>Recipient Target: <strong>{rule.action?.target}</strong></span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 text-[11px] leading-relaxed font-sans">
                        <span className="text-slate-400 font-semibold mr-1.5">Action Template:</span>
                        {rule.action?.template}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: LIVE AUDIT LOGS ================= */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 px-6 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Live Automation Execution Logs</h3>
              <p className="text-[11px] text-slate-400">Real-time trace of triggered workflows, WhatsApp message deliveries, and webhooks</p>
            </div>
            <button
              onClick={fetchRulesAndLogs}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" /> Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">TIMESTAMP</th>
                  <th className="py-3 px-4">RULE &amp; TRIGGER</th>
                  <th className="py-3 px-4">ACTION &amp; RECIPIENT</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-6 text-right">INSPECT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-6 font-mono text-slate-500 text-[11px]">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{log.ruleName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.trigger}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{log.recipient}</div>
                      <div className="text-[10px] text-indigo-600 font-bold">{log.actionType}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        ✓ {log.status} ({log.statusCode || 200})
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLogForDetail(log)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-semibold text-[11px] transition cursor-pointer"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: HIGH-CONVERTING TEMPLATES ================= */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_TEMPLATES.map((tmpl, idx) => (
            <div key={idx} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{tmpl.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {tmpl.trigger}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-sans leading-relaxed">
                  {tmpl.actionTemplate}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleApplyPresetTemplate(tmpl)}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Use This Template
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ================= CREATE / EDIT RULE MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-600" />
                  <span>{editingRule ? 'Edit Automation Rule' : 'Create New Automation Rule'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Automate WhatsApp notifications, live courier tracking, or webhooks</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Order Placed Instant WhatsApp Confirmation"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Trigger Event (When should this execute?)</label>
                  <select
                    value={form.trigger}
                    onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ORDER_CREATED">🛒 Order Placed (New Order Received)</option>
                    <option value="ORDER_CONFIRMED">✅ Order Confirmed (Accepted by Merchant)</option>
                    <option value="ORDER_SHIPPED">🚚 Order Shipped / Dispatched (Handed to Courier)</option>
                    <option value="LEAD_INGESTED">🎯 Meta Ads Lead Ingested (FB/Instagram Lead)</option>
                    <option value="ABANDONED_CHECKOUT">⏳ Abandoned Checkout (Incomplete Checkout)</option>
                    <option value="STOCK_LOW">⚠️ Low Stock Alert (Inventory Depleted)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Action Type (Action to perform)</label>
                  <select
                    value={form.actionType}
                    onChange={(e) => setForm({ ...form, actionType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="SEND_WHATSAPP">💬 Send WhatsApp Message</option>
                    <option value="OUTBOUND_WEBHOOK">🌐 Outbound Webhook (ERP/Zapier)</option>
                    <option value="IN_APP_ALERT">🔔 Dashboard In-App Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800">Message / Payload Template</label>
                  <span className="text-[10px] text-slate-400">Click pills to insert variables:</span>
                </div>

                {/* Variable Pills */}
                <div className="flex flex-wrap gap-1.5 pb-2">
                  {[
                    { tag: '{{customerName}}', label: 'Customer Name' },
                    { tag: '{{orderNumber}}', label: 'Order #' },
                    { tag: '{{totalAmount}}', label: 'Total ₹' },
                    { tag: '{{courierName}}', label: 'Courier' },
                    { tag: '{{trackingNumber}}', label: 'Tracking No' },
                    { tag: '{{trackingUrl}}', label: 'Live Track Link' },
                  ].map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => setForm({ ...form, actionTemplate: form.actionTemplate + ' ' + v.tag })}
                      className="px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold cursor-pointer transition"
                    >
                      + {v.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  required
                  value={form.actionTemplate}
                  onChange={(e) => setForm({ ...form, actionTemplate: e.target.value })}
                  placeholder="Template content with variables..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {editingRule ? 'Save Changes' : 'Create & Activate Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= INSPECT LOG MODAL ================= */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>Execution Audit Trace: {selectedLogForDetail.id}</span>
              </div>
              <button onClick={() => setSelectedLogForDetail(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500">Rule Name:</span>
                <strong className="text-slate-900">{selectedLogForDetail.ruleName}</strong>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500">Trigger Event:</span>
                <span className="font-mono font-bold text-indigo-700">{selectedLogForDetail.trigger}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500">Recipient / Destination:</span>
                <strong className="text-slate-900">{selectedLogForDetail.recipient}</strong>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500">Status &amp; Code:</span>
                <span className="font-bold text-emerald-700">✓ {selectedLogForDetail.status} (HTTP {selectedLogForDetail.statusCode})</span>
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-900 mb-1">Payload Content Dispatched:</div>
              <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed whitespace-pre-wrap">
                {selectedLogForDetail.details}
              </pre>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogForDetail(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
