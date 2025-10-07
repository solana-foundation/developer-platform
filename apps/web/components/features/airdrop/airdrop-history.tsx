import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface AirdropTransaction {
  signature: string;
  address: string;
  amount: number;
  timestamp: Date;
  status: 'success' | 'failed' | 'pending';
}

interface AirdropHistoryProps {
  transactions?: AirdropTransaction[];
}

/**
 * AirdropHistory displays a list of recent airdrop transactions
 */
export function AirdropHistory({ transactions = [] }: AirdropHistoryProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recent Airdrops</CardTitle>
        <CardDescription>
          Transaction history for your airdrop requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No airdrop transactions yet
          </p>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.signature}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{tx.amount} SOL</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        tx.status === 'success'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : tx.status === 'failed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {tx.address}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tx.timestamp.toLocaleString()}
                  </p>
                </div>
                <a
                  href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline ml-4"
                >
                  View →
                </a>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
