'use client';

import { useSession } from 'next-auth/react';
import { AirdropForm } from '@/components/dashboard/airdrop-form';

export default function AirdropPage() {
  const { data: session } = useSession();

  if (!session?.accessToken) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Devnet Airdrop</h1>
        <p className="text-muted-foreground mt-2">
          Request test SOL for Solana devnet development
        </p>
      </div>

      <AirdropForm accessToken={session.accessToken} />
    </div>
  );
}
