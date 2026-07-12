'use client';

import React, { useState } from 'react';
import { updateSettings } from '@/actions/settings';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

interface SettingRow {
  setting_key: string;
  setting_value: string;
  description: string;
}

interface SettingsFormProps {
  settings: SettingRow[];
}

const SETTING_META: Record<string, { label: string; unit?: string; step?: string; description?: string }> = {
  current_rmb_rate: {
    label: 'Current RMB → BDT Exchange Rate',
    unit: 'BDT per ¥1',
    step: '0.0001',
    description: 'Used when creating new purchase orders. Historical POs keep their original rate.',
  },
  shipping_rate: {
    label: 'Default Air Cargo Rate',
    unit: 'BDT per kg',
    step: '0.01',
    description: 'Used as default when creating shipment cargo records.',
  },
  default_advance_percentage: {
    label: 'Default Customer Advance Payment',
    unit: '%',
    step: '1',
    description: 'Advance payment percentage pre-filled for new customer orders.',
  },
  courier_charge: {
    label: 'Pathao / Courier Delivery Charge',
    unit: 'BDT per delivery',
    step: '0.01',
    description: 'Default delivery fee charged to customers for Pathao or courier service.',
  },
  tax_rate: {
    label: 'Applicable Tax Rate',
    unit: '%',
    step: '0.01',
    description: 'Tax rate applied to sales orders where applicable.',
  },
};

export default function SettingsForm({ settings }: SettingsFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {};
    settings.forEach((s) => {
      obj[s.setting_key] = s.setting_value || '0';
    });
    return obj;
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await updateSettings({
        current_rmb_rate: parseFloat(values.current_rmb_rate) || 0,
        shipping_rate: parseFloat(values.shipping_rate) || 0,
        default_advance_percentage: parseFloat(values.default_advance_percentage) || 0,
        courier_charge: parseFloat(values.courier_charge) || 0,
        tax_rate: parseFloat(values.tax_rate) || 0,
      });

      if (res.success) {
        toast.success('Business settings saved successfully!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {settings.map((setting) => {
        const meta = SETTING_META[setting.setting_key];
        if (!meta) return null;

        return (
          <div
            key={setting.setting_key}
            className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-3"
          >
            <div>
              <label className="text-sm font-semibold text-zinc-200 block">{meta.label}</label>
              {meta.description && (
                <p className="text-[11px] text-zinc-500 mt-0.5">{meta.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  step={meta.step || '0.01'}
                  min="0"
                  value={values[setting.setting_key] || ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [setting.setting_key]: e.target.value }))
                  }
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 font-mono text-sm focus:outline-none focus:border-rose-500 transition-colors"
                  required
                />
              </div>
              {meta.unit && (
                <span className="text-xs text-zinc-500 font-semibold whitespace-nowrap">
                  {meta.unit}
                </span>
              )}
            </div>
          </div>
        );
      })}

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-zinc-50 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Save Business Settings</span>
        </button>
      </div>
    </form>
  );
}
