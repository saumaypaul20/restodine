import React, { useState, useMemo } from 'react';
import { MenuItem, OrderItemModifierSelection } from '../../types';
import { X, Plus, Minus, Check } from 'lucide-react';

interface CustomizationModalProps {
  item: MenuItem;
  currency: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    modifiers: OrderItemModifierSelection[],
    specialInstructions: string
  ) => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  item,
  currency,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Selected modifier IDs per group: { [groupId]: string[] }
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const group of item.modifier_groups) {
      const defaults = group.modifiers.filter((m) => m.is_default).map((m) => m.id);
      if (defaults.length > 0) {
        init[group.id] = defaults;
      } else if (group.is_required && group.modifiers.length > 0) {
        init[group.id] = [group.modifiers[0].id];
      } else {
        init[group.id] = [];
      }
    }
    return init;
  });

  if (!isOpen) return null;

  const handleSelectModifier = (group: MenuItem['modifier_groups'][0], modifierId: string) => {
    const current = selections[group.id] || [];
    const isSingle = group.max_selections === 1;

    if (isSingle) {
      setSelections({ ...selections, [group.id]: [modifierId] });
    } else {
      if (current.includes(modifierId)) {
        setSelections({ ...selections, [group.id]: current.filter((id) => id !== modifierId) });
      } else {
        if (current.length < group.max_selections) {
          setSelections({ ...selections, [group.id]: [...current, modifierId] });
        }
      }
    }
  };

  // Check validation rules
  const isValid = useMemo(() => {
    for (const group of item.modifier_groups) {
      const current = selections[group.id] || [];
      if (group.is_required && current.length < group.min_selections) {
        return false;
      }
      if (current.length > group.max_selections) {
        return false;
      }
    }
    return true;
  }, [item, selections]);

  // Calculate unit price including modifier adjustments
  const { unitPrice, selectedModifierDetails } = useMemo(() => {
    let extra = 0;
    const details: OrderItemModifierSelection[] = [];

    for (const group of item.modifier_groups) {
      const selectedIds = selections[group.id] || [];
      for (const mId of selectedIds) {
        const mod = group.modifiers.find((m) => m.id === mId);
        if (mod) {
          extra += mod.price_adjustment;
          details.push({
            modifier_id: mod.id,
            group_name: group.name,
            modifier_name: mod.name,
            price_adjustment: mod.price_adjustment,
          });
        }
      }
    }

    return {
      unitPrice: item.price + extra,
      selectedModifierDetails: details,
    };
  }, [item, selections]);

  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    if (!isValid) return;
    onAddToCart(item, quantity, selectedModifierDetails, specialInstructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-start justify-between">
          <div className="pr-4">
            <div className="flex items-center gap-2 mb-1">
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
              <h3 className="text-base font-bold text-slate-900 leading-snug">{item.name}</h3>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modifiers List */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          {item.modifier_groups.map((group) => {
            const currentSelected = selections[group.id] || [];
            const isSingle = group.max_selections === 1;

            return (
              <div key={group.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{group.name}</h4>
                    <span className="text-[11px] text-slate-500">
                      {isSingle
                        ? group.is_required
                          ? 'Select 1 option (Required)'
                          : 'Select up to 1 option'
                        : `Choose up to ${group.max_selections} options ${
                            group.is_required ? `(Min ${group.min_selections} required)` : ''
                          }`}
                    </span>
                  </div>
                  {group.is_required && currentSelected.length === 0 && (
                    <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
                      Required
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {group.modifiers.map((mod) => {
                    const isSelected = currentSelected.includes(mod.id);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleSelectModifier(group, mod.id)}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                          isSelected
                            ? 'border-slate-900 bg-slate-50/80 shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-${
                              isSingle ? 'full' : 'md'
                            } border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-medium text-slate-800">{mod.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-700 tabular-nums">
                          {mod.price_adjustment > 0
                            ? `+${currency}${mod.price_adjustment}`
                            : `${currency}0`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Cooking instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kitchen Instructions
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less spicy, dressing on the side, no onions"
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Footer with quantity and Add to cart */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
          <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-2xs">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-xs font-bold text-slate-900 tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!isValid}
            className="flex-1 h-11 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-between px-4 hover:bg-slate-800 disabled:opacity-40 transition-colors shadow-sm"
          >
            <span>Add to Order</span>
            <span className="tabular-nums font-mono">
              {currency}
              {totalPrice}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
