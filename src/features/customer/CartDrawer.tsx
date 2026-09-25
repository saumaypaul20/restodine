import React, { useState } from 'react';
import { CartItem, Restaurant, Order } from '../../types';
import { api } from '../../services/apiClient';
import confetti from 'canvas-confetti';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  restaurant: Restaurant;
  table: { id: string; table_number: string };
  sessionId: string;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onRemoveItem: (cartId: string) => void;
  onOrderPlaced: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  restaurant,
  table,
  sessionId,
  onUpdateQuantity,
  onRemoveItem,
  onOrderPlaced,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const taxRate = restaurant.tax_rate_percent || 5;
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    // Generate unique idempotency key for this order submission attempt
    const idempotencyKey = 'idem-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now();

    try {
      const orderPayload = {
        restaurant_id: restaurant.id,
        table_id: table.id,
        session_id: sessionId,
        customer_name: customerName.trim() || 'Guest',
        special_instructions: specialInstructions,
        items: cartItems.map((ci) => ({
          item_id: ci.item_id,
          item_name: ci.name,
          quantity: ci.quantity,
          unit_price: ci.price,
          modifiers: ci.modifiers,
          special_instructions: ci.special_instructions,
        })),
      };

      const newOrder = await api.createOrder(orderPayload, idempotencyKey);

      // Trigger celebratory confetti
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });

      onOrderPlaced(newOrder);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Your Table Order</h3>
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                Table {table.table_number}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {cartItems.length} {cartItems.length === 1 ? 'dish' : 'dishes'} in order
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold">Your cart is empty</p>
              <p className="text-xs mt-1 text-slate-400">Browse the menu to add delicious dishes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.cart_id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
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
                      <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    </div>

                    {/* Modifiers selected */}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {item.modifiers.map((m, idx) => (
                          <div key={idx} className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span>· {m.modifier_name}</span>
                            {m.price_adjustment > 0 && (
                              <span className="text-[10px] text-slate-400 tabular-nums">
                                (+{restaurant.currency}
                                {m.price_adjustment})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {item.special_instructions && (
                      <p className="text-[11px] text-amber-700 italic mt-1">
                        Note: {item.special_instructions}
                      </p>
                    )}

                    <div className="text-xs font-bold text-slate-900 mt-2 tabular-nums">
                      {restaurant.currency}
                      {item.price * item.quantity}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg bg-white p-0.5 shadow-2xs">
                    {item.quantity === 1 ? (
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.cart_id)}
                        className="w-7 h-7 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cart_id, -1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="w-6 text-center text-xs font-bold text-slate-800 tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.cart_id, 1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Special Instructions & Name */}
              <div className="pt-2 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul, Priya, Alex"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Order Notes for Kitchen (Optional)
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Serve drinks together, mild spices"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Bill Summary */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-mono">
                    {restaurant.currency}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Taxes ({taxRate}%)</span>
                  <span className="tabular-nums font-mono">
                    {restaurant.currency}
                    {taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Amount</span>
                  <span className="tabular-nums font-mono">
                    {restaurant.currency}
                    {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-white border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct to Kitchen · No duplicate charges</span>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center justify-between px-5 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-md active:scale-[0.99]"
            >
              <span>{isSubmitting ? 'Placing Order...' : 'Confirm & Send to Kitchen'}</span>
              <div className="flex items-center gap-2">
                <span className="tabular-nums font-mono">
                  {restaurant.currency}
                  {total.toFixed(2)}
                </span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
