import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { 
  Crown, 
  Store, 
  ShoppingBag, 
  Truck, 
  ArrowRightLeft, 
  LogOut, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const PortalSwitcherBar = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [switching, setSwitching] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isMerchant = user?.role === 'MERCHANT_OWNER' || user?.role === 'ORDER_MANAGER' || user?.role === 'INVENTORY_STAFF';

  const currentPath = location.pathname;

  const handleSwitchToSuperAdmin = async () => {
    try {
      setSwitching(true);
      await login('superadmin@omniva.io', 'Admin@123');
      navigate('/admin');
    } catch (err) {
      console.error('Failed to switch to Super Admin:', err);
    } finally {
      setSwitching(false);
    }
  };

  const handleSwitchToMerchant = async () => {
    try {
      setSwitching(true);
      await login('rahul@desirasoi.com', 'Rahul@123');
      navigate('/merchant');
    } catch (err) {
      console.error('Failed to switch to Merchant:', err);
    } finally {
      setSwitching(false);
    }
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
          onClick={() => {
            if (!isSuperAdmin) {
              handleSwitchToSuperAdmin();
            } else {
              navigate('/admin');
            }
          }}
          disabled={switching}
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
          onClick={() => navigate('/merchant')}
          disabled={switching}
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
          onClick={() => navigate('/store/desi-rasoi-achar-1')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
            currentPath.startsWith('/store')
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
          }`}
          title="Customer Public Storefront (Pickles & Preserves)"
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

      {/* Right: Quick Role Switcher & Auth State */}
      <div className="flex items-center gap-2 shrink-0">
        {switching ? (
          <div className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 border border-indigo-200">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
            Switching session...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px]">
              <span className="text-slate-500">Current Role:</span>
              <span className="font-bold text-slate-900">
                {isSuperAdmin ? '👑 Platform Super Admin' : '🏢 Merchant Owner'}
              </span>
            </div>

            {isSuperAdmin ? (
              <button
                type="button"
                onClick={handleSwitchToMerchant}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1 text-[11px] cursor-pointer"
                title="Switch auth token to Merchant Owner (Rahul Sharma)"
              >
                <ArrowRightLeft className="w-3 h-3 text-amber-600" />
                <span>Switch to Merchant</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSwitchToSuperAdmin}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 flex items-center gap-1 text-[11px] cursor-pointer"
                title="Switch auth token to Super Admin (Platform Owner)"
              >
                <ArrowRightLeft className="w-3 h-3 text-indigo-600" />
                <span>Switch to Super Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              title="Logout current session"
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
