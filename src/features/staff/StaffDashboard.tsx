import React, { useState, useEffect } from 'react';
import { Restaurant, StaffRequest, Table, Order } from '../../types';
import { api } from '../../services/apiClient';
import { useWebSocket } from '../../hooks/useWebSocket';
import {
  Bell,
  Check,
  Droplets,
  Utensils,
  Receipt,
  HelpCircle,
  Clock,
  Sparkles,
  Users,
  RefreshCw,
} from 'lucide-react';

interface StaffDashboardProps {
  restaurant: Restaurant;
  onOpenKitchen?: () => void;
  onOpenBills?: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  restaurant,
  onOpenKitchen,
  onOpenBills,
}) => {
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaffData = async () => {
    try {
      const [reqData, tblData, ordData] = await Promise.all([
        api.getStaffRequests(restaurant.id),
        api.getTables(restaurant.id),
        api.getKitchenOrders(restaurant.id),
      ]);
      setRequests(reqData);
      setTables(tblData);
      setOrders(ordData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [restaurant.id]);

  // WebSocket sync for real-time customer requests and orders
  useWebSocket(restaurant.id, (event) => {
    if (event.type === 'STAFF_REQUEST_CREATED') {
      setRequests((prev) => [event.data, ...prev]);
    } else if (event.type === 'STAFF_REQUEST_RESOLVED') {
      setRequests((prev) =>
        prev.map((r) => (r.id === event.data?.id ? { ...r, status: 'RESOLVED' } : r))
      );
    } else if (event.type === 'ORDER_CREATED' || event.type === 'ORDER_STATUS_CHANGED') {
      fetchStaffData();
    }
  });

  const handleResolve = async (reqId: string) => {
    try {
      await api.resolveStaffRequest(reqId);
      setRequests(
        requests.map((r) => (r.id === reqId ? { ...r, status: 'RESOLVED' } : r))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to resolve request');
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const resolvedRequests = requests.filter((r) => r.status === 'RESOLVED').slice(0, 8);

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'CALL_WAITER':
        return <Bell className="w-4 h-4 text-amber-500" />;
      case 'WATER':
        return <Droplets className="w-4 h-4 text-sky-500" />;
      case 'EXTRA_CUTLERY':
        return <Utensils className="w-4 h-4 text-indigo-500" />;
      case 'NAPKINS':
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'REQUEST_BILL':
        return <Receipt className="w-4 h-4 text-purple-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Waiter & Front-of-House Dispatch
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Attend to live guest table requests, water refills, cutlery, and bill settlement calls.
          </p>
        </div>

        <button
          onClick={fetchStaffData}
          className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Grid: Pending Requests (Left 60%) + Tables Floor Map (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Guest Requests */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900">
                Pending Table Calls ({pendingRequests.length})
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading requests...</div>
          ) : pendingRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
              <Check className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-xs font-bold text-slate-900">All Table Requests Attended</h4>
              <p className="text-[11px] text-slate-500">
                New table calls or bill requests from mobile diners will pop up here instantly.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm p-4 flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                      {getRequestIcon(req.request_type)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900 font-mono">
                          TABLE {req.table_number}
                        </span>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {req.request_type.replace('_', ' ')}
                        </span>
                      </div>

                      {req.notes && (
                        <p className="text-xs text-slate-700 font-medium mt-1">
                          "{req.notes}"
                        </p>
                      )}

                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                        Requested {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleResolve(req.id)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Attended</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recently Resolved */}
          {resolvedRequests.length > 0 && (
            <div className="pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Recently Attended ({resolvedRequests.length})
              </h4>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                {resolvedRequests.map((r) => (
                  <div key={r.id} className="p-3 flex items-center justify-between text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">Table {r.table_number}</span>
                      <span>·</span>
                      <span>{r.request_type.replace('_', ' ')}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Resolved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Dining Tables Floor Map Overview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Dining Floor Status</h3>
            <span className="text-xs text-slate-500 font-mono font-bold">
              {tables.length} Total Tables
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {tables.map((tbl) => {
              const activeTableOrders = orders.filter(
                (o) => o.table_id === tbl.id && !['COMPLETED', 'CANCELLED'].includes(o.status)
              );
              const hasActive = activeTableOrders.length > 0;
              const hasPendingReq = pendingRequests.some((r) => r.table_id === tbl.id);

              return (
                <div
                  key={tbl.id}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                    hasPendingReq
                      ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400'
                      : hasActive
                      ? 'border-slate-300 bg-white shadow-2xs'
                      : 'border-slate-200 bg-slate-50/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 font-mono">
                        Table {tbl.table_number}
                      </div>
                      <div className="text-[10px] text-slate-500">{tbl.section}</div>
                    </div>

                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        hasPendingReq
                          ? 'bg-amber-500 animate-ping'
                          : hasActive
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">
                      {hasActive ? `${activeTableOrders.length} active orders` : 'Vacant'}
                    </span>
                    <span className="text-slate-400">{tbl.capacity} seats</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
