'use client';

import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { ProgramsList } from '@/components/dashboard/programs-list';
import { ActivityFeed } from '@/components/dashboard/activity-feed';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">
            Overview
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor your Solana programs and deployments
          </p>
        </div>
        <QuickActions />
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProgramsList />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
