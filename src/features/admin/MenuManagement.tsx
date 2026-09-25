import React, { useState, useEffect } from 'react';
import { MenuCategory, MenuItem, Restaurant, ModifierGroup, Modifier } from '../../types';
import { api } from '../../services/apiClient';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  Check,
  X,
  Sliders,
  DollarSign,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface MenuManagementProps {
  restaurant: Restaurant;
}

export const MenuManagement: React.FC<MenuManagementProps> = ({ restaurant }) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form states for Category
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form states for Item
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMenu = async () => {
    try {
      const data = await api.getMenu(restaurant.id);
      setCategories(data.categories);
      setItems(data.items);
      if (data.categories.length > 0 && !itemCategory) {
        setItemCategory(data.categories[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [restaurant.id]);

  const filteredItems = items.filter((item) => {
    if (activeCategory !== 'all' && item.category_id !== activeCategory) return false;
    return true;
  });

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    try {
      const newCat = await api.createCategory(restaurant.id, newCategoryName, categories.length + 1);
      setCategories([...categories, newCat]);
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Delete this category? Items under it will need reassignment.')) return;
    try {
      await api.deleteCategory(restaurant.id, catId);
      setCategories(categories.filter((c) => c.id !== catId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const updated = await api.updateItem(restaurant.id, item.id, {
        is_available: !item.is_available,
      });
      setItems(items.map((i) => (i.id === item.id ? updated : i)));
    } catch (err: any) {
      alert(err.message || 'Failed to update item availability');
    }
  };

  const handleOpenItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemCategory(item.category_id);
      setItemDescription(item.description);
      setItemPrice(item.price.toString());
      setItemIsVeg(item.is_veg);
      setModifierGroups(item.modifier_groups || []);
    } else {
      setEditingItem(null);
      setItemName('');
      setItemCategory(categories[0]?.id || '');
      setItemDescription('');
      setItemPrice('');
      setItemIsVeg(true);
      setModifierGroups([]);
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemCategory || !itemPrice) return;
    setIsSubmitting(true);
    try {
      const payload = {
        category_id: itemCategory,
        name: itemName,
        description: itemDescription,
        price: Number(itemPrice) || 0,
        is_veg: itemIsVeg,
        modifier_groups: modifierGroups,
      };

      if (editingItem) {
        const updated = await api.updateItem(restaurant.id, editingItem.id, payload);
        setItems(items.map((i) => (i.id === editingItem.id ? updated : i)));
      } else {
        const created = await api.createItem(restaurant.id, payload);
        setItems([...items, created]);
      }
      setIsItemModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.deleteItem(restaurant.id, itemId);
      setItems(items.filter((i) => i.id !== itemId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    }
  };

  // Modifier group helpers in modal
  const handleAddModifierGroup = () => {
    const newGroup: ModifierGroup = {
      id: 'mg-' + Math.random().toString(36).substring(2, 7),
      item_id: '',
      name: 'Option Group',
      min_selections: 1,
      max_selections: 1,
      is_required: true,
      modifiers: [
        {
          id: 'mod-' + Math.random().toString(36).substring(2, 7),
          group_id: '',
          name: 'Regular',
          price_adjustment: 0,
          is_default: true,
        },
      ],
    };
    setModifierGroups([...modifierGroups, newGroup]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Menu Management & Modifiers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize dishes, categories, pricing, sold-out statuses, and ingredient customizations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Add Category</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenItemModal()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeCategory === 'all'
              ? 'bg-slate-900 text-white font-bold shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          All Items ({items.length})
        </button>
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center group">
            <button
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {cat.name} ({items.filter((i) => i.category_id === cat.id).length})
            </button>
          </div>
        ))}
      </div>

      {/* Items Table / Cards */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 font-semibold">
          Loading menu items...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <p className="text-xs font-bold text-slate-800">No menu items found in this section</p>
          <button
            onClick={() => handleOpenItemModal()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            Add First Item
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const catName = categories.find((c) => c.id === item.category_id)?.name || 'General';
              return (
                <div
                  key={item.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    !item.is_available ? 'bg-slate-50/70' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span
                      className={`w-3.5 h-3.5 mt-0.5 rounded-xs border flex items-center justify-center shrink-0 ${
                        item.is_veg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-sm font-bold ${
                            item.is_available ? 'text-slate-900' : 'text-slate-400 line-through'
                          }`}
                        >
                          {item.name}
                        </h4>
                        {!item.is_available && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded">
                            Sold Out
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">· {catName}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>

                      {item.modifier_groups && item.modifier_groups.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-indigo-700 font-semibold">
                          <Sliders className="w-3 h-3" />
                          <span>
                            {item.modifier_groups.length}{' '}
                            {item.modifier_groups.length === 1 ? 'modifier group' : 'modifier groups'}{' '}
                            ({item.modifier_groups.map((g) => g.name).join(', ')})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="text-sm font-extrabold text-slate-900 tabular-nums font-mono">
                      {restaurant.currency}
                      {item.price}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Availability Sold Out Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          item.is_available
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                        }`}
                        title="Toggle customer availability"
                      >
                        {item.is_available ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{item.is_available ? 'Available' : 'Sold Out'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenItemModal(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                        title="Edit Item"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add Menu Category</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starters, Tandoor, Desserts"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Menu Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3.5 py-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dish / Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Handi Murgh Biryani"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price ({restaurant.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="350"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Culinary Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe key ingredients and cooking style..."
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Veg / Non-Veg Switch */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-semibold text-slate-700">Dietary Classification:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setItemIsVeg(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      itemIsVeg
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Vegetarian
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemIsVeg(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      !itemIsVeg
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Non-Vegetarian
                  </button>
                </div>
              </div>

              {/* Modifiers Section */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">Customization Modifier Groups</span>
                  <button
                    type="button"
                    onClick={handleAddModifierGroup}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Modifier Group</span>
                  </button>
                </div>

                {modifierGroups.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    No custom modifier groups (size, spice level, add-ons).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {modifierGroups.map((g, gIdx) => (
                      <div key={g.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <input
                            type="text"
                            value={g.name}
                            onChange={(e) => {
                              const updated = [...modifierGroups];
                              updated[gIdx].name = e.target.value;
                              setModifierGroups(updated);
                            }}
                            className="font-bold text-xs p-1 rounded border border-slate-200 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setModifierGroups(modifierGroups.filter((_, i) => i !== gIdx))}
                            className="text-rose-500 hover:text-rose-700 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {g.modifiers.length} options defined
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
