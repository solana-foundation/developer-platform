'use client';

import * as React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiEndpointCard } from '@/components/docs/api-endpoint-card';
import {
  API_ENDPOINTS,
  getEndpointsByCategory,
  type ApiEndpoint,
} from '@/lib/data/api-endpoints';
import { listApiKeys } from '@/lib/api/api-keys';
import type { ApiKey } from '@/lib/types/api-keys';
import { toast } from 'sonner';

export default function ApiDocsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = React.useState(true);

  // Read state from URL
  const selectedCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const expandedEndpointId = searchParams.get('endpoint') || null;

  const endpointsByCategory = getEndpointsByCategory();
  const categories = ['all', ...Object.keys(endpointsByCategory)];

  // Helper function to update URL params
  const updateURLParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Update category
  const handleCategoryChange = (category: string) => {
    updateURLParams({ category: category === 'all' ? null : category });
  };

  // Update search (debounced)
  const handleSearchChange = React.useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateURLParams({ search: value || null });
      }, 300);
    };
  }, [updateURLParams]);

  // Update expanded endpoint
  const handleEndpointToggle = (endpointId: string | null) => {
    const params: Record<string, string | null> = { endpoint: endpointId };

    // Clear endpoint-specific params when collapsing
    if (endpointId === null) {
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.forEach((_, key) => {
        if (key !== 'category' && key !== 'search' && key !== 'endpoint') {
          params[key] = null;
        }
      });
    }

    updateURLParams(params);
  };

  // Load API keys
  React.useEffect(() => {
    const loadApiKeys = async () => {
      if (!session?.accessToken) {
        setIsLoadingKeys(false);
        return;
      }

      try {
        const keys = await listApiKeys(session.accessToken);
        setApiKeys(keys);
      } catch (error: any) {
        console.error('Error loading API keys:', error);
        if (error?.statusCode === 401) {
          toast.error('Session expired. Signing you out...');
          await signOut({ redirect: true, callbackUrl: '/' });
        } else {
          toast.error('Failed to load API keys');
        }
      } finally {
        setIsLoadingKeys(false);
      }
    };

    loadApiKeys();
  }, [session?.accessToken]);

  // Filter endpoints by search query and category
  const filteredEndpoints = React.useMemo(() => {
    let endpoints = API_ENDPOINTS;

    if (selectedCategory !== 'all') {
      endpoints = endpoints.filter((e) => e.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      endpoints = endpoints.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.path.toLowerCase().includes(query),
      );
    }

    return endpoints;
  }, [searchQuery, selectedCategory]);

  // Group filtered endpoints by category
  const filteredByCategory = React.useMemo(() => {
    return filteredEndpoints.reduce(
      (acc, endpoint) => {
        if (!acc[endpoint.category]) {
          acc[endpoint.category] = [];
        }
        acc[endpoint.category].push(endpoint);
        return acc;
      },
      {} as Record<string, ApiEndpoint[]>,
    );
  }, [filteredEndpoints]);

  const selectedApiKey = apiKeys.length > 0 ? apiKeys[0].keyPreview : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-mono tracking-tight">
          API Documentation
        </h1>
        <p className="text-muted-foreground mt-2">
          Complete reference for all API endpoints with interactive testing
        </p>
      </div>

      {/* API Keys Status */}
      {isLoadingKeys ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Loading API keys...
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            No API keys found. Create an API key to test endpoints
            interactively.
          </p>
        </div>
      ) : (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <p className="text-sm">
            <span className="font-semibold">{apiKeys.length}</span> API key
            {apiKeys.length !== 1 ? 's' : ''} available for testing
          </p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            placeholder="Search endpoints..."
            defaultValue={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
        <TabsList>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
              {category !== 'all' && (
                <Badge variant="secondary" className="ml-2">
                  {endpointsByCategory[category]?.length || 0}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-8 mt-6">
          {Object.keys(filteredByCategory).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No endpoints found matching your search
            </div>
          ) : (
            Object.entries(filteredByCategory).map(([category, endpoints]) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold font-mono">{category}</h2>
                  <Badge>{endpoints.length}</Badge>
                </div>

                <div className="space-y-4">
                  {endpoints.map((endpoint) => (
                    <ApiEndpointCard
                      key={endpoint.id}
                      endpoint={endpoint}
                      apiKey={selectedApiKey}
                      apiKeys={apiKeys}
                      isExpanded={expandedEndpointId === endpoint.id}
                      onExpandChange={(expanded) =>
                        handleEndpointToggle(expanded ? endpoint.id : null)
                      }
                      urlParams={searchParams}
                      onParamsChange={updateURLParams}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
