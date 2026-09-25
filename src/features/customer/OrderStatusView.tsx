import React from 'react';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/apiClient';
import { CheckCircle2, Clock, ChefHat, Sparkles, Utensils, Receipt, ArrowLeft, RefreshCw } from 'lucide-react';

interface OrderStatusViewProps {
  order: Order;
  currency: string;
  onBackToMenu: () => void;
  onRequestBill: () => void;
  onRefreshOrder: () => void;
}

const ORDER_STEPS: { status: OrderStatus; label: string; desc: string; icon: React.ReactNode }[] = [
  { status: 'PLACED', label: 'Order Placed', desc: 'Received by kitchen system', icon: <Clock className="w-4 h-4" /> },
  { status: 'ACCEPTED', label: 'Accepted by Kitchen', desc: 'Order confirmed and queued', icon: <CheckCircle2 className="w-4 h-4" /> },
  { status: 'PREPARING', label: 'Preparing Fresh', desc: 'Chef is cooking your dishes', icon: <ChefHat className="w-4 h-4" /> },
  { status: 'READY', label: 'Ready on Counter', desc: 'Dishes plated and steaming hot', icon: <Sparkles className="w-4 h-4" /> },
  { status: 'SERVED', label: 'Served at Table', desc: 'Enjoy your meal!', icon: <Utensils className="w-4 h-4" /> },
];

const STATUS_PRIORITY: Record<OrderStatus, number> = {
  PLACED: 1,
  ACCEPTED: 2,
  PREPARING: 3,
  READY: 4,
  SERVED: 5,
  COMPLETED: 6,
  CANCELLED: -1,
};

export const OrderStatusView: React.FC<OrderStatusViewProps> = ({
  order,
  currency,
  onBackToMenu,
  onRequestBill,
  onRefreshOrder,
}) => {
  const currentPriority = STATUS_PRIORITY[order.status] || 1;
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-12">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu</span>
        </button>
        <div className="text-center">
          <div className="text-xs font-bold text-slate-900">Live Table Tracking</div>
          <div className="text-[11px] text-slate-500">Table {order.table_number}</div>
        </div>
        <button
          onClick={onRefreshOrder}
          title="Refresh status"
          className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="max-w-md mx-auto w-full p-4 space-y-4">
        {/* Hero Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center">
          <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-mono font-bold text-slate-900 mb-2">
            Order {order.order_number}
          </div>

          {isCancelled ? (
            <div className="py-3">
              <h2 className="text-lg font-bold text-rose-600">Order Cancelled</h2>
              <p className="text-xs text-slate-500 mt-1">This order was cancelled by the kitchen staff.</p>
            </div>
          ) : (
            <div className="py-2">
              <h2 className="text-xl font-extrabold text-slate-900">
                {order.status === 'PLACED' && 'Waiting for Kitchen Confirmation'}
                {order.status === 'ACCEPTED' && 'Order Accepted by Kitchen'}
                {order.status === 'PREPARING' && 'Chef is Preparing Your Food'}
                {order.status === 'READY' && 'Your Food is Ready!'}
                {order.status === 'SERVED' && 'Enjoy Your Feast!'}
                {order.status === 'COMPLETED' && 'Bill Settled · Thank You!'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Estimated wait: ~15-20 mins · Cooked to order
              </p>
            </div>
          )}

          {/* Progress Timeline */}
          {!isCancelled && (
            <div className="mt-6 space-y-4 text-left border-t border-slate-100 pt-5">
              {ORDER_STEPS.map((step, idx) => {
                const stepPriority = STATUS_PRIORITY[step.status];
                const isPassed = currentPriority >= stepPriority;
                const isCurrent = order.status === step.status;

                return (
                  <div key={step.status} className="flex items-start gap-3 relative">
                    {/* Connecting line */}
                    {idx < ORDER_STEPS.length - 1 && (
                      <div
                        className={`absolute left-3.5 top-7 bottom-0 w-0.5 -mb-4 transition-colors ${
                          currentPriority > stepPriority ? 'bg-slate-900' : 'bg-slate-200'
                        }`}
                      />
                    )}

                    {/* Step Icon */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                        isCurrent
                          ? 'bg-slate-900 text-white ring-4 ring-slate-100'
                          : isPassed
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {step.icon}
                    </div>

                    <div className="flex-1 pb-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-slate-900'
                              : isPassed
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full animate-pulse">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Items Breakdown */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900">Items Ordered</h3>
            <span className="text-xs text-slate-500 tabular-nums font-mono">
              {order.items.length} items
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-xs border flex items-center justify-center ${
                        item.is_veg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                    >
                      <span
                        className={`w-1 h-1 rounded-full ${
                          item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {item.quantity} × {item.item_name}
                    </span>
                  </div>

                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="mt-1 pl-4 space-y-0.5">
                      {item.modifiers.map((m, idx) => (
                        <div key={idx} className="text-[11px] text-slate-500">
                          + {m.modifier_name}
                        </div>
                      ))}
                    </div>
                  )}

                  {item.special_instructions && (
                    <div className="text-[11px] text-amber-700 italic mt-0.5 pl-4">
                      Note: {item.special_instructions}
                    </div>
                  )}
                </div>

                <span className="text-xs font-semibold text-slate-800 tabular-nums font-mono">
                  {currency}
                  {item.total_price}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing summary */}
          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums font-mono">
                {currency}
                {order.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>GST Taxes</span>
              <span className="tabular-nums font-mono">
                {currency}
                {order.tax_amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
              <span>Total Bill</span>
              <span className="tabular-nums font-mono">
                {currency}
                {order.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onBackToMenu}
            className="py-3 px-4 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs text-center"
          >
            Order More Food
          </button>
          <button
            type="button"
            onClick={onRequestBill}
            className="py-3 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Request Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
