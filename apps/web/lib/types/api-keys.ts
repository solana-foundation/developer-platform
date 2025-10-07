export interface ApiKey {
  id: string;
  keyPreview: string;
  name: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  totalRequests: number;
}

export interface ApiKeyUsage {
  totalRequests: number;
  lastUsed: string | null;
  requestsByEndpoint: Record<string, number>;
}

export interface CreateApiKeyRequest {
  name: string;
}

export interface CreateApiKeyResponse {
  token: string;
}

export interface ListApiKeysResponse {
  apiKeys: ApiKey[];
}

export interface GetApiKeyUsageResponse {
  usage: ApiKeyUsage;
}
