import type {
  Program,
  CreateProgramRequest,
  ProgramStats,
  AppendLogRequest,
  ClaimProgramRequest,
} from '@/lib/types/program';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ProgramError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ProgramError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new ProgramError(
      data.message || 'An error occurred',
      response.status,
    );
  }

  return data as T;
}

export async function fetchPrograms(
  accessToken: string,
  limit: number = 50,
  offset: number = 0,
): Promise<Program[]> {
  const response = await fetch(
    `${API_URL}/programs?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse<Program[]>(response);
}

export async function fetchProgramById(
  id: string,
  accessToken: string,
): Promise<Program> {
  const response = await fetch(`${API_URL}/programs/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return handleResponse<Program>(response);
}

export async function fetchProgramByAddress(
  programAddress: string,
  accessToken: string,
): Promise<Program> {
  const response = await fetch(
    `${API_URL}/programs/address/${programAddress}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return handleResponse<Program>(response);
}

export async function fetchProgramStats(
  accessToken: string,
): Promise<ProgramStats> {
  const response = await fetch(`${API_URL}/programs/stats`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return handleResponse<ProgramStats>(response);
}

export async function createProgram(
  data: CreateProgramRequest,
  accessToken: string,
): Promise<Program> {
  const response = await fetch(`${API_URL}/programs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<Program>(response);
}

export async function appendProgramLog(
  id: string,
  data: AppendLogRequest,
  accessToken: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/programs/${id}/logs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<{ message: string }>(response);
}

export async function claimProgram(
  id: string,
  data: ClaimProgramRequest,
  accessToken: string,
): Promise<Program> {
  const response = await fetch(`${API_URL}/programs/${id}/claim`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<Program>(response);
}

export async function updateProgramStatus(
  id: string,
  status: string,
  accessToken: string,
  deployedAt?: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/programs/${id}/status`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, deployedAt }),
  });

  return handleResponse<{ message: string }>(response);
}

export { ProgramError };
