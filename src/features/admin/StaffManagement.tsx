import React, { useState, useEffect } from 'react';
import { UserRole, Restaurant } from '../../types';
import { api } from '../../services/apiClient';
import { UserCheck, Plus, Shield, User, ChefHat, Users, X } from 'lucide-react';

interface StaffManagementProps {
  restaurant: Restaurant;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ restaurant }) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('WAITER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      const data = await api.getStaff(restaurant.id);
      setStaff(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [restaurant.id]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setIsSubmitting(true);
    try {
      const created = await api.createStaff(restaurant.id, {
        name,
        email,
        password,
        role,
      });
      setStaff([...staff, created]);
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to add staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'OWNER':
        return (
          <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Owner (All Access)</span>
          </span>
        );
      case 'MANAGER':
        return (
          <span className="bg-sky-100 text-sky-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            <span>Manager</span>
          </span>
        );
      case 'WAITER':
        return (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>Waiter</span>
          </span>
        );
      case 'KITCHEN':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ChefHat className="w-3 h-3" />
            <span>Kitchen Display</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Staff & Role-Based Access Control (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authenticated accounts with dedicated access permissions for Kitchen, Waiters, and Managers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
          <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>OWNER</span>
          </div>
          <p className="text-[11px] text-slate-500">Unrestricted full control over settings, onboarding, finances, and staff.</p>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
          <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>MANAGER</span>
          </div>
          <p className="text-[11px] text-slate-500">Can manage tables, menu items, live orders, billing, and staff requests.</p>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
          <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>WAITER</span>
          </div>
          <p className="text-[11px] text-slate-500">Front-of-house table calls, order delivery, and table billing requests.</p>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
          <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
            <ChefHat className="w-3.5 h-3.5 text-emerald-600" />
            <span>KITCHEN</span>
          </div>
          <p className="text-[11px] text-slate-500">Dedicated KDS station for cooking, marking dishes ready, and kitchen queue.</p>
        </div>
      </div>

      {/* Staff List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading staff...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Login Email</th>
                  <th className="py-3 px-4">Role & Permissions</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-mono text-[11px] text-slate-600">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Staff Account</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@curryroom.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  <option value="WAITER">WAITER (Orders & Guest Requests)</option>
                  <option value="KITCHEN">KITCHEN (KDS Station Only)</option>
                  <option value="MANAGER">MANAGER (Menu, Tables, Staff)</option>
                  <option value="OWNER">OWNER (Full Unrestricted Access)</option>
                </select>
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
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
