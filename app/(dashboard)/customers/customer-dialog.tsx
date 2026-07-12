'use client';

import React, { useState } from 'react';
import { createCustomer, updateCustomer } from '@/actions/customers';
import { toast } from 'sonner';
import { Plus, Edit2, X, Loader2, Save } from 'lucide-react';

interface CustomerData {
  id: number;
  customerName: string;
  phone?: string | null;
  facebookName?: string | null;
  address?: string | null;
  district?: string | null;
  paymentPreference?: string | null;
}

interface CustomerDialogProps {
  customer?: CustomerData; // If provided, mode is EDIT. Otherwise CREATE.
  trigger?: React.ReactNode;
}

export default function CustomerDialog({ customer, trigger }: CustomerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEdit = !!customer;

  // Form states
  const [customerName, setCustomerName] = useState(customer?.customerName || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [facebookName, setFacebookName] = useState(customer?.facebookName || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [district, setDistrict] = useState(customer?.district || '');
  const [paymentPreference, setPaymentPreference] = useState(customer?.paymentPreference || 'Cash on Delivery');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName) {
      toast.error('Customer name is required.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customerName,
        phone: phone || null,
        facebookName: facebookName || null,
        address: address || null,
        district: district || null,
        paymentPreference: paymentPreference || null,
      };

      if (isEdit && customer) {
        const res = await updateCustomer(customer.id, payload);
        if (res.success) {
          toast.success('Customer profile updated successfully!');
          setIsOpen(false);
        }
      } else {
        const res = await createCustomer(payload);
        if (res.success) {
          toast.success('New customer profile created!');
          setIsOpen(false);
          // Reset
          setCustomerName('');
          setPhone('');
          setFacebookName('');
          setAddress('');
          setDistrict('');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save customer.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Slot */}
      {trigger ? (
        <span onClick={() => setIsOpen(true)} className="cursor-pointer">
          {trigger}
        </span>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-colors cursor-pointer shadow-lg shadow-rose-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Customer</span>
        </button>
      )}

      {/* Dialog Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-zinc-100">
                {isEdit ? 'Edit Customer Profile' : 'Register New Customer'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Enter contact and billing preferences for order tracking and audit trails.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Customer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Tasnim Rahman"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-700 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 01712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-700 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Facebook Name</label>
                  <input
                    type="text"
                    placeholder="e.g. tasnim.rahman.99"
                    value={facebookName}
                    onChange={(e) => setFacebookName(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-700 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhaka"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-700 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Payment Preference</label>
                  <select
                    value={paymentPreference}
                    onChange={(e) => setPaymentPreference(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                  >
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Delivery Address</label>
                <textarea
                  rows={3}
                  placeholder="Full shipping address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-700 text-xs focus:outline-none focus:border-rose-500 transition-colors resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80 mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-zinc-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>{isEdit ? 'Update Profile' : 'Save Customer'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
