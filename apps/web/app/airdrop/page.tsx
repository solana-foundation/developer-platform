'use client';

import { PageContainer } from '@/components/common/page-container';
import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { AirdropForm, AirdropHistory } from '@/components/features/airdrop';

export default function AirdropPage() {
  const handleAirdrop = async (address: string, amount: number) => {
    // TODO: Connect to API endpoint
    console.log('Requesting airdrop:', { address, amount });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock response
    return {
      signature:
        '5j7s8t9u0v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z',
      slot: 123456789,
    };
  };

  return (
    <PageContainer spacing="loose">
      <SectionHeader
        title="SOL Airdrop"
        description="Request devnet SOL for testing your Solana applications"
        level={1}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Network"
          value="Devnet"
          description="Test network for development"
        />
        <StatCard
          title="Max Amount"
          value="10 SOL"
          description="Per request limit"
        />
        <StatCard
          title="Status"
          value="Active"
          description="Service operational"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <AirdropForm onSubmit={handleAirdrop} />
        </div>
        <div>
          <AirdropHistory
            transactions={[
              {
                signature: '5j7s8t9u0v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5k',
                address: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
                amount: 2.5,
                timestamp: new Date(Date.now() - 3600000),
                status: 'success',
              },
              {
                signature: '7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d',
                address: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
                amount: 1.0,
                timestamp: new Date(Date.now() - 7200000),
                status: 'success',
              },
            ]}
          />
        </div>
      </div>
    </PageContainer>
  );
}
