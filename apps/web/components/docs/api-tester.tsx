'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { PlayIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { ApiEndpoint } from '@/lib/data/api-endpoints';
import { getApiBaseUrl } from '@/lib/data/api-endpoints';
import type { ApiKey } from '@/lib/types/api-keys';

interface ApiTesterProps {
  endpoint: ApiEndpoint;
  apiKeys: ApiKey[];
}

export function ApiTester({ endpoint, apiKeys }: ApiTesterProps) {
  const [selectedKeyId, setSelectedKeyId] = React.useState<string>('');
  const [params, setParams] = React.useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [response, setResponse] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Initialize params with default values
  React.useEffect(() => {
    const initialParams: Record<string, any> = {};

    endpoint.parameters.forEach((param) => {
      initialParams[param.name] = param.example || '';
    });

    if (endpoint.requestBody) {
      Object.entries(endpoint.requestBody.properties).forEach(([key, prop]) => {
        initialParams[key] = prop.example || '';
      });
    }

    setParams(initialParams);
  }, [endpoint]);

  const selectedKey = apiKeys.find((key) => key.id === selectedKeyId);

  const handleTest = async () => {
    if (!selectedKey) {
      toast.error('Please select an API key');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const baseUrl = getApiBaseUrl();
      // Build URL with path parameters
      let url = `${baseUrl}${endpoint.path}`;
      endpoint.parameters
        .filter((p) => p.in === 'path')
        .forEach((param) => {
          url = url.replace(`:${param.name}`, params[param.name] || '');
        });

      // Add query parameters
      const queryParams = endpoint.parameters
        .filter((p) => p.in === 'query' && params[p.name])
        .map(
          (param) => `${param.name}=${encodeURIComponent(params[param.name])}`,
        )
        .join('&');

      if (queryParams) {
        url += `?${queryParams}`;
      }

      // Build request options
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          Authorization: `Bearer ${selectedKey.keyPreview}`,
          'Content-Type': 'application/json',
        },
      };

      // Add body for POST/PUT requests
      if (['POST', 'PUT'].includes(endpoint.method) && endpoint.requestBody) {
        const body: Record<string, any> = {};
        Object.keys(endpoint.requestBody.properties).forEach((key) => {
          if (params[key] !== undefined && params[key] !== '') {
            // Try to parse JSON values, otherwise use as string
            try {
              body[key] =
                typeof params[key] === 'string' && !isNaN(Number(params[key]))
                  ? Number(params[key])
                  : params[key];
            } catch {
              body[key] = params[key];
            }
          }
        });
        options.body = JSON.stringify(body);
      }

      const res = await fetch(url, options);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || `HTTP ${res.status}: ${res.statusText}`);
        toast.error('API request failed');
      } else {
        setResponse(data);
        toast.success('API request successful');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Request failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-lg">Try it out</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key Selector */}
        <div>
          <Label htmlFor="api-key">API Key</Label>
          <Select value={selectedKeyId} onValueChange={setSelectedKeyId}>
            <SelectTrigger id="api-key">
              <SelectValue placeholder="Select an API key" />
            </SelectTrigger>
            <SelectContent>
              {apiKeys.map((key) => (
                <SelectItem key={key.id} value={key.id}>
                  {key.name} ({key.keyPreview})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Parameters */}
        {endpoint.parameters.map((param) => (
          <div key={param.name}>
            <Label htmlFor={param.name}>
              {param.name}
              {param.required && (
                <span className="text-destructive ml-1">*</span>
              )}
              <span className="text-muted-foreground text-xs ml-2">
                ({param.type}, in: {param.in})
              </span>
            </Label>
            <Input
              id={param.name}
              value={params[param.name] || ''}
              onChange={(e) =>
                setParams({ ...params, [param.name]: e.target.value })
              }
              placeholder={param.example}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {param.description}
            </p>
          </div>
        ))}

        {/* Request Body Fields */}
        {endpoint.requestBody &&
          Object.entries(endpoint.requestBody.properties).map(([key, prop]) => (
            <div key={key}>
              <Label htmlFor={key}>
                {key}
                <span className="text-muted-foreground text-xs ml-2">
                  ({prop.type})
                </span>
              </Label>
              <Input
                id={key}
                value={params[key] || ''}
                onChange={(e) =>
                  setParams({ ...params, [key]: e.target.value })
                }
                placeholder={prop.example ? String(prop.example) : ''}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {prop.description}
              </p>
            </div>
          ))}

        {/* Execute Button */}
        <Button
          onClick={handleTest}
          disabled={isLoading || !selectedKey}
          className="w-full font-mono"
        >
          {isLoading ? (
            <>
              <Spinner className="size-4 mr-2" />
              Sending request...
            </>
          ) : (
            <>
              <PlayIcon className="size-4 mr-2" />
              Execute
            </>
          )}
        </Button>

        {/* Response */}
        {(response || error) && (
          <div>
            <Label>Response</Label>
            <pre
              className={`p-4 rounded-lg overflow-x-auto text-sm ${
                error
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted text-foreground'
              }`}
            >
              <code>{error || JSON.stringify(response, null, 2)}</code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
