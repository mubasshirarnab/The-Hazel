import React from 'react';
import { poolConnection } from '@/lib/db/db';
import PageHeader from '@/components/shared/page-header';
import SettingsForm from './settings-form';
import { Settings, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [settings]: any = await poolConnection.query(
    `SELECT setting_key, setting_value, description
     FROM tbl_settings
     WHERE deleted_at IS NULL
     ORDER BY id ASC`
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Business Configuration"
        description="Manage exchange rates, shipping costs, and global operational settings for Hazel."
      />

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-[12px] border border-[#B08D57]/20 bg-[#B08D57]/10 text-xs text-[#6A4E3B]">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#B08D57]" />
        <div>
          <strong className="font-semibold text-[#1F3A2E]">Important:</strong> Changing the RMB exchange rate only affects <em>new</em> purchase orders
          created after saving. Historical POs preserve their original exchange rates for accurate landed cost tracking.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings form */}
        <div className="lg:col-span-2">
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest flex items-center gap-2">
                <Settings className="h-4 w-4 text-[#B08D57]" />
                <span>Global System Parameters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <SettingsForm settings={settings} />
            </CardContent>
          </Card>
        </div>

        {/* Right column: settings documentation */}
        <div className="lg:col-span-1 space-y-4">
          <Card hoverEffect={false}>
            <CardHeader>
              <CardTitle className="text-xs font-bold text-[#1F3A2E] uppercase tracking-widest">
                Where Settings Are Used
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <ul className="space-y-3 text-xs text-[#6B6B6B]">
                <li className="flex gap-2">
                  <span className="text-[#B08D57] font-bold shrink-0 mt-0.5">•</span>
                  <div>
                    <strong className="text-[#1A1A1A]">RMB Rate</strong>
                    <p className="text-[#6B6B6B] mt-0.5">
                      Pre-filled when creating Purchase Orders from Chinese suppliers.
                    </p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#B08D57] font-bold shrink-0 mt-0.5">•</span>
                  <div>
                    <strong className="text-[#1A1A1A]">Shipping Rate</strong>
                    <p className="text-[#6B6B6B] mt-0.5">
                      Default air cargo BDT/kg rate pre-filled on new shipments.
                    </p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#B08D57] font-bold shrink-0 mt-0.5">•</span>
                  <div>
                    <strong className="text-[#1A1A1A]">Advance %</strong>
                    <p className="text-[#6B6B6B] mt-0.5">
                      Default advance payment percentage for new customer orders.
                    </p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#B08D57] font-bold shrink-0 mt-0.5">•</span>
                  <div>
                    <strong className="text-[#1A1A1A]">Courier Charge</strong>
                    <p className="text-[#6B6B6B] mt-0.5">
                      Pathao or other courier fee added to order shipping charges.
                    </p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#B08D57] font-bold shrink-0 mt-0.5">•</span>
                  <div>
                    <strong className="text-[#1A1A1A]">Tax Rate</strong>
                    <p className="text-[#6B6B6B] mt-0.5">
                      Applied to taxable sales orders where government VAT/tax applies.
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
