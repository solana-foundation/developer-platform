'use client';

import { useSession } from 'next-auth/react';
import { DevnetFaucet } from '@/components/dashboard/devnet-faucet';

export default function AirdropPage() {
  const { data: session } = useSession();

  if (!session?.accessToken) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono tracking-tight">
          Devnet Airdrop
        </h1>
        <p className="text-muted-foreground mt-2">
          Request test SOL for Solana devnet development
        </p>
      </div>

      <DevnetFaucet accessToken={session.accessToken} />
    </div>
  );
}
