'use client';

import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { Rocket, Server } from 'lucide-react';
import { fetchPrograms } from '@/lib/api/programs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export function ActivityFeed() {
  const { data: session } = useSession();
  const { data: programs, isLoading } = useSWR(
    session?.accessToken ? ['programs-activity', session.accessToken] : null,
    ([_, token]) => fetchPrograms(token as string, 10, 0),
    { refreshInterval: 15000 },
  );

  // Convert programs to activity format
  const activities =
    programs?.map((program) => ({
      id: program.id,
      type:
        program.status === 'deployed' || program.status === 'claimed'
          ? 'deploy'
          : 'program',
      message: `${program.status === 'deployed' ? 'Deployed' : program.status === 'claimed' ? 'Claimed' : 'Created'} ${program.name} on ${program.cluster}`,
      time: formatDistanceToNow(new Date(program.createdAt), {
        addSuffix: true,
      }),
    })) || [];

  return (
    <section className="border border-border bg-card sticky top-6">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold font-mono text-foreground">
          Recent Activity
        </h2>
      </div>

      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {isLoading && (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4">
                <div className="flex gap-3">
                  <Skeleton className="w-8 h-8 flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {!isLoading && activities.length === 0 && (
          <div className="p-8 text-center">
            <Server className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        )}

        {!isLoading &&
          activities.map((activity) => (
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
    program: { icon: Server, className: 'text-foreground' },
  };

  const { icon: Icon, className } =
    config[type as keyof typeof config] || config.program;

  return (
    <div className="w-8 h-8 border border-border bg-background flex items-center justify-center flex-shrink-0">
      <Icon className={`w-4 h-4 ${className}`} />
    </div>
  );
}
