import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';

import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('omniva_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [tenant, setTenant] = useState(() => {
    const saved = localStorage.getItem('omniva_tenant');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('omniva_token') || null);
  const [loading, setLoading] = useState(true);

  // Setup Axios interceptor
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setTenant(null);
    localStorage.removeItem('omniva_token');
    localStorage.removeItem('omniva_user');
    localStorage.removeItem('omniva_tenant');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  // Check current session on mount
  useEffect(() => {
    const checkMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          setTenant(res.data.tenant);
          localStorage.setItem('omniva_user', JSON.stringify(res.data.user));
          if (res.data.tenant) {
            localStorage.setItem('omniva_tenant', JSON.stringify(res.data.tenant));
          }
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkMe();
  }, [token, logout]);

  const login = useCallback(async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    if (res.data.success) {
      const { token, user, tenant } = res.data;
      setToken(token);
      setUser(user);
      setTenant(tenant);
      localStorage.setItem('omniva_token', token);
      localStorage.setItem('omniva_user', JSON.stringify(user));
      if (tenant) {
        localStorage.setItem('omniva_tenant', JSON.stringify(tenant));
      }
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  }, []);

  const registerMerchant = useCallback(async (formData) => {
    const res = await axios.post('/api/auth/register-merchant', formData);
    if (res.data.success) {
      const { token, user, tenant } = res.data;
      setToken(token);
      setUser(user);
      setTenant(tenant);
      localStorage.setItem('omniva_token', token);
      localStorage.setItem('omniva_user', JSON.stringify(user));
      if (tenant) {
        localStorage.setItem('omniva_tenant', JSON.stringify(tenant));
      }
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  }, []);

  const contextValue = useMemo(() => ({
    user,
    tenant,
    token,
    loading,
    login,
    registerMerchant,
    logout,
    isAuthenticated: !!token && !!user,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isMerchantOwner: user?.role === 'MERCHANT_OWNER',
    isStaff: ['ORDER_MANAGER', 'INVENTORY_STAFF', 'MARKETING_STAFF', 'SUPPORT_STAFF'].includes(user?.role),
  }), [user, tenant, token, loading, login, registerMerchant, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };

