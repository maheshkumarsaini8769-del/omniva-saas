import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Check, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight, 
  Users, 
  ShoppingBag, 
  Sparkles,
  DollarSign,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

const API_BASE = '/api/subscriptions';

export const BillingSettings = () => {
  const [usageData, setUsageData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [upgradeError, setUpgradeError] = useState('');

  const getToken = () => localStorage.getItem('omniva_token') || localStorage.getItem('token') || '';

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setFetchError('');
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const [usageRes, plansRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE}/usage`, { headers }).catch(() => null),
        fetch(`${API_BASE}/plans`, { headers }).catch(() => null),
        fetch(`${API_BASE}/analytics`, { headers }).catch(() => null),
      ]);

      const failedSections = [];

      if (usageRes && usageRes.ok) {
        const usageJson = await usageRes.json().catch(() => ({}));
        if (usageJson.success && usageJson.data) {
          setUsageData(usageJson.data);
        } else {
          setUsageData(null);
          failedSections.push('usage');
        }
      } else {
        setUsageData(null);
        failedSections.push('usage');
      }

      if (plansRes && plansRes.ok) {
        const plansJson = await plansRes.json().catch(() => ({}));
        if (plansJson.success && Array.isArray(plansJson.data) && plansJson.data.length > 0) {
          setPlans(plansJson.data);
        } else {
          setPlans([]);
          failedSections.push('plans');
        }
      } else {
        setPlans([]);
        failedSections.push('plans');
      }

      if (analyticsRes && analyticsRes.ok) {
        const analyticsJson = await analyticsRes.json().catch(() => ({}));
        if (analyticsJson.success && analyticsJson.data) {
          setAnalytics(analyticsJson.data);
        } else {
          setAnalytics(null);
          failedSections.push('analytics');
        }
      } else {
        setAnalytics(null);
        failedSections.push('analytics');
      }

      if (failedSections.length > 0) {
        setFetchError(
          `Unable to load ${failedSections.join(', ')} from the server. No placeholder values are shown.`
        );
      }
    } catch (err) {
      setUsageData(null);
      setPlans([]);
      setAnalytics(null);
      setFetchError(err.message || 'Unable to load billing data from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleUpgrade = async (tier) => {
    try {
      setUpgrading(true);
      setUpgradeSuccess('');
      setUpgradeError('');
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const res = await fetch(`${API_BASE}/upgrade`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ planTier: tier, billingCycle: 'MONTHLY' }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Plan change failed with status ${res.status}`);
      }

      setUpgradeSuccess(data.message || `Plan changed to ${tier}.`);
      fetchBillingData();
    } catch (err) {
      setUpgradeError(err.message || 'Unable to change plan.');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Loading billing & financial analytics...
      </div>
    );
  }

  const currentTier = usageData?.planTier || null;
  const usage = usageData?.usage || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">Subscription & Usage Limits</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase">
                {currentTier ? `${currentTier} Plan` : 'Plan unavailable'}
              </span>
              {usageData?.status && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  {usageData.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Renewal Date:{' '}
              {usageData?.currentPeriodEnd
                ? new Date(usageData.currentPeriodEnd).toLocaleDateString()
                : 'Not available'}{' '}
              • Billing Cycle: {usageData?.billingCycle || 'Not available'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchBillingData}
          className="self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Refresh Stats
        </button>
      </div>

      {upgradeSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          {upgradeSuccess}
        </div>
      )}

      {fetchError && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {fetchError}
        </div>
      )}

      {upgradeError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {upgradeError}
        </div>
      )}

      {/* Quota Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Orders Quota */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-indigo-400" /> Monthly Orders
            </span>
            <span className="font-mono text-slate-900 font-bold">
              {usage.orders?.used ?? '—'} / {usage.orders?.limit ?? '—'}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (usage.orders?.percentage || 0) > 90
                  ? 'bg-rose-500'
                  : (usage.orders?.percentage || 0) > 75
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${usage.orders?.percentage || 0}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {typeof usage.orders?.percentage === 'number'
                ? `${usage.orders.percentage}% Quota Consumed`
                : 'Usage unavailable'}
            </span>
            <span>
              {typeof usage.orders?.limit === 'number' && typeof usage.orders?.used === 'number'
                ? `${usage.orders.limit - usage.orders.used} Remaining`
                : '—'}
            </span>
          </div>
        </div>

        {/* Leads Quota */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" /> CRM & Meta Leads
            </span>
            <span className="font-mono text-slate-900 font-bold">
              {usage.leads?.used ?? '—'} / {usage.leads?.limit ?? '—'}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${usage.leads?.percentage || 0}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {typeof usage.leads?.percentage === 'number'
                ? `${usage.leads.percentage}% Quota Consumed`
                : 'Usage unavailable'}
            </span>
            <span>
              {typeof usage.leads?.limit === 'number' && typeof usage.leads?.used === 'number'
                ? `${usage.leads.limit - usage.leads.used} Remaining`
                : '—'}
            </span>
          </div>
        </div>

        {/* Staff Seats */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" /> Team Seats
            </span>
            <span className="font-mono text-slate-900 font-bold">
              {usage.staff?.used ?? '—'} / {usage.staff?.limit ?? '—'}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${usage.staff?.percentage || 20}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Active Team Members</span>
            <span>
              {typeof usage.staff?.limit === 'number' && typeof usage.staff?.used === 'number'
                ? `${usage.staff.limit - usage.staff.used} Seats Left`
                : 'Usage unavailable'}
            </span>
          </div>
        </div>
      </div>

      {/* Server-calculated Revenue & Order Metrics */}
      {analytics && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Revenue &amp; Order Metrics
              </h3>
              <p className="text-xs text-slate-500">
                Server-calculated gross revenue, COD vs prepaid split, AOV and cancellation rate. No profit margin is estimated.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
              Avg Order Value: ₹{analytics.aov}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Gross Sales</div>
              <div className="text-xl font-extrabold text-slate-900">₹{analytics.grossSales?.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{analytics.totalOrdersCount} Total Orders</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
              <div className="text-[11px] font-semibold text-emerald-400 uppercase">Net Realized Sales</div>
              <div className="text-xl font-extrabold text-emerald-400">₹{analytics.netSales?.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-500/80">Excl. Cancellations</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
              <div className="text-[11px] font-semibold text-cyan-400 uppercase">COD vs Prepaid</div>
              <div className="text-base font-bold text-slate-900">
                ₹{analytics.codSales?.toLocaleString()} <span className="text-xs font-normal text-slate-500">COD</span>
              </div>
              <div className="text-[10px] text-cyan-400">₹{analytics.onlineSales?.toLocaleString()} Prepaid</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
              <div className="text-[11px] font-semibold text-indigo-400 uppercase">Average Order Value</div>
              <div className="text-xl font-extrabold text-indigo-400">₹{analytics.aov?.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">
                {analytics.cancelledOrdersCount ?? 0} cancelled · {analytics.cancellationRate ?? 0}% cancellation rate
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans & Upgrade Matrix */}
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Plan Tiers & Upgrade Options</h3>
          <p className="text-xs text-slate-500">Choose the right tier to scale orders, staff seats, and automation workflows</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.length === 0 && (
            <div className="md:col-span-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              Plan information is not available from the server right now.
            </div>
          )}
          {plans.map((p) => {
            const isCurrent = p.tier === currentTier;
            return (
              <div
                key={p.tier}
                className={`bg-white border rounded-2xl p-6 space-y-5 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-indigo-500 shadow-xl shadow-indigo-500/10'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-base">{p.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Current Tier
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">₹{p.priceInr?.toLocaleString()}</span>
                    <span className="text-xs text-slate-500">/ month</span>
                  </div>

                  <p className="text-xs text-slate-500">
                    {p.maxMonthlyOrders?.toLocaleString()} orders • {p.maxMonthlyLeads?.toLocaleString()} leads • {p.maxStaffSeats} seats
                  </p>

                  <div className="h-px bg-slate-100 my-2"></div>

                  <ul className="space-y-2 text-xs text-slate-600">
                    {p.features?.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgrade(p.tier)}
                  disabled={isCurrent || upgrading}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                  }`}
                >
                  {isCurrent ? (
                    'Active Plan'
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Upgrade to {p.name}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
