'use client';

import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { fetchProgramStats } from '@/lib/api/programs';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardStats() {
  const { data: session } = useSession();
  const { data: stats, isLoading } = useSWR(
    session?.accessToken ? ['program-stats', session.accessToken] : null,
    ([_, token]) => fetchProgramStats(token as string),
    { refreshInterval: 30000 }, // Refresh every 30 seconds
  );

  const totalPrograms = stats?.totalPrograms || 0;
  const deployed = stats?.byStatus?.deployed || 0;
  const claimed = stats?.byStatus?.claimed || 0;
  const pending = stats?.byStatus?.pending || 0;

  const displayStats = [
    {
      metric: totalPrograms.toString(),
      label: 'total programs',
      loading: isLoading,
    },
    {
      metric: deployed.toString(),
      label: 'deployed',
      loading: isLoading,
    },
    {
      metric: claimed.toString(),
      label: 'claimed',
      loading: isLoading,
    },
    {
      metric: pending.toString(),
      label: 'pending',
      loading: isLoading,
    },
  ];

  return (
    <section className="border border-border bg-card">
      <div className="grid md:grid-cols-4">
        {displayStats.map((stat, index) => (
          <div
            key={index}
            className={`p-8 ${
              index !== displayStats.length - 1 ? 'border-r border-border' : ''
            }`}
          >
            <div className="space-y-2">
              {stat.loading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <div className="text-3xl md:text-4xl font-bold text-foreground">
                  {stat.metric}
                </div>
              )}
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
