'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/login-modal';

export function Header() {
  const { data: session } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  const handleOpenLogin = () => {
    setAuthView('login');
    setIsAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthView('register');
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
  };

  return (
    <>
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
            {session ? (
              <>
                <span className="text-sm text-muted-foreground hidden md:block">
                  {session.user.email}
                </span>
                <Button
                  variant="ghost"
                  className="text-foreground"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-foreground"
                  onClick={handleOpenLogin}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-foreground text-background hover:bg-foreground/90"
                  onClick={handleOpenRegister}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        defaultView={authView}
      />
    </>
  );
}
