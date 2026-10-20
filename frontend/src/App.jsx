import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';

import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { RegisterMerchant } from './pages/RegisterMerchant';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { MerchantDashboard } from './pages/MerchantDashboard';
import { PublicStorefront } from './pages/PublicStorefront';
import { OrderTracking } from './pages/OrderTracking';
import {
  ShieldCheck,
  ArrowRight,
  Store,
  Kanban,
  CheckCircle2,
  Truck,
  LayoutDashboard,
} from 'lucide-react';

const capabilities = [
  {
    icon: Store,
    label: 'Product commerce',
    title: 'Sell products end to end',
    description:
      'Catalog, inventory, coupons, checkout, and order management with server-authoritative pricing and stock.',
    points: [
      'Tenant-scoped catalog and inventory',
      'COD checkout with idempotent orders',
      'Courier dispatch with real tracking numbers',
    ],
    accent: 'indigo',
  },
  {
    icon: Kanban,
    label: 'Service & travel',
    title: 'Run bookings and schedules',
    description:
      'Manage service bookings, travel departures, customer details, and advance payments in one workspace.',
    points: [
      'Booking calendars and availability',
      'Advance and balance tracking',
      'Customer records scoped to your business',
    ],
    accent: 'amber',
  },
  {
    icon: ShieldCheck,
    label: 'Platform operations',
    title: 'Administer every tenant',
    description:
      'Provision merchants, assign plans and modules, review usage, and monitor integrations from a single console.',
    points: [
      'Merchant onboarding and suspension',
      'Plan limits and module access',
      'Integration health and audit visibility',
    ],
    accent: 'violet',
  },
];

const accentClasses = {
  indigo: {
    icon: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    badge: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    check: 'text-indigo-500',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    check: 'text-amber-500',
  },
  violet: {
    icon: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    badge: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    check: 'text-violet-500',
  },
};

function LandingPageContent() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 md:p-8 selection:bg-indigo-500 selection:text-white">
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-indigo-100/60 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl w-full space-y-8 relative z-10 my-auto">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4" />
            Omniva Multi-Business SaaS Platform
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            One platform for commerce, bookings, and operations.
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto">
            Tenant-isolated workspaces for product stores, service and travel bookings, CRM,
            marketing integrations, and platform administration.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to={isAuthenticated ? (user?.role === 'SUPER_ADMIN' ? '/admin' : '/merchant') : '/login'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              {isAuthenticated ? 'Open Dashboard' : 'Sign In'}
            </Link>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-200 shadow-sm transition"
              >
                Register your business
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link
              to="/orders/track"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-200 shadow-sm transition"
            >
              <Truck className="w-4 h-4 text-cyan-600" />
              Track an order
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {capabilities.map((capability) => {
            const Icon = capability.icon;
            const accent = accentClasses[capability.accent];
            return (
              <div
                key={capability.label}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 space-y-4 shadow-xl shadow-slate-200/50 transition flex flex-col"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className={`p-2.5 rounded-xl border ${accent.icon}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${accent.badge}`}
                    >
                      {capability.label}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{capability.title}</h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {capability.description}
                    </p>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5">
                    {capability.points.map((point) => (
                      <li key={point} className="flex items-start gap-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${accent.check}`} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Secure, tenant-isolated workspaces</div>
              <div className="text-slate-500">
                Role-based access and server-validated transactions.
              </div>
            </div>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-slate-600">
                Signed in as <strong className="text-slate-900">{user?.name}</strong>
              </span>
              <button
                onClick={logout}
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-semibold transition"
              >
                Log Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              Merchant and staff login
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  return <LandingPageContent />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterMerchant />} />

          {/* Public Storefront & Customer Journey */}
          <Route path="/store/:slug" element={<PublicStorefront />} />
          <Route path="/orders/track" element={<OrderTracking />} />

          {/* Super Admin Protected Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Merchant Protected Routes - Dedicated Page for Every Sidebar Module */}
          <Route path="/merchant" element={<Navigate to="/merchant/overview" replace />} />
          <Route
            path="/merchant/:pageId"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MERCHANT_OWNER', 'ORDER_MANAGER', 'INVENTORY_STAFF', 'MARKETING_STAFF', 'SUPPORT_STAFF']}>
                <MerchantDashboard />
              </ProtectedRoute>
            }
          />

          {/* Direct Standalone Shortcuts to Dedicated Module Pages */}
          <Route path="/overview" element={<Navigate to="/merchant/overview" replace />} />
          <Route path="/orders" element={<Navigate to="/merchant/orders" replace />} />
          <Route path="/products" element={<Navigate to="/merchant/products" replace />} />
          <Route path="/categories" element={<Navigate to="/merchant/categories" replace />} />
          <Route path="/storefront" element={<Navigate to="/merchant/customer-view" replace />} />
          <Route path="/customer-view" element={<Navigate to="/merchant/customer-view" replace />} />
          <Route path="/leads" element={<Navigate to="/merchant/leads" replace />} />
          <Route path="/customers" element={<Navigate to="/merchant/customers" replace />} />
          <Route path="/marketing" element={<Navigate to="/merchant/marketing" replace />} />
          <Route path="/automations" element={<Navigate to="/merchant/automations" replace />} />
          <Route path="/staff" element={<Navigate to="/merchant/staff" replace />} />
          <Route path="/integrations" element={<Navigate to="/merchant/integrations" replace />} />
          <Route path="/reports" element={<Navigate to="/merchant/reports" replace />} />
          <Route path="/billing" element={<Navigate to="/merchant/billing" replace />} />
          <Route path="/settings" element={<Navigate to="/merchant/settings" replace />} />
          <Route path="/subscription" element={<Navigate to="/merchant/billing" replace />} />
          <Route path="/services" element={<Navigate to="/merchant/service-bookings" replace />} />
          <Route path="/shoots" element={<Navigate to="/merchant/service-bookings" replace />} />
          <Route path="/service-bookings" element={<Navigate to="/merchant/service-bookings" replace />} />
          <Route path="/travel" element={<Navigate to="/merchant/travel-bookings" replace />} />
          <Route path="/tours" element={<Navigate to="/merchant/travel-bookings" replace />} />
          <Route path="/safari" element={<Navigate to="/merchant/travel-bookings" replace />} />
          <Route path="/riding" element={<Navigate to="/merchant/travel-bookings" replace />} />
          <Route path="/travel-bookings" element={<Navigate to="/merchant/travel-bookings" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
