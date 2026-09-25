import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/apiClient';
import { useWebSocket } from '../../hooks/useWebSocket';
import {
  ChefHat,
  Clock,
  CheckCircle,
  Play,
  Sparkles,
  Utensils,
  AlertTriangle,
  Volume2,
  VolumeX,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

interface KitchenDisplayProps {
  restaurantId: string;
  restaurantName?: string;
  onExit?: () => void;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({
  restaurantId,
  restaurantName = 'The Curry Room',
  onExit,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);

  // Load active orders for kitchen
  const fetchKitchenOrders = useCallback(async () => {
    try {
      const data = await api.getKitchenOrders(restaurantId);
      setOrders(data || []);
    } catch (err: any) {
      console.warn('Kitchen orders load notice:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchKitchenOrders();
  }, [fetchKitchenOrders]);

  // Audio chime helper using Web Audio API (no external audio assets required)
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio might be blocked by browser autoplay policy
    }
  }, [soundEnabled]);

  // WebSocket connection for real-time order arrival
  useWebSocket(restaurantId, (event) => {
    if (event.type === 'ORDER_CREATED') {
      const newOrd: Order = event.data;
      setOrders((prev) => {
        if (prev.some((o) => o.id === newOrd.id)) return prev;
        return [newOrd, ...prev];
      });
      playChime();
      setNewOrderAlert(`NEW ORDER: ${newOrd.order_number} (Table ${newOrd.table_number})`);
      setTimeout(() => setNewOrderAlert(null), 4000);
    } else if (event.type === 'ORDER_STATUS_CHANGED') {
      const updatedOrd: Order = event.data;
      setOrders((prev) => {
        // If served or completed or cancelled, we remove from KDS active board
        if (['SERVED', 'COMPLETED', 'CANCELLED'].includes(updatedOrd.status)) {
          return prev.filter((o) => o.id !== updatedOrd.id);
        }
        return prev.map((o) => (o.id === updatedOrd.id ? updatedOrd : o));
      });
    }
  });

  // Calculate elapsed minutes
  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // Status transitions
  const handleTransition = async (orderId: string, nextStatus: OrderStatus, notes?: string) => {
    setActionLoading(orderId);
    try {
      const updated = await api.updateOrderStatus(orderId, nextStatus, notes);
      setOrders((prev) => {
        if (['SERVED', 'COMPLETED', 'CANCELLED'].includes(nextStatus)) {
          return prev.filter((o) => o.id !== orderId);
        }
        return prev.map((o) => (o.id === orderId ? updated : o));
      });
    } catch (err: any) {
      alert(err.message || 'Status transition failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    await handleTransition(
      rejectingOrder.id,
      'CANCELLED',
      rejectReason || 'Kitchen rejected item unavailability'
    );
    setRejectingOrder(null);
    setRejectReason('');
  };

  // Group orders by column
  const newOrders = useMemo(() => orders.filter((o) => o.status === 'PLACED'), [orders]);
  const acceptedOrders = useMemo(() => orders.filter((o) => o.status === 'ACCEPTED'), [orders]);
  const preparingOrders = useMemo(() => orders.filter((o) => o.status === 'PREPARING'), [orders]);
  const readyOrders = useMemo(() => orders.filter((o) => o.status === 'READY'), [orders]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* KDS Header Bar */}
      <header className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">
                KITCHEN DISPLAY SYSTEM
              </h1>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                {restaurantName}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Live Cooking Queue · Real-Time WebSocket Sync
            </div>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-xs font-mono border-r border-slate-800 pr-4">
            <div>
              <span className="text-slate-400">New: </span>
              <span className="font-bold text-amber-400 tabular-nums">{newOrders.length}</span>
            </div>
            <div>
              <span className="text-slate-400">In Prep: </span>
              <span className="font-bold text-sky-400 tabular-nums">{preparingOrders.length}</span>
            </div>
            <div>
              <span className="text-slate-400">Ready: </span>
              <span className="font-bold text-emerald-400 tabular-nums">{readyOrders.length}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Toggle Kitchen Chime"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">Chime</span>
          </button>

          <button
            type="button"
            onClick={fetchKitchenOrders}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300"
            >
              Exit KDS
            </button>
          )}
        </div>
      </header>

      {/* New Order Alert Banner */}
      {newOrderAlert && (
        <div className="bg-amber-500 text-slate-950 font-bold px-6 py-2 text-center text-xs tracking-wide animate-pulse flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>{newOrderAlert}</span>
        </div>
      )}

      {/* 4-Column Board */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto">
        {/* Column 1: NEW (PLACED) */}
        <div className="flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <h3 className="text-xs font-extrabold text-amber-400 tracking-wider">
                1. NEW ORDERS
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full tabular-nums">
              {newOrders.length}
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {newOrders.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-600 text-xs">
                <span>No incoming orders</span>
              </div>
            ) : (
              newOrders.map((order) => (
                <KdsOrderCard
                  key={order.id}
                  order={order}
                  elapsedMinutes={getElapsedMinutes(order.created_at)}
                  isLoading={actionLoading === order.id}
                  primaryAction={{
                    label: 'ACCEPT ORDER',
                    color: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
                    onClick: () => handleTransition(order.id, 'ACCEPTED'),
                  }}
                  onReject={() => setRejectingOrder(order)}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: ACCEPTED */}
        <div className="flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="p-3 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <h3 className="text-xs font-extrabold text-indigo-400 tracking-wider">
                2. QUEUED / ACCEPTED
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full tabular-nums">
              {acceptedOrders.length}
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {acceptedOrders.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-600 text-xs">
                <span>No queued orders</span>
              </div>
            ) : (
              acceptedOrders.map((order) => (
                <KdsOrderCard
                  key={order.id}
                  order={order}
                  elapsedMinutes={getElapsedMinutes(order.created_at)}
                  isLoading={actionLoading === order.id}
                  primaryAction={{
                    label: 'START COOKING',
                    color: 'bg-indigo-600 hover:bg-indigo-500 text-white',
                    onClick: () => handleTransition(order.id, 'PREPARING'),
                  }}
                  onReject={() => setRejectingOrder(order)}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: PREPARING */}
        <div className="flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="p-3 bg-sky-500/10 border-b border-sky-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
              <h3 className="text-xs font-extrabold text-sky-400 tracking-wider">
                3. PREPARING FRESH
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full tabular-nums">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {preparingOrders.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-600 text-xs">
                <span>Nothing on grill</span>
              </div>
            ) : (
              preparingOrders.map((order) => (
                <KdsOrderCard
                  key={order.id}
                  order={order}
                  elapsedMinutes={getElapsedMinutes(order.created_at)}
                  isLoading={actionLoading === order.id}
                  primaryAction={{
                    label: 'MARK READY',
                    color: 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold',
                    onClick: () => handleTransition(order.id, 'READY'),
                  }}
                  onReject={() => setRejectingOrder(order)}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 4: READY */}
        <div className="flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-extrabold text-emerald-400 tracking-wider">
                4. READY TO SERVE
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full tabular-nums">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {readyOrders.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-600 text-xs">
                <span>No orders waiting to serve</span>
              </div>
            ) : (
              readyOrders.map((order) => (
                <KdsOrderCard
                  key={order.id}
                  order={order}
                  elapsedMinutes={getElapsedMinutes(order.created_at)}
                  isLoading={actionLoading === order.id}
                  primaryAction={{
                    label: 'FOOD SERVED',
                    color: 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold',
                    onClick: () => handleTransition(order.id, 'SERVED'),
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reject Order Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reject Order {rejectingOrder.order_number}</h3>
                <p className="text-xs text-slate-400">Table {rejectingOrder.table_number}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for Rejection
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Item out of stock, kitchen closed"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual KDS Order Card
interface KdsOrderCardProps {
  order: Order;
  elapsedMinutes: number;
  isLoading: boolean;
  primaryAction: {
    label: string;
    color: string;
    onClick: () => void;
  };
  onReject?: () => void;
}

const KdsOrderCard: React.FC<KdsOrderCardProps> = ({
  order,
  elapsedMinutes,
  isLoading,
  primaryAction,
  onReject,
}) => {
  const isUrgent = elapsedMinutes >= 15;

  return (
    <div
      className={`rounded-xl border bg-slate-800/90 shadow-md p-3.5 flex flex-col justify-between transition-all ${
        isUrgent
          ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-slate-800'
          : 'border-slate-700/80 hover:border-slate-600'
      }`}
    >
      <div>
        {/* Card Header: Order Number, Table, Timer */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5 mb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white font-mono">
                {order.order_number}
              </span>
              <span className="text-xs font-extrabold bg-slate-700 text-amber-300 px-2 py-0.5 rounded">
                TABLE {order.table_number}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">{order.customer_name || 'Guest'}</span>
          </div>

          <div
            className={`flex items-center gap-1 text-xs font-mono font-bold tabular-nums px-2 py-1 rounded-md ${
              isUrgent ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700/60 text-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{elapsedMinutes}m</span>
          </div>
        </div>

        {/* Dish Items */}
        <div className="space-y-2 mb-3">
          {order.items.map((item) => (
            <div key={item.id} className="text-xs">
              <div className="flex items-start justify-between font-bold text-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-700 text-white flex items-center justify-center font-mono text-[11px]">
                    {item.quantity}×
                  </span>
                  <span>{item.item_name}</span>
                </span>
                <span
                  className={`w-2 h-2 rounded-full mt-1.5 ${
                    item.is_veg ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
              </div>

              {/* Modifiers */}
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="pl-6 space-y-0.5 text-[11px] text-slate-400 font-medium">
                  {item.modifiers.map((m, idx) => (
                    <div key={idx}>+ {m.modifier_name}</div>
                  ))}
                </div>
              )}

              {/* Special instruction per item */}
              {item.special_instructions && (
                <div className="pl-6 text-[10px] text-amber-400 italic">
                  Note: {item.special_instructions}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Order-level special instruction */}
        {order.special_instructions && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300 font-medium mb-3">
            <span className="font-bold">Order Note: </span>
            {order.special_instructions}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2">
        <button
          type="button"
          onClick={primaryAction.onClick}
          disabled={isLoading}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold tracking-wider transition-all shadow-sm ${primaryAction.color} disabled:opacity-50`}
        >
          {isLoading ? 'UPDATING...' : primaryAction.label}
        </button>

        {onReject && (
          <button
            type="button"
            onClick={onReject}
            disabled={isLoading}
            className="py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-rose-600/30 text-rose-300 border border-slate-600 hover:border-rose-500 text-xs font-bold transition-colors"
            title="Reject order"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
