'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { confirmCliAuth } from '@/lib/api/cli-auth';

function CliAuthVerifyContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');
  const code = searchParams.get('code');

  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (status === 'unauthenticated') {
      const callbackUrl = `/cli-auth/verify?token=${token}&code=${code}`;
      router.push(`/?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status, router, token, code]);

  const handleConfirm = async () => {
    if (!token || !session?.accessToken) {
      setError('Missing authentication information');
      return;
    }

    setIsConfirming(true);
    setError(null);

    try {
      await confirmCliAuth(token, session.accessToken);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to authenticate CLI',
      );
    } finally {
      setIsConfirming(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  if (!token || !code) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Request</CardTitle>
            <CardDescription>
              Missing authentication parameters. Please try again from your
              terminal.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-success">
              ✓ Authentication Successful!
            </CardTitle>
            <CardDescription>
              Your CLI has been authenticated successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You can now close this window and return to your terminal.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>CLI Authentication</CardTitle>
          <CardDescription>
            Confirm this code matches what&apos;s shown in your terminal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="bg-muted px-6 py-4 rounded-lg">
              <p className="text-3xl font-bold tracking-widest text-primary">
                {code}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="w-full"
              size="lg"
            >
              {isConfirming ? 'Authenticating...' : 'Confirm Authentication'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By confirming, you authorize the CLI to access your account
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CliAuthVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <CliAuthVerifyContent />
    </Suspense>
  );
}
