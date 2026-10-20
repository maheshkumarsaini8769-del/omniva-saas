import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  BarChart3,
  Share2,
  Download,
  Phone,
  Eye,
  Zap,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  Sparkles,
  Smartphone,
  Calculator,
  Sliders,
  Target,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  DollarSign,
  PieChart,
  MessageSquare,
  HelpCircle,
  Play,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  CheckCheck,
  Filter,
  Search
} from 'lucide-react';
import { MetaTrackingSettings } from './MetaTrackingSettings';

export const MarketingAdsHub = ({
  ordersList = [],
  setSelectedOrderForDetail,
  tenantInfo = {},
}) => {
  const [activeSubTab, setActiveSubTab] = useState('meta-orders'); // 'meta-orders' | 'campaigns' | 'creative-studio' | 'utm-builder' | 'calculator' | 'meta-setup'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL_META');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedAttributionOrder, setSelectedAttributionOrder] = useState(null);

  // Creative Studio State
  const [adCreative, setAdCreative] = useState({
    format: 'INSTAGRAM_REEL', // 'INSTAGRAM_REEL' | 'FACEBOOK_FEED' | 'WHATSAPP_CHAT'
    headline: tenantInfo?.businessName
      ? `Discover ${tenantInfo.businessName}`
      : 'Discover Our Latest Collection',
    primaryText: 'Share your latest products, offers, and updates with your audience.',
    badgeText: 'WELCOME OFFER',
    couponCode: 'YOURCODE',
    ctaText: 'Shop Now',
    productName: 'Your Featured Product',
    productPrice: '',
    originalPrice: '',
  });

  // UTM Generator State
  const [utmForm, setUtmForm] = useState({
    baseUrl:
      typeof window !== 'undefined'
        ? tenantInfo?.slug
          ? `${window.location.origin}/store/${tenantInfo.slug}`
          : window.location.origin
        : '',
    source: 'instagram',
    medium: 'reels',
    campaign: 'campaign_name',
    content: 'creative_01',
  });
  const [generatedUtmUrl, setGeneratedUtmUrl] = useState('');
  const [copiedUtm, setCopiedUtm] = useState(false);

  // ROAS & Profit Simulator State
  const [calcBudget, setCalcBudget] = useState(25000); // ₹25,000 monthly spend
  const [calcAov, setCalcAov] = useState(1250); // ₹1,250 average order value
  const [calcCogsPct, setCalcCogsPct] = useState(35); // 35% product cost
  const [calcTargetRoas, setCalcTargetRoas] = useState(3.5); // 3.5x target ROAS

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const getToken = () => localStorage.getItem('omniva_token') || localStorage.getItem('token') || '';

  // Fetch live analytics from backend
  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      setAnalyticsError('');
      const token = getToken();
      const res = await fetch('/api/meta/analytics', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.message || `Unable to load Meta analytics (status ${res.status}).`);
      }
      setAnalyticsData(data.data);
    } catch (err) {
      setAnalyticsData(null);
      setAnalyticsError(err.message || 'Unable to load Meta analytics from the server.');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Update generated UTM URL
  useEffect(() => {
    const rawBaseUrl = utmForm.baseUrl.trim();
    if (!rawBaseUrl) {
      setGeneratedUtmUrl('');
      return;
    }
    try {
      const url = new URL(rawBaseUrl);
      if (utmForm.source) url.searchParams.set('utm_source', utmForm.source.trim());
      if (utmForm.medium) url.searchParams.set('utm_medium', utmForm.medium.trim());
      if (utmForm.campaign) url.searchParams.set('utm_campaign', utmForm.campaign.trim());
      if (utmForm.content) url.searchParams.set('utm_content', utmForm.content.trim());
      setGeneratedUtmUrl(url.toString());
    } catch {
      setGeneratedUtmUrl('');
    }
  }, [utmForm]);

  // Orders segmentation
  const metaInstaOrders = ordersList.filter(o => o.source === 'INSTAGRAM');
  const metaFbOrders = ordersList.filter(o => o.source === 'FACEBOOK');
  const metaWaOrders = ordersList.filter(o => o.source === 'WHATSAPP');
  const metaWebOrders = ordersList.filter(o => o.source === 'WEBSITE' || !['INSTAGRAM', 'FACEBOOK', 'WHATSAPP'].includes(o.source));
  const allMetaOrders = ordersList.filter(o => o.source === 'INSTAGRAM' || o.source === 'FACEBOOK');

  const metaInstaRev = metaInstaOrders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + (o.total || 0), 0);
  const metaFbRev = metaFbOrders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + (o.total || 0), 0);
  const metaWaRev = metaWaOrders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + (o.total || 0), 0);
  const metaWebRev = metaWebOrders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + (o.total || 0), 0);
  const totalRev = ordersList.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + (o.total || 0), 0);
  const totalMetaRev = metaInstaRev + metaFbRev;

  // Filtered orders feed
  const displayedOrders = ordersList.filter(o => {
    if (platformFilter === 'INSTAGRAM') return o.source === 'INSTAGRAM';
    if (platformFilter === 'FACEBOOK') return o.source === 'FACEBOOK';
    if (platformFilter === 'WHATSAPP') return o.source === 'WHATSAPP';
    if (platformFilter === 'ALL_META') return o.source === 'INSTAGRAM' || o.source === 'FACEBOOK';
    return true;
  }).filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.id && o.id.toLowerCase().includes(q)) ||
      (o.customer && o.customer.toLowerCase().includes(q)) ||
      (o.phone && o.phone.includes(q)) ||
      (o.campaign && o.campaign.toLowerCase().includes(q))
    );
  });

  // Simulator calculations
  const simRevenue = Math.round(calcBudget * calcTargetRoas);
  const simOrders = Math.round(simRevenue / (calcAov || 1));
  const simCpa = simOrders > 0 ? Math.round(calcBudget / simOrders) : 0;
  const simCogsAmount = Math.round(simRevenue * (calcCogsPct / 100));
  const simGrossProfit = simRevenue - simCogsAmount;
  const simNetProfit = simGrossProfit - calcBudget;
  const simBreakevenRoas = (100 / (100 - calcCogsPct)).toFixed(2);

  // Helper source badges
  const getSourceBadge = (source) => {
    switch (source) {
      case 'INSTAGRAM':
        return { label: 'Instagram', icon: '📸', color: 'bg-pink-50 text-pink-700 border-pink-200' };
      case 'FACEBOOK':
        return { label: 'Facebook', icon: '🔵', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'WHATSAPP':
        return { label: 'WhatsApp Direct', icon: '💬', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: 'Unattributed', icon: '🌐', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const handleExportCsv = () => {
    if (ordersList.length === 0) {
      alert('No orders available to export.');
      return;
    }
    const headers = ['Order Number', 'Date', 'Attributed Source', 'Campaign Name', 'Customer Name', 'Phone', 'Total Amount', 'Status'];
    const rows = ordersList.map(o => [
      `"${o.id || ''}"`,
      `"${o.displayDate || ''}"`,
      `"${o.source || 'UNATTRIBUTED'}"`,
      `"${o.campaign || ''}"`,
      `"${o.customer || ''}"`,
      `"${o.phone || ''}"`,
      `"${o.total || 0}"`,
      `"${o.status || 'NEW'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `meta_attribution_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Attribution orders report exported as CSV.');
  };

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

      {analyticsError && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{analyticsError}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20 shrink-0">
            <Share2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Meta Ads &amp; Attribution Command Center
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  analyticsData?.capiHealth?.configured
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-200 border-amber-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    analyticsData?.capiHealth?.configured ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
                {analyticsData
                  ? analyticsData.capiHealth?.configured
                    ? 'Pixel & CAPI Configured'
                    : 'Pixel & CAPI Not Configured'
                  : 'Setup Status Unavailable'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Review first-party Instagram, Facebook, and WhatsApp order attribution, campaign revenue,
              and CAPI configuration. Ad spend and impression data are only shown when a real source is connected.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchAnalytics}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
            Refresh Signals
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Attribution CSV
          </button>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-8 -bottom-12 opacity-10 pointer-events-none text-[180px] font-black select-none text-white">
          META
        </div>
      </div>

      {/* KPI Stats Cockpit */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Meta Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-pink-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-pink-600" /> Meta Ad Revenue
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
              Insta + FB
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{totalMetaRev.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-pink-700 font-bold mt-1 flex items-center justify-between">
            <span>ROAS: <strong>{analyticsData?.summary?.blendedRoas || 'Not available'}</strong></span>
            <span className="text-slate-400 font-normal">
              {ordersList.length > 0 ? Math.round((allMetaOrders.length / ordersList.length) * 100) : 0}% of store
            </span>
          </div>
        </div>

        {/* Metric 2: Attributed Meta Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-600" /> Attributed Orders
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Attributed
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {allMetaOrders.length} <span className="text-xs font-semibold text-slate-400">/ {ordersList.length} Total</span>
          </div>
          <div className="text-[11px] text-blue-700 font-bold mt-1">
            Reels: {metaInstaOrders.length} · Feed: {metaFbOrders.length}
          </div>
        </div>

        {/* Metric 3: Average Order Value (AOV) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-600" /> Meta-source AOV
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Attributed
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-950 mt-2">
            ₹{allMetaOrders.length > 0 ? Math.round(totalMetaRev / allMetaOrders.length).toLocaleString('en-IN') : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>
              {allMetaOrders.length > 0
                ? `Based on ${allMetaOrders.length} attributed Meta orders`
                : 'No attributed Meta orders yet'}
            </span>
          </div>
        </div>

        {/* Metric 4: Conversions API configuration state */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Meta CAPI Configuration
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                analyticsData?.capiHealth?.configured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {analyticsData?.capiHealth?.configured ? 'Configured' : 'Not configured'}
            </span>
          </div>
          <div
            className={`text-xl font-black mt-2 ${
              analyticsData?.capiHealth?.configured ? 'text-emerald-700' : 'text-slate-500'
            }`}
          >
            {analyticsData?.capiHealth?.configured ? 'Configured' : 'Not configured'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Event match quality is not reported by the Meta API here.
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('meta-orders')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'meta-orders'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-pink-300" />
            <span>🛍️ Meta Attributed Orders</span>
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-pink-100 text-pink-800">
              {allMetaOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('campaigns')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'campaigns'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>📊 Campaigns &amp; Funnel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('creative-studio')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'creative-studio'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>🎨 Ad Creative Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('utm-builder')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'utm-builder'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-blue-500" />
            <span>🔗 Smart UTM Builder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('calculator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'calculator'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>🧮 ROAS &amp; Profit Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('meta-setup')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'meta-setup'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-blue-500" />
            <span>⚡ Pixel &amp; CAPI Settings</span>
          </button>
        </div>
      </div>

      {/* ================= SUB-TAB 1: META ORDERS ATTRIBUTION ================= */}
      {activeSubTab === 'meta-orders' && (
        <div className="space-y-5">
          {/* Channel Share Distribution Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
              <span className="text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <span>Omni-Channel Customer Volume Share</span>
              </span>
              <span className="text-slate-500 font-normal">
                Meta Ads drives <strong>{ordersList.length > 0 ? Math.round((allMetaOrders.length / ordersList.length) * 100) : 0}%</strong> of attributed order volume
              </span>
            </div>

            {/* Segmented Color Bar */}
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${ordersList.length > 0 ? (metaInstaOrders.length / ordersList.length) * 100 : 0}%` }}
                className="bg-pink-500 h-full transition-all duration-500"
                title={`Instagram: ${metaInstaOrders.length} orders`}
              />
              <div
                style={{ width: `${ordersList.length > 0 ? (metaFbOrders.length / ordersList.length) * 100 : 0}%` }}
                className="bg-blue-600 h-full transition-all duration-500"
                title={`Facebook: ${metaFbOrders.length} orders`}
              />
              <div
                style={{ width: `${ordersList.length > 0 ? (metaWaOrders.length / ordersList.length) * 100 : 0}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`WhatsApp: ${metaWaOrders.length} orders`}
              />
              <div
                style={{ width: `${ordersList.length > 0 ? (metaWebOrders.length / ordersList.length) * 100 : 0}%` }}
                className="bg-indigo-400 h-full transition-all duration-500"
                title={`Website / Unattributed: ${metaWebOrders.length} orders`}
              />
            </div>

            {/* Badges Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-pink-500" />
                <span className="text-slate-700 font-semibold">📸 Instagram traffic:</span>
                <span className="font-bold text-pink-700">{metaInstaOrders.length} orders (₹{metaInstaRev.toLocaleString('en-IN')})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-slate-700 font-semibold">🔵 Facebook traffic:</span>
                <span className="font-bold text-blue-700">{metaFbOrders.length} orders (₹{metaFbRev.toLocaleString('en-IN')})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-700 font-semibold">💬 WhatsApp Direct:</span>
                <span className="font-bold text-emerald-700">{metaWaOrders.length} orders (₹{metaWaRev.toLocaleString('en-IN')})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-400" />
                <span className="text-slate-700 font-semibold">🌐 Website / Unattributed:</span>
                <span className="font-bold text-indigo-700">{metaWebOrders.length} orders (₹{metaWebRev.toLocaleString('en-IN')})</span>
              </div>
            </div>
          </div>

          {/* Filtering Controls Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'ALL_META', label: `⚡ All Meta Ads (${allMetaOrders.length})` },
                { key: 'INSTAGRAM', label: `📸 Instagram traffic (${metaInstaOrders.length})` },
                { key: 'FACEBOOK', label: `🔵 Facebook traffic (${metaFbOrders.length})` },
                { key: 'WHATSAPP', label: `💬 WhatsApp (${metaWaOrders.length})` },
                { key: 'ALL', label: `🛒 All Channels (${ordersList.length})` },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setPlatformFilter(btn.key)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-bold text-xs border ${
                    platformFilter === btn.key
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order #, customer, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 w-56 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Attributed Orders Feed Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 px-6 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <span>Attributed Orders Feed</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    First-party Attribution
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Orders with campaign source, click-to-call, and direct WhatsApp dispatch
                </p>
              </div>
              <div className="text-xs text-slate-500 font-semibold">
                Showing <strong>{displayedOrders.length}</strong> orders
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-5">ORDER ID / DATE</th>
                    <th className="py-3 px-4">AD SOURCE &amp; CAMPAIGN</th>
                    <th className="py-3 px-4">CUSTOMER &amp; MOBILE</th>
                    <th className="py-3 px-4">ITEMS ORDERED</th>
                    <th className="py-3 px-4">AMOUNT</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-5 text-right">INSPECT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                        <div className="text-3xl">🔍</div>
                        <div className="font-bold text-slate-700 text-sm">No attributed orders matched your criteria</div>
                        <p className="text-xs text-slate-400">Try changing the channel filter or search keyword.</p>
                      </td>
                    </tr>
                  ) : (
                    displayedOrders.map((ord) => {
                      const badge = getSourceBadge(ord.source);
                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-5">
                            <div className="font-mono font-bold text-indigo-700 text-xs">
                              {ord.id}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {ord.displayDate || 'Just now'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                                <span>{badge.icon}</span>
                                <span>{badge.label}</span>
                              </span>
                              <div className="text-[10px] text-slate-600 font-semibold truncate max-w-[200px]" title={ord.campaign || 'No campaign recorded'}>
                                🎯 {ord.campaign || ord.channelName || 'No campaign recorded'}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-xs">
                              {ord.customer || 'Store Customer'}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {ord.phone && (
                                <>
                                  <a
                                    href={`tel:${ord.phone}`}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold hover:bg-emerald-100 transition shadow-2xs"
                                    title="Call Customer Directly"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>{ord.phone}</span>
                                  </a>
                                  <a
                                    href={`https://wa.me/${ord.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition shadow-2xs"
                                    title="Open WhatsApp Chat"
                                  >
                                    <span>WhatsApp ↗</span>
                                  </a>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {ord.itemSummary || 'No line items'}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-black text-slate-900 text-xs">
                              ₹{(ord.total || 0).toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                              {ord.pay || ord.paymentMethod || 'Not recorded'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                              {ord.statusLabel || ord.status || 'NEW'}
                            </span>
                          </td>

                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedAttributionOrder(ord)}
                                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition cursor-pointer"
                                title="Inspect UTM Attribution Trace"
                              >
                                Attribution
                              </button>
                              {setSelectedOrderForDetail && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForDetail(ord)}
                                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> Order
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: CAMPAIGN PERFORMANCE & FUNNEL ================= */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-6">
          {/* First-party attribution coverage */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Attribution Coverage</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Counts and revenue below come from first-party orders and leads attributed to each channel.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {[
                { key: 'instagram', label: 'Instagram' },
                { key: 'facebook', label: 'Facebook' },
                { key: 'whatsapp', label: 'WhatsApp' },
                { key: 'direct', label: 'Direct / Organic' },
              ].map(({ key, label }) => {
                const channel = analyticsData?.channels?.[key] || { count: 0, revenue: 0 };
                return (
                  <div key={key} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <div className="font-semibold text-slate-600">{label}</div>
                    <div className="text-lg font-black text-slate-900">
                      {channel.count?.toLocaleString('en-IN') || 0}
                      <span className="text-[10px] font-semibold text-slate-400"> orders/leads</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      ₹{(channel.revenue || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
              Impression, click, cart, and ad-spend metrics are not shown because no Meta Ads Insights
              data source is connected. ROAS and CPA stay unavailable until real spend is imported.
            </div>
          </div>

          {/* Campaign Performance Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 px-6 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Attributed Campaign Breakdown</h3>
                <p className="text-[11px] text-slate-400">First-party order revenue by campaign. Spend and ROAS require a connected Ads Insights source.</p>
              </div>
              <span className="text-xs font-bold text-slate-600 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl">
                Ad spend: Not synced
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-6">CAMPAIGN NAME</th>
                    <th className="py-3 px-4">PLATFORM</th>
                    <th className="py-3 px-4">AD SPEND</th>
                    <th className="py-3 px-4">LEADS</th>
                    <th className="py-3 px-4">ATTRIBUTED ORDERS</th>
                    <th className="py-3 px-4">ATTRIBUTED REVENUE</th>
                    <th className="py-3 px-4">EST. CPA</th>
                    <th className="py-3 px-6 text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(analyticsData?.campaigns || []).map((cmp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        {cmp.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-700 border-slate-200">
                          {cmp.platform || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">
                        {typeof cmp.spend === 'number'
                          ? `₹${cmp.spend.toLocaleString('en-IN')}`
                          : 'Not synced'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {cmp.leads || 0}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {cmp.orders || 0}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        ₹{(cmp.revenue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        {cmp.cpa || '—'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="font-black text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl">
                          {cmp.roas || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!analyticsData?.campaigns || analyticsData.campaigns.length === 0) && (
                    <tr>
                      <td colSpan={8} className="py-8 px-6 text-center text-slate-500">
                        No attributed campaign data yet. Campaigns appear after orders or leads carry a UTM campaign.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 3: 1-CLICK AD CREATIVE STUDIO ================= */}
      {activeSubTab === 'creative-studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Ad Copy & Configurator */}
          <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Ad Creative Studio &amp; Copy Builder</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Design high-converting Instagram Reel and Facebook Feed ad creatives with instant preview
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Ad Placement Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'INSTAGRAM_REEL', label: '📸 Instagram Reel / Story' },
                    { id: 'FACEBOOK_FEED', label: '🔵 Facebook Feed Card' },
                    { id: 'WHATSAPP_CHAT', label: '💬 WhatsApp Click Ad' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setAdCreative({ ...adCreative, format: fmt.id })}
                      className={`p-2 rounded-xl text-center font-bold text-xs border transition cursor-pointer ${
                        adCreative.format === fmt.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Headline Hook</label>
                <input
                  type="text"
                  value={adCreative.headline}
                  onChange={(e) => setAdCreative({ ...adCreative, headline: e.target.value })}
                  placeholder="Catchy headline..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Primary Ad Copy / Story Text</label>
                <textarea
                  rows={3}
                  value={adCreative.primaryText}
                  onChange={(e) => setAdCreative({ ...adCreative, primaryText: e.target.value })}
                  placeholder="Primary ad copy..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Discount Tag</label>
                  <input
                    type="text"
                    value={adCreative.badgeText}
                    onChange={(e) => setAdCreative({ ...adCreative, badgeText: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={adCreative.couponCode}
                    onChange={(e) => setAdCreative({ ...adCreative, couponCode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Call-To-Action (CTA)</label>
                  <select
                    value={adCreative.ctaText}
                    onChange={(e) => setAdCreative({ ...adCreative, ctaText: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Shop Now">Shop Now</option>
                    <option value="Order on WhatsApp">Order on WhatsApp</option>
                    <option value="Claim 15% Discount">Claim 15% Discount</option>
                    <option value="Order Cash On Delivery">Order Cash On Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Featured Offer Price</label>
                  <input
                    type="text"
                    value={adCreative.productPrice}
                    onChange={(e) => setAdCreative({ ...adCreative, productPrice: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `${adCreative.headline}\n\n${adCreative.primaryText}\n\nUse Code: ${adCreative.couponCode}\nOrder here: ${generatedUtmUrl}`;
                    navigator.clipboard.writeText(text);
                    showToast('Ad copy & link copied to clipboard!');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Ad Creative Text
                </button>
                <a
                  href="https://adsmanager.facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Meta Ads Manager
                </a>
              </div>
            </div>
          </div>

          {/* Right: Ad Preview Phone Canvas */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-100/80 rounded-3xl p-6 border border-slate-200">
            <div className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-slate-700" />
              <span>Social Ad Preview ({adCreative.format === 'INSTAGRAM_REEL' ? 'Instagram Reel' : 'Facebook Feed'})</span>
            </div>

            {/* Mobile Device Frame */}
            <div className="w-[310px] bg-slate-950 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 relative">
              {/* Notch */}
              <div className="w-28 h-4 bg-slate-900 rounded-full mx-auto mb-2" />

              {/* Screen Content */}
              <div className="bg-slate-900 rounded-[30px] overflow-hidden text-white relative min-h-[460px] flex flex-col justify-between p-4">
                {/* Header Profile Bar */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                      D
                    </div>
                    <div>
                      <div className="text-xs font-extrabold flex items-center gap-1">
                        <span>{tenantInfo?.slug || tenantInfo?.businessName || 'Your storefront'}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-semibold">Ad preview</div>
                    </div>
                  </div>
                  <button className="text-slate-400 text-sm">•••</button>
                </div>

                {/* Center Creative Content */}
                <div className="my-auto py-4 space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/60 p-3 text-center space-y-2">
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wide shadow-sm">
                      {adCreative.badgeText}
                    </div>
                    <ShoppingBag className="w-12 h-12 mx-auto my-3 text-slate-500" />
                    <div className="font-extrabold text-sm text-white leading-snug">
                      {adCreative.productName}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <span className="text-emerald-400 font-black text-base">{adCreative.productPrice}</span>
                      <span className="text-slate-400 line-through text-[11px]">{adCreative.originalPrice}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Overlay & CTA Button */}
                <div className="space-y-2.5 z-10 pt-2">
                  <div className="text-xs font-bold text-white line-clamp-1">
                    {adCreative.headline}
                  </div>
                  <div className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {adCreative.primaryText}
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5 transition"
                    >
                      <span>{adCreative.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 4: SMART UTM GENERATOR ================= */}
      {activeSubTab === 'utm-builder' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Smart UTM Tracking URL Builder</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Create tagged links for your Instagram bio, WhatsApp messages, influencer promos, and Facebook Ads with campaign-level sales attribution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Destination Webpage URL</label>
              <input
                type="text"
                value={utmForm.baseUrl}
                onChange={(e) => setUtmForm({ ...utmForm, baseUrl: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Campaign Source (utm_source)</label>
              <select
                value={utmForm.source}
                onChange={(e) => setUtmForm({ ...utmForm, source: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="instagram">Instagram (Reels, Bio, Stories)</option>
                <option value="facebook">Facebook (Feed, Carousel)</option>
                <option value="whatsapp">WhatsApp (Catalog, Status, Broadcast)</option>
                <option value="influencer">Influencer Collaboration</option>
                <option value="google">Google Ads</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Marketing Medium (utm_medium)</label>
              <input
                type="text"
                value={utmForm.medium}
                onChange={(e) => setUtmForm({ ...utmForm, medium: e.target.value })}
                placeholder="e.g. reels, story, bio_link, broadcast"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Campaign Name (utm_campaign)</label>
              <input
                type="text"
                value={utmForm.campaign}
                onChange={(e) => setUtmForm({ ...utmForm, campaign: e.target.value })}
                placeholder="e.g. diwali_sale_2026, welcome_offer"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Generated URL Result Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ready-To-Use Tracked Destination URL</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedUtmUrl);
                  setCopiedUtm(true);
                  showToast('Tracked UTM Link copied to clipboard!');
                  setTimeout(() => setCopiedUtm(false), 3000);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedUtm ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUtm ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs break-all select-all">
              {generatedUtmUrl}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>💡 Paste this link into your Instagram Bio or Meta Ad Manager URL field to capture campaign attribution.</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 5: ROAS & BREAKEVEN PROFIT CALCULATOR ================= */}
      {activeSubTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Sliders */}
          <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">ROAS &amp; Profit Simulator</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manual what-if calculator. These projections use the sliders below, not your live account data.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>Monthly Ad Budget</span>
                  <span className="text-indigo-700 font-black">₹{calcBudget.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={200000}
                  step={5000}
                  value={calcBudget}
                  onChange={(e) => setCalcBudget(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>Average Order Value (AOV)</span>
                  <span className="text-slate-900 font-black">₹{calcAov.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min={300}
                  max={3000}
                  step={50}
                  value={calcAov}
                  onChange={(e) => setCalcAov(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>Target ROAS Multiplier</span>
                  <span className="text-emerald-700 font-black">{calcTargetRoas.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={1.5}
                  max={6.0}
                  step={0.1}
                  value={calcTargetRoas}
                  onChange={(e) => setCalcTargetRoas(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>Product Cost / COGS</span>
                  <span className="text-rose-600 font-black">{calcCogsPct}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  step={5}
                  value={calcCogsPct}
                  onChange={(e) => setCalcCogsPct(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Results Display Card */}
          <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col justify-between space-y-5">
            <div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
                Projected Monthly Financials
              </div>
              <div className="text-3xl font-black text-white">
                ₹{simRevenue.toLocaleString('en-IN')}
                <span className="text-xs font-normal text-slate-400 ml-2">Estimated Sales</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-slate-400 text-[11px]">Orders Generated</div>
                <div className="text-xl font-black text-white mt-0.5">{simOrders} Orders</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-slate-400 text-[11px]">Est. Cost Per Order (CPA)</div>
                <div className="text-xl font-black text-indigo-400 mt-0.5">₹{simCpa}</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-slate-400 text-[11px]">Contribution After Ad Spend &amp; COGS</div>
                <div className={`text-xl font-black mt-0.5 ${simNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ₹{simNetProfit.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-slate-400 text-[11px]">Breakeven ROAS Needed</div>
                <div className="text-xl font-black text-amber-400 mt-0.5">{simBreakevenRoas}x</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed">
              💡 At an average order value of ₹{calcAov}, achieving {calcTargetRoas.toFixed(1)}x ROAS projects approximately <strong>{simOrders} orders</strong> every month.
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              This is a user-input projection, not a guarantee. Contribution excludes shipping, payment fees, returns, and taxes.
            </p>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 6: META PIXEL & CAPI SETTINGS ================= */}
      {activeSubTab === 'meta-setup' && (
        <MetaTrackingSettings />
      )}

      {/* ================= INSPECT ATTRIBUTION MODAL ================= */}
      {selectedAttributionOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <span>Attribution Details: {selectedAttributionOrder.id}</span>
              </div>
              <button onClick={() => setSelectedAttributionOrder(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500">Attributed Source:</span>
                <strong className="text-slate-900">{selectedAttributionOrder.source || 'Not recorded'}</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500">Campaign Tag:</span>
                <span className="font-mono font-bold text-indigo-700">{selectedAttributionOrder.campaign || 'No campaign recorded'}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500">Customer Phone:</span>
                <strong className="text-emerald-700">{selectedAttributionOrder.phone || 'N/A'}</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500">Order Amount:</span>
                <strong className="text-slate-900">₹{(selectedAttributionOrder.total || 0).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAttributionOrder(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
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
