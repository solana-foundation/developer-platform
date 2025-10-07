import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-foreground">
              SOLANA
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Templates
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Enterprise
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-foreground">
            Sign In
          </Button>
          <Button className="bg-foreground text-background hover:bg-foreground/90">
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}
