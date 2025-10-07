'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/common/copy-button';
import { createApiKey } from '@/lib/api/api-keys';

const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
});

type CreateApiKeyFormData = z.infer<typeof createApiKeySchema>;

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  accessToken: string;
}

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onSuccess,
  accessToken,
}: CreateApiKeyDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [createdKey, setCreatedKey] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateApiKeyFormData>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: '',
    },
  });

  const handleClose = () => {
    setCreatedKey(null);
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: CreateApiKeyFormData) => {
    setIsLoading(true);

    try {
      const apiKey = await createApiKey(data.name, accessToken);
      setCreatedKey(apiKey);
      toast.success('API key created successfully');
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create API key',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {!createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for programmatic access. You can use this
                key to authenticate API requests.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key-name">Name</Label>
                <Input
                  id="api-key-name"
                  placeholder="e.g., Production API Key"
                  {...register('name')}
                  aria-invalid={!!errors.name}
                  autoComplete="off"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create API Key'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Make sure to copy your API key now. You won&apos;t be able to
                see it again!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-4">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono break-all">
                    {createdKey}
                  </code>
                  <CopyButton value={createdKey} size="sm" variant="outline" />
                </div>
              </div>
              <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  <strong>Warning:</strong> Store this key securely. It provides
                  full access to your account via the API.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
