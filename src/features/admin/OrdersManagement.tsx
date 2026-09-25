import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, Restaurant } from '../../types';
import { api } from '../../services/apiClient';
import { useWebSocket } from '../../hooks/useWebSocket';
import {
  Clock,
  CheckCircle,
  Filter,
  Search,
  RefreshCw,
  Eye,
  X,
  ChefHat,
  Sparkles,
  Utensils,
  Receipt,
  XCircle,
} from 'lucide-react';

interface OrdersManagementProps {
  restaurant: Restaurant;
}

const ALL_STATUSES: OrderStatus[] = [
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'SERVED',
  'COMPLETED',
  'CANCELLED',
];

export const OrdersManagement: React.FC<OrdersManagementProps> = ({ restaurant }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      // In our DB helpers, getting kitchen/all orders
      const data = await api.getKitchenOrders(restaurant.id);
      setOrders(data);
    } catch (err: any) {
      console.warn('Orders load notice:', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [restaurant.id]);

  // Real-time updates
  useWebSocket(restaurant.id, (event) => {
    if (event.type === 'ORDER_CREATED') {
      setOrders((prev) => [event.data, ...prev]);
    } else if (event.type === 'ORDER_STATUS_CHANGED') {
      setOrders((prev) =>
        prev.map((o) => (o.id === event.data?.id ? event.data : o))
      );
      if (selectedOrder?.id === event.data?.id) {
        setSelectedOrder(event.data);
      }
    }
  });

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const updated = await api.updateOrderStatus(orderId, nextStatus);
      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Status transition failed');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.table_number.toLowerCase().includes(q) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PLACED':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">New Order</span>;
      case 'ACCEPTED':
        return <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded-full">Accepted</span>;
      case 'PREPARING':
        return <span className="bg-sky-100 text-sky-800 text-[11px] font-bold px-2 py-0.5 rounded-full">Cooking</span>;
      case 'READY':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">Ready</span>;
      case 'SERVED':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-full">Served</span>;
      case 'COMPLETED':
        return <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">Completed</span>;
      case 'CANCELLED':
        return <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full">Cancelled</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Live Orders Operations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time customer table orders, advance states, and track fulfillment history.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white font-bold shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            All Orders ({orders.length})
          </button>
          {ALL_STATUSES.map((st) => {
            const count = orders.filter((o) => o.status === st).length;
            if (count === 0 && st !== 'PLACED' && st !== 'PREPARING' && st !== 'READY') return null;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search #order, table, guest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 font-semibold">
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
          <p className="text-xs font-bold text-slate-800">No matching orders found</p>
          <p className="text-[11px] text-slate-500">Orders placed by table customers will appear here in real time.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Table</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                      {ord.order_number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      Table {ord.table_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {ord.customer_name || 'Guest'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="line-clamp-1 max-w-xs">
                        {ord.items.map((i) => `${i.quantity}× ${i.item_name}`).join(', ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {restaurant.currency}
                      {ord.total_amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(ord.status)}</td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-[11px]"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 font-mono">
                    {selectedOrder.order_number}
                  </h3>
                  <span className="font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                    Table {selectedOrder.table_number}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Guest: {selectedOrder.customer_name || 'Guest'} · Placed{' '}
                  {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Status progression */}
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Current State</span>
                  <div className="mt-0.5">{getStatusBadge(selectedOrder.status)}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  {selectedOrder.status === 'PLACED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'ACCEPTED')}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800"
                    >
                      Accept
                    </button>
                  )}
                  {selectedOrder.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-500"
                    >
                      Start Cooking
                    </button>
                  )}
                  {selectedOrder.status === 'PREPARING' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'READY')}
                      className="px-3 py-1.5 bg-sky-600 text-white rounded-lg font-bold text-xs hover:bg-sky-500"
                    >
                      Mark Ready
                    </button>
                  )}
                  {selectedOrder.status === 'READY' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'SERVED')}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-500"
                    >
                      Serve Food
                    </button>
                  )}
                  {selectedOrder.status === 'SERVED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold text-xs hover:bg-purple-500"
                    >
                      Complete & Settle
                    </button>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Ordered Dishes</h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl p-3 bg-white space-y-2">
                  {selectedOrder.items.map((it) => (
                    <div key={it.id} className="pt-2 first:pt-0">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>
                          {it.quantity}× {it.item_name}
                        </span>
                        <span className="font-mono tabular-nums">
                          {restaurant.currency}
                          {it.total_price}
                        </span>
                      </div>
                      {it.modifiers && it.modifiers.length > 0 && (
                        <div className="pl-4 text-[11px] text-slate-500">
                          {it.modifiers.map((m, idx) => (
                            <div key={idx}>+ {m.modifier_name}</div>
                          ))}
                        </div>
                      )}
                      {it.special_instructions && (
                        <div className="pl-4 text-[10px] text-amber-600 italic">
                          Note: {it.special_instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.special_instructions && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  <span className="font-bold">Customer Note: </span>
                  {selectedOrder.special_instructions}
                </div>
              )}

              {/* Totals */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>
                    {restaurant.currency}
                    {selectedOrder.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({restaurant.tax_rate_percent}%)</span>
                  <span>
                    {restaurant.currency}
                    {selectedOrder.tax_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                  <span>Total</span>
                  <span>
                    {restaurant.currency}
                    {selectedOrder.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
