'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CopyButton } from '@/components/common/copy-button';
import type { Program } from '@/lib/types/program';
import { formatDistanceToNow } from 'date-fns';
import { Clock, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ProgramDetailDialogProps {
  program: Program | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProgramDetailDialog({
  program,
  open,
  onOpenChange,
}: ProgramDetailDialogProps) {
  if (!program) return null;

  const explorerUrl = `https://explorer.solana.com/address/${program.programAddress}?cluster=${program.cluster}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="font-mono flex items-center gap-3">
            {program.name}
            <StatusBadge status={program.status} />
          </DialogTitle>
          <DialogDescription>{program.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Program Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Program Address</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {program.programAddress}
                </code>
                <CopyButton value={program.programAddress} />
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Cluster</span>
                <div className="mt-1">
                  <ClusterBadge cluster={program.cluster} />
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="mt-1 text-sm font-medium">{program.status}</div>
              </div>
            </div>

            {program.deployedAt && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deployed</span>
                  <span className="font-mono">
                    {formatDistanceToNow(new Date(program.deployedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </>
            )}

            {program.expiresAt && !program.claimedAt && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="font-mono text-orange-600">
                    {formatDistanceToNow(new Date(program.expiresAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </>
            )}

            {program.claimedAt && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Claimed</span>
                    <span className="font-mono">
                      {formatDistanceToNow(new Date(program.claimedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {program.claimedByAuthority && (
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1">
                        {program.claimedByAuthority}
                      </code>
                      <CopyButton value={program.claimedByAuthority} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Deployment Logs */}
          {program.deploymentLogs && program.deploymentLogs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Deployment Logs</h4>
              <ScrollArea className="h-[300px] border rounded-md bg-muted/30">
                <div className="p-4 space-y-2 font-mono text-xs">
                  {program.deploymentLogs.map((log, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <LogLevelIcon level={log.level} />
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
    <Badge variant="outline" className={`${className} font-mono`}>
      {text}
    </Badge>
  );
}

function LogLevelIcon({ level }: { level: 'info' | 'warn' | 'error' }) {
  const config = {
    info: { icon: CheckCircle2, className: 'text-blue-500' },
    warn: { icon: AlertCircle, className: 'text-orange-500' },
    error: { icon: AlertCircle, className: 'text-destructive' },
  };

  const { icon: Icon, className } = config[level];
  return <Icon className={`w-4 h-4 ${className} flex-shrink-0`} />;
}
