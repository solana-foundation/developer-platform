import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  ApiError,
} from '@/lib/types/auth';
import { API_BASE_URL } from '@/lib/config/env';

const API_URL = API_BASE_URL;

class AuthApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public error?: string,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const error = data as ApiError;
    throw new AuthApiError(
      error.message || 'An error occurred',
      response.status,
      error.error,
    );
  }

  return data as T;
}

export async function registerUser(
  credentials: RegisterRequest,
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  return handleResponse<AuthResponse>(response);
}

export async function loginUser(
  credentials: LoginRequest,
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  return handleResponse<AuthResponse>(response);
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  return handleResponse<AuthResponse>(response);
}

export { AuthApiError };
