'use client';

import { Button } from '@/components/ui/button';
import { GitBranch, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const programs = [
  {
    id: '1',
    name: 'token-swap-program',
    status: 'deployed',
    branch: 'main',
    commit: 'a3f9c2d',
    message: 'Add liquidity pool validation',
    deployedAt: '2h ago',
    author: 'alice.sol',
  },
  {
    id: '2',
    name: 'nft-marketplace',
    status: 'building',
    branch: 'develop',
    commit: 'b7e4f1a',
    message: 'Implement royalty distribution',
    deployedAt: '5h ago',
    author: 'bob.sol',
  },
  {
    id: '3',
    name: 'staking-protocol',
    status: 'deployed',
    branch: 'main',
    commit: 'c9d2e8b',
    message: 'Update reward calculation',
    deployedAt: '1d ago',
    author: 'carol.sol',
  },
  {
    id: '4',
    name: 'governance-dao',
    status: 'failed',
    branch: 'feature/voting',
    commit: 'd1a5c3f',
    message: 'Add proposal threshold',
    deployedAt: '2d ago',
    author: 'dave.sol',
  },
];

export function ProgramsList() {
  return (
    <section className="border border-border bg-card">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-mono text-foreground">
            Programs
          </h2>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono">
            New Program
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {programs.map((program) => (
          <div
            key={program.id}
            className="p-6 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold font-mono text-foreground">
                    {program.name}
                  </h3>
                  <StatusBadge status={program.status} />
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="w-4 h-4" />
                    <span className="font-mono">{program.branch}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono">{program.commit}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{program.deployedAt}</span>
                  </div>
                </div>

                <p className="text-sm text-foreground mb-2">
                  {program.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  by {program.author}
                </p>
              </div>

              <Button variant="ghost" size="sm" className="font-mono">
                Deploy
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    deployed: {
      icon: CheckCircle2,
      text: 'Deployed',
      className: 'bg-success/20 text-success border-success/30',
    },
    building: {
      icon: Clock,
      text: 'Building',
      className: 'bg-primary/20 text-primary border-primary/30',
    },
    failed: {
      icon: AlertCircle,
      text: 'Failed',
      className: 'bg-destructive/20 text-destructive border-destructive/30',
    },
  };

  const { icon: Icon, text, className } = config[status as keyof typeof config];

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 border text-xs font-mono ${className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{text}</span>
    </div>
  );
}
