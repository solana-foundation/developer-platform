import type {
  ApiKey,
  ApiKeyUsage,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ListApiKeysResponse,
  GetApiKeyUsageResponse,
} from '@/lib/types/api-keys';
import { API_BASE_URL } from '@/lib/config/env';

const API_URL = API_BASE_URL;

class ApiKeyError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new ApiKeyError(data.message || 'An error occurred', response.status);
  }

  return data as T;
}

export async function listApiKeys(accessToken: string): Promise<ApiKey[]> {
  const response = await fetch(`${API_URL}/auth/api-keys`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<ListApiKeysResponse>(response);
  return data.apiKeys;
}

export async function createApiKey(
  name: string,
  accessToken: string,
): Promise<string> {
  const response = await fetch(`${API_URL}/auth/api-keys`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name } as CreateApiKeyRequest),
  });

  const data = await handleResponse<CreateApiKeyResponse>(response);
  return data.token;
}

export async function getApiKeyUsage(
  keyId: string,
  accessToken: string,
): Promise<ApiKeyUsage> {
  const response = await fetch(`${API_URL}/auth/api-keys/${keyId}/usage`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<GetApiKeyUsageResponse>(response);
  return data.usage;
}

export async function revokeApiKey(
  keyId: string,
  accessToken: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/auth/api-keys/${keyId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new ApiKeyError(
      data.message || 'Failed to revoke API key',
      response.status,
    );
  }
}

export { ApiKeyError };
