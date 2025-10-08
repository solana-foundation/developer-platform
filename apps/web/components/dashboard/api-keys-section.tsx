'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Key, Copy, Check, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { ApiKey } from '@/lib/types/api-keys';
import { format } from 'date-fns';

interface ApiKeysSectionProps {
  apiKeys: ApiKey[];
  onCreateNew: () => void;
  onRevoke: (keyId: string, keyName: string) => void;
}

export function ApiKeysSection({
  apiKeys,
  onCreateNew,
  onRevoke,
}: ApiKeysSectionProps) {
  const [visibleKeys, setVisibleKeys] = React.useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => {
    return key.slice(0, 12) + '•'.repeat(20) + key.slice(-4);
  };

  if (apiKeys.length === 0) {
    return (
      <section className="border border-border bg-card">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-xl font-bold font-mono text-foreground">
                  API Keys
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your API keys for programmatic access
                </p>
              </div>
            </div>
            <Button
              onClick={onCreateNew}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono"
            >
              Generate New Key
            </Button>
          </div>
        </div>
        <div className="p-12 text-center">
          <p className="text-muted-foreground">
            No API keys yet. Create your first API key to get started.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border border-border bg-card">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-xl font-bold font-mono text-foreground">
                API Keys
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your API keys for programmatic access
              </p>
            </div>
          </div>
          <Button
            onClick={onCreateNew}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono"
          >
            Generate New Key
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {apiKeys.map((apiKey) => (
          <div
            key={apiKey.id}
            className="p-6 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold font-mono text-foreground mb-1">
                  {apiKey.name}
                </h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Created {format(new Date(apiKey.createdAt), 'MMM d, yyyy')}
                  </span>
                  <span>•</span>
                  <span>
                    Last used{' '}
                    {apiKey.lastUsedAt
                      ? format(new Date(apiKey.lastUsedAt), 'MMM d, yyyy')
                      : 'Never'}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRevoke(apiKey.id, apiKey.name)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2 bg-background border border-border text-foreground font-mono text-sm overflow-hidden text-ellipsis">
                {visibleKeys.has(apiKey.id)
                  ? apiKey.id
                  : maskKey(apiKey.keyPreview)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleKeyVisibility(apiKey.id)}
                className="h-9 w-9 p-0"
              >
                {visibleKeys.has(apiKey.id) ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyKey(apiKey.id, apiKey.id)}
                className="h-9 w-9 p-0"
              >
                {copiedKey === apiKey.id ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-border bg-muted/30">
        <div className="flex items-start gap-3">
          <div className="w-1 h-full bg-primary mt-1" />
          <div>
            <h3 className="text-sm font-bold font-mono text-foreground mb-1">
              Security Notice
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Keep your API keys secure and never share them publicly. If you
              believe a key has been compromised, delete it immediately and
              generate a new one.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
