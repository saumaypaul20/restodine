import React, { useState } from 'react';
import { Restaurant } from '../../types';
import { api } from '../../services/apiClient';
import { Save, Check, Settings2, ShieldCheck, Sparkles, Camera } from 'lucide-react';

interface RestaurantSettingsViewProps {
  restaurant: Restaurant;
  onUpdate: (updated: Restaurant) => void;
}

export const RestaurantSettingsView: React.FC<RestaurantSettingsViewProps> = ({
  restaurant,
  onUpdate,
}) => {
  const [name, setName] = useState(restaurant.name);
  const [ownerName, setOwnerName] = useState(restaurant.owner_name);
  const [phone, setPhone] = useState(restaurant.phone);
  const [email, setEmail] = useState(restaurant.email);
  const [address, setAddress] = useState(restaurant.address);
  const [description, setDescription] = useState(restaurant.description);
  const [logo, setLogo] = useState(restaurant.logo || '🍛');
  const [currency, setCurrency] = useState(restaurant.currency || '₹');
  const [taxRate, setTaxRate] = useState(restaurant.tax_rate_percent.toString());
  const [serviceCharge, setServiceCharge] = useState(restaurant.service_charge_percent.toString());
  const [enableTransactionCamera, setEnableTransactionCamera] = useState(
    restaurant.enable_transaction_camera ?? true
  );
  const [requireTransactionCamera, setRequireTransactionCamera] = useState(
    restaurant.require_transaction_camera ?? false
  );
  const [isLive, setIsLive] = useState(restaurant.is_live);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await api.updateSettings(restaurant.id, {
        name,
        owner_name: ownerName,
        phone,
        email,
        address,
        description,
        logo,
        currency,
        tax_rate_percent: Number(taxRate) || 0,
        service_charge_percent: Number(serviceCharge) || 0,
        enable_transaction_camera: enableTransactionCamera,
        require_transaction_camera: requireTransactionCamera,
        is_live: isLive,
      });
      onUpdate(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Restaurant Profile & Operational Taxes
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure branding, address, tax structure, and live dining ordering status.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Restaurant settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-5">
        {/* Brand Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Brand Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emoji Logo / Icon
              </label>
              <input
                type="text"
                required
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Owner Contact Name
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physical Restaurant Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Taxes & Currency */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Taxes & Currency Rates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Configured GST Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                required
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Service Charge (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                required
                value={serviceCharge}
                onChange={(e) => setServiceCharge(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Transaction Proof by Camera Configuration */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Transaction Proof & Camera Configuration
            </h3>
          </div>
          <p className="text-[11px] text-slate-500">
            Configure camera capture of transaction proofs (physical cash receipts, EDC / POS card charge slips, or customer UPI payment confirmations) during bill settlement.
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Enable Camera Capture for Transactions</span>
                  {enableTransactionCamera && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                      Enabled
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Adds camera shutter & live viewfinder to capture receipt image when settling bills
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEnableTransactionCamera(!enableTransactionCamera)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  enableTransactionCamera ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    enableTransactionCamera ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {enableTransactionCamera && (
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Require Image Proof for Settlement</span>
                    {requireTransactionCamera && (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        Mandatory
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Staff must snap or upload a photo of the transaction slip before marking a bill as paid
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setRequireTransactionCamera(!requireTransactionCamera)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    requireTransactionCamera ? 'bg-rose-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      requireTransactionCamera ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Status Switch */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900">Digital Ordering Live Mode</div>
            <p className="text-[11px] text-slate-500">Allow customers to scan table QR codes and submit orders</p>
          </div>

          <button
            type="button"
            onClick={() => setIsLive(!isLive)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              isLive ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isLive ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
