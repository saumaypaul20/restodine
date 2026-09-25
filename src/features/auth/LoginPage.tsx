import React, { useState } from 'react';
import { api, setAuthToken } from '../../services/apiClient';
import { Lock, Mail, ArrowRight, ShieldCheck, ChefHat, UserCheck, Users, Shield } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: any, restaurant: any) => void;
  onGoToRegister: () => void;
  onGoToCustomer: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onGoToRegister,
  onGoToCustomer,
}) => {
  const [email, setEmail] = useState('owner@curryroom.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.login({ email, password });
      setAuthToken(res.token);
      onLoginSuccess(res.user, res.restaurant);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPwd: string) => {
    setEmail(demoEmail);
    setPassword(demoPwd);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center text-2xl mx-auto shadow-2xs">
            🍛
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">RestoDine Staff Portal</h2>
          <p className="text-xs text-slate-500">Sign in with role-based credentials</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Quick Demo Access Bar */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-center">
            Instant Demo Account Autofill:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('owner@curryroom.com', 'admin123')}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-center gap-2 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <div>
                <div className="text-[11px] font-bold text-slate-900">Owner</div>
                <div className="text-[9px] text-slate-400">All features</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('manager@curryroom.com', 'manager123')}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-center gap-2 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
              <div>
                <div className="text-[11px] font-bold text-slate-900">Manager</div>
                <div className="text-[9px] text-slate-400">Menu & Tables</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('kitchen@curryroom.com', 'kitchen123')}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-center gap-2 transition-colors"
            >
              <ChefHat className="w-3.5 h-3.5 text-emerald-600" />
              <div>
                <div className="text-[11px] font-bold text-slate-900">Kitchen Chef</div>
                <div className="text-[9px] text-slate-400">KDS Station</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('waiter@curryroom.com', 'waiter123')}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-center gap-2 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <div>
                <div className="text-[11px] font-bold text-slate-900">Waiter</div>
                <div className="text-[9px] text-slate-400">Table calls</div>
              </div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Links */}
        <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onGoToRegister}
            className="text-slate-600 hover:text-slate-900 font-semibold"
          >
            New restaurant owner? <span className="text-indigo-600 font-bold">Register Restaurant</span>
          </button>

          <button
            type="button"
            onClick={onGoToCustomer}
            className="text-slate-400 hover:text-slate-600 font-medium text-[11px]"
          >
            Switch to Customer Table View
          </button>
        </div>
      </div>
    </div>
  );
};
