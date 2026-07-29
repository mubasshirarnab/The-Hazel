'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createShipment } from '@/actions/shipments';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { formatBDT } from '@/components/shared/currency';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';

interface POOption {
  id: number;
  purchaseOrderNumber: string;
  purchaseDate: Date | string;
  totalAmountBdt: string;
}

interface ShipmentFormProps {
  purchaseOrders: POOption[];
}

export default function ShipmentForm({ purchaseOrders }: ShipmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [departureDate, setDepartureDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [weightKg, setWeightKg] = useState('0');
  const [shippingRatePerKg, setShippingRatePerKg] = useState('750');
  const [notes, setNotes] = useState('');

  const [selectedPoIds, setSelectedPoIds] = useState<number[]>([]);

  const handleTogglePo = (id: number) => {
    if (selectedPoIds.includes(id)) {
      setSelectedPoIds(selectedPoIds.filter((poId) => poId !== id));
    } else {
      setSelectedPoIds([...selectedPoIds, id]);
    }
  };

  const estShippingCost = (parseFloat(weightKg) || 0) * (parseFloat(shippingRatePerKg) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPoIds.length === 0) {
      toast.error('Please select at least one purchase order included in this cargo shipment.');
      return;
    }

    const wt = parseFloat(weightKg);
    const rate = parseFloat(shippingRatePerKg);

    if (isNaN(wt) || wt < 0) {
      toast.error('Please enter a valid weight.');
      return;
    }

    if (isNaN(rate) || rate < 0) {
      toast.error('Please enter a valid shipping rate.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        departureDate: departureDate || null,
        weightKg: wt,
        shippingRatePerKg: rate,
        notes: notes || null,
        poIds: selectedPoIds,
      };

      const res = await createShipment(payload);

      if (res.success) {
        toast.success('Shipment flight cargo successfully created!');
        router.push('/shipments');
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create shipment.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl animate-fade-in">
      {/* 1. Shipment cargo parameters */}
      <Card hoverEffect={false}>
        <CardHeader>
          <CardTitle>1. Air Cargo Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider block">Departure Date</label>
              <Input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider block">Weight (KG)</label>
              <Input
                type="number"
                step="0.01"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1F3A2E] uppercase tracking-wider block">Shipping Rate (BDT/KG)</label>
              <Input
                type="number"
                value={shippingRatePerKg}
                onChange={(e) => setShippingRatePerKg(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="p-3 bg-[#F7F6F3] border border-[#E9E7E2] rounded-[10px] flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>Calculated Air Freight Bill:</span>
            <span className="font-bold text-[#1A1A1A] font-mono">{formatBDT(estShippingCost)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. PO Checkboxes */}
      <Card hoverEffect={false}>
        <CardHeader>
          <CardTitle>2. Associate Purchase Orders (POs)</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {purchaseOrders.length === 0 ? (
            <div className="p-6 rounded-[12px] border border-dashed border-[#E9E7E2] text-center text-[#9E9E9E] text-xs">
              No active placed/partially received Purchase Orders available. Make sure you place a PO first before packing it in a cargo shipment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchaseOrders.map((po) => {
                const isChecked = selectedPoIds.includes(po.id);
                const formattedDate = new Date(po.purchaseDate).toLocaleDateString();

                return (
                  <div
                    key={po.id}
                    onClick={() => handleTogglePo(po.id)}
                    className={`p-4 rounded-[12px] border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                      isChecked
                        ? 'bg-[#1F3A2E]/10 border-[#1F3A2E]/30 text-[#1F3A2E]'
                        : 'bg-[#FAFAF8] border-[#E9E7E2] hover:border-[#B08D57]/40 text-[#1A1A1A]'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="font-mono text-xs font-bold text-[#1F3A2E] block">
                        {po.purchaseOrderNumber}
                      </span>
                      <span className="text-[10px] text-[#6B6B6B] block font-medium">
                        Date: {formattedDate} — Value: {formatBDT(po.totalAmountBdt)}
                      </span>
                    </div>
                    
                    <div className={`h-4.5 w-4.5 rounded-[6px] border flex items-center justify-center shrink-0 ${
                      isChecked ? 'border-[#1F3A2E] bg-[#1F3A2E] text-white' : 'border-[#E9E7E2]'
                    }`}>
                      {isChecked && <span className="text-[9px] font-bold">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card hoverEffect={false}>
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider">Shipment Notes</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Textarea
            rows={3}
            placeholder="e.g. flight number cargo manifest references..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
          />
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link href="/shipments">
          <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4 shrink-0" />}>
            Cancel
          </Button>
        </Link>

        <Button
          type="submit"
          loading={loading}
          disabled={selectedPoIds.length === 0}
          variant="primary"
          icon={<Save className="h-4 w-4 shrink-0" />}
        >
          Save Shipment Cargo
        </Button>
      </div>
    </form>
  );
}
