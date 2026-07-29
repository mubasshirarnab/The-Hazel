'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { receiveShipmentAction } from '@/actions/shipments';
import { toast } from 'sonner';
import { Truck, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';

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

  const [selectedPoId, setSelectedPoId] = useState('');

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
    <Card hoverEffect={false}>
      <CardHeader>
        <CardTitle className="text-base font-bold flex items-center gap-2 text-[#1F3A2E]">
          <Truck className="h-5 w-5 text-[#B08D57]" />
          <span>Receive Shipment Cargo & Stock</span>
        </CardTitle>
        <p className="text-xs text-[#6B6B6B] mt-1 font-medium">
          Select a Purchase Order inside this shipment cargo to receive into Dhaka Central Warehouse stock.
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Select PO to receive</label>
              <Select
                value={selectedPoId}
                onChange={(e) => setSelectedPoId(e.target.value)}
                disabled={isPending}
                required
              >
                <option value="">Select PO...</option>
                {pos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.purchaseOrderNumber} (Value: ৳{Number(p.totalAmountBdt).toLocaleString()})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-widest block">Arrival Date</label>
              <Input
                type="date"
                value={receiveDate}
                onChange={(e) => setReceiveDate(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#E9E7E2]">
            <Button
              type="submit"
              loading={isPending}
              disabled={!selectedPoId}
              variant="primary"
              icon={<Play className="h-4 w-4 shrink-0" />}
            >
              Receive PO Cargo & Add Stocks
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
