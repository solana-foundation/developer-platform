'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ApiKeyList } from '@/components/dashboard/api-key-list';
import { CreateApiKeyDialog } from '@/components/dashboard/create-api-key-dialog';
import { listApiKeys } from '@/lib/api/api-keys';
import type { ApiKey } from '@/lib/types/api-keys';

export default function ApiKeysPage() {
  const { data: session } = useSession();
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

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

  if (!session?.accessToken) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground mt-2">
            Manage your API keys for programmatic access
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon className="size-4" />
          Create API Key
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-8" />
        </div>
      ) : (
        <ApiKeyList
          apiKeys={apiKeys}
          onRefresh={loadApiKeys}
          accessToken={session.accessToken}
        />
      )}

      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
        accessToken={session.accessToken}
      />
    </div>
  );
}
