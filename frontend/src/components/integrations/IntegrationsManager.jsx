import React, { useState, useEffect, useMemo } from 'react';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Play,
  Check,
  CreditCard,
  Truck,
  MessageSquare,
  Globe,
  Radio,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Phone,
  MapPin,
  Copy,
  Code,
  Zap,
  Info
} from 'lucide-react';
import { MetaAdsIntegration } from '../marketing/MetaAdsIntegration';

export const IntegrationsManager = () => {
  const [activeSubTab, setActiveSubTab] = useState('meta'); // 'meta' | 'channels'
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null); // 'all' or section name
  const [testingKey, setTestingKey] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [showSecrets, setShowSecrets] = useState({});
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [testResults, setTestResults] = useState({});

  // Essential integrations state
  const [integrations, setIntegrations] = useState({
    meta: {
      enabled: true,
      pixelId: '',
      capiToken: '',
      testEventCode: '',
    },
    whatsapp: {
      enabled: true,
      senderPhone: '',
    },
    payment: {
      enabled: true,
      provider: 'Razorpay',
      keyId: '',
      keySecret: '',
    },
    courier: {
      enabled: true,
      provider: 'Delhivery',
      pickupPincode: '',
      apiKey: '',
    },
    webhooks: {
      enabled: true,
      url: '',
    },
  });

  // Reference for dirty state checking
  const [initialState, setInitialState] = useState(null);

  const showToast = (msg, isError = false) => {
    setToastMessage(msg);
    setToastError(isError);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const getToken = () => localStorage.getItem('omniva_token') || localStorage.getItem('token') || '';

  // Fetch real integrations from backend
  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch('/api/integrations', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.integrations) {
          setIntegrations(data.integrations);
          setInitialState(JSON.stringify(data.integrations));
          setLoadError('');
        } else {
          setLoadError(data.message || 'The server did not return integration settings.');
        }
      } else {
        setLoadError(`Unable to load integration settings (status ${res.status}).`);
      }
    } catch (err) {
      setLoadError(err.message || 'Unable to load integration settings from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  // Determine if there are unsaved changes
  const isDirty = useMemo(() => {
    if (!initialState) return false;
    return initialState !== JSON.stringify(integrations);
  }, [integrations, initialState]);

  // Count active channels
  const activeCount = useMemo(() => {
    let count = 0;
    if (integrations.meta.enabled && integrations.meta.pixelId) count++;
    if (integrations.whatsapp.enabled && integrations.whatsapp.senderPhone) count++;
    if (integrations.payment.enabled && integrations.payment.keyId) count++;
    if (integrations.courier.enabled && integrations.courier.pickupPincode) count++;
    if (integrations.webhooks.enabled && integrations.webhooks.url) count++;
    return count;
  }, [integrations]);

  // Save an individual section
  const handleSaveSection = async (sectionKey) => {
    try {
      setSavingKey(sectionKey);
      const token = getToken();
      const payload = {
        [sectionKey]: integrations[sectionKey],
      };

      const res = await fetch('/api/integrations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Save failed with status ${res.status}`);
      }
      if (data.integrations) {
        setIntegrations(data.integrations);
        setInitialState(JSON.stringify(data.integrations));
      }
      showToast(`${sectionKey.toUpperCase()} settings saved successfully.`);
    } catch (err) {
      showToast(err.message || 'Unable to save integration settings.', true);
    } finally {
      setSavingKey(null);
    }
  };

  // Master Save: Save all 5 channels in one single click
  const handleSaveAll = async () => {
    try {
      setSavingKey('all');
      const token = getToken();
      const res = await fetch('/api/integrations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(integrations),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Save failed with status ${res.status}`);
      }
      if (data.integrations) {
        setIntegrations(data.integrations);
        setInitialState(JSON.stringify(data.integrations));
      }
      showToast('All integration channels saved and synchronized.');
    } catch (err) {
      showToast(err.message || 'Unable to save integration settings.', true);
    } finally {
      setSavingKey(null);
    }
  };

  // Test individual service
  const handleTestSection = async (serviceType) => {
    try {
      setTestingKey(serviceType);
      const token = getToken();
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceType,
          payload: integrations[serviceType],
        }),
      });

      const data = await res.json().catch(() => ({}));
      const success = res.ok && data.success !== false;
      setTestResults((prev) => ({
        ...prev,
        [serviceType]: {
          success,
          message: data.message || (success ? 'Connection test successful.' : `Connection test failed (status ${res.status}).`),
          timestamp: data.timestamp || new Date().toLocaleTimeString(),
        },
      }));
      showToast(data.message || (success ? 'Connection test successful.' : 'Connection test failed.'), !success);
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [serviceType]: {
          success: false,
          message: err.message || 'Connection test failed.',
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
      showToast(err.message || 'Connection test failed.', true);
    } finally {
      setTestingKey(null);
    }
  };

  const toggleSecret = (field) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Sample Webhook JSON
  const sampleWebhookJson = JSON.stringify(
    {
      event: 'order.created',
      timestamp: new Date().toISOString(),
      orderId: 'ORD-94821',
      customer: {
        name: 'Aarav Sharma',
        phone: '+91 9876543210',
        city: 'Jaipur',
        pincode: '302020',
        address: '42 Malviya Nagar, Near Gaurav Tower',
      },
      items: [
        {
          name: 'Classic Linen Shirt',
          quantity: 2,
          price: 999,
          total: 1998,
        },
      ],
      totalAmount: 1998,
      paymentMethod: 'COD',
      status: 'CONFIRMED',
      source: 'Omniva Storefront',
    },
    null,
    2
  );

  const copySampleJson = () => {
    navigator.clipboard.writeText(sampleWebhookJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Clean WhatsApp phone number
  const cleanPhone = (integrations.whatsapp.senderPhone || '').replace(/\D/g, '').slice(-10);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
          {toastError ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {loadError && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Header Banner with Master Save & Health Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 text-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">Store Integrations &amp; Channels</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                {activeCount}/5 Configured
              </span>
              {isDirty && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold animate-pulse">
                  Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Only the 5 essential merchant channels required for full sales tracking, payments, logistics, and WhatsApp ordering.
            </p>
          </div>
        </div>

        {/* Master Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchIntegrations}
            title="Refresh current settings"
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            disabled={savingKey === 'all'}
            onClick={handleSaveAll}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isDirty
                ? 'bg-indigo-600 hover:bg-indigo-700 ring-2 ring-indigo-400 ring-offset-2'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingKey === 'all' ? 'Saving All...' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

      {/* Integration Mode Switcher: Meta Lead Ads vs Store Utility Channels */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('meta')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'meta'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Meta Ads &amp; Lead Management (OAuth &amp; Pages)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('channels')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'channels'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Store Channels &amp; Utilities (Pixel, WhatsApp, Payments)</span>
        </button>
      </div>

      {activeSubTab === 'meta' && (
        <MetaAdsIntegration />
      )}

      {activeSubTab === 'channels' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= 1. META PIXEL & CAPI ================= */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 hover:border-pink-300 transition flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-xl shrink-0">
                  📸
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-sm">Meta Pixel &amp; Instagram Ads</h3>
                    {integrations.meta.pixelId && integrations.meta.pixelId.length >= 10 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        Ready
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                        Pixel ID Needed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">Facebook &amp; Instagram conversion tracking via browser and server CAPI</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer" title="Enable / Disable Meta Pixel">
                <input
                  type="checkbox"
                  checked={integrations.meta.enabled}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      meta: { ...integrations.meta, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-800">Meta Pixel ID</label>
                  <a
                    href="https://adsmanager.facebook.com/events_manager2"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    Meta Events Manager <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="text"
                  maxLength={20}
                  placeholder="e.g. 987654321098765"
                  value={integrations.meta.pixelId}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      meta: { ...integrations.meta, pixelId: e.target.value.replace(/\D/g, '') },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-800">Conversions API (CAPI) Access Token</label>
                  <button
                    type="button"
                    onClick={() => toggleSecret('capiToken')}
                    className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[10px] cursor-pointer"
                  >
                    {showSecrets.capiToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showSecrets.capiToken ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showSecrets.capiToken ? 'text' : 'password'}
                  placeholder="EAAG... (Server-side tracking token)"
                  value={integrations.meta.capiToken}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      meta: { ...integrations.meta, capiToken: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Test Event Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TEST84920 (From Meta Events Manager 'Test Events' tab)"
                  value={integrations.meta.testEventCode}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      meta: { ...integrations.meta, testEventCode: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Inline Test Result Banner */}
              {testResults.meta && (
                <div className="p-2.5 rounded-xl bg-pink-50/80 border border-pink-200 text-[11px] text-pink-900 flex items-center justify-between">
                  <span>⚡ {testResults.meta.message}</span>
                  <span className="text-[10px] text-pink-600">{testResults.meta.timestamp}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              disabled={testingKey === 'meta'}
              onClick={() => handleTestSection('meta')}
              className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3 h-3 ${testingKey === 'meta' ? 'animate-spin' : ''}`} />
              <span>{testingKey === 'meta' ? 'Testing...' : 'Test Event Ping'}</span>
            </button>

            <button
              type="button"
              disabled={savingKey === 'meta'}
              onClick={() => handleSaveSection('meta')}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingKey === 'meta' ? 'Saving...' : 'Save Meta Settings'}</span>
            </button>
          </div>
        </div>

        {/* ================= 2. WHATSAPP BUSINESS ================= */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 hover:border-emerald-300 transition flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
                  💬
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-sm">WhatsApp Business Store Number</h3>
                    {cleanPhone.length === 10 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        Ready
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                        10 Digits Needed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">Receive customer orders and send dispatch updates</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer" title="Enable / Disable WhatsApp Orders">
                <input
                  type="checkbox"
                  checked={integrations.whatsapp.enabled}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      whatsapp: { ...integrations.whatsapp, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">WhatsApp Business Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">
                    +91
                  </span>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="9829012345 (10-digit mobile number)"
                    value={cleanPhone}
                    onChange={(e) => {
                      const num = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setIntegrations({
                        ...integrations,
                        whatsapp: { ...integrations.whatsapp, senderPhone: num },
                      });
                    }}
                    className="w-full pl-12 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Storefront visitors who click <strong>"Direct WhatsApp Order"</strong> send items and delivery address directly to this number.
                </p>
              </div>

              {/* Live Preview Box */}
              {cleanPhone.length === 10 && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📱</span>
                    <div>
                      <div className="font-bold">Active Storefront Number</div>
                      <div className="font-mono text-xs">+91 {cleanPhone}</div>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/91${cleanPhone}?text=Hello%20from%20Omniva%20Store%20Verification`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition flex items-center gap-1 shadow-xs"
                  >
                    Open Chat <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}

              {/* Inline Test Result Banner */}
              {testResults.whatsapp && (
                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between">
                  <span>⚡ {testResults.whatsapp.message}</span>
                  <span className="text-[10px] text-emerald-600">{testResults.whatsapp.timestamp}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              disabled={testingKey === 'whatsapp'}
              onClick={() => handleTestSection('whatsapp')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3 h-3 ${testingKey === 'whatsapp' ? 'animate-spin' : ''}`} />
              <span>{testingKey === 'whatsapp' ? 'Checking...' : 'Build Chat Link'}</span>
            </button>

            <button
              type="button"
              disabled={savingKey === 'whatsapp'}
              onClick={() => handleSaveSection('whatsapp')}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingKey === 'whatsapp' ? 'Saving...' : 'Save WhatsApp Number'}</span>
            </button>
          </div>
        </div>

        {/* ================= 3. RAZORPAY PAYMENT GATEWAY ================= */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 hover:border-blue-300 transition flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-xl shrink-0">
                  💳
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-sm">Razorpay UPI &amp; Cards Payment</h3>
                    {integrations.payment.keyId ? (
                      integrations.payment.keyId.startsWith('rzp_live_') ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Live Mode
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          Sandbox Test
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                        Not Set (COD Only)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">Accept UPI QR, Google Pay, PhonePe, and Credit/Debit Cards</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer" title="Enable / Disable Online Payments">
                <input
                  type="checkbox"
                  checked={integrations.payment.enabled}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      payment: { ...integrations.payment, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-800">Razorpay Key ID</label>
                  <a
                    href="https://dashboard.razorpay.com/app/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    Get API Keys <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="text"
                  placeholder="rzp_live_... or rzp_test_..."
                  value={integrations.payment.keyId}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      payment: { ...integrations.payment, keyId: e.target.value.trim() },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-800">Razorpay Key Secret</label>
                  <button
                    type="button"
                    onClick={() => toggleSecret('keySecret')}
                    className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[10px] cursor-pointer"
                  >
                    {showSecrets.keySecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showSecrets.keySecret ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showSecrets.keySecret ? 'text' : 'password'}
                  placeholder="••••••••••••••••"
                  value={integrations.payment.keySecret}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      payment: { ...integrations.payment, keySecret: e.target.value.trim() },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Inline Test Result Banner */}
              {testResults.payment && (
                <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-[11px] text-blue-900 flex items-center justify-between">
                  <span>⚡ {testResults.payment.message}</span>
                  <span className="text-[10px] text-blue-600">{testResults.payment.timestamp}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              disabled={testingKey === 'payment'}
              onClick={() => handleTestSection('payment')}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3 h-3 ${testingKey === 'payment' ? 'animate-spin' : ''}`} />
              <span>{testingKey === 'payment' ? 'Checking...' : 'Validate Key Format'}</span>
            </button>

            <button
              type="button"
              disabled={savingKey === 'payment'}
              onClick={() => handleSaveSection('payment')}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingKey === 'payment' ? 'Saving...' : 'Save Payment Keys'}</span>
            </button>
          </div>
        </div>

        {/* ================= 4. COURIER LOGISTICS ================= */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 hover:border-purple-300 transition flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-xl shrink-0">
                  🚚
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-sm">Courier &amp; Parcel Logistics</h3>
                    {integrations.courier.pickupPincode && integrations.courier.pickupPincode.length === 6 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        Pincode Set
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                        Pincode Missing
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">Generate AWB tracking numbers and parcel pickup requests</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer" title="Enable / Disable Courier Integrations">
                <input
                  type="checkbox"
                  checked={integrations.courier.enabled}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      courier: { ...integrations.courier, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Default Courier Partner</label>
                <select
                  value={integrations.courier.provider}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      courier: { ...integrations.courier, provider: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Delhivery">Delhivery Express</option>
                  <option value="BlueDart">BlueDart Air</option>
                  <option value="Shiprocket">Shiprocket Multi-Courier</option>
                  <option value="DTDC">DTDC Courier</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Warehouse / Store Pickup Pincode</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 302020 (6-digit Indian Pincode)"
                    value={integrations.courier.pickupPincode}
                    onChange={(e) =>
                      setIntegrations({
                        ...integrations,
                        courier: {
                          ...integrations.courier,
                          pickupPincode: e.target.value.replace(/\D/g, '').slice(0, 6),
                        },
                      })
                    }
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Couriers use this pickup pincode to calculate shipping rates and dispatch riders to your location.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Courier Account API Key (Optional)</label>
                <input
                  type="text"
                  placeholder="Optional custom courier key..."
                  value={integrations.courier.apiKey}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      courier: { ...integrations.courier, apiKey: e.target.value.trim() },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Inline Test Result Banner */}
              {testResults.courier && (
                <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200 text-[11px] text-purple-900 flex items-center justify-between">
                  <span>⚡ {testResults.courier.message}</span>
                  <span className="text-[10px] text-purple-600">{testResults.courier.timestamp}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              disabled={testingKey === 'courier'}
              onClick={() => handleTestSection('courier')}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3 h-3 ${testingKey === 'courier' ? 'animate-spin' : ''}`} />
              <span>{testingKey === 'courier' ? 'Checking...' : 'Validate Config'}</span>
            </button>

            <button
              type="button"
              disabled={savingKey === 'courier'}
              onClick={() => handleSaveSection('courier')}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingKey === 'courier' ? 'Saving...' : 'Save Logistics Setup'}</span>
            </button>
          </div>
        </div>

        {/* ================= 5. OUTBOUND WEBHOOK ================= */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 hover:border-indigo-300 transition">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xl shrink-0">
                🌐
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Outbound Webhook (Google Sheets / Zapier / ERP Sync)
                  </h3>
                  {integrations.webhooks.url ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      Endpoint Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                      Not Set
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Receive instant JSON notifications whenever orders are placed or status changes
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer" title="Enable / Disable Webhooks">
              <input
                type="checkbox"
                checked={integrations.webhooks.enabled}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    webhooks: { ...integrations.webhooks, enabled: e.target.checked },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-800">Destination Webhook URL</label>
                <button
                  type="button"
                  onClick={() => setShowJsonModal(true)}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Code className="w-3 h-3" /> View Sample JSON Payload
                </button>
              </div>
              <input
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/... or Google Apps Script URL"
                value={integrations.webhooks.url}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    webhooks: { ...integrations.webhooks, url: e.target.value.trim() },
                  })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Every new customer order will automatically be dispatched to this webhook endpoint as an HTTP POST request.
              </p>
            </div>

            {/* Inline Test Result Banner */}
            {testResults.webhooks && (
              <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-[11px] text-indigo-900 flex items-center justify-between">
                <span>⚡ {testResults.webhooks.message}</span>
                <span className="text-[10px] text-indigo-600">{testResults.webhooks.timestamp}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={testingKey === 'webhooks'}
              onClick={() => handleTestSection('webhooks')}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3 h-3 ${testingKey === 'webhooks' ? 'animate-spin' : ''}`} />
              <span>{testingKey === 'webhooks' ? 'Checking...' : 'Validate URL'}</span>
            </button>

            <button
              type="button"
              disabled={savingKey === 'webhooks'}
              onClick={() => handleSaveSection('webhooks')}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingKey === 'webhooks' ? 'Saving...' : 'Save Webhook URL'}</span>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Sample Webhook JSON Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Sample Outbound Webhook JSON</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              When a customer places an order, your webhook endpoint will receive an HTTP POST request containing this payload:
            </p>

            <div className="relative">
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-72">
                {sampleWebhookJson}
              </pre>
              <button
                type="button"
                onClick={copySampleJson}
                className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold border border-slate-700 transition flex items-center gap-1 cursor-pointer"
              >
                {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
