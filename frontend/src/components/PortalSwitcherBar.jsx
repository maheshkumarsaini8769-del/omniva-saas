import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { 
  Crown, 
  Store, 
  ShoppingBag, 
  Truck, 
  LogOut, 
  ExternalLink
} from 'lucide-react';

export const PortalSwitcherBar = () => {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isMerchant = Boolean(user) && !isSuperAdmin;

  const currentPath = location.pathname;

  // Navigate to a portal only when the current session is allowed to use it.
  // Never sign in with hardcoded demo credentials from the browser.
  const goToPortal = (target) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (target === 'admin') {
      navigate(isSuperAdmin ? '/admin' : '/merchant');
      return;
    }
    // Super Admin may inspect a merchant workspace; everyone authenticated goes to /merchant.
    navigate('/merchant');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-full bg-white border-b border-slate-200 text-slate-700 px-3 py-1.5 flex items-center justify-between gap-2 text-xs select-none z-50 sticky top-0 shadow-xs overflow-x-auto no-scrollbar">
      {/* Left: Portals navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1 hidden lg:inline">
          Portals:
        </span>

        {/* 1. Super Admin Link */}
        <button
          type="button"
          onClick={() => goToPortal('admin')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
            currentPath.startsWith('/admin')
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
          }`}
          title="Super Admin Master Controller"
        >
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          <span>Super Admin</span>
          {currentPath.startsWith('/admin') && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
          )}
        </button>

        {/* 2. Merchant Workspace Link */}
        <button
          type="button"
          onClick={() => goToPortal('merchant')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
            currentPath.startsWith('/merchant')
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
          }`}
          title="Merchant Operating Workspace"
        >
          <Store className="w-3.5 h-3.5 text-indigo-500" />
          <span>Merchant Workspace</span>
          {currentPath.startsWith('/merchant') && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
          )}
        </button>

        {/* 3. Customer Storefront Link */}
        <button
          type="button"
          onClick={() => {
            if (tenant?.slug) navigate(`/store/${tenant.slug}`);
          }}
          disabled={!tenant?.slug}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
            tenant?.slug ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
          } ${
            currentPath.startsWith('/store')
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
          }`}
          title={tenant?.slug ? 'Customer Public Storefront' : 'Storefront slug is not loaded'}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
          <span>Customer Storefront</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </button>

        {/* 4. Tracking Link */}
        <button
          type="button"
          onClick={() => navigate('/orders/track')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
            currentPath.startsWith('/orders/track')
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
          }`}
          title="Live Package & Order Tracking"
        >
          <Truck className="w-3.5 h-3.5 text-blue-600" />
          <span>Track Order</span>
        </button>
      </div>

      {/* Right: current role & session controls */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px]">
          <span className="text-slate-500">Current Role:</span>
          <span className="font-bold text-slate-900">
            {isSuperAdmin ? '👑 Platform Super Admin' : isMerchant ? '🏢 Merchant Workspace' : 'Guest'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title="Logout current session"
          className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
