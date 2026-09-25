import React, { useState, useEffect } from 'react';
import { Bill, Table, Restaurant, PaymentMethod } from '../../types';
import { api } from '../../services/apiClient';
import { TransactionCameraModal } from '../../components/TransactionCameraModal';
import {
  Receipt,
  Plus,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Printer,
  X,
  Users,
  Camera,
  Eye,
  Image as ImageIcon,
  ShieldCheck,
  Calendar,
  Clock,
  Download,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface BillsManagementProps {
  restaurant: Restaurant;
}

export const BillsManagement: React.FC<BillsManagementProps> = ({ restaurant }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate Bill Modal
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');

  // Settle Bill Modal
  const [settlingBill, setSettlingBill] = useState<Bill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [splitCount, setSplitCount] = useState(1);
  const [transactionImage, setTransactionImage] = useState<string | null>(null);
  const [transactionReference, setTransactionReference] = useState('');
  const [settlingError, setSettlingError] = useState<string | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  // Camera Modal
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeCameraBill, setActiveCameraBill] = useState<Bill | null>(null);

  // Lightbox Preview Modal for slip image
  const [lightboxBill, setLightboxBill] = useState<Bill | null>(null);

  // Full Printable Receipt Inspection Modal
  const [inspectingBill, setInspectingBill] = useState<Bill | null>(null);

  const fetchData = async () => {
    try {
      const [billsData, tablesData] = await Promise.all([
        api.getBills(restaurant.id),
        api.getTables(restaurant.id),
      ]);
      setBills(billsData);
      setTables(tablesData);
      if (tablesData.length > 0 && !selectedTableId) {
        setSelectedTableId(tablesData[0].id);
      }
    } catch (err: any) {
      console.warn('Failed to load bills data:', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [restaurant.id]);

  const handleGenerateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableId) return;
    try {
      const newBill = await api.generateBill(restaurant.id, selectedTableId, Number(discountAmount) || 0);
      setBills([newBill, ...bills]);
      setIsGenerateOpen(false);
      setDiscountAmount('0');
    } catch (err: any) {
      alert(err.message || 'Could not generate bill for this table (check for open unbilled orders).');
    }
  };

  const handleOpenSettleModal = (bill: Bill) => {
    setSettlingBill(bill);
    setSplitCount(1);
    setPaymentMethod('UPI');
    setTransactionImage(bill.transaction_image || null);
    setTransactionReference(bill.transaction_reference || '');
    setSettlingError(null);
  };

  const handleSettlePayment = async () => {
    if (!settlingBill) return;

    if (restaurant.require_transaction_camera && !transactionImage) {
      setSettlingError('A camera photo proof of the payment slip/receipt is required by restaurant policy before closing this bill.');
      return;
    }

    setIsSettling(true);
    setSettlingError(null);

    try {
      const updated = await api.payBill(
        settlingBill.id,
        paymentMethod,
        transactionImage || undefined,
        transactionReference.trim() || undefined
      );
      setBills(bills.map((b) => (b.id === settlingBill.id ? updated : b)));
      setSettlingBill(null);
      setTransactionImage(null);
      setTransactionReference('');
    } catch (err: any) {
      setSettlingError(err.message || 'Settlement failed. Please try again.');
    } finally {
      setIsSettling(false);
    }
  };

  const handleCameraCapture = async (imageDataUrl: string, referenceNote?: string) => {
    setTransactionImage(imageDataUrl);
    if (referenceNote) {
      setTransactionReference(referenceNote);
    }

    // If capturing photo for an already settled bill
    if (activeCameraBill && activeCameraBill.status === 'PAID') {
      try {
        const updated = await api.attachBillTransactionImage(
          activeCameraBill.id,
          imageDataUrl,
          referenceNote
        );
        setBills(bills.map((b) => (b.id === activeCameraBill.id ? updated : b)));
        if (lightboxBill?.id === activeCameraBill.id) {
          setLightboxBill(updated);
        }
      } catch (err: any) {
        alert(err.message || 'Failed to save transaction image');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Billing & In-Restaurant Settlements
            </h2>
            {restaurant.enable_transaction_camera && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Camera className="w-3 h-3 text-amber-600" />
                <span>Camera Proof {restaurant.require_transaction_camera ? 'Mandatory' : 'Active'}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate dining bills, capture camera proof of payment slips, split bills, and accept Cash, UPI, or Card payments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsGenerateOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Table Bill</span>
          </button>
        </div>
      </div>

      {/* Bills Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 font-semibold">
          Loading bills...
        </div>
      ) : bills.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900">No generated bills</h4>
          <p className="text-xs text-slate-500">
            Generate a bill for active dining tables when guests are ready to settle payment.
          </p>
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            Generate First Bill
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Bill #</th>
                  <th className="py-3 px-4">Table</th>
                  <th className="py-3 px-4">Subtotal</th>
                  <th className="py-3 px-4">Tax & Service</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4">Status & Mode</th>
                  <th className="py-3 px-4 text-center">Receipt Slip (Camera)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                      {bill.bill_number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      Table {bill.table_number}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                      {restaurant.currency}
                      {bill.subtotal.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600">
                      +{restaurant.currency}
                      {(bill.tax_amount + bill.service_charge_amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-500">
                      {bill.discount_amount > 0 ? `-${restaurant.currency}${bill.discount_amount.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 tabular-nums">
                      {restaurant.currency}
                      {bill.grand_total.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      {bill.status === 'PAID' ? (
                        <div className="space-y-0.5">
                          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid ({bill.payment_method})</span>
                          </span>
                          {bill.settled_by && (
                            <div className="text-[10px] text-slate-400 font-medium">
                              by {bill.settled_by}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                          Open Unsettled
                        </span>
                      )}
                    </td>

                    {/* Transaction Proof by Camera Column */}
                    <td className="py-3.5 px-4 text-center">
                      {bill.transaction_image ? (
                        <button
                          type="button"
                          onClick={() => setLightboxBill(bill)}
                          className="group relative inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-all text-left"
                          title="Click to view full transaction proof slip"
                        >
                          <img
                            src={bill.transaction_image}
                            alt="Transaction proof"
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 group-hover:scale-105 transition-transform"
                          />
                          <div className="pr-1.5 hidden md:block">
                            <div className="text-[10px] font-bold text-slate-900 flex items-center gap-1">
                              <Camera className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Slip Proof</span>
                            </div>
                            <span className="text-[9px] text-slate-400 block max-w-[80px] truncate">
                              {bill.transaction_reference || 'Attached'}
                            </span>
                          </div>
                        </button>
                      ) : bill.status === 'PAID' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCameraBill(bill);
                            setPaymentMethod(bill.payment_method || 'CASH');
                            setIsCameraOpen(true);
                          }}
                          className="px-2 py-1 text-[10px] rounded-lg border border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 inline-flex items-center gap-1 transition-colors font-medium"
                          title="Attach camera photo proof for this settlement"
                        >
                          <Camera className="w-3 h-3 text-amber-600" />
                          <span>+ Add Photo</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {bill.status === 'OPEN' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenSettleModal(bill)}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5"
                          >
                            <span>Settle Bill</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setInspectingBill(bill)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] flex items-center gap-1 transition-colors"
                              title="View full dining bill and transaction slip"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Receipt</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingBill(bill);
                                setTimeout(() => window.print(), 300);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                              title="Print customer receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Bill Modal */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Generate Table Bill</h3>
              <button
                onClick={() => setIsGenerateOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateBill} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Table
                </label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  {tables.map((tbl) => (
                    <option key={tbl.id} value={tbl.id}>
                      Table {tbl.table_number} ({tbl.section})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discount Amount ({restaurant.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  placeholder="0"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Configured GST</span>
                  <span>{restaurant.tax_rate_percent}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Charge</span>
                  <span>{restaurant.service_charge_percent}%</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                >
                  Compute & Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Bill Modal */}
      {settlingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 font-mono">
                  Settle {settlingBill.bill_number}
                </h3>
                <span className="text-[11px] text-slate-500">
                  Table {settlingBill.table_number} · Grand Total:{' '}
                  <span className="font-bold text-slate-900 font-mono">
                    {restaurant.currency}
                    {settlingBill.grand_total.toFixed(2)}
                  </span>
                </span>
              </div>
              <button
                onClick={() => setSettlingBill(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {settlingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{settlingError}</span>
              </div>
            )}

            {/* Split Bill Calculator */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Split Bill Evenly:</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                    className="w-6 h-6 rounded bg-white border border-slate-200 font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold font-mono text-xs w-4 text-center">{splitCount}</span>
                  <button
                    type="button"
                    onClick={() => setSplitCount(splitCount + 1)}
                    className="w-6 h-6 rounded bg-white border border-slate-200 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {splitCount > 1 && (
                <div className="text-center py-1 font-mono text-xs font-bold text-indigo-700 bg-indigo-50/70 rounded-lg">
                  {restaurant.currency}
                  {(settlingBill.grand_total / splitCount).toFixed(2)} / person ({splitCount} ways)
                </div>
              )}
            </div>

            {/* Payment Mode Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-slate-900 bg-slate-50 shadow-xs ring-1 ring-slate-900'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'CARD'
                      ? 'border-slate-900 bg-slate-50 shadow-xs ring-1 ring-slate-900'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-sky-600" />
                  <span className="text-xs font-bold text-slate-900">Card POS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'CASH'
                      ? 'border-slate-900 bg-slate-50 shadow-xs ring-1 ring-slate-900'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">Cash</span>
                </button>
              </div>
            </div>

            {/* Camera Transaction Proof Configuration & Capture UI */}
            {(restaurant.enable_transaction_camera ?? true) && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-900">
                      Transaction Slip Photo (Camera)
                    </span>
                    {restaurant.require_transaction_camera && (
                      <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider">
                        Required
                      </span>
                    )}
                  </div>

                  {transactionImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setTransactionImage(null);
                        setTransactionReference('');
                      }}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {transactionImage ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
                      <img
                        src={transactionImage}
                        alt="Captured transaction proof"
                        className="w-14 h-14 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          setActiveCameraBill(settlingBill);
                          setIsCameraOpen(true);
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Slip Photo Attached</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                          {transactionReference || 'Captured via Camera'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCameraBill(settlingBill);
                          setIsCameraOpen(true);
                        }}
                        className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                      >
                        Retake
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Optional reference / UTR / Card Auth Code"
                      value={transactionReference}
                      onChange={(e) => setTransactionReference(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCameraBill(settlingBill);
                        setIsCameraOpen(true);
                      }}
                      className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs group"
                    >
                      <Camera className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                      <span>Capture Photo via Device Camera</span>
                    </button>

                    <p className="text-[10px] text-slate-500 text-center">
                      Photograph physical cash bill, EDC card swipe slip, or customer's UPI screen
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSettlePayment}
                disabled={isSettling}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSettling ? 'Settling Payment...' : 'Mark Paid & Archive Settlement'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <TransactionCameraModal
          isOpen={isCameraOpen}
          billNumber={activeCameraBill?.bill_number || ''}
          tableNumber={activeCameraBill?.table_number || ''}
          amount={activeCameraBill?.grand_total || 0}
          currency={restaurant.currency}
          paymentMethod={paymentMethod}
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* Lightbox Modal for Full-Resolution Transaction Slip */}
      {lightboxBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">
                  Transaction Proof · {lightboxBill.bill_number}
                </h3>
              </div>
              <button
                onClick={() => setLightboxBill(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              <div className="flex justify-center bg-black/50 p-2 rounded-2xl border border-slate-800">
                <img
                  src={lightboxBill.transaction_image}
                  alt={`Transaction Proof for ${lightboxBill.bill_number}`}
                  className="max-h-[380px] w-auto rounded-xl object-contain shadow-md"
                />
              </div>

              {/* Transaction Metadata Card */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-2 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Bill & Table:</span>
                  <span className="text-white font-bold">{lightboxBill.bill_number} (Table {lightboxBill.table_number})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Grand Total:</span>
                  <span className="text-emerald-400 font-bold">{restaurant.currency}{lightboxBill.grand_total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Payment Channel:</span>
                  <span className="text-amber-300 font-bold">{lightboxBill.payment_method}</span>
                </div>
                {lightboxBill.transaction_reference && (
                  <div className="flex justify-between text-slate-400">
                    <span>Reference / UTR:</span>
                    <span className="text-sky-300">{lightboxBill.transaction_reference}</span>
                  </div>
                )}
                {lightboxBill.settled_by && (
                  <div className="flex justify-between text-slate-400">
                    <span>Settled By:</span>
                    <span className="text-slate-200">{lightboxBill.settled_by}</span>
                  </div>
                )}
                {lightboxBill.paid_at && (
                  <div className="flex justify-between text-slate-400">
                    <span>Timestamp:</span>
                    <span className="text-slate-300">{new Date(lightboxBill.paid_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveCameraBill(lightboxBill);
                  setPaymentMethod(lightboxBill.payment_method || 'CASH');
                  setIsCameraOpen(true);
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Retake / Update Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setLightboxBill(null)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Printable Receipt Modal */}
      {inspectingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 text-slate-900 print:shadow-none print:border-none">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-extrabold tracking-tight">Tax Dining Receipt</h3>
              </div>
              <button
                onClick={() => setInspectingBill(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 no-print"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="text-center space-y-1">
              <div className="text-2xl">{restaurant.logo || '🍛'}</div>
              <h2 className="text-base font-extrabold tracking-tight">{restaurant.name}</h2>
              <p className="text-[11px] text-slate-500">{restaurant.address}</p>
              <p className="text-[11px] text-slate-500">Phone: {restaurant.phone}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Bill Number:</span>
                <span className="font-bold">{inspectingBill.bill_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Table:</span>
                <span className="font-bold">Table {inspectingBill.table_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span>{new Date(inspectingBill.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-emerald-700">PAID ({inspectingBill.payment_method})</span>
              </div>
            </div>

            {/* Calculations */}
            <div className="space-y-1.5 border-t border-b border-dashed border-slate-200 py-3 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span>{restaurant.currency}{inspectingBill.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST ({restaurant.tax_rate_percent}%):</span>
                <span>+{restaurant.currency}{inspectingBill.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Service Charge ({restaurant.service_charge_percent}%):</span>
                <span>+{restaurant.currency}{inspectingBill.service_charge_amount.toFixed(2)}</span>
              </div>
              {inspectingBill.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Discount:</span>
                  <span>-{restaurant.currency}{inspectingBill.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                <span>GRAND TOTAL:</span>
                <span className="text-emerald-700 font-extrabold font-mono">
                  {restaurant.currency}{inspectingBill.grand_total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Embedded Transaction Camera Slip Proof */}
            {inspectingBill.transaction_image && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Camera className="w-3.5 h-3.5 text-amber-500" />
                  <span>Verified Transaction Slip Photo</span>
                </div>
                <div className="flex justify-center bg-white p-2 rounded-xl border border-slate-200">
                  <img
                    src={inspectingBill.transaction_image}
                    alt="Transaction Proof Slip"
                    className="max-h-48 rounded-lg object-contain shadow-xs"
                  />
                </div>
                {inspectingBill.transaction_reference && (
                  <p className="text-[10px] text-slate-500 font-mono text-center">
                    Ref: {inspectingBill.transaction_reference}
                  </p>
                )}
              </div>
            )}

            {/* Footer & Buttons */}
            <div className="pt-2 flex items-center gap-2 no-print">
              <button
                type="button"
                onClick={() => setInspectingBill(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
