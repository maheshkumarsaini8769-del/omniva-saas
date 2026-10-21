import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { 
  Share2, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Save, 
  Sparkles, 
  Lock, 
  Send, 
  Check,
  TrendingUp,
  HelpCircle,
  ShieldCheck,
  Zap,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const getAuthHeaders = () => {
  const token = localStorage.getItem('omniva_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const MetaTrackingSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    metaPixelId: '',
    capiTokenMasked: '',
    webhookUrl: '',
    verifyTokenConfigured: false,
    hasCapiToken: false,
  });
  const [metaPixelInput, setMetaPixelInput] = useState('');
  const [metaCapiInput, setMetaCapiInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testingCapi, setTestingCapi] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/meta/settings', { headers: getAuthHeaders() });
        if (res.data.success) {
          setSettings(res.data.settings);
          setMetaPixelInput(res.data.settings.metaPixelId || '');
          if (res.data.settings.metaPixelId || res.data.settings.hasCapiToken) {
            setIsConfirmed(true);
          }
        }
      } catch (err) {
        setLoadError(
          err.response?.data?.message || 'Unable to load Meta tracking settings from the server.'
        );
        setSettings({
          metaPixelId: '',
          capiTokenMasked: '',
          webhookUrl: '',
          verifyTokenConfigured: false,
          hasCapiToken: false,
        });
        setMetaPixelInput('');
        setIsConfirmed(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setStatusMessage('');
    setStatusError(false);
    try {
      const payload = { metaPixelId: metaPixelInput };
      if (metaCapiInput.trim()) {
        payload.metaCapiToken = metaCapiInput.trim();
      }
      const res = await axios.put('/api/meta/settings', payload, { headers: getAuthHeaders() });
      if (!res.data.success) {
        throw new Error(res.data.message || 'The server did not confirm the settings update.');
      }

      setSaveSuccess(true);
      setMetaCapiInput('');
      setIsConfirmed(true);
      setStatusMessage(res.data.message || 'Meta settings saved successfully.');

      if (res.data.settings) {
        setSettings((prev) => ({ ...prev, ...res.data.settings }));
      }

      // Refresh the masked token and webhook details from the server.
      try {
        const updated = await axios.get('/api/meta/settings', { headers: getAuthHeaders() });
        if (updated.data?.settings) setSettings(updated.data.settings);
      } catch {
        // The save response is authoritative; the optional refresh can fail.
      }
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setStatusError(true);
      setStatusMessage(
        err.response?.data?.message || err.message || 'Unable to save Meta settings.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTestCapi = async () => {
    setTestingCapi(true);
    setTestResult(null);
    setStatusMessage('');
    setStatusError(false);
    try {
      const res = await axios.post('/api/meta/test-capi', {
        eventName: 'Lead',
        testEmail: user?.email || '',
        value: 0,
      }, { headers: getAuthHeaders() });

      const result = res.data || {};
      setTestResult(result);

      if (!result.success) {
        setIsConfirmed(false);
        setStatusError(true);
        setStatusMessage(result.message || 'Meta rejected the test event.');
        return false;
      }

      setIsConfirmed(true);
      setStatusMessage(result.message || 'Test event accepted by Meta CAPI.');
      return true;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Unable to dispatch a test event to Meta.';
      setTestResult({ success: false, message });
      setIsConfirmed(false);
      setStatusError(true);
      setStatusMessage(message);
      return false;
    } finally {
      setTestingCapi(false);
    }
  };

  const handleVerifyConnection = async () => {
    setVerifying(true);
    setStatusMessage('');
    setStatusError(false);
    try {
      const ok = await handleTestCapi();
      if (ok) {
        setStatusMessage('Connection test accepted by Meta CAPI.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  if (loading) {
    return <div className="text-slate-500 text-xs py-8">Loading Meta tracking settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner: Clean Light Theme */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs text-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-blue-600 via-indigo-600 to-pink-500 rounded-2xl text-white shadow-md shadow-indigo-600/20">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex flex-wrap items-center gap-2">
              <span>Facebook &amp; Instagram Ads Control Center</span>
              {isConfirmed ? (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Setup Required
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sync Meta Lead Ads directly into CRM and fire server-side Conversions API (CAPI) events using hashed customer data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleVerifyConnection}
            disabled={verifying || testingCapi}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            {verifying ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            {verifying ? 'Verifying...' : 'Confirm Connection'}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs border ${
            statusError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {statusError ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Super Admin Managed Notice Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-3 shadow-xs">
        <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5 shadow-xs">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-xs">
          <div className="font-extrabold text-slate-900 flex items-center gap-2">
            <span>Meta CAPI &amp; Pixel Provisioned by Platform Super Admin</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Managed Mode
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Your Facebook Pixel ID, Conversions API Access Token, and lead webhook subscriptions are provisioned directly by your platform Super Admin. You do not need to generate or configure Graph API tokens.
          </p>
        </div>
      </div>

      {/* Step 1: Webhook Connection Guide Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[11px] flex items-center justify-center">1</span>
              <span>Meta Instant Form Webhook Endpoint</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Connect this URL to your Meta App/Page so Facebook & Instagram leads can flow into your CRM through the webhook.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Webhook Endpoint
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
                value={settings.webhookUrl || ''}
                placeholder="Webhook URL is not available"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(settings.webhookUrl)}
                disabled={!settings.webhookUrl}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Copy Webhook URL"
              >
                {copiedWebhook ? <Check className="w-4 h-4 text-emerald-600 font-bold" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Verify Token
            </label>
            <div className="flex items-center gap-2">
              <div className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {settings.verifyTokenConfigured
                    ? 'Managed securely by the platform administrator'
                    : 'Platform webhook verification is not configured yet'}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              This server secret is never exposed to the browser.
            </p>
          </div>
        </div>

        <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            Meta Webhook Instructions:
          </div>
          <p className="text-slate-600">
            In <strong>Facebook Developers</strong> &rarr; <strong>Webhooks</strong> &rarr; select <strong>Page</strong> &rarr; subscribe to <strong>leadgen</strong> &amp; <strong>messages</strong>. Use the Callback URL above. The platform administrator configures the matching Verify Token in the Meta app; it is never exposed to the browser.
          </p>
        </div>
      </div>

      {/* Step 2: Meta Pixel & Conversions API Settings Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[11px] flex items-center justify-center">2</span>
              <span>Meta Pixel & Conversions API (CAPI) Credentials</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enter your Facebook / Instagram Pixel ID and System User Access Token for server-side purchase tracking.
            </p>
          </div>
          {settings.hasCapiToken && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> CAPI Token Active
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Meta Pixel ID
            </label>
            <input
              type="text"
              value={metaPixelInput}
              onChange={(e) => setMetaPixelInput(e.target.value)}
              placeholder="e.g. 987654321098765 (15-16 digits)"
              className="block w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Found in Meta Events Manager &rarr; Data Sources &rarr; Settings &rarr; Pixel ID.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Conversions API (CAPI) System User Access Token
            </label>
            <div className="relative">
              <input
                type="password"
                value={metaCapiInput}
                onChange={(e) => setMetaCapiInput(e.target.value)}
                placeholder={settings.hasCapiToken ? `Configured (${settings.capiTokenMasked || '••••••••'}) — enter new token to update` : 'EAAB... (Paste System User Access Token)'}
                className="block w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Generated in Meta Events Manager &rarr; Conversions API &rarr; Set up manually &rarr; Generate access token.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Meta Settings'}
            </button>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Settings Saved
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Step 3: Live CAPI Dispatch Sandbox & Verification */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[11px] flex items-center justify-center">3</span>
              <span>Test & Confirm Live Event Dispatch</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Send a test lead/purchase event to confirm SHA-256 data hashing and Meta server response.
            </p>
          </div>
          <button
            type="button"
            onClick={handleTestCapi}
            disabled={testingCapi}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs border border-indigo-200 transition cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {testingCapi ? 'Sending Event...' : 'Fire Test Event to Meta'}
          </button>
        </div>

        {testResult && (
          <div
            className={`p-4 rounded-xl space-y-2 text-xs border ${
              testResult.success
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div
                className={`font-bold flex items-center gap-1.5 ${
                  testResult.success ? 'text-emerald-400' : 'text-rose-700'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                Connection Status: {testResult.success ? 'CONFIRMED' : 'FAILED'}
              </div>
              {testResult.result?.eventId && (
                <span
                  className={`font-mono text-[10px] ${
                    testResult.success ? 'text-slate-400' : 'text-rose-500'
                  }`}
                >
                  Event ID: {testResult.result.eventId}
                </span>
              )}
            </div>
            <div className={testResult.success ? 'text-slate-300 text-[11px]' : 'text-rose-700 text-[11px]'}>
              {testResult.message}
            </div>
            {testResult.result?.hashedPayload && (
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Meta SHA-256 Hashed Payload:</span>
                <pre className="p-2.5 rounded-lg bg-slate-50 text-slate-700 text-[10px] font-mono overflow-x-auto mt-1 border border-slate-200">
                  {JSON.stringify(testResult.result.hashedPayload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetaTrackingSettings;
