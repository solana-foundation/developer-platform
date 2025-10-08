'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Droplet, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { requestAirdrop, fetchAirdropHistory } from '@/lib/api/airdrop';
import type { AirdropHistoryItem } from '@/lib/types/airdrop';

interface DevnetFaucetProps {
  accessToken: string;
}

export function DevnetFaucet({ accessToken }: DevnetFaucetProps) {
  const [walletAddress, setWalletAddress] = React.useState('');
  const [amount, setAmount] = React.useState('2');
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [lastRequest, setLastRequest] = React.useState<{
    amount: string;
    signature: string;
    timestamp: string;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [copiedAddress, setCopiedAddress] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<AirdropHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);

  // Fetch history on mount and when accessToken changes
  React.useEffect(() => {
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetchAirdropHistory(accessToken, 10, 0);
        setHistory(response.airdrops);
      } catch (error) {
        console.error('Failed to fetch airdrop history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (accessToken) {
      loadHistory();
    }
  }, [accessToken]);

  const handleRequest = async () => {
    if (!walletAddress) {
      toast.error('Please enter a wallet address');
      return;
    }

    setIsRequesting(true);

    // Create optimistic history item
    const optimisticItem: AirdropHistoryItem = {
      id: `temp-${Date.now()}`,
      signature: 'pending...',
      recipient: walletAddress,
      amount: amount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      explorerUrl: '',
    };

    // Optimistically update history
    setHistory((prev) => [optimisticItem, ...prev]);

    try {
      const response = await requestAirdrop(
        walletAddress,
        parseFloat(amount),
        accessToken,
      );
      setLastRequest({
        amount,
        signature: response.signature,
        timestamp: new Date().toLocaleString(),
      });

      // Update optimistic item with real data
      setHistory((prev) =>
        prev.map((item) =>
          item.id === optimisticItem.id
            ? {
                ...item,
                signature: response.signature,
                status: 'confirmed',
                explorerUrl: `https://solscan.io/tx/${response.signature}?cluster=devnet`,
              }
            : item,
        ),
      );

      toast.success(`Successfully airdropped ${amount} SOL!`);
      setWalletAddress('');
    } catch (error) {
      // Remove optimistic item on failure
      setHistory((prev) =>
        prev.filter((item) => item.id !== optimisticItem.id),
      );
      toast.error(
        error instanceof Error ? error.message : 'Failed to process airdrop',
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const copySignature = () => {
    if (lastRequest) {
      navigator.clipboard.writeText(lastRequest.signature);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyAddress = (itemId: string, address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(itemId);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <section className="border border-border bg-card">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Droplet className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold font-mono text-foreground">
            Devnet Faucet
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Request test SOL for development
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <Label htmlFor="wallet" className="block text-sm font-mono mb-2">
            Wallet Address
          </Label>
          <div className="flex gap-2">
            <Input
              id="wallet"
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter your Solana wallet address"
              className="flex-1 font-mono text-sm"
            />
            <Input
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-24 font-mono text-sm"
            />
            <Button
              onClick={handleRequest}
              disabled={!walletAddress || isRequesting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono"
            >
              {isRequesting ? 'Requesting...' : 'Request SOL'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            Rate limit: 1 request per hour per wallet
          </p>
        </div>

        {lastRequest && (
          <div className="border border-success/30 bg-success/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold font-mono text-foreground">
                Last Request
              </h3>
              <div className="px-2 py-1 bg-success/20 text-success border border-success/30 text-xs font-mono">
                Success
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Amount</span>
                <span className="text-sm font-mono font-bold text-success">
                  {lastRequest.amount} SOL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Time</span>
                <span className="text-sm font-mono text-foreground">
                  {lastRequest.timestamp}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">
                  Transaction Signature
                </span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-foreground bg-background px-2 py-1 border border-border overflow-hidden text-ellipsis">
                    {lastRequest.signature}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copySignature}
                    className="h-7 w-7 p-0"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Airdrop History Section */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-bold font-mono mb-4">Airdrop History</h3>
          {isLoadingHistory ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No airdrops yet
            </div>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="border border-border bg-card p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono font-bold text-foreground">
                          {item.amount} SOL
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-mono border ${
                            item.status === 'confirmed'
                              ? 'bg-success/20 text-success border-success/30'
                              : item.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                                : 'bg-destructive/20 text-destructive border-destructive/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-xs text-muted-foreground truncate">
                          To: {item.recipient}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyAddress(item.id, item.recipient)}
                          className="h-5 w-5 p-0 flex-shrink-0"
                        >
                          {copiedAddress === item.id ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {item.explorerUrl && (
                      <a
                        href={item.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline font-mono"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
