import React, { useState } from 'react';
import { Restaurant, UserRole } from '../../types';
import { removeAuthToken } from '../../services/apiClient';
import { DashboardOverview } from './DashboardOverview';
import { OrdersManagement } from './OrdersManagement';
import { TableManagement } from './TableManagement';
import { MenuManagement } from './MenuManagement';
import { StaffManagement } from './StaffManagement';
import { BillsManagement } from './BillsManagement';
import { AnalyticsView } from './AnalyticsView';
import { RestaurantSettingsView } from './RestaurantSettingsView';
import { OnboardingWizard } from './OnboardingWizard';
import {
  LayoutDashboard,
  ShoppingBag,
  Table as TableIcon,
  BookOpen,
  Users,
  ChefHat,
  Receipt,
  BarChart3,
  Settings,
  Rocket,
  LogOut,
  QrCode,
  Menu,
  X,
  Bell,
} from 'lucide-react';

interface AdminLayoutProps {
  user: { id: string; name: string; email: string; role: UserRole; restaurant_id: string };
  restaurant: Restaurant;
  onLogout: () => void;
  onOpenKitchen: () => void;
  onOpenCustomerView: (tableToken?: string) => void;
  onUpdateRestaurant: (updated: Restaurant) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  user,
  restaurant,
  onLogout,
  onOpenKitchen,
  onOpenCustomerView,
  onUpdateRestaurant,
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'tables', label: 'Tables & QR', icon: <TableIcon className="w-4 h-4" /> },
    { id: 'menu', label: 'Menu & Dishes', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'kitchen_link', label: 'Kitchen KDS', icon: <ChefHat className="w-4 h-4 text-amber-500" /> },
    { id: 'staff', label: 'Staff & RBAC', icon: <Users className="w-4 h-4" /> },
    { id: 'bills', label: 'Bills & POS', icon: <Receipt className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'onboarding', label: 'Launch Wizard', icon: <Rocket className="w-4 h-4 text-indigo-500" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'kitchen_link') {
      onOpenKitchen();
    } else {
      setActiveTab(id);
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl">{restaurant.logo || '🍛'}</span>
          <span className="font-extrabold text-sm">{restaurant.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenCustomerView()}
            className="p-1.5 bg-slate-800 rounded-lg text-xs"
            title="Scan QR"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 bg-slate-800 rounded-lg text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:flex flex-col w-full md:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 z-30 sticky top-0 md:h-screen`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-2xs">
            {restaurant.logo || '🍛'}
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-extrabold text-white truncate leading-tight">
              {restaurant.name}
            </h1>
            <span className="text-[11px] text-slate-400 font-mono">Tenant: {restaurant.slug}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-white text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between mb-3">
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{user.name}</div>
              <div className="text-[10px] text-amber-400 font-mono uppercase">{user.role}</div>
            </div>
            <button
              onClick={() => {
                removeAuthToken();
                onLogout();
              }}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenCustomerView()}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700/80"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Open Table 04 Menu</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            restaurant={restaurant}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenKitchen={onOpenKitchen}
            onOpenCustomerView={() => onOpenCustomerView()}
          />
        )}
        {activeTab === 'orders' && <OrdersManagement restaurant={restaurant} />}
        {activeTab === 'tables' && (
          <TableManagement
            restaurant={restaurant}
            onOpenCustomerView={(token) => onOpenCustomerView(token)}
          />
        )}
        {activeTab === 'menu' && <MenuManagement restaurant={restaurant} />}
        {activeTab === 'staff' && <StaffManagement restaurant={restaurant} />}
        {activeTab === 'bills' && <BillsManagement restaurant={restaurant} />}
        {activeTab === 'analytics' && <AnalyticsView restaurant={restaurant} />}
        {activeTab === 'onboarding' && (
          <OnboardingWizard
            restaurant={restaurant}
            onFinish={(updated) => onUpdateRestaurant(updated)}
          />
        )}
        {activeTab === 'settings' && (
          <RestaurantSettingsView
            restaurant={restaurant}
            onUpdate={(updated) => onUpdateRestaurant(updated)}
          />
        )}
      </main>
    </div>
  );
};
