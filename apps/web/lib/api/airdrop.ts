import type {
  CreateAirdropRequest,
  AirdropResponse,
  AirdropHistoryResponse,
} from '@/lib/types/airdrop';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class AirdropError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'AirdropError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new AirdropError(
      data.message || 'An error occurred',
      response.status,
    );
  }

  return data as T;
}

export async function requestAirdrop(
  address: string,
  amount: number,
  accessToken: string,
): Promise<AirdropResponse> {
  const response = await fetch(`${API_URL}/airdrop`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address, amount } as CreateAirdropRequest),
  });

  return handleResponse<AirdropResponse>(response);
}

export async function fetchAirdropHistory(
  accessToken: string,
  limit: number = 10,
  offset: number = 0,
): Promise<AirdropHistoryResponse> {
  const response = await fetch(
    `${API_URL}/airdrop/history?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse<AirdropHistoryResponse>(response);
}

export { AirdropError };
