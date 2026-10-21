// frontend/src/components/marketing/MetaAdsIntegration.jsx
// Production-grade Meta Ads Lead Management integration component.
// Handles real OAuth, Connected Pages & Forms selection, Manual Sync, Disconnect/Reconnect, and Audit Logs.

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Power,
  Layers,
  FileText,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Info,
  Sliders,
  CheckSquare,
  Square
} from 'lucide-react';

const getAuthHeaders = () => {
  const token = localStorage.getItem('omniva_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const MetaAdsIntegration = ({ onLeadSynced }) => {
  const [loading, setLoading] = useState(true);
  const [integration, setIntegration] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [togglingPage, setTogglingPage] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [expandedPages, setExpandedPages] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Check URL query parameters for OAuth redirect results
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const metaConnected = params.get('metaConnected');
    const metaError = params.get('metaError');
    const pagesCount = params.get('pagesCount');

    if (metaConnected === 'true') {
      showToast(`🎉 Meta Account connected! ${pagesCount ? `${pagesCount} Facebook Page(s) authorized.` : ''}`);
      // Clean up URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (metaError) {
      setErrorBanner(decodeURIComponent(metaError));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch integration status from backend
  const fetchStatus = async () => {
    try {
      setLoading(true);
      setErrorBanner('');
      const res = await axios.get('/api/meta/integration', { headers: getAuthHeaders() });
      if (res.data?.success) {
        setIntegration(res.data);
        // Expand first page by default if pages exist
        if (res.data.pages && res.data.pages.length > 0) {
          setExpandedPages((prev) => ({
            ...prev,
            [res.data.pages[0].pageId]: true,
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to load Meta integration status:', err);
      setErrorBanner(err.response?.data?.message || 'Could not fetch Meta integration status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Initiate official Meta OAuth authorization
  const handleConnectMeta = async () => {
    try {
      setConnecting(true);
      setErrorBanner('');
      const res = await axios.get('/api/meta/oauth/url', { headers: getAuthHeaders() });
      if (res.data?.success && res.data.oauthUrl) {
        // Redirect user to official Facebook dialog
        window.location.href = res.data.oauthUrl;
      } else {
        setErrorBanner(res.data?.message || 'Failed to generate Meta OAuth URL');
      }
    } catch (err) {
      setErrorBanner(err.response?.data?.message || 'Error initiating Meta OAuth. Please check server configuration.');
    } finally {
      setConnecting(false);
    }
  };

  // Trigger manual lead sync / reconciliation across selected forms
  const handleManualSync = async () => {
    try {
      setSyncing(true);
      setErrorBanner('');
      const res = await axios.post('/api/meta/integration/sync', {}, { headers: getAuthHeaders() });
      if (res.data?.success) {
        showToast(`⚡ ${res.data.message || `Sync complete! Ingested ${res.data.importedCount} new lead(s).`}`);
        await fetchStatus();
        if (onLeadSynced) onLeadSynced();
      }
    } catch (err) {
      setErrorBanner(err.response?.data?.message || 'Failed to sync leads from Meta');
    } finally {
      setSyncing(false);
    }
  };

  // Toggle Page or Form selection
  const handleToggleSelection = async (pageId, formId = null, currentSelected = false) => {
    const key = formId ? `${pageId}_${formId}` : pageId;
    try {
      setTogglingPage(key);
      const newSelected = !currentSelected;

      // Optimistic UI update
      setIntegration((prev) => {
        if (!prev) return prev;
        const updatedPages = prev.pages.map((p) => {
          if (p.pageId !== pageId) return p;
          if (formId) {
            return {
              ...p,
              leadForms: (p.leadForms || []).map((f) => (f.formId === formId ? { ...f, isSelected: newSelected } : f)),
            };
          } else {
            return { ...p, isSelected: newSelected };
          }
        });
        return { ...prev, pages: updatedPages };
      });

      const payload = { pageId, isSelected: newSelected };
      if (formId) payload.formId = formId;

      await axios.patch('/api/meta/integration/pages', payload, { headers: getAuthHeaders() });
      showToast(formId ? 'Lead form preference updated' : (newSelected ? 'Page enabled for sync' : 'Page disabled from sync'));
    } catch (err) {
      console.error('Failed to update selection:', err);
      // Revert on error
      fetchStatus();
      setErrorBanner('Failed to update selection preferences');
    } finally {
      setTogglingPage(null);
    }
  };

  // Confirm disconnect
  const handleConfirmDisconnect = async () => {
    try {
      setDisconnecting(true);
      const res = await axios.post('/api/meta/integration/disconnect', {}, { headers: getAuthHeaders() });
      if (res.data?.success) {
        showToast('Meta account disconnected and webhooks unsubscribed');
        setShowDisconnectModal(false);
        await fetchStatus();
      }
    } catch (err) {
      setErrorBanner(err.response?.data?.message || 'Failed to disconnect Meta account');
    } finally {
      setDisconnecting(false);
    }
  };

  const togglePageAccordion = (pageId) => {
    setExpandedPages((prev) => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-10 text-center space-y-3 shadow-2xs">
        <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto" />
        <div className="text-sm font-bold text-slate-800">Loading Meta Ads Integration...</div>
        <p className="text-xs text-slate-500">Checking authenticated Facebook Pages &amp; Lead Webhooks...</p>
      </div>
    );
  }

  const isConnected = integration?.connected && integration?.status === 'CONNECTED';
  const isExpired = integration?.status === 'EXPIRED';
  const pages = integration?.pages || [];
  const syncLogs = integration?.syncLogs || [];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Error Alert Banner */}
      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Meta Integration Notice:</span>
              <p className="text-rose-700 leading-relaxed">{errorBanner}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorBanner('')}
            className="text-rose-500 hover:text-rose-800 font-bold text-xs cursor-pointer shrink-0"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Main Connection Status Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-black text-slate-900">Meta Ads Lead Management</h2>
                {isConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                  </span>
                ) : isExpired ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" /> Token Expired (Reconnect Required)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isConnected
                  ? `Authenticated as Meta User: ${integration.metaUserName || 'Merchant Owner'} (${pages.length} Pages Authorized)`
                  : 'Connect your Facebook Page & Instagram account to ingest leads into CRM through Meta webhooks.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isConnected ? (
              <>
                <button
                  type="button"
                  disabled={syncing}
                  onClick={handleManualSync}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Pull recent leads from all active forms"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing Leads...' : 'Sync Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConnectMeta}
                  disabled={connecting}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                  title="Refresh permissions or add more Facebook Pages"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${connecting ? 'animate-spin' : ''}`} />
                  <span>Reconnect</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDisconnectModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                  title="Disconnect Meta Account and revoke webhook subscriptions"
                >
                  <Power className="w-3.5 h-3.5 text-rose-600" />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectMeta}
                disabled={connecting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                <span>{connecting ? 'Redirecting to Meta...' : 'Connect Meta Account'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Summary Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Integration Status</span>
            <div className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>{isConnected ? 'Active & Streaming' : 'Ready to Connect'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Authorized Pages</span>
            <div className="text-sm font-extrabold text-slate-900 mt-1">
              {pages.length} Page{pages.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Imported Leads</span>
            <div className="text-sm font-extrabold text-indigo-600 mt-1">
              {integration?.totalLeadsImported || 0} Lead{integration?.totalLeadsImported === 1 ? '' : 's'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Last Sync Timestamp</span>
            <div className="text-xs font-bold text-slate-800 mt-1 truncate">
              {integration?.lastSyncAt
                ? new Date(integration.lastSyncAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Never synced'}
            </div>
          </div>
        </div>
      </div>

      {/* Connected Facebook Pages & Lead Forms Section */}
      {isConnected && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Authorized Facebook Pages &amp; Instant Forms</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle which Facebook Pages and specific lead forms should sync submissions into your CRM.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600">
              {pages.filter((p) => p.isSelected).length} of {pages.length} Pages Active
            </span>
          </div>

          {pages.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
              <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="font-bold text-slate-700">No Facebook Pages Found</div>
              <p>Your Meta account has no managed Facebook Pages or the permissions were not granted.</p>
              <button
                type="button"
                onClick={handleConnectMeta}
                className="mt-2 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Reconnect &amp; Grant Page Access
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => {
                const isExpanded = !!expandedPages[page.pageId];
                const selectedFormsCount = (page.leadForms || []).filter((f) => f.isSelected).length;

                return (
                  <div
                    key={page.pageId}
                    className="border border-slate-200 rounded-2xl overflow-hidden transition hover:border-slate-300"
                  >
                    {/* Page Header Strip */}
                    <div className="p-4 bg-slate-50/70 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {page.pictureUrl ? (
                          <img
                            src={page.pictureUrl}
                            alt={page.pageName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center">
                            {page.pageName ? page.pageName.charAt(0).toUpperCase() : 'P'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-xs">{page.pageName}</h4>
                            <span className="text-[10px] font-mono text-slate-400">ID: {page.pageId}</span>
                            {page.isSubscribed && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Webhook Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{page.category || 'Business Page'}</span>
                            <span>•</span>
                            <span className="font-semibold text-indigo-600">
                              {page.leadForms?.length || 0} Lead Form{page.leadForms?.length === 1 ? '' : 's'} ({selectedFormsCount} selected)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Page Enable Toggle */}
                        <label className="relative inline-flex items-center cursor-pointer" title="Enable/Disable Page Sync">
                          <input
                            type="checkbox"
                            checked={page.isSelected}
                            disabled={togglingPage === page.pageId}
                            onChange={() => handleToggleSelection(page.pageId, null, page.isSelected)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>

                        {/* Accordion Toggle */}
                        <button
                          type="button"
                          onClick={() => togglePageAccordion(page.pageId)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
                          title="View Lead Forms"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Lead Forms Sub-list */}
                    {isExpanded && (
                      <div className="p-4 bg-white border-t border-slate-100 space-y-2.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Instant Forms for {page.pageName}
                        </div>
                        {(!page.leadForms || page.leadForms.length === 0) ? (
                          <div className="text-xs text-slate-400 py-2">
                            No lead generation forms found on this Page. Create a Lead Form in Meta Ads Manager to capture leads.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {page.leadForms.map((form) => (
                              <div
                                key={form.formId}
                                className={`p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                                  form.isSelected
                                    ? 'bg-indigo-50/40 border-indigo-200'
                                    : 'bg-slate-50 border-slate-200 opacity-60'
                                }`}
                              >
                                <div className="space-y-0.5 min-w-0">
                                  <div className="text-xs font-bold text-slate-800 truncate" title={form.formName}>
                                    {form.formName}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                                    <span>ID: {form.formId}</span>
                                    <span>•</span>
                                    <span className="text-emerald-700 font-bold">{form.leadCount} leads</span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleToggleSelection(page.pageId, form.formId, form.isSelected)}
                                  disabled={togglingPage === `${page.pageId}_${form.formId}`}
                                  className="cursor-pointer text-slate-500 hover:text-indigo-600 shrink-0"
                                  title={form.isSelected ? 'Disable Form Sync' : 'Enable Form Sync'}
                                >
                                  {form.isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                                  ) : (
                                    <Square className="w-5 h-5 text-slate-400" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Webhook Configuration Information Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Real-Time Meta Webhook Configuration</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              When OAuth is connected, your Pages are automatically subscribed to this endpoint. You can also verify or register manually in Meta Developer Portal.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Listening
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Callback URL (Webhook URL)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={integration?.webhookInfo?.webhookUrl || `${window.location.origin}/api/webhooks/meta`}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(integration?.webhookInfo?.webhookUrl || `${window.location.origin}/api/webhooks/meta`)}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shrink-0 cursor-pointer"
                title="Copy Callback URL"
              >
                {copiedWebhook ? <Check className="w-4 h-4 text-emerald-600 font-bold" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Verify Token
            </label>
            <div className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Managed securely by the platform administrator</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              The platform webhook verify token is a server secret and is never sent to the browser.
            </p>
          </div>
        </div>
      </div>

      {/* Sync Audit Logs Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span>Integration Audit &amp; Sync History</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Recorded audit log of webhooks, manual imports, and connection changes.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">{syncLogs.length} Events Logged</span>
        </div>

        {syncLogs.length === 0 ? (
          <div className="text-xs text-slate-400 py-6 text-center">
            No sync logs recorded yet. Connect your Meta account or click "Sync Now" to start.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto text-xs">
            {syncLogs.map((log, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-500'
                        : log.status === 'WARNING'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  <div className="truncate">
                    <span className="font-bold text-slate-800">{log.message}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Disconnect Meta Account?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will unsubscribe your Facebook Pages from webhooks and remove access tokens from this server.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p>• Existing imported leads in your CRM will <strong>NOT</strong> be deleted.</p>
              <p>• New leads submitted on Facebook/Instagram will stop syncing until reconnected.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={disconnecting}
                onClick={handleConfirmDisconnect}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting...' : 'Yes, Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
