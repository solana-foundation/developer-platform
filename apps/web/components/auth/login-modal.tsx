'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

type AuthView = 'login' | 'register';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: AuthView;
}

export function AuthModal({
  open,
  onOpenChange,
  defaultView = 'login',
}: AuthModalProps) {
  const [view, setView] = React.useState<AuthView>(defaultView);

  React.useEffect(() => {
    if (open) {
      setView(defaultView);
    }
  }, [open, defaultView]);

  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {view === 'login' ? 'Sign In' : 'Create Account'}
          </DialogTitle>
          <DialogDescription>
            {view === 'login'
              ? 'Enter your credentials to access your account'
              : 'Sign up to get started with Solana developer tools'}
          </DialogDescription>
        </DialogHeader>
        {view === 'login' ? (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={() => setView('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setView('login')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Keep backward compatibility
export { AuthModal as LoginModal };
