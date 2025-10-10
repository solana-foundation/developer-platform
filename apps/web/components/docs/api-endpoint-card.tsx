'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { ChevronDown, Lock, PlayIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CopyButton } from '@/components/common/copy-button';
import { CodeSnippetTabs } from './code-snippet-tabs';
import type { ApiEndpoint } from '@/lib/data/api-endpoints';
import { getApiBaseUrl } from '@/lib/data/api-endpoints';
import type { ApiKey } from '@/lib/types/api-keys';

interface ApiEndpointCardProps {
  endpoint: ApiEndpoint;
  apiKey?: string;
  apiKeys?: ApiKey[];
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  urlParams?: URLSearchParams;
  onParamsChange?: (updates: Record<string, string | null>) => void;
  onTestClick?: () => void;
}

const METHOD_COLORS = {
  GET: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  POST: 'bg-green-500/20 text-green-600 border-green-500/30',
  PUT: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  DELETE: 'bg-red-500/20 text-red-600 border-red-500/30',
};

export function ApiEndpointCard({
  endpoint,
  apiKey,
  apiKeys,
  isExpanded = false,
  onExpandChange,
  urlParams,
  onParamsChange,
  onTestClick,
}: ApiEndpointCardProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = React.useState(false);
  const [response, setResponse] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const baseUrl = getApiBaseUrl();

  const defaultParams = endpoint.parameters.reduce(
    (acc, param) => {
      acc[param.name] = param.example || '';
      return acc;
    },
    {} as Record<string, any>,
  );

  if (endpoint.requestBody) {
    Object.entries(endpoint.requestBody.properties).forEach(([key, prop]) => {
      defaultParams[key] = prop.example || '';
    });
  }

  // Initialize params from URL or default values
  const params = React.useMemo(() => {
    const paramValues: Record<string, any> = {};

    endpoint.parameters.forEach((param) => {
      paramValues[param.name] =
        urlParams?.get(param.name) || param.example || '';
    });

    if (endpoint.requestBody) {
      Object.entries(endpoint.requestBody.properties).forEach(([key, prop]) => {
        paramValues[key] = urlParams?.get(key) || prop.example || '';
      });
    }

    return paramValues;
  }, [endpoint, urlParams]);

  // Helper to update a param value
  const updateParam = (key: string, value: string) => {
    if (onParamsChange) {
      onParamsChange({ [key]: value || null });
    }
  };

  const handleTest = async () => {
    if (!session?.accessToken) {
      toast.error('Please sign in to test endpoints');
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
          Authorization: `Bearer ${session.accessToken}`,
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

      // Handle different response statuses
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          errorData = { message: res.statusText };
        }

        const errorMessage =
          errorData.message || `HTTP ${res.status}: ${res.statusText}`;
        setError(errorMessage);

        // Specific error messages for different status codes
        if (res.status === 401) {
          toast.error('Session expired or invalid. Please sign in again.');
        } else if (res.status === 400) {
          toast.error(`Validation error: ${errorMessage}`);
        } else if (res.status === 404) {
          toast.error('Endpoint not found');
        } else if (res.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(`Request failed: ${errorMessage}`);
        }
      } else {
        const data = await res.json();
        setResponse(data);
        toast.success('API request successful');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);

      // Check if it's a network error
      if (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError')
      ) {
        toast.error('Network error. Is the API server running?');
      } else {
        toast.error(`Request failed: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const curlCode = endpoint.generateCurl(
    apiKey || 'YOUR_API_KEY',
    defaultParams,
    baseUrl,
  );
  const tsCode = endpoint.generateTypeScript(
    apiKey || 'YOUR_API_KEY',
    defaultParams,
    baseUrl,
  );

  return (
    <Card className="overflow-hidden">
      <Collapsible
        open={isExpanded}
        onOpenChange={(open) => onExpandChange?.(open)}
      >
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onExpandChange?.(!isExpanded)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Badge
                  className={`font-mono text-xs px-2 py-1 border ${METHOD_COLORS[endpoint.method]}`}
                >
                  {endpoint.method}
                </Badge>
                <code className="text-sm font-mono text-foreground">
                  {endpoint.path}
                </code>
                {endpoint.requiresAuth && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="w-3 h-3" />
                    Auth Required
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold">{endpoint.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {endpoint.description}
              </p>
            </div>
            <CollapsibleTrigger asChild>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
              />
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Parameters */}
            {endpoint.parameters.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 font-mono">Parameters</h4>
                <div className="space-y-2">
                  {endpoint.parameters.map((param) => (
                    <div
                      key={param.name}
                      className="border border-border rounded-lg p-3 bg-muted/30"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono text-primary">
                          {param.name}
                        </code>
                        <Badge variant="outline" className="text-xs">
                          {param.type}
                        </Badge>
                        {param.required && (
                          <Badge variant="destructive" className="text-xs">
                            required
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          in: {param.in}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {param.description}
                      </p>
                      {param.example && (
                        <div className="mt-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            Example: {param.example}
                          </code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Body */}
            {endpoint.requestBody && (
              <div>
                <h4 className="font-semibold mb-3 font-mono">Request Body</h4>
                <div className="space-y-2">
                  {Object.entries(endpoint.requestBody.properties).map(
                    ([key, prop]) => (
                      <div
                        key={key}
                        className="border border-border rounded-lg p-3 bg-muted/30"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono text-primary">
                            {key}
                          </code>
                          <Badge variant="outline" className="text-xs">
                            {prop.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {prop.description}
                        </p>
                        {prop.example && (
                          <div className="mt-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              Example: {JSON.stringify(prop.example)}
                            </code>
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Response Example */}
            <div>
              <h4 className="font-semibold mb-3 font-mono">Response Example</h4>
              <div className="relative">
                <div className="absolute right-2 top-2 z-10">
                  <CopyButton
                    value={JSON.stringify(endpoint.responseExample, null, 2)}
                  />
                </div>
                <SyntaxHighlighter
                  language="json"
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {JSON.stringify(endpoint.responseExample, null, 2)}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* Code Examples */}
            <div>
              <h4 className="font-semibold mb-3 font-mono">Code Examples</h4>
              <CodeSnippetTabs curl={curlCode} typescript={tsCode} />
            </div>

            {/* Try it out section */}
            {apiKeys && apiKeys.length > 0 && (
              <div className="border-t border-border pt-6">
                <h4 className="font-semibold mb-4 font-mono">Try it out</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Test this endpoint using your authenticated session.
                </p>
                <div className="space-y-4">
                  {/* Parameters */}
                  {endpoint.parameters.map((param) => (
                    <div key={param.name}>
                      <Label htmlFor={`test-${param.name}`}>
                        {param.name}
                        {param.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                        <span className="text-muted-foreground text-xs ml-2">
                          ({param.type}, in: {param.in})
                        </span>
                      </Label>
                      <Input
                        id={`test-${param.name}`}
                        value={params[param.name] || ''}
                        onChange={(e) =>
                          updateParam(param.name, e.target.value)
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
                    Object.entries(endpoint.requestBody.properties).map(
                      ([key, prop]) => (
                        <div key={key}>
                          <Label htmlFor={`test-${key}`}>
                            {key}
                            <span className="text-muted-foreground text-xs ml-2">
                              ({prop.type})
                            </span>
                          </Label>
                          <Input
                            id={`test-${key}`}
                            value={params[key] || ''}
                            onChange={(e) => updateParam(key, e.target.value)}
                            placeholder={
                              prop.example ? String(prop.example) : ''
                            }
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {prop.description}
                          </p>
                        </div>
                      ),
                    )}

                  {/* Execute Button */}
                  <Button
                    onClick={handleTest}
                    disabled={isLoading || !session?.accessToken}
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
                    <div className="space-y-2">
                      <Label>Response</Label>
                      {response && (
                        <div className="text-xs text-muted-foreground font-mono mb-2">
                          {endpoint.method} {baseUrl}
                          {endpoint.path}
                        </div>
                      )}
                      {error ? (
                        <pre className="p-4 rounded-lg overflow-x-auto text-sm bg-destructive/10 text-destructive">
                          <code>{error}</code>
                        </pre>
                      ) : (
                        <div className="relative">
                          <div className="absolute right-2 top-2 z-10">
                            <CopyButton
                              value={JSON.stringify(response, null, 2)}
                            />
                          </div>
                          <SyntaxHighlighter
                            language="json"
                            style={oneDark}
                            customStyle={{
                              margin: 0,
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                            }}
                          >
                            {JSON.stringify(response, null, 2)}
                          </SyntaxHighlighter>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
