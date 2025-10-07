'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { revokeApiKey } from '@/lib/api/api-keys';

interface RevokeApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  accessToken: string;
  keyId: string;
  keyName: string;
}

export function RevokeApiKeyDialog({
  open,
  onOpenChange,
  onSuccess,
  accessToken,
  keyId,
  keyName,
}: RevokeApiKeyDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRevoke = async () => {
    setIsLoading(true);

    try {
      await revokeApiKey(keyId, accessToken);
      toast.success('API key revoked successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to revoke API key',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke the API key &quot;{keyName}&quot;?
            This action cannot be undone. Any applications using this key will
            immediately lose access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Revoking...' : 'Revoke'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
