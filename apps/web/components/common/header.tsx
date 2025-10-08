'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/login-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserIcon, LogOutIcon } from 'lucide-react';

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
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <>
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-foreground">
                SOLANA
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {session && (
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              )}
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
                Support
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <UserIcon className="size-4" />
                      <span className="hidden md:inline">
                        {session.user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/settings"
                        className="cursor-pointer"
                      >
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOutIcon className="size-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
