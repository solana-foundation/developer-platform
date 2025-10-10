'use client';

import * as React from 'react';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { ProgramsList } from '@/components/dashboard/programs-list';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { CreateProgramDialog } from '@/components/dashboard/create-program-dialog';
import { ProgramDetailDialog } from '@/components/dashboard/program-detail-dialog';
import type { Program } from '@/lib/types/program';
import { mutate } from 'swr';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedProgram, setSelectedProgram] = React.useState<Program | null>(
    null,
  );

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleProgramClick = (program: Program) => {
    setSelectedProgram(program);
    setDetailDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    // Refresh programs list after successful creation
    if (session?.accessToken) {
      mutate(['programs', session.accessToken]);
      mutate(['program-stats', session.accessToken]);
    }
  };

  return (
    <>
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
          <QuickActions onCreateClick={handleCreateClick} />
        </div>

        <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="bg-card border border-border px-4 py-2 shadow-lg">
                  <p className="text-sm font-mono text-muted-foreground">
                    Coming Soon
                  </p>
                </div>
              </div>
              <div className="pointer-events-none opacity-40">
                <ProgramsList
                  onCreateClick={handleCreateClick}
                  onProgramClick={handleProgramClick}
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="bg-card border border-border px-4 py-2 shadow-lg">
                  <p className="text-sm font-mono text-muted-foreground">
                    Coming Soon
                  </p>
                </div>
              </div>
              <div className="pointer-events-none opacity-40">
                <section className="border border-border bg-card">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold font-mono text-foreground">
                      Deployments
                    </h2>
                  </div>
                  <div className="p-12 text-center">
                    <p className="text-muted-foreground">
                      Track your deployment history and manage releases
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>
      </div>

      <CreateProgramDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <ProgramDetailDialog
        program={selectedProgram}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </>
  );
}
