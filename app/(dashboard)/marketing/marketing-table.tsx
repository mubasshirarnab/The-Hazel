'use client';

import React from 'react';
import DataTable from '@/components/shared/data-table';
import { columns } from './columns';

interface MarketingTableProps {
  campaigns: any[];
  platforms: any[];
}

export default function MarketingTable({ campaigns, platforms }: MarketingTableProps) {
  return (
    <DataTable
      columns={columns(platforms)}
      data={campaigns}
      searchKey="campaign_name"
      searchPlaceholder="Search campaigns by name..."
    />
  );
}
