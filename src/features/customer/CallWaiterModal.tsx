import React, { useState } from 'react';
import { RequestType } from '../../types';
import { api } from '../../services/apiClient';
import { Bell, Droplets, Utensils, Sparkles, Receipt, HelpCircle, X, Check } from 'lucide-react';

interface CallWaiterModalProps {
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onRequestSent: (msg: string) => void;
}

const REQUEST_OPTIONS: { type: RequestType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'CALL_WAITER', label: 'Call Server', icon: <Bell className="w-5 h-5 text-amber-500" />, desc: 'A staff member will come to your table' },
  { type: 'WATER', label: 'Water Refill', icon: <Droplets className="w-5 h-5 text-sky-500" />, desc: 'Request chilled or regular table water' },
  { type: 'EXTRA_CUTLERY', label: 'Extra Cutlery', icon: <Utensils className="w-5 h-5 text-indigo-500" />, desc: 'Forks, spoons, or extra plates' },
  { type: 'NAPKINS', label: 'Paper Napkins', icon: <Sparkles className="w-5 h-5 text-emerald-500" />, desc: 'Fresh tissue napkins' },
  { type: 'REQUEST_BILL', label: 'Request Bill', icon: <Receipt className="w-5 h-5 text-purple-500" />, desc: 'Ready to pay and settle the table bill' },
  { type: 'OTHER', label: 'Other Assistance', icon: <HelpCircle className="w-5 h-5 text-slate-500" />, desc: 'Any other special dining request' },
];

export const CallWaiterModal: React.FC<CallWaiterModalProps> = ({
  restaurantId,
  tableId,
  tableNumber,
  isOpen,
  onClose,
  onRequestSent,
}) => {
  const [selectedType, setSelectedType] = useState<RequestType>('CALL_WAITER');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.createStaffRequest({
        restaurant_id: restaurantId,
        table_id: tableId,
        request_type: selectedType,
        notes,
      });
      setSentSuccess(true);
      onRequestSent(`Request sent for Table ${tableNumber}!`);
      setTimeout(() => {
        setSentSuccess(false);
        setNotes('');
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to send request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Table Service Request</h3>
            <p className="text-xs text-slate-500">Table {tableNumber} · Instant Staff Alert</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {sentSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Request Dispatched</h4>
            <p className="text-xs text-slate-500 mt-1">Our staff has been notified and is heading to Table {tableNumber}.</p>
          </div>
        ) : (
          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2.5">
              {REQUEST_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setSelectedType(opt.type)}
                  className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1.5 transition-all ${
                    selectedType === opt.type
                      ? 'border-slate-900 bg-slate-50 shadow-xs ring-1 ring-slate-900'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="p-1.5 bg-white rounded-lg border border-slate-100 shadow-2xs">
                    {opt.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{opt.label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-1">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Additional Instructions (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Warm water please, or 2 extra soup spoons"
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSubmitting ? 'Sending Request...' : 'Send Request to Staff'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
