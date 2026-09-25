import React, { useState } from 'react';
import { Restaurant } from '../../types';
import { api } from '../../services/apiClient';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Building,
  Table as TableIcon,
  Layers,
  Utensils,
  Users,
  QrCode,
  Eye,
  Rocket,
} from 'lucide-react';

interface OnboardingWizardProps {
  restaurant: Restaurant;
  onFinish: (updated: Restaurant) => void;
}

const STEPS = [
  { step: 1, title: 'Restaurant Details', desc: 'Basic info & branding', icon: <Building className="w-4 h-4" /> },
  { step: 2, title: 'Create Tables', desc: 'Dining layout & seating', icon: <TableIcon className="w-4 h-4" /> },
  { step: 3, title: 'Menu Categories', desc: 'Organize cuisine courses', icon: <Layers className="w-4 h-4" /> },
  { step: 4, title: 'Add Menu Items', desc: 'Dishes, pricing & veg status', icon: <Utensils className="w-4 h-4" /> },
  { step: 5, title: 'Staff Accounts', desc: 'Kitchen & Waiter logins', icon: <Users className="w-4 h-4" /> },
  { step: 6, title: 'Generate QR Codes', desc: 'Printable table stands', icon: <QrCode className="w-4 h-4" /> },
  { step: 7, title: 'Review Setup', desc: 'Audit menu & floor plan', icon: <Eye className="w-4 h-4" /> },
  { step: 8, title: 'Go Live!', desc: 'Enable customer orders', icon: <Rocket className="w-4 h-4" /> },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ restaurant, onFinish }) => {
  const [currentStep, setCurrentStep] = useState(restaurant.onboarding_step || 1);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleNextStep = async () => {
    const next = Math.min(8, currentStep + 1);
    setIsUpdating(true);
    try {
      const isLive = next === 8;
      const updated = await api.updateOnboarding(restaurant.id, next, isLive);
      setCurrentStep(next);
      if (next === 8) {
        onFinish(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating step');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const progressPct = Math.round((currentStep / 8) * 100);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Restaurant Launch Wizard
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Follow the 8 setup milestones to launch digital QR ordering inside {restaurant.name}.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">
            Step {currentStep} of 8: {STEPS[currentStep - 1].title}
          </span>
          <span className="font-mono font-bold text-slate-600">{progressPct}% Complete</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            style={{ width: `${progressPct}%` }}
            className="h-full bg-slate-900 transition-all duration-300"
          />
        </div>
      </div>

      {/* Step Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STEPS.map((s) => {
          const isDone = currentStep > s.step;
          const isCurrent = currentStep === s.step;

          return (
            <div
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                isCurrent
                  ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                  : isDone
                  ? 'border-emerald-200 bg-emerald-50/60 text-slate-800'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold">
                  {isDone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : `0${s.step}`}
                </span>
                <div className={isCurrent ? 'text-amber-400' : 'text-slate-400'}>{s.icon}</div>
              </div>
              <div className="text-xs font-bold truncate">{s.title}</div>
              <div
                className={`text-[10px] mt-0.5 truncate ${
                  isCurrent ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {s.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Detail Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-bold">
            {STEPS[currentStep - 1].icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Milestone {currentStep}: {STEPS[currentStep - 1].title}
            </h3>
            <p className="text-xs text-slate-500">{STEPS[currentStep - 1].desc}</p>
          </div>
        </div>

        {/* Content depending on step */}
        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          {currentStep === 1 && (
            <p>
              Your restaurant <strong>{restaurant.name}</strong> is registered under{' '}
              {restaurant.owner_name}. Make sure taxes ({restaurant.tax_rate_percent}%) and currency (
              {restaurant.currency}) are correctly assigned in Restaurant Settings.
            </p>
          )}

          {currentStep === 2 && (
            <p>
              Tables represent physical dining spots inside your establishment. Each table is
              assigned to a section (Floor 1, Rooftop, Patio) and seating capacity.
            </p>
          )}

          {currentStep === 3 && (
            <p>
              Menu categories structure your dining options (e.g. Starters, Main Course, Breads,
              Beverages). They appear as smooth filter tabs on customer mobile phones.
            </p>
          )}

          {currentStep === 4 && (
            <p>
              Add individual dishes with precise prices, descriptions, and dietary indicators
              (Vegetarian / Non-Vegetarian). You can also configure modifier groups for sizes and
              spice levels.
            </p>
          )}

          {currentStep === 5 && (
            <p>
              Create staff accounts with Role-Based Access Control (RBAC): Owner, Manager, Waiter, and
              Kitchen Display. Each role accesses only their dedicated operational screen.
            </p>
          )}

          {currentStep === 6 && (
            <p>
              Every table has a unique cryptographic token (e.g. <code>T4CR</code>). You can
              download high-resolution printable table stands directly from the Tables tab.
            </p>
          )}

          {currentStep === 7 && (
            <p>
              Review all items, ensure sold-out flags are cleared, and test scanning a sample table
              stand to experience the customer mobile app before public launch.
            </p>
          )}

          {currentStep === 8 && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
              <h4 className="font-bold flex items-center gap-1.5 text-sm">
                <Rocket className="w-4 h-4 text-emerald-600" />
                <span>Ready to Launch In-Restaurant QR Ordering!</span>
              </h4>
              <p className="text-xs">
                Clicking "Go Live" enables live dining orders. Guests scanning table QR codes can
                place orders that beam straight to the kitchen.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleNextStep}
            disabled={isUpdating}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <span>{currentStep === 8 ? 'Confirm & Go Live' : 'Next Milestone'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
