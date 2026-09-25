import React, { useState, useEffect, useMemo } from 'react';
import {
  Restaurant,
  Table,
  MenuCategory,
  MenuItem,
  CartItem,
  Order,
  OrderItemModifierSelection,
} from '../../types';
import { api } from '../../services/apiClient';
import { useWebSocket } from '../../hooks/useWebSocket';
import { CustomizationModal } from './CustomizationModal';
import { CartDrawer } from './CartDrawer';
import { OrderStatusView } from './OrderStatusView';
import { CallWaiterModal } from './CallWaiterModal';
import {
  Search,
  Bell,
  ShoppingBag,
  Plus,
  SlidersHorizontal,
  Flame,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface CustomerAppProps {
  slug?: string;
  tableToken?: string;
  onSwitchMode?: (mode: string) => void;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({
  slug = 'curry-room',
  tableToken = 'T4CR',
  onSwitchMode,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<{ id: string; table_number: string; section?: string } | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);

  // Filtering
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart & Modals
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active tracked order (if customer placed one)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [viewingOrderStatus, setViewingOrderStatus] = useState(false);

  // Load table session and restaurant menu
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resolveRes = await api.resolveTableSession(slug, tableToken);
      setRestaurant(resolveRes.restaurant);
      setTable(resolveRes.table);
      setSessionId(resolveRes.session.session_id);

      const menuRes = await api.getCustomerMenu(resolveRes.restaurant.id);
      setCategories(menuRes.categories);
      setItems(menuRes.items);
    } catch (err: any) {
      setError(err.message || 'Could not load table menu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug, tableToken]);

  // Real-time WebSocket updates
  useWebSocket(restaurant?.id, (event) => {
    if (event.type === 'ORDER_STATUS_CHANGED' && activeOrder) {
      if (event.data?.id === activeOrder.id) {
        setActiveOrder(event.data);
        showToast(`Order status updated: ${event.data.status}`);
      }
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }
      if (vegOnly && !item.is_veg) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, selectedCategory, vegOnly, searchQuery]);

  // Cart operations
  const handleAddToCart = (
    item: MenuItem,
    quantity: number = 1,
    modifiers: OrderItemModifierSelection[] = [],
    specialInstructions: string = ''
  ) => {
    const cartId =
      item.id +
      '-' +
      modifiers.map((m) => m.modifier_id).sort().join('_') +
      '-' +
      Date.now();

    const unitPrice =
      item.price +
      modifiers.reduce((acc, m) => acc + (Number(m.price_adjustment) || 0), 0);

    const newItem: CartItem = {
      cart_id: cartId,
      item_id: item.id,
      name: item.name,
      price: unitPrice,
      is_veg: item.is_veg,
      quantity,
      modifiers,
      special_instructions: specialInstructions,
    };

    setCartItems((prev) => [...prev, newItem]);
    showToast(`Added ${quantity}× ${item.name} to order`);
  };

  const handleUpdateCartQuantity = (cartId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((ci) => {
          if (ci.cart_id === cartId) {
            const nextQty = ci.quantity + delta;
            return nextQty > 0 ? { ...ci, quantity: nextQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (cartId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.cart_id !== cartId));
  };

  const cartTotalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Connecting to Table {tableToken}...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant || !table) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 text-center shadow-sm space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">QR Code Error</h3>
            <p className="text-xs text-slate-500 mt-1">{error || 'Table not found or expired.'}</p>
          </div>
          <button
            onClick={loadData}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // If viewing active order status
  if (viewingOrderStatus && activeOrder) {
    return (
      <OrderStatusView
        order={activeOrder}
        currency={restaurant.currency}
        onBackToMenu={() => setViewingOrderStatus(false)}
        onRequestBill={() => {
          setIsWaiterModalOpen(true);
        }}
        onRefreshOrder={async () => {
          try {
            const updated = await api.getOrder(activeOrder.id);
            setActiveOrder(updated);
            showToast('Order status refreshed');
          } catch (e) {
            // silent
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-2xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-lg shadow-2xs">
              {restaurant.logo || '🍛'}
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900 leading-tight">
                {restaurant.name}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                  Table {table.table_number}
                </span>
                <span>·</span>
                <span>{table.section || 'In-Restaurant'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeOrder && (
              <button
                type="button"
                onClick={() => setViewingOrderStatus(true)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Track {activeOrder.order_number}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsWaiterModalOpen(true)}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Call Server"
            >
              <Bell className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Call Server</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-xl mx-auto w-full px-4 pt-3 space-y-4">
        {/* Search & Veg Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search dishes, breads, drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs whitespace-nowrap ${
              vegOnly
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-xs border border-emerald-600 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </span>
            <span>Veg Only</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            All Dishes
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Dish List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-xs font-bold text-slate-800">No dishes match your criteria</p>
              <p className="text-[11px] text-slate-500 mt-1">Try resetting the veg filter or search keywords.</p>
              {(vegOnly || searchQuery) && (
                <button
                  onClick={() => {
                    setVegOnly(false);
                    setSearchQuery('');
                  }}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            filteredItems.map((item) => {
              const hasModifiers = item.modifier_groups && item.modifier_groups.length > 0;
              const isAvailable = item.is_available !== false;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border bg-white shadow-2xs flex gap-3 transition-all ${
                    !isAvailable ? 'opacity-60 border-slate-200 bg-slate-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Left Content */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Veg / Non-Veg Indicator */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`w-3 h-3 rounded-xs border flex items-center justify-center ${
                            item.is_veg ? 'border-emerald-600' : 'border-rose-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {item.is_veg ? 'Veg' : 'Non-Veg'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{item.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-1">
                      <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                        {restaurant.currency}
                        {item.price}
                      </div>

                      {/* Add Button */}
                      {!isAvailable ? (
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                          Sold Out
                        </span>
                      ) : hasModifiers ? (
                        <button
                          type="button"
                          onClick={() => setCustomizingItem(item)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1"
                        >
                          <span>Customize</span>
                          <Plus className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1"
                        >
                          <span>Add</span>
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Culinary Graphic / Icon */}
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/50 border border-amber-200/50 flex flex-col items-center justify-center shrink-0 p-2 text-center">
                    <span className="text-2xl drop-shadow-xs">
                      {item.category_id.includes('biryani')
                        ? '🍚'
                        : item.category_id.includes('breads')
                        ? '🫓'
                        : item.category_id.includes('beverages')
                        ? '🥤'
                        : item.category_id.includes('desserts')
                        ? '🍯'
                        : item.is_veg
                        ? '🥗'
                        : '🍗'}
                    </span>
                    <span className="text-[9px] font-bold text-amber-900/70 mt-1 truncate max-w-full">
                      {item.is_veg ? 'Pure Veg' : 'Gourmet'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Sticky Bottom Cart Bar (if items in cart) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-3 left-4 right-4 z-40 max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full h-13 bg-slate-900 text-white rounded-2xl p-3 px-4 flex items-center justify-between shadow-xl hover:bg-slate-800 transition-transform active:scale-[0.99] border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-xs font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">
                  {cartTotalCount} {cartTotalCount === 1 ? 'item' : 'items'} in table order
                </div>
                <div className="text-[10px] text-slate-300">Tap to review & send to kitchen</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tabular-nums font-mono">
                {restaurant.currency}
                {cartSubtotal}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </div>
          </button>
        </div>
      )}

      {/* Customization Modal */}
      {customizingItem && (
        <CustomizationModal
          item={customizingItem}
          currency={restaurant.currency}
          isOpen={!!customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        restaurant={restaurant}
        table={table}
        sessionId={sessionId}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onOrderPlaced={(order) => {
          setCartItems([]);
          setActiveOrder(order);
          setViewingOrderStatus(true);
        }}
      />

      {/* Call Server Modal */}
      <CallWaiterModal
        restaurantId={restaurant.id}
        tableId={table.id}
        tableNumber={table.table_number}
        isOpen={isWaiterModalOpen}
        onClose={() => setIsWaiterModalOpen(false)}
        onRequestSent={(msg) => showToast(msg)}
      />
    </div>
  );
};
