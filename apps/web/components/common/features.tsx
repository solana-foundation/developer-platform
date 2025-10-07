export function Features() {
  return (
    <section>
      <div className="grid md:grid-cols-2">
        {/* Feature 1 */}
        <div className="border-r border-b border-border p-12 md:p-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-4 h-4 bg-primary" />
              <span>Development</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Streamline your workflow.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Helper tools for common Anchor development tasks. Simplify wallet
              authentication, program testing, and devnet deployments without
              replacing your existing setup.
            </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="border-b border-border p-12 md:p-16 bg-card">
          <div className="space-y-6">
            <div className="font-mono text-sm text-muted-foreground">
              <div className="mb-2">$ anchor deploy</div>
              <div className="text-success">
                ✓ Program deployed successfully
              </div>
              <div className="text-muted-foreground mt-4">
                Program ID: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="border-r border-b md:border-b-0 border-border p-12 md:p-16 bg-card">
          <div className="space-y-6">
            <div className="font-mono text-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span className="text-foreground">anchor build</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span className="text-foreground">anchor test</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                <span className="text-muted-foreground">anchor deploy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 4 */}
        <div className="p-12 md:p-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-4 h-4 bg-success" />
              <span>Open Source</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Built for the community.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Free and open-source TypeScript utilities for wallet connections,
              program interactions, and testing. Maintained by the Solana
              Foundation with community contributions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
