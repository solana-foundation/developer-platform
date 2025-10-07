import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="border-b border-border">
      <div className="container mx-auto px-6 py-32 md:py-48">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight text-balance mb-8">
              Essential tools for Solana developers.
            </h1>
          </div>
          <div className="space-y-8">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Open-source developer tools from the Solana Foundation. Simplified
              authentication, testing utilities, and deployment helpers for
              Anchor programs.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-foreground text-foreground hover:bg-foreground hover:text-background bg-transparent"
              >
                View on GitHub
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
