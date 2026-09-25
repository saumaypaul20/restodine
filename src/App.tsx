import React, { useState, useEffect } from 'react';
import { CustomerApp } from './features/customer/CustomerApp';
import { KitchenDisplay } from './features/kitchen/KitchenDisplay';
import { AdminLayout } from './features/admin/AdminLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { api, getAuthToken, setAuthToken, removeAuthToken } from './services/apiClient';
import { Restaurant, UserRole } from './types';
import {
  Smartphone,
  ChefHat,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Bell,
  Sparkles,
} from 'lucide-react';

type AppMode = 'CUSTOMER' | 'ADMIN' | 'KITCHEN' | 'LOGIN' | 'REGISTER';

export default function App() {
  const [mode, setMode] = useState<AppMode>('CUSTOMER');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [activeTableToken, setActiveTableToken] = useState('T4CR');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [resettingDemo, setResettingDemo] = useState(false);

  // Check auth session
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await api.getMe();
          setCurrentUser(res.user);
          setCurrentRestaurant(res.restaurant);
        } catch (e) {
          // Token expired or invalid
          removeAuthToken();
        }
      }
      setLoadingInitial(false);
    };
    checkAuth();
  }, []);

  const handleResetDemo = async () => {
    if (!confirm('Reset demo data for The Curry Room back to default?')) return;
    setResettingDemo(true);
    try {
      await api.resetDemoData();
      window.location.reload();
    } catch (e) {
      alert('Failed to reset demo data');
    } finally {
      setResettingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 flex flex-col">
      {/* Global Interface Switcher Bar for Evaluators & Multi-Actor Testing */}
      <header className="no-print bg-slate-950 text-white border-b border-slate-800 px-3 py-2 text-xs flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 font-bold text-amber-400 mr-2 shrink-0">
            <span className="text-base">🍛</span>
            <span className="hidden sm:inline">RestoDine</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setMode('CUSTOMER')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                mode === 'CUSTOMER'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer Mobile (Table 04)</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!getAuthToken()) {
                  try {
                    const session = await api.getKitchenStationToken(
                      currentRestaurant?.id || 'rest-curry-room-01'
                    );
                    if (session?.token) {
                      setAuthToken(session.token);
                      setCurrentUser(session.user);
                      setCurrentRestaurant(session.restaurant);
                    }
                  } catch {
                    // Fallback to station mode
                  }
                }
                setMode('KITCHEN');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                mode === 'KITCHEN'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kitchen Display (KDS)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentUser) {
                  setMode('ADMIN');
                } else {
                  setMode('LOGIN');
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                mode === 'ADMIN' || mode === 'LOGIN' || mode === 'REGISTER'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Staff / Admin Portal</span>
            </button>
          </div>
        </div>

        {/* Right Reset / Status */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            type="button"
            onClick={handleResetDemo}
            disabled={resettingDemo}
            className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 flex items-center gap-1 transition-colors"
            title="Reset tables, menu and orders to pristine demo state"
          >
            <RefreshCw className={`w-3 h-3 ${resettingDemo ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Reset Demo</span>
          </button>
        </div>
      </header>

      {/* Main Mode View */}
      <div className="flex-1 bg-slate-50">
        {mode === 'CUSTOMER' && (
          <CustomerApp
            slug="curry-room"
            tableToken={activeTableToken}
            onSwitchMode={(m) => setMode(m as AppMode)}
          />
        )}

        {mode === 'KITCHEN' && (
          <KitchenDisplay
            restaurantId={currentRestaurant?.id || 'rest-curry-room-01'}
            restaurantName={currentRestaurant?.name || 'The Curry Room'}
            onExit={() => setMode('ADMIN')}
          />
        )}

        {mode === 'LOGIN' && (
          <LoginPage
            onLoginSuccess={(user, restaurant) => {
              setCurrentUser(user);
              setCurrentRestaurant(restaurant);
              if (user.role === 'KITCHEN') {
                setMode('KITCHEN');
              } else {
                setMode('ADMIN');
              }
            }}
            onGoToRegister={() => setMode('REGISTER')}
            onGoToCustomer={() => setMode('CUSTOMER')}
          />
        )}

        {mode === 'REGISTER' && (
          <RegisterPage
            onRegisterSuccess={(user, restaurant) => {
              setCurrentUser(user);
              setCurrentRestaurant(restaurant);
              setMode('ADMIN');
            }}
            onGoToLogin={() => setMode('LOGIN')}
          />
        )}

        {mode === 'ADMIN' && currentUser && currentRestaurant && (
          <AdminLayout
            user={currentUser}
            restaurant={currentRestaurant}
            onLogout={() => {
              setCurrentUser(null);
              setMode('LOGIN');
            }}
            onOpenKitchen={() => setMode('KITCHEN')}
            onOpenCustomerView={(token) => {
              if (token) setActiveTableToken(token);
              setMode('CUSTOMER');
            }}
            onUpdateRestaurant={(updated) => setCurrentRestaurant(updated)}
          />
        )}

        {/* Fallback if in ADMIN mode but not authenticated */}
        {mode === 'ADMIN' && (!currentUser || !currentRestaurant) && (
          <LoginPage
            onLoginSuccess={(user, restaurant) => {
              setCurrentUser(user);
              setCurrentRestaurant(restaurant);
              setMode('ADMIN');
            }}
            onGoToRegister={() => setMode('REGISTER')}
            onGoToCustomer={() => setMode('CUSTOMER')}
          />
        )}
      </div>
    </div>
  );
}
