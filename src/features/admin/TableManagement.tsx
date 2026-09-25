import React, { useState, useEffect } from 'react';
import { Table, Restaurant } from '../../types';
import { api } from '../../services/apiClient';
import {
  QrCode,
  Plus,
  RefreshCw,
  Printer,
  Download,
  Users,
  Building2,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

interface TableManagementProps {
  restaurant: Restaurant;
  onOpenCustomerView?: (tableToken: string) => void;
}

export const TableManagement: React.FC<TableManagementProps> = ({
  restaurant,
  onOpenCustomerView,
}) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTableForQr, setSelectedTableForQr] = useState<Table | null>(null);

  // Form State
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [section, setSection] = useState('Floor 1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTables = async () => {
    try {
      const data = await api.getTables(restaurant.id);
      setTables(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [restaurant.id]);

  const sections = Array.from(new Set(tables.map((t) => t.section || 'General')));

  const filteredTables = tables.filter((t) => {
    if (activeSection !== 'all' && t.section !== activeSection) return false;
    return true;
  });

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber) return;
    setIsSubmitting(true);
    try {
      const newTbl = await api.createTable(restaurant.id, {
        table_number: tableNumber,
        capacity: Number(capacity) || 4,
        section,
      });
      setTables([...tables, newTbl]);
      setIsAddModalOpen(false);
      setTableNumber('');
    } catch (err: any) {
      alert(err.message || 'Failed to create table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateToken = async (tableId: string) => {
    if (!confirm('Regenerating will invalidate existing printed QR codes for this table. Continue?')) {
      return;
    }
    try {
      const updated = await api.regenerateTableQR(restaurant.id, tableId);
      setTables(tables.map((t) => (t.id === tableId ? updated : t)));
      if (selectedTableForQr?.id === tableId) {
        setSelectedTableForQr(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate QR');
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      await api.deleteTable(restaurant.id, tableId);
      setTables(tables.filter((t) => t.id !== tableId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete table');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Table & QR Code Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure restaurant dining tables, floor sections, and unique table ordering QR tokens.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Table</span>
        </button>
      </div>

      {/* Floor / Section Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeSection === 'all'
              ? 'bg-slate-900 text-white font-bold shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          All Tables ({tables.length})
        </button>
        {sections.map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => setActiveSection(sec)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeSection === sec
                ? 'bg-slate-900 text-white font-bold shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {sec} ({tables.filter((t) => t.section === sec).length})
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 font-semibold">
          Loading tables...
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900">No tables found</h4>
          <p className="text-xs text-slate-500">Create tables to generate customer ordering QR codes.</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            Add Table
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((tbl) => (
            <div
              key={tbl.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold text-slate-900 font-mono">
                        Table {tbl.table_number}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {tbl.section}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tbl.capacity} Seats</span>
                      <span>·</span>
                      <span className="font-mono text-[11px] text-slate-600 font-semibold">
                        Token: {tbl.token}
                      </span>
                    </div>
                  </div>

                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Active" />
                </div>

                {/* QR Preview Thumbnail */}
                <div
                  onClick={() => setSelectedTableForQr(tbl)}
                  className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/70 transition-colors group"
                >
                  <div
                    className="w-24 h-24 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: tbl.qr_code_svg || '' }}
                  />
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 group-hover:text-slate-900 mt-1">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View & Print QR</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                {onOpenCustomerView && (
                  <button
                    type="button"
                    onClick={() => onOpenCustomerView(tbl.token)}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                    title="Simulate scanning this table QR"
                  >
                    <span>Test QR</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                )}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleRegenerateToken(tbl.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    title="Regenerate Token"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTable(tbl.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    title="Delete Table"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add Dining Table</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Table Number / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 09, 10, Rooftop-A"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Floor / Section
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Hall, Floor 1, Rooftop Terrace"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View & Print QR Card Modal */}
      {selectedTableForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4">
            <div className="w-full flex justify-end">
              <button
                onClick={() => setSelectedTableForQr(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Table Stand Graphic */}
            <div className="p-6 bg-slate-50 border-2 border-slate-900 rounded-3xl w-full flex flex-col items-center space-y-3">
              <div className="text-2xl">{restaurant.logo || '🍛'}</div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">
                  {restaurant.name}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Scan to order from your phone</p>
              </div>

              {/* QR Svg container */}
              <div
                className="w-44 h-44 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: selectedTableForQr.qr_code_svg || '' }}
              />

              <div className="pt-1">
                <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                  TABLE {selectedTableForQr.table_number}
                </span>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Token: {selectedTableForQr.token}
                </div>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="py-2.5 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Stand</span>
              </button>

              {onOpenCustomerView && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenCustomerView(selectedTableForQr.token);
                    setSelectedTableForQr(null);
                  }}
                  className="py-2.5 px-3 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Mobile Menu</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
