'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { MoreVerticalIcon, Trash2Icon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/common/copy-button';
import { RevokeApiKeyDialog } from './revoke-api-key-dialog';
import type { ApiKey } from '@/lib/types/api-keys';

interface ApiKeyListProps {
  apiKeys: ApiKey[];
  onRefresh: () => void;
  accessToken: string;
}

export function ApiKeyList({
  apiKeys,
  onRefresh,
  accessToken,
}: ApiKeyListProps) {
  const [revokeDialog, setRevokeDialog] = React.useState<{
    open: boolean;
    keyId: string;
    keyName: string;
  }>({
    open: false,
    keyId: '',
    keyName: '',
  });

  const handleRevokeClick = (keyId: string, keyName: string) => {
    setRevokeDialog({
      open: true,
      keyId,
      keyName,
    });
  };

  const handleRevokeSuccess = () => {
    onRefresh();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (apiKeys.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No API keys yet. Create your first API key to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Requests</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell className="font-medium">{apiKey.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-muted-foreground">
                      {apiKey.keyPreview}
                    </code>
                    <CopyButton value={apiKey.id} size="icon" />
                  </div>
                </TableCell>
                <TableCell>
                  {isExpired(apiKey.expiresAt) ? (
                    <Badge variant="destructive">Expired</Badge>
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(apiKey.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {apiKey.lastUsedAt
                    ? format(new Date(apiKey.lastUsedAt), 'MMM d, yyyy')
                    : 'Never'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {apiKey.totalRequests.toLocaleString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVerticalIcon className="size-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() =>
                          handleRevokeClick(apiKey.id, apiKey.name)
                        }
                      >
                        <Trash2Icon className="size-4" />
                        Revoke
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RevokeApiKeyDialog
        open={revokeDialog.open}
        onOpenChange={(open) => setRevokeDialog({ ...revokeDialog, open })}
        onSuccess={handleRevokeSuccess}
        accessToken={accessToken}
        keyId={revokeDialog.keyId}
        keyName={revokeDialog.keyName}
      />
    </>
  );
}
