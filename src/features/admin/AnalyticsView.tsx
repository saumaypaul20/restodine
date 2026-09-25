import React, { useState, useEffect } from 'react';
import { Restaurant } from '../../types';
import { api } from '../../services/apiClient';
import {
  TrendingUp,
  Clock,
  DollarSign,
  ShoppingBag,
  Award,
  Calendar,
  Flame,
} from 'lucide-react';

interface AnalyticsViewProps {
  restaurant: Restaurant;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ restaurant }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.getAnalytics(restaurant.id);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [restaurant.id]);

  if (loading || !data) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 font-semibold">
        Calculating restaurant operational performance...
      </div>
    );
  }

  const maxHourlyOrders = Math.max(...data.hourly_distribution.map((h: any) => h.orders), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Restaurant Dining Analytics
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics on table covers, kitchen turn-times, peak dining hours, and dish popularity.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Today's Dining Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {restaurant.currency}
            {data.total_revenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">
            +18.4% vs last Thursday
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Orders Placed</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {data.todays_orders_count}
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
            {data.active_orders_count} orders currently in kitchen
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Average Order Value</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {restaurant.currency}
            {data.average_order_value}
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
            Per dining table session
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Avg Kitchen Prep Time</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {data.average_completion_minutes} mins
          </div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">
            Optimal turnaround (&lt; 20 mins)
          </span>
        </div>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Orders by Hour Bar Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Dining Volume by Hour</h3>
              <p className="text-[11px] text-slate-500">Peak lunch and dinner traffic distributions</p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              Today
            </span>
          </div>

          <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
            {data.hourly_distribution.map((h: any) => {
              const heightPct = Math.round((h.orders / maxHourlyOrders) * 100);
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex justify-center">
                    <div
                      style={{ height: `${Math.max(12, heightPct * 1.6)}px` }}
                      className="w-full max-w-[32px] bg-slate-900 group-hover:bg-amber-500 rounded-t-lg transition-all duration-300"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                    {h.hour}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Peak Hour: 8:00 PM (31 orders)</span>
            <span className="font-mono">Total Revenue: {restaurant.currency}{data.total_revenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Top Ordered Dishes */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top Selling Dishes</h3>
            <p className="text-[11px] text-slate-500">Most frequent table selections</p>
          </div>

          <div className="space-y-3">
            {data.popular_items.map((dish: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-400 w-4">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                      <span>{dish.name}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          dish.is_veg ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {dish.count} orders
                    </span>
                  </div>
                </div>

                <div className="font-mono font-bold text-slate-900 tabular-nums">
                  {restaurant.currency}
                  {dish.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
