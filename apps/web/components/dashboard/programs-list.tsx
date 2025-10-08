'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, AlertCircle, Server, Copy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchPrograms } from '@/lib/api/programs';
import type { Program } from '@/lib/types/program';
import { CopyButton } from '@/components/common/copy-button';
import { formatDistanceToNow } from 'date-fns';

interface ProgramsListProps {
  onCreateClick?: () => void;
  onProgramClick?: (program: Program) => void;
}

export function ProgramsList({
  onCreateClick,
  onProgramClick,
}: ProgramsListProps) {
  const { data: session } = useSession();
  const {
    data: programs,
    error,
    isLoading,
  } = useSWR(
    session?.accessToken ? ['programs', session.accessToken] : null,
    ([_, token]) => fetchPrograms(token as string, 10, 0),
    { refreshInterval: 10000 }, // Refresh every 10 seconds
  );

  return (
    <section className="border border-border bg-card">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-mono text-foreground">
            Programs
          </h2>
          <Button
            onClick={onCreateClick}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono"
          >
            New Program
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6">
                <Skeleton className="h-6 w-48 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </>
        )}

        {error && (
          <div className="p-6 text-center text-muted-foreground">
            Failed to load programs. Please try again.
          </div>
        )}

        {!isLoading && programs && programs.length === 0 && (
          <div className="p-12 text-center">
            <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No programs yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first Solana program deployment
            </p>
            <Button
              onClick={onCreateClick}
              variant="outline"
              className="font-mono"
            >
              Create Program
            </Button>
          </div>
        )}

        {programs?.map((program) => (
          <div
            key={program.id}
            className="p-6 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onProgramClick?.(program)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold font-mono text-foreground">
                    {program.name}
                  </h3>
                  <StatusBadge status={program.status} />
                  <ClusterBadge cluster={program.cluster} />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {program.programAddress.slice(0, 8)}...
                    {program.programAddress.slice(-6)}
                  </code>
                  <CopyButton value={program.programAddress} />
                  {program.deployedAt && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatDistanceToNow(new Date(program.deployedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {program.description && (
                  <p className="text-sm text-foreground">
                    {program.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { icon: typeof CheckCircle2; text: string; className: string }
  > = {
    pending: {
      icon: Clock,
      text: 'Pending',
      className: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    },
    deployed: {
      icon: CheckCircle2,
      text: 'Deployed',
      className: 'bg-success/20 text-success border-success/30',
    },
    claimed: {
      icon: CheckCircle2,
      text: 'Claimed',
      className: 'bg-primary/20 text-primary border-primary/30',
    },
    expired: {
      icon: AlertCircle,
      text: 'Expired',
      className: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
    },
    failed: {
      icon: AlertCircle,
      text: 'Failed',
      className: 'bg-destructive/20 text-destructive border-destructive/30',
    },
  };

  const statusConfig = config[status] || config.pending;
  const { icon: Icon, text, className } = statusConfig;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 border text-xs font-mono ${className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{text}</span>
    </div>
  );
}

function ClusterBadge({
  cluster,
}: {
  cluster: 'devnet' | 'testnet' | 'mainnet-beta';
}) {
  const config = {
    devnet: {
      text: 'Devnet',
      className: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    },
    testnet: {
      text: 'Testnet',
      className: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
    },
    'mainnet-beta': {
      text: 'Mainnet',
      className: 'bg-green-500/20 text-green-600 border-green-500/30',
    },
  };

  const { text, className } = config[cluster];

  return (
    <div className={`px-2 py-1 border text-xs font-mono ${className}`}>
      {text}
    </div>
  );
}
