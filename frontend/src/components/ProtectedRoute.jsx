import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-xs font-mono text-slate-600">Loading workspace...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Super Admin has master authority to view any dashboard without restriction
  if (user?.role === 'SUPER_ADMIN') {
    return children;
  }

  // If a merchant visits /admin, redirect to their own workspace instead of looping.
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/merchant" replace />;
  }

  return children;
};
