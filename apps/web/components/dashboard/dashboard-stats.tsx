export function DashboardStats() {
  const stats = [
    {
      metric: '12',
      label: 'active programs',
    },
    {
      metric: '48',
      label: 'total deployments',
    },
    {
      metric: '99.9%',
      label: 'success rate',
    },
    {
      metric: '2.4s',
      label: 'avg. deploy time',
    },
  ];

  return (
    <section className="border border-border bg-card">
      <div className="grid md:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`p-8 ${
              index !== stats.length - 1 ? 'border-r border-border' : ''
            }`}
          >
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-foreground">
                {stat.metric}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
