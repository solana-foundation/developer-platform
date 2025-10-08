import { GitCommit, Rocket, Coins, Settings } from 'lucide-react';

const activities = [
  {
    id: '1',
    type: 'deploy',
    message: 'Deployed token-swap-program to mainnet',
    user: 'alice.sol',
    time: '2h ago',
  },
  {
    id: '2',
    type: 'airdrop',
    message: 'Started Community Rewards Q1 airdrop',
    user: 'bob.sol',
    time: '4h ago',
  },
  {
    id: '3',
    type: 'commit',
    message: 'Pushed 3 commits to nft-marketplace',
    user: 'carol.sol',
    time: '6h ago',
  },
  {
    id: '4',
    type: 'deploy',
    message: 'Deployed staking-protocol to devnet',
    user: 'dave.sol',
    time: '8h ago',
  },
  {
    id: '5',
    type: 'settings',
    message: 'Updated program configuration',
    user: 'alice.sol',
    time: '12h ago',
  },
  {
    id: '6',
    type: 'airdrop',
    message: 'Completed Early Adopter Bonus airdrop',
    user: 'bob.sol',
    time: '1d ago',
  },
];

export function ActivityFeed() {
  return (
    <section className="border border-border bg-card sticky top-6">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold font-mono text-foreground">
          Recent Activity
        </h2>
      </div>

      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex gap-3">
              <ActivityIcon type={activity.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground mb-1">
                  {activity.message}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{activity.user}</span>
                  <span>•</span>
                  <span>{activity.time}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const config = {
    deploy: { icon: Rocket, className: 'text-primary' },
    airdrop: { icon: Coins, className: 'text-success' },
    commit: { icon: GitCommit, className: 'text-foreground' },
    settings: { icon: Settings, className: 'text-muted-foreground' },
  };

  const { icon: Icon, className } = config[type as keyof typeof config];

  return (
    <div className="w-8 h-8 border border-border bg-background flex items-center justify-center flex-shrink-0">
      <Icon className={`w-4 h-4 ${className}`} />
    </div>
  );
}
