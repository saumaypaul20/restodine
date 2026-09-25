import React, { useState, useEffect } from 'react';
import { Restaurant } from '../../types';
import { api } from '../../services/apiClient';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Bell,
  Utensils,
  ChevronRight,
  ExternalLink,
  ChefHat,
  Receipt,
  QrCode,
} from 'lucide-react';

interface DashboardOverviewProps {
  restaurant: Restaurant;
  onNavigate: (tab: string) => void;
  onOpenKitchen: () => void;
  onOpenCustomerView: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  restaurant,
  onNavigate,
  onOpenKitchen,
  onOpenCustomerView,
}) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getAnalytics(restaurant.id);
        setAnalytics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [restaurant.id]);

  return (
    <div className="space-y-6">
      {/* Banner / Operational Shortcuts */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{restaurant.logo || '🍛'}</span>
            <h2 className="text-xl font-extrabold tracking-tight">{restaurant.name}</h2>
            {restaurant.is_live && (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Dining
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 max-w-lg">
            Multi-tenant in-restaurant QR digital ordering platform. Orders submitted at dining tables
            flow directly into kitchen line printers and KDS screens.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenKitchen}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <ChefHat className="w-4 h-4" />
            <span>Open Kitchen KDS</span>
          </button>

          <button
            type="button"
            onClick={onOpenCustomerView}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <QrCode className="w-4 h-4 text-slate-300" />
            <span>Test Customer QR</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Stats */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('orders')}
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Today's Orders</span>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {analytics.todays_orders_count}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-bold mt-1">
              <span>{analytics.active_orders_count} active in kitchen</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('bills')}
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Today's Revenue</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {restaurant.currency}
              {analytics.total_revenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">
              Avg {restaurant.currency}{analytics.average_order_value} / table
            </span>
          </div>

          <div
            onClick={() => onNavigate('tables')}
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Active Tables</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Utensils className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              8 Tables
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
              Floor 1 & Rooftop Terrace
            </span>
          </div>

          <div
            onClick={() => onNavigate('staff')}
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Kitchen Prep Turnaround</span>
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              ~{analytics.average_completion_minutes} mins
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
              Live KDS state tracking
            </span>
          </div>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Popular dishes */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Top Selling In-Dining Dishes</h3>
            <button
              onClick={() => onNavigate('menu')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Manage Menu
            </button>
          </div>

          {analytics?.popular_items && (
            <div className="divide-y divide-slate-100">
              {analytics.popular_items.map((item: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-400 w-5">#{idx + 1}</span>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{item.name}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        {item.count} portions served
                      </span>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {restaurant.currency}
                    {item.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Operational Checklist */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Operational In-Restaurant Workflow</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            RestoDine operates exclusively inside physical dining spaces without delivery overhead:
          </p>

          <div className="space-y-2 text-xs pt-1">
            <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div>
                <span className="font-bold text-slate-900">Table QR Entry: </span>
                <span className="text-slate-600">
                  Guest sits at Table 04, scans stand QR, and their browser opens the digital menu instantly with zero app download or login.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div>
                <span className="font-bold text-slate-900">Real-Time KDS: </span>
                <span className="text-slate-600">
                  When guest confirms order, it appears immediately on the Kitchen Display board with audible audio chime and modifiers.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div>
                <span className="font-bold text-slate-900">Table Service & Settlement: </span>
                <span className="text-slate-600">
                  Guest can request water refills or call server, then request table bill when finished for Cash, UPI or Card payment.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
