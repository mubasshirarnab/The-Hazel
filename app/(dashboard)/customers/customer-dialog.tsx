'use client';

import React, { useState } from 'react';
import { createCustomer, updateCustomer } from '@/actions/customers';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Select, Textarea } from '@/components/ui/input';

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
  customer?: CustomerData;
  trigger?: React.ReactNode;
}

export default function CustomerDialog({ customer, trigger }: CustomerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEdit = !!customer;

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
      {trigger ? (
        <span onClick={() => setIsOpen(true)} className="cursor-pointer">
          {trigger}
        </span>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          variant="primary"
          icon={<Plus className="h-4 w-4 shrink-0" />}
        >
          New Customer
        </Button>
      )}

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={isEdit ? 'Edit Customer Profile' : 'Register New Customer'}
        description="Enter contact and billing preferences for order tracking and audit trails."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Customer Name</label>
              <Input
                placeholder="e.g. Tasnim Rahman"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Phone Number</label>
              <Input
                placeholder="e.g. 01712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Facebook Name</label>
              <Input
                placeholder="e.g. tasnim.rahman.99"
                value={facebookName}
                onChange={(e) => setFacebookName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">District</label>
              <Input
                placeholder="e.g. Dhaka"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Payment Preference</label>
              <Select
                value={paymentPreference}
                onChange={(e) => setPaymentPreference(e.target.value)}
                disabled={loading}
              >
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Delivery Address</label>
            <Textarea
              rows={3}
              placeholder="Full shipping address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9E7E2] mt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              variant="primary"
              size="sm"
            >
              {isEdit ? 'Update Profile' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
