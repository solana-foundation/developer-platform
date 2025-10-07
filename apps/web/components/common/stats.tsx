export function Stats() {
  const stats = [
    {
      metric: '100%',
      label: 'open source.',
      company: 'MIT LICENSE',
    },
    {
      metric: '5min',
      label: 'to first deployment.',
      company: 'QUICKSTART',
    },
    {
      metric: 'Built by',
      label: 'Solana Foundation.',
      company: 'NON-PROFIT',
    },
    {
      metric: 'Free',
      label: 'for all developers.',
      company: 'COMMUNITY',
    },
  ];

  return (
    <section className="border-b border-border">
      <div className="grid md:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`p-8 md:p-12 ${index !== stats.length - 1 ? 'border-r border-border' : ''}`}
          >
            <div className="space-y-4">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                  {stat.metric}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
              <div className="font-mono text-sm font-bold text-foreground">
                {stat.company}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
