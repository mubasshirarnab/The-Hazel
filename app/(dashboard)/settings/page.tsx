import React from 'react';
import { poolConnection } from '@/lib/db/db';
import PageHeader from '@/components/shared/page-header';
import SettingsForm from './settings-form';
import { Settings, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [settings]: any = await poolConnection.query(
    `SELECT setting_key, setting_value, description
     FROM tbl_settings
     WHERE deleted_at IS NULL
     ORDER BY id ASC`
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Business Configuration"
        description="Manage exchange rates, shipping costs, and global operational settings for Hazel."
      />

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-sky-500/20 bg-sky-500/5 text-xs text-sky-300">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-sky-400" />
        <div>
          <strong className="font-semibold text-sky-200">Important:</strong> Changing the RMB exchange rate only affects <em>new</em> purchase orders
          created after saving. Historical POs preserve their original exchange rates for accurate landed cost tracking.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings form */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Settings className="h-4 w-4 text-rose-500" />
              <span>Global System Parameters</span>
            </h3>
            <SettingsForm settings={settings} />
          </div>
        </div>

        {/* Right column: settings documentation */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Where Settings Are Used
            </h4>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li className="flex gap-2">
                <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                <div>
                  <strong className="text-zinc-200">RMB Rate</strong>
                  <p className="text-zinc-500 mt-0.5">
                    Pre-filled when creating Purchase Orders from Chinese suppliers.
                  </p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                <div>
                  <strong className="text-zinc-200">Shipping Rate</strong>
                  <p className="text-zinc-500 mt-0.5">
                    Default air cargo BDT/kg rate pre-filled on new shipments.
                  </p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                <div>
                  <strong className="text-zinc-200">Advance %</strong>
                  <p className="text-zinc-500 mt-0.5">
                    Default advance payment percentage for new customer orders.
                  </p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                <div>
                  <strong className="text-zinc-200">Courier Charge</strong>
                  <p className="text-zinc-500 mt-0.5">
                    Pathao or other courier fee added to order shipping charges.
                  </p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                <div>
                  <strong className="text-zinc-200">Tax Rate</strong>
                  <p className="text-zinc-500 mt-0.5">
                    Applied to taxable sales orders where government VAT/tax applies.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
