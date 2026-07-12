'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { receiveShipmentAction } from '@/actions/shipments';
import { toast } from 'sonner';
import { Truck, Loader2, Play } from 'lucide-react';

interface AssociatedPO {
  id: number;
  purchaseOrderNumber: string;
  totalAmountBdt: string;
}

interface ReceiveFormProps {
  shipmentId: number;
  pos: AssociatedPO[];
}

export default function ReceiveForm({ shipmentId, pos }: ReceiveFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Selected PO
  const [selectedPoId, setSelectedPoId] = useState('');

  // Arrival Date
  const [receiveDate, setReceiveDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPoId) {
      toast.error('Please select a Purchase Order to receive.');
      return;
    }

    if (!receiveDate) {
      toast.error('Please specify the arrival receipt date.');
      return;
    }

    const po = pos.find((p) => p.id.toString() === selectedPoId);
    if (!po) return;

    if (confirm(`Are you sure you want to receive PO "${po.purchaseOrderNumber}"? This will allocate cargo shipping fees and add products directly to warehouse stock.`)) {
      startTransition(async () => {
        try {
          const res = await receiveShipmentAction(shipmentId, Number(selectedPoId), receiveDate);
          if (res.success) {
            toast.success(`Purchase Order ${po.purchaseOrderNumber} received successfully!`);
            setSelectedPoId('');
            router.refresh();
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to process PO receipt.');
        }
      });
    }
  };

  if (pos.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-6">
      <div>
        <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <Truck className="h-5 w-5 text-rose-500" />
          <span>Receive Shipment Cargo & Stock</span>
        </h4>
        <p className="text-xs text-zinc-400 mt-1">
          Select a Purchase Order inside this shipment cargo to receive into Dhaka Central Warehouse stock.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Select PO */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Select PO to receive</label>
          <select
            value={selectedPoId}
            onChange={(e) => setSelectedPoId(e.target.value)}
            disabled={isPending}
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-rose-500 transition-colors"
            required
          >
            <option value="">Select PO...</option>
            {pos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.purchaseOrderNumber} (Value: ৳{Number(p.totalAmountBdt).toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Arrival Date */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Arrival Date</label>
          <input
            type="date"
            value={receiveDate}
            onChange={(e) => setReceiveDate(e.target.value)}
            disabled={isPending}
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-rose-500 transition-colors"
            required
          />
        </div>
      </div>

      {/* Action Submit */}
      <div className="flex justify-end pt-4 border-t border-zinc-800/80">
        <button
          type="submit"
          disabled={isPending || !selectedPoId}
          className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Receiving stocks...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Receive PO Cargo & Add Stocks</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
