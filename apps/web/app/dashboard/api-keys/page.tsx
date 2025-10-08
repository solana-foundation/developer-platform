'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { ApiKeysSection } from '@/components/dashboard/api-keys-section';
import { CreateApiKeyDialog } from '@/components/dashboard/create-api-key-dialog';
import { RevokeApiKeyDialog } from '@/components/dashboard/revoke-api-key-dialog';
import { listApiKeys } from '@/lib/api/api-keys';
import type { ApiKey } from '@/lib/types/api-keys';

export default function ApiKeysPage() {
  const { data: session } = useSession();
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [revokeDialog, setRevokeDialog] = React.useState<{
    open: boolean;
    keyId: string;
    keyName: string;
  }>({
    open: false,
    keyId: '',
    keyName: '',
  });

  const loadApiKeys = React.useCallback(async () => {
    if (!session?.accessToken) return;

    setIsLoading(true);
    try {
      const keys = await listApiKeys(session.accessToken);
      setApiKeys(keys);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load API keys',
      );
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  React.useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const handleCreateSuccess = () => {
    loadApiKeys();
  };

  const handleRevokeClick = (keyId: string, keyName: string) => {
    setRevokeDialog({
      open: true,
      keyId,
      keyName,
    });
  };

  const handleRevokeSuccess = () => {
    loadApiKeys();
  };

  if (!session?.accessToken) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono tracking-tight">
          API Keys
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your API keys for programmatic access
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-8" />
        </div>
      ) : (
        <ApiKeysSection
          apiKeys={apiKeys}
          onCreateNew={() => setCreateDialogOpen(true)}
          onRevoke={handleRevokeClick}
        />
      )}

      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
        accessToken={session.accessToken}
      />

      <RevokeApiKeyDialog
        open={revokeDialog.open}
        onOpenChange={(open) => setRevokeDialog({ ...revokeDialog, open })}
        onSuccess={handleRevokeSuccess}
        accessToken={session.accessToken}
        keyId={revokeDialog.keyId}
        keyName={revokeDialog.keyName}
      />
    </div>
  );
}
